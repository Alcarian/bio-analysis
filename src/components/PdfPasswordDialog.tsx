import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Box,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";

interface PdfPasswordDialogProps {
  open: boolean;
  fileName: string | null;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

const PdfPasswordDialog: React.FC<PdfPasswordDialogProps> = ({
  open,
  fileName,
  onConfirm,
  onCancel,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    onConfirm(password);
    setPassword("");
  };

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password) {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <VpnKeyIcon color="primary" />
        Mot de passe PDF requis
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Le fichier PDF est protégé par un mot de passe. C'est généralement
          votre <strong>date de naissance</strong> au format{" "}
          <strong>JJMMAAAA</strong> (ex. : 15031990).
        </Alert>
        {fileName && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Fichier : <strong>{fileName}</strong>
          </Typography>
        )}
        <TextField
          fullWidth
          autoFocus
          type={showPassword ? "text" : "password"}
          label="Mot de passe du PDF"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex. : 15031990"
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
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Ce mot de passe sera sauvegardé de manière chiffrée et réutilisé
            automatiquement pour tous vos PDF.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!password}
        >
          Valider et analyser
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfPasswordDialog;
