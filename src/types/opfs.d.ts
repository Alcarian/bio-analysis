/**
 * Déclarations de types pour les APIs File System (OPFS).
 * Ces APIs sont supportées par les navigateurs modernes mais pas encore
 * incluses dans les types TypeScript par défaut.
 */

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  readonly kind: "file";
  readonly name: string;
}

interface FileSystemDirectoryHandle {
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemFileHandle>;
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  readonly kind: "directory";
  readonly name: string;
}

type FileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

interface StorageManager {
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}
