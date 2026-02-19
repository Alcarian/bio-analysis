/**
 * Service de chiffrement / déchiffrement AES-256-GCM
 * Utilise Web Crypto API (native dans tous les navigateurs modernes)
 *
 * Architecture :
 *   PIN utilisateur → PBKDF2 (100 000 itérations) → Clé AES-256
 *   Données + Clé AES-256 → AES-GCM → Données chiffrées (IV + ciphertext + tag)
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommandé pour GCM)

// ─── Dérivation de clé ──────────────────────────────────────────────────────

/**
 * Dérive une clé AES-256 à partir d'un PIN/mot de passe via PBKDF2
 */
export const deriveKey = async (
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

// ─── Chiffrement ─────────────────────────────────────────────────────────────

/**
 * Chiffre des données avec AES-256-GCM
 * Retourne un ArrayBuffer contenant : salt (16) + iv (12) + ciphertext
 */
export const encrypt = async (
  data: ArrayBuffer | string,
  pin: string,
): Promise<ArrayBuffer> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(pin, salt);

  let plaintext: ArrayBuffer;
  if (typeof data === "string") {
    plaintext = new TextEncoder().encode(data).buffer;
  } else {
    plaintext = data;
  }

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  // Concaténer : salt + iv + ciphertext
  const result = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + ciphertext.byteLength,
  );
  result.set(salt, 0);
  result.set(iv, SALT_LENGTH);
  result.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return result.buffer;
};

/**
 * Chiffre un objet JSON
 */
export const encryptJSON = async (
  data: unknown,
  pin: string,
): Promise<ArrayBuffer> => {
  const json = JSON.stringify(data);
  return encrypt(json, pin);
};

// ─── Déchiffrement ───────────────────────────────────────────────────────────

/**
 * Déchiffre des données chiffrées avec AES-256-GCM
 * Le buffer doit contenir : salt (16) + iv (12) + ciphertext
 */
export const decrypt = async (
  encryptedData: ArrayBuffer,
  pin: string,
): Promise<ArrayBuffer> => {
  const data = new Uint8Array(encryptedData);

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(pin, salt);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
};

/**
 * Déchiffre vers une string UTF-8
 */
export const decryptToString = async (
  encryptedData: ArrayBuffer,
  pin: string,
): Promise<string> => {
  const decrypted = await decrypt(encryptedData, pin);
  return new TextDecoder().decode(decrypted);
};

/**
 * Déchiffre vers un objet JSON
 */
export const decryptJSON = async <T = unknown>(
  encryptedData: ArrayBuffer,
  pin: string,
): Promise<T> => {
  const json = await decryptToString(encryptedData, pin);
  return JSON.parse(json) as T;
};

// ─── Vérification du PIN ─────────────────────────────────────────────────────

const PIN_VERIFICATION_KEY = "pin_verification";

/**
 * Crée un jeton de vérification pour un PIN (stocké en clair dans IndexedDB)
 * Permet de vérifier si le PIN saisi est correct sans stocker le PIN lui-même
 */
export const createPinVerification = async (
  pin: string,
): Promise<ArrayBuffer> => {
  const marker = "BIO_ANALYSIS_PIN_OK";
  return encrypt(marker, pin);
};

/**
 * Vérifie si un PIN est correct en tentant de déchiffrer le jeton de vérification
 */
export const verifyPin = async (
  pin: string,
  verificationToken: ArrayBuffer,
): Promise<boolean> => {
  try {
    const decrypted = await decryptToString(verificationToken, pin);
    return decrypted === "BIO_ANALYSIS_PIN_OK";
  } catch {
    // Échec de déchiffrement = mauvais PIN
    return false;
  }
};

export { PIN_VERIFICATION_KEY };
