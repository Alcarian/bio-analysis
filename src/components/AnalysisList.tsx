import React from "react";
import { Box, Alert } from "@mui/material";
import AnalysisDetail from "./AnalysisDetail";
import { PatientAnalysis } from "../types";

interface AnalysisListProps {
  analyses: PatientAnalysis[];
  onDelete: (analysisId: string) => void;
}

/**
 * Affiche la liste de toutes les analyses
 */
const AnalysisList: React.FC<AnalysisListProps> = ({ analyses, onDelete }) => {
  if (analyses.length === 0) {
    return (
      <Alert severity="info">
        Aucune analyse disponible. Importez des fichiers PDF pour commencer.
      </Alert>
    );
  }

  return (
    <Box>
      {analyses.map((analysis) => (
        <AnalysisDetail
          key={analysis.id}
          analysis={analysis}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export default AnalysisList;
