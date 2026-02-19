import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PDFViewer from "./PDFViewer";
import { getFileFromStorage } from "../services/fileStorage";
import { getFileEncrypted } from "../services/encryptedStorage";
import { useAuth } from "../contexts/AuthContext";
import { FileStatus } from "../types";

interface FileListProps {
  files: File[];
  onDelete: (fileName: string) => void;
  onAnalyze?: (fileName: string) => void;
  fileStatuses?: Record<string, FileStatus>;
  processingFile?: string | null;
}

const statusChip = (status: FileStatus, isCurrent: boolean) => {
  if (isCurrent)
    return (
      <Chip
        icon={<HourglassEmptyIcon />}
        label="En cours..."
        color="warning"
        size="small"
        variant="outlined"
      />
    );
  if (status === "done")
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Analysé"
        color="success"
        size="small"
        variant="outlined"
      />
    );
  if (status === "error")
    return (
      <Chip label="Erreur" color="error" size="small" variant="outlined" />
    );
  return null;
};

/**
 * Composant individuel pour chaque fichier dans la liste.
 * Charge le fichier PDF depuis IndexedDB de manière asynchrone.
 */
const FileListItem: React.FC<{
  file: File;
  status: FileStatus;
  isCurrent: boolean;
  isDone: boolean;
  onDelete: (fileName: string) => void;
  onAnalyze?: (fileName: string) => void;
}> = ({ file, status, isCurrent, isDone, onDelete, onAnalyze }) => {
  const [storedFile, setStoredFile] = useState<File | null>(null);
  const { pin } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const loadFile = pin
      ? getFileEncrypted(file.name, pin)
      : getFileFromStorage(file.name);
    loadFile.then((f) => {
      if (!cancelled) setStoredFile(f);
    });
    return () => {
      cancelled = true;
    };
  }, [file.name, pin]);

  return (
    <ListItem
      key={file.name}
      sx={{
        px: 0,
        flexDirection: "column",
        alignItems: "flex-start",
        borderBottom: "1px solid",
        borderColor: "divider",
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.5, sm: 1 },
          width: "100%",
          mb: storedFile ? 1 : 0,
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 auto" },
            fontWeight: 500,
            wordBreak: "break-all",
            mb: { xs: 0.5, sm: 0 },
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
          }}
        >
          {file.name}
        </Typography>
        {statusChip(status, isCurrent)}
        {onAnalyze && (
          <Tooltip title={isDone ? "Ré-analyser" : "Analyser"}>
            <span>
              <Button
                size="small"
                variant={isDone ? "outlined" : "contained"}
                color="primary"
                startIcon={<AnalyticsIcon />}
                onClick={() => onAnalyze(file.name)}
                disabled={isCurrent}
                sx={{
                  whiteSpace: "nowrap",
                  fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                  px: { xs: 1, sm: 1.5 },
                }}
              >
                {isDone ? "Ré-analyser" : "Analyser"}
              </Button>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Supprimer">
          <span>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => onDelete(file.name)}
              disabled={isCurrent}
              color="error"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {storedFile && <PDFViewer file={storedFile} />}
    </ListItem>
  );
};

const FileList: React.FC<FileListProps> = ({
  files,
  onDelete,
  onAnalyze,
  fileStatuses = {},
  processingFile = null,
}) => {
  const statusOrder: Record<FileStatus, number> = {
    error: 0,
    pending: 1,
    processing: 2,
    done: 3,
  };

  const sortedFiles = [...files].sort((a, b) => {
    const sa = fileStatuses[a.name] ?? "pending";
    const sb = fileStatuses[b.name] ?? "pending";
    return statusOrder[sa] - statusOrder[sb];
  });

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Fichiers PDF importés
      </Typography>
      <List disablePadding>
        {sortedFiles.map((file) => {
          const status: FileStatus = fileStatuses[file.name] ?? "pending";
          const isCurrent = processingFile === file.name;
          const isDone = status === "done";

          return (
            <FileListItem
              key={file.name}
              file={file}
              status={status}
              isCurrent={isCurrent}
              isDone={isDone}
              onDelete={onDelete}
              onAnalyze={onAnalyze}
            />
          );
        })}
      </List>
    </Box>
  );
};

export default FileList;
