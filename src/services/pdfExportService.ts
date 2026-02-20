import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PatientAnalysis } from "../types";
import { getAnomalySummary } from "./biochemistryAnalyzer";
import { getDeviationLabel, getReferenceDisplay } from "../utils/analysisUtils";

/**
 * Remplace les caractères Unicode hors Latin-1 par leurs équivalents ASCII.
 * jsPDF (polices intégrées) ne supporte que Latin-1 ; sans cette sanitisation
 * chaque caractère inconnu est affiché sous forme de séquence &xx.
 */
const sanitize = (str: string): string =>
  str
    .replace(/[\u2212\u2013\u2014]/g, "-") // tirets Unicode → tiret ASCII
    .replace(/\u2265/g, ">=") // ≥
    .replace(/\u2264/g, "<=") // ≤
    .replace(/\u2260/g, "!=") // ≠
    .replace(/[\u2018\u2019]/g, "'") // guillemets simples
    .replace(/[\u201C\u201D]/g, '"') // guillemets doubles
    .replace(/\u2713|\u2714/g, "OK") // ✓ ✔
    .replace(/\u26A0[^\s]*/g, "!") // ⚠ (+ éventuels modificateurs emoji)
    .replace(/\u26A0/g, "!") // ⚠ seul
    .replace(/[^\x00-\xFF]/g, "?"); // tout autre caractère hors Latin-1

/**
 * Génère et télécharge un PDF contenant le tableau des résultats d'analyse.
 * Le PDF est verrouillé avec le mot de passe PDF fourni par l'utilisateur
 * (cohérence avec les PDF initiaux protégés).
 */
export const exportAnalysisPdf = (
  analysis: PatientAnalysis,
  pin: string,
): void => {
  const anomalySummary = getAnomalySummary(analysis.biochemistryData);
  const testCount = Object.keys(analysis.biochemistryData).length;
  const generationDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ─── Création du document PDF avec chiffrement ─────────────────────────────
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    encryption: {
      userPassword: pin,
      ownerPassword: pin,
      userPermissions: ["print", "copy"],
    },
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // ─── Titre ─────────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 118, 210); // #1976d2
  doc.text(sanitize("Résultats d'analyse biochimique"), pageWidth / 2, yPos, {
    align: "center",
  });

  yPos += 12;

  // ─── Ligne de séparation ──────────────────────────────────────────────────
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 10;

  // ─── Informations de l'analyse ────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const infoLines: [string, string][] = [
    ["Date de prelevement", sanitize(analysis.date)],
    ["Fichier source", sanitize(analysis.fileName)],
    ["Nombre de tests", `${testCount}`],
    [
      "Anomalies detectees",
      anomalySummary.abnormalCount > 0
        ? `${anomalySummary.abnormalCount} anomalie(s)`
        : "Aucune",
    ],
  ];

  infoLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, 65, yPos);
    yPos += 6;
  });

  // ─── Tests anormaux (si présents) ─────────────────────────────────────────
  if (anomalySummary.abnormalCount > 0) {
    yPos += 2;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(211, 47, 47); // rouge MUI error
    doc.text("Tests anormaux :", 15, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Découpe la liste en lignes de max ~80 caractères
    const abnormalText = sanitize(anomalySummary.abnormalTests.join(", "));
    const splitLines = doc.splitTextToSize(abnormalText, pageWidth - 30);
    doc.text(splitLines, 15, yPos);
    yPos += splitLines.length * 5 + 2;
  }

  yPos += 5;

  // ─── Tableau des résultats ────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);

  const tableData = Object.entries(analysis.biochemistryData).map(
    ([testName, value]) => {
      const deviationLabel = getDeviationLabel(value);
      const referenceDisplay = getReferenceDisplay(value);
      const statusText = value.isAbnormal ? "Anormal" : "OK";

      return [
        sanitize(testName),
        sanitize(`${value.value} ${value.unit}`),
        sanitize(
          referenceDisplay + (deviationLabel ? ` (${deviationLabel})` : ""),
        ),
        statusText,
      ];
    },
  );

  autoTable(doc, {
    startY: yPos,
    head: [["Test", "Valeur", "Reference", "Statut"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: [25, 118, 210], // #1976d2
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: "auto" },
      1: { halign: "right", cellWidth: 35 },
      2: { halign: "center", cellWidth: 45 },
      3: { halign: "center", cellWidth: 28 },
    },
    bodyStyles: {
      textColor: [50, 50, 50],
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const rowIndex = data.row.index;
        const entries = Object.entries(analysis.biochemistryData);
        const [, value] = entries[rowIndex] || [];

        if (value?.isAbnormal) {
          // Colonne Valeur (index 1) : rouge + gras
          if (data.column.index === 1) {
            data.cell.styles.textColor = [211, 47, 47];
            data.cell.styles.fontStyle = "bold";
          }
          // Colonne Statut (index 3) : rouge
          if (data.column.index === 3) {
            data.cell.styles.textColor = [211, 47, 47];
            data.cell.styles.fontStyle = "bold";
          }
          // Colonne Référence (index 2) : déviation en rouge
          if (data.column.index === 2) {
            data.cell.styles.textColor = [211, 47, 47];
            data.cell.styles.fontStyle = "bold";
          }
        } else {
          // Statut OK en vert
          if (data.column.index === 3) {
            data.cell.styles.textColor = [46, 125, 50]; // vert MUI success
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // ─── Pied de page ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Genere le ${generationDate} - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  // ─── Téléchargement ──────────────────────────────────────────────────────
  const fileName = `${analysis.date}_${analysis.fileName.replace(".pdf", "")}_resultats.pdf`;
  doc.save(fileName);
};
