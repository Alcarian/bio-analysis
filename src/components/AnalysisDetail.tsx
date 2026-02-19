import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { PatientAnalysis } from "../types";
import { getAnomalySummary } from "../services/biochemistryAnalyzer";
import AnalysisDetailDialog from "./AnalysisDetailDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface AnalysisDetailProps {
  analysis: PatientAnalysis;
  onDelete: (analysisId: string) => void;
}

/**
 * Affiche les détails d'une analyse individuelle
 */
const AnalysisDetail: React.FC<AnalysisDetailProps> = ({
  analysis,
  onDelete,
}) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const anomalySummary = useMemo(
    () => getAnomalySummary(analysis.biochemistryData),
    [analysis.biochemistryData],
  );

  const handleDeleteConfirm = () => {
    onDelete(analysis.id);
    setDeleteDialogOpen(false);
  };

  const handleDownloadData = () => {
    const dataStr = JSON.stringify(analysis.biochemistryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${analysis.date}_${analysis.fileName.replace(".pdf", "")}.json`;
    link.click();
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 0.5, sm: 0 },
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {analysis.date}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                wordBreak: "break-all",
                maxWidth: { xs: "100%", sm: "50%" },
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              {analysis.fileName}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              label={`${Object.keys(analysis.biochemistryData).length} tests`}
              variant="outlined"
            />
            {anomalySummary.abnormalCount > 0 ? (
              <Chip
                label={`${anomalySummary.abnormalCount} anomalies`}
                color="error"
              />
            ) : (
              <Chip label="Tous les tests OK" color="success" />
            )}
          </Box>

          {anomalySummary.abnormalCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="caption">
                <strong>Tests anormaux:</strong>{" "}
                {anomalySummary.abnormalTests.join(", ")}
              </Typography>
            </Alert>
          )}
        </CardContent>
        <CardActions
          sx={{
            flexWrap: "wrap",
            gap: { xs: 0.5, sm: 0 },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => setDetailDialogOpen(true)}
            sx={{ fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
          >
            Détails
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadData}
            sx={{ fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
          >
            Exporter
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
          >
            Supprimer
          </Button>
        </CardActions>
      </Card>

      <AnalysisDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        analysis={analysis}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`Voulez-vous vraiment supprimer cette analyse du ${analysis.date} ?`}
      />
    </>
  );
};

export default AnalysisDetail;
