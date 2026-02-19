import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { usePdfPassword } from "../contexts/PdfPasswordContext";
import { migrateToEncryptedStorage } from "../services/encryptedStorage";
import { PATIENT_ID } from "../constants";

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 32;

const LockScreen: React.FC = () => {
  const { status, initialize, createPin, unlock } = useAuth();
  const { setPdfPassword } = usePdfPassword();
  const [input, setInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [pdfPwdInput, setPdfPwdInput] = useState("");
  const [showPdfPwd, setShowPdfPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreatePin = async () => {
    if (input.length < MIN_PIN_LENGTH) {
      setError(`Le PIN doit contenir au moins ${MIN_PIN_LENGTH} caractères.`);
      return;
    }
    if (input !== confirmInput) {
      setError("Les PIN ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createPin(input);
      // Stocker le mot de passe PDF en mémoire
      setPdfPassword(pdfPwdInput);
      // Migrer les données existantes non chiffrées vers le store chiffré
      await migrateToEncryptedStorage(input, PATIENT_ID);
    } catch {
      setError("Erreur lors de la création du PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!input) {
      setError("Veuillez saisir votre PIN.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await unlock(input);
      if (success) {
        setPdfPassword(pdfPwdInput);
      } else {
        setError("PIN incorrect.");
        setInput("");
      }
    } catch {
      setError("Erreur lors de la vérification.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (status === "no-pin") {
        handleCreatePin();
      } else {
        handleUnlock();
      }
    }
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        px: 2,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 420,
          width: "100%",
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <LockIcon
          sx={{
            fontSize: { xs: 48, sm: 64 },
            color: "primary.main",
            mb: 2,
          }}
        />

        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{ fontWeight: "bold", mb: 1 }}
        >
          Bio Analysis
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3, px: 1 }}>
          {status === "no-pin"
            ? "Créez un PIN pour protéger vos données médicales. Ce PIN chiffrera toutes vos données localement."
            : "Saisissez votre PIN pour accéder à vos données."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          type={showPassword ? "text" : "password"}
          label={status === "no-pin" ? "Nouveau PIN" : "PIN"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
          inputProps={{ maxLength: MAX_PIN_LENGTH }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {status === "no-pin" && (
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Confirmer le PIN"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            inputProps={{ maxLength: MAX_PIN_LENGTH }}
            sx={{ mb: 2 }}
          />
        )}

        <Button
          variant="text"
          size="small"
          onClick={() => setShowPdfPwd(!showPdfPwd)}
          endIcon={showPdfPwd ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mb: 1, textTransform: "none" }}
        >
          Mot de passe PDF (optionnel)
        </Button>
        <Collapse in={showPdfPwd}>
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Mot de passe PDF"
            value={pdfPwdInput}
            onChange={(e) => setPdfPwdInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            helperText="Pour déchiffrer vos PDF protégés. Non enregistré."
            sx={{ mb: 2 }}
          />
        </Collapse>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={status === "no-pin" ? handleCreatePin : handleUnlock}
          disabled={loading}
          sx={{ py: 1.5, fontSize: "1rem", borderRadius: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : status === "no-pin" ? (
            "Créer le PIN et commencer"
          ) : (
            "Déverrouiller"
          )}
        </Button>

        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ display: "block", mt: 2 }}
        >
          🔒 Vos données sont chiffrées localement (AES-256-GCM)
        </Typography>
      </Paper>
    </Box>
  );
};

export default LockScreen;
