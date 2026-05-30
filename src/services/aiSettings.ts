// ─── Persistance des paramètres LM Studio ─────────────────────────────────────

const STORAGE_KEY = "lm-studio-settings";

export interface AISettings {
  /** URL du serveur LM Studio (ex: http://localhost:1234) */
  serverUrl: string;
  /** Identifiant du modèle chargé dans LM Studio (null = premier modèle disponible) */
  modelId: string | null;
}

const DEFAULT_SETTINGS: AISettings = {
  serverUrl: "http://localhost:1234",
  modelId: null,
};

export const getAISettings = (): AISettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveAISettings = (settings: Partial<AISettings>): void => {
  const current = getAISettings();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...current, ...settings }),
  );
};

export const getServerUrl = (): string => getAISettings().serverUrl;
export const getModelId = (): string | null => getAISettings().modelId;
