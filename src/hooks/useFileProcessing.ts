import { useState } from "react";
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
}

export const useFileProcessing = (
  refreshAnalyses: () => void,
  pin: string | null,
  pdfPassword: string,
): UseFileProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>(
    {},
  );
  const [notification, setNotification] =
    useState<ProcessingNotification | null>(null);

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

      const pdfData = await extractPDFText(file, pdfPassword);
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
  };
};
