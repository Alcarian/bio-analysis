/**
 * Couche de chiffrement pour le stockage IndexedDB.
 *
 * Encapsule les opérations de fileStorage et patientHistory
 * en ajoutant le chiffrement/déchiffrement AES-256-GCM transparent.
 *
 * Le PIN est passé en paramètre (provenant du contexte React en mémoire).
 */

import localforage from "localforage";
import { FileItem, PatientAnalysis } from "../types";
import { encrypt, decrypt, encryptJSON, decryptJSON } from "./cryptoService";

// ─── Stores IndexedDB chiffrés ───────────────────────────────────────────────

const encryptedFileStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "encrypted_files",
  description: "Fichiers PDF chiffrés",
});

const encryptedHistoryStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "encrypted_history",
  description: "Historique des analyses chiffré",
});

const encryptedSettingsStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "encrypted_settings",
  description: "Paramètres chiffrés (mot de passe PDF, etc.)",
});

const FILE_INDEX_KEY = "file_index_enc";
const PDF_PASSWORD_KEY = "pdf_password_enc";

// ─── Fichiers PDF chiffrés ───────────────────────────────────────────────────

/**
 * Récupère l'index des fichiers (métadonnées chiffrées)
 */
const getEncryptedFileIndex = async (pin: string): Promise<FileItem[]> => {
  const encrypted =
    await encryptedFileStore.getItem<ArrayBuffer>(FILE_INDEX_KEY);
  if (!encrypted) return [];
  try {
    return await decryptJSON<FileItem[]>(encrypted, pin);
  } catch {
    return [];
  }
};

/**
 * Sauvegarde l'index des fichiers (chiffré)
 */
const saveEncryptedFileIndex = async (
  files: FileItem[],
  pin: string,
): Promise<void> => {
  const encrypted = await encryptJSON(files, pin);
  await encryptedFileStore.setItem(FILE_INDEX_KEY, encrypted);
};

/**
 * Sauvegarde un fichier PDF chiffré dans IndexedDB
 */
export const saveFileEncrypted = async (
  file: File,
  pin: string,
): Promise<void> => {
  const arrayBuffer = await file.arrayBuffer();
  const encryptedData = await encrypt(arrayBuffer, pin);

  const files = await getEncryptedFileIndex(pin);
  const newFile: FileItem = {
    id: Date.now().toString(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };

  await encryptedFileStore.setItem(`file_enc_${newFile.id}`, encryptedData);
  files.push(newFile);
  await saveEncryptedFileIndex(files, pin);
};

/**
 * Récupère la liste des fichiers (métadonnées déchiffrées)
 */
export const getFilesEncrypted = async (pin: string): Promise<FileItem[]> => {
  return getEncryptedFileIndex(pin);
};

/**
 * Supprime un fichier chiffré
 */
export const deleteFileEncrypted = async (
  fileName: string,
  pin: string,
): Promise<void> => {
  const files = await getEncryptedFileIndex(pin);
  const fileToDelete = files.find((f) => f.name === fileName);

  if (fileToDelete) {
    await encryptedFileStore.removeItem(`file_enc_${fileToDelete.id}`);
  }

  const filtered = files.filter((f) => f.name !== fileName);
  await saveEncryptedFileIndex(filtered, pin);
};

/**
 * Supprime tous les fichiers chiffrés
 */
export const deleteAllFilesEncrypted = async (): Promise<void> => {
  await encryptedFileStore.clear();
};

/**
 * Vérifie si un fichier est un doublon (dans le store chiffré)
 */
export const isFileDuplicateEncrypted = async (
  file: File,
  pin: string,
): Promise<boolean> => {
  const files = await getEncryptedFileIndex(pin);
  return files.some(
    (f) =>
      f.name === file.name &&
      f.size === file.size &&
      f.lastModified === file.lastModified,
  );
};

/**
 * Récupère un fichier PDF déchiffré depuis IndexedDB
 */
export const getFileEncrypted = async (
  fileName: string,
  pin: string,
): Promise<File | null> => {
  const files = await getEncryptedFileIndex(pin);
  const fileData = files.find((f) => f.name === fileName);

  if (!fileData) return null;

  const encryptedBuffer = await encryptedFileStore.getItem<ArrayBuffer>(
    `file_enc_${fileData.id}`,
  );
  if (!encryptedBuffer) return null;

  try {
    const decryptedBuffer = await decrypt(encryptedBuffer, pin);
    return new File([decryptedBuffer], fileData.name, {
      type: "application/pdf",
    });
  } catch {
    return null;
  }
};

// ─── Historique des analyses chiffré ─────────────────────────────────────────

const getHistoryKey = (patientId: string) => `history_enc_${patientId}`;

/**
 * Récupère l'historique déchiffré d'un patient
 */
export const getPatientHistoryEncrypted = async (
  patientId: string,
  pin: string,
): Promise<PatientAnalysis[]> => {
  const encrypted = await encryptedHistoryStore.getItem<ArrayBuffer>(
    getHistoryKey(patientId),
  );
  if (!encrypted) return [];
  try {
    return await decryptJSON<PatientAnalysis[]>(encrypted, pin);
  } catch {
    return [];
  }
};

/**
 * Sauvegarde une analyse dans l'historique chiffré
 */
export const saveAnalysisEncrypted = async (
  patientId: string,
  analysis: PatientAnalysis,
  pin: string,
): Promise<void> => {
  const history = await getPatientHistoryEncrypted(patientId, pin);
  history.push(analysis);
  const encrypted = await encryptJSON(history, pin);
  await encryptedHistoryStore.setItem(getHistoryKey(patientId), encrypted);
};

/**
 * Supprime une analyse de l'historique chiffré
 */
export const deleteAnalysisEncrypted = async (
  patientId: string,
  analysisId: string,
  pin: string,
): Promise<void> => {
  const history = await getPatientHistoryEncrypted(patientId, pin);
  const filtered = history.filter((a) => a.id !== analysisId);
  const encrypted = await encryptJSON(filtered, pin);
  await encryptedHistoryStore.setItem(getHistoryKey(patientId), encrypted);
};

/**
 * Supprime toutes les analyses chiffrées d'un patient
 */
export const deleteAllAnalysesEncrypted = async (
  patientId: string,
): Promise<void> => {
  await encryptedHistoryStore.removeItem(getHistoryKey(patientId));
};

// ─── Mot de passe PDF chiffré ────────────────────────────────────────────────

/**
 * Sauvegarde le mot de passe PDF chiffré avec le PIN utilisateur.
 * Le mot de passe est chiffré via AES-256-GCM puis stocké dans IndexedDB.
 */
export const savePdfPasswordEncrypted = async (
  pdfPassword: string,
  pin: string,
): Promise<void> => {
  const encrypted = await encrypt(pdfPassword, pin);
  await encryptedSettingsStore.setItem(PDF_PASSWORD_KEY, encrypted);
};

/**
 * Récupère le mot de passe PDF déchiffré depuis IndexedDB.
 * Retourne null si aucun mot de passe n'est enregistré ou si le déchiffrement échoue.
 */
export const loadPdfPasswordEncrypted = async (
  pin: string,
): Promise<string | null> => {
  const encrypted =
    await encryptedSettingsStore.getItem<ArrayBuffer>(PDF_PASSWORD_KEY);
  if (!encrypted) return null;
  try {
    const buffer = await decrypt(encrypted, pin);
    return new TextDecoder().decode(buffer);
  } catch {
    return null;
  }
};

/**
 * Supprime le mot de passe PDF enregistré.
 */
export const deletePdfPasswordEncrypted = async (): Promise<void> => {
  await encryptedSettingsStore.removeItem(PDF_PASSWORD_KEY);
};

// ─── Migration des données non chiffrées vers chiffrées ──────────────────────

/**
 * Migre les données existantes (non chiffrées) vers le store chiffré.
 * Appelé une fois après la première saisie du PIN.
 */
export const migrateToEncryptedStorage = async (
  pin: string,
  patientId: string,
): Promise<{ filesMigrated: number; analysesMigrated: number }> => {
  let filesMigrated = 0;
  let analysesMigrated = 0;

  // Import dynamique pour éviter les dépendances circulaires
  const { getFilesFromStorage, getFileFromStorage, deleteAllFilesFromStorage } =
    await import("./fileStorage");
  const { getPatientHistory, deleteAllAnalyses: deleteAllAnalysesPlain } =
    await import("./patientHistory");

  // 1. Migrer les fichiers
  const plainFiles = await getFilesFromStorage();
  for (const fileItem of plainFiles) {
    const file = await getFileFromStorage(fileItem.name);
    if (file) {
      await saveFileEncrypted(file, pin);
      filesMigrated++;
    }
  }
  if (filesMigrated > 0) {
    await deleteAllFilesFromStorage();
  }

  // 2. Migrer les analyses
  const plainAnalyses = await getPatientHistory(patientId);
  if (plainAnalyses.length > 0) {
    const encrypted = await encryptJSON(plainAnalyses, pin);
    await encryptedHistoryStore.setItem(getHistoryKey(patientId), encrypted);
    analysesMigrated = plainAnalyses.length;
    await deleteAllAnalysesPlain(patientId);
  }

  return { filesMigrated, analysesMigrated };
};
