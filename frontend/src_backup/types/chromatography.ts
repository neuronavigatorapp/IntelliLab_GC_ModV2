// Chromatography Types for Calibration, Quantitation & Sequences

export interface Peak {
  id?: string;
  rt: number;
  area: number;
  height: number;
  width: number;
  name?: string;
  snr?: number;
  compound_id?: string;
  confidence?: number;
}

export interface RunRecord {
  id?: number;
  timestamp: string;
  instrument_id?: number;
  method_id?: number;
  sample_name: string;
  time: number[];
  signal: number[];
  peaks: Peak[];
  baseline?: number[];
  notes?: string;
  metadata?: any;
  created_date?: string;
  modified_date?: string;
}

// Calibration Types
export interface CalibrationLevel {
  level_id?: string;
  target_name: string;
  amount: number;
  unit: 'ppm' | 'ppb' | 'mg/L';
  peak_name?: string;
  area?: number;
  rt?: number;
}

export interface CalibrationModel {
  id?: string;
  method_id: number;
  instrument_id?: number;
  created_at: string;
  target_name: string;
  model_type: 'linear' | 'linear_through_zero' | 'weighted_1/x' | 'weighted_1/x2';
  levels: CalibrationLevel[];
  slope?: number;
  intercept?: number;
  r2?: number;
  residuals?: number[];
  lod?: number;
  loq?: number;
  notes?: string;
  active: boolean;
}

export interface CalibrationFitRequest {
  method_id: number;
  instrument_id?: number;
  target_name: string;
  model_type: string;
  levels: CalibrationLevel[];
}

export interface CalibrationListResponse {
  calibrations: CalibrationModel[];
  total: number;
  active_calibration_id?: string;
}

// Quantitation Types
export interface QuantRequest {
  run_id: number;
  calibration_id: string;
  map?: Record<string, string>;
}

export interface QuantResult {
  run_id: number;
  sample_name: string;
  results: Array<{
    targetName: string;
    rt?: number;
    area: number;
    response?: number;
    concentration: number;
    unit: string;
    snr?: number;
    flags?: string[];
  }>;
}

// Sequence Types
export interface SequenceItem {
  id?: string;
  order: number;
  type: 'Blank' | 'Std' | 'Sample' | 'QC';
  sample_name: string;
  method_id: number;
  expected_level?: number;
}

export interface SequenceTemplate {
  id?: string;
  name: string;
  instrument_id?: number;
  items: SequenceItem[];
  created_at: string;
  notes?: string;
}

export interface SequenceRun {
  id?: string;
  created_at: string;
  instrument_id: number;
  template_id?: string;
  items: SequenceItem[];
  runs: RunRecord[];
  quant: QuantResult[];
  status: 'draft' | 'running' | 'completed' | 'error';
  notes?: string;
}

export interface SequenceRunRequest {
  template_id?: string;
  template?: SequenceTemplate;
  instrument_id: number;
  simulate: boolean;
}

export interface SequenceTemplateListResponse {
  templates: SequenceTemplate[];
  total: number;
}

export interface SequenceRunListResponse {
  runs: SequenceRun[];
  total: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ErrorResponse {
  detail: string;
  status_code: number;
}

