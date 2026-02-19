import React, { createContext, useContext, useState, useCallback } from "react";
import localforage from "localforage";
import {
  createPinVerification,
  verifyPin,
  PIN_VERIFICATION_KEY,
} from "../services/cryptoService";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthStatus = "loading" | "no-pin" | "locked" | "unlocked";

interface AuthContextValue {
  /** État actuel de l'authentification */
  status: AuthStatus;
  /** Le PIN en mémoire (jamais persisté en clair) */
  pin: string | null;
  /** Initialise l'état d'auth (vérifie si un PIN existe déjà) */
  initialize: () => Promise<void>;
  /** Crée un nouveau PIN (première utilisation) */
  createPin: (newPin: string) => Promise<void>;
  /** Tente de déverrouiller avec un PIN */
  unlock: (pin: string) => Promise<boolean>;
  /** Verrouille l'application */
  lock: () => void;
  /** Supprime le PIN et toutes les données chiffrées */
  resetPin: () => Promise<void>;
}

// ─── Store IndexedDB pour le jeton de vérification ──────────────────────────

const authStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "auth",
  description: "Données d'authentification",
});

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  pin: null,
  initialize: async () => {},
  createPin: async () => {},
  unlock: async () => false,
  lock: () => {},
  resetPin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [pin, setPin] = useState<string | null>(null);

  /**
   * Vérifie si un PIN a déjà été configuré
   */
  const initialize = useCallback(async () => {
    try {
      const token = await authStore.getItem<ArrayBuffer>(PIN_VERIFICATION_KEY);
      if (token) {
        setStatus("locked");
      } else {
        setStatus("no-pin");
      }
    } catch {
      setStatus("no-pin");
    }
  }, []);

  /**
   * Crée un nouveau PIN (première utilisation)
   */
  const createPin = useCallback(async (newPin: string) => {
    const token = await createPinVerification(newPin);
    await authStore.setItem(PIN_VERIFICATION_KEY, token);
    setPin(newPin);
    setStatus("unlocked");
  }, []);

  /**
   * Tente de déverrouiller avec le PIN fourni
   */
  const unlock = useCallback(async (attemptedPin: string): Promise<boolean> => {
    const token = await authStore.getItem<ArrayBuffer>(PIN_VERIFICATION_KEY);
    if (!token) return false;

    const isValid = await verifyPin(attemptedPin, token);
    if (isValid) {
      setPin(attemptedPin);
      setStatus("unlocked");
      return true;
    }
    return false;
  }, []);

  /**
   * Verrouille l'application (efface le PIN de la mémoire)
   */
  const lock = useCallback(() => {
    setPin(null);
    setStatus("locked");
  }, []);

  /**
   * Supprime le PIN et remet l'app en mode "no-pin"
   */
  const resetPin = useCallback(async () => {
    await authStore.removeItem(PIN_VERIFICATION_KEY);
    setPin(null);
    setStatus("no-pin");
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, pin, initialize, createPin, unlock, lock, resetPin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
