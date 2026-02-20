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
  PictureAsPdf as PdfIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { PatientAnalysis } from "../types";
import { getAnomalySummary } from "../services/biochemistryAnalyzer";
import { exportAnalysisPdf } from "../services/pdfExportService";
import { usePdfPassword } from "../contexts/PdfPasswordContext";
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
  const { pdfPassword } = usePdfPassword();

  const anomalySummary = useMemo(
    () => getAnomalySummary(analysis.biochemistryData),
    [analysis.biochemistryData],
  );

  const handleDeleteConfirm = () => {
    onDelete(analysis.id);
    setDeleteDialogOpen(false);
  };

  const handleDownloadPdf = () => {
    if (!pdfPassword) return;
    exportAnalysisPdf(analysis, pdfPassword);
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body1">Prélèvement du</Typography>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {analysis.date}
              </Typography>
            </Box>
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
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            gap: { xs: 0.5, sm: 0 },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setDetailDialogOpen(true)}
            sx={{ fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
          >
            Afficher les résultats
          </Button>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              size="small"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPdf}
              sx={{ fontSize: { xs: "0.7rem", sm: "0.8125rem" } }}
            >
              Exporter PDF
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
          </Box>
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
