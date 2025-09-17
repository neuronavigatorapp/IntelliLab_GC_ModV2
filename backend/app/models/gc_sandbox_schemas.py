"""
GC Instrument Sandbox Schemas
Comprehensive Pydantic v2 models for GC instrument simulation and method development
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any, Literal, Union
from datetime import datetime
from enum import Enum
import numpy as np


class CarrierGasType(str, Enum):
    """Supported carrier gas types"""
    HELIUM = "He"
    HYDROGEN = "H2"
    NITROGEN = "N2"
    ARGON = "Ar"


class InletMode(str, Enum):
    """GC inlet operation modes"""
    SPLIT = "split"
    SPLITLESS = "splitless"
    PULSED_SPLIT = "pulsed_split"
    PULSED_SPLITLESS = "pulsed_splitless"
    DIRECT = "direct"


class FlowMode(str, Enum):
    """Column flow control modes"""
    CONSTANT_FLOW = "constant_flow"
    CONSTANT_PRESSURE = "constant_pressure"
    CONSTANT_VELOCITY = "constant_velocity"


class DetectorType(str, Enum):
    """Supported detector types"""
    FID = "FID"  # Flame Ionization Detector
    TCD = "TCD"  # Thermal Conductivity Detector
    SCD = "SCD"  # Sulfur Chemiluminescence Detector
    NPD = "NPD"  # Nitrogen Phosphorus Detector
    ECD = "ECD"  # Electron Capture Detector


class ValveState(str, Enum):
    """Valve position states"""
    INJECT = "inject"
    LOAD = "load"
    BACKFLUSH = "backflush"
    BYPASS = "bypass"


class SandboxInlet(BaseModel):
    """GC inlet configuration with comprehensive parameters"""
    
    # Basic configuration
    inlet_id: str = Field(..., description="Inlet identifier")
    mode: InletMode = Field(..., description="Inlet operation mode")
    carrier_gas: CarrierGasType = Field(..., description="Carrier gas type")
    
    # Temperature settings
    temperature_celsius: float = Field(..., ge=50, le=450, description="Inlet temperature (°C)")
    temperature_program_enabled: bool = Field(False, description="Enable inlet temperature programming")
    
    # Pressure and flow settings
    inlet_pressure_kpa: float = Field(..., ge=0, le=1000, description="Inlet pressure (kPa)")
    total_flow_ml_min: float = Field(..., ge=0, le=1000, description="Total flow rate (mL/min)")
    
    # Split/splitless parameters
    split_ratio: Optional[float] = Field(None, ge=1, le=1000, description="Split ratio (split mode only)")
    split_flow_ml_min: Optional[float] = Field(None, ge=0, le=1000, description="Split flow (mL/min)")
    septum_purge_flow_ml_min: float = Field(2.0, ge=0, le=20, description="Septum purge flow (mL/min)")
    
    # Gas saver settings
    gas_saver_enabled: bool = Field(False, description="Enable gas saver")
    gas_saver_flow_ml_min: Optional[float] = Field(None, ge=0, le=100, description="Gas saver flow (mL/min)")
    gas_saver_time_min: Optional[float] = Field(None, ge=0, le=60, description="Gas saver activation time (min)")
    
    # Liner specifications
    liner_type: str = Field("standard_splitless", description="Liner type/model")
    liner_volume_ul: float = Field(870.0, ge=100, le=2000, description="Liner volume (µL)")
    
    # Pulse settings (for pulsed modes)
    pulse_pressure_kpa: Optional[float] = Field(None, ge=0, le=1000, description="Pulse pressure (kPa)")
    pulse_time_min: Optional[float] = Field(None, ge=0, le=10, description="Pulse duration (min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )

    @field_validator('split_ratio')
    @classmethod
    def validate_split_ratio_mode(cls, v, info):
        if info.data and info.data.get('mode') in [InletMode.SPLIT, InletMode.PULSED_SPLIT]:
            if v is None or v < 1:
                raise ValueError('Split ratio required and must be >= 1 for split modes')
        return v


class SandboxColumn(BaseModel):
    """GC column specification with comprehensive parameters"""
    
    # Basic specifications
    column_id: str = Field(..., description="Column identifier")
    length_meters: float = Field(..., ge=1, le=100, description="Column length (m)")
    inner_diameter_mm: float = Field(..., ge=0.1, le=10.0, description="Inner diameter (mm)")
    film_thickness_um: float = Field(..., ge=0.1, le=10.0, description="Stationary phase film thickness (µm)")
    
    # Stationary phase
    stationary_phase: str = Field(..., description="Stationary phase type (e.g., DB-5, HP-PLOT/Q)")
    max_temperature_celsius: float = Field(..., ge=50, le=500, description="Maximum operating temperature (°C)")
    
    # Flow control
    flow_mode: FlowMode = Field(..., description="Flow control mode")
    target_flow_ml_min: Optional[float] = Field(None, ge=0.1, le=50, description="Target flow rate (mL/min)")
    target_pressure_kpa: Optional[float] = Field(None, ge=0, le=1000, description="Target pressure (kPa)")
    target_velocity_cm_s: Optional[float] = Field(None, ge=1, le=200, description="Target linear velocity (cm/s)")
    
    # Outlet conditions
    outlet_mode: Literal["vacuum", "ambient", "makeup"] = Field("ambient", description="Column outlet configuration")
    vacuum_level_kpa: Optional[float] = Field(None, ge=0, le=101.325, description="Vacuum level (kPa absolute)")
    
    # Plumbing configuration
    series_column_id: Optional[str] = Field(None, description="Series-connected column ID")
    backflush_enabled: bool = Field(False, description="Enable backflush capability")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )

    @field_validator('target_flow_ml_min', 'target_pressure_kpa', 'target_velocity_cm_s')
    @classmethod
    def validate_flow_control_target(cls, v, info):
        if v is not None and info.data:
            flow_mode = info.data.get('flow_mode')
            field_name = info.field_name
            
            if flow_mode == FlowMode.CONSTANT_FLOW and field_name != 'target_flow_ml_min':
                if v is not None:
                    raise ValueError(f'{field_name} should be None for constant flow mode')
            elif flow_mode == FlowMode.CONSTANT_PRESSURE and field_name != 'target_pressure_kpa':
                if v is not None:
                    raise ValueError(f'{field_name} should be None for constant pressure mode')
            elif flow_mode == FlowMode.CONSTANT_VELOCITY and field_name != 'target_velocity_cm_s':
                if v is not None:
                    raise ValueError(f'{field_name} should be None for constant velocity mode')
        return v


class SandboxOvenProgramStep(BaseModel):
    """Individual oven temperature program step"""
    
    step_number: int = Field(..., ge=1, description="Step sequence number")
    target_temperature_celsius: float = Field(..., ge=30, le=500, description="Target temperature (°C)")
    ramp_rate_c_min: Optional[float] = Field(None, ge=0, le=100, description="Ramp rate (°C/min), None for initial")
    hold_time_min: float = Field(0.0, ge=0, le=999, description="Hold time at target temperature (min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )

    @field_validator('ramp_rate_c_min')
    @classmethod
    def validate_ramp_rate(cls, v, info):
        if info.data and info.data.get('step_number', 1) == 1:
            if v is not None:
                raise ValueError('Initial step (step 1) cannot have a ramp rate')
        elif v is None:
            raise ValueError('Non-initial steps must have a ramp rate')
        return v


class SandboxValveProgram(BaseModel):
    """Valve timing and state programming"""
    
    valve_id: str = Field(..., description="Valve identifier")
    valve_type: Literal["rotary", "switching", "backflush"] = Field(..., description="Valve type")
    
    # Timing events
    events: List[Dict[str, Any]] = Field(..., description="Valve state change events")
    
    # LPG rotary valve specific
    loop_size_ul: Optional[float] = Field(None, ge=1, le=10000, description="Sample loop size (µL)")
    load_time_min: Optional[float] = Field(None, ge=0, le=60, description="Load phase duration (min)")
    inject_time_min: Optional[float] = Field(None, ge=0, le=60, description="Inject phase duration (min)")
    
    # Backflush specific
    backflush_pressure_kpa: Optional[float] = Field(None, ge=0, le=1000, description="Backflush pressure (kPa)")
    backflush_flow_ml_min: Optional[float] = Field(None, ge=0, le=100, description="Backflush flow (mL/min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxDetectorFID(BaseModel):
    """Flame Ionization Detector configuration"""
    
    detector_id: str = Field(..., description="Detector identifier")
    
    # Temperature
    temperature_celsius: float = Field(..., ge=100, le=450, description="Detector temperature (°C)")
    
    # Gas flows
    hydrogen_flow_ml_min: float = Field(..., ge=10, le=100, description="Hydrogen flow (mL/min)")
    air_flow_ml_min: float = Field(..., ge=200, le=1000, description="Air flow (mL/min)")
    makeup_flow_ml_min: float = Field(25.0, ge=0, le=200, description="Makeup gas flow (mL/min)")
    makeup_gas: CarrierGasType = Field(CarrierGasType.NITROGEN, description="Makeup gas type")
    
    # Data acquisition
    data_rate_hz: float = Field(20.0, ge=1, le=200, description="Data acquisition rate (Hz)")
    filter_time_constant_s: float = Field(0.1, ge=0.01, le=10, description="Filter time constant (s)")
    
    # Electronics
    electrometer_range: int = Field(11, ge=8, le=14, description="Electrometer range (powers of 10)")
    autozero_enabled: bool = Field(True, description="Enable automatic zero adjustment")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxDetectorTCD(BaseModel):
    """Thermal Conductivity Detector configuration"""
    
    detector_id: str = Field(..., description="Detector identifier")
    
    # Temperature
    temperature_celsius: float = Field(..., ge=100, le=400, description="Detector temperature (°C)")
    
    # Reference flow
    reference_flow_ml_min: float = Field(..., ge=5, le=50, description="Reference flow (mL/min)")
    
    # Electronics
    bridge_current_ma: float = Field(150.0, ge=50, le=300, description="Filament bridge current (mA)")
    polarity: Literal["positive", "negative"] = Field("negative", description="Signal polarity")
    
    # Data acquisition
    data_rate_hz: float = Field(20.0, ge=1, le=200, description="Data acquisition rate (Hz)")
    filter_time_constant_s: float = Field(0.1, ge=0.01, le=10, description="Filter time constant (s)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxDetectorSCD(BaseModel):
    """Sulfur Chemiluminescence Detector configuration"""
    
    detector_id: str = Field(..., description="Detector identifier")
    
    # Furnace temperatures
    furnace_temperature_celsius: float = Field(..., ge=800, le=1100, description="Combustion furnace temperature (°C)")
    transfer_line_temperature_celsius: float = Field(..., ge=150, le=300, description="Transfer line temperature (°C)")
    
    # Gas flows
    oxygen_flow_ml_min: float = Field(..., ge=10, le=50, description="Oxygen flow (mL/min)")
    hydrogen_flow_ml_min: float = Field(..., ge=5, le=30, description="Hydrogen flow (mL/min)")
    
    # Ozone generation
    ozone_enabled: bool = Field(True, description="Enable ozone generation")
    ozone_voltage_v: float = Field(300.0, ge=100, le=500, description="Ozone generator voltage (V)")
    
    # PMT settings
    pmt_voltage_v: float = Field(600.0, ge=300, le=1000, description="Photomultiplier tube voltage (V)")
    
    # Data acquisition
    data_rate_hz: float = Field(20.0, ge=1, le=200, description="Data acquisition rate (Hz)")
    
    # Conditioning
    conditioning_time_min: float = Field(30.0, ge=0, le=120, description="Detector conditioning time (min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


# Union type for all detector configurations
SandboxDetectorConfig = Union[SandboxDetectorFID, SandboxDetectorTCD, SandboxDetectorSCD]


class SandboxAnalyte(BaseModel):
    """Individual analyte parameters for GC simulation"""
    
    name: str = Field(..., description="Analyte name")
    concentration_ppm: float = Field(..., ge=0.1, description="Concentration (ppm)")
    retention_factor: float = Field(..., ge=0.1, le=100.0, description="Retention factor")
    diffusion_coefficient: float = Field(..., ge=0.001, le=1.0, description="Diffusion coefficient")
    response_factor: float = Field(1.0, ge=0.1, le=10.0, description="Detector response factor")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxSampleProfile(BaseModel):
    """Sample and analyte behavior profile for simulation"""
    
    sample_id: str = Field(..., description="Sample identifier")
    
    # Injection parameters
    injection_volume_ul: float = Field(..., ge=0.1, le=10.0, description="Injection volume (µL)")
    injection_type: Literal["liquid", "gas", "headspace", "lpg_valve"] = Field("liquid", description="Injection type")
    solvent: str = Field("none", description="Sample solvent")
    matrix: str = Field("gas", description="Sample matrix (gas, liquid, solid)")
    
    # Matrix effects
    matrix_type: str = Field("standard", description="Sample matrix type")
    viscosity_cp: float = Field(1.0, ge=0.1, le=100, description="Sample viscosity (cP)")
    
    # Peak characteristics per analyte
    analytes: List[SandboxAnalyte] = Field(..., description="Analyte-specific parameters")
    
    # Global simulation parameters
    target_signal_to_noise: float = Field(100.0, ge=1, le=10000, description="Target S/N ratio")
    baseline_drift_percent_min: float = Field(0.1, ge=0, le=5, description="Baseline drift (%/min)")
    baseline_noise_level: float = Field(1.0, ge=0.1, le=100, description="Baseline noise level")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxMethodParameters(BaseModel):
    """Complete GC method configuration"""
    
    method_id: str = Field("DEFAULT_METHOD", description="Method identifier")
    method_name: str = Field(..., description="Method name")
    
    # Instrument configuration
    inlets: List[SandboxInlet] = Field(..., min_length=1, description="Inlet configurations")
    columns: List[SandboxColumn] = Field(..., min_length=1, description="Column configurations")
    detectors: List[SandboxDetectorConfig] = Field(..., min_length=1, description="Detector configurations")
    
    # Temperature programming
    oven_program: List[SandboxOvenProgramStep] = Field(..., min_length=1, description="Oven temperature program")
    
    # Valve programming
    valve_programs: List[SandboxValveProgram] = Field(default_factory=list, description="Valve programs")
    
    # Global settings
    ambient_pressure_kpa: float = Field(101.325, ge=50, le=120, description="Ambient pressure (kPa)")
    acquisition_rate_hz: float = Field(20.0, ge=1, le=200, description="Data acquisition rate (Hz)")
    expected_run_time_min: float = Field(..., ge=1, le=999, description="Expected run time (min)")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now, description="Method creation timestamp")
    modified_at: datetime = Field(default_factory=datetime.now, description="Last modification timestamp")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxRunRequest(BaseModel):
    """Request for GC simulation run"""
    
    run_id: str = Field(..., description="Unique run identifier")
    method_parameters: SandboxMethodParameters = Field(..., description="GC method configuration")
    sample_profile: SandboxSampleProfile = Field(..., description="Sample characteristics")
    
    # Simulation options
    simulation_seed: Optional[int] = Field(None, description="Random seed for reproducible results")
    include_noise: bool = Field(True, description="Include realistic noise in simulation")
    include_baseline_drift: bool = Field(True, description="Include baseline drift")
    
    # Export options
    export_csv: bool = Field(True, description="Export chromatogram data as CSV")
    export_png: bool = Field(True, description="Export chromatogram charts as PNG")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxChromatogramSeries(BaseModel):
    """Simulated chromatogram data series"""
    
    detector_id: str = Field(..., description="Detector identifier")
    detector_type: DetectorType = Field(..., description="Detector type")
    time_min: List[float] = Field(..., description="Time points (min)")
    intensity: List[float] = Field(..., description="Signal intensity")
    
    # Metadata
    sampling_rate_hz: float = Field(..., description="Actual sampling rate (Hz)")
    signal_units: str = Field("counts", description="Signal intensity units")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxTimeSeriesData(BaseModel):
    """Time-series data for method parameters"""
    
    series_id: str = Field(..., description="Series identifier")
    parameter_name: str = Field(..., description="Parameter name")
    time_min: List[float] = Field(..., description="Time points (min)")
    values: List[float] = Field(..., description="Parameter values")
    units: str = Field(..., description="Parameter units")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxValveEvent(BaseModel):
    """Valve state change event"""
    
    valve_id: str = Field(..., description="Valve identifier")
    time_min: float = Field(..., description="Event time (min)")
    state: ValveState = Field(..., description="New valve state")
    duration_min: float = Field(..., description="Duration in this state (min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxPeakKPIs(BaseModel):
    """Key performance indicators for individual peaks"""
    
    peak_number: int = Field(..., ge=1, description="Peak number")
    analyte_name: str = Field(..., description="Analyte name")
    
    # Retention characteristics
    retention_time_min: float = Field(..., description="Retention time (min)")
    peak_width_min: float = Field(..., description="Peak width at base (min)")
    width_at_half_height_min: float = Field(..., description="Peak width at half height (min)")
    
    # Peak shape
    tailing_factor: float = Field(..., description="Peak tailing factor")
    asymmetry_factor: float = Field(..., description="Peak asymmetry factor")
    theoretical_plates: int = Field(..., description="Theoretical plates (efficiency)")
    
    # Quantitative
    peak_area: float = Field(..., description="Peak area")
    peak_height: float = Field(..., description="Peak height")
    area_percent: float = Field(..., description="Area percentage")
    
    # Quality metrics
    signal_to_noise_ratio: float = Field(..., description="Signal-to-noise ratio")
    resolution_from_previous: Optional[float] = Field(None, description="Resolution from previous peak")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxRunKPIs(BaseModel):
    """Overall run performance indicators"""
    
    # Peak statistics
    total_peaks: int = Field(..., description="Total number of peaks")
    peak_kpis: List[SandboxPeakKPIs] = Field(..., description="Individual peak KPIs")
    
    # Chromatographic performance
    average_resolution: float = Field(..., description="Average resolution")
    min_resolution: float = Field(..., description="Minimum resolution")
    average_theoretical_plates: float = Field(..., description="Average theoretical plates")
    
    # Data quality
    average_signal_to_noise: float = Field(..., description="Average S/N ratio")
    baseline_drift_total_percent: float = Field(..., description="Total baseline drift (%)")
    
    # Timing
    actual_run_time_min: float = Field(..., description="Actual run time (min)")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )


class SandboxRunResult(BaseModel):
    """Complete simulation result"""
    
    run_id: str = Field(..., description="Run identifier")
    simulation_timestamp: datetime = Field(default_factory=datetime.now, description="Simulation timestamp")
    
    # Chromatographic data
    chromatograms: List[SandboxChromatogramSeries] = Field(..., description="Chromatogram data per detector")
    
    # Time-series data
    oven_temperature_series: SandboxTimeSeriesData = Field(..., description="Oven temperature vs time")
    flow_series: List[SandboxTimeSeriesData] = Field(..., description="Flow rate time series")
    pressure_series: List[SandboxTimeSeriesData] = Field(..., description="Pressure time series")
    
    # Valve events
    valve_events: List[SandboxValveEvent] = Field(..., description="Valve state timeline")
    
    # Performance metrics
    kpis: SandboxRunKPIs = Field(..., description="Run performance indicators")
    
    # Simulation metadata
    simulation_time_ms: float = Field(..., description="Simulation computation time (ms)")
    simulation_parameters: Dict[str, Any] = Field(default_factory=dict, description="Simulation parameters used")
    
    # Export paths (if requested)
    exported_files: Dict[str, str] = Field(default_factory=dict, description="Paths to exported files")
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True
    )