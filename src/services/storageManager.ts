/**
 * Gestion de la persistance du stockage navigateur.
 *
 * - `requestPersistentStorage()` demande au navigateur de ne pas purger les données
 *   (IndexedDB, OPFS, Cache API) même en cas de pression mémoire.
 * - `getStorageEstimate()` retourne l'espace utilisé et disponible.
 *
 * Sur mobile, la persistance est accordée automatiquement si l'app est installée
 * en PWA (Android). Sur iOS, c'est plus restrictif mais reste utile.
 */

export interface StorageEstimate {
  usedMB: number;
  quotaMB: number;
  percentUsed: number;
}

/**
 * Demande le stockage persistant au navigateur.
 * Retourne `true` si accordé, `false` si refusé ou non supporté.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (!navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

/**
 * Vérifie si le stockage est déjà marqué comme persistant.
 */
export const isStoragePersisted = async (): Promise<boolean> => {
  if (!navigator.storage?.persisted) return false;
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
};

/**
 * Retourne l'estimation de l'espace de stockage utilisé / disponible.
 */
export const getStorageEstimate = async (): Promise<StorageEstimate | null> => {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    const usedMB = (usage ?? 0) / (1024 * 1024);
    const quotaMB = (quota ?? 0) / (1024 * 1024);
    const percentUsed = quotaMB > 0 ? (usedMB / quotaMB) * 100 : 0;
    return {
      usedMB: Math.round(usedMB * 100) / 100,
      quotaMB: Math.round(quotaMB * 100) / 100,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  } catch {
    return null;
  }
};
