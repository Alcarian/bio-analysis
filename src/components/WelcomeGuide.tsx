import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  VpnKey as VpnKeyIcon,
  CloudUpload as CloudUploadIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

interface WelcomeGuideProps {
  open: boolean;
  onComplete: (password?: string) => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ open, onComplete }) => {
  const [step, setStep] = useState<"intro" | "password-ask" | "password-input">(
    "intro",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleNoPassword = () => {
    onComplete();
  };

  const handleYesPassword = () => {
    setStep("password-input");
  };

  const handleSubmitPassword = () => {
    if (password.trim()) {
      onComplete(password.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password.trim()) {
      handleSubmitPassword();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
      disableEscapeKeyDown
    >
      {/* Header */}
      <Box
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)"
              : "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          px: { xs: 2, sm: 4 },
          py: { xs: 1.5, sm: 2 },
          color: "white",
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src="/Logo-bio-analysis.png"
          alt="Bio Analysis Logo"
          sx={{
            height: 200,
            mb: 0,
            objectFit: "contain",
            display: "block",
            mx: "auto",
          }}
        />
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700 }}>
          Bienvenue sur Bio Analysis
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
          Analysez vos résultats biologiques en quelques clics
        </Typography>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        {/* Step: Intro — Comment ça marche */}
        {step === "intro" && (
          <Fade in>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, textAlign: "center" }}
              >
                Comment ça marche ?
              </Typography>

              <Stepper orientation="vertical" activeStep={-1} sx={{ mb: 2 }}>
                <Step active>
                  <StepLabel
                    StepIconProps={{
                      icon: <CloudUploadIcon fontSize="small" />,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Importez vos PDF</strong> — Glissez-déposez vos
                      fichiers PDF de résultats d'analyses biologiques.
                    </Typography>
                  </StepLabel>
                </Step>
                <Step active>
                  <StepLabel
                    StepIconProps={{
                      icon: <AnalyticsIcon fontSize="small" />,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Analyse automatique</strong> — L'application
                      extrait et organise vos données automatiquement.
                    </Typography>
                  </StepLabel>
                </Step>
                <Step active>
                  <StepLabel
                    StepIconProps={{
                      icon: <TrendingUpIcon fontSize="small" />,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Suivez votre santé</strong> — Visualisez
                      l'évolution de vos paramètres via des graphiques.
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>

              <Alert severity="info" sx={{ mt: 2 }}>
                Vos données restent <strong>100% locales</strong> sur votre
                appareil. Rien n'est envoyé sur un serveur.
              </Alert>
            </Box>
          </Fade>
        )}

        {/* Step: Password Ask */}
        {step === "password-ask" && (
          <Fade in>
            <Box>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <VpnKeyIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Vos PDF sont-ils protégés par un mot de passe ?
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 2, textAlign: "center" }}
              >
                Les résultats de laboratoire sont souvent protégés par un mot de
                passe (par exemple votre date de naissance au format{" "}
                <strong>JJMMAAAA</strong>).
              </Typography>

              <Alert severity="info" icon={false} sx={{ mb: 2 }}>
                🔒 Le mot de passe sera conservé{" "}
                <strong>uniquement en local</strong> sur votre appareil de
                manière chiffrée. Il ne sera jamais transmis à un serveur.
              </Alert>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mt: 3,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleYesPassword}
                  startIcon={<VpnKeyIcon />}
                  sx={{ textTransform: "none", px: 4 }}
                >
                  Oui, définir le mot de passe
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleNoPassword}
                  sx={{ textTransform: "none", px: 4 }}
                >
                  Non, continuer sans
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step: Password Input */}
        {step === "password-input" && (
          <Fade in>
            <Box>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <VpnKeyIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Entrez le mot de passe de vos PDF
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 3, textAlign: "center" }}
              >
                Souvent votre date de naissance au format{" "}
                <strong>JJMMAAAA</strong> (ex : 15031990 pour le 15 mars 1990).
              </Typography>

              <TextField
                autoFocus
                fullWidth
                label="Mot de passe PDF"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex : 15031990"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon color="action" />
                    </InputAdornment>
                  ),
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

              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mb: 1 }}
              >
                Ce mot de passe sera sauvegardé localement de manière chiffrée.
                Vous n'aurez pas besoin de le re-saisir lors de vos prochains
                imports.
              </Alert>
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 3 }, pt: 0 }}>
        {step === "intro" && (
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => setStep("password-ask")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Continuer
          </Button>
        )}

        {step === "password-input" && (
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <Button
              variant="outlined"
              onClick={() => setStep("password-ask")}
              sx={{ textTransform: "none" }}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={!password.trim()}
              onClick={handleSubmitPassword}
              startIcon={<CheckCircleIcon />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Valider et commencer
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeGuide;
