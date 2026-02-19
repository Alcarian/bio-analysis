import { useState, useEffect, useMemo, useCallback } from "react";
import { PatientAnalysis } from "../types";
import {
  getPatientHistory,
  deleteAnalysis,
  deleteAllAnalyses,
  migrateHistoryFromLocalStorage,
} from "../services/patientHistory";
import {
  getPatientHistoryEncrypted,
  deleteAnalysisEncrypted,
  deleteAllAnalysesEncrypted,
} from "../services/encryptedStorage";
import { useAuth } from "../contexts/AuthContext";
import { sortByDateDesc, parseDate } from "../utils/dateUtils";
import { PATIENT_ID } from "../constants";

interface UseAnalysesReturn {
  analyses: PatientAnalysis[];
  displayedAnalyses: PatientAnalysis[];
  analysisSearch: string;
  setAnalysisSearch: (search: string) => void;
  analysisSortOrder: "desc" | "asc";
  toggleSortOrder: () => void;
  refreshAnalyses: () => void;
  handleDeleteAnalysis: (analysisId: string) => void;
  handleDeleteAllAnalyses: () => void;
}

export const useAnalyses = (): UseAnalysesReturn => {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [analysisSortOrder, setAnalysisSortOrder] = useState<"desc" | "asc">(
    "desc",
  );
  const { pin } = useAuth();

  const refreshAnalyses = useCallback(async () => {
    if (pin) {
      const history = await getPatientHistoryEncrypted(PATIENT_ID, pin);
      setAnalyses(sortByDateDesc(history));
    } else {
      const history = await getPatientHistory(PATIENT_ID);
      setAnalyses(sortByDateDesc(history));
    }
  }, [pin]);

  useEffect(() => {
    const init = async () => {
      await migrateHistoryFromLocalStorage();
      await refreshAnalyses();
    };
    init();
  }, [refreshAnalyses]);

  const displayedAnalyses = useMemo(() => {
    const filtered = analyses.filter((a) => {
      if (!analysisSearch.trim()) return true;
      const q = analysisSearch.trim().toLowerCase();
      return (
        a.date.toLowerCase().includes(q) ||
        a.fileName.toLowerCase().includes(q) ||
        Object.keys(a.biochemistryData).some((t) => t.toLowerCase().includes(q))
      );
    });

    return filtered.sort((a, b) =>
      analysisSortOrder === "desc"
        ? parseDate(b.date) - parseDate(a.date)
        : parseDate(a.date) - parseDate(b.date),
    );
  }, [analyses, analysisSearch, analysisSortOrder]);

  const toggleSortOrder = () => {
    setAnalysisSortOrder((o) => (o === "desc" ? "asc" : "desc"));
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (pin) {
      await deleteAnalysisEncrypted(PATIENT_ID, analysisId, pin);
    } else {
      await deleteAnalysis(PATIENT_ID, analysisId);
    }
    await refreshAnalyses();
  };

  const handleDeleteAllAnalyses = async () => {
    if (
      !window.confirm(
        "Supprimer toutes les analyses ? Cette action est irréversible.",
      )
    )
      return;
    if (pin) {
      await deleteAllAnalysesEncrypted(PATIENT_ID);
    } else {
      await deleteAllAnalyses(PATIENT_ID);
    }
    setAnalyses([]);
  };

  return {
    analyses,
    displayedAnalyses,
    analysisSearch,
    setAnalysisSearch,
    analysisSortOrder,
    toggleSortOrder,
    refreshAnalyses,
    handleDeleteAnalysis,
    handleDeleteAllAnalyses,
  };
};
