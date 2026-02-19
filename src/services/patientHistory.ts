import localforage from "localforage";
import { PatientAnalysis } from "../types";
import { parseDate } from "../utils/dateUtils";

// Configuration de l'instance IndexedDB pour l'historique des analyses
const historyStore = localforage.createInstance({
  name: "bio-analysis",
  storeName: "patient_history",
  description: "Historique des analyses biologiques",
});

const getHistoryKey = (patientId: string) => `history_${patientId}`;

/**
 * Récupère l'historique complet d'un patient
 */
export const getPatientHistory = async (
  patientId: string,
): Promise<PatientAnalysis[]> => {
  const stored = await historyStore.getItem<PatientAnalysis[]>(
    getHistoryKey(patientId),
  );
  return stored || [];
};

/**
 * Sauvegarde une nouvelle analyse dans l'historique
 */
export const saveAnalysis = async (
  patientId: string,
  analysis: PatientAnalysis,
): Promise<void> => {
  const history = await getPatientHistory(patientId);
  history.push(analysis);
  await historyStore.setItem(getHistoryKey(patientId), history);
};

/**
 * Supprime une analyse de l'historique
 */
export const deleteAnalysis = async (
  patientId: string,
  analysisId: string,
): Promise<void> => {
  const history = await getPatientHistory(patientId);
  const filtered = history.filter((a) => a.id !== analysisId);
  await historyStore.setItem(getHistoryKey(patientId), filtered);
};

/**
 * Supprime toutes les analyses d'un patient
 */
export const deleteAllAnalyses = async (patientId: string): Promise<void> => {
  await historyStore.removeItem(getHistoryKey(patientId));
};

/**
 * Obtient les données pour un test spécifique sur toute la période
 */
export const getTestTimeSeries = async (
  patientId: string,
  testName: string,
): Promise<
  Array<{
    date: string;
    value: number;
    unit: string;
    normalMin?: number;
    normalMax?: number;
  }>
> => {
  const history = await getPatientHistory(patientId);

  return history
    .map((analysis) => {
      const testData = analysis.biochemistryData[testName];
      if (!testData) return null;

      return {
        date: analysis.date,
        value: testData.value,
        unit: testData.unit,
        normalMin: testData.normalMin,
        normalMax: testData.normalMax,
      };
    })
    .filter(Boolean)
    .sort((a, b) => parseDate(a!.date) - parseDate(b!.date)) as Array<{
    date: string;
    value: number;
    unit: string;
    normalMin?: number;
    normalMax?: number;
  }>;
};

/**
 * Calcule des statistiques sur un test
 */
export const getTestStatistics = async (
  patientId: string,
  testName: string,
): Promise<{
  average: number;
  min: number;
  max: number;
  latest: number;
  count: number;
} | null> => {
  const timeSeries = await getTestTimeSeries(patientId, testName);

  if (timeSeries.length === 0) {
    return null;
  }

  const values = timeSeries.map((d) => d.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1];

  return {
    average,
    min,
    max,
    latest,
    count: values.length,
  };
};

// ─── Migration depuis localStorage ──────────────────────────────────────────

const OLD_HISTORY_KEY = "patient_analysis_history";

/**
 * Migre l'historique depuis localStorage vers IndexedDB
 */
export const migrateHistoryFromLocalStorage = async (): Promise<boolean> => {
  // Chercher toutes les clés d'historique dans localStorage
  const keysToMigrate: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(OLD_HISTORY_KEY)) {
      keysToMigrate.push(key);
    }
  }

  if (keysToMigrate.length === 0) return false;

  try {
    for (const key of keysToMigrate) {
      const data = localStorage.getItem(key);
      if (data) {
        const analyses: PatientAnalysis[] = JSON.parse(data);
        // Extraire le patientId du nom de la clé
        const patientId = key.replace(`${OLD_HISTORY_KEY}_`, "");

        // Supprimer rawText des anciennes analyses lors de la migration
        const cleanedAnalyses = analyses.map(
          ({ rawText, ...rest }: any) => rest,
        );

        await historyStore.setItem(getHistoryKey(patientId), cleanedAnalyses);
        localStorage.removeItem(key);
      }
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la migration de l'historique:", error);
    return false;
  }
};
