import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import DragDropArea from "../components/DragDropArea";
import FileList from "../components/FileList";
import { FileItem, FileStatus } from "../types";

interface ImportTabProps {
  files: FileItem[];
  fileStatuses: Record<string, FileStatus>;
  processingFile: string | null;
  isProcessing: boolean;
  onFilesDropped: (files: File[]) => Promise<void>;
  onDelete: (fileName: string) => void;
  onAnalyze: (fileName: string) => Promise<void>;
  onProcessAll: () => void;
  onDeleteAll: () => void;
}

const ImportTab: React.FC<ImportTabProps> = ({
  files,
  fileStatuses,
  processingFile,
  isProcessing,
  onFilesDropped,
  onDelete,
  onAnalyze,
  onProcessAll,
  onDeleteAll,
}) => {
  const pendingCount = files.filter(
    (f) => fileStatuses[f.name] !== "done",
  ).length;

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Ajouter de nouveaux fichiers PDF
        </Typography>
        <DragDropArea onFilesDropped={onFilesDropped} />
      </Box>

      {files.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
            Fichiers disponibles ({files.length})
          </Typography>
          <Box
            sx={{
              mt: 3,
              display: "flex",
              gap: { xs: 1, sm: 2 },
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={onProcessAll}
              disabled={isProcessing}
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                flex: { xs: "1 1 100%", sm: "0 0 auto" },
              }}
            >
              {isProcessing
                ? "Analyse en cours..."
                : `Analyser tout (${pendingCount} restant${pendingCount > 1 ? "s" : ""})`}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={onDeleteAll}
              disabled={isProcessing}
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                flex: { xs: "1 1 100%", sm: "0 0 auto" },
              }}
            >
              Tout supprimer
            </Button>
          </Box>
          <FileList
            files={files.map((f) => new File([], f.name))}
            onDelete={onDelete}
            onAnalyze={onAnalyze}
            fileStatuses={fileStatuses}
            processingFile={processingFile}
          />
        </Box>
      )}
    </>
  );
};

export default ImportTab;
