import React, { useState, useEffect, useCallback } from "react";
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  PhoneAndroid as MobileIcon,
  DesktopWindows as DesktopIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

// Clé localStorage pour ne pas ré-afficher le bandeau après dismiss
const INSTALL_DISMISSED_KEY = "bio-analysis-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Détecte si l'app tourne déjà en mode installé (standalone)
 */
const isStandalone = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * Détecte iOS (Safari)
 */
const isIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as unknown as { MSStream?: unknown }).MSStream;

const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Ne rien afficher si déjà installé ou déjà refusé
    if (isStandalone()) return;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    // Chrome / Edge / Samsung Internet : capturer le prompt natif
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Détecter l'installation réussie
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // iOS : pas de beforeinstallprompt, on affiche un guide manuel
    if (isIOS()) {
      // Attendre un peu avant d'afficher pour ne pas être trop intrusif
      const timer = setTimeout(() => {
        if (!isStandalone()) {
          setShowIOSGuide(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Pour les navigateurs compatibles PWA (non-iOS), afficher après un délai
    // si le prompt n'a pas été capturé (cas rare)
    const fallbackTimer = setTimeout(() => {
      if (
        !isStandalone() &&
        !isIOS() &&
        !deferredPrompt &&
        "serviceWorker" in navigator
      ) {
        setShowBanner(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Déclenche le prompt d'installation natif (Chrome/Edge) */
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  /** L'utilisateur ferme le bandeau */
  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  }, []);

  // ── Snackbar « App installée avec succès » ──
  if (installed) {
    return (
      <Snackbar
        open
        autoHideDuration={4000}
        onClose={() => setInstalled(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Bio Analysis a été installée avec succès !
        </Alert>
      </Snackbar>
    );
  }

  // ── Guide iOS (Safari → Partager → Ajouter à l'écran d'accueil) ──
  // ── Bandeau principal (Chrome / Edge / autres) ──
  const open = showIOSGuide || showBanner;

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="xs"
      fullWidth
      sx={{ zIndex: 1500 }}
      PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
    >
      <DialogContent sx={{ pb: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isMobile ? (
              <MobileIcon color="primary" fontSize="medium" />
            ) : (
              <DesktopIcon color="primary" fontSize="medium" />
            )}
            <Typography variant="subtitle1" fontWeight={700}>
              Installer Bio Analysis
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDismiss}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {showIOSGuide ? (
          // Contenu iOS
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Pour installer l'application sur votre appareil :
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2">
                1. Appuyez sur{" "}
                <ShareIcon
                  sx={{ fontSize: 16, verticalAlign: "middle", mx: 0.5 }}
                />{" "}
                <strong>Partager</strong>
              </Typography>
              <Typography variant="body2">
                2. Faites défiler et appuyez sur{" "}
                <strong>« Sur l'écran d'accueil »</strong>
              </Typography>
              <Typography variant="body2">
                3. Appuyez sur <strong>Ajouter</strong>
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              💡 L'app fonctionnera 100% hors-ligne, sans aucune donnée envoyée
              sur internet.
            </Typography>
          </Box>
        ) : (
          // Contenu Chrome / Edge
          <Typography variant="body2" color="textSecondary">
            Installez l'application pour un accès rapide depuis votre{" "}
            {isMobile ? "écran d'accueil" : "bureau"}. Vos données restent 100%
            locales et chiffrées.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5 }}>
        <Button size="small" onClick={handleDismiss} color="inherit">
          Plus tard
        </Button>
        {!showIOSGuide &&
          (deferredPrompt ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<InstallIcon />}
              onClick={handleInstall}
            >
              Installer
            </Button>
          ) : (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ py: 0.5 }}
            >
              Utilisez le menu de votre navigateur pour installer l'app.
            </Typography>
          ))}
      </DialogActions>
    </Dialog>
  );
};

export default InstallPromptBanner;
