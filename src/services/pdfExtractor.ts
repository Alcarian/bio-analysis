import * as pdfjsLib from "pdfjs-dist";

// Configuration du worker pour pdf.js
const workerPath = process.env.PUBLIC_URL
  ? `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`
  : "/pdf.worker.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

// ─── Types ───────────────────────────────────────────────────────────────────

/** Élément de texte positionné extrait du PDF */
interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
}

/** Ligne logique reconstituée (items groupés par Y) */
interface LogicalLine {
  y: number;
  items: TextItem[];
  nameText: string; // x < 270   — nom du test
  valueText: string; // 270 ≤ x < 325 — valeur numérique
  unitText: string; // 325 ≤ x < 380 — unité
  rangeText: string; // 375 ≤ x < 460 — plage de référence
}

export interface BiochemistryResult {
  testName: string;
  value: number;
  unit: string;
  section: string;
  normalRange?: string;
  normalMin?: number;
  normalMax?: number;
}

export interface PDFData {
  fileName: string;
  text: string;
  pageCount: number;
  pages: string[];
  samplingDate?: string;
  biochemistryData: BiochemistryResult[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Tolérance Y (en points PDF) pour regrouper les items sur la même ligne */
const Y_TOLERANCE = 4;

/** Colonnes du tableau Novelab (positions X en points PDF) */
const COL = {
  NAME_END: 270,
  VALUE_START: 270,
  VALUE_END: 320,
  UNIT_START: 320,
  UNIT_END: 380,
  RANGE_START: 375,
  RANGE_END: 460,
};

/** En-têtes de section reconnus (comparés en majuscules, sans accents) */
const KNOWN_SECTIONS = [
  "HEMATOLOGIE",
  "BIOCHIMIE SANGUINE",
  "BIOCHIMIE URINAIRE",
  "HORMONOLOGIE",
  "CYTOLOGIE URINAIRE",
  "SEROLOGIE",
  "IMMUNOLOGIE",
  "MICROBIOLOGIE",
  "COAGULATION",
];

/** Lignes à ignorer (méthodes, notes, classifications…) */
const SKIP_PATTERNS = [
  /^\(.*\)$/, // (Potentiométrie indirecte)
  /^Objectif/i,
  /^Intervalle/i,
  /^Classification/i,
  /^Stade/i,
  /^Attention/i,
  /^Changement/i,
  /^Technique de/i,
  /^Le calcul/i,
  /^Mise à jour/i,
  /^Valeurs recommandées/i,
  /^Par voie de/i,
  /^Interprétation/i,
  /^INFORMATION/i,
  /^Merci de/i,
  /^Analyse/i,
  /^Cause\s*:/i,
  /^NON CONFORMITÉ/i,
  /^Certaine/i,
  /^\*\*\* FIN/,
  /^Edité le/i,
  /^Prescrit par/i,
  /^Double à/i,
  /^Prélevé/i,
  /^Date de naissance/i,
  /^Nom de naissance/i,
  /^Tel\. patient/i,
  /^INS\s*:/i,
  /^Dossier n°/i,
  /^Laboratoire accr/i,
  /^Seules certaines/i,
  /^couvertes par/i,
  /^Validé par/i,
  /^Novelab S\.E\.L/i,
  /^La société Novelab/i,
  /^en tant que personne/i,
  /^CR_NOVELAB/i,
  /^Page \d+/i,
  /^M\.\s+[A-Z]/, // M. ALCARAZ Florian (en-tête)
  /^\d{2}:\d{2}$/, // heures seules (08:45)
  /^LABORATOIRE/i,
  /^NOVELAB/i,
  /^Z\.A\./i,
  /^Tél\./i,
  /^amberieu@/i,
  /^Dr\s+/i,
  /^H\d{6}/, // numéro de dossier
  /^Genre\s*:/i,
  /^\d+[−-]\d+[−-]\d{4}$/, // dates isolées dans la colonne Antériorités
  /^Examen\(s\)/i,
  /^Modalités/i,
  /^Heure du prélèvement/i,
  /^Traitement antibiotique/i,
  /^Absence de/i,
  /^www\./i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Supprime les accents pour la comparaison */
const removeAccents = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Vérifie si un texte correspond à un en-tête de section */
const isSectionHeader = (text: string): boolean => {
  const normalized = removeAccents(text.trim()).toUpperCase();
  return KNOWN_SECTIONS.some(
    (s) => normalized === s || normalized.startsWith(s),
  );
};

/** Vérifie si une ligne doit être ignorée */
const shouldSkipLine = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return SKIP_PATTERNS.some((pat) => pat.test(trimmed));
};

/** Parse un texte de plage normative et extrait min/max */
const parseRange = (
  rangeText: string,
): { normalRange: string; normalMin?: number; normalMax?: number } => {
  const cleaned = rangeText.replace(/[()]/g, "").trim();

  // Pattern "< valeur"
  const ltMatch = cleaned.match(/^<\s*([\d,.]+)$/);
  if (ltMatch) {
    return {
      normalRange: cleaned,
      normalMin: undefined,
      normalMax: parseFloat(ltMatch[1].replace(",", ".")),
    };
  }

  // Pattern "> valeur"
  const gtMatch = cleaned.match(/^>\s*([\d,.]+)$/);
  if (gtMatch) {
    return {
      normalRange: cleaned,
      normalMin: parseFloat(gtMatch[1].replace(",", ".")),
      normalMax: undefined,
    };
  }

  // Pattern "min − max" (tiret normal ou tiret long)
  const rangeMatch = cleaned.match(/([\d,.]+)\s*[−\-–]\s*([\d,.]+)/);
  if (rangeMatch) {
    return {
      normalRange: cleaned,
      normalMin: parseFloat(rangeMatch[1].replace(",", ".")),
      normalMax: parseFloat(rangeMatch[2].replace(",", ".")),
    };
  }

  return { normalRange: cleaned };
};

/** Parse une valeur numérique (gère les virgules, >90, etc.) */
const parseNumericValue = (text: string): number | null => {
  const cleaned = text.replace(/[><]/g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// ─── Extraction principale ───────────────────────────────────────────────────

/**
 * Extrait les éléments texte positionnés de toutes les pages du PDF.
 * Regroupe les items par coordonnée Y (±Y_TOLERANCE) pour reconstituer
 * les lignes logiques du document tabulaire.
 */
const extractPositionedLines = async (
  pdf: pdfjsLib.PDFDocumentProxy,
): Promise<{ lines: LogicalLine[]; fullText: string; pages: string[] }> => {
  const allItems: TextItem[] = [];
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageItems: TextItem[] = [];

    (textContent.items as any[]).forEach((item) => {
      const text = item.str?.trim();
      if (!text || text === "#") return; // ignorer vides et marques accréditation

      pageItems.push({
        text: item.str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
      });
    });

    // Texte brut de la page (pour compatibilité)
    const pageText = pageItems
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .map((it) => it.text)
      .join(" ");
    pages.push(pageText);

    // Décaler le Y pour éviter les collisions entre pages
    // (les pages ont des Y indépendants → on les empile)
    const yOffset = (i - 1) * 1000;
    pageItems.forEach((it) => {
      it.y = it.y - yOffset; // Y décroissant = haut vers bas
      allItems.push(it);
    });
  }

  // Regrouper par Y (tolérance ±Y_TOLERANCE)
  const groups: Map<number, TextItem[]> = new Map();

  // Trier par Y décroissant (haut → bas dans le PDF)
  const sorted = [...allItems].sort((a, b) => b.y - a.y);

  sorted.forEach((item) => {
    let foundGroup = false;
    const groupKeys = Array.from(groups.keys());
    for (let i = 0; i < groupKeys.length; i++) {
      const groupY = groupKeys[i];
      if (Math.abs(item.y - groupY) <= Y_TOLERANCE) {
        groups.get(groupY)!.push(item);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.set(item.y, [item]);
    }
  });

  // Construire les lignes logiques
  const lines: LogicalLine[] = [];

  Array.from(groups.entries()).forEach(([y, items]) => {
    const sortedItems = items.sort((a, b) => a.x - b.x);

    // Classifier par colonne
    const nameItems = sortedItems.filter(
      (it) => it.x < COL.NAME_END && it.text.trim(),
    );
    const valueItems = sortedItems.filter(
      (it) => it.x >= COL.VALUE_START && it.x < COL.VALUE_END && it.text.trim(),
    );
    const unitItems = sortedItems.filter(
      (it) => it.x >= COL.UNIT_START && it.x < COL.UNIT_END && it.text.trim(),
    );
    const rangeItems = sortedItems.filter(
      (it) => it.x >= COL.RANGE_START && it.x < COL.RANGE_END && it.text.trim(),
    );

    lines.push({
      y,
      items: sortedItems,
      nameText: nameItems
        .map((it) => it.text.trim())
        .join(" ")
        .trim(),
      valueText: valueItems
        .map((it) => it.text.trim())
        .join(" ")
        .trim(),
      unitText: unitItems
        .map((it) => it.text.trim())
        .join(" ")
        .trim(),
      rangeText: rangeItems
        .map((it) => it.text.trim())
        .join(" ")
        .trim(),
    });
  });

  // Trier les lignes de haut en bas (Y décroissant car vient de pages empilées)
  lines.sort((a, b) => b.y - a.y);

  // Texte complet pour compatibilité
  let fullText = lines.map((l) => l.nameText).join("\n");
  const finIdx = fullText.indexOf("*** FIN DU COMPTE RENDU ***");
  if (finIdx !== -1) fullText = fullText.substring(0, finIdx).trim();

  return { lines, fullText, pages };
};

/**
 * Extrait la date de prélèvement depuis les lignes.
 * Cherche "Prélevé par … le DD−MM−YYYY" ou "Prélevé(e) le DD−MM−YYYY"
 */
const extractSamplingDate = (lines: LogicalLine[]): string | undefined => {
  for (const line of lines) {
    const text = line.nameText;

    // "Prélevé par NOVELAB … le 19−09−2025"
    const match1 = text.match(
      /Prélevé.*?le\s+(\d{1,2}[−\-–]\d{1,2}[−\-–]\d{4})/i,
    );
    if (match1) return match1[1];

    // "Prélevé(e) le 19−09−2025 08:45"
    const match2 = text.match(
      /Prélevé\(e\)\s+le\s+(\d{1,2}[−\-–]\d{1,2}[−\-–]\d{4})/i,
    );
    if (match2) return match2[1];

    // "Date du prélèvement :" avec la date dans la colonne valeur (page microbiologie)
    if (/Date du prélèvement/i.test(text)) {
      const dateInLine = line.items
        .map((it) => it.text)
        .join(" ")
        .match(/(\d{1,2}[−\-–]\d{1,2}[−\-–]\d{4})/);
      if (dateInLine) return dateInLine[1];
    }
  }

  // Fallback : "Dossier n° … du DD−MM−YYYY"
  for (const line of lines) {
    const allText = line.items.map((it) => it.text).join(" ");
    const dossierMatch = allText.match(
      /Dossier\s+n°.*?du\s+(\d{1,2}[−\-–]\d{1,2}[−\-–]\d{4})/i,
    );
    if (dossierMatch) return dossierMatch[1];
  }

  return undefined;
};

/**
 * Extrait tous les résultats d'analyses (toutes sections confondues)
 * depuis les lignes logiques positionnées.
 */
const extractAllResults = (lines: LogicalLine[]): BiochemistryResult[] => {
  const results: BiochemistryResult[] = [];
  let currentSection = "GÉNÉRAL";
  let lastTestName = "";
  let reachedEnd = false;

  for (const line of lines) {
    if (reachedEnd) break;

    const nameText = line.nameText;

    // Détection fin du compte rendu
    if (nameText.includes("*** FIN DU COMPTE RENDU ***")) {
      reachedEnd = true;
      break;
    }

    // Détection en-tête de section
    if (isSectionHeader(nameText) && !line.valueText) {
      currentSection = nameText.trim();
      continue;
    }

    // Sous-sections à ignorer (HÉMOGRAMME, CYTOLOGIE, etc.)
    if (
      !line.valueText &&
      !line.rangeText &&
      (nameText.startsWith("HÉMOGRAMME") ||
        nameText.startsWith("CYTOLOGIE") ||
        nameText === "Valeurs de référence")
    ) {
      continue;
    }

    // Ignorer les lignes sans intérêt
    if (shouldSkipLine(nameText)) continue;

    // ── Extraction d'un résultat ──

    // Pas de valeur numérique → passer
    if (!line.valueText) continue;

    const numericValue = parseNumericValue(line.valueText);
    if (numericValue === null) continue;

    // Pas d'unité → probablement un artefact
    if (!line.unitText) continue;

    // ── Déterminer le nom du test ──
    let testName = "";

    // Cas "soit :" → valeur 24h du test précédent
    if (/^soit\s*:?$/i.test(nameText.trim())) {
      if (lastTestName) {
        testName = `${lastTestName} (24h)`;
      } else {
        continue;
      }
    }
    // Cas "Polynucléaires … XX % soit : VALUE" → le nom est avant le premier ":"
    // et la valeur absolue est dans la colonne valeur
    else if (nameText.includes(":")) {
      // Extraire le nom avant le premier ":"
      const colonIdx = nameText.indexOf(":");
      testName = nameText.substring(0, colonIdx).trim();

      // Nettoyer : enlever les textes parasites
      testName = testName
        .replace(/sériques?/gi, "")
        .replace(/à jeun/gi, "(à jeun)")
        .replace(/\s+/g, " ")
        .trim();
    }
    // Cas sans ":" (ex: "CHOLESTÉROL LDL calculé", "Rapport ...")
    else {
      testName = nameText.trim();
    }

    if (!testName) continue;

    // Ignorer les doublons de conversion (ex: ligne secondaire g/l sous mmol/l)
    // Détection : pas de nom de test (juste valeur + unité) et ligne très proche
    // du test précédent → déjà géré par l'absence de ":" dans nameText

    // ── Parser la plage normative ──
    let rangeInfo: ReturnType<typeof parseRange> | undefined;
    if (line.rangeText) {
      rangeInfo = parseRange(line.rangeText);
    }

    const result: BiochemistryResult = {
      testName,
      value: numericValue,
      unit: line.unitText,
      section: currentSection,
      normalRange: rangeInfo?.normalRange,
      normalMin: rangeInfo?.normalMin,
      normalMax: rangeInfo?.normalMax,
    };

    results.push(result);
    // Mémoriser le dernier nom de test (pour les "soit :")
    if (!/^soit/i.test(nameText)) {
      lastTestName = testName;
    }
  }

  return results;
};

// ─── API publique ────────────────────────────────────────────────────────────

export const extractPDFText = async (
  file: File,
  password?: string,
): Promise<PDFData> => {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev)
    console.log("🔍 Extraction PDF:", file.name, `(${file.size} octets)`);

  const arrayBuffer = await file.arrayBuffer();
  const pdfPassword = password ?? "";

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    password: pdfPassword,
    // Désactive les requêtes réseau pendant le parsing (chargement déjà en mémoire).
    // Essentiel pour le fonctionnement hors ligne.
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
  }).promise;

  if (isDev) console.log(`📄 ${pdf.numPages} page(s) détectée(s)`);

  // 1. Extraire les lignes positionnées
  const { lines, fullText, pages } = await extractPositionedLines(pdf);
  if (isDev) console.log(`📐 ${lines.length} lignes logiques reconstituées`);

  // 2. Extraire la date de prélèvement
  const samplingDate = extractSamplingDate(lines);
  if (isDev && samplingDate) {
    console.log("📅 Date de prélèvement:", samplingDate);
  }

  // 3. Extraire tous les résultats d'analyses
  const biochemistryData = extractAllResults(lines);

  const sections = Array.from(new Set(biochemistryData.map((r) => r.section)));

  if (isDev) {
    console.log(
      `✅ ${biochemistryData.length} paramètre(s) extrait(s) dans ${sections.length} section(s)`,
    );

    // Log détaillé par section (dev uniquement)
    sections.forEach((section) => {
      const sectionResults = biochemistryData.filter(
        (r) => r.section === section,
      );
      console.log(`\n📋 ${section} (${sectionResults.length} tests):`);
      sectionResults.forEach((r) => {
        const status =
          r.normalMax !== undefined && r.value > r.normalMax
            ? "🔴 ÉLEVÉ"
            : r.normalMin !== undefined && r.value < r.normalMin
              ? "🔵 BAS"
              : "🟢";
        console.log(
          `  ${status} ${r.testName} = ${r.value} ${r.unit}` +
            (r.normalRange ? ` (réf: ${r.normalRange})` : ""),
        );
      });
    });
  }

  return {
    fileName: file.name,
    text: fullText,
    pageCount: pdf.numPages,
    pages,
    samplingDate,
    biochemistryData,
  };
};
