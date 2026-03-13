/**
 * Dictionnaire exhaustif de tests de laboratoire français.
 *
 * Chaque entrée contient :
 *  - canonicalName : nom normalisé affiché
 *  - aliases       : variantes connues (accents, abréviations, noms longs…)
 *  - section       : section attendue (hématologie, biochimie…)
 *  - unit          : unité courante (pour validation)
 *
 * Les alias sont comparés en MAJUSCULES SANS ACCENTS. L'ordre n'importe pas.
 *
 * ⚠ Les noms ici sont des termes médicaux courants, non protégés par copyright.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LabTestEntry {
  canonicalName: string;
  aliases: string[];
  section: string;
  units: string[];
}

// ─── Helpers publics ─────────────────────────────────────────────────────────

/** Supprime accents et met en majuscules */
export const normalizeName = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

// ─── Dictionnaire ────────────────────────────────────────────────────────────

export const LAB_TEST_DICTIONARY: LabTestEntry[] = [
  // ════════════════════════════════════════════════════════════════════════
  //  HÉMATOLOGIE — Hémogramme (NFS)
  // ════════════════════════════════════════════════════════════════════════
  {
    canonicalName: "Leucocytes",
    aliases: ["LEUCOCYTES", "GLOBULES BLANCS", "GB", "WBC", "LEUCOCYTE"],
    section: "HEMATOLOGIE",
    units: ["G/L", "10^9/L", "/mm3"],
  },
  {
    canonicalName: "Hématies",
    aliases: ["HEMATIES", "GLOBULES ROUGES", "GR", "RBC", "ERYTHROCYTES"],
    section: "HEMATOLOGIE",
    units: ["T/L", "10^12/L", "M/mm3"],
  },
  {
    canonicalName: "Hémoglobine",
    aliases: ["HEMOGLOBINE", "HB", "HGB"],
    section: "HEMATOLOGIE",
    units: ["g/dL", "g/L", "g/100mL"],
  },
  {
    canonicalName: "Hématocrite",
    aliases: ["HEMATOCRITE", "HT", "HCT"],
    section: "HEMATOLOGIE",
    units: ["%", "L/L"],
  },
  {
    canonicalName: "VGM",
    aliases: ["VGM", "VOLUME GLOBULAIRE MOYEN", "MCV"],
    section: "HEMATOLOGIE",
    units: ["fL", "µm3"],
  },
  {
    canonicalName: "TCMH",
    aliases: ["TCMH", "TENEUR CORPUSCULAIRE MOYENNE EN HEMOGLOBINE", "MCH"],
    section: "HEMATOLOGIE",
    units: ["pg"],
  },
  {
    canonicalName: "CCMH",
    aliases: [
      "CCMH",
      "CONCENTRATION CORPUSCULAIRE MOYENNE EN HEMOGLOBINE",
      "MCHC",
    ],
    section: "HEMATOLOGIE",
    units: ["g/dL", "g/L", "%"],
  },
  {
    canonicalName: "IDR",
    aliases: [
      "IDR",
      "INDICE DE DISTRIBUTION DES GLOBULES ROUGES",
      "RDW",
      "IDR-CV",
      "IDR-SD",
    ],
    section: "HEMATOLOGIE",
    units: ["%", "fL"],
  },
  {
    canonicalName: "Plaquettes",
    aliases: ["PLAQUETTES", "THROMBOCYTES", "PLT", "PLQ"],
    section: "HEMATOLOGIE",
    units: ["G/L", "10^9/L", "/mm3"],
  },
  {
    canonicalName: "VMP",
    aliases: ["VMP", "VOLUME MOYEN PLAQUETTAIRE", "MPV"],
    section: "HEMATOLOGIE",
    units: ["fL"],
  },
  {
    canonicalName: "Réticulocytes",
    aliases: ["RETICULOCYTES", "RETIC"],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "‰"],
  },

  // ── Formule leucocytaire ──
  {
    canonicalName: "Polynucléaires neutrophiles",
    aliases: [
      "POLYNUCLEAIRES NEUTROPHILES",
      "PNN",
      "NEUTROPHILES",
      "POLY NEUTROPHILES",
      "GRANULOCYTES NEUTROPHILES",
    ],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "/mm3"],
  },
  {
    canonicalName: "Polynucléaires éosinophiles",
    aliases: [
      "POLYNUCLEAIRES EOSINOPHILES",
      "PNE",
      "EOSINOPHILES",
      "POLY EOSINOPHILES",
      "GRANULOCYTES EOSINOPHILES",
    ],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "/mm3"],
  },
  {
    canonicalName: "Polynucléaires basophiles",
    aliases: [
      "POLYNUCLEAIRES BASOPHILES",
      "PNB",
      "BASOPHILES",
      "POLY BASOPHILES",
      "GRANULOCYTES BASOPHILES",
    ],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "/mm3"],
  },
  {
    canonicalName: "Lymphocytes",
    aliases: ["LYMPHOCYTES", "LYMPHO"],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "/mm3"],
  },
  {
    canonicalName: "Monocytes",
    aliases: ["MONOCYTES", "MONO"],
    section: "HEMATOLOGIE",
    units: ["G/L", "%", "/mm3"],
  },
  {
    canonicalName: "Cellules immatures",
    aliases: [
      "CELLULES IMMATURES",
      "BLASTES",
      "MYELOCYTES",
      "METAMYELOCYTES",
      "PROMYELOCYTES",
    ],
    section: "HEMATOLOGIE",
    units: ["G/L", "%"],
  },
  {
    canonicalName: "Grandes cellules immatures",
    aliases: ["GRANDES CELLULES IMMATURES", "LUC", "CELLULES ATYPIQUES"],
    section: "HEMATOLOGIE",
    units: ["%", "G/L"],
  },

  // ── Vitesse de sédimentation ──
  {
    canonicalName: "VS",
    aliases: [
      "VS",
      "VITESSE DE SEDIMENTATION",
      "VSG",
      "VS 1H",
      "VS 2H",
      "VITESSE SEDIMENTATION",
    ],
    section: "HEMATOLOGIE",
    units: ["mm", "mm/h", "mm/1h", "mm/2h"],
  },

  // ════════════════════════════════════════════════════════════════════════
  //  COAGULATION
  // ════════════════════════════════════════════════════════════════════════
  {
    canonicalName: "TP",
    aliases: [
      "TP",
      "TAUX DE PROTHROMBINE",
      "PROTHROMBINE",
      "TEMPS DE PROTHROMBINE",
    ],
    section: "COAGULATION",
    units: ["%", "s"],
  },
  {
    canonicalName: "INR",
    aliases: ["INR", "INTERNATIONAL NORMALIZED RATIO", "RAPPORT NORMALISE"],
    section: "COAGULATION",
    units: [""],
  },
  {
    canonicalName: "TCA",
    aliases: [
      "TCA",
      "TEMPS DE CEPHALINE ACTIVEE",
      "TEMPS DE CEPHALINE ACTIVE",
      "TCK",
      "APTT",
      "TCARATIO",
    ],
    section: "COAGULATION",
    units: ["s", "ratio"],
  },
  {
    canonicalName: "Fibrinogène",
    aliases: ["FIBRINOGENE", "FIBRINOGEN"],
    section: "COAGULATION",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "D-Dimères",
    aliases: ["D-DIMERES", "D DIMERES", "DDIMERES", "D-DIMER"],
    section: "COAGULATION",
    units: ["ng/mL", "µg/L", "mg/L FEU"],
  },
  {
    canonicalName: "Antithrombine III",
    aliases: ["ANTITHROMBINE III", "ANTITHROMBINE", "AT III", "AT3"],
    section: "COAGULATION",
    units: ["%"],
  },

  // ════════════════════════════════════════════════════════════════════════
  //  BIOCHIMIE SANGUINE — Métabolisme glucidique
  // ════════════════════════════════════════════════════════════════════════
  {
    canonicalName: "Glycémie",
    aliases: [
      "GLYCEMIE",
      "GLYCEMIE A JEUN",
      "GLUCOSE",
      "GLUCOSE A JEUN",
      "GLYCEMIE VEINEUSE",
      "GLYCEMIE CAPILLAIRE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Hémoglobine glyquée",
    aliases: [
      "HEMOGLOBINE GLYQUEE",
      "HBA1C",
      "HB A1C",
      "HEMOGLOBINE A1C",
      "HBGLYQUEE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "mmol/mol"],
  },
  {
    canonicalName: "Fructosamine",
    aliases: ["FRUCTOSAMINE", "FRUCTOSAMINES"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L"],
  },
  {
    canonicalName: "Insuline",
    aliases: ["INSULINE", "INSULINEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mUI/L", "µUI/mL", "pmol/L"],
  },
  {
    canonicalName: "Peptide C",
    aliases: ["PEPTIDE C", "C-PEPTIDE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "nmol/L"],
  },

  // ── Fonction rénale ──
  {
    canonicalName: "Créatinine",
    aliases: ["CREATININE", "CREAT", "CREATININEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "µmol/L", "mg/dL"],
  },
  {
    canonicalName: "DFG",
    aliases: [
      "DFG",
      "DEBIT DE FILTRATION GLOMERULAIRE",
      "DFG CKD-EPI",
      "DFG MDRD",
      "CLAIRANCE CREATININE",
      "DFG ESTIME",
      "DFGE",
      "DFGE CKD-EPI",
      "CKD-EPI",
      "MDRD",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["mL/min/1.73m2", "mL/min/1,73m2", "mL/min"],
  },
  {
    canonicalName: "Urée",
    aliases: ["UREE", "UREMIE", "BUN"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Acide urique",
    aliases: ["ACIDE URIQUE", "URICEMIE", "URATE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "µmol/L", "mg/dL"],
  },
  {
    canonicalName: "Cystatine C",
    aliases: ["CYSTATINE C", "CYSTATINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L"],
  },

  // ── Ionogramme ──
  {
    canonicalName: "Sodium",
    aliases: ["SODIUM", "NA", "NA+", "NATREMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mEq/L"],
  },
  {
    canonicalName: "Potassium",
    aliases: ["POTASSIUM", "K", "K+", "KALIEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mEq/L"],
  },
  {
    canonicalName: "Chlore",
    aliases: ["CHLORE", "CL", "CL-", "CHLOREMIE", "CHLORURE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mEq/L"],
  },
  {
    canonicalName: "Bicarbonates",
    aliases: [
      "BICARBONATES",
      "CO2 TOTAL",
      "CO2",
      "HCO3",
      "HCO3-",
      "RESERVES ALCALINES",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mEq/L"],
  },
  {
    canonicalName: "Calcium",
    aliases: ["CALCIUM", "CA", "CA2+", "CALCEMIE", "CALCIUM TOTAL"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Calcium ionisé",
    aliases: ["CALCIUM IONISE", "CA IONISE", "CA++", "CALCIUM LIBRE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Phosphore",
    aliases: ["PHOSPHORE", "PHOSPHOREMIE", "PHOSPHATES", "PHOSPHATEMIE", "PO4"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Magnésium",
    aliases: ["MAGNESIUM", "MG", "MG2+", "MAGNESEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "mmol/L", "mg/dL"],
  },

  // ── Bilan hépatique ──
  {
    canonicalName: "ASAT",
    aliases: [
      "ASAT",
      "ASPARTATE AMINOTRANSFERASE",
      "SGOT",
      "TGO",
      "GOT",
      "AST",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "ALAT",
    aliases: ["ALAT", "ALANINE AMINOTRANSFERASE", "SGPT", "TGP", "GPT", "ALT"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "GGT",
    aliases: [
      "GGT",
      "GAMMA GT",
      "GAMMA-GT",
      "GAMMA GLUTAMYL TRANSFERASE",
      "GAMMA-GLUTAMYL TRANSFERASE",
      "GAMMA GLUTAMYL TRANSPEPTIDASE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "Phosphatases alcalines",
    aliases: ["PHOSPHATASES ALCALINES", "PAL", "ALP", "PHOSPHATASE ALCALINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "Bilirubine totale",
    aliases: ["BILIRUBINE TOTALE", "BILIRUBINE", "BIL TOTALE", "BILIRUBINEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "µmol/L", "mg/dL"],
  },
  {
    canonicalName: "Bilirubine conjuguée",
    aliases: [
      "BILIRUBINE CONJUGUEE",
      "BILIRUBINE DIRECTE",
      "BIL DIRECTE",
      "BIL CONJUGUEE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "µmol/L", "mg/dL"],
  },
  {
    canonicalName: "Bilirubine libre",
    aliases: [
      "BILIRUBINE LIBRE",
      "BILIRUBINE INDIRECTE",
      "BIL INDIRECTE",
      "BIL LIBRE",
      "BILIRUBINE NON CONJUGUEE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "µmol/L"],
  },
  {
    canonicalName: "LDH",
    aliases: ["LDH", "LACTATE DESHYDROGENASE", "LACTICO DESHYDROGENASE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "Albumine",
    aliases: ["ALBUMINE", "ALBUMINEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "g/dL"],
  },
  {
    canonicalName: "Protéines totales",
    aliases: [
      "PROTEINES TOTALES",
      "PROTIDÉMIE",
      "PROTIDES TOTAUX",
      "PROTEINES",
      "PROTIDEMIE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "g/dL"],
  },
  {
    canonicalName: "Pré-albumine",
    aliases: ["PRE-ALBUMINE", "PREALBUMINE", "TRANSTHYRETINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mg/dL"],
  },

  // ── Bilan lipidique ──
  {
    canonicalName: "Cholestérol total",
    aliases: [
      "CHOLESTEROL TOTAL",
      "CHOLESTEROL",
      "CT",
      "CHOLESTEROLEMIE",
      "CHOLESTEROL T",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "HDL Cholestérol",
    aliases: [
      "HDL CHOLESTEROL",
      "HDL",
      "HDL-C",
      "CHOLESTEROL HDL",
      "HDL-CHOLESTEROL",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "LDL Cholestérol",
    aliases: [
      "LDL CHOLESTEROL",
      "LDL",
      "LDL-C",
      "CHOLESTEROL LDL",
      "LDL-CHOLESTEROL",
      "CHOLESTEROL LDL CALCULE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Triglycérides",
    aliases: ["TRIGLYCERIDES", "TG", "TRIGLYC"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Rapport CT/HDL",
    aliases: [
      "RAPPORT CT/HDL",
      "CT/HDL",
      "RAPPORT CHOLESTEROL TOTAL/HDL",
      "INDICE D'ATHEROGENICITE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: [""],
  },
  {
    canonicalName: "Rapport LDL/HDL",
    aliases: ["RAPPORT LDL/HDL", "LDL/HDL"],
    section: "BIOCHIMIE SANGUINE",
    units: [""],
  },
  {
    canonicalName: "Apolipoprotéine A1",
    aliases: ["APOLIPOPROTEINE A1", "APO A1", "APO-A1", "APOA1", "APO A"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L"],
  },
  {
    canonicalName: "Apolipoprotéine B",
    aliases: ["APOLIPOPROTEINE B", "APO B", "APO-B", "APOB"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L"],
  },
  {
    canonicalName: "Lipoprotéine (a)",
    aliases: ["LIPOPROTEINE (A)", "LP(A)", "LIPOPROTEINE A", "LPA"],
    section: "BIOCHIMIE SANGUINE",
    units: ["nmol/L", "mg/dL"],
  },

  // ── Enzymes pancréatiques ──
  {
    canonicalName: "Lipase",
    aliases: ["LIPASE", "LIPASEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "Amylase",
    aliases: ["AMYLASE", "AMYLASEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },

  // ── Enzymes musculaires ──
  {
    canonicalName: "CPK",
    aliases: [
      "CPK",
      "CK",
      "CREATINE PHOSPHOKINASE",
      "CREATINE KINASE",
      "CK TOTALE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L"],
  },
  {
    canonicalName: "CPK-MB",
    aliases: ["CPK-MB", "CK-MB", "CK MB"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/L", "U/L", "ng/mL"],
  },
  {
    canonicalName: "Troponine",
    aliases: [
      "TROPONINE",
      "TROPONINE T",
      "TROPONINE I",
      "TROP T",
      "TROP I",
      "TROPONINE HS",
      "TROPONINE ULTRASENSIBLE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/L", "ng/mL", "µg/L", "pg/mL"],
  },
  {
    canonicalName: "BNP",
    aliases: [
      "BNP",
      "NT-PROBNP",
      "NTPROBNP",
      "NT PRO BNP",
      "BRAIN NATRIURETIC PEPTIDE",
      "PRO-BNP",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["pg/mL", "ng/L", "pmol/L"],
  },
  {
    canonicalName: "Myoglobine",
    aliases: ["MYOGLOBINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µg/L", "ng/mL"],
  },

  // ── Inflammatoire ──
  {
    canonicalName: "CRP",
    aliases: [
      "CRP",
      "PROTEINE C REACTIVE",
      "C-REACTIVE PROTEIN",
      "PCR",
      "CRP ULTRASENSIBLE",
      "CRP-US",
      "CRP HS",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["mg/L", "mg/dL"],
  },
  {
    canonicalName: "Procalcitonine",
    aliases: ["PROCALCITONINE", "PCT"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L"],
  },
  {
    canonicalName: "Ferritine",
    aliases: ["FERRITINE", "FERRITINEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L", "pmol/L"],
  },

  // ── Fer ──
  {
    canonicalName: "Fer sérique",
    aliases: ["FER SERIQUE", "FER", "SIDEREMIE", "FER PLASMATIQUE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "µg/dL", "mg/L"],
  },
  {
    canonicalName: "Transferrine",
    aliases: [
      "TRANSFERRINE",
      "SIDEROPHILINE",
      "CAPACITE TOTALE DE FIXATION",
      "CTF",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "Coefficient de saturation de la transferrine",
    aliases: [
      "COEFFICIENT DE SATURATION DE LA TRANSFERRINE",
      "CST",
      "SATURATION TRANSFERRINE",
      "CS TRANSFERRINE",
      "COEFF SAT TRANSFERRINE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["%"],
  },

  // ── Vitamines ──
  {
    canonicalName: "Vitamine D",
    aliases: [
      "VITAMINE D",
      "25-OH VITAMINE D",
      "25OH VITAMINE D",
      "VIT D",
      "CALCIFEDIOL",
      "25-HYDROXYVITAMINE D",
      "VITAMINE D TOTALE",
      "25 OH D3",
      "25 OH VITAMINE D3",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "nmol/L", "µg/L"],
  },
  {
    canonicalName: "Vitamine B9",
    aliases: ["VITAMINE B9", "FOLATES", "ACIDE FOLIQUE", "FOLATE", "FOLATEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "nmol/L", "µg/L"],
  },
  {
    canonicalName: "Vitamine B12",
    aliases: [
      "VITAMINE B12",
      "COBALAMINE",
      "B12",
      "VIT B12",
      "CYANOCOBALAMINE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["pg/mL", "pmol/L", "ng/L"],
  },

  // ════════════════════════════════════════════════════════════════════════
  //  HORMONOLOGIE
  // ════════════════════════════════════════════════════════════════════════

  // ── Thyroïde ──
  {
    canonicalName: "TSH",
    aliases: [
      "TSH",
      "THYREOSTIMULINE",
      "TSH ULTRASENSIBLE",
      "TSH US",
      "THYROID STIMULATING HORMONE",
    ],
    section: "HORMONOLOGIE",
    units: ["mUI/L", "µUI/mL", "mIU/L"],
  },
  {
    canonicalName: "T3 libre",
    aliases: ["T3 LIBRE", "FT3", "T3L", "TRIIODOTHYRONINE LIBRE"],
    section: "HORMONOLOGIE",
    units: ["pmol/L", "pg/mL", "ng/dL"],
  },
  {
    canonicalName: "T4 libre",
    aliases: ["T4 LIBRE", "FT4", "T4L", "THYROXINE LIBRE"],
    section: "HORMONOLOGIE",
    units: ["pmol/L", "ng/dL", "pg/mL"],
  },
  {
    canonicalName: "Anticorps anti-TPO",
    aliases: [
      "ANTICORPS ANTI-TPO",
      "AC ANTI TPO",
      "ANTI-TPO",
      "ANTI TPO",
      "AC ANTI-THYROPEROXYDASE",
      "ANTICORPS ANTI-THYROPEROXYDASE",
    ],
    section: "HORMONOLOGIE",
    units: ["UI/mL", "kUI/L"],
  },
  {
    canonicalName: "Anticorps anti-thyroglobuline",
    aliases: [
      "ANTICORPS ANTI-THYROGLOBULINE",
      "AC ANTI TG",
      "ANTI-TG",
      "ANTI TG",
      "ANTI-THYROGLOBULINE",
    ],
    section: "HORMONOLOGIE",
    units: ["UI/mL", "kUI/L"],
  },
  {
    canonicalName: "Thyroglobuline",
    aliases: ["THYROGLOBULINE", "TG"],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "µg/L"],
  },

  // ── Hormones sexuelles ──
  {
    canonicalName: "Testostérone",
    aliases: ["TESTOSTERONE", "TESTOSTERONE TOTALE"],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "nmol/L", "ng/dL"],
  },
  {
    canonicalName: "Testostérone biodisponible",
    aliases: [
      "TESTOSTERONE BIODISPONIBLE",
      "TESTOSTERONE LIBRE",
      "TESTOSTERONE BIO",
    ],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "nmol/L", "pg/mL"],
  },
  {
    canonicalName: "Estradiol",
    aliases: ["ESTRADIOL", "E2", "OESTRADIOL", "17-BETA-ESTRADIOL"],
    section: "HORMONOLOGIE",
    units: ["pg/mL", "pmol/L", "ng/L"],
  },
  {
    canonicalName: "Progestérone",
    aliases: ["PROGESTERONE"],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "nmol/L"],
  },
  {
    canonicalName: "FSH",
    aliases: [
      "FSH",
      "HORMONE FOLLICULOSTIMULANTE",
      "FOLLITROPINE",
      "FOLLICLE STIMULATING HORMONE",
    ],
    section: "HORMONOLOGIE",
    units: ["UI/L", "mUI/mL"],
  },
  {
    canonicalName: "LH",
    aliases: ["LH", "HORMONE LUTEINISANTE", "LUTROPINE", "LUTEINIZING HORMONE"],
    section: "HORMONOLOGIE",
    units: ["UI/L", "mUI/mL"],
  },
  {
    canonicalName: "Prolactine",
    aliases: ["PROLACTINE", "PRL"],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "µg/L", "mUI/L"],
  },
  {
    canonicalName: "DHEA-S",
    aliases: [
      "DHEA-S",
      "DHEAS",
      "DHEA SULFATE",
      "SDHEA",
      "S-DHEA",
      "DEHYDROEPIANDROSTERONE SULFATE",
    ],
    section: "HORMONOLOGIE",
    units: ["µg/dL", "µmol/L", "mg/L"],
  },
  {
    canonicalName: "AMH",
    aliases: [
      "AMH",
      "HORMONE ANTI-MULLERIENNE",
      "ANTI-MULLERIAN HORMONE",
      "HORMONE ANTI MULLERIENNE",
    ],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "pmol/L"],
  },
  {
    canonicalName: "Beta-HCG",
    aliases: [
      "BETA-HCG",
      "BHCG",
      "B-HCG",
      "HCG",
      "BETA HCG",
      "GONADOTROPHINE CHORIONIQUE",
    ],
    section: "HORMONOLOGIE",
    units: ["UI/L", "mUI/mL"],
  },

  // ── Surrénales ──
  {
    canonicalName: "Cortisol",
    aliases: ["CORTISOL", "CORTISOLEMIE", "CORTISOL MATIN", "CORTISOL SOIR"],
    section: "HORMONOLOGIE",
    units: ["nmol/L", "µg/dL", "ng/mL"],
  },
  {
    canonicalName: "ACTH",
    aliases: [
      "ACTH",
      "CORTICOTROPINE",
      "ADRENOCORTICOTROPINE",
      "HORMONE ADRENOCORTICOTROPE",
    ],
    section: "HORMONOLOGIE",
    units: ["pg/mL", "pmol/L", "ng/L"],
  },
  {
    canonicalName: "Aldostérone",
    aliases: ["ALDOSTERONE"],
    section: "HORMONOLOGIE",
    units: ["pmol/L", "pg/mL", "ng/dL"],
  },
  {
    canonicalName: "Rénine",
    aliases: ["RENINE", "RENINE ACTIVE", "ACTIVITE RENINE PLASMATIQUE"],
    section: "HORMONOLOGIE",
    units: ["pg/mL", "mUI/L", "ng/L"],
  },

  // ── Métabolisme phosphocalcique ──
  {
    canonicalName: "PTH",
    aliases: ["PTH", "PARATHORMONE", "PTH INTACTE", "HORMONE PARATHYROIDIENNE"],
    section: "HORMONOLOGIE",
    units: ["pg/mL", "ng/L", "pmol/L"],
  },
  {
    canonicalName: "Calcitonine",
    aliases: ["CALCITONINE"],
    section: "HORMONOLOGIE",
    units: ["pg/mL", "ng/L"],
  },

  // ── IGF ──
  {
    canonicalName: "IGF-1",
    aliases: ["IGF-1", "IGF1", "SOMATOMEDINE C", "INSULIN-LIKE GROWTH FACTOR"],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "nmol/L"],
  },

  // ── Hormone de croissance ──
  {
    canonicalName: "GH",
    aliases: [
      "GH",
      "HORMONE DE CROISSANCE",
      "STH",
      "SOMATOTROPINE",
      "GROWTH HORMONE",
    ],
    section: "HORMONOLOGIE",
    units: ["ng/mL", "µg/L", "mUI/L"],
  },

  // ════════════════════════════════════════════════════════════════════════
  //  BIOCHIMIE URINAIRE
  // ════════════════════════════════════════════════════════════════════════
  {
    canonicalName: "Microalbuminurie",
    aliases: [
      "MICROALBUMINURIE",
      "ALBUMINE URINAIRE",
      "ALBUMINURIE",
      "MICROALBUMINE",
    ],
    section: "BIOCHIMIE URINAIRE",
    units: ["mg/L", "mg/24h", "mg/g créat"],
  },
  {
    canonicalName: "Protéinurie",
    aliases: [
      "PROTEINURIE",
      "PROTEINES URINAIRES",
      "PROTEINURIE DES 24H",
      "PROTEINURIE 24H",
    ],
    section: "BIOCHIMIE URINAIRE",
    units: ["g/L", "g/24h", "mg/24h"],
  },
  {
    canonicalName: "Créatinine urinaire",
    aliases: [
      "CREATININE URINAIRE",
      "CREATININURIE",
      "CREAT URINAIRE",
      "CREATININE U",
    ],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "g/L", "g/24h", "mmol/24h"],
  },
  {
    canonicalName: "Rapport albumine/créatinine",
    aliases: [
      "RAPPORT ALBUMINE/CREATININE",
      "RAC",
      "ALBUMINE/CREATININE",
      "RATIO ALBUMINE CREATININE",
      "ACR",
    ],
    section: "BIOCHIMIE URINAIRE",
    units: ["mg/g", "mg/mmol"],
  },
  {
    canonicalName: "Diurèse",
    aliases: ["DIURESE", "VOLUME URINAIRE", "DIURESE 24H"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mL/24h", "L/24h", "mL"],
  },
  {
    canonicalName: "Sodium urinaire",
    aliases: ["SODIUM URINAIRE", "NATRIURESE", "NA URINAIRE", "NATRIURIE"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "mmol/24h"],
  },
  {
    canonicalName: "Potassium urinaire",
    aliases: ["POTASSIUM URINAIRE", "KALIURESE", "K URINAIRE", "KALIURIE"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "mmol/24h"],
  },
  {
    canonicalName: "Calcium urinaire",
    aliases: ["CALCIUM URINAIRE", "CALCIURIE", "CA URINAIRE"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "mmol/24h", "mg/24h"],
  },
  {
    canonicalName: "Acide urique urinaire",
    aliases: ["ACIDE URIQUE URINAIRE", "URICURIE", "URATE URINAIRE"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "mmol/24h"],
  },
  {
    canonicalName: "Urée urinaire",
    aliases: ["UREE URINAIRE"],
    section: "BIOCHIMIE URINAIRE",
    units: ["mmol/L", "mmol/24h", "g/24h"],
  },
  {
    canonicalName: "Cortisol urinaire",
    aliases: [
      "CORTISOL URINAIRE",
      "CORTISOLURIE",
      "CORTISOL LIBRE URINAIRE",
      "CLU",
    ],
    section: "BIOCHIMIE URINAIRE",
    units: ["nmol/24h", "µg/24h"],
  },

  // ════════════════════════════════════════════════════════════════════════
  //  SÉROLOGIE / IMMUNOLOGIE
  // ════════════════════════════════════════════════════════════════════════
  {
    canonicalName: "Anticorps anti-nucléaires",
    aliases: [
      "ANTICORPS ANTI-NUCLEAIRES",
      "AAN",
      "FAN",
      "FACTEUR ANTINUCLEAIRE",
      "ANTICORPS ANTINUCLEAIRES",
    ],
    section: "SEROLOGIE",
    units: ["titre", "UI/mL"],
  },
  {
    canonicalName: "Facteur rhumatoïde",
    aliases: ["FACTEUR RHUMATOIDE", "FR", "LATEX WAALER-ROSE"],
    section: "SEROLOGIE",
    units: ["UI/mL", "kUI/L"],
  },
  {
    canonicalName: "Anti-CCP",
    aliases: [
      "ANTI-CCP",
      "ANTICORPS ANTI-CCP",
      "ANTI PEPTIDES CITRULLINES",
      "ACPA",
      "AC ANTI CCP",
    ],
    section: "SEROLOGIE",
    units: ["UI/mL", "U/mL"],
  },
  {
    canonicalName: "IgG",
    aliases: ["IGG", "IMMUNOGLOBULINES G", "IMMUNOGLOBULINE G"],
    section: "IMMUNOLOGIE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "IgA",
    aliases: ["IGA", "IMMUNOGLOBULINES A", "IMMUNOGLOBULINE A"],
    section: "IMMUNOLOGIE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "IgM",
    aliases: ["IGM", "IMMUNOGLOBULINES M", "IMMUNOGLOBULINE M"],
    section: "IMMUNOLOGIE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "IgE totales",
    aliases: ["IGE TOTALES", "IGE", "IMMUNOGLOBULINES E", "IGE TOTAL"],
    section: "IMMUNOLOGIE",
    units: ["kUI/L", "UI/mL", "kU/L"],
  },
  {
    canonicalName: "Complément C3",
    aliases: ["COMPLEMENT C3", "C3", "FRACTION C3"],
    section: "IMMUNOLOGIE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "Complément C4",
    aliases: ["COMPLEMENT C4", "C4", "FRACTION C4"],
    section: "IMMUNOLOGIE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "CH50",
    aliases: ["CH50", "COMPLEMENT HEMOLYTIQUE 50", "COMPLEMENT TOTAL"],
    section: "IMMUNOLOGIE",
    units: ["%", "U/mL"],
  },

  // ── Sérologie infectieuse ──
  {
    canonicalName: "Sérologie VIH",
    aliases: [
      "SEROLOGIE VIH",
      "VIH",
      "HIV",
      "AC ANTI VIH",
      "ANTICORPS ANTI-VIH",
    ],
    section: "SEROLOGIE",
    units: ["index", "ratio"],
  },
  {
    canonicalName: "Sérologie Hépatite B (AgHBs)",
    aliases: ["AGHBS", "AG HBS", "ANTIGENE HBS", "HEPATITE B"],
    section: "SEROLOGIE",
    units: ["index", "UI/L"],
  },
  {
    canonicalName: "Anticorps anti-HBs",
    aliases: ["AC ANTI-HBS", "ANTI-HBS", "ANTICORPS ANTI HBS", "AC HBS"],
    section: "SEROLOGIE",
    units: ["mUI/mL", "UI/L"],
  },
  {
    canonicalName: "Anticorps anti-HBc",
    aliases: ["AC ANTI-HBC", "ANTI-HBC", "ANTICORPS ANTI HBC", "AC HBC"],
    section: "SEROLOGIE",
    units: ["index", "ratio"],
  },
  {
    canonicalName: "Sérologie Hépatite C",
    aliases: [
      "SEROLOGIE HEPATITE C",
      "AC ANTI-VHC",
      "ANTI-VHC",
      "HEPATITE C",
      "VHC",
      "HCV",
    ],
    section: "SEROLOGIE",
    units: ["index", "ratio"],
  },
  {
    canonicalName: "Sérologie Syphilis",
    aliases: [
      "SEROLOGIE SYPHILIS",
      "TPHA",
      "VDRL",
      "TPHA-VDRL",
      "TREPONEMA",
      "SYPHILIS",
      "BW",
    ],
    section: "SEROLOGIE",
    units: ["titre", "index"],
  },
  {
    canonicalName: "Sérologie Toxoplasmose IgG",
    aliases: ["TOXOPLASMOSE IGG", "TOXO IGG", "AC ANTI TOXOPLASMA IGG"],
    section: "SEROLOGIE",
    units: ["UI/mL", "kUI/L"],
  },
  {
    canonicalName: "Sérologie Toxoplasmose IgM",
    aliases: ["TOXOPLASMOSE IGM", "TOXO IGM", "AC ANTI TOXOPLASMA IGM"],
    section: "SEROLOGIE",
    units: ["index", "ratio"],
  },
  {
    canonicalName: "Sérologie Rubéole IgG",
    aliases: ["RUBEOLE IGG", "RUBEOLE", "AC ANTI RUBEOLE IGG"],
    section: "SEROLOGIE",
    units: ["UI/mL"],
  },
  {
    canonicalName: "Sérologie CMV IgG",
    aliases: ["CMV IGG", "CYTOMEGALOVIRUS IGG", "AC ANTI CMV IGG"],
    section: "SEROLOGIE",
    units: ["UI/mL", "UA/mL"],
  },
  {
    canonicalName: "Sérologie CMV IgM",
    aliases: ["CMV IGM", "CYTOMEGALOVIRUS IGM", "AC ANTI CMV IGM"],
    section: "SEROLOGIE",
    units: ["index", "ratio"],
  },
  {
    canonicalName: "Sérologie EBV",
    aliases: [
      "EBV",
      "EPSTEIN-BARR",
      "MNI",
      "EBV VCA IGG",
      "EBV VCA IGM",
      "EBNA IGG",
    ],
    section: "SEROLOGIE",
    units: ["UA/mL", "U/mL", "index"],
  },

  // ── Marqueurs tumoraux ──
  {
    canonicalName: "PSA total",
    aliases: ["PSA TOTAL", "PSA", "ANTIGENE PROSTATIQUE SPECIFIQUE", "PSA T"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L"],
  },
  {
    canonicalName: "PSA libre",
    aliases: ["PSA LIBRE", "PSAL", "PSA L"],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L"],
  },
  {
    canonicalName: "Rapport PSA libre/total",
    aliases: ["RAPPORT PSA LIBRE/TOTAL", "RAPPORT PSAL/PSAT", "PSA L/T"],
    section: "BIOCHIMIE SANGUINE",
    units: ["%"],
  },
  {
    canonicalName: "CA 125",
    aliases: ["CA 125", "CA125"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/mL", "U/mL", "kU/L"],
  },
  {
    canonicalName: "CA 19-9",
    aliases: ["CA 19-9", "CA19-9", "CA 199"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/mL", "U/mL", "kU/L"],
  },
  {
    canonicalName: "CA 15-3",
    aliases: ["CA 15-3", "CA15-3", "CA 153"],
    section: "BIOCHIMIE SANGUINE",
    units: ["UI/mL", "U/mL", "kU/L"],
  },
  {
    canonicalName: "ACE",
    aliases: [
      "ACE",
      "ANTIGENE CARCINOEMBRYONNAIRE",
      "CEA",
      "ANTIGENE CARCINO-EMBRYONNAIRE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L"],
  },
  {
    canonicalName: "AFP",
    aliases: [
      "AFP",
      "ALPHA-FOETOPROTEINE",
      "ALPHA FOETOPROTEINE",
      "ALPHAFETOPROTEINE",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["ng/mL", "µg/L", "UI/mL", "kUI/L"],
  },

  // ── Électrophorèse des protéines ──
  {
    canonicalName: "Albumine (EPS)",
    aliases: ["ALBUMINE EPS", "ALBUMINE ELECTROPHORESE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "g/L"],
  },
  {
    canonicalName: "Alpha-1 globulines",
    aliases: ["ALPHA-1 GLOBULINES", "ALPHA 1 GLOBULINES", "ALPHA1", "ALPHA-1"],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "g/L"],
  },
  {
    canonicalName: "Alpha-2 globulines",
    aliases: ["ALPHA-2 GLOBULINES", "ALPHA 2 GLOBULINES", "ALPHA2", "ALPHA-2"],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "g/L"],
  },
  {
    canonicalName: "Bêta globulines",
    aliases: [
      "BETA GLOBULINES",
      "BETA-GLOBULINES",
      "BETA 1 GLOBULINES",
      "BETA 2 GLOBULINES",
    ],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "g/L"],
  },
  {
    canonicalName: "Gamma globulines",
    aliases: ["GAMMA GLOBULINES", "GAMMA-GLOBULINES", "GAMMAGLOBULINES"],
    section: "BIOCHIMIE SANGUINE",
    units: ["%", "g/L"],
  },

  // ── Hémostase avancée ──
  {
    canonicalName: "Facteur V",
    aliases: ["FACTEUR V", "FACTEUR 5"],
    section: "COAGULATION",
    units: ["%"],
  },
  {
    canonicalName: "Facteur VIII",
    aliases: ["FACTEUR VIII", "FACTEUR 8"],
    section: "COAGULATION",
    units: ["%"],
  },
  {
    canonicalName: "Facteur Willebrand",
    aliases: [
      "FACTEUR WILLEBRAND",
      "VON WILLEBRAND",
      "VWF",
      "FACTEUR DE WILLEBRAND",
    ],
    section: "COAGULATION",
    units: ["%", "UI/dL"],
  },
  {
    canonicalName: "Protéine C",
    aliases: ["PROTEINE C", "PC"],
    section: "COAGULATION",
    units: ["%"],
  },
  {
    canonicalName: "Protéine S",
    aliases: ["PROTEINE S", "PS", "PROTEINE S LIBRE"],
    section: "COAGULATION",
    units: ["%"],
  },
  {
    canonicalName: "Anticoagulant lupique",
    aliases: [
      "ANTICOAGULANT LUPIQUE",
      "ACC",
      "ANTICOAGULANT CIRCULANT",
      "LA",
      "LUPUS ANTICOAGULANT",
    ],
    section: "COAGULATION",
    units: ["ratio", "s"],
  },

  // ── Gazométrie ──
  {
    canonicalName: "pH sanguin",
    aliases: ["PH SANGUIN", "PH", "PH ARTERIEL"],
    section: "BIOCHIMIE SANGUINE",
    units: [""],
  },
  {
    canonicalName: "pCO2",
    aliases: ["PCO2", "PRESSION CO2"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmHg", "kPa"],
  },
  {
    canonicalName: "pO2",
    aliases: ["PO2", "PRESSION O2"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmHg", "kPa"],
  },
  {
    canonicalName: "Lactates",
    aliases: ["LACTATES", "ACIDE LACTIQUE", "LACTATÉMIE", "LACTATEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L", "mg/dL"],
  },
  {
    canonicalName: "Ammoniémie",
    aliases: ["AMMONIEMIE", "AMMONIAC", "NH3", "AMMONIUM"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "µg/dL"],
  },

  // ── Divers biochimie ──
  {
    canonicalName: "Haptoglobine",
    aliases: ["HAPTOGLOBINE", "HAPTOGLOBINÉMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "Orosomucoïde",
    aliases: ["OROSOMUCOIDE", "ALPHA-1-GLYCOPROTEINE ACIDE", "AGP"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "Céruloplasmine",
    aliases: ["CERULOPLASMINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["g/L", "mg/dL"],
  },
  {
    canonicalName: "Cuivre",
    aliases: ["CUIVRE", "CU", "CUPREMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "µg/dL"],
  },
  {
    canonicalName: "Zinc",
    aliases: ["ZINC", "ZN", "ZINCEMIE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "µg/dL"],
  },
  {
    canonicalName: "Sélénium",
    aliases: ["SELENIUM", "SE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "µg/L"],
  },
  {
    canonicalName: "Homocystéine",
    aliases: ["HOMOCYSTEINE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L"],
  },
  {
    canonicalName: "Osmolalité",
    aliases: ["OSMOLALITE", "OSMOLARITE", "OSMOLALITE PLASMATIQUE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mOsm/kg", "mOsm/L"],
  },
  {
    canonicalName: "Trou anionique",
    aliases: ["TROU ANIONIQUE", "ANION GAP"],
    section: "BIOCHIMIE SANGUINE",
    units: ["mmol/L"],
  },

  // ── Marqueurs hémolyse ──
  {
    canonicalName: "Bilirubine libre (hémolyse)",
    aliases: ["BILIRUBINE LIBRE"],
    section: "BIOCHIMIE SANGUINE",
    units: ["µmol/L", "mg/L"],
  },
  {
    canonicalName: "Schizocytes",
    aliases: ["SCHIZOCYTES", "RECHERCHE DE SCHIZOCYTES"],
    section: "HEMATOLOGIE",
    units: ["%", "‰"],
  },

  // ── Cytologie urinaire ──
  {
    canonicalName: "Leucocytes urinaires",
    aliases: ["LEUCOCYTES URINAIRES", "GB URINAIRES", "LEUCOCYTURIE"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL", "/mm3", "éléments/mL"],
  },
  {
    canonicalName: "Hématies urinaires",
    aliases: ["HEMATIES URINAIRES", "GR URINAIRES", "HEMATURIE"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL", "/mm3", "éléments/mL"],
  },
  {
    canonicalName: "Cellules épithéliales urinaires",
    aliases: ["CELLULES EPITHELIALES", "CELLULES EPITHELIALES URINAIRES"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL"],
  },
  {
    canonicalName: "Cristaux urinaires",
    aliases: ["CRISTAUX", "CRISTAUX URINAIRES"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL"],
  },
  {
    canonicalName: "Cylindres urinaires",
    aliases: ["CYLINDRES", "CYLINDRES URINAIRES"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL"],
  },
  {
    canonicalName: "Bactéries urinaires",
    aliases: ["BACTERIES", "BACTERIES URINAIRES", "BACTERIURIE"],
    section: "CYTOLOGIE URINAIRE",
    units: ["/µL", "/mL"],
  },
];

// ─── Index d'alias pour recherche rapide ─────────────────────────────────────

/**
 * Map inversée : alias normalisé → LabTestEntry.
 * Construite une seule fois au chargement du module.
 */
export const ALIAS_INDEX: Map<string, LabTestEntry> = new Map();

LAB_TEST_DICTIONARY.forEach((entry) => {
  entry.aliases.forEach((alias) => {
    ALIAS_INDEX.set(normalizeName(alias), entry);
  });
  // Ajouter aussi le nom canonique normalisé
  ALIAS_INDEX.set(normalizeName(entry.canonicalName), entry);
});

/**
 * Cherche un test par nom (fuzzy-tolerant : supprime accents + majuscules).
 * Retourne l'entrée du dictionnaire ou undefined.
 */
export const findTestByName = (name: string): LabTestEntry | undefined => {
  const normalized = normalizeName(name);
  if (!normalized || normalized.length < 2) return undefined;

  // 1. Match exact
  const exact = ALIAS_INDEX.get(normalized);
  if (exact) return exact;

  // 2. Match partiel — uniquement pour les alias suffisamment longs (≥ 4 caractères)
  // afin d'éviter les faux positifs avec des alias courts (CA → CANNABIS, MG → IMAGING…)
  for (const [alias, entry] of ALIAS_INDEX.entries()) {
    if (alias.length < 4 && normalized.length < 4) continue;
    // L'alias court ne doit pas matcher comme sous-chaîne d'un mot plus long
    if (alias.length < 4) continue;
    if (normalized.length < 4) continue;
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return entry;
    }
  }

  return undefined;
};

/**
 * Vérifie si un texte ressemble à un nom de test connu.
 * Plus tolérant que findTestByName : vérifie si le début du texte
 * correspond à un alias connu.
 */
export const isKnownTestName = (text: string): boolean => {
  const normalized = normalizeName(text);
  if (!normalized || normalized.length < 2) return false;

  for (const alias of ALIAS_INDEX.keys()) {
    if (normalized.startsWith(alias) || alias.startsWith(normalized)) {
      return true;
    }
  }
  return false;
};

/** Unités courantes de biologie médicale (pour validation) */
export const KNOWN_UNITS = new Set([
  "G/L",
  "T/L",
  "g/dL",
  "g/L",
  "%",
  "fL",
  "pg",
  "mm",
  "mm/h",
  "s",
  "ratio",
  "mg/L",
  "mg/dL",
  "µmol/L",
  "mmol/L",
  "mEq/L",
  "UI/L",
  "U/L",
  "UI/mL",
  "mUI/L",
  "µUI/mL",
  "mUI/mL",
  "ng/mL",
  "ng/L",
  "ng/dL",
  "pg/mL",
  "pg/dL",
  "pmol/L",
  "nmol/L",
  "kUI/L",
  "kU/L",
  "µg/L",
  "µg/dL",
  "g/24h",
  "mg/24h",
  "mmol/24h",
  "mL/min",
  "mL/min/1.73m2",
  "mL/min/1,73m2",
  "10^9/L",
  "10^12/L",
  "/mm3",
  "/µL",
  "/mL",
  "index",
  "titre",
  "UA/mL",
  "U/mL",
  "mOsm/kg",
  "mOsm/L",
  "mmHg",
  "kPa",
  "éléments/mL",
  "‰",
  "mg/g",
  "mg/mmol",
  "mg/g créat",
]);

/**
 * Vérifie si un texte ressemble à une unité de biologie médicale.
 */
export const isKnownUnit = (text: string): boolean => {
  const cleaned = text.trim();
  if (!cleaned) return false;
  if (KNOWN_UNITS.has(cleaned)) return true;

  // Vérification case-insensitive
  const upper = cleaned.toUpperCase();
  for (const unit of KNOWN_UNITS) {
    if (unit.toUpperCase() === upper) return true;
  }

  // Pas de fallback permissif : seules les unités connues sont acceptées
  return false;
};
