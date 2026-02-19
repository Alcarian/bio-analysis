import { useState, useEffect, useCallback } from "react";
import { FileItem } from "../types";
import {
  saveFileToStorage,
  getFilesFromStorage,
  deleteFileFromStorage,
  deleteAllFilesFromStorage,
  isFileDuplicate,
  migrateFromLocalStorage,
} from "../services/fileStorage";
import {
  saveFileEncrypted,
  getFilesEncrypted,
  deleteFileEncrypted,
  deleteAllFilesEncrypted,
  isFileDuplicateEncrypted,
} from "../services/encryptedStorage";
import { useAuth } from "../contexts/AuthContext";

interface UseFilesReturn {
  files: FileItem[];
  duplicateWarning: string | null;
  setDuplicateWarning: (warning: string | null) => void;
  handleFilesDropped: (newFiles: File[]) => Promise<void>;
  handleDelete: (fileName: string) => void;
  handleDeleteAll: () => void;
}

export const useFiles = (): UseFilesReturn => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const { pin } = useAuth();

  const refreshFiles = useCallback(async () => {
    if (pin) {
      const storedFiles = await getFilesEncrypted(pin);
      setFiles(storedFiles);
    } else {
      const storedFiles = await getFilesFromStorage();
      setFiles(storedFiles);
    }
  }, [pin]);

  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      await refreshFiles();
    };
    init();
  }, [refreshFiles]);

  const handleFilesDropped = async (newFiles: File[]) => {
    const duplicateChecks = await Promise.all(
      newFiles.map(async (f) => ({
        file: f,
        isDup: pin
          ? await isFileDuplicateEncrypted(f, pin)
          : await isFileDuplicate(f),
      })),
    );

    const duplicates = duplicateChecks
      .filter((c) => c.isDup)
      .map((c) => c.file);
    const toSave = duplicateChecks.filter((c) => !c.isDup).map((c) => c.file);

    if (duplicates.length > 0) {
      const plural = duplicates.length > 1;
      setDuplicateWarning(
        `Fichier${plural ? "s" : ""} déjà importé${plural ? "s" : ""} : ${duplicates.map((f) => f.name).join(", ")}`,
      );
    }

    if (toSave.length > 0) {
      if (pin) {
        await Promise.all(toSave.map((file) => saveFileEncrypted(file, pin)));
      } else {
        await Promise.all(toSave.map((file) => saveFileToStorage(file)));
      }
      await refreshFiles();
    }
  };

  const handleDelete = async (fileName: string) => {
    if (pin) {
      await deleteFileEncrypted(fileName, pin);
    } else {
      await deleteFileFromStorage(fileName);
    }
    await refreshFiles();
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "Supprimer tous les fichiers importés ? Cette action est irréversible.",
      )
    )
      return;
    if (pin) {
      await deleteAllFilesEncrypted();
    } else {
      await deleteAllFilesFromStorage();
    }
    setFiles([]);
  };

  return {
    files,
    duplicateWarning,
    setDuplicateWarning,
    handleFilesDropped,
    handleDelete,
    handleDeleteAll,
  };
};
