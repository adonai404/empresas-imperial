export type ProcessingStatus = 'pending' | 'parsing' | 'extracting' | 'saving' | 'success' | 'error';

export interface PdfFileState {
  file: File;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  extractedData?: ExtractedFiscalData;
}

export interface ExtractedFiscalData {
  empresa: string;
  cnpj: string;
  periodo: string; // MM/YYYY
  entradas: number | null;
  saidas: number | null;
  servicos: number | null;
  icms?: number | null;
  pis?: number | null;
  cofins?: number | null;
  regime_tributario?: 'simples_nacional' | 'lucro_real';
}

export interface ImportSummary {
  total: number;
  success: number;
  errors: number;
  results: Array<{
    filename: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}
