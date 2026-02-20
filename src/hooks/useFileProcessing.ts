import React, { useState } from "react";
import { FileStatus, PatientAnalysis } from "../types";
import { getFileFromStorage } from "../services/fileStorage";
import { getPatientHistory } from "../services/patientHistory";
import { saveAnalysis } from "../services/patientHistory";
import {
  getFileEncrypted,
  getPatientHistoryEncrypted,
  saveAnalysisEncrypted,
} from "../services/encryptedStorage";
import { extractPDFText } from "../services/pdfExtractor";
import {
  analyzeBiochemistryData,
  compareTwoAnalyses,
} from "../services/biochemistryAnalyzer";
import { sortByDateDesc } from "../utils/dateUtils";
import { PATIENT_ID } from "../constants";

export interface ProcessingNotification {
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

interface UseFileProcessingReturn {
  isProcessing: boolean;
  processingFile: string | null;
  fileStatuses: Record<string, FileStatus>;
  notification: ProcessingNotification | null;
  clearNotification: () => void;
  resetStatuses: () => void;
  handleProcessPDF: (fileName: string) => Promise<void>;
  handleProcessAll: (
    fileNames: string[],
    onComplete: () => void,
  ) => Promise<void>;
  /** Nom du fichier en attente de mot de passe (null = pas de demande) */
  pendingPasswordFile: string | null;
  /** Rappel une fois le mot de passe fourni par l'utilisateur */
  retryWithPassword: (password: string) => void;
  /** Annuler la demande de mot de passe */
  cancelPasswordRequest: () => void;
}

/** Détecte si une erreur pdf.js est liée au mot de passe */
const isPasswordError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("password") ||
      msg.includes("mot de passe") ||
      msg.includes("incorrect password") ||
      msg.includes("no password given")
    );
  }
  return false;
};

export const useFileProcessing = (
  refreshAnalyses: () => void,
  pin: string | null,
  pdfPassword: string,
  onPdfPasswordSet?: (password: string) => void,
): UseFileProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>(
    {},
  );
  const [notification, setNotification] =
    useState<ProcessingNotification | null>(null);

  // ── Ref pour toujours avoir le mot de passe PDF le plus récent ─────────
  // Synchronisé immédiatement dans la phase de rendu (pas via useEffect)
  // pour éliminer tout décalage entre le state context et la valeur lue
  const pdfPasswordRef = React.useRef(pdfPassword);
  pdfPasswordRef.current = pdfPassword;

  // ── Gestion de la demande de mot de passe PDF ──────────────────────────
  const [pendingPasswordFile, setPendingPasswordFile] = useState<string | null>(
    null,
  );
  const pendingResolveRef = React.useRef<((pw: string | null) => void) | null>(
    null,
  );

  const retryWithPassword = (password: string) => {
    if (onPdfPasswordSet) onPdfPasswordSet(password);
    pdfPasswordRef.current = password; // mise à jour immédiate du ref
    if (pendingResolveRef.current) pendingResolveRef.current(password);
    pendingResolveRef.current = null;
    setPendingPasswordFile(null);
  };

  const cancelPasswordRequest = () => {
    if (pendingResolveRef.current) pendingResolveRef.current(null);
    pendingResolveRef.current = null;
    setPendingPasswordFile(null);
  };

  /** Demande le mot de passe à l'utilisateur via la dialog */
  const askForPassword = (fileName: string): Promise<string | null> =>
    new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      setPendingPasswordFile(fileName);
    });

  const clearNotification = () => setNotification(null);
  const resetStatuses = () => setFileStatuses({});

  /**
   * Traite un fichier PDF. Retourne true si l'analyse a réussi.
   * En mode silencieux (silent=true), n'émet pas de notification individuelle
   * (utilisé par handleProcessAll qui émet un résumé global).
   */
  const handleProcessPDF = async (
    fileName: string,
    silent = false,
  ): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingFile(fileName);
      setFileStatuses((prev) => ({ ...prev, [fileName]: "processing" }));

      const file = pin
        ? await getFileEncrypted(fileName, pin)
        : await getFileFromStorage(fileName);
      if (!file) {
        setFileStatuses((prev) => ({ ...prev, [fileName]: "error" }));
        if (!silent)
          setNotification({
            message: `Fichier introuvable : ${fileName}`,
            severity: "error",
          });
        return false;
      }

      // Tentative d'extraction avec le mot de passe le plus récent (via ref)
      let effectivePassword = pdfPasswordRef.current;
      let pdfData;
      try {
        pdfData = await extractPDFText(file, effectivePassword);
      } catch (extractError) {
        if (isPasswordError(extractError)) {
          // Le PDF est protégé : demander le mot de passe à l'utilisateur
          setIsProcessing(false);
          setProcessingFile(null);
          setFileStatuses((prev) => ({ ...prev, [fileName]: "pending" }));

          const userPassword = await askForPassword(fileName);
          if (!userPassword) {
            // L'utilisateur a annulé
            setFileStatuses((prev) => ({ ...prev, [fileName]: "error" }));
            if (!silent)
              setNotification({
                message: `Analyse annulée — mot de passe requis pour « ${fileName} ».`,
                severity: "warning",
              });
            return false;
          }
          // Réessayer avec le mot de passe fourni
          effectivePassword = userPassword;
          setIsProcessing(true);
          setProcessingFile(fileName);
          setFileStatuses((prev) => ({ ...prev, [fileName]: "processing" }));
          pdfData = await extractPDFText(file, effectivePassword);
        } else {
          throw extractError;
        }
      }
      const biochemistryData = analyzeBiochemistryData(
        pdfData.biochemistryData,
      );

      // Détection d'extraction vide (format non reconnu ou PDF vide)
      if (Object.keys(biochemistryData).length === 0) {
        setFileStatuses((prev) => ({ ...prev, [fileName]: "error" }));
        if (!silent)
          setNotification({
            message: `Aucune donnée extraite de « ${fileName} » — format non reconnu ou PDF vide.`,
            severity: "warning",
          });
        return false;
      }

      // Comparer avec la dernière analyse existante
      const currentAnalyses = sortByDateDesc(
        pin
          ? await getPatientHistoryEncrypted(PATIENT_ID, pin)
          : await getPatientHistory(PATIENT_ID),
      );
      const previousAnalysis =
        currentAnalyses.length > 0 ? currentAnalyses[0] : undefined;
      const analyzedData = compareTwoAnalyses(
        biochemistryData,
        previousAnalysis?.biochemistryData,
      );

      const analysis: PatientAnalysis = {
        id: `analysis_${Date.now()}`,
        date: pdfData.samplingDate || new Date().toISOString(),
        timestamp: Date.now(),
        fileName,
        biochemistryData: analyzedData,
      };

      if (pin) {
        await saveAnalysisEncrypted(PATIENT_ID, analysis, pin);
      } else {
        await saveAnalysis(PATIENT_ID, analysis);
      }
      setFileStatuses((prev) => ({ ...prev, [fileName]: "done" }));
      refreshAnalyses();
      if (!silent)
        setNotification({
          message: `« ${fileName} » analysé avec succès.`,
          severity: "success",
        });
      return true;
    } catch (error) {
      console.error("Erreur lors du traitement du PDF:", error);
      setFileStatuses((prev) => ({ ...prev, [fileName]: "error" }));
      if (!silent)
        setNotification({
          message: `Erreur lors du traitement de « ${fileName} » : ${(error as Error).message}`,
          severity: "error",
        });
      return false;
    } finally {
      setIsProcessing(false);
      setProcessingFile(null);
    }
  };

  const handleProcessAll = async (
    fileNames: string[],
    onComplete: () => void,
  ) => {
    const pending = fileNames.filter((name) => fileStatuses[name] !== "done");
    if (pending.length === 0) {
      setNotification({
        message: "Tous les fichiers ont déjà été analysés.",
        severity: "info",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const fileName of pending) {
      const ok = await handleProcessPDF(fileName, true /* silent */);
      if (ok) successCount++;
      else errorCount++;
    }

    const plural = (n: number) => (n > 1 ? "s" : "");
    if (errorCount === 0) {
      setNotification({
        message: `${successCount} analyse${plural(successCount)} créée${plural(successCount)} avec succès.`,
        severity: "success",
      });
    } else if (successCount === 0) {
      setNotification({
        message: `Échec de toutes les analyses (${errorCount} fichier${plural(errorCount)} en erreur). Vérifiez le format de vos PDF.`,
        severity: "error",
      });
    } else {
      setNotification({
        message: `${successCount} analyse${plural(successCount)} réussie${plural(successCount)}, ${errorCount} échec${plural(errorCount)}. Les fichiers en erreur sont marqués en rouge.`,
        severity: "warning",
      });
    }

    onComplete();
  };

  return {
    isProcessing,
    processingFile,
    fileStatuses,
    notification,
    clearNotification,
    resetStatuses,
    handleProcessPDF: (fileName) => void handleProcessPDF(fileName),
    handleProcessAll,
    pendingPasswordFile,
    retryWithPassword,
    cancelPasswordRequest,
  };
};
