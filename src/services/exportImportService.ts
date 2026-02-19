/**
 * Service d'export / import chiffré des données Bio Analysis.
 *
 * Format du fichier .bioenc :
 *   AES-256-GCM( JSON({ version, exportedAt, analyses[] }) )
 *
 * Le PIN utilisateur sert de clé de chiffrement.
 * Seul le détenteur du PIN peut lire le fichier exporté.
 */

import { PatientAnalysis } from "../types";
import { encryptJSON, decryptJSON } from "./cryptoService";
import {
  getPatientHistoryEncrypted,
  saveAnalysisEncrypted,
} from "./encryptedStorage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExportPayload {
  version: number;
  exportedAt: string;
  analyses: PatientAnalysis[];
}

const CURRENT_VERSION = 1;
const FILE_EXTENSION = ".bioenc";

// ─── Export ──────────────────────────────────────────────────────────────────

/**
 * Exporte toutes les analyses chiffrées dans un fichier téléchargeable.
 * Le fichier est chiffré avec le PIN de l'utilisateur.
 */
export const exportEncryptedData = async (
  patientId: string,
  pin: string,
): Promise<{ blob: Blob; fileName: string; count: number }> => {
  const analyses = await getPatientHistoryEncrypted(patientId, pin);

  const payload: ExportPayload = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    analyses,
  };

  const encrypted = await encryptJSON(payload, pin);
  const blob = new Blob([encrypted], { type: "application/octet-stream" });

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `bio-analysis_${date}${FILE_EXTENSION}`;

  return { blob, fileName, count: analyses.length };
};

/**
 * Déclenche le téléchargement du fichier exporté.
 */
export const downloadExport = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

// ─── Import ──────────────────────────────────────────────────────────────────

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
}

/**
 * Importe un fichier .bioenc chiffré et fusionne les analyses dans le store.
 * Les analyses déjà existantes (même id) sont ignorées.
 */
export const importEncryptedData = async (
  file: File,
  patientId: string,
  pin: string,
): Promise<ImportResult> => {
  if (!file.name.endsWith(FILE_EXTENSION)) {
    throw new Error(
      `Format invalide. Seuls les fichiers ${FILE_EXTENSION} sont acceptés.`,
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  let payload: ExportPayload;
  try {
    payload = await decryptJSON<ExportPayload>(arrayBuffer, pin);
  } catch {
    throw new Error(
      "Impossible de déchiffrer le fichier. Vérifiez que le PIN est identique à celui utilisé pour l'export.",
    );
  }

  if (!payload.version || !Array.isArray(payload.analyses)) {
    throw new Error("Format de fichier invalide ou corrompu.");
  }

  // Récupérer les analyses existantes pour éviter les doublons
  const existing = await getPatientHistoryEncrypted(patientId, pin);
  const existingIds = new Set(existing.map((a) => a.id));

  let imported = 0;
  let skipped = 0;

  for (const analysis of payload.analyses) {
    if (existingIds.has(analysis.id)) {
      skipped++;
      continue;
    }
    await saveAnalysisEncrypted(patientId, analysis, pin);
    imported++;
  }

  return {
    total: payload.analyses.length,
    imported,
    skipped,
  };
};
