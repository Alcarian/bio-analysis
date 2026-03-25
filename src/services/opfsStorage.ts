/**
 * Couche de stockage OPFS (Origin Private File System).
 *
 * OPFS fournit un système de fichiers privé à l'application, plus résistant
 * au nettoyage du cache navigateur que IndexedDB seul.
 *
 * Compatible : Chrome 86+, Safari 15.2+, Firefox 111+
 * Si OPFS n'est pas disponible, les fonctions retournent des fallbacks
 * et l'appelant continue à utiliser IndexedDB (localforage).
 */

const PDF_DIR = "pdf_files";
const ENCRYPTED_DIR = "encrypted_files";

// ─── Support Detection ──────────────────────────────────────────────────────

let _opfsSupported: boolean | null = null;

/**
 * Vérifie si OPFS est disponible dans ce navigateur.
 * Le résultat est mis en cache après le premier appel.
 */
export const isOPFSSupported = async (): Promise<boolean> => {
  if (_opfsSupported !== null) return _opfsSupported;
  try {
    if (!navigator.storage?.getDirectory) {
      _opfsSupported = false;
      return false;
    }
    // Tentative réelle d'accès pour confirmer le support
    await navigator.storage.getDirectory();
    _opfsSupported = true;
    return true;
  } catch {
    _opfsSupported = false;
    return false;
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Obtient (ou crée) un sous-répertoire dans OPFS.
 */
const getSubDir = async (
  dirName: string,
): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(dirName, { create: true });
};

// ─── CRUD Fichiers ───────────────────────────────────────────────────────────

/**
 * Sauvegarde un ArrayBuffer dans OPFS.
 * @param dirName - Sous-répertoire OPFS (ex: "pdf_files", "encrypted_files")
 * @param fileName - Nom du fichier (ex: "file_data_123")
 * @param data - Données binaires à écrire
 */
export const opfsSaveFile = async (
  dirName: string,
  fileName: string,
  data: ArrayBuffer,
): Promise<void> => {
  const dir = await getSubDir(dirName);
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
};

/**
 * Lit un fichier depuis OPFS et retourne son contenu en ArrayBuffer.
 * Retourne `null` si le fichier n'existe pas.
 */
export const opfsGetFile = async (
  dirName: string,
  fileName: string,
): Promise<ArrayBuffer | null> => {
  try {
    const dir = await getSubDir(dirName);
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
};

/**
 * Supprime un fichier d'OPFS.
 */
export const opfsDeleteFile = async (
  dirName: string,
  fileName: string,
): Promise<void> => {
  try {
    const dir = await getSubDir(dirName);
    await dir.removeEntry(fileName);
  } catch {
    // Le fichier n'existait pas — pas d'erreur
  }
};

/**
 * Liste tous les fichiers dans un sous-répertoire OPFS.
 */
export const opfsListFiles = async (dirName: string): Promise<string[]> => {
  try {
    const dir = await getSubDir(dirName);
    const names: string[] = [];
    for await (const [name] of (dir as any).entries()) {
      names.push(name);
    }
    return names;
  } catch {
    return [];
  }
};

/**
 * Supprime tous les fichiers d'un sous-répertoire OPFS.
 */
export const opfsClearDir = async (dirName: string): Promise<void> => {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(dirName, { recursive: true });
  } catch {
    // Le répertoire n'existait pas
  }
};

// ─── Index JSON (métadonnées des fichiers) ───────────────────────────────────

/**
 * Sauvegarde un objet JSON comme fichier dans OPFS.
 */
export const opfsSaveJSON = async <T>(
  dirName: string,
  fileName: string,
  data: T,
): Promise<void> => {
  const json = JSON.stringify(data);
  const encoded = new TextEncoder().encode(json);
  await opfsSaveFile(dirName, fileName, encoded.buffer);
};

/**
 * Lit un fichier JSON depuis OPFS.
 * Retourne `null` si le fichier n'existe pas ou est illisible.
 */
export const opfsGetJSON = async <T>(
  dirName: string,
  fileName: string,
): Promise<T | null> => {
  const buffer = await opfsGetFile(dirName, fileName);
  if (!buffer) return null;
  try {
    const text = new TextDecoder().decode(buffer);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

// ─── Constantes exportées pour les noms de répertoires ───────────────────────

export const OPFS_PDF_DIR = PDF_DIR;
export const OPFS_ENCRYPTED_DIR = ENCRYPTED_DIR;

// ─── Flag de migration ──────────────────────────────────────────────────────

const MIGRATION_DIR = "meta";
const MIGRATION_FLAG_FILE = "indexeddb_migrated";

/**
 * Vérifie si la migration IndexedDB → OPFS a déjà été effectuée.
 */
export const isMigrationDone = async (): Promise<boolean> => {
  const flag = await opfsGetFile(MIGRATION_DIR, MIGRATION_FLAG_FILE);
  return flag !== null;
};

/**
 * Marque la migration comme terminée.
 */
export const setMigrationDone = async (): Promise<void> => {
  await opfsSaveFile(
    MIGRATION_DIR,
    MIGRATION_FLAG_FILE,
    new Uint8Array([1]).buffer,
  );
};
