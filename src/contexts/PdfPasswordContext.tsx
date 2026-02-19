import React, { createContext, useContext, useState, useCallback } from "react";

interface PdfPasswordContextValue {
  /** Le mot de passe PDF en mémoire (jamais persisté) */
  pdfPassword: string;
  /** Met à jour le mot de passe PDF */
  setPdfPassword: (password: string) => void;
  /** Indique si le mot de passe a été défini pour cette session */
  isSet: boolean;
}

const PdfPasswordContext = createContext<PdfPasswordContextValue>({
  pdfPassword: "",
  setPdfPassword: () => {},
  isSet: false,
});

export const usePdfPassword = () => useContext(PdfPasswordContext);

export const PdfPasswordProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pdfPassword, setPasswordState] = useState("");
  const [isSet, setIsSet] = useState(false);

  const setPdfPassword = useCallback((password: string) => {
    setPasswordState(password);
    setIsSet(true);
  }, []);

  return (
    <PdfPasswordContext.Provider value={{ pdfPassword, setPdfPassword, isSet }}>
      {children}
    </PdfPasswordContext.Provider>
  );
};
