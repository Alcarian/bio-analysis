import { BiochemistryValue } from "../types";

/**
 * Normalise un nom de test (supprime caractères spéciaux, met en majuscules)
 */
const normalizeTestName = (name: string): string => {
  return name.trim().toUpperCase().replace(/\*\*/g, "").replace(/\s+/g, " ");
};

/**
 * Analyse complète des données de biochimie.
 *
 * Utilise directement les plages normatives extraites du PDF
 * (normalMin / normalMax) plutôt qu'un dictionnaire statique.
 */
export const analyzeBiochemistryData = (
  rawData:
    | {
        [key: string]: string;
      }
    | any[],
): { [key: string]: BiochemistryValue } => {
  const analyzed: { [key: string]: BiochemistryValue } = {};

  if (Array.isArray(rawData)) {
    // Format principal : tableau de BiochemistryResult (depuis pdfExtractor)
    rawData.forEach((item: any) => {
      const testName = item.testName || "";
      const value =
        typeof item.value === "number"
          ? item.value
          : parseFloat(String(item.value).replace(",", "."));

      if (!testName || isNaN(value)) return;

      const normalMin = item.normalMin;
      const normalMax = item.normalMax;

      let isAbnormal = false;
      if (normalMin !== undefined && value < normalMin) isAbnormal = true;
      if (normalMax !== undefined && value > normalMax) isAbnormal = true;

      const normalizedName = normalizeTestName(testName);
      analyzed[normalizedName] = {
        value,
        unit: item.unit || "",
        normalMin,
        normalMax,
        normalRange: item.normalRange,
        isAbnormal,
      };
    });
  } else {
    // Format ancien : objet clé-valeur (compatibilité)
    Object.entries(rawData).forEach(([testName, rawValue]) => {
      const strValue =
        typeof rawValue === "string" ? rawValue : String(rawValue || "");
      const match = strValue.match(/^([0-9.]+)\s*(.*)$/);
      if (!match) return;

      const value = parseFloat(match[1]);
      if (isNaN(value)) return;

      const normalizedName = normalizeTestName(testName);
      analyzed[normalizedName] = {
        value,
        unit: match[2].trim(),
        isAbnormal: false,
      };
    });
  }

  return analyzed;
};

/**
 * Compare deux analyses pour détecter les tendances
 */
export const compareTwoAnalyses = (
  current: { [key: string]: BiochemistryValue },
  previous: { [key: string]: BiochemistryValue } | undefined,
): { [key: string]: BiochemistryValue } => {
  if (!previous) {
    return current;
  }

  const result = { ...current };

  Object.keys(result).forEach((testName) => {
    const prevValue = previous[testName]?.value;
    const currentValue = result[testName].value;

    if (prevValue !== undefined) {
      if (currentValue > prevValue) {
        result[testName].trend = "up";
      } else if (currentValue < prevValue) {
        result[testName].trend = "down";
      } else {
        result[testName].trend = "stable";
      }
    }
  });

  return result;
};

/**
 * Extrait des statistiques sur les anomalies
 */
export const getAnomalySummary = (analyzed: {
  [key: string]: BiochemistryValue;
}): { abnormalCount: number; abnormalTests: string[] } => {
  const abnormalTests = Object.entries(analyzed)
    .filter(([_, value]) => value.isAbnormal)
    .map(([name]) => name);

  return {
    abnormalCount: abnormalTests.length,
    abnormalTests,
  };
};
