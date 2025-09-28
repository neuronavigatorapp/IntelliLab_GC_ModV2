/**
 * API Type Definitions
 * 
 * Typed interfaces for all IntelliLab GC API endpoints.
 * These types ensure type safety across the application and 
 * match the actual API response schemas.
 */

// =============================================================================
// Health Check API
// =============================================================================

export interface HealthResult {
    status: string;
    service?: string;
    version?: string;
    timestamp?: string;
    uptime_seconds?: number;
    database_connected?: boolean;
    services?: {
        ocr?: string;
        troubleshooter?: string;
        calculator?: string;
        simulator?: string;
    };
}

// =============================================================================
// Split Ratio Calculator API
// =============================================================================

export interface SplitRatioRequest {
    split_ratio: number;
    column_flow_rate: number;
    inlet_temperature?: number;
    carrier_gas?: 'Helium' | 'Hydrogen' | 'Nitrogen';
    column_length?: number;
    column_diameter?: number;
    inlet_pressure?: number;
}

export interface SplitRatioResult {
    total_inlet_flow: number;
    split_vent_flow: number;
    septum_purge_flow: number;
    column_flow_rate: number;
    actual_split_ratio: string;
    efficiency_score: number;
    uncertainty: number;
    confidence_level: number;
    explanation: string;
}

// =============================================================================
// OCR Analysis API
// =============================================================================

export interface Peak {
    id: string;
    name: string;
    retention_time: number;
    area: number;
    height: number;
    snr: number;
    tailing_factor?: number;
}

export interface Baseline {
    quality_score: number;
    drift: number;
    noise_level: number;
}

export interface OcrAnalysisRequest {
    image: File | Blob;
    analysis_type?: 'peaks' | 'baseline' | 'full';
    sensitivity?: 'low' | 'medium' | 'high';
}

export interface OcrAnalysisResult {
    peaks: Peak[];
    baseline: Baseline;
    overall_quality: number;
    recommendations: string[];
    troubleshooting_suggestions: string[];
    analysis?: {
        peaks: Peak[]; // Alias for backward compatibility
    };
}

// =============================================================================
// Chromatogram Simulation API
// =============================================================================

export interface ChromSimDataPoint {
    time: number;
    intensity: number;
}

export interface ChromSimParameters {
    temperature: number;
    pressure: number;
    flow_rate: number;
    split_ratio: number;
    run_time: number;
    profile?: string;
    column_length?: number;
    column_diameter?: number;
    carrier_gas?: string;
}

export interface ChromSimRequest {
    parameters: ChromSimParameters;
    simulation_type?: 'standard' | 'fast' | 'detailed';
}

export interface ChromSimResult {
    data: ChromSimDataPoint[];
    parameters: ChromSimParameters;
    peaks_detected: number;
    simulation_id: string;
    timestamp: string;
    data_points?: ChromSimDataPoint[]; // Alias for backward compatibility
}

// =============================================================================
// Professional Calculations API
// =============================================================================

export interface VoidVolumeRequest {
    column_length: number; // meters
    column_diameter: number; // mm (internal diameter)
}

export interface VoidVolumeResult {
    volume_ml: number;
    equation: string;
}

export interface PeakCapacityRequest {
    gradient_time: number; // minutes
    peak_width: number; // minutes
    dead_time?: number; // minutes
}

export interface PeakCapacityResult {
    peak_capacity: number;
    equation?: string;
}

export interface BackflushTimingRequest {
    last_peak_rt: number; // minutes
    safety_factor: number; // multiplier (e.g., 1.2 for 20% safety margin)
}

export interface BackflushTimingResult {
    t_bf_min: number; // backflush time in minutes
    equation?: string;
}

// =============================================================================
// Troubleshooter API
// =============================================================================

export interface TroubleshooterRequest {
    issue_description: string;
    symptoms: string[];
    instrument_config?: {
        column_type?: string;
        detector_type?: string;
        carrier_gas?: string;
        sample_type?: string;
    };
}

export interface TroubleshooterRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    steps: string[];
    expected_outcome?: string;
    sandbox_params?: {
        temperature?: number;
        pressure?: number;
        flow_rate?: number;
        split_ratio?: number;
        hold_time?: number;
        ramp_rate?: number;
    };
}

export interface TroubleshooterResult {
    recommendations: TroubleshooterRecommendation[];
    confidence: number;
    analysis_time: number;
    related_issues?: string[];
}

// =============================================================================
// Generic API Response Wrapper
// =============================================================================

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp?: string;
    request_id?: string;
}

export interface ApiError {
    error: string;
    message: string;
    status_code: number;
    details?: any;
    timestamp?: string;
    request_id?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

export const isApiError = (response: any): response is ApiError => {
    return response && typeof response.error === 'string';
};

export const isHealthResult = (data: any): data is HealthResult => {
    return data && typeof data.status === 'string';
};

export const isPeakArray = (data: any): data is Peak[] => {
    return Array.isArray(data) && data.every(item =>
        item && typeof item.retention_time === 'number' &&
        typeof item.area === 'number'
    );
};