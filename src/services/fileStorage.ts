import localforage from "localforage";
import { FileItem } from "../types";
import {
  isOPFSSupported,
  opfsSaveFile,
  opfsGetFile,
  opfsDeleteFile,
  opfsClearDir,
  opfsSaveJSON,
  opfsGetJSON,
  OPFS_PDF_DIR,
} from "./opfsStorage";

// ─── IndexedDB (fallback si OPFS non supporté) ──────────────────────────────

const fileStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "pdf_files",
  description: "Stockage local des fichiers PDF importés",
});

const FILE_INDEX_KEY = "file_index";
const OPFS_INDEX_FILE = "file_index.json";

// ─── Index (métadonnées) : OPFS si dispo, sinon IndexedDB ───────────────────

const getFileIndex = async (): Promise<FileItem[]> => {
  if (await isOPFSSupported()) {
    return (await opfsGetJSON<FileItem[]>(OPFS_PDF_DIR, OPFS_INDEX_FILE)) || [];
  }
  return (await fileStore.getItem<FileItem[]>(FILE_INDEX_KEY)) || [];
};

const saveFileIndex = async (files: FileItem[]): Promise<void> => {
  if (await isOPFSSupported()) {
    await opfsSaveJSON(OPFS_PDF_DIR, OPFS_INDEX_FILE, files);
  } else {
    await fileStore.setItem(FILE_INDEX_KEY, files);
  }
};

// ─── CRUD fichiers : OPFS si dispo, sinon IndexedDB ─────────────────────────

/**
 * Sauvegarde un fichier PDF (OPFS ou IndexedDB).
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

  if (await isOPFSSupported()) {
    await opfsSaveFile(OPFS_PDF_DIR, `file_data_${newFile.id}`, arrayBuffer);
  } else {
    await fileStore.setItem(`file_data_${newFile.id}`, arrayBuffer);
  }

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
    if (await isOPFSSupported()) {
      await opfsDeleteFile(OPFS_PDF_DIR, `file_data_${fileToDelete.id}`);
    } else {
      await fileStore.removeItem(`file_data_${fileToDelete.id}`);
    }
  }

  const filtered = files.filter((f) => f.name !== fileName);
  await saveFileIndex(filtered);
};

/**
 * Supprime tous les fichiers
 */
export const deleteAllFilesFromStorage = async (): Promise<void> => {
  if (await isOPFSSupported()) {
    await opfsClearDir(OPFS_PDF_DIR);
  } else {
    await fileStore.clear();
  }
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
 * Récupère un fichier complet (avec données)
 */
export const getFileFromStorage = async (
  fileName: string,
): Promise<File | null> => {
  const files = await getFileIndex();
  const fileData = files.find((f) => f.name === fileName);
  if (!fileData) return null;

  let arrayBuffer: ArrayBuffer | null;
  if (await isOPFSSupported()) {
    arrayBuffer = await opfsGetFile(OPFS_PDF_DIR, `file_data_${fileData.id}`);
  } else {
    arrayBuffer = await fileStore.getItem<ArrayBuffer>(
      `file_data_${fileData.id}`,
    );
  }
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

// ─── Migration IndexedDB → OPFS (fichiers non chiffrés) ─────────────────────

/**
 * Migre les fichiers PDF non chiffrés d'IndexedDB vers OPFS.
 * Ne fait rien si OPFS n'est pas supporté ou si aucune donnée IndexedDB n'existe.
 * Retourne le nombre de fichiers migrés.
 */
export const migrateFilesToOPFS = async (): Promise<number> => {
  if (!(await isOPFSSupported())) return 0;

  // Vérifier s'il y a des fichiers dans IndexedDB
  const indexedDBFiles = await fileStore.getItem<FileItem[]>(FILE_INDEX_KEY);
  if (!indexedDBFiles || indexedDBFiles.length === 0) return 0;

  let migrated = 0;

  for (const fileItem of indexedDBFiles) {
    const data = await fileStore.getItem<ArrayBuffer>(
      `file_data_${fileItem.id}`,
    );
    if (data) {
      await opfsSaveFile(OPFS_PDF_DIR, `file_data_${fileItem.id}`, data);
      migrated++;
    }
  }

  // Sauvegarder l'index dans OPFS
  await opfsSaveJSON(OPFS_PDF_DIR, OPFS_INDEX_FILE, indexedDBFiles);

  // Nettoyer IndexedDB
  await fileStore.clear();

  return migrated;
};
