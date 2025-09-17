/**
 * Comprehensive validation utilities for IntelliLab GC
 * Provides scientific bounds checking and error handling
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ScientificValidationError extends ValidationError {
  constructor(message: string, public readonly scientificReason: string) {
    super(message);
    this.name = 'ScientificValidationError';
  }
}

/**
 * Split Ratio Validation
 * Based on typical GC instrument capabilities and analytical requirements
 */
export const validateSplitRatio = (value: number): void => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError('Split ratio must be a valid number');
  }
  
  if (value < 1) {
    throw new ScientificValidationError(
      'Split ratio cannot be less than 1:1',
      'Splitless injection would be used instead of split mode'
    );
  }
  
  if (value > 500) {
    throw new ScientificValidationError(
      'Split ratio cannot exceed 1:500',
      'Extremely high split ratios provide insufficient sample for detection'
    );
  }
  
  // Scientific warnings for suboptimal ranges
  if (value < 5) {
    console.warn('Split ratio < 1:5 may cause inlet overload and peak distortion');
  }
  
  if (value > 200) {
    console.warn('Split ratio > 1:200 may result in poor detection limits');
  }
};

/**
 * Flow Rate Validation
 * Based on typical capillary column specifications
 */
export const validateFlowRate = (value: number): void => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError('Flow rate must be a valid number');
  }
  
  if (value <= 0) {
    throw new ValidationError('Flow rate must be positive');
  }
  
  if (value < 0.1) {
    throw new ScientificValidationError(
      'Flow rate too low (< 0.1 mL/min)',
      'Insufficient carrier gas flow may cause peak broadening and poor resolution'
    );
  }
  
  if (value > 10) {
    throw new ScientificValidationError(
      'Flow rate too high (> 10 mL/min)',
      'Excessive flow rate may reduce separation efficiency and waste carrier gas'
    );
  }
  
  // Optimal range warnings
  if (value < 0.5) {
    console.warn('Low flow rate may cause peak broadening');
  }
  
  if (value > 5) {
    console.warn('High flow rate may reduce separation efficiency');
  }
};

/**
 * Temperature Validation
 * Based on typical GC inlet and oven capabilities
 */
export const validateTemperature = (value: number, type: 'inlet' | 'oven' = 'inlet'): void => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError('Temperature must be a valid number');
  }
  
  const limits = {
    inlet: { min: 50, max: 450, optimal: [200, 350] },
    oven: { min: 35, max: 400, optimal: [40, 300] }
  };
  
  const limit = limits[type];
  
  if (value < limit.min) {
    throw new ScientificValidationError(
      `${type} temperature too low (< ${limit.min}°C)`,
      `Insufficient temperature may cause poor vaporization and peak tailing`
    );
  }
  
  if (value > limit.max) {
    throw new ScientificValidationError(
      `${type} temperature too high (> ${limit.max}°C)`,
      `Excessive temperature may cause thermal degradation of compounds`
    );
  }
  
  // Optimal range warnings
  if (value < limit.optimal[0] || value > limit.optimal[1]) {
    console.warn(`${type} temperature outside optimal range (${limit.optimal[0]}-${limit.optimal[1]}°C)`);
  }
};

/**
 * Calibration Data Validation
 * Ensures statistical validity for detection limit calculations
 */
export const validateCalibrationData = (
  concentrations: number[], 
  peakAreas: number[]
): void => {
  // Basic array validation
  if (!Array.isArray(concentrations) || !Array.isArray(peakAreas)) {
    throw new ValidationError('Concentrations and peak areas must be arrays');
  }
  
  if (concentrations.length !== peakAreas.length) {
    throw new ValidationError('Number of concentrations must match number of peak areas');
  }
  
  if (concentrations.length < 3) {
    throw new ScientificValidationError(
      'At least 3 calibration points required',
      'Statistical analysis requires minimum 3 points for reliable regression'
    );
  }
  
  if (concentrations.length > 50) {
    throw new ValidationError('Maximum 50 calibration points supported');
  }
  
  // Validate concentration values
  if (concentrations.some(c => typeof c !== 'number' || isNaN(c))) {
    throw new ValidationError('All concentrations must be valid numbers');
  }
  
  if (concentrations.some(c => c <= 0)) {
    throw new ValidationError('All concentrations must be positive');
  }
  
  // Check for duplicate concentrations
  const uniqueConcentrations = new Set(concentrations);
  if (uniqueConcentrations.size !== concentrations.length) {
    throw new ScientificValidationError(
      'Duplicate concentration values detected',
      'Each calibration point must have a unique concentration'
    );
  }
  
  // Validate peak area values
  if (peakAreas.some(a => typeof a !== 'number' || isNaN(a))) {
    throw new ValidationError('All peak areas must be valid numbers');
  }
  
  if (peakAreas.some(a => a < 0)) {
    throw new ValidationError('Peak areas cannot be negative');
  }
  
  // Check for excessive duplicate peak areas (indicates poor data quality)
  const uniqueAreas = new Set(peakAreas);
  if (uniqueAreas.size < peakAreas.length * 0.8) {
    throw new ScientificValidationError(
      'Too many duplicate peak area values',
      'Poor measurement precision may affect detection limit reliability'
    );
  }
  
  // Check concentration range
  const minConc = Math.min(...concentrations);
  const maxConc = Math.max(...concentrations);
  const range = maxConc / minConc;
  
  if (range > 1000) {
    console.warn('Very wide concentration range (>1000x) - consider logarithmic scale');
  }
  
  if (range < 5) {
    console.warn('Narrow concentration range (<5x) may affect detection limit accuracy');
  }
  
  // Check for reasonable linearity expectation
  const sortedAreas = concentrations.map((c, i) => ({ conc: c, area: peakAreas[i] }))
    .sort((a, b) => a.conc - b.conc)
    .map(item => item.area);
  
  // Simple monotonicity check
  let increasing = 0;
  for (let i = 1; i < sortedAreas.length; i++) {
    if (sortedAreas[i] > sortedAreas[i-1]) increasing++;
  }
  
  if (increasing < sortedAreas.length * 0.7) {
    console.warn('Data may not be monotonic - check for matrix effects or measurement errors');
  }
};

/**
 * Carrier Gas Validation
 */
export const validateCarrierGas = (gas: string): void => {
  const validGases = ['Helium', 'Hydrogen', 'Nitrogen'];
  
  if (typeof gas !== 'string') {
    throw new ValidationError('Carrier gas must be a string');
  }
  
  if (!validGases.includes(gas)) {
    throw new ScientificValidationError(
      `Invalid carrier gas: ${gas}`,
      `Must be one of: ${validGases.join(', ')}`
    );
  }
};

/**
 * Method Validation for Detection Limits
 */
export const validateDetectionMethod = (method: string): void => {
  const validMethods = ['3sigma', '10sigma'];
  
  if (typeof method !== 'string') {
    throw new ValidationError('Detection method must be a string');
  }
  
  if (!validMethods.includes(method)) {
    throw new ValidationError(`Invalid method: ${method}. Must be '3sigma' or '10sigma'`);
  }
};

/**
 * Comprehensive input sanitization
 */
export const sanitizeNumericInput = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  throw new ValidationError('Invalid numeric input');
};

/**
 * Array sanitization for calibration data
 */
export const sanitizeNumericArray = (values: any[]): number[] => {
  if (!Array.isArray(values)) {
    throw new ValidationError('Input must be an array');
  }
  
  return values.map((value, index) => {
    try {
      return sanitizeNumericInput(value);
    } catch (error) {
      throw new ValidationError(`Invalid value at position ${index + 1}: ${value}`);
    }
  });
};

/**
 * Validation summary for UI feedback
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateAllInputs = (inputs: {
  splitRatio?: number;
  flowRate?: number;
  temperature?: number;
  concentrations?: number[];
  peakAreas?: number[];
  carrierGas?: string;
  method?: string;
}): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  // Capture console warnings
  const originalWarn = console.warn;
  console.warn = (message: string) => {
    result.warnings.push(message);
  };
  
  try {
    if (inputs.splitRatio !== undefined) {
      validateSplitRatio(inputs.splitRatio);
    }
    
    if (inputs.flowRate !== undefined) {
      validateFlowRate(inputs.flowRate);
    }
    
    if (inputs.temperature !== undefined) {
      validateTemperature(inputs.temperature);
    }
    
    if (inputs.concentrations && inputs.peakAreas) {
      validateCalibrationData(inputs.concentrations, inputs.peakAreas);
    }
    
    if (inputs.carrierGas !== undefined) {
      validateCarrierGas(inputs.carrierGas);
    }
    
    if (inputs.method !== undefined) {
      validateDetectionMethod(inputs.method);
    }
    
  } catch (error) {
    result.isValid = false;
    if (error instanceof ValidationError) {
      result.errors.push(error.message);
    } else {
      result.errors.push('Unknown validation error occurred');
    }
  } finally {
    // Restore console.warn
    console.warn = originalWarn;
  }
  
  return result;
};
