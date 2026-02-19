export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data?: string;
}

export type FileStatus = "pending" | "processing" | "done" | "error";

export interface BiochemistryValue {
  value: number;
  unit: string;
  normalRange?: string;
  normalMin?: number;
  normalMax?: number;
  isAbnormal: boolean;
  trend?: "up" | "down" | "stable";
}

export interface PatientAnalysis {
  id: string;
  date: string;
  timestamp: number;
  fileName: string;
  biochemistryData: {
    [testName: string]: BiochemistryValue;
  };
}
