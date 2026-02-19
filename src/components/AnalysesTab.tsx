import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Clear as ClearIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import AnalysisList from "./AnalysisList";
import { PatientAnalysis } from "../types";

interface AnalysesTabProps {
  analyses: PatientAnalysis[];
  displayedAnalyses: PatientAnalysis[];
  analysisSearch: string;
  analysisSortOrder: "desc" | "asc";
  onSearchChange: (search: string) => void;
  onToggleSortOrder: () => void;
  onDeleteAnalysis: (analysisId: string) => void;
  onDeleteAllAnalyses: () => void;
}

const AnalysesTab: React.FC<AnalysesTabProps> = ({
  analyses,
  displayedAnalyses,
  analysisSearch,
  analysisSortOrder,
  onSearchChange,
  onToggleSortOrder,
  onDeleteAnalysis,
  onDeleteAllAnalyses,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      {analyses.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 2 },
            alignItems: { xs: "stretch", sm: "center" },
            mb: 2,
            flexWrap: "wrap",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            size="small"
            placeholder={
              isMobile ? "Rechercher…" : "Rechercher par date, fichier, test…"
            }
            value={analysisSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              flex: 1,
              minWidth: { xs: 0, sm: 220 },
              width: { xs: "100%", sm: "auto" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: analysisSearch ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Tooltip
            title={
              analysisSortOrder === "desc"
                ? "Basculer : plus ancienne en premier"
                : "Basculer : plus récente en premier"
            }
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                analysisSortOrder === "desc" ? (
                  <ArrowDownwardIcon />
                ) : (
                  <ArrowUpwardIcon />
                )
              }
              onClick={onToggleSortOrder}
            >
              {analysisSortOrder === "desc" ? "Plus récent" : "Plus ancien"}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={onDeleteAllAnalyses}
            sx={{ fontSize: { xs: "0.75rem", sm: "0.8125rem" } }}
          >
            Tout supprimer
          </Button>
        </Box>
      )}

      {analysisSearch.trim() !== "" && displayedAnalyses.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aucun résultat pour « {analysisSearch} ».
        </Alert>
      )}

      <AnalysisList analyses={displayedAnalyses} onDelete={onDeleteAnalysis} />
    </>
  );
};

export default AnalysesTab;
