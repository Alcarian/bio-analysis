import localforage from "localforage";
import { FileItem } from "../types";

// Configuration de l'instance IndexedDB pour les fichiers PDF
const fileStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "pdf_files",
  description: "Stockage local des fichiers PDF importés",
});

const FILE_INDEX_KEY = "file_index";

/**
 * Récupère l'index des fichiers (métadonnées sans les données binaires)
 */
const getFileIndex = async (): Promise<FileItem[]> => {
  const index = await fileStore.getItem<FileItem[]>(FILE_INDEX_KEY);
  return index || [];
};

/**
 * Sauvegarde l'index des fichiers
 */
const saveFileIndex = async (files: FileItem[]): Promise<void> => {
  await fileStore.setItem(FILE_INDEX_KEY, files);
};

/**
 * Sauvegarde un fichier PDF dans IndexedDB
 * Les données binaires sont stockées séparément de l'index pour la performance
 */
export const saveFileToStorage = async (file: File): Promise<void> => {
  const arrayBuffer = await file.arrayBuffer();

  const files = await getFileIndex();
  const newFile: FileItem = {
    id: Date.now().toString(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };

  // Stocker les données binaires séparément (pas de conversion base64)
  await fileStore.setItem(`file_data_${newFile.id}`, arrayBuffer);

  files.push(newFile);
  await saveFileIndex(files);
};

/**
 * Récupère la liste des fichiers (métadonnées uniquement)
 */
export const getFilesFromStorage = async (): Promise<FileItem[]> => {
  return getFileIndex();
};

/**
 * Supprime un fichier par son nom
 */
export const deleteFileFromStorage = async (
  fileName: string,
): Promise<void> => {
  const files = await getFileIndex();
  const fileToDelete = files.find((f) => f.name === fileName);

  if (fileToDelete) {
    await fileStore.removeItem(`file_data_${fileToDelete.id}`);
  }

  const filtered = files.filter((f) => f.name !== fileName);
  await saveFileIndex(filtered);
};

/**
 * Supprime tous les fichiers
 */
export const deleteAllFilesFromStorage = async (): Promise<void> => {
  await fileStore.clear();
};

/**
 * Vérifie si un fichier est un doublon
 */
export const isFileDuplicate = async (file: File): Promise<boolean> => {
  const files = await getFileIndex();
  return files.some(
    (f) =>
      f.name === file.name &&
      f.size === file.size &&
      f.lastModified === file.lastModified,
  );
};

/**
 * Récupère un fichier complet (avec données) depuis IndexedDB
 */
export const getFileFromStorage = async (
  fileName: string,
): Promise<File | null> => {
  const files = await getFileIndex();
  const fileData = files.find((f) => f.name === fileName);

  if (!fileData) return null;

  const arrayBuffer = await fileStore.getItem<ArrayBuffer>(
    `file_data_${fileData.id}`,
  );
  if (!arrayBuffer) return null;

  return new File([arrayBuffer], fileData.name, { type: "application/pdf" });
};

// ─── Migration depuis localStorage ──────────────────────────────────────────

const OLD_STORAGE_KEY = "pdf_files";

/**
 * Migre les données depuis localStorage vers IndexedDB (exécuté une seule fois)
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldData) return false;

  try {
    const oldFiles: (FileItem & { data?: string })[] = JSON.parse(oldData);

    for (const oldFile of oldFiles) {
      if (oldFile.data) {
        // Convertir base64 → ArrayBuffer
        const binaryString = atob(oldFile.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const newFile: FileItem = {
          id: oldFile.id || Date.now().toString(),
          name: oldFile.name,
          size: oldFile.size,
          type: oldFile.type,
          lastModified: oldFile.lastModified,
        };

        await fileStore.setItem(`file_data_${newFile.id}`, bytes.buffer);

        const existingFiles = await getFileIndex();
        if (!existingFiles.some((f) => f.name === newFile.name)) {
          existingFiles.push(newFile);
          await saveFileIndex(existingFiles);
        }
      }
    }

    // Supprimer les anciennes données de localStorage
    localStorage.removeItem(OLD_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Erreur lors de la migration des fichiers:", error);
    return false;
  }
};
