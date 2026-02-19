import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useThemeMode } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { usePdfPassword } from "../contexts/PdfPasswordContext";
import TabPanel from "../components/TabPanel";
import ImportTab from "../components/ImportTab";
import AnalysesTab from "../components/AnalysesTab";
import AnalysisCharts from "../components/AnalysisCharts";
import ExportImportSection from "../components/ExportImportSection";
import { useFiles } from "../hooks/useFiles";
import { useAnalyses } from "../hooks/useAnalyses";
import { useFileProcessing } from "../hooks/useFileProcessing";
import { PATIENT_ID } from "../constants";

const Home: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { mode, toggleMode } = useThemeMode();
  const { lock, pin } = useAuth();
  const { pdfPassword } = usePdfPassword();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    files,
    duplicateWarning,
    setDuplicateWarning,
    handleFilesDropped,
    handleDelete,
    handleDeleteAll: handleDeleteAllFiles,
  } = useFiles();

  const {
    analyses,
    displayedAnalyses,
    analysisSearch,
    setAnalysisSearch,
    analysisSortOrder,
    toggleSortOrder,
    refreshAnalyses,
    handleDeleteAnalysis,
    handleDeleteAllAnalyses,
  } = useAnalyses();

  const {
    isProcessing,
    processingFile,
    fileStatuses,
    notification,
    clearNotification,
    resetStatuses,
    handleProcessPDF,
    handleProcessAll,
  } = useFileProcessing(refreshAnalyses, pin, pdfPassword);

  const onDeleteAllFiles = () => {
    handleDeleteAllFiles();
    resetStatuses();
  };

  const onProcessAll = () => {
    handleProcessAll(
      files.map((f) => f.name),
      () => setTabValue(1),
    );
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: { xs: 2, sm: 4 },
        }}
      >
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            sx={{
              mb: { xs: 1, sm: 2 },
              fontWeight: "bold",
              fontSize: { xs: "1.6rem", sm: "2.2rem", md: "3rem" },
            }}
          >
            Bio Analysis
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{
              fontSize: { xs: "0.85rem", sm: "1rem" },
              px: { xs: 1, sm: 0 },
            }}
          >
            Importez vos fichiers PDF de résultats biologiques et suivez
            l'évolution de votre santé
          </Typography>
        </Box>
        <Tooltip title={mode === "dark" ? "Mode clair" : "Mode sombre"}>
          <IconButton onClick={toggleMode} sx={{ mt: { xs: 0, sm: 1 } }}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Verrouiller">
          <IconButton onClick={lock} sx={{ mt: { xs: 0, sm: 1 } }}>
            <LockIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, sm: 3 } }}
      >
        <Tab
          label={isMobile ? "📤 Importer" : "📤 Importer mes analyses"}
          id="tab-0"
          sx={{
            minWidth: { xs: "auto", sm: 160 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            px: { xs: 1, sm: 2 },
          }}
        />
        <Tab
          label={
            isMobile
              ? `📊 Analyses (${analyses.length})`
              : `📊 Mes analyses (${analyses.length})`
          }
          id="tab-1"
          sx={{
            minWidth: { xs: "auto", sm: 160 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            px: { xs: 1, sm: 2 },
          }}
        />
        <Tab
          label={isMobile ? "📈 Graphiques" : "📈 Graphiques"}
          id="tab-2"
          sx={{
            minWidth: { xs: "auto", sm: 160 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            px: { xs: 1, sm: 2 },
          }}
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <ImportTab
          files={files}
          fileStatuses={fileStatuses}
          processingFile={processingFile}
          isProcessing={isProcessing}
          onFilesDropped={handleFilesDropped}
          onDelete={handleDelete}
          onAnalyze={handleProcessPDF}
          onProcessAll={onProcessAll}
          onDeleteAll={onDeleteAllFiles}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <AnalysesTab
          analyses={analyses}
          displayedAnalyses={displayedAnalyses}
          analysisSearch={analysisSearch}
          analysisSortOrder={analysisSortOrder}
          onSearchChange={setAnalysisSearch}
          onToggleSortOrder={toggleSortOrder}
          onDeleteAnalysis={handleDeleteAnalysis}
          onDeleteAllAnalyses={handleDeleteAllAnalyses}
        />
        <ExportImportSection onImportComplete={refreshAnalyses} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <AnalysisCharts patientId={PATIENT_ID} analyses={analyses} />
      </TabPanel>

      <Snackbar
        open={!!duplicateWarning}
        autoHideDuration={5000}
        onClose={() => setDuplicateWarning(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setDuplicateWarning(null)}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {duplicateWarning}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!notification}
        autoHideDuration={notification?.severity === "error" ? 8000 : 5000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={clearNotification}
          severity={notification?.severity ?? "info"}
          sx={{ width: "100%" }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;
