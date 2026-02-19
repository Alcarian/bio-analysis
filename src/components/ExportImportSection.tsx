import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  exportEncryptedData,
  downloadExport,
  importEncryptedData,
} from "../services/exportImportService";
import { PATIENT_ID } from "../constants";

interface ExportImportSectionProps {
  onImportComplete: () => void;
}

const ExportImportSection: React.FC<ExportImportSectionProps> = ({
  onImportComplete,
}) => {
  const { pin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!pin) return;
    setLoading(true);
    setMessage(null);
    try {
      const { blob, fileName, count } = await exportEncryptedData(
        PATIENT_ID,
        pin,
      );
      if (count === 0) {
        setMessage({
          text: "Aucune analyse à exporter.",
          severity: "warning",
        });
        return;
      }
      downloadExport(blob, fileName);
      setMessage({
        text: `${count} analyse${count > 1 ? "s" : ""} exportée${count > 1 ? "s" : ""} avec succès.`,
        severity: "success",
      });
    } catch (err) {
      setMessage({
        text: `Erreur lors de l'export : ${(err as Error).message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pin) return;

    setLoading(true);
    setMessage(null);
    try {
      const result = await importEncryptedData(file, PATIENT_ID, pin);
      const parts: string[] = [];
      if (result.imported > 0) {
        parts.push(
          `${result.imported} analyse${result.imported > 1 ? "s" : ""} importée${result.imported > 1 ? "s" : ""}`,
        );
      }
      if (result.skipped > 0) {
        parts.push(
          `${result.skipped} doublon${result.skipped > 1 ? "s" : ""} ignoré${result.skipped > 1 ? "s" : ""}`,
        );
      }
      if (result.imported === 0 && result.skipped > 0) {
        setMessage({
          text: `Toutes les analyses existaient déjà (${result.skipped} doublon${result.skipped > 1 ? "s" : ""}).`,
          severity: "info",
        });
      } else {
        setMessage({
          text: parts.join(", ") + ".",
          severity: "success",
        });
      }
      if (result.imported > 0) {
        onImportComplete();
      }
    } catch (err) {
      setMessage({
        text: (err as Error).message,
        severity: "error",
      });
    } finally {
      setLoading(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        💾 Sauvegarde chiffrée
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Exportez vos analyses dans un fichier chiffré (.bioenc) pour les
        sauvegarder ou les transférer vers un autre appareil. Le fichier est
        protégé par votre PIN.
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          mb: message ? 2 : 0,
        }}
      >
        <Button
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ExportIcon />
            )
          }
          onClick={handleExport}
          disabled={loading || !pin}
        >
          Exporter
        </Button>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={18} /> : <ImportIcon />}
          onClick={handleImportClick}
          disabled={loading || !pin}
        >
          Importer
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".bioenc"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
      </Box>

      {message && (
        <Alert severity={message.severity} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Paper>
  );
};

export default ExportImportSection;
