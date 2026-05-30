import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  FormHelperText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Wifi as WifiIcon,
  PhoneAndroid as PhoneAndroidIcon,
} from "@mui/icons-material";
import { useAIModel } from "../hooks/useAIModel";

interface AISettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const AISettingsDialog: React.FC<AISettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    isReady,
    isLoading,
    hasError,
    errorMessage,
    serverUrl,
    modelId,
    availableModels,
    checkConnection,
    setServerUrl,
    setModelId,
  } = useAIModel();

  const [urlInput, setUrlInput] = useState(serverUrl);

  // Synchroniser le champ URL si les settings externes changent
  useEffect(() => {
    setUrlInput(serverUrl);
  }, [serverUrl, open]);

  const handleUrlBlur = () => {
    const trimmed = urlInput.trim().replace(/\/$/, ""); // retirer le slash final
    setUrlInput(trimmed);
    if (trimmed !== serverUrl) {
      setServerUrl(trimmed);
    }
  };

  const handleTestConnection = async () => {
    const trimmed = urlInput.trim().replace(/\/$/, "");
    if (trimmed !== serverUrl) {
      setServerUrl(trimmed);
      setUrlInput(trimmed);
    }
    await checkConnection();
  };

  const statusChip = () => {
    if (isLoading) {
      return (
        <Chip
          icon={<CircularProgress size={14} />}
          label="Test en cours..."
          color="default"
          size="small"
        />
      );
    }
    if (isReady) {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Connecté"
          color="success"
          size="small"
        />
      );
    }
    if (hasError) {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="Non connecté"
          color="error"
          size="small"
        />
      );
    }
    return (
      <Chip
        icon={<WifiIcon />}
        label="Non testé"
        color="default"
        variant="outlined"
        size="small"
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WifiIcon color="primary" />
          <span>Paramètres IA — LM Studio</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          L'app utilise LM Studio comme moteur IA local pour analyser vos PDF.
          Assurez-vous que LM Studio est ouvert avec un modèle chargé et le
          serveur démarré.
        </Typography>

        {/* URL du serveur */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="URL du serveur LM Studio"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            fullWidth
            size="small"
            placeholder="http://localhost:1234"
            helperText="PC : http://localhost:1234 — Téléphone (via proxy) : l'URL de cette app"
          />
          {/* Aide mode téléphone */}
          {(() => {
            const isGithubPages =
              window.location.hostname.endsWith("github.io") ||
              window.location.protocol === "https:";
            if (isGithubPages) {
              return (
                <Alert
                  severity="info"
                  sx={{ mt: 1 }}
                  icon={<PhoneAndroidIcon />}
                >
                  <strong>Utilisation sur téléphone</strong>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    GitHub Pages (HTTPS) bloque les connexions vers LM Studio en
                    HTTP. Pour utiliser l'IA sur votre téléphone :
                  </Typography>
                  <ol style={{ paddingLeft: 16, margin: "4px 0 0" }}>
                    <li>
                      Sur le PC, lancez : <code>npm run serve</code>
                    </li>
                    <li>
                      Sur le téléphone, ouvrez{" "}
                      <strong>http://192.168.1.73:3000</strong> (l'IP affichée
                      dans le terminal)
                    </li>
                    <li>
                      Dans Paramètres IA, l'URL sera remplie automatiquement
                    </li>
                  </ol>
                </Alert>
              );
            }
            return (
              <Button
                size="small"
                variant="text"
                startIcon={<PhoneAndroidIcon />}
                sx={{ mt: 0.5, fontSize: "0.75rem" }}
                onClick={() => {
                  const origin = window.location.origin;
                  setUrlInput(origin);
                  setServerUrl(origin);
                }}
              >
                Utiliser l'URL de cette app (mode téléphone)
              </Button>
            );
          })()}
        </Box>

        {/* Bouton tester + statut */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleTestConnection}
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={16} /> : <WifiIcon />
            }
          >
            Tester la connexion
          </Button>
          {statusChip()}
        </Box>

        {/* Message d'erreur */}
        {hasError && errorMessage && (
          <>
            {errorMessage === "CORS_OR_NETWORK" ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Connexion bloquée (CORS ou réseau)</strong>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Le navigateur a bloqué la requête. Deux causes possibles :
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold" }}>
                  1. CORS non activé dans LM Studio
                </Typography>
                <ol style={{ paddingLeft: 16, margin: "4px 0 0" }}>
                  <li>
                    LM Studio → onglet <strong>Developer</strong>
                  </li>
                  <li>
                    Activer <strong>CORS</strong> (interrupteur en haut)
                  </li>
                  <li>
                    <strong>Stop</strong> puis <strong>Start Server</strong>
                  </li>
                </ol>
                {urlInput.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1.5, fontWeight: "bold" }}
                    >
                      2. Pare-feu Windows bloque le port 1234
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      LM Studio tourne bien mais seul <em>localhost</em> peut y
                      accéder. Pour autoriser le réseau local :
                    </Typography>
                    <ol style={{ paddingLeft: 16, margin: "4px 0 0" }}>
                      <li>
                        Ouvrir <strong>Pare-feu Windows Defender</strong>
                      </li>
                      <li>
                        → <strong>Règles de trafic entrant</strong> → Nouvelle
                        règle
                      </li>
                      <li>
                        Type : <strong>Port</strong> → TCP → port{" "}
                        <strong>1234</strong>
                      </li>
                      <li>
                        Autoriser la connexion → appliquer sur{" "}
                        <strong>Domaine + Privé</strong>
                      </li>
                    </ol>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      Astuce rapide (PowerShell admin) :{" "}
                      <code>
                        netsh advfirewall firewall add rule name="LMStudio"
                        protocol=TCP dir=in localport=1234 action=allow
                      </code>
                    </Typography>
                  </>
                )}
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Vérifiez que LM Studio est ouvert, qu'un modèle est chargé, et
                  que le serveur est démarré (onglet Developer → Start Server).
                </Typography>
              </Alert>
            )}
          </>
        )}

        {/* Succès + sélecteur de modèle */}
        {isReady && (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              {availableModels.length > 0
                ? `${availableModels.length} modèle(s) disponible(s) sur le serveur.`
                : "Serveur connecté."}
            </Alert>

            {availableModels.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Modèle à utiliser</InputLabel>
                <Select
                  value={modelId ?? availableModels[0] ?? ""}
                  label="Modèle à utiliser"
                  onChange={(e) => setModelId(e.target.value || null)}
                >
                  {availableModels.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Sélectionnez le modèle chargé dans LM Studio
                </FormHelperText>
              </FormControl>
            )}
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Guide rapide */}
        <Typography variant="caption" component="div" color="text.secondary">
          <strong>Configuration LM Studio :</strong>
          <ol style={{ paddingLeft: 16, margin: "4px 0" }}>
            <li>Ouvrir LM Studio → onglet Developer (&lt;-&gt;)</li>
            <li>Charger votre modèle Qwen3-32B</li>
            <li>
              Activer <em>Enable CORS</em> et <em>Serve on Local Network</em>
            </li>
            <li>
              Cliquer sur <em>Start Server</em>
            </li>
            <li>Revenir ici et tester la connexion</li>
          </ol>
          <strong>Accès depuis téléphone (même WiFi) :</strong> remplacez
          <code> localhost</code> par l'adresse IP locale de votre PC (ex :{" "}
          <code>http://192.168.1.X:1234</code>).
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AISettingsDialog;
