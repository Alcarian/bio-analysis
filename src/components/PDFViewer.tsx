import React from "react";
import { Box, Typography } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

interface PDFViewerProps {
  file: File;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 1,
      }}
    >
      <PictureAsPdfIcon sx={{ color: "#d32f2f", fontSize: 40 }} />
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {file.name}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {(file.size / 1024).toFixed(2)} KB · PDF
        </Typography>
      </Box>
    </Box>
  );
};

export default PDFViewer;
