import React, { useEffect, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";

/**
 * Bannière affichée lorsqu'une nouvelle version de l'application est disponible.
 * Écoute l'événement personnalisé "swUpdate" émis par index.tsx lors d'une MAJ du Service Worker.
 */
const UpdateBanner: React.FC = () => {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Garde contre les reloads multiples : si le controller change, on reload UNE seule fois
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    return () => {
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const reg = (e as CustomEvent<ServiceWorkerRegistration>).detail;
      setRegistration(reg);
    };
    window.addEventListener("swUpdate", handler);
    return () => window.removeEventListener("swUpdate", handler);
  }, []);

  const handleReload = () => {
    if (refreshing) return;
    setRefreshing(true);
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return (
    <Snackbar
      open={!!registration}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: { xs: 1, sm: 2 } }}
    >
      <Alert
        severity="info"
        icon={<SystemUpdateAltIcon fontSize="inherit" />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleReload}
            sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
          >
            Recharger l'application
          </Button>
        }
        sx={{ width: "100%", alignItems: "center" }}
      >
        Une nouvelle version est disponible.
      </Alert>
    </Snackbar>
  );
};

export default UpdateBanner;
