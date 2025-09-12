import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { validateSplitRatio, validateFlowRate, validateCalibrationData, ValidationError } from '../utils/validation';

const API_BASE_URL = 'http://localhost:8000';
const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and validation
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Request data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retries
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check if the backend server is running on port 8000');
    }
    
    // Handle network errors
    if (!error.response) {
      if (originalRequest && !originalRequest._retry && (originalRequest._retryCount || 0) < MAX_RETRIES) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        console.log(`Retrying request (attempt ${originalRequest._retryCount}/${MAX_RETRIES})...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * originalRequest._retryCount!));
        
        return api(originalRequest);
      }
      
      throw new Error('Cannot connect to backend server. Please ensure:\n' +
        '1. Backend server is running (python backend/main.py)\n' +
        '2. Server is accessible on http://localhost:8000\n' +
        '3. No firewall is blocking the connection');
    }
    
    // Handle HTTP error responses
    if (error.response.status === 400) {
      const detail = (error.response.data as any)?.detail || 'Invalid input parameters';
      throw new ValidationError(detail);
    }
    
    if (error.response.status === 422) {
      // Pydantic validation errors
      const details = (error.response.data as any)?.detail || [];
      if (Array.isArray(details) && details.length > 0) {
        const messages = details.map((d: any) => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
        throw new ValidationError(`Validation failed: ${messages}`);
      }
      throw new ValidationError('Input validation failed');
    }
    
    if (error.response.status === 500) {
      if (originalRequest && !originalRequest._retry && (originalRequest._retryCount || 0) < MAX_RETRIES) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        console.log(`Retrying after server error (attempt ${originalRequest._retryCount}/${MAX_RETRIES})...`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * originalRequest._retryCount!));
        
        return api(originalRequest);
      }
      
      throw new Error('Server error occurred. Please try again or contact support if the problem persists.');
    }
    
    if (error.response.status === 503) {
      throw new Error('Service temporarily unavailable. Please try again in a few moments.');
    }
    
    // Generic error handling
    const message = (error.response.data as any)?.detail || error.message || 'An unexpected error occurred';
    throw new Error(`API Error (${error.response.status}): ${message}`);
  }
);

// Enhanced interfaces with validation metadata
export interface SplitRatioInput {
  split_ratio: number; // 1-500
  column_flow_rate: number; // 0.1-10 mL/min
  inlet_temperature?: number; // 50-450°C
  carrier_gas?: 'Helium' | 'Hydrogen' | 'Nitrogen';
}

export interface SplitRatioOutput {
  total_inlet_flow: number;
  split_vent_flow: number;
  septum_purge_flow: number;
  column_flow_rate: number;
  actual_split_ratio: string;
  efficiency_score: number;
  uncertainty?: number;
  confidence_level?: number;
  explanation?: string;
}

export const calculateSplitRatio = async (input: SplitRatioInput, teachingMode: boolean = false): Promise<SplitRatioOutput> => {
  try {
    // Client-side validation before API call
    validateSplitRatio(input.split_ratio);
    validateFlowRate(input.column_flow_rate);
    
    if (input.inlet_temperature !== undefined && (input.inlet_temperature < 50 || input.inlet_temperature > 450)) {
      throw new ValidationError('Inlet temperature must be between 50°C and 450°C');
    }
    
    if (input.carrier_gas && !['Helium', 'Hydrogen', 'Nitrogen'].includes(input.carrier_gas)) {
      throw new ValidationError('Carrier gas must be Helium, Hydrogen, or Nitrogen');
    }
    
    console.log('Calculating split ratio with validated inputs:', input);
    
    const response = await api.post<SplitRatioOutput>('/api/split-ratio/calculate', input, {
      params: { teaching_mode: teachingMode }
    });
    
    // Validate response data
    if (!response.data || typeof response.data.total_inlet_flow !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Split ratio calculation successful:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Split ratio calculation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to calculate split ratio - unknown error occurred');
  }
};

export interface DetectionLimitInput {
  peak_areas: number[]; // Min 3, max 50 points
  concentrations: number[]; // Must match peak_areas length
  blank_areas?: number[]; // Optional noise measurements
  method: '3sigma' | '10sigma';
}

export interface DetectionLimitOutput {
  lod: number;
  loq: number;
  regression_slope: number;
  regression_intercept: number;
  r_squared: number;
  standard_error: number;
  method_used: string;
}

export const calculateDetectionLimits = async (input: DetectionLimitInput): Promise<DetectionLimitOutput> => {
  try {
    // Client-side validation before API call
    validateCalibrationData(input.concentrations, input.peak_areas);
    
    if (!['3sigma', '10sigma'].includes(input.method)) {
      throw new ValidationError('Method must be either "3sigma" or "10sigma"');
    }
    
    if (input.blank_areas && input.blank_areas.some(a => a < 0)) {
      throw new ValidationError('Blank areas cannot be negative');
    }
    
    console.log('Calculating detection limits with validated inputs:', {
      ...input,
      peak_areas: `${input.peak_areas.length} values`,
      concentrations: `${input.concentrations.length} values`
    });
    
    const response = await api.post<DetectionLimitOutput>('/api/detection-limits/calculate', input);
    
    // Validate response data
    if (!response.data || 
        typeof response.data.lod !== 'number' || 
        typeof response.data.loq !== 'number' ||
        typeof response.data.r_squared !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    // Additional response validation
    if (response.data.lod <= 0 || response.data.loq <= 0) {
      throw new Error('Invalid detection limits calculated - check calibration data quality');
    }
    
    if (response.data.loq < response.data.lod) {
      throw new Error('LOQ cannot be less than LOD - calculation error');
    }
    
    if (response.data.r_squared < 0.90) {
      console.warn(`Low correlation coefficient (R² = ${response.data.r_squared}) - results may be unreliable`);
    }
    
    console.log('Detection limits calculation successful:', {
      lod: response.data.lod,
      loq: response.data.loq,
      r_squared: response.data.r_squared
    });
    
    return response.data;
    
  } catch (error) {
    console.error('Detection limits calculation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to calculate detection limits - unknown error occurred');
  }
};

export interface ChromatogramInput {
  column_temp: number;
  ramp_rate: number;
  flow_rate: number;
  split_ratio: number;
  column_length: number;
  column_diameter: number;
}

export interface PeakData {
  compound: string;
  retention_time: number;
  peak_height: number;
  peak_area: number;
  boiling_point: number;
  peak_width: number;
}

export interface ChromatogramOutput {
  peaks: PeakData[];
  total_runtime: number;
  data_points: Array<{ time: number; signal: number }>;
}

export const simulateChromatogram = async (input: ChromatogramInput): Promise<ChromatogramOutput> => {
  try {
    // Client-side validation
    if (input.column_temp < 35 || input.column_temp > 400) {
      throw new ValidationError('Column temperature must be between 35°C and 400°C');
    }
    
    if (input.ramp_rate < 0.1 || input.ramp_rate > 50) {
      throw new ValidationError('Ramp rate must be between 0.1°C/min and 50°C/min');
    }
    
    validateFlowRate(input.flow_rate);
    validateSplitRatio(input.split_ratio);
    
    if (input.column_length < 10 || input.column_length > 100) {
      throw new ValidationError('Column length must be between 10m and 100m');
    }
    
    if (input.column_diameter < 0.1 || input.column_diameter > 1.0) {
      throw new ValidationError('Column diameter must be between 0.1mm and 1.0mm');
    }
    
    console.log('Simulating chromatogram with validated inputs:', input);
    
    const response = await api.post<ChromatogramOutput>('/api/chromatogram/simulate', input);
    
    // Validate response data
    if (!response.data || 
        !Array.isArray(response.data.peaks) || 
        !Array.isArray(response.data.data_points) ||
        typeof response.data.total_runtime !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    if (response.data.peaks.length === 0) {
      throw new Error('No peaks generated - check simulation parameters');
    }
    
    console.log(`Chromatogram simulation successful: ${response.data.peaks.length} peaks, ${response.data.total_runtime} min runtime`);
    
    return response.data;
    
  } catch (error) {
    console.error('Chromatogram simulation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to simulate chromatogram - unknown error occurred');
  }
};

// Column Calculator Interfaces
export interface ColumnParametersInput {
  length_m: number; // 1-100 meters
  id_mm: number; // 0.1-5.0 mm
  flow_ml_min: number; // 0.1-20.0 mL/min
  temperature_c: number; // 30-400°C
  carrier_gas: 'Helium' | 'Hydrogen' | 'Nitrogen';
  outlet_pressure_psi?: number; // 10-50 psi, default 14.7
}

export interface ColumnParametersOutput {
  linear_velocity_cm_s: number;
  void_time_min: number;
  void_volume_ml: number;
  optimal_flow_ml_min: number;
  current_plates: number;
  optimal_plates: number;
  efficiency_percent: number;
  recommendation: string;
}

export const calculateColumnParameters = async (input: ColumnParametersInput): Promise<ColumnParametersOutput> => {
  try {
    // Client-side validation
    if (input.length_m < 1 || input.length_m > 100) {
      throw new ValidationError('Column length must be between 1m and 100m');
    }
    
    if (input.id_mm < 0.1 || input.id_mm > 5.0) {
      throw new ValidationError('Inner diameter must be between 0.1mm and 5.0mm');
    }
    
    if (input.flow_ml_min < 0.1 || input.flow_ml_min > 20.0) {
      throw new ValidationError('Flow rate must be between 0.1 and 20.0 mL/min');
    }
    
    if (input.temperature_c < 30 || input.temperature_c > 400) {
      throw new ValidationError('Temperature must be between 30°C and 400°C');
    }
    
    if (!['Helium', 'Hydrogen', 'Nitrogen'].includes(input.carrier_gas)) {
      throw new ValidationError('Carrier gas must be Helium, Hydrogen, or Nitrogen');
    }
    
    console.log('Calculating column parameters with validated inputs:', input);
    
    const response = await api.post<ColumnParametersOutput>('/api/v1/calculations/column-parameters', input);
    
    if (!response.data || typeof response.data.linear_velocity_cm_s !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Column parameters calculation successful:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Column parameters calculation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to calculate column parameters - unknown error occurred');
  }
};

// Pressure Drop Calculator Interfaces
export interface PressureDropInput {
  length_m: number; // 1-100 meters
  id_mm: number; // 0.1-5.0 mm
  flow_ml_min: number; // 0.1-20.0 mL/min
  temperature_c: number; // 30-400°C
  carrier_gas: 'Helium' | 'Hydrogen' | 'Nitrogen';
  particle_size_um?: number; // 1-500 μm for packed columns
}

export interface PressureDropOutput {
  pressure_drop_psi: number;
  inlet_pressure_required_psi: number;
  viscosity_micropoise: number;
  safe: boolean;
  max_recommended_psi: number;
  warning?: string;
}

export const calculatePressureDrop = async (input: PressureDropInput): Promise<PressureDropOutput> => {
  try {
    // Client-side validation
    if (input.length_m < 1 || input.length_m > 100) {
      throw new ValidationError('Column length must be between 1m and 100m');
    }
    
    if (input.id_mm < 0.1 || input.id_mm > 5.0) {
      throw new ValidationError('Inner diameter must be between 0.1mm and 5.0mm');
    }
    
    if (input.flow_ml_min < 0.1 || input.flow_ml_min > 20.0) {
      throw new ValidationError('Flow rate must be between 0.1 and 20.0 mL/min');
    }
    
    if (input.temperature_c < 30 || input.temperature_c > 400) {
      throw new ValidationError('Temperature must be between 30°C and 400°C');
    }
    
    if (!['Helium', 'Hydrogen', 'Nitrogen'].includes(input.carrier_gas)) {
      throw new ValidationError('Carrier gas must be Helium, Hydrogen, or Nitrogen');
    }
    
    if (input.particle_size_um !== undefined && (input.particle_size_um < 1 || input.particle_size_um > 500)) {
      throw new ValidationError('Particle size must be between 1 and 500 μm');
    }
    
    console.log('Calculating pressure drop with validated inputs:', input);
    
    const response = await api.post<PressureDropOutput>('/api/v1/calculations/pressure-drop', input);
    
    if (!response.data || typeof response.data.pressure_drop_psi !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Pressure drop calculation successful:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Pressure drop calculation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to calculate pressure drop - unknown error occurred');
  }
};

// Splitless Timing Calculator Interfaces
export interface SplitlessTimingInput {
  solvent: 'Methanol' | 'Acetonitrile' | 'Hexane' | 'Dichloromethane' | 'Ethyl Acetate' | 'Acetone';
  column_temp_c: number; // 30-400°C
  inlet_temp_c: number; // 150-450°C
  liner_volume_ul: number; // 200-2000 μL
  column_flow_ml_min: number; // 0.1-10.0 mL/min
}

export interface SplitlessTimingOutput {
  recommended_splitless_time_s: number;
  vapor_volume_ml_per_ul: number;
  total_sweep_volume_ml: number;
  solvent_focusing: boolean;
  focusing_assessment: string;
  optimization_tip: string;
}

export const calculateSplitlessTiming = async (input: SplitlessTimingInput): Promise<SplitlessTimingOutput> => {
  try {
    // Client-side validation
    const validSolvents = ['Methanol', 'Acetonitrile', 'Hexane', 'Dichloromethane', 'Ethyl Acetate', 'Acetone'];
    if (!validSolvents.includes(input.solvent)) {
      throw new ValidationError('Invalid solvent type');
    }
    
    if (input.column_temp_c < 30 || input.column_temp_c > 400) {
      throw new ValidationError('Column temperature must be between 30°C and 400°C');
    }
    
    if (input.inlet_temp_c < 150 || input.inlet_temp_c > 450) {
      throw new ValidationError('Inlet temperature must be between 150°C and 450°C');
    }
    
    if (input.liner_volume_ul < 200 || input.liner_volume_ul > 2000) {
      throw new ValidationError('Liner volume must be between 200 and 2000 μL');
    }
    
    if (input.column_flow_ml_min < 0.1 || input.column_flow_ml_min > 10.0) {
      throw new ValidationError('Column flow rate must be between 0.1 and 10.0 mL/min');
    }
    
    console.log('Calculating splitless timing with validated inputs:', input);
    
    const response = await api.post<SplitlessTimingOutput>('/api/v1/calculations/splitless-timing', input);
    
    if (!response.data || typeof response.data.recommended_splitless_time_s !== 'number') {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Splitless timing calculation successful:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Splitless timing calculation failed:', error);
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to calculate splitless timing - unknown error occurred');
  }
};

/**
 * Health check endpoint to verify backend connectivity
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.status === 200 && response.data?.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

/**
 * Utility function to test API connectivity
 */
export const testApiConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    const isHealthy = await checkBackendHealth();
    
    if (isHealthy) {
      return {
        connected: true,
        message: 'Backend server is running and healthy'
      };
    } else {
      return {
        connected: false,
        message: 'Backend server responded but reported unhealthy status'
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: 'Cannot connect to backend server. Please start the backend service.'
    };
  }
};

// Troubleshooting API endpoints
export const troubleshootingAPI = {
  checkFIDSensitivity: async (params: {
    octane_amount_ng: number;
    octane_peak_area: number;
    baseline_noise_pa: number;
    hydrogen_flow_ml_min: number;
    air_flow_ml_min: number;
    makeup_flow_ml_min: number;
    detector_temp_c?: number;
    jet_cleaning_days_ago?: number;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/fid/sensitivity-check', params);
    return response.data;
  },

  diagnoseInletDiscrimination: async (params: {
    c10_area: number;
    c20_area: number;
    c30_area: number;
    c10_expected?: number;
    c20_expected?: number;
    c30_expected?: number;
    inlet_temp?: number;
    inlet_pressure?: number;
    liner_type?: string;
    last_liner_change_days?: number;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/inlet/discrimination', params);
    return response.data;
  },

  detectInletFlashback: async (params: {
    peak_fronting_factor: number;
    first_peak_width_ratio: number;
    solvent_expansion_volume_ul: number;
    liner_volume_ul: number;
    injection_volume_ul: number;
    inlet_pressure_psi: number;
    purge_time_s: number;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/inlet/flashback', params);
    return response.data;
  },

  testColumnActivity: async (params: {
    toluene_rt: number;
    octanol_rt: number;
    toluene_tailing: number;
    octanol_tailing: number;
    octanol_toluene_ratio: number;
    expected_ratio: number;
    column_age_months: number;
    total_injections: number;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/column/activity-test', params);
    return response.data;
  },

  evaluateMSTune: async (params: {
    mass_69_abundance: number;
    mass_219_abundance: number;
    mass_502_abundance: number;
    mass_69_width: number;
    water_18_percent: number;
    nitrogen_28_percent: number;
    em_voltage: number;
    source_temp_c: number;
    quad_temp_c: number;
    last_cleaning_days: number;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/ms/tune-evaluation', params);
    return response.data;
  },

  diagnoseECDCurrent: async (params: {
    standing_current_pa: number;
    expected_current_pa: number;
    detector_temp_c: number;
    makeup_gas_flow_ml_min: number;
    last_cleaning_date: string;
    baseline_noise_pa: number;
    peak_negative: boolean;
    instrument_id?: number;
  }) => {
    const response = await api.post('/api/troubleshooting/ecd/standing-current', params);
    return response.data;
  },

  getTroubleshootingHistory: async (instrumentId: number, component?: string, days: number = 30) => {
    const params = new URLSearchParams();
    if (component) params.append('component', component);
    params.append('days', days.toString());
    
    const response = await api.get(`/api/troubleshooting/history/${instrumentId}?${params}`);
    return response.data;
  },

  getDetectorTrends: async (instrumentId: number, detectorType: string, days: number = 90) => {
    const params = new URLSearchParams();
    params.append('detector_type', detectorType);
    params.append('days', days.toString());
    
    const response = await api.get(`/api/troubleshooting/detector-trends/${instrumentId}?${params}`);
    return response.data;
  }
};