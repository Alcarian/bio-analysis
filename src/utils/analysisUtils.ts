import { BiochemistryValue } from "../types";

/**
 * Calcule le pourcentage d'écart par rapport à la plage normale.
 * Retourne null si la valeur est dans la norme.
 */
export const getDeviationLabel = (value: BiochemistryValue): string | null => {
  if (!value.isAbnormal) return null;

  if (value.normalMax !== undefined && value.value > value.normalMax) {
    const pct = (
      ((value.value - value.normalMax) / value.normalMax) *
      100
    ).toFixed(0);
    return `+${pct}%`;
  }

  if (value.normalMin !== undefined && value.value < value.normalMin) {
    const pct = (
      ((value.normalMin - value.value) / value.normalMin) *
      100
    ).toFixed(0);
    return `-${pct}%`;
  }

  return null;
};

/**
 * Construit l'affichage de la plage de référence pour un test.
 */
export const getReferenceDisplay = (value: BiochemistryValue): string => {
  if (value.normalRange) {
    return `${value.normalRange} ${value.unit}`;
  }
  if (value.normalMin !== undefined && value.normalMax !== undefined) {
    return `${value.normalMin} – ${value.normalMax} ${value.unit}`;
  }
  if (value.normalMin !== undefined) {
    return `≥ ${value.normalMin} ${value.unit}`;
  }
  if (value.normalMax !== undefined) {
    return `≤ ${value.normalMax} ${value.unit}`;
  }
  return "—";
};
