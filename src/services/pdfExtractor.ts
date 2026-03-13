import * as pdfjsLib from "pdfjs-dist";
import {
  findTestByName,
  isKnownUnit,
  normalizeName,
} from "../constants/labTestDictionary";

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

/** Bornes de colonnes détectées dynamiquement */
interface ColumnLayout {
  nameEnd: number;
  valueStart: number;
  valueEnd: number;
  unitStart: number;
  unitEnd: number;
  rangeStart: number;
  rangeEnd: number;
}

/** Ligne logique reconstituée (items groupés par Y) */
interface LogicalLine {
  y: number;
  items: TextItem[];
  nameText: string;
  valueText: string;
  unitText: string;
  rangeText: string;
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

/** Ligne candidate rejetée (ressemblait à un résultat mais nom non reconnu) */
export interface SkippedLine {
  name: string;
  value: string;
  unit: string;
}

export interface PDFData {
  fileName: string;
  text: string;
  pageCount: number;
  pages: string[];
  samplingDate?: string;
  biochemistryData: BiochemistryResult[];
  /** Lignes qui ressemblaient à des résultats mais dont le nom n'est pas dans le dictionnaire */
  skippedLines: SkippedLine[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Tolérance Y (en points PDF) pour regrouper les items sur la même ligne */
const Y_TOLERANCE = 4;

/** Colonnes par défaut (Novelab) — utilisées en fallback si la détection échoue */
const DEFAULT_COL: ColumnLayout = {
  nameEnd: 270,
  valueStart: 270,
  valueEnd: 320,
  unitStart: 320,
  unitEnd: 380,
  rangeStart: 375,
  rangeEnd: 460,
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
  "HEMOSTASE",
  "ELECTROPHORESE",
  "ELECTROPHORESE DES PROTEINES",
  "MARQUEURS TUMORAUX",
  "BILAN THYROIDIEN",
  "BILAN HEPATIQUE",
  "BILAN LIPIDIQUE",
  "BILAN MARTIAL",
  "BILAN RENAL",
  "IONOGRAMME",
  "GAZOMETRIE",
  "VITAMINES",
  "BILAN PHOSPHOCALCIQUE",
  "AUTO-IMMUNITE",
  "ALLERGIE",
  "EXAMENS URINAIRES",
  "EXAMENS SANGUINS",
  "EXAMENS TRANSMIS",
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

// ─── Détection dynamique de colonnes ─────────────────────────────────────────

/** En-têtes de colonnes reconnus pour détecter la structure du tableau */
const COLUMN_HEADER_PATTERNS: {
  type: "value" | "unit" | "range" | "name";
  patterns: RegExp[];
}[] = [
  {
    type: "value",
    patterns: [/^R[ée]sultat/i, /^Valeur/i, /^Dosage/i, /^Résultat\s*$/i],
  },
  {
    type: "unit",
    patterns: [/^Unit[ée]/i, /^Unité/i],
  },
  {
    type: "range",
    patterns: [
      /^Normes?/i,
      /^R[ée]f[ée]rence/i,
      /^Val\.\s*r[ée]f/i,
      /^Valeurs?\s*(de\s*)?r[ée]f/i,
      /^Intervalle/i,
    ],
  },
  {
    type: "name",
    patterns: [
      /^Analyse/i,
      /^D[ée]signation/i,
      /^Examen/i,
      /^Libell[ée]/i,
      /^Param[èe]tre/i,
    ],
  },
];

/**
 * Tente de détecter la disposition des colonnes automatiquement en
 * cherchant des en-têtes de tableau connus.
 *
 * Retourne les bornes X détectées, ou le layout par défaut (Novelab).
 */
const detectColumnLayout = (allItems: TextItem[]): ColumnLayout => {
  const detected: Partial<Record<"value" | "unit" | "range" | "name", number>> =
    {};

  // Chercher les en-têtes de colonnes dans les items du PDF
  for (const item of allItems) {
    const text = item.text.trim();
    if (!text) continue;

    for (const { type, patterns } of COLUMN_HEADER_PATTERNS) {
      if (detected[type] !== undefined) continue;
      for (const pat of patterns) {
        if (pat.test(text)) {
          detected[type] = item.x;
          break;
        }
      }
    }

    // Arrêter si tout est trouvé
    if (
      detected.value !== undefined &&
      detected.unit !== undefined &&
      detected.range !== undefined
    ) {
      break;
    }
  }

  // Si au moins « valeur » est détecté, construire un layout dynamique
  if (detected.value !== undefined) {
    const valueX = detected.value;
    const unitX = detected.unit ?? valueX + 50;
    const rangeX = detected.range ?? unitX + 55;
    const nameEnd = detected.name !== undefined ? detected.name + 200 : valueX;

    return {
      nameEnd: Math.max(nameEnd, valueX),
      valueStart: valueX,
      valueEnd: unitX,
      unitStart: unitX,
      unitEnd: rangeX,
      rangeStart: rangeX - 5, // petit chevauchement
      rangeEnd: rangeX + 85,
    };
  }

  // Aucun en-tête trouvé → fallback sur les colonnes par défaut Novelab
  return DEFAULT_COL;
};

// ─── Extraction principale ───────────────────────────────────────────────────

/**
 * Extrait les éléments texte positionnés de toutes les pages du PDF.
 * Regroupe les items par coordonnée Y (±Y_TOLERANCE) pour reconstituer
 * les lignes logiques du document tabulaire.
 *
 * Utilise la détection dynamique de colonnes pour s'adapter à
 * différents formats de laboratoire.
 */
const extractPositionedLines = async (
  pdf: pdfjsLib.PDFDocumentProxy,
): Promise<{
  lines: LogicalLine[];
  fullText: string;
  pages: string[];
  layout: ColumnLayout;
}> => {
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

  // ── Détection dynamique des colonnes ──
  const layout = detectColumnLayout(allItems);

  // Construire les lignes logiques
  const lines: LogicalLine[] = [];

  Array.from(groups.entries()).forEach(([y, items]) => {
    const sortedItems = items.sort((a, b) => a.x - b.x);

    // Classifier par colonne (positions dynamiques)
    const nameItems = sortedItems.filter(
      (it) => it.x < layout.nameEnd && it.text.trim(),
    );
    const valueItems = sortedItems.filter(
      (it) =>
        it.x >= layout.valueStart && it.x < layout.valueEnd && it.text.trim(),
    );
    const unitItems = sortedItems.filter(
      (it) =>
        it.x >= layout.unitStart && it.x < layout.unitEnd && it.text.trim(),
    );
    const rangeItems = sortedItems.filter(
      (it) =>
        it.x >= layout.rangeStart && it.x < layout.rangeEnd && it.text.trim(),
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

  return { lines, fullText, pages, layout };
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
const extractAllResults = (
  lines: LogicalLine[],
): { results: BiochemistryResult[]; skippedLines: SkippedLine[] } => {
  const results: BiochemistryResult[] = [];
  const skippedLines: SkippedLine[] = [];
  let currentSection = "GÉNÉRAL";
  let lastTestName = "";

  for (const line of lines) {
    const nameText = line.nameText;

    // D\u00e9tection fin du compte rendu \u2014 ne pas stopper, juste r\u00e9initialiser la section
    // (les PDF multi-laboratoire peuvent avoir un \"*** FIN ***\" suivi d'analyses
    // transmises par un autre labo sur les pages suivantes)
    if (nameText.includes("*** FIN DU COMPTE RENDU ***")) {
      currentSection = "G\u00c9N\u00c9RAL";
      continue;
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

    // ── Canonicaliser le nom via le dictionnaire ──
    const dictEntry = findTestByName(testName);
    if (dictEntry) {
      testName = dictEntry.canonicalName;
    } else {
      // Le test n'est pas reconnu dans le dictionnaire → ignorer
      // pour éviter les faux positifs (ex: texte d'un PDF de dépistage drogue)
      skippedLines.push({
        name: testName,
        value: line.valueText,
        unit: line.unitText,
      });
      continue;
    }

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

  return { results, skippedLines };
};

// ─── Passe regex de rattrapage ───────────────────────────────────────────────

/**
 * Regex qui capture une ligne d'analyse typique dans du texte brut :
 *   NOM_DU_TEST  VALEUR  UNITÉ  [PLAGE]
 *
 * Groupes :
 *   1 → nom du test (lettres, espaces, accents, parenthèses…)
 *   2 → valeur numérique (éventuellement précédée de > ou <)
 *   3 → unité (g/L, mmol/l, µmol/l, %, 10^9 /L …)
 *   4 → plage normative optionnelle (reste de la ligne)
 *
 * Note : le groupe unité est greedy (sans \s) pour capturer l'unité
 * complète (ex: g/L) avant de s'arrêter à l'espace suivant.
 */
const RESULT_LINE_RE =
  /([A-ZÀ-ÿa-zà-ÿ][\wÀ-ÿà-ÿ\s()/'.°-]{2,}?)\s+([<>]?\s*\d+[.,]?\d*)\s+((?:[a-zA-Zµμ%°/^.*][\w/^.*µμ°%]{0,15})(?:\s*(?:10\s*[³^]\s*\/?\s*[a-zA-Z]+))?)(?:\s+([\d,.<>−\-–\s]+))?/g;

/**
 * Seconde passe d'extraction : analyse le texte brut page par page
 * avec des regex pour trouver les résultats que l'extraction positionnelle
 * aurait pu manquer (format de labo inconnu, colonnes mal détectées, etc.).
 *
 * Seuls les résultats dont le nom est reconnu dans le dictionnaire sont retenus,
 * afin d'éviter les faux positifs.
 */
const extractViaRegexFallback = (
  pages: string[],
  alreadyFoundNames: Set<string>,
): BiochemistryResult[] => {
  const results: BiochemistryResult[] = [];
  let currentSection = "GÉNÉRAL";

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    let pageText = pages[pageIdx];
    // \u2500\u2500 Nettoyage du texte brut pour am\u00e9liorer la d\u00e9tection \u2500\u2500
    // Supprimer les marques d'accr\u00e9ditation (#) et symboles trademark
    pageText = pageText.replace(/[#\u00ae\u2122\u00a9]/g, " ");
    // Fusionner les nombres d\u00e9cimaux fragment\u00e9s : "0 , 66" \u2192 "0,66"
    pageText = pageText.replace(/(\d)\s*,\s*(\d)/g, "$1,$2");
    // Fusionner les nombres d\u00e9cimaux fragment\u00e9s avec point : "0 . 66" \u2192 "0.66"
    pageText = pageText.replace(/(\d)\s*\.\s*(\d)/g, "$1.$2");
    // Supprimer les caract\u00e8res isol\u00e9s parasites entre espaces (ex: " l " stray)
    pageText = pageText.replace(/\s[a-z]\s(?=\d)/gi, " ");
    // Normaliser les espaces multiples
    pageText = pageText.replace(/\s{2,}/g, "  ");
    // Découper grossièrement en « lignes » (le texte brut est un long string)
    const tokens = pageText.split(/\s{2,}/);

    // Reconstruire des fragments de ~120 caractères chevauchants pour la regex
    const chunks: string[] = [];
    let buf = "";
    for (const tok of tokens) {
      buf = buf ? `${buf} ${tok}` : tok;
      if (buf.length > 100) {
        chunks.push(buf);
        buf = "";
      }
    }
    if (buf) chunks.push(buf);

    // Aussi essayer le texte page entier avec des regex ligne par ligne
    const linesByNewline = pageText.split(/\n/);
    chunks.push(...linesByNewline);

    for (const chunk of chunks) {
      // Détection de section
      const normalizedChunk = removeAccents(chunk.trim()).toUpperCase();
      if (
        KNOWN_SECTIONS.some(
          (s) => normalizedChunk === s || normalizedChunk.startsWith(s),
        )
      ) {
        currentSection = chunk.trim();
        continue;
      }

      // Itérer sur TOUS les matches du chunk (pas juste le premier)
      for (const m of chunk.matchAll(RESULT_LINE_RE)) {
        const rawName = m[1].trim();
        const rawValue = m[2].trim();
        const rawUnit = m[3].trim();
        const rawRange = m[4]?.trim();

        // Valider le nom contre le dictionnaire
        const dictEntry = findTestByName(rawName);
        if (!dictEntry) continue;

        // Ne pas rajouter un test déjà extrait par la passe positionnelle
        const canonicalNorm = normalizeName(dictEntry.canonicalName);
        const rawNorm = normalizeName(rawName);
        if (
          alreadyFoundNames.has(canonicalNorm) ||
          alreadyFoundNames.has(rawNorm)
        )
          continue;

        // Valider l'unité
        if (!isKnownUnit(rawUnit)) continue;

        const numericValue = parseNumericValue(rawValue);
        if (numericValue === null) continue;

        let rangeInfo: ReturnType<typeof parseRange> | undefined;
        if (rawRange) {
          rangeInfo = parseRange(rawRange);
        }

        results.push({
          testName: dictEntry.canonicalName,
          value: numericValue,
          unit: rawUnit,
          section: dictEntry.section ?? currentSection,
          normalRange: rangeInfo?.normalRange,
          normalMin: rangeInfo?.normalMin,
          normalMax: rangeInfo?.normalMax,
        });

        alreadyFoundNames.add(canonicalNorm);
      }
    }
  }

  return results;
};

// ─── API publique ────────────────────────────────────────────────────────────

export const extractPDFText = async (
  file: File,
  password?: string,
): Promise<PDFData> => {
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

  // 1. Extraire les lignes positionnées
  const { lines, fullText, pages } = await extractPositionedLines(pdf);

  // 2. Extraire la date de prélèvement
  const samplingDate = extractSamplingDate(lines);

  // 3. Extraire tous les résultats d'analyses (passe positionnelle)
  const { results: biochemistryData, skippedLines } = extractAllResults(lines);

  // 4. Passe regex de rattrapage : chercher les résultats manqués
  const alreadyFoundNames = new Set(
    biochemistryData.map((r) => normalizeName(r.testName)),
  );
  const fallbackResults = extractViaRegexFallback(pages, alreadyFoundNames);

  // Fusionner les résultats
  const allResults = [...biochemistryData, ...fallbackResults];

  return {
    fileName: file.name,
    text: fullText,
    pageCount: pdf.numPages,
    pages,
    samplingDate,
    biochemistryData: allResults,
    skippedLines,
  };
};
