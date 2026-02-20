import React, { useState, useCallback, useEffect } from "react";
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
  Fab,
  useMediaQuery,
  useTheme,
  Zoom,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";
import { useThemeMode } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { usePdfPassword } from "../contexts/PdfPasswordContext";
import TabPanel from "../components/TabPanel";
import ImportTab from "../components/ImportTab";
import AnalysesTab from "../components/AnalysesTab";
import AnalysisCharts from "../components/AnalysisCharts";
import ExportImportSection from "../components/ExportImportSection";
import PdfPasswordDialog from "../components/PdfPasswordDialog";
import WelcomeGuide from "../components/WelcomeGuide";

import { useFiles } from "../hooks/useFiles";
import { useAnalyses } from "../hooks/useAnalyses";
import { useFileProcessing } from "../hooks/useFileProcessing";
import { savePdfPasswordEncrypted } from "../services/encryptedStorage";
import { PATIENT_ID } from "../constants";

const WELCOME_GUIDE_KEY = "bio-analysis-welcome-done";

const Home: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(
    () => !localStorage.getItem(WELCOME_GUIDE_KEY),
  );
  const { mode, toggleMode } = useThemeMode();
  const { lock, pin } = useAuth();
  const {
    pdfPassword,
    setPdfPassword,
    isSet: hasPdfPassword,
  } = usePdfPassword();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Met à jour le mot de passe PDF en mémoire ET le persiste chiffré */
  const updatePdfPassword = useCallback(
    async (password: string) => {
      setPdfPassword(password);
      if (pin) {
        try {
          await savePdfPasswordEncrypted(password, pin);
        } catch (e) {
          console.error("Erreur sauvegarde mot de passe PDF:", e);
        }
      }
    },
    [pin, setPdfPassword],
  );

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
    pendingPasswordFile,
    retryWithPassword,
    cancelPasswordRequest,
  } = useFileProcessing(refreshAnalyses, pin, pdfPassword, updatePdfPassword);

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
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        {/* Mobile: logo à gauche + icônes à droite | Desktop: tout en ligne */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src={process.env.PUBLIC_URL + "/Logo-bio-analysis.png"}
              alt="Bio Analysis"
              style={{ height: isMobile ? 100 : 200, width: "auto" }}
            />
          </Box>

          {/* Titre + description : visible uniquement sur desktop dans cette ligne */}
          {!isMobile && (
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  fontSize: { sm: "2.2rem", md: "3rem" },
                }}
              >
                Bio Analysis
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Importez vos fichiers PDF de résultats biologiques et suivez
                l'évolution de votre santé
              </Typography>
            </Box>
          )}

          {/* Icônes toujours visibles à droite */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={mode === "dark" ? "Mode clair" : "Mode sombre"}>
              <IconButton onClick={toggleMode}>
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                hasPdfPassword
                  ? "Modifier le mot de passe PDF"
                  : "Définir le mot de passe PDF"
              }
            >
              <IconButton
                onClick={() => setShowPasswordDialog(true)}
                color={hasPdfPassword ? "default" : "warning"}
              >
                <VpnKeyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Verrouiller">
              <IconButton onClick={lock}>
                <LockIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Mobile : titre + description sous la barre logo/icônes */}
        {isMobile && (
          <Box sx={{ textAlign: "center", mt: 1.5 }}>
            <Typography
              variant="h4"
              sx={{
                mb: 0.5,
                fontWeight: "bold",
                fontSize: "1.6rem",
              }}
            >
              Bio Analysis
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ fontSize: "0.85rem", px: 1 }}
            >
              Importez vos fichiers PDF de résultats biologiques et suivez
              l'évolution de votre santé
            </Typography>
          </Box>
        )}
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

      {/* Welcome Guide modal — blocks UI until completed */}
      <WelcomeGuide
        open={showWelcomeGuide}
        onComplete={(password?: string) => {
          if (password) {
            updatePdfPassword(password);
          }
          localStorage.setItem(WELCOME_GUIDE_KEY, "1");
          setShowWelcomeGuide(false);
        }}
      />

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
        <ExportImportSection onImportComplete={refreshAnalyses} />
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

      {/* Dialog demandée automatiquement quand un PDF protégé est détecté */}
      <PdfPasswordDialog
        open={!!pendingPasswordFile}
        fileName={pendingPasswordFile}
        onConfirm={retryWithPassword}
        onCancel={cancelPasswordRequest}
      />

      {/* Dialog manuelle pour définir/changer le mot de passe PDF */}
      <PdfPasswordDialog
        open={showPasswordDialog}
        fileName={null}
        onConfirm={(pw) => {
          updatePdfPassword(pw);
          setShowPasswordDialog(false);
        }}
        onCancel={() => setShowPasswordDialog(false)}
      />

      <Zoom in={showScrollTop}>
        <Fab
          onClick={scrollToTop}
          size="medium"
          color="primary"
          aria-label="Retour en haut"
          sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1300 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Container>
  );
};

export default Home;
