import { BiochemistryValue } from "../types";

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
