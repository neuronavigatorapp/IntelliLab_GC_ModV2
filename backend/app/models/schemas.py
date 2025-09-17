#!/usr/bin/env python3
"""
Pydantic schemas for IntelliLab GC API
"""

from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional, Dict, List, Any, Union, Literal
from datetime import datetime
from enum import Enum


# User Authentication Schemas
class UserRole(str, Enum):
    """User role enum"""
    ADMIN = "admin"
    SCIENTIST = "scientist"
    TECHNICIAN = "technician"
    VIEWER = "viewer"


# Column Calculator Schemas
class ColumnParametersRequest(BaseModel):
    """Request schema for column parameter calculations"""
    length_m: float = Field(..., ge=1, le=100, description="Column length in meters")
    id_mm: float = Field(..., ge=0.1, le=5.0, description="Inner diameter in mm")
    flow_ml_min: float = Field(..., ge=0.1, le=20.0, description="Flow rate in mL/min")
    temperature_c: float = Field(..., ge=30, le=400, description="Column temperature in °C")
    carrier_gas: Literal["Helium", "Hydrogen", "Nitrogen"] = Field(..., description="Carrier gas type")
    outlet_pressure_psi: float = Field(14.7, ge=10, le=50, description="Outlet pressure in psi")


class ColumnParametersResponse(BaseModel):
    """Response schema for column parameter calculations"""
    linear_velocity_cm_s: float = Field(..., description="Linear velocity in cm/s")
    void_time_min: float = Field(..., description="Void time in minutes")
    void_volume_ml: float = Field(..., description="Void volume in mL")
    optimal_flow_ml_min: float = Field(..., description="Optimal flow rate in mL/min")
    current_plates: int = Field(..., description="Current theoretical plates")
    optimal_plates: int = Field(..., description="Optimal theoretical plates")
    efficiency_percent: float = Field(..., description="Current efficiency percentage")
    recommendation: str = Field(..., description="Optimization recommendation")


# Pressure Drop Calculator Schemas
class PressureDropRequest(BaseModel):
    """Request schema for pressure drop calculations"""
    length_m: float = Field(..., ge=1, le=100, description="Column length in meters")
    id_mm: float = Field(..., ge=0.1, le=5.0, description="Inner diameter in mm")
    flow_ml_min: float = Field(..., ge=0.1, le=20.0, description="Flow rate in mL/min")
    temperature_c: float = Field(..., ge=30, le=400, description="Column temperature in °C")
    carrier_gas: Literal["Helium", "Hydrogen", "Nitrogen"] = Field(..., description="Carrier gas type")
    particle_size_um: Optional[float] = Field(None, ge=1, le=500, description="Particle size in μm (for packed columns)")


class PressureDropResponse(BaseModel):
    """Response schema for pressure drop calculations"""
    pressure_drop_psi: float = Field(..., description="Pressure drop in psi")
    inlet_pressure_required_psi: float = Field(..., description="Required inlet pressure in psi")
    viscosity_micropoise: float = Field(..., description="Gas viscosity in micropoise")
    safe: bool = Field(..., description="Whether pressure is within safe limits")
    max_recommended_psi: float = Field(..., description="Maximum recommended pressure in psi")
    warning: Optional[str] = Field(None, description="Safety warning if applicable")


# Splitless Timing Calculator Schemas
class SplitlessTimingRequest(BaseModel):
    """Request schema for splitless timing calculations"""
    solvent: Literal["Methanol", "Acetonitrile", "Hexane", "Dichloromethane", "Ethyl Acetate", "Acetone"] = Field(..., description="Solvent type")
    column_temp_c: float = Field(..., ge=30, le=400, description="Initial column temperature in °C")
    inlet_temp_c: float = Field(..., ge=150, le=450, description="Inlet temperature in °C")
    liner_volume_ul: float = Field(..., ge=200, le=2000, description="Liner volume in μL")
    column_flow_ml_min: float = Field(..., ge=0.1, le=10.0, description="Column flow rate in mL/min")


class SplitlessTimingResponse(BaseModel):
    """Response schema for splitless timing calculations"""
    recommended_splitless_time_s: float = Field(..., description="Recommended splitless time in seconds")
    vapor_volume_ml_per_ul: float = Field(..., description="Vapor volume per μL of solvent")
    total_sweep_volume_ml: float = Field(..., description="Total volume to sweep in mL")
    solvent_focusing: bool = Field(..., description="Whether solvent focusing will occur")
    focusing_assessment: str = Field(..., description="Assessment of focusing conditions")
    optimization_tip: str = Field(..., description="Optimization tip for splitless time")


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = UserRole.SCIENTIST
    is_active: bool = True
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Create user schema"""
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Update user schema"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class User(UserBase):
    """User response schema"""
    id: int
    created_date: datetime
    modified_date: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User


class TokenData(BaseModel):
    """Token data schema"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


class PasswordChange(BaseModel):
    """Password change schema"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class PasswordReset(BaseModel):
    """Password reset request schema"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class MaintenanceLevel(str, Enum):
    """Maintenance level enum"""
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    NEGLECTED = "Neglected"


class ConditionLevel(str, Enum):
    """Condition level enum"""
    NEW = "New"
    GOOD = "Good"
    WORN = "Worn"
    LEAKING = "Leaking"
    BADLY_DAMAGED = "Badly Damaged"
    CLEAN = "Clean"
    LIGHTLY_CONTAMINATED = "Lightly Contaminated"
    CONTAMINATED = "Contaminated"
    HEAVILY_CONTAMINATED = "Heavily Contaminated"
    NEEDS_REPLACEMENT = "Needs Replacement"


class DetectorType(str, Enum):
    """Detector type enum"""
    FID = "FID"
    TCD = "TCD"
    SCD = "SCD"
    MS = "MS"
    PID = "PID"
    ECD = "ECD"


class CarrierGas(str, Enum):
    """Carrier gas enum"""
    HYDROGEN = "Hydrogen"
    HELIUM = "Helium"
    NITROGEN = "Nitrogen"
    ARGON = "Argon"


class InjectionMode(str, Enum):
    """Injection mode enum"""
    SPLIT = "Split"
    SPLITLESS = "Splitless"


class MatrixType(str, Enum):
    """Matrix type enum"""
    LIGHT_HYDROCARBON = "Light Hydrocarbon"
    HEAVY_HYDROCARBON = "Heavy Hydrocarbon"
    OXYGENATED = "Oxygenated"
    AQUEOUS = "Aqueous"
    COMPLEX_MATRIX = "Complex Matrix"


# AI Feature Schemas
class AIResponse(BaseModel):
    """Base AI response schema"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str


class TroubleshootingRequest(BaseModel):
    """AI troubleshooting request schema"""
    problem_description: str = Field(..., min_length=10, max_length=2000)
    instrument_type: Optional[str] = None
    detector_type: Optional[str] = None
    symptoms: Optional[List[str]] = None
    recent_changes: Optional[str] = None


class TroubleshootingResponse(BaseModel):
    """AI troubleshooting response schema"""
    advice: str
    confidence_score: float
    suggested_actions: List[str]
    problem_context: Dict[str, Any]
    timestamp: str


class MethodOptimizationRequest(BaseModel):
    """AI method optimization request schema"""
    current_method: Dict[str, Any]
    target_compounds: List[str] = Field(..., min_length=1)
    performance_issues: Optional[List[str]] = None


class MethodOptimizationResponse(BaseModel):
    """AI method optimization response schema"""
    suggestions: str
    method_context: Dict[str, Any]
    target_compounds: List[str]
    timestamp: str


class MaintenancePredictionRequest(BaseModel):
    """Predictive maintenance request schema"""
    instrument_data: Dict[str, Any] = Field(..., min_length=1)


class MaintenancePredictionResponse(BaseModel):
    """Predictive maintenance response schema"""
    maintenance_probability: float
    maintenance_status: str  # CRITICAL, HIGH, MEDIUM, LOW
    confidence_score: float
    recommendations: List[Dict[str, Any]]
    predicted_failure_date: str
    features_used: List[str]
    timestamp: str


class ChromatogramAnalysisRequest(BaseModel):
    """Chromatogram analysis request schema"""
    time_data: List[float] = Field(..., min_length=10)
    intensity_data: List[float] = Field(..., min_length=10)
    compound_names: Optional[List[str]] = None
    method_parameters: Optional[Dict[str, Any]] = None

    @field_validator('intensity_data')
    def validate_data_length(cls, v, info):
        if info.data and 'time_data' in info.data and len(v) != len(info.data['time_data']):
            raise ValueError('Time and intensity data must have same length')
        return v


class ChromatogramAnalysisResponse(BaseModel):
    """Chromatogram analysis response schema"""
    analysis_timestamp: str
    data_points: int
    peaks_detected: int
    peak_analysis: Dict[str, Any]
    quality_metrics: Dict[str, Any]
    diagnostics: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    compound_assignments: List[Dict[str, Any]]


class AIStatusResponse(BaseModel):
    """AI status response schema"""
    openai_configured: bool
    maintenance_model_loaded: bool
    chromatogram_analysis_ready: bool
    features_available: List[str]
    configuration: Dict[str, Any]


# Base schemas
class InstrumentBase(BaseModel):
    """Base instrument schema"""
    name: str = Field(..., min_length=1, max_length=255)
    model: str = Field(..., min_length=1, max_length=255)
    serial_number: str = Field(..., min_length=1, max_length=100)
    install_date: Optional[str] = None
    location: Optional[str] = None
    age_years: float = Field(default=5.0, ge=0.0, le=50.0)
    maintenance_level: MaintenanceLevel = MaintenanceLevel.GOOD
    vacuum_integrity: float = Field(default=95.0, ge=0.0, le=100.0)
    septum_condition: ConditionLevel = ConditionLevel.NEW
    liner_condition: ConditionLevel = ConditionLevel.CLEAN
    oven_calibration: ConditionLevel = ConditionLevel.GOOD
    column_condition: ConditionLevel = ConditionLevel.GOOD
    last_maintenance: Optional[str] = None
    notes: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    calibration_data: Optional[Dict[str, Any]] = None
    performance_history: Optional[Dict[str, Any]] = None


class InstrumentCreate(InstrumentBase):
    """Create instrument schema"""
    pass


class InstrumentUpdate(BaseModel):
    """Update instrument schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    model: Optional[str] = Field(None, min_length=1, max_length=255)
    serial_number: Optional[str] = Field(None, min_length=1, max_length=100)
    install_date: Optional[str] = None
    location: Optional[str] = None
    age_years: Optional[float] = Field(None, ge=0.0, le=50.0)
    maintenance_level: Optional[MaintenanceLevel] = None
    vacuum_integrity: Optional[float] = Field(None, ge=0.0, le=100.0)
    septum_condition: Optional[ConditionLevel] = None
    liner_condition: Optional[ConditionLevel] = None
    oven_calibration: Optional[ConditionLevel] = None
    column_condition: Optional[ConditionLevel] = None
    last_maintenance: Optional[str] = None
    notes: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    calibration_data: Optional[Dict[str, Any]] = None
    performance_history: Optional[Dict[str, Any]] = None


class Instrument(InstrumentBase):
    """Instrument response schema"""
    id: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Calculation schemas
class InletSimulationRequest(BaseModel):
    """Inlet simulation request schema"""
    inlet_temp: float = Field(..., ge=50.0, le=400.0)
    split_ratio: float = Field(..., ge=1.0, le=1000.0)
    injection_volume: float = Field(..., ge=0.1, le=10.0)
    liner_type: str = Field(..., min_length=1)
    injection_mode: str = Field(..., min_length=1)
    carrier_gas: str = Field(..., min_length=1)
    carrier_flow_rate: float = Field(..., ge=0.1, le=10.0)
    septum_purge: float = Field(..., ge=0.0, le=10.0)
    instrument_age: float = Field(..., ge=0.0, le=50.0)
    maintenance_level: str = Field(..., min_length=1)
    vacuum_integrity: float = Field(..., ge=0.0, le=100.0)
    septum_condition: str = Field(..., min_length=1)
    liner_condition: str = Field(..., min_length=1)
    purge_flow: float = Field(default=3.0, ge=0.0, le=100.0)
    matrix_type: str = Field(default="Light Hydrocarbon", min_length=1)
    is_calibrated: bool = Field(default=False)
    calibration_data: Optional[Dict[str, Any]] = None


class InletSimulationResponse(BaseModel):
    """Inlet simulation response schema"""
    transfer_efficiency: float
    discrimination_factor: float
    peak_shape_index: float
    optimization_score: float
    detailed_analysis: Dict[str, Any]
    recommendations: List[str]


class DetectionLimitRequest(BaseModel):
    """Detection limit calculation request schema"""
    detector_type: DetectorType = DetectorType.FID
    carrier_gas: CarrierGas = CarrierGas.HELIUM
    column_type: str = Field(..., min_length=1)
    injector_temp: float = Field(..., ge=50.0, le=400.0)
    detector_temp: float = Field(..., ge=50.0, le=400.0)
    oven_temp: float = Field(..., ge=30.0, le=350.0)
    flow_rate: float = Field(..., ge=0.5, le=10.0)
    split_ratio: float = Field(..., ge=1.0, le=1000.0)
    h2_flow: float = Field(..., ge=0.0, le=100.0)
    air_flow: float = Field(..., ge=0.0, le=1000.0)
    makeup_flow: float = Field(..., ge=0.0, le=100.0)
    injection_volume: float = Field(..., ge=0.1, le=10.0)
    sample_concentration: float = Field(..., ge=0.1, le=10000.0)
    target_compound: str = Field(..., min_length=1)
    instrument_age: float = Field(..., ge=0.0, le=50.0)
    maintenance_level: MaintenanceLevel = MaintenanceLevel.GOOD
    detector_calibration: ConditionLevel = ConditionLevel.GOOD
    column_condition: ConditionLevel = ConditionLevel.GOOD
    noise_level: str = Field(..., min_length=1)
    sample_matrix: str = Field(..., min_length=1)
    analysis_type: str = Field(..., min_length=1)


class DetectionLimitResponse(BaseModel):
    """Detection limit calculation response schema"""
    detection_limit: float
    signal_to_noise: float
    confidence_level: float
    calculation_time: float
    recommendations: List[str]
    statistical_analysis: Dict[str, Any]
    instrument_factors: Dict[str, Any]
    astm_comparison: Optional[Dict[str, Any]] = None
    optimization_potential: Optional[Dict[str, Any]] = None
    calibration_curve: Optional[Dict[str, Any]] = None
    noise_analysis: Optional[Dict[str, Any]] = None


class OvenRampRequest(BaseModel):
    """Oven ramp calculation request schema"""
    initial_temp: float = Field(..., ge=30.0, le=100.0)
    initial_hold: float = Field(..., ge=0.0, le=60.0)
    ramp_rate_1: float = Field(..., ge=0.1, le=50.0)
    final_temp_1: float = Field(..., ge=50.0, le=350.0)
    hold_time_1: float = Field(..., ge=0.0, le=60.0)
    ramp_rate_2: float = Field(..., ge=0.1, le=50.0)
    final_temp_2: float = Field(..., ge=50.0, le=350.0)
    final_hold: float = Field(..., ge=0.0, le=60.0)
    instrument_age: float = Field(..., ge=0.0, le=50.0)
    maintenance_level: MaintenanceLevel = MaintenanceLevel.GOOD
    oven_calibration: ConditionLevel = ConditionLevel.GOOD
    column_condition: ConditionLevel = ConditionLevel.GOOD
    heating_rate_limit: float = Field(..., ge=1.0, le=50.0)
    compound_class: str = Field(..., min_length=1)
    volatility_range: str = Field(..., min_length=1)
    sample_complexity: str = Field(..., min_length=1)


class OvenRampResponse(BaseModel):
    """Enhanced oven ramp calculation response schema"""
    total_runtime: float
    resolution_score: float
    efficiency_score: float
    optimization_score: float
    temperature_profile: List[Dict[str, float]]
    chromatogram_data: Optional[List[Dict[str, Any]]] = None
    recommendations: List[str]
    actual_heating_rates: Optional[List[float]] = None
    retention_predictions: Optional[Dict[str, Any]] = None
    efficiency_metrics: Optional[Dict[str, Any]] = None
    optimization_suggestions: Optional[List[str]] = None
    column_performance: Optional[Dict[str, Any]] = None
    method_robustness: Optional[Dict[str, Any]] = None
    calculation_timestamp: Optional[str] = None


# Method schemas
class MethodBase(BaseModel):
    """Base method schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    method_type: str = Field(..., min_length=1, max_length=50)
    parameters: Dict[str, Any] = Field(..., min_length=1)
    results: Optional[Dict[str, Any]] = None
    optimization_data: Optional[Dict[str, Any]] = None


class MethodCreate(MethodBase):
    """Create method schema"""
    pass


class MethodUpdate(BaseModel):
    """Update method schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    method_type: Optional[str] = Field(None, min_length=1, max_length=50)
    parameters: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    optimization_data: Optional[Dict[str, Any]] = None


class Method(MethodBase):
    """Method response schema"""
    id: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


# File schemas
class FileUploadResponse(BaseModel):
    """File upload response schema"""
    id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    upload_date: datetime

    model_config = ConfigDict(from_attributes=True)


# WebSocket schemas
class WebSocketMessage(BaseModel):
    """WebSocket message schema"""
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)


class CalculationUpdateMessage(WebSocketMessage):
    """Calculation update message"""
    type: str = "calculation_update"
    calculation_type: str
    results: Dict[str, Any]


class ParameterChangeMessage(WebSocketMessage):
    """Parameter change message"""
    type: str = "parameter_change"
    tool: str
    parameters: Dict[str, Any]


class InstrumentUpdateMessage(WebSocketMessage):
    """Instrument update message"""
    type: str = "instrument_update"
    instrument_id: int
    action: str  # create, update, delete
    data: Dict[str, Any]


# Phase 6 Schemas - Method Templates

class MethodTemplateCategory(str, Enum):
    """Method template categories"""
    HYDROCARBONS = "Hydrocarbons"
    ENVIRONMENTAL = "Environmental"
    PHARMACEUTICAL = "Pharmaceutical"
    FOOD_BEVERAGE = "Food & Beverage"
    PETROCHEMICAL = "Petrochemical"
    FORENSIC = "Forensic"
    RESEARCH = "Research"
    QUALITY_CONTROL = "Quality Control"
    CUSTOM = "Custom"


class ToolType(str, Enum):
    """Available tool types for templates"""
    INLET_SIMULATOR = "inlet_simulator"
    DETECTION_LIMIT = "detection_limit"
    OVEN_RAMP = "oven_ramp"
    CHROMATOGRAM_ANALYSIS = "chromatogram_analysis"
    PREDICTIVE_MAINTENANCE = "predictive_maintenance"


class MethodTemplateBase(BaseModel):
    """Base method template schema"""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    tool_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(..., description="Tool-specific parameters")
    is_public: bool = False
    tags: Optional[List[str]] = []


class MethodTemplateCreate(MethodTemplateBase):
    """Create method template schema"""
    pass


class MethodTemplateUpdate(BaseModel):
    """Update method template schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class MethodTemplate(MethodTemplateBase):
    """Method template response schema"""
    id: int
    created_by: int
    usage_count: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Sample Tracking Schemas

class SampleStatus(str, Enum):
    """Sample status enum"""
    RECEIVED = "received"
    PREP = "prep"
    ANALYSIS = "analysis"
    COMPLETE = "complete"
    ON_HOLD = "on_hold"


class SamplePriority(str, Enum):
    """Sample priority enum"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class SampleBase(BaseModel):
    """Base sample schema"""
    sample_id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    matrix: Optional[str] = None
    prep_date: Optional[datetime] = None
    analyst_id: Optional[int] = None
    status: SampleStatus = SampleStatus.RECEIVED
    priority: SamplePriority = SamplePriority.NORMAL
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}


class SampleCreate(SampleBase):
    """Create sample schema"""
    pass


class SampleUpdate(BaseModel):
    """Update sample schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    matrix: Optional[str] = None
    prep_date: Optional[datetime] = None
    analyst_id: Optional[int] = None
    status: Optional[SampleStatus] = None
    priority: Optional[SamplePriority] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Sample(SampleBase):
    """Sample response schema"""
    id: int
    chain_of_custody: Optional[Dict[str, Any]] = {}
    analysis_results: Optional[Dict[str, Any]] = {}
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Cost Calculation Schemas

class CostCategory(str, Enum):
    """Cost item categories"""
    CONSUMABLES = "consumables"
    LABOR = "labor"
    INSTRUMENT_TIME = "instrument_time"
    OVERHEAD = "overhead"


class CostItemBase(BaseModel):
    """Base cost item schema"""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: Optional[str] = None
    unit_cost: float = Field(..., gt=0, description="Cost per unit")
    unit: str = Field(..., min_length=1, max_length=50)
    supplier: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class CostItemCreate(CostItemBase):
    """Create cost item schema"""
    pass


class CostItemUpdate(BaseModel):
    """Update cost item schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    subcategory: Optional[str] = None
    unit_cost: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    supplier: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CostItem(CostItemBase):
    """Cost item response schema"""
    id: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class CostCalculationRequest(BaseModel):
    """Cost calculation request schema"""
    method_parameters: Dict[str, Any]
    analysis_count: int = Field(..., gt=0, description="Number of analyses")
    include_overhead: bool = True
    overhead_percentage: float = Field(20.0, ge=0, le=100, description="Overhead percentage")


class CostCalculationResult(BaseModel):
    """Cost calculation result schema"""
    total_cost: float
    cost_per_analysis: float
    breakdown: Dict[str, float]
    consumables_cost: float
    labor_cost: float
    instrument_time_cost: float
    overhead_cost: float
    analysis_count: int


# Report Generation Schemas

class ReportType(str, Enum):
    """Report types"""
    METHOD_DEVELOPMENT = "method_development"
    VALIDATION = "validation"
    TROUBLESHOOTING = "troubleshooting"
    COMPARISON = "comparison"
    COST_ANALYSIS = "cost_analysis"


class ReportFormat(str, Enum):
    """Report formats"""
    PDF = "pdf"
    DOCX = "docx"
    XLSX = "xlsx"


class ReportGenerationRequest(BaseModel):
    """Report generation request schema"""
    title: str = Field(..., min_length=1, max_length=255)
    report_type: ReportType
    template_name: Optional[str] = None
    data_source: Dict[str, Any] = Field(..., description="Source data for report")
    format: ReportFormat = ReportFormat.PDF
    include_charts: bool = True
    custom_sections: Optional[List[Dict[str, Any]]] = []


class Report(BaseModel):
    """Report response schema"""
    id: int
    title: str
    report_type: str
    template_used: Optional[str]
    generated_by: int
    file_path: Optional[str]
    file_format: str
    status: str
    metadata: Optional[Dict[str, Any]]
    created_date: datetime
    completed_date: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


# Method Comparison Schemas

class ComparisonMetric(str, Enum):
    """Comparison metrics"""
    DETECTION_LIMIT = "detection_limit"
    RESOLUTION = "resolution"
    EFFICIENCY = "efficiency"
    ANALYSIS_TIME = "analysis_time"
    COST = "cost"


class MethodComparisonRequest(BaseModel):
    """Method comparison request schema"""
    method1: Dict[str, Any] = Field(..., description="First method parameters")
    method2: Dict[str, Any] = Field(..., description="Second method parameters")
    metrics: List[ComparisonMetric] = Field(..., description="Metrics to compare")
    tool_type: ToolType = Field(..., description="Tool type for comparison")


class MethodComparisonResult(BaseModel):
    """Method comparison result schema"""
    method1_results: Dict[str, Any]
    method2_results: Dict[str, Any]
    comparison_metrics: Dict[str, float]
    recommendations: List[str]
    charts_data: Optional[Dict[str, Any]] = None


# Consumable Inventory Schemas

class ConsumableInventory(BaseModel):
    """Consumable inventory schema"""
    id: int
    name: str
    category: str
    subcategory: Optional[str] = None
    current_stock: int
    unit_cost: float
    unit: str
    supplier: Optional[str] = None
    part_number: Optional[str] = None
    reorder_threshold: Optional[int] = None
    critical_threshold: Optional[int] = None
    reorder_quantity: Optional[int] = None
    days_to_empty: Optional[float] = None
    status: str  # adequate_stock, low_stock, critical_stock, out_of_stock
    needs_reorder: bool
    inventory_value: float
    last_usage_date: Optional[str] = None
    last_restock_date: Optional[str] = None


class ConsumableUsage(BaseModel):
    """Consumable usage record schema"""
    consumable_id: int
    quantity_used: float
    analysis_count: int = 1
    instrument_id: Optional[int] = None
    method_type: Optional[str] = None
    usage_date: str
    notes: Optional[str] = None


class InventoryAlert(BaseModel):
    """Inventory alert schema"""
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    message: str
    consumable_name: str
    current_stock: int
    days_to_empty: Optional[float] = None
    recommended_order_quantity: Optional[int] = None
    timestamp: str


class ThresholdUpdate(BaseModel):
    """Reorder threshold update schema"""
    reorder_threshold: int = Field(..., ge=1, description="Stock level to trigger reorder")
    critical_threshold: int = Field(..., ge=0, description="Critical stock level")
    reorder_quantity: int = Field(..., ge=1, description="Quantity to order")
    supplier_lead_time_days: int = Field(7, ge=1, le=90, description="Supplier lead time in days")
    auto_reorder_enabled: bool = Field(False, description="Enable automatic reordering")
    alert_email: Optional[str] = Field(None, description="Email for alerts")


class UsageRecord(BaseModel):
    """Usage recording schema"""
    quantity_used: float = Field(..., gt=0, description="Quantity used")
    analysis_count: int = Field(1, ge=1, description="Number of analyses")
    instrument_id: Optional[int] = Field(None, description="Instrument ID")
    method_type: Optional[str] = Field(None, description="Method type used")
    notes: Optional[str] = Field(None, description="Additional notes")


class InventorySummary(BaseModel):
    """Inventory summary schema"""
    total_items: int
    total_value: float
    low_stock_count: int
    out_of_stock_count: int
    categories: Dict[str, int]
    value_by_category: Dict[str, float]


class UsagePrediction(BaseModel):
    """Usage prediction schema"""
    daily_usage_rate: float
    weekly_usage_rate: float
    days_to_empty: float
    confidence_score: float
    prediction_method: str
    data_points: int
    last_usage_date: Optional[str] = None


class InventoryTrends(BaseModel):
    """Inventory trends schema"""
    analysis_period_days: int
    total_consumables: int
    usage_patterns: Dict[str, Dict[str, Any]]
    cost_trends: Dict[str, float]
    recommendations: List[str]
    total_weekly_cost: float
    high_usage_items: List[Dict[str, Any]]


# Phase 3 - Summary and Reports Schemas
class KPIs(BaseModel):
    """System KPIs schema"""
    instrumentsCount: int
    openAlerts: int
    lowStockCount: int
    recentRunsCount: int
    recentMethodsCount: int


class RecentRun(BaseModel):
    """Recent run schema"""
    id: int
    method_name: str
    timestamp: str
    status: str


class RecentMethod(BaseModel):
    """Recent method schema"""
    id: int
    name: str
    type: str
    created_date: str


class Alert(BaseModel):
    """Alert schema"""
    id: int
    severity: str
    message: str
    timestamp: str


class Recents(BaseModel):
    """Recent activity schema"""
    runs: List[RecentRun]
    methods: List[RecentMethod]
    alerts: List[Alert]


# Licensing Schemas
class LicenseInfo(BaseModel):
    """License information schema"""
    plan: str
    status: str
    expiresAt: Optional[str] = None


class LicenseValidationRequest(BaseModel):
    """License validation request schema"""
    license_key: str


class LicenseValidationResponse(BaseModel):
    """License validation response schema"""
    status: str
    message: str


# User Preferences Schema
class UserPreferences(BaseModel):
    """User preferences schema"""
    darkMode: bool = False
    defaultModule: str = "dashboard"
    refreshInterval: int = 60
    notifications: bool = True


# Phase 4 - Analytics & AI Tools Schemas

class RunRecord(BaseModel):
    """Run record schema for analytics"""
    id: int
    instrument_id: int
    method_id: int
    timestamp: datetime
    retention_times: Dict[str, float] = Field(..., description="Compound name -> retention time")
    peak_areas: Dict[str, float] = Field(..., description="Compound name -> peak area")
    baseline_noise: float = Field(..., ge=0.0)
    column_id: Optional[int] = None
    notes: Optional[str] = None
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class AIRecommendationCategory(str, Enum):
    """AI recommendation categories"""
    METHOD = "method"
    DIAGNOSTIC = "diagnostic"
    MAINTENANCE = "maintenance"
    COST = "cost"


class AIRecommendation(BaseModel):
    """AI recommendation schema"""
    id: int
    category: AIRecommendationCategory
    title: str = Field(..., min_length=1, max_length=255)
    details: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime
    instrument_id: Optional[int] = None
    method_id: Optional[int] = None
    severity: str = Field("info", description="info, warning, error, critical")
    actionable: bool = True

    model_config = ConfigDict(from_attributes=True)


class MaintenancePrediction(BaseModel):
    """Maintenance prediction schema"""
    id: int
    asset_type: str = Field(..., description="column, liner, septa")
    asset_id: int
    health_score: float = Field(..., ge=0.0, le=1.0)
    days_remaining: int = Field(..., ge=0)
    rationale: str = Field(..., min_length=1)
    updated_at: datetime
    instrument_id: int
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommended_action: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OptimizationSuggestion(BaseModel):
    """Method optimization suggestion schema"""
    id: int
    target: str = Field(..., description="inlet, oven, detector")
    suggested_changes: Dict[str, Any] = Field(..., description="Parameter changes")
    expected_effects: Dict[str, str] = Field(..., description="Expected outcomes")
    confidence: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime
    method_id: Optional[int] = None
    instrument_id: Optional[int] = None
    cost_savings: Optional[float] = None
    time_savings: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class RunQuery(BaseModel):
    """Run query filter schema"""
    instrument_id: Optional[int] = None
    method_id: Optional[int] = None
    date_range: Optional[Dict[str, str]] = None
    limit: int = Field(100, ge=1, le=1000)


class InstrumentFilter(BaseModel):
    """Instrument filter schema"""
    instrument_ids: Optional[List[int]] = None
    maintenance_level: Optional[MaintenanceLevel] = None
    age_years_min: Optional[float] = None
    age_years_max: Optional[float] = None


class DateRange(BaseModel):
    """Date range schema"""
    start_date: datetime
    end_date: datetime


class DiagnosticsRequest(BaseModel):
    """Diagnostics analysis request"""
    instrument_id: Optional[int] = None
    method_id: Optional[int] = None
    date_range: Optional[DateRange] = None
    include_ghost_peaks: bool = True
    include_sensitivity_analysis: bool = True
    include_drift_analysis: bool = True


class MethodOptimizationRequest(BaseModel):
    """Method optimization request"""
    method_id: Optional[int] = None
    method_parameters: Optional[Dict[str, Any]] = None
    instrument_id: Optional[int] = None
    date_range: Optional[DateRange] = None
    target_compounds: Optional[List[str]] = None
    optimization_goals: List[str] = Field(default=["runtime", "resolution"])


class CostOptimizationRequest(BaseModel):
    """Cost optimization request"""
    method_id: Optional[int] = None
    instrument_id: Optional[int] = None
    current_consumables: Optional[Dict[str, Any]] = None
    target_savings_percentage: float = Field(10.0, ge=0.0, le=50.0)


class CostOptimizationResult(BaseModel):
    """Cost optimization result"""
    current_cost_per_analysis: float
    proposed_cost_per_analysis: float
    savings_percentage: float
    suggestions: List[OptimizationSuggestion]
    line_items: List[Dict[str, Any]]
    payback_period_days: Optional[float] = None


class AnalyticsSummary(BaseModel):
    """Analytics summary schema"""
    total_runs_analyzed: int
    total_recommendations: int
    critical_alerts: int
    maintenance_predictions: int
    cost_savings_potential: float
    last_analysis_date: Optional[datetime] = None


# Phase 5 - QC, Compliance & LIMS Integration Schemas

class QCRecord(BaseModel):
    """QC record schema"""
    id: int
    instrument_id: int
    analyte: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., description="Measured value")
    date: datetime
    ucl: float = Field(..., description="Upper control limit")
    lcl: float = Field(..., description="Lower control limit")
    warn_high: float = Field(..., description="Upper warning limit")
    warn_low: float = Field(..., description="Lower warning limit")
    analyst: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = None
    status: str = Field("in_control", description="in_control, warning, out_of_control")
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class QCRecordCreate(BaseModel):
    """Create QC record schema"""
    instrument_id: int
    analyte: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., description="Measured value")
    ucl: float = Field(..., description="Upper control limit")
    lcl: float = Field(..., description="Lower control limit")
    warn_high: float = Field(..., description="Upper warning limit")
    warn_low: float = Field(..., description="Lower warning limit")
    analyst: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = None


class QCRecordUpdate(BaseModel):
    """Update QC record schema"""
    value: Optional[float] = None
    ucl: Optional[float] = None
    lcl: Optional[float] = None
    warn_high: Optional[float] = None
    warn_low: Optional[float] = None
    analyst: Optional[str] = Field(None, min_length=1, max_length=100)
    notes: Optional[str] = None


class QCSummary(BaseModel):
    """QC summary schema"""
    analyte: str
    mean: float
    stdev: float
    ucl: float
    lcl: float
    warn_high: float
    warn_low: float
    record_count: int
    last_updated: datetime
    status: str = Field("stable", description="stable, trending, out_of_control")


class QCChartData(BaseModel):
    """QC chart data schema"""
    dates: List[str]
    values: List[float]
    ucl_line: List[float]
    lcl_line: List[float]
    warn_high_line: List[float]
    warn_low_line: List[float]
    mean_line: List[float]
    out_of_control_points: List[int]
    warning_points: List[int]


class AuditLogEntry(BaseModel):
    """Audit log entry schema"""
    id: int
    timestamp: datetime
    user: str = Field(..., min_length=1, max_length=100)
    action: str = Field(..., min_length=1, max_length=100)
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    object_hash: Optional[str] = None
    prev_hash: Optional[str] = None
    chain_hash: Optional[str] = None


class AuditLogFilter(BaseModel):
    """Audit log filter schema"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    limit: int = Field(100, ge=1, le=1000)


# Part 11 Supplementary Schemas (roles, auth context, e-sign)
UserRoleType = Literal['admin','analyst','qc','viewer']


class UserInfo(BaseModel):
    id: int
    name: str
    role: UserRoleType


class AuthContext(BaseModel):
    user: UserInfo
    token: Optional[str] = None


class AuditEvent(BaseModel):
    id: Optional[int] = None
    timestamp: Optional[datetime] = None
    userId: Optional[int] = None
    action: str
    objectType: str
    objectId: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    hash: Optional[str] = None
    prevHash: Optional[str] = None


class ESignRequest(BaseModel):
    objectType: Literal['calibration','sequence','run','qcRecord']
    objectId: str
    reason: str
    objectData: Optional[Dict[str, Any]] = None


class ESignRecord(BaseModel):
    id: int
    userId: int
    timestamp: datetime
    objectType: str
    objectId: str
    reason: str
    objectHash: str
    signature: str


class LIMSConfig(BaseModel):
    """LIMS configuration schema"""
    id: int
    base_url: str = Field(..., min_length=1, max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)
    format: str = Field("json", description="json, xml, csv")
    is_active: bool = True
    connection_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class LIMSConfigCreate(BaseModel):
    """Create LIMS config schema"""
    base_url: str = Field(..., min_length=1, max_length=500)
    api_key: str = Field(..., min_length=1, max_length=500)
    format: str = Field("json", description="json, xml, csv")
    connection_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class LIMSConfigUpdate(BaseModel):
    """Update LIMS config schema"""
    base_url: Optional[str] = Field(None, min_length=1, max_length=500)
    api_key: Optional[str] = Field(None, min_length=1, max_length=500)
    format: Optional[str] = Field(None, description="json, xml, csv")
    is_active: Optional[bool] = None
    connection_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class LIMSExportRequest(BaseModel):
    """LIMS export request schema"""
    config_id: int
    data_type: str = Field(..., description="methods, runs, qc, audit")
    date_range: Optional[Dict[str, str]] = None
    format: Optional[str] = None
    include_metadata: bool = True


class LIMSImportRequest(BaseModel):
    """LIMS import request schema"""
    config_id: int
    data_type: str = Field(..., description="methods, runs, qc")
    file_path: str = Field(..., min_length=1)
    format: str = Field(..., description="json, xml, csv")
    validate_only: bool = False


class LIMSConnectionTest(BaseModel):
    """LIMS connection test schema"""
    config_id: int


class LIMSConnectionResult(BaseModel):
    """LIMS connection test result schema"""
    success: bool
    message: str
    response_time: Optional[float] = None
    error_details: Optional[str] = None


class QCAlert(BaseModel):
    """QC alert schema"""
    id: int
    qc_record_id: int
    alert_type: str = Field(..., description="out_of_control, warning, trend")
    message: str = Field(..., min_length=1)
    severity: str = Field(..., description="critical, high, medium, low")
    timestamp: datetime
    is_acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class QCAlertCreate(BaseModel):
    """Create QC alert schema"""
    qc_record_id: int
    alert_type: str = Field(..., description="out_of_control, warning, trend")
    message: str = Field(..., min_length=1)
    severity: str = Field(..., description="critical, high, medium, low")


class QCAlertUpdate(BaseModel):
    """Update QC alert schema"""
    is_acknowledged: Optional[bool] = None
    acknowledged_by: Optional[str] = Field(None, min_length=1, max_length=100)


class SPCViolation(BaseModel):
    """Statistical Process Control violation schema"""
    rule_number: int
    rule_name: str
    description: str
    severity: str = Field(..., description="critical, high, medium, low")
    points_involved: List[int]
    violation_date: datetime
    qc_record_id: int


class QCTrendAnalysis(BaseModel):
    """QC trend analysis schema"""
    analyte: str
    trend_direction: str = Field(..., description="increasing, decreasing, stable")
    trend_strength: float = Field(..., ge=0.0, le=1.0)
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    recommended_action: Optional[str] = None
    analysis_date: datetime
    data_points_analyzed: int


# Phase 6 - Sync & Attachments
class SyncCursor(BaseModel):
    last_sync_at: Optional[datetime] = None
    entities: Dict[str, str] = Field(default_factory=dict)  # entity_type -> version/etag

class SyncEnvelope(BaseModel):
    client_id: str
    since: Optional[datetime] = None
    changes: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    attachments: Optional[List['AttachmentMeta']] = None

class AttachmentMeta(BaseModel):
    id: Optional[str] = None
    entity_type: str
    entity_id: str
    filename: str
    mime_type: str
    size: int
    created_at: Optional[datetime] = None
    uploaded_at: Optional[datetime] = None

class PushResult(BaseModel):
    accepted: List[str] = Field(default_factory=list)
    rejected: List[Dict[str, Any]] = Field(default_factory=list)
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)
    server_time: datetime

class SyncPullResponse(BaseModel):
    server_time: datetime
    changes: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    versions: Dict[str, str] = Field(default_factory=dict)

# Update existing models to support versioning
class Instrument(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    status: str = "active"
    location: Optional[str] = None
    last_calibration: Optional[datetime] = None
    next_calibration: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = 1  # Phase 6: version tracking

class Method(BaseModel):
    id: Optional[str] = None
    name: str
    instrument_id: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = 1  # Phase 6: version tracking

class QCRecord(BaseModel):
    id: Optional[str] = None
    instrument_id: str
    analyte: str
    value: float
    unit: str
    expected_range: Optional[Dict[str, float]] = None
    status: str = "pending"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = 1  # Phase 6: version tracking

class InventoryItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    current_stock: int
    min_threshold: int
    max_threshold: int
    unit: str
    supplier: Optional[str] = None
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = 1  # Phase 6: version tracking

# Phase 7 - Training & Education Mode Schemas

class TrainingExerciseType(str, Enum):
    """Training exercise types"""
    METHOD_SETUP = "method_setup"
    FAULT_DIAGNOSIS = "fault_diagnosis"
    CHROMATOGRAM_QC = "chromatogram_qc"
    QUIZ = "quiz"


class TrainingDifficulty(str, Enum):
    """Training difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class TrainingLesson(BaseModel):
    """Training lesson schema"""
    id: int
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    version: str = Field(default="1.0.0", min_length=1, max_length=20)
    tags: List[str] = Field(default_factory=list)
    est_minutes: int = Field(default=30, ge=1, le=480)
    author: str = Field(..., min_length=1, max_length=100)
    content: Optional[Dict[str, Any]] = None
    published: bool = False
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TrainingExercise(BaseModel):
    """Training exercise schema"""
    id: int
    lesson_id: int
    type: TrainingExerciseType
    difficulty: TrainingDifficulty = TrainingDifficulty.INTERMEDIATE
    prompt: str = Field(..., min_length=1)
    initial_state: Dict[str, Any] = Field(default_factory=dict)
    expected_outcome: Dict[str, Any] = Field(default_factory=dict)
    scoring_rubric: Dict[str, Any] = Field(default_factory=dict)
    time_limit_sec: Optional[int] = Field(None, ge=60, le=3600)
    hints: List[str] = Field(default_factory=list)
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TrainingAttempt(BaseModel):
    """Training attempt schema"""
    id: int
    exercise_id: int
    user_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    answers: Dict[str, Any] = Field(default_factory=dict)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)
    max_score: float = Field(default=100.0, ge=1.0)
    auto_notes: Optional[str] = None
    manual_notes: Optional[str] = None
    passed: Optional[bool] = None
    version_at_attempt: str = Field(default="1.0.0")
    time_taken_sec: Optional[int] = Field(None, ge=0)
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TrainingCourse(BaseModel):
    """Training course schema"""
    id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    lessons_ordered_ids: List[int] = Field(default_factory=list)
    published: bool = False
    author: str = Field(..., min_length=1, max_length=100)
    est_total_hours: float = Field(default=1.0, ge=0.1, le=100.0)
    difficulty: TrainingDifficulty = TrainingDifficulty.INTERMEDIATE
    tags: List[str] = Field(default_factory=list)
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


class EnrollmentStatus(str, Enum):
    """Enrollment status enum"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Enrollment(BaseModel):
    """Training enrollment schema"""
    id: int
    course_id: int
    user_id: int
    status: EnrollmentStatus = EnrollmentStatus.ACTIVE
    started_at: datetime
    completed_at: Optional[datetime] = None
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


class ProgressSummary(BaseModel):
    """Training progress summary schema"""
    user_id: int
    course_id: int
    completed_lessons: int = Field(default=0, ge=0)
    total_lessons: int = Field(default=0, ge=0)
    avg_score: float = Field(default=0.0, ge=0.0, le=100.0)
    last_activity_at: Optional[datetime] = None
    time_spent_minutes: int = Field(default=0, ge=0)
    attempts_count: int = Field(default=0, ge=0)
    passed_exercises: int = Field(default=0, ge=0)
    total_exercises: int = Field(default=0, ge=0)


class ThemeConfig(BaseModel):
    """White-label theme configuration schema"""
    id: int
    org_id: Optional[int] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    typography: Optional[Dict[str, Any]] = None
    footer_links: Optional[List[Dict[str, str]]] = None
    company_name: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool = True
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Training DTOs
class CreateLesson(BaseModel):
    """Create lesson request schema"""
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    est_minutes: int = Field(default=30, ge=1, le=480)
    content: Optional[Dict[str, Any]] = None


class UpdateLesson(BaseModel):
    """Update lesson request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    est_minutes: Optional[int] = Field(None, ge=1, le=480)
    content: Optional[Dict[str, Any]] = None


class CreateExercise(BaseModel):
    """Create exercise request schema"""
    lesson_id: int
    type: TrainingExerciseType
    difficulty: TrainingDifficulty = TrainingDifficulty.INTERMEDIATE
    prompt: str = Field(..., min_length=1)
    initial_state: Dict[str, Any] = Field(default_factory=dict)
    expected_outcome: Dict[str, Any] = Field(default_factory=dict)
    scoring_rubric: Dict[str, Any] = Field(default_factory=dict)
    time_limit_sec: Optional[int] = Field(None, ge=60, le=3600)
    hints: List[str] = Field(default_factory=list)


class UpdateExercise(BaseModel):
    """Update exercise request schema"""
    type: Optional[TrainingExerciseType] = None
    difficulty: Optional[TrainingDifficulty] = None
    prompt: Optional[str] = Field(None, min_length=1)
    initial_state: Optional[Dict[str, Any]] = None
    expected_outcome: Optional[Dict[str, Any]] = None
    scoring_rubric: Optional[Dict[str, Any]] = None
    time_limit_sec: Optional[int] = Field(None, ge=60, le=3600)
    hints: Optional[List[str]] = None


class AttemptSubmission(BaseModel):
    """Exercise attempt submission schema"""
    exercise_id: int
    answers: Dict[str, Any] = Field(..., min_length=1)
    time_taken_sec: Optional[int] = Field(None, ge=0)


class GradeOverride(BaseModel):
    """Grade override request schema"""
    score: float = Field(..., ge=0.0, le=100.0)
    manual_notes: Optional[str] = None
    reason: str = Field(..., min_length=1, max_length=500)


class AssignCourse(BaseModel):
    """Assign course to user schema"""
    course_id: int
    user_ids: List[int] = Field(..., min_length=1)


class CreateCourse(BaseModel):
    """Create course request schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    lessons_ordered_ids: List[int] = Field(default_factory=list)
    difficulty: TrainingDifficulty = TrainingDifficulty.INTERMEDIATE
    tags: List[str] = Field(default_factory=list)
    est_total_hours: float = Field(default=1.0, ge=0.1, le=100.0)


class UpdateCourse(BaseModel):
    """Update course request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    lessons_ordered_ids: Optional[List[int]] = None
    difficulty: Optional[TrainingDifficulty] = None
    tags: Optional[List[str]] = None
    est_total_hours: Optional[float] = Field(None, ge=0.1, le=100.0)


class ThemeUpdate(BaseModel):
    """Theme update request schema"""
    logo_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    typography: Optional[Dict[str, Any]] = None
    footer_links: Optional[List[Dict[str, str]]] = None
    company_name: Optional[str] = None
    contact_email: Optional[str] = None


class TrainingSearchFilter(BaseModel):
    """Training search filter schema"""
    difficulty: Optional[TrainingDifficulty] = None
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    published_only: bool = True
    limit: int = Field(50, ge=1, le=200)


class ExerciseResult(BaseModel):
    """Exercise result schema"""
    attempt_id: int
    score: float
    max_score: float
    passed: bool
    rubric_breakdown: Dict[str, Any]
    time_taken_sec: int
    auto_notes: Optional[str] = None
    manual_notes: Optional[str] = None


class CourseProgress(BaseModel):
    """Course progress schema"""
    course_id: int
    user_id: int
    progress_percentage: float
    completed_lessons: int
    total_lessons: int
    avg_score: float
    time_spent_minutes: int
    last_activity_at: Optional[datetime] = None
    estimated_completion_minutes: Optional[int] = None


class TrainingCertificate(BaseModel):
    """Training certificate schema"""
    user_id: int
    course_id: int
    course_title: str
    completion_date: datetime
    final_score: float
    certificate_id: str
    issued_by: str
    valid_until: Optional[datetime] = None


# Chromatography and Run Records Schemas
class Peak(BaseModel):
    """Peak data schema for chromatogram analysis"""
    id: Optional[str] = None
    rt: float = Field(..., description="Retention time in minutes")
    area: float = Field(..., description="Peak area")
    height: float = Field(..., description="Peak height")
    width: float = Field(..., description="Peak width at half height")
    name: Optional[str] = Field(None, description="Compound name")
    snr: Optional[float] = Field(None, description="Signal to noise ratio")
    compound_id: Optional[str] = Field(None, description="Assigned compound ID")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Peak assignment confidence")


class RunRecord(BaseModel):
    """Chromatogram run record schema"""
    id: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    instrument_id: Optional[int] = Field(None, description="Instrument used for the run")
    method_id: Optional[int] = Field(None, description="Method used for the run")
    sample_name: str = Field(..., min_length=1, max_length=255)
    time: List[float] = Field(..., min_length=10, description="Time axis data")
    signal: List[float] = Field(..., min_length=10, description="Signal intensity data")
    peaks: List[Peak] = Field(default_factory=list, description="Detected peaks")
    baseline: Optional[List[float]] = Field(None, description="Baseline data")
    notes: Optional[str] = Field(None, description="Run notes")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    created_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None
    @field_validator('signal')
    def validate_signal_length(cls, v, info):
        if info.data and 'time' in info.data and len(v) != len(info.data['time']):
            raise ValueError('Signal data length must match time data length')
        return v

    @field_validator('baseline')
    def validate_baseline_length(cls, v, info):
        if v is not None and info.data and 'time' in info.data and len(v) != len(info.data['time']):
            raise ValueError('Baseline data length must match time data length')
        return v


class RunRecordCreate(BaseModel):
    """Create run record schema"""
    instrument_id: Optional[int] = None
    method_id: Optional[int] = None
    sample_name: str = Field(..., min_length=1, max_length=255)
    time: List[float] = Field(..., min_length=10)
    signal: List[float] = Field(..., min_length=10)
    peaks: List[Peak] = Field(default_factory=list)
    baseline: Optional[List[float]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class RunRecordUpdate(BaseModel):
    """Update run record schema"""
    sample_name: Optional[str] = Field(None, min_length=1, max_length=255)
    peaks: Optional[List[Peak]] = None
    baseline: Optional[List[float]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PeakDetectionRequest(BaseModel):
    """Peak detection request schema"""
    time: List[float] = Field(..., min_length=10)
    signal: List[float] = Field(..., min_length=10)
    prominence_threshold: float = Field(3.0, ge=1.0, le=10.0, description="Peak prominence threshold")
    min_distance: float = Field(0.1, ge=0.01, le=10.0, description="Minimum distance between peaks (minutes)")
    noise_window: int = Field(50, ge=10, le=200, description="Window size for noise calculation")
    baseline_method: str = Field("rolling_min", description="rolling_min, polynomial, or none")
    @field_validator('signal')
    def validate_signal_length(cls, v, info):
        if info.data and 'time' in info.data and len(v) != len(info.data['time']):
            raise ValueError('Signal data length must match time data length')
        return v


class PeakDetectionResponse(BaseModel):
    """Peak detection response schema"""
    peaks: List[Peak]
    baseline: List[float]
    noise_level: float
    signal_to_noise_ratio: float
    detection_parameters: Dict[str, Any]
    processing_time: float


class ChromatogramSimulationRequest(BaseModel):
    """Chromatogram simulation request schema"""
    method_id: Optional[int] = None
    method_parameters: Optional[Dict[str, Any]] = None
    instrument_id: Optional[int] = None
    sample_name: str = Field(..., min_length=1, max_length=255)
    seed: Optional[int] = Field(None, description="Random seed for reproducible simulation")
    include_noise: bool = Field(True, description="Include baseline noise")
    include_drift: bool = Field(False, description="Include baseline drift")
    compounds: Optional[List[Dict[str, Any]]] = Field(None, description="Custom compound list")


# Compound Library & Presets
class CompoundBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = None
    retention_time: float = Field(..., gt=0)
    molecular_weight: Optional[float] = Field(None, gt=0)
    default_intensity: float = Field(100.0, gt=0)
    default_width: float = Field(0.1, gt=0)
    metadata_json: Optional[Dict[str, Any]] = None


class CompoundCreate(CompoundBase):
    pass


class CompoundUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    retention_time: Optional[float] = Field(None, gt=0)
    molecular_weight: Optional[float] = Field(None, gt=0)
    default_intensity: Optional[float] = Field(None, gt=0)
    default_width: Optional[float] = Field(None, gt=0)
    metadata_json: Optional[Dict[str, Any]] = None


class Compound(CompoundBase):
    id: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class MethodPresetBase(BaseModel):
    standard_body: str = Field(..., pattern=r"^(ASTM|GPA|EPA)$")
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    method_type: str = Field(..., min_length=1, max_length=50)
    parameters: Dict[str, Any] = Field(...)


class MethodPresetCreate(MethodPresetBase):
    pass


class MethodPresetUpdate(BaseModel):
    standard_body: Optional[str] = Field(None, pattern=r"^(ASTM|GPA|EPA)$")
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    method_type: Optional[str] = Field(None, min_length=1, max_length=50)
    parameters: Optional[Dict[str, Any]] = None


class MethodPreset(MethodPresetBase):
    id: int
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Sandbox
class InletType(str, Enum):
    """Inlet type enum"""
    SPLIT = "split"
    SPLITLESS = "splitless"
    ON_COLUMN = "on-column"
    DIRECT = "direct"
    PTV = "ptv"  # Programmable Temperature Vaporization


class FaultParams(BaseModel):
    noise_level: float = Field(0.5, ge=0)
    rt_shift: float = Field(0.0)
    drift: float = Field(0.0)
    ghost_peak_probability: float = Field(0.0, ge=0, le=1)
    leak_severity: float = Field(0.0, ge=0, le=1)
    detector_drift: float = Field(0.0)


class OvenRampStep(BaseModel):
    """Single oven ramp step"""
    initial_temp: float = Field(..., ge=30, le=450)
    hold_time: float = Field(..., ge=0, le=300)
    ramp_rate: float = Field(..., ge=0.1, le=100)
    final_temp: float = Field(..., ge=30, le=450)


class OvenRampConfig(BaseModel):
    """Multi-step oven ramp configuration"""
    steps: List[OvenRampStep] = Field(..., min_length=1)
    post_run_temp: float = Field(50, ge=30, le=200)
    equilibration_time: float = Field(1.0, ge=0, le=60)


class FlowConfig(BaseModel):
    """Flow configuration for simulation"""
    carrier_flow: float = Field(1.0, ge=0.1, le=50)
    split_ratio: Optional[float] = Field(None, ge=1, le=1000)
    septum_purge: float = Field(3.0, ge=0, le=100)
    column_flow: float = Field(1.0, ge=0.1, le=10)
    makeup_flow: Optional[float] = Field(None, ge=0, le=100)


class DetectorConfig(BaseModel):
    """Detector configuration for simulation"""
    detector_type: DetectorType = DetectorType.FID
    temp: float = Field(250, ge=50, le=450)
    h2_flow: Optional[float] = Field(None, ge=0, le=100)
    air_flow: Optional[float] = Field(None, ge=0, le=1000)
    makeup_flow: Optional[float] = Field(None, ge=0, le=100)
    attenuation: int = Field(1, ge=-3, le=12)
    data_rate: float = Field(10.0, ge=0.1, le=100)


class SimulationProfileBase(BaseModel):
    """Base simulation profile schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    instrument_id: int
    method_id: int
    inlet_type: InletType = InletType.SPLIT
    oven_ramp_config: OvenRampConfig
    flow_config: FlowConfig
    detector_config: DetectorConfig
    compound_ids: List[int] = Field(default_factory=list)
    fault_config: Optional[FaultParams] = None
    is_public: bool = False
    tags: List[str] = Field(default_factory=list)


class SimulationProfileCreate(SimulationProfileBase):
    """Create simulation profile schema"""
    pass


class SimulationProfileUpdate(BaseModel):
    """Update simulation profile schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    inlet_type: Optional[InletType] = None
    oven_ramp_config: Optional[OvenRampConfig] = None
    flow_config: Optional[FlowConfig] = None
    detector_config: Optional[DetectorConfig] = None
    compound_ids: Optional[List[int]] = None
    fault_config: Optional[FaultParams] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class SimulationProfile(SimulationProfileBase):
    """Simulation profile response schema"""
    id: int
    created_by: Optional[int] = None
    usage_count: int = 0
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class ChromatogramDiagnosticBase(BaseModel):
    """Base chromatogram diagnostic schema"""
    run_id: Optional[int] = None
    file_type: str = Field(..., min_length=1)
    ai_analysis: Dict[str, Any]
    fault_causes: List[str]
    method_adjustments: List[Dict[str, Any]]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    model_version: str = Field(default="v1.0")


class ChromatogramDiagnosticCreate(ChromatogramDiagnosticBase):
    """Create chromatogram diagnostic schema"""
    pass


class ChromatogramDiagnostic(ChromatogramDiagnosticBase):
    """Chromatogram diagnostic response schema"""
    id: int
    file_path: Optional[str] = None
    created_date: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkModeType(str, Enum):
    """Work mode types"""
    FULL = "full"
    WORK = "work"
    TROUBLESHOOTING = "troubleshooting"
    MAINTENANCE = "maintenance"
    QUALITY_CONTROL = "quality_control"


class WorkModeBase(BaseModel):
    """Base work mode schema"""
    mode_name: WorkModeType = WorkModeType.FULL
    enabled_modules: List[str] = Field(default_factory=list)
    dashboard_config: Dict[str, Any] = Field(default_factory=dict)
    quick_access_tools: List[str] = Field(default_factory=list)
    auto_launch_module: Optional[str] = None


class WorkModeCreate(WorkModeBase):
    """Create work mode schema"""
    user_id: int


class WorkModeUpdate(BaseModel):
    """Update work mode schema"""
    mode_name: Optional[WorkModeType] = None
    enabled_modules: Optional[List[str]] = None
    dashboard_config: Optional[Dict[str, Any]] = None
    quick_access_tools: Optional[List[str]] = None
    auto_launch_module: Optional[str] = None


class WorkMode(WorkModeBase):
    """Work mode response schema"""
    id: int
    user_id: int
    last_used: datetime
    created_date: datetime
    modified_date: datetime

    model_config = ConfigDict(from_attributes=True)


class SandboxRunRequest(BaseModel):
    instrument_id: int
    method_id: int
    compound_ids: Optional[List[int]] = None
    compounds: Optional[List[Dict[str, Any]]] = None
    fault_params: Optional[FaultParams] = None
    sample_name: str = Field("Sandbox Sample", min_length=1)
    seed: Optional[int] = None


class SandboxRunResponse(BaseModel):
    run_record: 'RunRecord'
    quality_metrics: Dict[str, Any]
    applied_faults: Dict[str, Any]
    sandbox_run_id: Optional[int] = None


class SandboxFault(BaseModel):
    name: str
    description: str
    effects: List[str]
    simulation_params: Dict[str, Any]


class ChromatogramSimulationResponse(BaseModel):
    """Chromatogram simulation response schema"""
    run_record: RunRecord
    simulation_parameters: Dict[str, Any]
    compound_assignments: List[Dict[str, Any]]
    quality_metrics: Dict[str, Any]


class ChromatogramImportRequest(BaseModel):
    """Chromatogram import request schema"""
    file_content: str = Field(..., description="Base64 encoded file content")
    file_type: str = Field(..., description="csv or jcamp")
    sample_name: str = Field(..., min_length=1, max_length=255)
    auto_detect_peaks: bool = Field(True, description="Automatically detect peaks after import")


class ChromatogramImportResponse(BaseModel):
    """Chromatogram import response schema"""
    run_record: RunRecord
    import_metadata: Dict[str, Any]
    validation_warnings: List[str] = Field(default_factory=list)


class ChromatogramExportRequest(BaseModel):
    """Chromatogram export request schema"""
    run_id: int
    format: str = Field(..., description="csv, png, or pdf")
    include_peaks: bool = Field(True, description="Include peak annotations")
    include_baseline: bool = Field(False, description="Include baseline data")
    plot_options: Optional[Dict[str, Any]] = Field(None, description="Plot customization options")


class ChromatogramExportResponse(BaseModel):
    """Chromatogram export response schema"""
    file_content: str = Field(..., description="Base64 encoded file content")
    filename: str
    file_size: int
    mime_type: str


# QC Auto-Flagging, Control Charts & QC-Aware Sequences Schemas

class QCTarget(BaseModel):
    """QC target schema"""
    id: str
    methodId: str
    instrumentId: Optional[str] = None
    analyte: str = Field(..., min_length=1, max_length=100, description="Analyte name")
    mean: float = Field(..., description="Assigned value or running mean")
    sd: float = Field(..., gt=0, description="Assigned SD or pooled SD")
    unit: str = Field("ppm", description="Unit (ppm, ppb, mg/L)")
    n_required: int = Field(20, ge=1, description="Points before full ruleset")

class QCRuleHit(BaseModel):
    """QC rule violation hit schema"""
    rule: str = Field(..., description="Rule name (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10-x)")
    analyte: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., description="Measured value")
    zscore: float = Field(..., description="Z-score for this measurement")
    runId: str = Field(..., description="Run ID that triggered the rule")
    timestamp: datetime = Field(default_factory=datetime.now)

class QCResult(BaseModel):
    """QC evaluation result for a single analyte"""
    analyte: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., description="Measured value")
    unit: str = Field(..., description="Unit")
    zscore: float = Field(..., description="Z-score")
    flags: List[str] = Field(default_factory=list, description="Rule names hit")
    status: str = Field(..., description="PASS, WARN, FAIL")

class QCRecord(BaseModel):
    """Complete QC record for a run"""
    id: str
    runId: str = Field(..., description="Associated run ID")
    timestamp: datetime = Field(default_factory=datetime.now)
    results: List[QCResult] = Field(..., description="QC results per analyte")
    ruleHits: List[QCRuleHit] = Field(default_factory=list, description="Rule violations")
    overallStatus: str = Field(..., description="PASS, WARN, FAIL")
    notes: Optional[str] = Field(None, description="Additional notes")

class QCTimeSeriesPoint(BaseModel):
    """QC time series data point for charts"""
    timestamp: datetime
    analyte: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., description="Measured value")
    mean: float = Field(..., description="Target mean")
    sd: float = Field(..., description="Target standard deviation")

class QCPolicy(BaseModel):
    """QC evaluation policy"""
    stopOnFail: bool = Field(True, description="Stop sequence on FAIL")
    warnOn1_2s: bool = Field(True, description="Warn on 1-2s rule")
    requireNBeforeStrict: int = Field(20, ge=1, description="Points before strict rules")

# Calibration, Quantitation & Sequence Schemas

class CalibrationMode(str, Enum):
    """Calibration mode enum"""
    EXTERNAL = "external"
    INTERNAL_STANDARD = "internal_standard"


class OutlierPolicy(str, Enum):
    """Outlier detection policy enum"""
    NONE = "none"
    GRUBBS = "grubbs"
    IQR = "iqr"


class InternalStandard(BaseModel):
    """Internal standard configuration"""
    peak_name: str = Field(..., min_length=1, max_length=100, description="Internal standard peak name")
    amount: float = Field(..., gt=0, description="Internal standard amount")
    unit: str = Field(..., description="Internal standard unit (ppm, ppb, mg/L)")


class CalibrationLevel(BaseModel):
    """Calibration level schema"""
    level_id: Optional[str] = None
    target_name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0, description="Concentration amount")
    unit: str = Field(..., description="Concentration unit (ppm, ppb, mg/L)")
    peak_name: Optional[str] = Field(None, description="Peak name for this level")
    area: Optional[float] = Field(None, description="Peak area from run")
    is_area: Optional[float] = Field(None, description="Internal standard peak area")
    rt: Optional[float] = Field(None, description="Retention time from run")
    included: bool = Field(True, description="Whether this level is included in the calibration")
    outlier_reason: Optional[str] = Field(None, description="Reason for exclusion if outlier")


class CalibrationVersion(BaseModel):
    """Calibration version schema"""
    id: str = Field(..., description="Version ID")
    created_at: datetime = Field(default_factory=datetime.now)
    model: 'CalibrationModel' = Field(..., description="Calibration model")


class CalibrationModel(BaseModel):
    """Calibration model schema"""
    id: Optional[str] = None
    version_id: str = Field(..., description="Version ID for this calibration")
    method_id: int = Field(..., description="Method ID")
    instrument_id: Optional[int] = Field(None, description="Instrument ID (optional)")
    created_at: datetime = Field(default_factory=datetime.now)
    target_name: str = Field(..., min_length=1, max_length=100)
    model_type: str = Field(..., description="linear, linear_through_zero, weighted_1/x, weighted_1/x2")
    mode: CalibrationMode = Field(CalibrationMode.EXTERNAL, description="Calibration mode")
    internal_standard: Optional[InternalStandard] = Field(None, description="Internal standard configuration")
    outlier_policy: OutlierPolicy = Field(OutlierPolicy.NONE, description="Outlier detection policy")
    levels: List[CalibrationLevel] = Field(..., min_length=2, description="Calibration levels")
    slope: Optional[float] = Field(None, description="Calibration slope")
    intercept: Optional[float] = Field(None, description="Calibration intercept")
    r2: Optional[float] = Field(None, ge=0.0, le=1.0, description="R-squared value")
    residuals: Optional[List[float]] = Field(None, description="Residual values")
    excluded_points: Optional[List[int]] = Field(None, description="Excluded point indices")
    lod: Optional[float] = Field(None, description="Limit of detection")
    loq: Optional[float] = Field(None, description="Limit of quantitation")
    lod_method: Optional[str] = Field(None, description="LOD calculation method (blank, baseline)")
    notes: Optional[str] = Field(None, description="Calibration notes")
    active: bool = Field(False, description="Whether this is the active calibration")


class CalibrationFitRequest(BaseModel):
    """Calibration fit request schema"""
    method_id: int = Field(..., description="Method ID")
    instrument_id: Optional[int] = Field(None, description="Instrument ID")
    target_name: str = Field(..., min_length=1, max_length=100)
    model_type: str = Field(..., description="linear, linear_through_zero, weighted_1/x, weighted_1/x2")
    mode: CalibrationMode = Field(CalibrationMode.EXTERNAL, description="Calibration mode")
    internal_standard: Optional[InternalStandard] = Field(None, description="Internal standard configuration")
    outlier_policy: OutlierPolicy = Field(OutlierPolicy.NONE, description="Outlier detection policy")
    levels: List[CalibrationLevel] = Field(..., min_length=2)


class CalibrationActivateRequest(BaseModel):
    """Calibration activation request schema"""
    calibration_id: str = Field(..., description="Calibration ID to activate")


class QuantRequest(BaseModel):
    """Quantitation request schema"""
    run_id: int = Field(..., description="Run record ID")
    calibration_id: str = Field(..., description="Calibration model ID")
    map: Optional[Dict[str, str]] = Field(None, description="Peak name to target name mapping")


class QuantResult(BaseModel):
    """Quantitation result schema"""
    run_id: int = Field(..., description="Run record ID")
    sample_name: str = Field(..., description="Sample name")
    results: List[Dict[str, Any]] = Field(..., description="Quantitation results")
    # Each result contains: targetName, rt, area, response, concentration, unit, snr, flags


class SequenceItem(BaseModel):
    """Sequence item schema"""
    id: Optional[str] = None
    order: int = Field(..., ge=1, description="Item order in sequence")
    type: str = Field(..., description="Blank, Std, Sample, QC")
    sample_name: str = Field(..., min_length=1, max_length=255)
    method_id: int = Field(..., description="Method ID")
    expected_level: Optional[float] = Field(None, description="Expected concentration level")


class SequenceTemplate(BaseModel):
    """Sequence template schema"""
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    instrument_id: Optional[int] = Field(None, description="Instrument ID")
    items: List[SequenceItem] = Field(..., min_length=1, description="Sequence items")
    created_at: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = Field(None, description="Template notes")


class SequenceRun(BaseModel):
    """Sequence run schema"""
    id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    instrument_id: int = Field(..., description="Instrument ID")
    template_id: Optional[str] = Field(None, description="Template ID")
    items: List[SequenceItem] = Field(..., min_length=1, description="Sequence items")
    runs: List[RunRecord] = Field(default_factory=list, description="Generated run records")
    quant: List[QuantResult] = Field(default_factory=list, description="Quantitation results")
    status: str = Field("draft", description="draft, running, completed, error")
    notes: Optional[str] = Field(None, description="Run notes")


class SequenceRunRequest(BaseModel):
    """Sequence run request schema"""
    template_id: Optional[str] = Field(None, description="Template ID")
    template: Optional[SequenceTemplate] = Field(None, description="Template data")
    instrument_id: int = Field(..., description="Instrument ID")
    simulate: bool = Field(True, description="Whether to simulate runs")


class CalibrationListResponse(BaseModel):
    """Calibration list response schema"""
    calibrations: List[CalibrationModel]
    total: int
    active_calibration_id: Optional[str] = None


class SequenceTemplateListResponse(BaseModel):
    """Sequence template list response schema"""
    templates: List[SequenceTemplate]
    total: int


class SequenceRunListResponse(BaseModel):
    """Sequence run list response schema"""
    runs: List[SequenceRun]
    total: int


# =================== OCR INTEGRATION SCHEMAS ===================

class OCRImageType(str, Enum):
    """OCR image type enum for chromatogram processing"""
    CHROMATOGRAM = "chromatogram"
    SPECTRUM = "spectrum" 
    PEAK_TABLE = "peak_table"
    METHOD_PARAMETERS = "method_parameters"
    SAMPLE_INFO = "sample_info"
    CALIBRATION_CURVE = "calibration_curve"


class OCRQualityLevel(str, Enum):
    """OCR quality level for processing optimization"""
    FAST = "fast"           # Quick processing, lower accuracy
    BALANCED = "balanced"   # Good balance of speed and accuracy
    HIGH_ACCURACY = "high_accuracy"  # Slower but most accurate


class ImagePreprocessingOptions(BaseModel):
    """Image preprocessing configuration for OCR"""
    enhance_contrast: bool = Field(True, description="Enhance image contrast")
    denoise: bool = Field(True, description="Apply noise reduction")
    deskew: bool = Field(True, description="Auto-correct image skew")
    binarize: bool = Field(False, description="Convert to binary image")
    scale_factor: float = Field(2.0, ge=1.0, le=5.0, description="Image scaling factor")
    gaussian_blur: bool = Field(False, description="Apply Gaussian blur for smoothing")
    
    model_config = ConfigDict(from_attributes=True)


class OCRProcessingRequest(BaseModel):
    """OCR processing request schema"""
    image_base64: str = Field(..., description="Base64 encoded image data")
    image_type: OCRImageType = Field(..., description="Type of chromatogram image")
    quality_level: OCRQualityLevel = Field(OCRQualityLevel.BALANCED, description="Processing quality level")
    preprocessing: ImagePreprocessingOptions = Field(default_factory=ImagePreprocessingOptions)
    extract_peaks: bool = Field(True, description="Extract peak information")
    extract_method_params: bool = Field(True, description="Extract method parameters")
    extract_sample_info: bool = Field(True, description="Extract sample information")
    custom_roi: Optional[List[Dict[str, int]]] = Field(None, description="Custom regions of interest [x,y,width,height]")
    
    model_config = ConfigDict(from_attributes=True)


class OCRTextRegion(BaseModel):
    """Extracted text region with coordinates and confidence"""
    text: str = Field(..., description="Extracted text content")
    confidence: float = Field(..., ge=0.0, le=1.0, description="OCR confidence score")
    bbox: Dict[str, int] = Field(..., description="Bounding box coordinates {x, y, width, height}")
    region_type: str = Field(..., description="Type of region (header, data, label, etc.)")
    
    model_config = ConfigDict(from_attributes=True)


class OCRPeakData(BaseModel):
    """Extracted chromatogram peak information"""
    peak_number: Optional[int] = Field(None, description="Peak number/ID")
    retention_time: Optional[float] = Field(None, description="Retention time in minutes")
    area: Optional[float] = Field(None, description="Peak area")
    height: Optional[float] = Field(None, description="Peak height") 
    area_percent: Optional[float] = Field(None, description="Area percentage")
    compound_name: Optional[str] = Field(None, description="Compound identification")
    confidence: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="Peak identification confidence")
    coordinates: Optional[Dict[str, int]] = Field(None, description="Peak coordinates on image")
    
    model_config = ConfigDict(from_attributes=True)


class OCRMethodParameters(BaseModel):
    """Extracted GC method parameters"""
    column_type: Optional[str] = Field(None, description="Column type/model")
    column_length: Optional[str] = Field(None, description="Column length")
    carrier_gas: Optional[str] = Field(None, description="Carrier gas type")
    flow_rate: Optional[str] = Field(None, description="Flow rate")
    injection_volume: Optional[str] = Field(None, description="Injection volume")
    inlet_temperature: Optional[str] = Field(None, description="Inlet temperature")
    detector_type: Optional[str] = Field(None, description="Detector type")
    oven_program: Optional[List[str]] = Field(None, description="Oven temperature program steps")
    
    model_config = ConfigDict(from_attributes=True)


class OCRSampleInfo(BaseModel):
    """Extracted sample information"""
    sample_name: Optional[str] = Field(None, description="Sample name/ID")
    injection_date: Optional[str] = Field(None, description="Injection date/time")
    operator: Optional[str] = Field(None, description="Operator name")
    dilution_factor: Optional[str] = Field(None, description="Sample dilution factor")
    vial_position: Optional[str] = Field(None, description="Autosampler vial position")
    sequence_number: Optional[str] = Field(None, description="Sequence number")
    
    model_config = ConfigDict(from_attributes=True)


class OCRProcessingResult(BaseModel):
    """Complete OCR processing result"""
    success: bool = Field(..., description="Processing success status")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    image_dimensions: Dict[str, int] = Field(..., description="Original image dimensions")
    
    # Extracted content
    text_regions: List[OCRTextRegion] = Field(default_factory=list, description="All detected text regions")
    peaks_data: List[OCRPeakData] = Field(default_factory=list, description="Extracted peak information")
    method_parameters: Optional[OCRMethodParameters] = Field(None, description="Extracted method parameters")
    sample_info: Optional[OCRSampleInfo] = Field(None, description="Extracted sample information")
    
    # Quality metrics
    overall_confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score")
    text_extraction_quality: str = Field(..., description="Text extraction quality assessment")
    peak_detection_quality: str = Field(..., description="Peak detection quality assessment")
    
    # Processing details
    preprocessing_applied: ImagePreprocessingOptions = Field(..., description="Applied preprocessing steps")
    warnings: List[str] = Field(default_factory=list, description="Processing warnings")
    errors: List[str] = Field(default_factory=list, description="Processing errors")
    
    # Additional fields for AI integration
    image_type: Optional[OCRImageType] = Field(None, description="Type of image processed")
    processing_metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")
    
    # AI compatibility properties
    @property
    def confidence_score(self) -> float:
        """Alias for overall_confidence for AI integration compatibility"""
        return self.overall_confidence
    
    model_config = ConfigDict(from_attributes=True)


class OCRBatchProcessingRequest(BaseModel):
    """Batch OCR processing for multiple images"""
    images: List[OCRProcessingRequest] = Field(..., min_length=1, max_length=50, description="Images to process")
    batch_name: Optional[str] = Field(None, description="Batch processing name")
    parallel_processing: bool = Field(True, description="Enable parallel processing")
    
    model_config = ConfigDict(from_attributes=True)


class OCRBatchProcessingResult(BaseModel):
    """Batch OCR processing result"""
    batch_id: str = Field(..., description="Unique batch processing ID")
    total_images: int = Field(..., description="Total number of images processed")
    successful_extractions: int = Field(..., description="Number of successful extractions")
    failed_extractions: int = Field(..., description="Number of failed extractions")
    total_processing_time_ms: int = Field(..., description="Total batch processing time")
    
    results: List[OCRProcessingResult] = Field(..., description="Individual processing results")
    batch_summary: Dict[str, Any] = Field(..., description="Batch processing summary statistics")
    
    model_config = ConfigDict(from_attributes=True)


# Aliases for API compatibility
OCRBatchRequest = OCRBatchProcessingRequest
OCRBatchResult = OCRBatchProcessingResult


# =================== AI INTEGRATION SCHEMAS ===================
# Placeholder schemas for AI troubleshooter integration

class PeakData(BaseModel):
    """Peak data for AI analysis"""
    peak_number: int = Field(..., description="Peak number/ID")
    retention_time: float = Field(..., description="Retention time in minutes")
    area: float = Field(..., description="Peak area")
    height: float = Field(..., description="Peak height")
    area_percent: float = Field(..., description="Area percentage")
    width_at_half_height: float = Field(0.0, description="Peak width at half height")
    tailing_factor: float = Field(1.0, description="Peak tailing factor")
    theoretical_plates: int = Field(0, description="Theoretical plates")
    resolution: float = Field(0.0, description="Resolution from previous peak")
    compound_name: str = Field("Unknown", description="Compound identification")
    confidence: float = Field(0.0, description="Identification confidence")
    processing_notes: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")
    
    model_config = ConfigDict(from_attributes=True)


class ChromatogramData(BaseModel):
    """Complete chromatogram data for AI analysis"""
    file_path: str = Field(..., description="File path or identifier")
    sample_name: str = Field(..., description="Sample name")
    method_name: str = Field(..., description="Analysis method name")
    injection_date: datetime = Field(..., description="Injection date and time")
    peaks: List[PeakData] = Field(default_factory=list, description="Peak data")
    total_runtime: float = Field(0.0, description="Total run time in minutes")
    instrument_type: str = Field("GC-MS", description="Instrument type")
    detector_type: str = Field("Unknown", description="Detector type")
    column_info: Dict[str, Any] = Field(default_factory=dict, description="Column information")
    method_parameters: Dict[str, Any] = Field(default_factory=dict, description="Method parameters")
    sample_info: Dict[str, Any] = Field(default_factory=dict, description="Sample information")
    raw_data_available: bool = Field(False, description="Raw data availability")
    processing_metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")
    
    model_config = ConfigDict(from_attributes=True)


class InstrumentData(BaseModel):
    """Instrument data for AI analysis"""
    instrument_id: str = Field(..., description="Instrument identifier")
    instrument_type: str = Field(..., description="Instrument type")
    manufacturer: str = Field(..., description="Manufacturer")
    model: str = Field(..., description="Model")
    serial_number: Optional[str] = Field(None, description="Serial number")
    installation_date: Optional[datetime] = Field(None, description="Installation date")
    last_maintenance: Optional[datetime] = Field(None, description="Last maintenance date")
    status: str = Field("Active", description="Current status")
    
    model_config = ConfigDict(from_attributes=True)


class AnalysisRequest(BaseModel):
    """AI analysis request"""
    request_id: str = Field(..., description="Unique request identifier")
    analysis_type: str = Field(..., description="Type of analysis")
    chromatogram_data: ChromatogramData = Field(..., description="Chromatogram data to analyze")
    priority: str = Field("normal", description="Analysis priority")
    user_context: Dict[str, Any] = Field(default_factory=dict, description="User context")
    analysis_parameters: Dict[str, Any] = Field(default_factory=dict, description="Analysis parameters")
    requested_outputs: List[str] = Field(default_factory=list, description="Requested output types")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Request creation time")
    
    model_config = ConfigDict(from_attributes=True)


class OCRCalibrationData(BaseModel):
    """OCR-extracted calibration curve data"""
    calibration_points: List[Dict[str, float]] = Field(..., description="Calibration points (concentration, response)")
    r_squared: Optional[float] = Field(None, description="R-squared value if extracted")
    equation: Optional[str] = Field(None, description="Calibration equation if extracted")
    units: Optional[Dict[str, str]] = Field(None, description="Units for x and y axes")
    
    model_config = ConfigDict(from_attributes=True)


class OCRHealthStatus(BaseModel):
    """OCR service health and performance status"""
    service_status: Literal["healthy", "degraded", "offline"] = Field(..., description="Overall service status")
    tesseract_version: str = Field(..., description="Tesseract OCR version")
    opencv_version: str = Field(..., description="OpenCV version")
    total_processed: int = Field(..., description="Total images processed")
    average_processing_time_ms: float = Field(..., description="Average processing time")
    success_rate_percent: float = Field(..., description="Success rate percentage")
    last_error: Optional[str] = Field(None, description="Last processing error")
    
    model_config = ConfigDict(from_attributes=True)


# ========================================
# AI TROUBLESHOOTER SCHEMAS
# ========================================

class DiagnosticIssue(BaseModel):
    """Individual diagnostic issue identified by AI"""
    issue_id: str = Field(..., description="Unique issue identifier")
    category: Literal["peak_quality", "method_parameters", "instrument_performance", "sample_preparation", "data_quality"] = Field(..., description="Issue category")
    severity: Literal["critical", "major", "minor", "warning", "info"] = Field(..., description="Issue severity")
    title: str = Field(..., description="Brief issue title")
    description: str = Field(..., description="Detailed issue description")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence in diagnosis")
    affected_peaks: Optional[List[int]] = Field(None, description="Peak numbers affected by this issue")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Evidence supporting diagnosis")
    
    model_config = ConfigDict(from_attributes=True)


class TroubleshootingSolution(BaseModel):
    """Troubleshooting solution recommendation"""
    solution_id: str = Field(..., description="Unique solution identifier")
    title: str = Field(..., description="Solution title")
    category: Literal["method_adjustment", "instrument_maintenance", "sample_preparation", "data_processing", "preventive"] = Field(..., description="Solution category")
    priority: Literal["immediate", "high", "medium", "low"] = Field(..., description="Implementation priority")
    difficulty: Literal["beginner", "intermediate", "advanced", "expert"] = Field(..., description="Implementation difficulty")
    estimated_time: str = Field(..., description="Estimated implementation time")
    description: str = Field(..., description="Detailed solution description")
    steps: List[str] = Field(..., description="Step-by-step implementation guide")
    expected_outcome: str = Field(..., description="Expected results after implementation")
    prerequisites: List[str] = Field(default_factory=list, description="Required prerequisites")
    tools_required: List[str] = Field(default_factory=list, description="Tools/materials needed")
    safety_notes: List[str] = Field(default_factory=list, description="Safety considerations")
    references: List[str] = Field(default_factory=list, description="Reference materials")
    
    model_config = ConfigDict(from_attributes=True)


class DiagnosticResult(BaseModel):
    """Complete diagnostic analysis result"""
    analysis_id: str = Field(..., description="Unique analysis identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Analysis timestamp")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Overall quality score (0-100)")
    overall_status: Literal["excellent", "good", "acceptable", "poor", "critical"] = Field(..., description="Overall status assessment")
    
    # Detected issues
    issues: List[DiagnosticIssue] = Field(default_factory=list, description="Identified issues")
    critical_issues_count: int = Field(0, description="Number of critical issues")
    major_issues_count: int = Field(0, description="Number of major issues")
    
    # Recommendations
    solutions: List[TroubleshootingSolution] = Field(default_factory=list, description="Recommended solutions")
    immediate_actions: List[str] = Field(default_factory=list, description="Immediate actions needed")
    preventive_measures: List[str] = Field(default_factory=list, description="Preventive measures")
    
    # Analysis details
    peak_analysis: Dict[str, Any] = Field(default_factory=dict, description="Peak-specific analysis")
    method_analysis: Dict[str, Any] = Field(default_factory=dict, description="Method parameter analysis")
    instrument_analysis: Dict[str, Any] = Field(default_factory=dict, description="Instrument performance analysis")
    
    # Metadata
    processing_time_ms: int = Field(..., description="Analysis processing time")
    ai_model_version: str = Field("v1.0", description="AI model version used")
    confidence_metrics: Dict[str, float] = Field(default_factory=dict, description="AI confidence metrics")
    
    model_config = ConfigDict(from_attributes=True)


class TroubleshooterRequest(BaseModel):
    """AI troubleshooter analysis request"""
    request_id: str = Field(..., description="Unique request identifier")
    analysis_type: Literal["comprehensive", "peak_analysis", "method_validation", "instrument_check", "quick_scan"] = Field("comprehensive", description="Type of analysis")
    
    # Data sources
    chromatogram_data: Optional[ChromatogramData] = Field(None, description="Chromatogram data to analyze")
    ocr_data: Optional[OCRProcessingResult] = Field(None, description="OCR-extracted data")
    historical_data: Optional[List[ChromatogramData]] = Field(None, description="Historical data for comparison")
    
    # Analysis parameters
    sensitivity_level: Literal["low", "medium", "high"] = Field("medium", description="Analysis sensitivity")
    focus_areas: List[str] = Field(default_factory=list, description="Specific areas to focus on")
    user_context: Dict[str, Any] = Field(default_factory=dict, description="User-provided context")
    
    # Options
    include_solutions: bool = Field(True, description="Include troubleshooting solutions")
    include_preventive: bool = Field(True, description="Include preventive recommendations")
    priority_filter: Optional[List[str]] = Field(None, description="Filter by priority levels")
    
    model_config = ConfigDict(from_attributes=True)


class TroubleshooterResponse(BaseModel):
    """AI troubleshooter analysis response"""
    request_id: str = Field(..., description="Request identifier")
    status: Literal["completed", "failed", "partial"] = Field(..., description="Analysis status")
    
    # Results
    diagnostic_result: Optional[DiagnosticResult] = Field(None, description="Diagnostic analysis result")
    
    # Summary
    executive_summary: str = Field(..., description="Executive summary of findings")
    key_findings: List[str] = Field(default_factory=list, description="Key findings summary")
    critical_alerts: List[str] = Field(default_factory=list, description="Critical alerts requiring immediate attention")
    
    # Processing info
    processing_time_ms: int = Field(..., description="Total processing time")
    data_quality_score: float = Field(..., ge=0.0, le=1.0, description="Input data quality score")
    analysis_completeness: float = Field(..., ge=0.0, le=1.0, description="Analysis completeness percentage")
    
    # Errors and warnings
    errors: List[str] = Field(default_factory=list, description="Analysis errors")
    warnings: List[str] = Field(default_factory=list, description="Analysis warnings")
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Response generation time")
    ai_version: str = Field("v1.0", description="AI troubleshooter version")
    
    model_config = ConfigDict(from_attributes=True)


class KnowledgeBaseEntry(BaseModel):
    """Knowledge base entry for troubleshooting patterns"""
    entry_id: str = Field(..., description="Unique entry identifier")
    category: str = Field(..., description="Knowledge category")
    title: str = Field(..., description="Entry title")
    description: str = Field(..., description="Detailed description")
    
    # Diagnostic patterns
    symptoms: List[str] = Field(..., description="Observable symptoms")
    causes: List[str] = Field(..., description="Possible causes")
    diagnostic_criteria: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic criteria")
    
    # Solutions
    solutions: List[TroubleshootingSolution] = Field(default_factory=list, description="Associated solutions")
    
    # Metadata
    confidence_threshold: float = Field(0.7, description="Minimum confidence for application")
    applicable_instruments: List[str] = Field(default_factory=list, description="Applicable instrument types")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")
    
    model_config = ConfigDict(from_attributes=True)


class AITroubleshooterHealth(BaseModel):
    """AI troubleshooter service health status"""
    service_status: Literal["operational", "degraded", "offline"] = Field(..., description="Service status")
    knowledge_base_entries: int = Field(..., description="Number of knowledge base entries")
    total_analyses: int = Field(..., description="Total analyses performed")
    success_rate: float = Field(..., ge=0.0, le=1.0, description="Analysis success rate")
    average_processing_time_ms: float = Field(..., description="Average processing time")
    last_analysis: Optional[datetime] = Field(None, description="Last successful analysis")
    active_models: List[str] = Field(default_factory=list, description="Active AI models")
    
    model_config = ConfigDict(from_attributes=True)


# =================== AI TROUBLESHOOTER ADDITIONAL SCHEMAS ===================

class MethodParameters(BaseModel):
    """GC-MS Method Parameters"""
    inlet_temperature: Optional[float] = Field(None, description="Inlet temperature in Celsius")
    column_temperature: Optional[float] = Field(None, description="Initial column temperature in Celsius")
    carrier_gas_flow: Optional[float] = Field(None, description="Carrier gas flow rate in mL/min")
    injection_volume: Optional[float] = Field(None, description="Injection volume in microliters")
    split_ratio: Optional[str] = Field(None, description="Split ratio (e.g., '10:1')")
    oven_program: Optional[List[str]] = Field(None, description="Oven temperature program steps")
    detector_temperature: Optional[float] = Field(None, description="Detector temperature in Celsius")
    pressure: Optional[float] = Field(None, description="System pressure in psi")
    
    model_config = ConfigDict(from_attributes=True)


class Peak(BaseModel):
    """Chromatographic Peak Information"""
    peak_number: int = Field(1, description="Peak number in chromatogram")
    retention_time: float = Field(0.0, description="Retention time in minutes")
    area: float = Field(0.0, description="Peak area")
    height: float = Field(0.0, description="Peak height")
    width: Optional[float] = Field(None, description="Peak width at base")
    name: Optional[str] = Field(None, description="Compound name")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Peak identification confidence")
    area_percent: float = Field(0.0, description="Area percentage")
    tailing_factor: float = Field(1.0, description="Peak tailing factor")
    theoretical_plates: int = Field(1000, description="Theoretical plates (efficiency)")
    resolution: float = Field(1.5, description="Resolution from previous peak")
    
    # Additional attributes for AI troubleshooter compatibility
    signal_to_noise_ratio: Optional[float] = Field(10.0, description="Signal to noise ratio")
    
    model_config = ConfigDict(from_attributes=True)


class ChromatogramData(BaseModel):
    """Complete Chromatogram Data Structure"""
    file_path: str = Field(..., description="Path to chromatogram file")
    sample_name: str = Field(..., description="Sample name")
    method_name: str = Field(..., description="Analysis method name")
    injection_date: datetime = Field(..., description="Injection/analysis date")
    
    # Peak information
    peaks: List[Peak] = Field(default_factory=list, description="Detected peaks")
    total_area: Optional[float] = Field(None, description="Total peak area")
    peak_count: int = Field(0, description="Number of peaks")
    
    # Method and instrument parameters
    method_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Method parameters")
    instrument_type: str = Field("GC-MS", description="Instrument type")
    
    # Quality metrics
    baseline_noise: Optional[float] = Field(None, description="Baseline noise level")
    signal_to_noise_ratio: Optional[float] = Field(None, description="Signal-to-noise ratio")
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    model_config = ConfigDict(from_attributes=True)


class PeakData(BaseModel):
    """Enhanced Peak Data for AI Analysis"""
    peak_number: int = Field(1, description="Peak number in chromatogram")
    retention_time: float = Field(0.0, description="Retention time in minutes")
    area: float = Field(0.0, description="Peak area")
    height: float = Field(0.0, description="Peak height")
    area_percent: float = Field(0.0, description="Area percentage")
    
    # Quality metrics
    width_at_half_height: float = Field(0.1, description="Peak width at half height")
    tailing_factor: float = Field(1.0, description="Peak tailing factor")
    theoretical_plates: int = Field(1000, description="Theoretical plates")
    resolution: float = Field(1.5, description="Resolution from previous peak")
    
    # Identification
    compound_name: Optional[str] = Field(None, description="Identified compound name")
    confidence: float = Field(0.5, ge=0.0, le=1.0, description="Identification confidence")
    
    # Processing notes
    processing_notes: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata")
    
    model_config = ConfigDict(from_attributes=True)


class InstrumentData(BaseModel):
    """Instrument Configuration and Status"""
    instrument_id: str = Field(..., description="Instrument identifier")
    instrument_type: str = Field(..., description="Instrument type (e.g., GC-MS)")
    model: Optional[str] = Field(None, description="Instrument model")
    serial_number: Optional[str] = Field(None, description="Serial number")
    
    # Status
    status: str = Field("online", description="Current status")
    last_maintenance: Optional[datetime] = Field(None, description="Last maintenance date")
    next_maintenance: Optional[datetime] = Field(None, description="Next scheduled maintenance")
    
    # Configuration
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Instrument configuration")
    
    model_config = ConfigDict(from_attributes=True)


class AnalysisRequest(BaseModel):
    """Analysis Request for AI Processing"""
    request_id: str = Field(..., description="Unique request identifier")
    analysis_type: str = Field(..., description="Type of analysis requested")
    chromatogram_data: ChromatogramData = Field(..., description="Chromatogram data to analyze")
    
    # Request parameters
    priority: str = Field("normal", description="Request priority level")
    user_context: Dict[str, Any] = Field(default_factory=dict, description="User context information")
    analysis_parameters: Dict[str, Any] = Field(default_factory=dict, description="Analysis parameters")
    
    # Output requirements  
    requested_outputs: List[str] = Field(default_factory=list, description="Requested output types")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Request creation time")
    
    model_config = ConfigDict(from_attributes=True) 