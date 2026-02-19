import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { PatientAnalysis } from "../types";
import { getDeviationLabel, getReferenceDisplay } from "../utils/analysisUtils";

interface AnalysisDetailDialogProps {
  open: boolean;
  onClose: () => void;
  analysis: PatientAnalysis;
}

const AnalysisDetailDialog: React.FC<AnalysisDetailDialogProps> = ({
  open,
  onClose,
  analysis,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle
        sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, py: { xs: 1.5, sm: 2 } }}
      >
        Détails de l'analyse - {analysis.date}
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1, sm: 3 } }}>
        <Box sx={{ mt: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 0.5, sm: 2 },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Test
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 0.5, sm: 2 },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Valeur
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 0.5, sm: 2 },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Référence
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 0.5, sm: 2 },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Statut
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(analysis.biochemistryData).map(
                  ([testName, value]) => {
                    const deviationLabel = getDeviationLabel(value);
                    const referenceDisplay = getReferenceDisplay(value);

                    return (
                      <TableRow key={testName}>
                        <TableCell
                          sx={{
                            fontSize: { xs: "0.7rem", sm: "0.875rem" },
                            px: { xs: 0.5, sm: 2 },
                            wordBreak: "break-word",
                          }}
                        >
                          {testName}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ px: { xs: 0.5, sm: 2 } }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: value.isAbnormal ? "bold" : "normal",
                              color: value.isAbnormal
                                ? "error.main"
                                : "inherit",
                            }}
                          >
                            {value.value} {value.unit}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ px: { xs: 0.5, sm: 2 } }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" } }}
                          >
                            {referenceDisplay}
                          </Typography>
                          {deviationLabel && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "error.main",
                                fontWeight: "bold",
                              }}
                            >
                              {deviationLabel}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ px: { xs: 0.5, sm: 2 } }}
                        >
                          <Chip
                            size="small"
                            label={value.isAbnormal ? "⚠️ Anormal" : "✓ OK"}
                            color={value.isAbnormal ? "error" : "success"}
                            variant="outlined"
                            sx={{
                              fontSize: { xs: "0.6rem", sm: "0.75rem" },
                              height: { xs: 22, sm: 24 },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalysisDetailDialog;
