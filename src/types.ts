export interface CLIConfig {
  mode: 'file' | 'csv';
  categories: string[];
  sources: string[];
  port?: number;
  noBrowser?: boolean;
  columns?: string[]; // CSV column subset to display
  reset?: boolean; // Clear all classifications and comments
}

export interface Classification {
  itemId: string;
  category: number;
  categoryName: string;
  timestamp: string;
  comment?: string;
}

export interface SessionState {
  config: CLIConfig;
  currentIndex: number;
  classifications: Classification[];
  items: ClassificationItem[];
  totalItems: number;
  startTime: string;
}

export interface ClassificationItem {
  id: string;
  content: string;
  filename?: string;
  lineNumbers?: number[];
  csvRow?: Record<string, string>;
  line: number; // 0 for files, 1-based row number for CSV data rows
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClassificationRequest {
  itemIndex: number;
  category: number;
}

export interface CommentRequest {
  itemIndex: number;
  comment: string;
}

export interface ExportData {
  sessionId: string;
  config: CLIConfig;
  classifications: Classification[];
  summary: {
    totalItems: number;
    classifiedItems: number;
    unclassifiedItems: number;
    categoryCounts: Record<string, number>;
  };
  exportedAt: string;
}