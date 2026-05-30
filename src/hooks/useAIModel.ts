import { useState, useCallback } from "react";
import {
  checkLMStudioConnection,
  extractWithAI,
  isAIReady,
  AIResult,
} from "../services/aiExtractor";
import { getAISettings, saveAISettings } from "../services/aiSettings";

export interface UseAIModelReturn {
  /** Le serveur LM Studio est configuré et joignable */
  isReady: boolean;
  /** Vérification de connexion en cours */
  isLoading: boolean;
  /** Erreur de connexion */
  hasError: boolean;
  /** Message d'erreur détaillé */
  errorMessage: string | null;
  /** URL du serveur LM Studio */
  serverUrl: string;
  /** Modèle sélectionné (null = premier modèle disponible) */
  modelId: string | null;
  /** Modèles disponibles sur le serveur */
  availableModels: string[];
  /** Teste la connexion au serveur */
  checkConnection: () => Promise<void>;
  /** Met à jour l'URL du serveur */
  setServerUrl: (url: string) => void;
  /** Sélectionne un modèle spécifique */
  setModelId: (id: string | null) => void;
  /** Extrait les résultats biologiques d'un texte */
  extract: (text: string) => Promise<AIResult[]>;
}

export const useAIModel = (): UseAIModelReturn => {
  const settings = getAISettings();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(isAIReady);
  const [serverUrl, setServerUrlState] = useState(settings.serverUrl);
  const [modelId, setModelIdState] = useState<string | null>(settings.modelId);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const { ok, models, error } = await checkLMStudioConnection();
      if (ok) {
        setIsReady(true);
        setAvailableModels(models);
        // Sélectionner automatiquement le premier modèle si aucun n'est choisi
        if (!modelId && models.length > 0) {
          setModelIdState(models[0]);
          saveAISettings({ modelId: models[0] });
        }
      } else {
        setIsReady(false);
        setHasError(true);
        setErrorMessage(error ?? "Connexion échouée");
      }
    } catch (err) {
      setIsReady(false);
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [modelId]);

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
    saveAISettings({ serverUrl: url });
    // Réinitialiser l'état de connexion quand l'URL change
    setIsReady(false);
    setHasError(false);
    setErrorMessage(null);
    setAvailableModels([]);
  }, []);

  const setModelId = useCallback((id: string | null) => {
    setModelIdState(id);
    saveAISettings({ modelId: id });
  }, []);

  return {
    isReady,
    isLoading,
    hasError,
    errorMessage,
    serverUrl,
    modelId,
    availableModels,
    checkConnection,
    setServerUrl,
    setModelId,
    extract: extractWithAI,
  };
};
