// Core application types
export interface AppState {
  instruments: InstrumentState;
  calculations: CalculationState;
  ui: UIState;
  websocket: WebSocketState;
}

// Instrument types
export interface Instrument {
  id?: number;
  name: string;
  model: string;
  serial_number: string;
  install_date?: string;
  location?: string;
  age_years: number;
  maintenance_level: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  vacuum_integrity: number;
  septum_condition: 'New' | 'Good' | 'Worn' | 'Leaking';
  liner_condition: 'Clean' | 'Good' | 'Dirty' | 'Contaminated';
  oven_calibration: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  column_condition: 'New' | 'Good' | 'Worn' | 'Damaged';
  last_maintenance?: string;
  notes?: string;
  parameters?: Record<string, any>;
  calibration_data?: Record<string, any>;
  performance_history?: Record<string, any>;
  created_date?: string;
  modified_date?: string;
}

export interface InstrumentState {
  instruments: Instrument[];
  selectedInstrument: Instrument | null;
  loading: boolean;
  error: string | null;
  fleetOverview: FleetOverview | null;
}

export interface FleetOverview {
  total_instruments: number;
  average_age: number;
  maintenance_status: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  performance_metrics: {
    average_efficiency: number;
    average_uptime: number;
  };
}

// Calculation types
export interface InletSimulationRequest {
  inlet_temp: number;
  split_ratio: number;
  injection_volume: number;
  liner_type: string;
  injection_mode: string;
  carrier_gas: string;
  carrier_flow_rate: number;
  carrier_flow: number;
  inlet_pressure: number;
  purge_flow: number;
  total_flow: number;
  oven_temperature: number;
  septum_purge: number;
  instrument_age: number;
  maintenance_level: string;
  vacuum_integrity: number;
  septum_condition: string;
  liner_condition: string;
  calibration_data?: Record<string, any>;
}

export interface InletSimulationResponse {
  transfer_efficiency: number;
  discrimination_factor: number;
  peak_shape_index: number;
  optimization_score: number;
  detailed_analysis: Record<string, any>;
  recommendations: string[];
}

export interface DetectionLimitRequest {
  detector_type: string;
  carrier_gas: string;
  column_type: string;
  injector_temp: number;
  detector_temp: number;
  oven_temp: number;
  flow_rate: number;
  split_ratio: number;
  h2_flow: number;
  air_flow: number;
  makeup_flow: number;
  injection_volume: number;
  sample_concentration: number;
  signal_to_noise: number;
  noise_level: string;
  peak_height: number;
  concentration_factor: number;
  optimization_target: string;
  target_compound: string;
  instrument_age: number;
  maintenance_level: string;
  detector_calibration: string;
  column_condition: string;
  sample_matrix: string;
  analysis_type: string;
}

export interface DetectionLimitResponse {
  detection_limit: number;
  signal_to_noise: number;
  confidence_level: number;
  calculation_time: number;
  recommendations: string[];
  statistical_analysis: {
    r_squared: number;
    calibration_curve: {
      concentrations: number[];
      responses: number[];
    };
    lod: number;
    loq: number;
    linear_range: {
      lower: number;
      upper: number;
    };
    precision: number;
    accuracy: number;
  };
  instrument_factors: {
    signal_strength: number;
    noise_level: number;
    sensitivity_score: number;
    optimization_potential: number;
    instrument_condition: number;
    method_robustness: number;
  };
  astm_comparison?: {
    applicable_methods: Array<{
      method_id: string;
      method_name: string;
      astm_dl: number;
      compliance_status: string;
      performance_ratio: number;
    }>;
    compliance_rate: number;
    best_performance_ratio: number;
    astm_compliance: boolean;
  };
  optimization_potential?: {
    current_dl: number;
    optimized_dl: number;
    improvement_factor: number;
    carrier_improvement: number;
    split_improvement: number;
    temperature_improvement: number;
  };
  calibration_curve?: {
    concentrations: number[];
    responses: number[];
    detection_limit_point: number;
    linear_range: number;
  };
  noise_analysis?: {
    baseline_noise: number;
    drift_rate: number;
    noise_type: string;
    stability_score: number;
    recommendations: string[];
  };
}

export interface OvenRampRequest {
  initial_temp: number;
  initial_hold: number;
  ramp_rate_1: number;
  final_temp_1: number;
  hold_time_1: number;
  ramp_rate_2: number;
  final_temp_2: number;
  hold_time_2: number;
  ramp_rate_3: number;
  final_temp_3: number;
  hold_time_3: number;
  equilibration_time: number;
  post_run_temp: number;
  post_run_time: number;
  total_time: number;
  flow_rate: number;
  pressure: number;
  split_ratio: number;
  injector_temp: number;
  detector_temp: number;
  final_hold: number;
  instrument_age: number;
  maintenance_level: string;
  oven_calibration: string;
  column_condition: string;
  heating_rate_limit: number;
  compound_class: string;
  volatility_range: string;
  sample_complexity: string;
  column_type: string;
  analysis_type: string;
}

export interface OvenRampResponse {
  temperature_profile: TemperaturePoint[];
  resolution_score: number;
  efficiency_score: number;
  optimization_score: number;
  total_runtime: number;
  recommendations: string[];
  chromatogram_data?: ChromatogramPoint[];
  actual_heating_rates?: number[];
  retention_predictions?: {
    predictions: Record<string, {
      retention_time: number;
      confidence: number;
      factors: Record<string, any>;
    }>;
    method: string;
    confidence_level: number;
  };
  efficiency_metrics?: {
    theoretical_plates: number;
    temperature_efficiency: number;
    time_efficiency: number;
    overall_efficiency: number;
    column_condition: string;
  };
  optimization_suggestions?: string[];
  column_performance?: {
    performance_score: number;
    column_type: string;
    condition: string;
    efficiency_factor: number;
    temperature_limit: number;
  };
  method_robustness?: {
    robustness_score: number;
    parameter_quality: string;
    recommendations: string[];
  };
  calculation_timestamp?: string;
}

export interface CompoundData {
  name: string;
  retention_time: number;
  boiling_point: number;
  molecular_weight: number;
}

export interface InstrumentCondition {
  heating_rate_limit: number;
  max_temp: number;
  oven_calibration: string;
  column_condition: string;
}

export interface TemperaturePoint {
  time: number;
  temperature: number;
}

export interface ChromatogramPoint {
  time: number;
  intensity: number;
  compound?: string;
}

export interface PeakData {
  compound: string;
  retention_time: number;
  peak_width: number;
  resolution: number;
}

export interface CalculationState {
  inletSimulation: InletSimulationResponse | null;
  detectionLimit: DetectionLimitResponse | null;
  ovenRamp: OvenRampResponse | null;
  loading: boolean;
  error: string | null;
  history: CalculationHistory[];
}

export interface CalculationHistory {
  id: number;
  calculation_type: string;
  input_parameters: Record<string, any>;
  output_results: Record<string, any>;
  execution_time: number;
  created_date: string;
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
  loadingStates: Record<string, boolean>;
  modalStates: Record<string, boolean>;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// WebSocket types
export interface WebSocketState {
  connected: boolean;
  messages: WebSocketMessage[];
  error: string | null;
}

export interface WebSocketMessage {
  id: string;
  type: 'calculation_update' | 'parameter_change' | 'instrument_update' | 'generic';
  data: Record<string, any>;
  timestamp: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'slider' | 'textarea';
  required?: boolean;
  validation?: any;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface FormSection {
  title: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Chart types
export interface ChartData {
  id: string;
  type: 'line' | 'scatter' | 'bar' | 'area';
  data: any[];
  layout?: any;
  config?: any;
}

export interface ChartConfig {
  responsive: boolean;
  displayModeBar: boolean;
  displaylogo: boolean;
  modeBarButtonsToRemove?: string[];
}

// File types
export interface FileUpload {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_date: string;
}

export interface MethodFile {
  name: string;
  description: string;
  method_type: string;
  parameters: Record<string, any>;
  results?: Record<string, any>;
  optimization_data?: Record<string, any>;
  created_date: string;
  modified_date: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  title?: string;
  icon?: string;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: Error | string;
  onRetry?: () => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 