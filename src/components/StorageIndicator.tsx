import React, { useState, useEffect } from "react";
import { Box, Typography, Tooltip, Chip } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  isStoragePersisted,
  getStorageEstimate,
  StorageEstimate,
} from "../services/storageManager";

const StorageIndicator: React.FC = () => {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    const check = async () => {
      setPersisted(await isStoragePersisted());
      setEstimate(await getStorageEstimate());
    };
    check();
  }, []);

  if (persisted === null) return null;

  const usedLabel = estimate
    ? `${estimate.usedMB < 1 ? "< 1" : estimate.usedMB.toFixed(1)} Mo utilisé${estimate.quotaMB ? ` / ${Math.round(estimate.quotaMB)} Mo` : ""}`
    : "";

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {persisted ? "Stockage persistant" : "Stockage non persistant"}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            {persisted
              ? "Vos données sont protégées contre le nettoyage automatique du navigateur."
              : "Le navigateur peut effacer vos données en cas de manque d'espace disque. Installez l'app en PWA pour activer la persistance."}
          </Typography>
          {usedLabel && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
              {usedLabel}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Chip
        icon={
          persisted ? (
            <CheckCircleIcon sx={{ fontSize: 16 }} />
          ) : (
            <WarningIcon sx={{ fontSize: 16 }} />
          )
        }
        label={
          <Typography variant="caption">
            {persisted ? "Stockage sécurisé" : "Stockage limité"}
          </Typography>
        }
        size="small"
        color={persisted ? "success" : "warning"}
        variant="outlined"
        sx={{ height: 24, cursor: "help" }}
      />
    </Tooltip>
  );
};

export default StorageIndicator;
