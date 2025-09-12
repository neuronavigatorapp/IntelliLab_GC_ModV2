/**
 * QC Auto-Flagging, Control Charts & QC-Aware Sequences Types
 */

export interface QCTarget {
  id: string;
  methodId: string;
  instrumentId?: string;
  analyte: string;
  mean: number;
  sd: number;
  unit: string;
  n_required: number;
}

export interface QCRuleHit {
  rule: string; // '1-2s', '1-3s', '2-2s', 'R-4s', '4-1s', '10-x'
  analyte: string;
  value: number;
  zscore: number;
  runId: string;
  timestamp: string;
}

export interface QCResult {
  analyte: string;
  value: number;
  unit: string;
  zscore: number;
  flags: string[];
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface QCRecord {
  id: string;
  runId: string;
  timestamp: string;
  results: QCResult[];
  ruleHits: QCRuleHit[];
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  notes?: string;
}

export interface QCTimeSeriesPoint {
  timestamp: string;
  analyte: string;
  value: number;
  mean: number;
  sd: number;
}

export interface QCPolicy {
  stopOnFail: boolean;
  warnOn1_2s: boolean;
  requireNBeforeStrict: number;
}

// Chart-specific types for Levey-Jennings charts
export interface LeveyJenningsChartData {
  analyte: string;
  points: QCTimeSeriesPoint[];
  target: QCTarget;
  ruleHits: QCRuleHit[];
}

export interface QCChartOptions {
  showBands: boolean;
  showRuleHits: boolean;
  showTrends: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}

// API request/response types
export interface QCTargetRequest {
  methodId: string;
  instrumentId?: string;
  analyte: string;
  mean: number;
  sd: number;
  unit?: string;
  n_required?: number;
}

export interface QCSeriesRequest {
  analyte: string;
  methodId: string;
  instrumentId?: string;
  days?: number;
}

export interface QCRecordsRequest {
  methodId?: string;
  instrumentId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface QCStatus {
  total_targets: number;
  total_records: number;
  recent_failures: number;
  policy: QCPolicy;
  system_status: string;
}

// Form types for UI components
export interface QCTargetFormData {
  methodId: string;
  instrumentId: string;
  analyte: string;
  mean: string;
  sd: string;
  unit: string;
  n_required: string;
}

export interface QCDashboardFilters {
  methodId?: string;
  instrumentId?: string;
  analyte?: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// Westgard rule definitions for UI
export interface WestgardRule {
  id: string;
  name: string;
  description: string;
  severity: 'WARNING' | 'CRITICAL';
  color: string;
}

export const WESTGARD_RULES: WestgardRule[] = [
  {
    id: '1-2s',
    name: '1-2s',
    description: 'Single point beyond ±2σ',
    severity: 'WARNING',
    color: '#FFA500'
  },
  {
    id: '1-3s',
    name: '1-3s',
    description: 'Single point beyond ±3σ',
    severity: 'CRITICAL',
    color: '#FF0000'
  },
  {
    id: '2-2s',
    name: '2-2s',
    description: 'Two consecutive points beyond ±2σ on same side',
    severity: 'CRITICAL',
    color: '#FF4500'
  },
  {
    id: 'R-4s',
    name: 'R-4s',
    description: 'Two consecutive points differing by ≥4σ',
    severity: 'CRITICAL',
    color: '#DC143C'
  },
  {
    id: '4-1s',
    name: '4-1s',
    description: 'Four consecutive points beyond ±1σ on same side',
    severity: 'CRITICAL',
    color: '#B22222'
  },
  {
    id: '10-x',
    name: '10-x',
    description: 'Ten consecutive points on same side of mean',
    severity: 'CRITICAL',
    color: '#8B0000'
  }
];

export const QC_STATUS_COLORS = {
  PASS: '#28a745',
  WARN: '#ffc107',
  FAIL: '#dc3545'
};

export const QC_CHART_COLORS = {
  mean: '#007bff',
  plus1sigma: '#28a745',
  minus1sigma: '#28a745',
  plus2sigma: '#ffc107',
  minus2sigma: '#ffc107',
  plus3sigma: '#dc3545',
  minus3sigma: '#dc3545',
  data: '#6c757d',
  ruleHit: '#dc3545'
};
