import { useState, useEffect, useCallback } from "react";
import { FileItem } from "../types";
import {
  saveFileToStorage,
  getFilesFromStorage,
  deleteFileFromStorage,
  deleteAllFilesFromStorage,
  isFileDuplicate,
  migrateFromLocalStorage,
  migrateFilesToOPFS,
} from "../services/fileStorage";
import {
  saveFileEncrypted,
  getFilesEncrypted,
  deleteFileEncrypted,
  deleteAllFilesEncrypted,
  isFileDuplicateEncrypted,
  migrateEncryptedFilesToOPFS,
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
  const { pin, status } = useAuth();

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
      // Chaîne de migration : localStorage → IndexedDB → OPFS
      await migrateFromLocalStorage();
      if (pin) {
        await migrateEncryptedFilesToOPFS(pin);
      } else {
        await migrateFilesToOPFS();
      }
      await refreshFiles();
    };
    init();
  }, [refreshFiles, pin]);

  // Charge les fichiers PDF reçus via le Web Share Target (partage mobile)
  useEffect(() => {
    // Attendre que l'authentification soit résolue (pas en chargement ou verrouillée)
    if (status === "loading" || status === "locked") return;

    const url = new URL(window.location.href);
    if (!url.searchParams.has("shared")) return;

    const loadSharedFiles = async () => {
      if (!("caches" in window)) return;
      try {
        const cache = await caches.open("bio-shared-files-v1");
        const requests = await cache.keys();
        const sharedFiles: File[] = [];

        for (const req of requests) {
          const response = await cache.match(req);
          if (response) {
            const blob = await response.blob();
            const pathname = new URL(req.url).pathname;
            const fileName = decodeURIComponent(
              pathname.replace("/shared-pdf/", ""),
            );
            sharedFiles.push(
              new File([blob], fileName, { type: "application/pdf" }),
            );
            await cache.delete(req);
          }
        }

        if (sharedFiles.length > 0) {
          await handleFilesDropped(sharedFiles);
        }
      } finally {
        url.searchParams.delete("shared");
        window.history.replaceState({}, "", url.toString());
      }
    };

    loadSharedFiles();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

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
        // Sauvegarder séquentiellement pour éviter les race conditions sur l'index chiffré
        for (const file of toSave) {
          await saveFileEncrypted(file, pin);
        }
      } else {
        for (const file of toSave) {
          await saveFileToStorage(file);
        }
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
