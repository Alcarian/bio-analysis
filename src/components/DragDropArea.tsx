import { Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import { useDropzone } from "react-dropzone";

interface DragDropAreaProps {
  onFilesDropped: (files: File[]) => void;
}

const DragDropArea: React.FC<DragDropAreaProps> = ({ onFilesDropped }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf",
      );
      onFilesDropped(pdfFiles);
    },
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: { xs: 2, sm: 4 },
        textAlign: "center",
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : "divider",
        backgroundColor: isDragActive ? "action.hover" : "background.paper",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "action.hover",
        },
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon
        sx={{
          fontSize: { xs: 40, sm: 64 },
          color: "primary.main",
          mb: { xs: 1, sm: 2 },
        }}
      />
      <Typography
        variant="h6"
        sx={{ mb: 1, fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
      >
        Glissez-déposez vos fichiers PDF ici
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
      >
        ou cliquez pour sélectionner plusieurs fichiers
      </Typography>
    </Paper>
  );
};

export default DragDropArea;
