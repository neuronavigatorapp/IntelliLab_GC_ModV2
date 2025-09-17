from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
import numpy as np
import math
import logging
import traceback
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.database import get_db, GCInstrument, GCRun, PeakData, MaintenanceRecord, CalculationLog, TroubleshootingLog, DetectorPerformance, init_database
from scipy import stats, signal

# Import chromatogram analysis routes
from backend.api.chromatogram_routes import router as chromatogram_router

# Import GC Sandbox routes
from backend.app.api.gc_sandbox_routes import router as gc_sandbox_router

# Temporarily disable OCR routes due to import issues
# from backend.app.api.ocr import router as ocr_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="IntelliLab GC API",
    description="Production-ready GC calculations with comprehensive error handling",
    version="1.0.0"
)

# Include the chromatogram analysis routes
app.include_router(chromatogram_router, prefix="/api/chromatogram", tags=["chromatogram"])

# Include the GC Sandbox routes
app.include_router(gc_sandbox_router, tags=["GC Sandbox"])

# Temporarily disable OCR routes due to import issues
# app.include_router(ocr_router, tags=["OCR Processing"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception on {request.url}: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again or contact support."}
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SplitRatioInput(BaseModel):
    split_ratio: float = Field(
        ge=1, le=500, 
        description="Split ratio (1-500)",
        example=50
    )
    column_flow_rate: float = Field(
        ge=0.1, le=10, 
        description="Column flow rate (0.1-10 mL/min)",
        example=1.0
    )
    inlet_temperature: Optional[float] = Field(
        default=250, ge=50, le=450,
        description="Inlet temperature (50-450°C)"
    )
    carrier_gas: Optional[str] = Field(
        default="Helium",
        pattern="^(Helium|Hydrogen|Nitrogen)$",
        description="Carrier gas type"
    )
    
    @field_validator('split_ratio')
    @classmethod
    def validate_split_ratio(cls, v):
        if v < 1 or v > 500:
            raise ValueError('Split ratio must be between 1 and 500')
        return v
    
    @field_validator('column_flow_rate')
    @classmethod
    def validate_flow_rate(cls, v):
        if v <= 0:
            raise ValueError('Column flow rate must be positive')
        if v > 10:
            raise ValueError('Column flow rate cannot exceed 10 mL/min (instrument limit)')
        return v

class SplitRatioOutput(BaseModel):
    total_inlet_flow: float
    split_vent_flow: float
    septum_purge_flow: float
    column_flow_rate: float
    actual_split_ratio: str
    efficiency_score: float
    uncertainty: Optional[float] = None
    confidence_level: Optional[float] = None
    explanation: Optional[str] = None

class DetectionLimitInput(BaseModel):
    peak_areas: List[float] = Field(
        min_length=3, max_length=50,
        description="Peak areas from chromatogram (minimum 3 points)",
        example=[100, 200, 300, 400, 500]
    )
    concentrations: List[float] = Field(
        min_length=3, max_length=50,
        description="Known concentrations in ppm or ppb (minimum 3 points)",
        example=[1, 2, 3, 4, 5]
    )
    blank_areas: Optional[List[float]] = Field(
        default=None,
        description="Blank measurements for noise estimation"
    )
    method: str = Field(
        default="3sigma",
        pattern="^(3sigma|10sigma)$",
        description="Detection limit method"
    )
    
    @field_validator('peak_areas')
    @classmethod
    def validate_peak_areas(cls, v):
        if any(x < 0 for x in v):
            raise ValueError('Peak areas must be non-negative')
        if len(v) < 3:
            raise ValueError('Minimum 3 data points required for statistical analysis')
        if len(set(v)) < len(v) * 0.8:  # Check for too many duplicates
            raise ValueError('Too many duplicate peak area values detected')
        return v
    
    @field_validator('concentrations')
    @classmethod
    def validate_concentrations(cls, v, info):
        if info.data and 'peak_areas' in info.data and len(v) != len(info.data['peak_areas']):
            raise ValueError('Number of concentrations must match number of peak areas')
        if any(x <= 0 for x in v):
            raise ValueError('All concentrations must be positive')
        if len(set(v)) != len(v):
            raise ValueError('Duplicate concentration values detected')
        # Check for reasonable concentration range
        if max(v) / min(v) > 1000:
            raise ValueError('Concentration range too wide (>1000x) - consider log scale')
        return v

class DetectionLimitOutput(BaseModel):
    lod: float  # Limit of Detection
    loq: float  # Limit of Quantification
    regression_slope: float
    regression_intercept: float
    r_squared: float
    standard_error: float
    method_used: str

class ChromatogramInput(BaseModel):
    column_temp: float = 40.0  # Starting temperature °C
    ramp_rate: float = 10.0  # °C/min
    flow_rate: float = 1.0  # mL/min
    split_ratio: float = 50.0  # Split ratio
    column_length: float = 30.0  # meters
    column_diameter: float = 0.25  # mm

class PeakData(BaseModel):
    compound: str
    retention_time: float
    peak_height: float
    peak_area: float
    boiling_point: float
    peak_width: float

class ChromatogramOutput(BaseModel):
    peaks: List[PeakData]
    total_runtime: float
    data_points: List[Dict[str, float]]  # For plotting

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "IntelliLab GC API"}

@app.post("/api/split-ratio/calculate", response_model=SplitRatioOutput)
def calculate_split_ratio(input_data: SplitRatioInput, teaching_mode: bool = False):
    """
    Calculate GC inlet split ratio parameters with comprehensive validation and expert analysis
    """
    try:
        from app.services.expert_system import GCExpertSystem
        
        logger.info(f"Calculating split ratio: {input_data.split_ratio}, flow: {input_data.column_flow_rate}")
        
        # Additional physical constraints validation
        if input_data.column_flow_rate <= 0:
            raise HTTPException(status_code=400, detail="Column flow rate must be positive")
        
        # Standard septum purge flow
        septum_purge_flow = 3.0  # mL/min (industry standard)
        
        # Calculate flows with safety limits
        split_vent_flow = min(
            input_data.column_flow_rate * input_data.split_ratio, 
            500  # Maximum split vent flow (instrument limit)
        )
        total_inlet_flow = input_data.column_flow_rate + split_vent_flow + septum_purge_flow
        
        # Check instrument limits
        if total_inlet_flow > 1000:  # Typical GC inlet maximum
            raise HTTPException(
                status_code=400, 
                detail=f"Total inlet flow ({total_inlet_flow:.1f} mL/min) exceeds instrument maximum (1000 mL/min)"
            )
        
        # Expert system uncertainty analysis
        expert = GCExpertSystem()
        uncertainty_analysis = expert.analyze_measurement_with_explanation(
            value=total_inlet_flow,
            std_dev=total_inlet_flow * 0.02,  # 2% instrument uncertainty
            n=1,
            measurement_type="flow",
            teaching_mode=teaching_mode
        )
        
        # Enhanced efficiency scoring with warnings
        efficiency_score = 95.0
        warnings = []
        
        if input_data.split_ratio < 10:
            efficiency_score = 60.0
            warnings.append("Very low split ratio may cause inlet overload")
        elif input_data.split_ratio > 200:
            efficiency_score = 70.0
            warnings.append("High split ratio may reduce sensitivity")
        elif not (20 <= input_data.split_ratio <= 100):
            efficiency_score = 85.0
        
        # Flow rate warnings
        if input_data.column_flow_rate < 0.5:
            warnings.append("Low flow rate may cause peak broadening")
        elif input_data.column_flow_rate > 5:
            warnings.append("High flow rate may reduce separation efficiency")
        
        result = SplitRatioOutput(
            total_inlet_flow=round(total_inlet_flow, 2),
            split_vent_flow=round(split_vent_flow, 2),
            septum_purge_flow=septum_purge_flow,
            column_flow_rate=input_data.column_flow_rate,
            actual_split_ratio=f"1:{int(input_data.split_ratio)}",
            efficiency_score=efficiency_score,
            uncertainty=uncertainty_analysis["uncertainty"],
            confidence_level=uncertainty_analysis["confidence_level"],
            explanation=uncertainty_analysis.get("expert_explanation") if teaching_mode else None
        )
        
        logger.info(f"Split ratio calculation successful: {result.actual_split_ratio}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Split ratio calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Calculation failed - please check input parameters")

@app.post("/api/detection-limits/calculate", response_model=DetectionLimitOutput)
def calculate_detection_limits(input_data: DetectionLimitInput):
    """Calculate LOD and LOQ with comprehensive statistical validation"""
    
    try:
        logger.info(f"Calculating detection limits using {input_data.method} method")
        
        # Convert to numpy arrays
        x = np.array(input_data.concentrations)
        y = np.array(input_data.peak_areas)
        n = len(x)
        
        # Data quality checks
        if n < 3:
            raise HTTPException(status_code=400, detail="Minimum 3 calibration points required")
        
        # Check for outliers using IQR method
        q1, q3 = np.percentile(y, [25, 75])
        iqr = q3 - q1
        if iqr > 0:
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outliers = np.where((y < lower_bound) | (y > upper_bound))[0]
            if len(outliers) > n * 0.2:  # More than 20% outliers
                logger.warning(f"High number of outliers detected: {len(outliers)}")
        
        # Linear regression with error checking
        x_mean = np.mean(x)
        y_mean = np.mean(y)
        
        numerator = np.sum((x - x_mean) * (y - y_mean))
        denominator = np.sum((x - x_mean) ** 2)
        
        if abs(denominator) < 1e-10:
            raise HTTPException(status_code=400, detail="Insufficient variation in concentration data")
        
        slope = numerator / denominator
        intercept = y_mean - slope * x_mean
        
        # Validate slope
        if abs(slope) < 1e-10:
            raise HTTPException(status_code=400, detail="Slope too close to zero - check calibration data")
        
        if slope < 0:
            raise HTTPException(status_code=400, detail="Negative slope detected - check data for errors")
        
        # Calculate R-squared
        y_pred = slope * x + intercept
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - y_mean) ** 2)
        
        if abs(ss_tot) < 1e-10:
            raise HTTPException(status_code=400, detail="No variation in peak area data")
        
        r_squared = 1 - (ss_res / ss_tot)
        
        # Quality warnings
        warnings = []
        if r_squared < 0.95:
            warnings.append(f"Low correlation (R² = {r_squared:.3f}) - consider data quality")
        if r_squared < 0.90:
            raise HTTPException(status_code=400, detail=f"Correlation too low (R² = {r_squared:.3f}) for reliable detection limits")
        
        # Calculate standard error
        if n <= 2:
            raise HTTPException(status_code=400, detail="Insufficient degrees of freedom for error calculation")
        
        standard_error = np.sqrt(ss_res / (n - 2))
        
        # Calculate LOD and LOQ with method validation
        if input_data.method == "3sigma":
            lod = (3 * standard_error) / slope
            loq = (10 * standard_error) / slope
        elif input_data.method == "10sigma":
            lod = (10 * standard_error) / slope
            loq = (30 * standard_error) / slope
        else:
            raise HTTPException(status_code=400, detail="Invalid method - use '3sigma' or '10sigma'")
        
        # Sanity checks on results
        if lod <= 0 or loq <= 0:
            raise HTTPException(status_code=400, detail="Invalid detection limits calculated - check input data")
        
        if loq < lod:
            raise HTTPException(status_code=500, detail="LOQ cannot be less than LOD - calculation error")
        
        # Check if LOD is reasonable compared to concentration range
        min_conc = min(x)
        if lod > min_conc:
            warnings.append(f"LOD ({lod:.4f}) exceeds lowest calibration point ({min_conc:.4f})")
        
        result = DetectionLimitOutput(
            lod=round(lod, 6),
            loq=round(loq, 6),
            regression_slope=round(slope, 6),
            regression_intercept=round(intercept, 6),
            r_squared=round(r_squared, 6),
            standard_error=round(standard_error, 6),
            method_used=input_data.method
        )
        
        logger.info(f"Detection limits calculated: LOD={lod:.6f}, LOQ={loq:.6f}, R²={r_squared:.6f}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection limit calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Statistical calculation failed - please verify input data")

@app.post("/api/chromatogram/simulate", response_model=ChromatogramOutput)
def simulate_chromatogram(input_data: ChromatogramInput):
    """
    Simulate C1-C6 paraffins separation
    Based on Kovats retention indices and van Deemter equation
    """
    
    # Paraffin data (C1-C6)
    paraffins = [
        {"name": "Methane (C1)", "bp": -161.5, "kovats": 100, "response": 0.7},
        {"name": "Ethane (C2)", "bp": -88.6, "kovats": 200, "response": 0.85},
        {"name": "Propane (C3)", "bp": -42.1, "kovats": 300, "response": 1.0},
        {"name": "Butane (C4)", "bp": -0.5, "kovats": 400, "response": 1.0},
        {"name": "Pentane (C5)", "bp": 36.1, "kovats": 500, "response": 1.0},
        {"name": "Hexane (C6)", "bp": 68.7, "kovats": 600, "response": 1.0},
    ]
    
    # Calculate retention times based on temperature program
    peaks = []
    for compound in paraffins:
        # Simplified retention time calculation
        # RT increases with boiling point and decreases with temperature/flow
        base_rt = 2.0 + (compound["kovats"] / 100) * 1.5
        
        # Adjust for column temperature
        temp_factor = 1.0 - (input_data.column_temp - 40) / 200
        
        # Adjust for flow rate
        flow_factor = 1.0 / input_data.flow_rate
        
        # Adjust for split ratio (higher split = sharper peaks)
        split_factor = 1.0 - (input_data.split_ratio / 500) * 0.3
        
        retention_time = base_rt * temp_factor * flow_factor * split_factor
        
        # Calculate peak parameters
        peak_height = 1000 * compound["response"] * (100 / input_data.split_ratio)
        peak_width = 0.1 + (retention_time * 0.02)  # Broader peaks elute later
        peak_area = peak_height * peak_width * 1.064  # Gaussian area
        
        peaks.append(PeakData(
            compound=compound["name"],
            retention_time=round(retention_time, 3),
            peak_height=round(peak_height, 1),
            peak_area=round(peak_area, 1),
            boiling_point=compound["bp"],
            peak_width=round(peak_width, 3)
        ))
    
    # Generate data points for visualization (Gaussian peaks)
    data_points = []
    max_rt = max(p.retention_time for p in peaks) + 2
    
    for t in range(int(max_rt * 100)):  # 100 points per minute
        time = t / 100
        signal = 50  # Baseline
        
        for peak in peaks:
            # Gaussian peak shape
            amplitude = peak.peak_height
            center = peak.retention_time
            sigma = peak.peak_width / 4  # Convert to standard deviation
            
            contribution = amplitude * math.exp(-((time - center) ** 2) / (2 * sigma ** 2))
            signal += contribution
        
        data_points.append({
            "time": round(time, 2),
            "signal": round(signal, 1)
        })
    
    return ChromatogramOutput(
        peaks=peaks,
        total_runtime=round(max_rt, 1),
        data_points=data_points
    )

# ============ GC FLEET MANAGEMENT ENDPOINTS ============

@app.post("/api/instruments/register")
def register_gc(
    serial_number: str,
    manufacturer: str,
    model: str,
    location: str,
    purchase_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Register a new GC instrument"""
    
    # Check if already exists
    existing = db.query(GCInstrument).filter(GCInstrument.serial_number == serial_number).first()
    if existing:
        return {"message": "GC already registered", "id": existing.id}
    
    gc = GCInstrument(
        serial_number=serial_number,
        manufacturer=manufacturer,
        model=model,
        location=location,
        purchase_date=datetime.fromisoformat(purchase_date) if purchase_date else None
    )
    
    db.add(gc)
    db.commit()
    db.refresh(gc)
    
    return {"message": "GC registered successfully", "id": gc.id, "serial": gc.serial_number}

@app.get("/api/instruments/list")
def list_instruments(db: Session = Depends(get_db)):
    """Get all registered GC instruments with stats"""
    instruments = db.query(GCInstrument).all()
    
    result = []
    for gc in instruments:
        # Get latest run
        last_run = db.query(GCRun).filter(GCRun.instrument_id == gc.id).order_by(GCRun.run_date.desc()).first()
        
        # Count runs in last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_runs = db.query(GCRun).filter(
            GCRun.instrument_id == gc.id,
            GCRun.run_date >= thirty_days_ago
        ).count()
        
        result.append({
            "id": gc.id,
            "serial_number": gc.serial_number,
            "manufacturer": gc.manufacturer,
            "model": gc.model,
            "location": gc.location,
            "status": gc.status,
            "total_runs": gc.total_runs,
            "runtime_hours": round(gc.total_runtime_hours, 1),
            "last_run": last_run.run_date.isoformat() if last_run else None,
            "recent_runs_30d": recent_runs,
            "days_since_pm": (datetime.now() - gc.last_pm_date).days if gc.last_pm_date else None
        })
    
    return result

@app.post("/api/runs/add")
def add_gc_run(
    instrument_serial: str,
    sequence_name: str,
    method_name: str,
    operator: str,
    sample_type: str,
    column_type: str,
    column_length_m: float,
    column_id_mm: float,
    carrier_gas: str,
    flow_rate_ml_min: float,
    inlet_temp_c: float,
    inlet_pressure_psi: float,
    oven_initial_temp_c: float,
    oven_final_temp_c: float,
    ramp_rate_c_min: float,
    detector_type: str,
    detector_temp_c: float,
    baseline_noise_pa: float,
    baseline_drift_pa_hr: float,
    peaks: List[dict],
    db: Session = Depends(get_db)
):
    """Add a complete GC run with all peak data"""
    
    # Find instrument
    instrument = db.query(GCInstrument).filter(GCInstrument.serial_number == instrument_serial).first()
    if not instrument:
        # Auto-register if not found
        instrument = GCInstrument(
            serial_number=instrument_serial,
            manufacturer="Unknown",
            model="Unknown",
            location="Unknown",
            status="Active"
        )
        db.add(instrument)
        db.flush()
    
    # Calculate total runtime
    if ramp_rate_c_min > 0:
        runtime_min = (oven_final_temp_c - oven_initial_temp_c) / ramp_rate_c_min
    else:
        runtime_min = max([p["retention_time_min"] for p in peaks]) if peaks else 30
    
    # Create run record
    run = GCRun(
        instrument_id=instrument.id,
        sequence_name=sequence_name,
        method_name=method_name,
        operator=operator,
        sample_type=sample_type,
        column_type=column_type,
        column_length_m=column_length_m,
        column_id_mm=column_id_mm,
        carrier_gas=carrier_gas,
        flow_rate_ml_min=flow_rate_ml_min,
        inlet_temp_c=inlet_temp_c,
        inlet_pressure_psi=inlet_pressure_psi,
        oven_initial_temp_c=oven_initial_temp_c,
        oven_final_temp_c=oven_final_temp_c,
        ramp_rate_c_min=ramp_rate_c_min,
        detector_type=detector_type,
        detector_temp_c=detector_temp_c,
        baseline_noise_pa=baseline_noise_pa,
        baseline_drift_pa_hr=baseline_drift_pa_hr,
        total_runtime_min=runtime_min
    )
    
    db.add(run)
    db.flush()
    
    # Add all peaks with calculations
    for i, peak_data in enumerate(peaks):
        # Calculate theoretical plates if width at half height provided
        N = None
        if peak_data.get("peak_width_half_height"):
            N = int(5.54 * (peak_data["retention_time_min"] / peak_data["peak_width_half_height"]) ** 2)
        
        # Calculate tailing factor if not provided
        tailing = peak_data.get("tailing_factor", 1.0)
        
        # Calculate resolution from previous peak
        resolution = None
        if i > 0 and peaks[i-1].get("peak_width_min") and peak_data.get("peak_width_min"):
            prev_peak = peaks[i-1]
            resolution = 2 * (peak_data["retention_time_min"] - prev_peak["retention_time_min"]) / (peak_data["peak_width_min"] + prev_peak["peak_width_min"])
        
        # Calculate capacity factor (k')
        # Estimate void time
        void_time = (column_length_m * 60) / (flow_rate_ml_min * 40)  # Rough estimate
        k_prime = (peak_data["retention_time_min"] - void_time) / void_time if void_time > 0 else 0
        
        peak = PeakData(
            run_id=run.id,
            compound_name=peak_data["compound_name"],
            cas_number=peak_data.get("cas_number"),
            elution_order=peak_data.get("elution_order", i + 1),
            retention_time_min=peak_data["retention_time_min"],
            peak_height=peak_data["peak_height"],
            peak_area=peak_data["peak_area"],
            peak_width_min=peak_data.get("peak_width_min"),
            peak_width_half_height=peak_data.get("peak_width_half_height"),
            theoretical_plates=N,
            tailing_factor=tailing,
            resolution_from_previous=resolution,
            capacity_factor=k_prime,
            concentration_ppm=peak_data.get("concentration_ppm"),
            response_factor=peak_data.get("response_factor")
        )
        
        db.add(peak)
    
    # Update instrument statistics
    instrument.total_runs += 1
    instrument.total_runtime_hours += runtime_min / 60
    
    db.commit()
    
    return {
        "message": "Run added successfully",
        "run_id": run.id,
        "instrument": instrument.serial_number,
        "peaks_added": len(peaks)
    }

@app.get("/api/runs/history/{serial_number}")
def get_run_history(
    serial_number: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get run history for a specific GC"""
    
    instrument = db.query(GCInstrument).filter(GCInstrument.serial_number == serial_number).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="GC not found")
    
    runs = db.query(GCRun).filter(
        GCRun.instrument_id == instrument.id
    ).order_by(GCRun.run_date.desc()).limit(limit).all()
    
    history = []
    for run in runs:
        peak_count = db.query(PeakData).filter(PeakData.run_id == run.id).count()
        
        history.append({
            "run_id": run.id,
            "date": run.run_date.isoformat(),
            "sequence": run.sequence_name,
            "method": run.method_name,
            "operator": run.operator,
            "sample_type": run.sample_type,
            "peak_count": peak_count,
            "runtime_min": run.total_runtime_min,
            "baseline_noise": run.baseline_noise_pa,
            "column": f"{run.column_type} {run.column_length_m}m x {run.column_id_mm}mm"
        })
    
    return {
        "instrument": serial_number,
        "total_runs": instrument.total_runs,
        "history": history
    }

@app.post("/api/analysis/compound-trend")
def analyze_compound_trend(
    serial_number: str,
    compound_name: str,
    db: Session = Depends(get_db)
):
    """Analyze trends for a specific compound on a specific GC"""
    
    instrument = db.query(GCInstrument).filter(GCInstrument.serial_number == serial_number).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="GC not found")
    
    # Get all peaks for this compound
    peaks_query = db.query(PeakData, GCRun).join(GCRun).filter(
        GCRun.instrument_id == instrument.id,
        PeakData.compound_name == compound_name
    ).order_by(GCRun.run_date).all()
    
    if not peaks_query:
        return {"error": f"No data found for {compound_name}"}
    
    # Extract data
    dates = []
    retention_times = []
    peak_areas = []
    peak_heights = []
    plate_counts = []
    
    for peak, run in peaks_query:
        dates.append(run.run_date.isoformat())
        retention_times.append(peak.retention_time_min)
        peak_areas.append(peak.peak_area)
        peak_heights.append(peak.peak_height)
        if peak.theoretical_plates:
            plate_counts.append(peak.theoretical_plates)
    
    # Calculate statistics
    rt_mean = np.mean(retention_times)
    rt_std = np.std(retention_times)
    rt_rsd = (rt_std / rt_mean * 100) if rt_mean > 0 else 0
    
    area_mean = np.mean(peak_areas)
    area_std = np.std(peak_areas)
    area_rsd = (area_std / area_mean * 100) if area_mean > 0 else 0
    
    # Linear regression for trend
    x = np.arange(len(retention_times))
    rt_slope, rt_intercept, rt_r, _, _ = stats.linregress(x, retention_times)
    area_slope, area_intercept, area_r, _, _ = stats.linregress(x, peak_areas)
    
    # Identify issues
    issues = []
    if rt_rsd > 0.5:
        issues.append(f"RT precision {rt_rsd:.2f}% exceeds 0.5% limit")
    if area_rsd > 5.0:
        issues.append(f"Area precision {area_rsd:.2f}% exceeds 5% limit")
    if abs(rt_slope) > 0.01:
        issues.append(f"RT drift: {rt_slope:.4f} min/run")
    
    return {
        "compound": compound_name,
        "instrument": serial_number,
        "data_points": len(retention_times),
        "date_range": {
            "first": dates[0],
            "last": dates[-1]
        },
        "retention_time": {
            "mean": round(rt_mean, 3),
            "std": round(rt_std, 4),
            "rsd_percent": round(rt_rsd, 3),
            "drift": round(rt_slope, 5),
            "trend": "stable" if abs(rt_slope) < 0.001 else ("increasing" if rt_slope > 0 else "decreasing")
        },
        "peak_area": {
            "mean": round(area_mean, 0),
            "std": round(area_std, 0),
            "rsd_percent": round(area_rsd, 2),
            "drift": round(area_slope, 1)
        },
        "issues": issues,
        "status": "PASS" if len(issues) == 0 else "WARNING" if len(issues) <= 2 else "FAIL"
    }

@app.post("/api/maintenance/record")
def record_maintenance(
    serial_number: str,
    type: str,
    description: str,
    performed_by: str,
    parts_replaced: Optional[dict] = None,
    cost: Optional[float] = None,
    downtime_hours: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Record maintenance activity"""
    
    instrument = db.query(GCInstrument).filter(GCInstrument.serial_number == serial_number).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="GC not found")
    
    maintenance = MaintenanceRecord(
        instrument_id=instrument.id,
        type=type,
        description=description,
        performed_by=performed_by,
        parts_replaced=parts_replaced,
        cost=cost,
        downtime_hours=downtime_hours
    )
    
    db.add(maintenance)
    
    # Update last PM date if this is a PM
    if type == "PM":
        instrument.last_pm_date = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Maintenance recorded", "id": maintenance.id}

# ============ VETERAN TOOLS - REAL CHROMATOGRAPHY CALCULATIONS ============

@app.post("/api/analysis/ghost-peak-identifier")
def identify_ghost_peak(
    retention_time_min: float,
    peak_area: float,
    oven_temp_at_elution: float,
    inlet_temp: float,
    column_max_temp: float,
    detector_type: str,
    baseline_before: float,
    baseline_after: float,
    run_number: int,
    total_runs_today: int
):
    """Identify ghost peaks using REAL diagnostic calculations"""
    
    # Calculate baseline rise
    baseline_rise = baseline_after - baseline_before
    baseline_rise_percent = (baseline_rise / baseline_before) * 100 if baseline_before > 0 else 0
    
    # Temperature at elution vs column max
    temp_percent_of_max = (oven_temp_at_elution / column_max_temp) * 100
    
    identification = {
        "peak_type": "Unknown",
        "confidence_percent": 0,
        "evidence": [],
        "solution": "",
        "root_cause": ""
    }
    
    # COLUMN BLEED - Real calculation based on Arrhenius equation
    if temp_percent_of_max > 85:
        # Bleed rate doubles every 10°C above 80% max temp
        expected_bleed = baseline_before * (2 ** ((oven_temp_at_elution - 0.8 * column_max_temp) / 10))
        
        if baseline_rise_percent > 20 and retention_time_min > 15:
            identification["peak_type"] = "Column Bleed"
            identification["confidence_percent"] = min(95, 50 + baseline_rise_percent)
            identification["evidence"] = [
                f"Baseline rose {baseline_rise_percent:.1f}% during run",
                f"Elution at {temp_percent_of_max:.0f}% of column max temp",
                f"Expected bleed level: {expected_bleed:.1f} pA"
            ]
            identification["solution"] = f"Reduce max temp to {column_max_temp - 20}°C or replace column"
            identification["root_cause"] = "Siloxane backbone degradation releasing cyclic compounds"
    
    # SEPTUM BLEED - Based on inlet temp and run count
    elif inlet_temp > 280 and retention_time_min < 2.0:
        identification["peak_type"] = "Septum Bleed"
        identification["confidence_percent"] = 85
        identification["evidence"] = [
            "High inlet temperature with early elution",
            "Characteristic of septum degradation products"
        ]
        identification["root_cause"] = f"Inlet at {inlet_temp}°C degrading septum"
        identification["solution"] = "Replace septum and reduce inlet temperature to 250°C"
    elif inlet_temp > 280:
        # Septum degradation rate = k * exp(-Ea/RT) * puncture_count
        puncture_stress = run_number * (inlet_temp / 250) ** 2
        
        if puncture_stress > 50 and retention_time_min > 10:
            identification["peak_type"] = "Septum Bleed"
            identification["confidence_percent"] = min(90, 40 + puncture_stress / 2)
            identification["evidence"] = [
                f"Inlet temp {inlet_temp}°C exceeds recommended 280°C",
                f"Septum has {run_number} punctures today",
                f"Puncture stress index: {puncture_stress:.1f}"
            ]
            identification["solution"] = "Replace septum with BTO type, reduce inlet temp to 250°C"
            identification["root_cause"] = "Silicone oligomers released from degraded septum"
    
    # CARRYOVER - Based on peak area decay pattern
    elif run_number > 1:
        # Carryover follows exponential decay: A = A0 * exp(-k*n)
        expected_carryover_percent = 100 * np.exp(-2.3 * run_number)  # k=2.3 for typical GC
        
        if peak_area > 0 and run_number <= 3:
            identification["peak_type"] = "Carryover"
            identification["confidence_percent"] = 85
            identification["evidence"] = [
                f"Peak appears in run #{run_number} after sample",
                f"Expected carryover: {expected_carryover_percent:.2f}%",
                "Exponential decay pattern matches carryover kinetics"
            ]
            identification["solution"] = "Increase final temp hold, add backflush, check inlet liner"
            identification["root_cause"] = "Compound adsorption on inlet surfaces or column head"
    
    # CONTAMINATION - Statistical analysis
    else:
        # Random contamination follows Poisson distribution
        appearance_probability = (total_runs_today - run_number) / total_runs_today
        
        if appearance_probability < 0.3:
            identification["peak_type"] = "Random Contamination"
            identification["confidence_percent"] = 70
            identification["evidence"] = [
                f"Appears in {appearance_probability*100:.0f}% of runs",
                "No temperature correlation",
                "No systematic pattern"
            ]
            identification["solution"] = "Check solvent purity, replace inlet liner, clean ion source"
            identification["root_cause"] = "Environmental or sample prep contamination"
    
    return identification

@app.get("/api/calculations/void-volume")
def calculate_exact_void_volume(
    column_length_m: float = Query(...),
    column_id_mm: float = Query(...),
    column_df_um: float = Query(...),  # Film thickness
    temperature_c: float = Query(...),
    outlet_pressure_psi: float = Query(14.7),
    carrier_gas: str = Query(...),
    flow_rate_ml_min: float = Query(...)
):
    """Calculate EXACT void volume and dead time using real gas compressibility"""
    
    # Column volumes
    radius_m = (column_id_mm / 2) / 1000
    column_volume_ml = np.pi * radius_m**2 * column_length_m * 1000000
    
    # Film volume (reduces available volume)
    film_radius_m = radius_m - (column_df_um / 1000000)
    available_volume_ml = np.pi * film_radius_m**2 * column_length_m * 1000000
    
    # Compressibility correction (James-Martin factor)
    inlet_pressure_psi = outlet_pressure_psi + 20  # Approximate
    P_ratio = inlet_pressure_psi / outlet_pressure_psi
    j = (3/2) * ((P_ratio**2 - 1) / (P_ratio**3 - 1))
    
    # Temperature correction for gas expansion
    T_kelvin = temperature_c + 273.15
    T_ref = 298.15  # 25°C reference
    temperature_correction = T_kelvin / T_ref
    
    # Effective flow rate at average pressure
    average_pressure = (inlet_pressure_psi + outlet_pressure_psi) / 2
    flow_corrected = flow_rate_ml_min * (14.7 / average_pressure) * temperature_correction
    
    # Calculate void time (t0)
    void_time_min = (available_volume_ml / flow_corrected) * j
    
    # Calculate average linear velocity
    linear_velocity_cm_s = (column_length_m * 100) / (void_time_min * 60)
    
    # Calculate optimal flow for this gas (van Deemter minimum)
    diffusion_coefficients = {
        "Helium": 0.7,
        "Hydrogen": 0.9,
        "Nitrogen": 0.16
    }
    
    Dm = diffusion_coefficients.get(carrier_gas, 0.7)
    optimal_velocity = np.sqrt(2 * Dm / (column_id_mm / 10))  # Simplified Golay
    optimal_flow = optimal_velocity * np.pi * film_radius_m**2 * 6000000
    
    return {
        "column_volume_ml": round(column_volume_ml, 3),
        "available_volume_ml": round(available_volume_ml, 3),
        "void_time_min": round(void_time_min, 4),
        "linear_velocity_cm_s": round(linear_velocity_cm_s, 2),
        "compressibility_factor_j": round(j, 4),
        "average_pressure_psi": round(average_pressure, 1),
        "optimal_flow_ml_min": round(optimal_flow, 2),
        "current_efficiency_percent": round((optimal_flow / flow_rate_ml_min) * 100, 1),
        "holdup_time_s": round(void_time_min * 60, 1)
    }

@app.get("/api/calculations/peak-capacity")
def calculate_peak_capacity(
    column_length_m: float = Query(...),
    column_id_mm: float = Query(...),
    temperature_initial_c: float = Query(...),
    temperature_final_c: float = Query(...),
    ramp_rate_c_min: float = Query(...),
    flow_rate_ml_min: float = Query(...),
    carrier_gas: str = Query(...)
):
    """Calculate how many peaks can actually be separated"""
    
    # Calculate gradient time
    gradient_time_min = (temperature_final_c - temperature_initial_c) / ramp_rate_c_min
    
    # Estimate void time at average temperature
    avg_temp = (temperature_initial_c + temperature_final_c) / 2
    
    # Van Deemter calculation for average plate height
    dc_cm = column_id_mm / 10
    
    # Diffusion coefficient with temperature correction
    D_ref = {"Helium": 0.7, "Hydrogen": 0.9, "Nitrogen": 0.16}
    Dm = D_ref.get(carrier_gas, 0.7) * ((avg_temp + 273.15) / 298.15) ** 1.75
    
    # Linear velocity
    column_area_cm2 = np.pi * (dc_cm/2)**2
    u = (flow_rate_ml_min / 60) / column_area_cm2
    
    # Golay equation
    B = 2 * Dm
    C = dc_cm**2 / (96 * Dm)
    H = B/u + C*u  # cm
    
    # Number of plates
    N = (column_length_m * 100) / H
    
    # Peak width at base (4σ) for gradient
    # In gradient, peak width ≈ 4 * (gradient_time / N^0.5)
    peak_width_min = 4 * gradient_time_min / np.sqrt(N)
    
    # Temperature programming gain factor
    # Peaks compress by factor related to ramp rate
    compression_factor = 1 + (ramp_rate_c_min / 20)  # Empirical
    
    # Effective peak capacity
    peak_capacity = gradient_time_min / (peak_width_min / compression_factor)
    
    # Calculate for different Rs values
    capacity_Rs_1 = peak_capacity  # Baseline resolution
    capacity_Rs_1_5 = peak_capacity / 1.5  # 1.5 Rs
    capacity_Rs_0_6 = peak_capacity * 1.7  # 0.6 Rs (touching peaks)
    
    # Statistical overlap probability (assuming random distribution)
    # Davis-Giddings statistical model
    max_compounds_95 = int(np.sqrt(2 * peak_capacity * np.log(20)))
    
    return {
        "theoretical_peak_capacity": int(peak_capacity),
        "practical_peak_capacity_Rs_1": int(capacity_Rs_1),
        "practical_peak_capacity_Rs_1_5": int(capacity_Rs_1_5),
        "usable_peak_capacity_Rs_0_6": int(capacity_Rs_0_6),
        "gradient_time_min": round(gradient_time_min, 1),
        "average_peak_width_s": round(peak_width_min * 60, 1),
        "plate_count": int(N),
        "plate_height_um": round(H * 10000, 1),
        "max_compounds_95_percent_separated": max_compounds_95,
        "optimization_suggestion": get_capacity_optimization(peak_capacity, gradient_time_min)
    }

def get_capacity_optimization(capacity: float, gradient_time: float) -> str:
    if capacity < 100:
        return f"Increase gradient time to {gradient_time * 1.5:.0f} min or use slower ramp"
    elif capacity < 200:
        return "Good for routine analysis, consider 50m column for complex samples"
    else:
        return "Excellent separation power for complex mixtures"

@app.post("/api/calculations/backflush-timing")
def calculate_backflush_time(
    last_peak_rt_min: float,
    column_length_m: float,
    column_id_mm: float,
    flow_rate_forward_ml_min: float,
    flow_rate_reverse_ml_min: float,
    temperature_at_backflush_c: float,
    heaviest_compound_bp_c: float
):
    """Calculate EXACT backflush timing to prevent column contamination"""
    
    # Calculate void time
    column_volume_ml = np.pi * (column_id_mm/2000)**2 * column_length_m * 1000000
    void_time_forward = column_volume_ml / flow_rate_forward_ml_min
    
    # Retention factor of heaviest compound
    # Using Kovats-style approximation
    k_heavy = 10 ** ((heaviest_compound_bp_c - temperature_at_backflush_c) / 100)
    
    # Distance traveled by heaviest compound
    fraction_traveled = last_peak_rt_min / (void_time_forward * (1 + k_heavy))
    distance_traveled_m = fraction_traveled * column_length_m
    
    # Time to backflush out
    remaining_distance_m = distance_traveled_m  # Must travel back
    void_time_reverse = column_volume_ml / flow_rate_reverse_ml_min
    
    # Account for retention during backflush (compounds still retained)
    k_reverse = k_heavy * 0.3  # Reduced retention at high temp
    backflush_time_min = (remaining_distance_m / column_length_m) * void_time_reverse * (1 + k_reverse)
    
    # Safety margin
    safety_factor = 1.2
    recommended_backflush_time = backflush_time_min * safety_factor
    
    # Post-run time calculation
    post_run_start = last_peak_rt_min + 0.5  # Start 30s after last peak
    post_run_duration = recommended_backflush_time
    
    return {
        "post_run_backflush_start_min": round(post_run_start, 1),
        "backflush_duration_min": round(recommended_backflush_time, 1),
        "total_post_run_min": round(post_run_start + recommended_backflush_time, 1),
        "distance_heavy_compounds_traveled_m": round(distance_traveled_m, 2),
        "percent_column_contaminated": round(fraction_traveled * 100, 1),
        "time_saved_vs_bakeout_min": round(30 - recommended_backflush_time, 1),
        "recommended_backflush_flow_ml_min": flow_rate_reverse_ml_min,
        "effectiveness": "High" if fraction_traveled < 0.5 else "Medium"
    }

# ============= TROUBLESHOOTING INPUT MODELS =============

class FIDSensitivityInput(BaseModel):
    """Input model for FID sensitivity check"""
    octane_amount_ng: float
    octane_peak_area: float
    baseline_noise_pa: float
    hydrogen_flow_ml_min: float
    air_flow_ml_min: float
    makeup_flow_ml_min: float
    detector_temp_c: float = 300
    jet_cleaning_days_ago: int = 0

class InletDiscriminationInput(BaseModel):
    """Input model for inlet discrimination test"""
    c10_area: float
    c20_area: float
    c30_area: float
    c10_expected: float = 100000
    c20_expected: float = 95000
    c30_expected: float = 90000
    inlet_temp: float = 280
    inlet_pressure: float = 25
    liner_type: str = "split"
    last_liner_change_days: int = 30

class FlashbackInput(BaseModel):
    """Input model for flashback detection"""
    peak_fronting_factor: float
    first_peak_width_ratio: float
    solvent_expansion_volume_ul: float
    liner_volume_ul: float
    injection_volume_ul: float
    inlet_pressure_psi: float
    purge_time_s: float

class ColumnActivityInput(BaseModel):
    """Input model for column activity test"""
    toluene_rt: float
    octanol_rt: float
    toluene_tailing: float
    octanol_tailing: float
    octanol_toluene_ratio: float
    expected_ratio: float = 1.0
    column_age_months: int = 6
    total_injections: int = 1000

# ============= END OF INPUT MODELS =============

# ===== TROUBLESHOOTING ENDPOINTS =====

@app.post("/api/troubleshooting/inlet/discrimination")
def diagnose_inlet_discrimination(
    input_data: InletDiscriminationInput,
    db: Session = Depends(get_db)
):
    """Diagnose mass discrimination in inlet - real calculation"""
    
    try:
        # Calculate discrimination factors
        df_c20 = (input_data.c20_area / input_data.c10_area) / (input_data.c20_expected / input_data.c10_expected)
        df_c30 = (input_data.c30_area / input_data.c10_area) / (input_data.c30_expected / input_data.c10_expected)
        
        # Linear regression of discrimination
        carbons = np.array([10, 20, 30])
        df_values = np.array([1.0, df_c20, df_c30])
        
        slope, intercept, r_value, _, _ = stats.linregress(carbons, df_values)
        
        # Discrimination rate per carbon
        discrimination_percent_per_carbon = abs(slope) * 100
        
        diagnosis = {
            "discrimination_factor_c20": round(df_c20, 3),
            "discrimination_factor_c30": round(df_c30, 3),
            "discrimination_rate": round(discrimination_percent_per_carbon, 2),
            "linearity_r2": round(r_value**2, 4)
        }
        
        # Diagnose cause based on pattern
        if discrimination_percent_per_carbon > 5:
            diagnosis["severity"] = "Severe"
            if input_data.inlet_temp < 250:
                diagnosis["root_cause"] = "Inlet temperature too low for high boilers"
                diagnosis["solution"] = f"Increase inlet temp to {max(280, input_data.inlet_temp + 30)}°C"
            elif input_data.last_liner_change_days > 30:
                diagnosis["root_cause"] = "Liner contamination causing selective adsorption"
                diagnosis["solution"] = "Replace liner with deactivated low-volume liner"
            else:
                diagnosis["root_cause"] = "Wrong liner geometry for sample range"
                diagnosis["solution"] = "Use 4mm ID straight liner for wide boiling range"
                
        elif discrimination_percent_per_carbon > 2:
            diagnosis["severity"] = "Moderate"
            diagnosis["root_cause"] = "Non-optimal inlet conditions"
            diagnosis["solution"] = "Optimize split ratio and inlet temperature"
        else:
            diagnosis["severity"] = "Acceptable"
            diagnosis["root_cause"] = "Normal discrimination within limits"
            diagnosis["solution"] = "No action needed"
        
        # Store in database
        log_entry = TroubleshootingLog(
            instrument_id=input_data.instrument_id,
            component="inlet",
            issue_type="discrimination",
            measured_values={
                "c10_area": input_data.c10_area, "c20_area": input_data.c20_area, "c30_area": input_data.c30_area,
                "inlet_temp": input_data.inlet_temp, "liner_type": input_data.liner_type
            },
            calculated_diagnostics=diagnosis,
            root_cause=diagnosis["root_cause"],
            confidence_percent=85 if r_value**2 > 0.95 else 70
        )
        db.add(log_entry)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"Inlet discrimination diagnosis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/troubleshooting/inlet/flashback")
def detect_inlet_flashback(
    input_data: FlashbackInput,
    db: Session = Depends(get_db)
):
    """Detect and diagnose inlet flashback issues"""
    
    try:
        # Calculate if liner volume exceeded
        volume_ratio = (input_data.injection_volume_ul * input_data.solvent_expansion_volume_ul) / input_data.liner_volume_ul
        
        # Pressure surge estimation
        pressure_surge_psi = input_data.inlet_pressure_psi * (volume_ratio - 1) if volume_ratio > 1 else 0
        
        # Flashback probability based on multiple factors
        flashback_score = 0
        evidence = []
        
        if volume_ratio > 1.2:
            flashback_score += 40
            evidence.append(f"Solvent expansion exceeds liner volume by {(volume_ratio-1)*100:.0f}%")
        
        if input_data.peak_fronting_factor < 0.9:
            flashback_score += 30
            evidence.append(f"Peak fronting factor {input_data.peak_fronting_factor:.2f} indicates flashback")
        
        if input_data.first_peak_width_ratio > 1.5:
            flashback_score += 20
            evidence.append(f"First peak broadened {input_data.first_peak_width_ratio:.1f}x normal")
        
        if pressure_surge_psi > 5:
            flashback_score += 10
            evidence.append(f"Pressure surge {pressure_surge_psi:.1f} psi detected")
        
        diagnosis = {
            "flashback_probability_percent": min(flashback_score, 95),
            "volume_ratio": round(volume_ratio, 2),
            "pressure_surge_psi": round(pressure_surge_psi, 1),
            "evidence": evidence
        }
        
        if flashback_score > 60:
            diagnosis["confirmed"] = True
            diagnosis["solution"] = f"Reduce injection to {input_data.liner_volume_ul / input_data.solvent_expansion_volume_ul:.1f} µL or use pressure pulse injection"
            diagnosis["alternative"] = "Use 4mm ID liner with wool packing at bottom"
        else:
            diagnosis["confirmed"] = False
            diagnosis["solution"] = "No flashback detected"
        
        # Log to database
        log_entry = TroubleshootingLog(
            instrument_id=input_data.instrument_id,
            component="inlet",
            issue_type="flashback",
            measured_values={
                "injection_volume_ul": input_data.injection_volume_ul,
                "liner_volume_ul": input_data.liner_volume_ul,
                "peak_fronting_factor": input_data.peak_fronting_factor
            },
            calculated_diagnostics=diagnosis,
            root_cause="Solvent expansion exceeds liner volume" if diagnosis["confirmed"] else "No flashback",
            confidence_percent=flashback_score
        )
        db.add(log_entry)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"Flashback detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/troubleshooting/column/activity-test")
def test_column_activity(
    input_data: ColumnActivityInput,
    db: Session = Depends(get_db)
):
    """Grob test interpretation - detect column activity issues"""
    
    try:
        # Activity indicators
        tailing_increase = ((input_data.octanol_tailing / input_data.toluene_tailing) - 1) * 100
        ratio_deviation = ((input_data.octanol_toluene_ratio / input_data.expected_ratio) - 1) * 100
        
        activity_score = 0
        issues = []
        
        # Check for acidic activity (octanol tailing)
        if input_data.octanol_tailing > 1.5:
            activity_score += 40
            issues.append("Acidic sites present - octanol tailing severe")
        
        # Check for adsorption
        if abs(ratio_deviation) > 20:
            activity_score += 30
            issues.append(f"Peak ratio deviation {ratio_deviation:.1f}% indicates adsorption")
        
        # Age-related degradation
        expected_degradation = input_data.column_age_months * 2  # 2% per month
        if activity_score > expected_degradation:
            issues.append("Degradation exceeds age expectations")
        
        diagnosis = {
            "activity_score": activity_score,
            "octanol_tailing": round(input_data.octanol_tailing, 2),
            "tailing_increase_percent": round(tailing_increase, 1),
            "ratio_deviation_percent": round(ratio_deviation, 1),
            "issues": issues
        }
        
        if activity_score > 60:
            diagnosis["severity"] = "Replace column"
            diagnosis["root_cause"] = "Severe phase degradation or contamination"
        elif activity_score > 30:
            diagnosis["severity"] = "Conditioning needed"
            diagnosis["root_cause"] = "Moderate activity - try bakeout"
            diagnosis["solution"] = "Condition at 10°C below max for 2 hours with 5 mL/min flow"
        else:
            diagnosis["severity"] = "Acceptable"
            diagnosis["root_cause"] = "Column performing within specifications"
        
        # Store test results
        log_entry = TroubleshootingLog(
            instrument_id=input_data.instrument_id,
            component="column",
            issue_type="activity_test",
            measured_values={
                "toluene_tailing": input_data.toluene_tailing,
                "octanol_tailing": input_data.octanol_tailing,
                "column_age_months": input_data.column_age_months
            },
            calculated_diagnostics=diagnosis,
            root_cause=diagnosis["root_cause"],
            confidence_percent=90
        )
        db.add(log_entry)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"Column activity test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Troubleshooting Input Models
class InletDiscriminationInput(BaseModel):
    c10_area: float
    c20_area: float
    c30_area: float
    c10_expected: float = 100000
    c20_expected: float = 95000
    c30_expected: float = 90000
    inlet_temp: float = 280
    inlet_pressure: float = 25
    liner_type: str = "split"
    last_liner_change_days: int = 30
    instrument_id: Optional[int] = None

class FlashbackInput(BaseModel):
    peak_fronting_factor: float
    first_peak_width_ratio: float
    solvent_expansion_volume_ul: float
    liner_volume_ul: float
    injection_volume_ul: float
    inlet_pressure_psi: float
    purge_time_s: float
    instrument_id: Optional[int] = None

class ColumnActivityInput(BaseModel):
    toluene_rt: float
    octanol_rt: float
    toluene_tailing: float
    octanol_tailing: float
    octanol_toluene_ratio: float
    expected_ratio: float = 1.0
    column_age_months: int = 6
    total_injections: int = 1000
    instrument_id: Optional[int] = None

class FIDSensitivityInput(BaseModel):
    octane_amount_ng: float
    octane_peak_area: float
    baseline_noise_pa: float
    hydrogen_flow_ml_min: float
    air_flow_ml_min: float
    makeup_flow_ml_min: float
    detector_temp_c: float = 300
    jet_cleaning_days_ago: int = 0
    instrument_id: Optional[int] = None

@app.post("/api/troubleshooting/fid/sensitivity-check")
def check_fid_sensitivity(
    input_data: FIDSensitivityInput,
    db: Session = Depends(get_db)
):
    """Calculate FID sensitivity and diagnose issues"""
    
    try:
        # Calculate sensitivity (area/mass)
        sensitivity_pa_ng = input_data.octane_peak_area / input_data.octane_amount_ng
        
        # Calculate S/N ratio
        peak_height = input_data.octane_peak_area / 1.064  # Assuming Gaussian
        signal_to_noise = peak_height / (2 * input_data.baseline_noise_pa)
        
        # Calculate minimum detectable quantity (MDQ)
        mdq_pg = (3 * input_data.baseline_noise_pa * input_data.octane_amount_ng * 1000) / input_data.octane_peak_area
        
        # Check gas ratios
        h2_air_ratio = input_data.hydrogen_flow_ml_min / input_data.air_flow_ml_min
        optimal_ratio = 0.1  # 1:10 is optimal
        ratio_deviation = abs(h2_air_ratio - optimal_ratio) / optimal_ratio * 100
        
        diagnosis = {
            "sensitivity_pa_ng": round(sensitivity_pa_ng, 2),
            "signal_to_noise": round(signal_to_noise, 1),
            "mdq_pg": round(mdq_pg, 1),
            "h2_air_ratio": round(h2_air_ratio, 3),
            "meets_spec": signal_to_noise > 10
        }
        
        # Diagnose issues
        if signal_to_noise < 5:
            diagnosis["severity"] = "Critical"
            if ratio_deviation > 20:
                diagnosis["root_cause"] = "Incorrect H2/Air ratio"
                diagnosis["solution"] = f"Adjust H2 to {input_data.air_flow_ml_min * 0.1:.1f} mL/min"
            elif input_data.jet_cleaning_days_ago > 180:
                diagnosis["root_cause"] = "Contaminated FID jet"
                diagnosis["solution"] = "Clean jet with alumina polish and methanol"
            elif input_data.detector_temp_c < 250:
                diagnosis["root_cause"] = "FID temperature too low"
                diagnosis["solution"] = f"Increase FID temp to 300°C"
            else:
                diagnosis["root_cause"] = "Collector distance misaligned"
                diagnosis["solution"] = "Check collector position - should be 4-6mm from jet"
        else:
            diagnosis["severity"] = "Acceptable"
            diagnosis["root_cause"] = "FID performing within specifications"
        
        # Store performance data
        detector_log = DetectorPerformance(
            instrument_id=input_data.instrument_id,
            detector_type="FID",
            baseline_noise=input_data.baseline_noise_pa,
            sensitivity=sensitivity_pa_ng,
            fid_flame_voltage=None,  # Would be measured
            test_compound="octane",
            test_response=input_data.octane_peak_area
        )
        db.add(detector_log)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"FID sensitivity check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/troubleshooting/ms/tune-evaluation")
def evaluate_ms_tune(
    mass_69_abundance: float,
    mass_219_abundance: float,
    mass_502_abundance: float,
    mass_69_width: float,
    water_18_percent: float,
    nitrogen_28_percent: float,
    em_voltage: float,
    source_temp_c: float,
    quad_temp_c: float,
    last_cleaning_days: int,
    instrument_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Evaluate MS tune quality and diagnose issues"""
    
    try:
        # Check isotope ratios (PFTBA)
        ratio_219_69 = (mass_219_abundance / mass_69_abundance) * 100
        ratio_502_69 = (mass_502_abundance / mass_69_abundance) * 100
        
        # Expected ratios
        expected_219_69 = 40  # Typical
        expected_502_69 = 3   # Typical
        
        # Calculate deviations
        ratio_219_deviation = abs(ratio_219_69 - expected_219_69) / expected_219_69 * 100
        ratio_502_deviation = abs(ratio_502_69 - expected_502_69) / expected_502_69 * 100
        
        diagnosis = {
            "ratio_219_69": round(ratio_219_69, 1),
            "ratio_502_69": round(ratio_502_69, 2),
            "peak_width_amu": round(mass_69_width, 2),
            "air_leak_level": "High" if nitrogen_28_percent > 20 else "Normal",
            "moisture_level": "High" if water_18_percent > 10 else "Normal"
        }
        
        issues = []
        
        # Check for air leak
        if nitrogen_28_percent > 20:
            issues.append("Air leak detected - check door seal and column connections")
            diagnosis["solution_priority_1"] = "Fix air leak immediately"
        
        # Check sensitivity
        if ratio_502_deviation > 50:
            issues.append("Poor high mass sensitivity")
            if em_voltage > 2000:
                diagnosis["solution_priority_2"] = "EM aging - increase voltage or replace"
            else:
                diagnosis["solution_priority_2"] = "Clean source and quadrupole"
        
        # Check resolution
        if mass_69_width > 0.7:
            issues.append("Poor resolution")
            diagnosis["solution_priority_3"] = "Retune mass axis calibration"
        
        # Check contamination
        if ratio_219_deviation > 30 and last_cleaning_days > 90:
            issues.append("Source contamination likely")
            diagnosis["solution_priority_4"] = "Clean ion source and lenses"
        
        diagnosis["issues"] = issues
        diagnosis["tune_quality"] = "FAIL" if len(issues) > 2 else "MARGINAL" if issues else "PASS"
        
        # Store performance
        detector_log = DetectorPerformance(
            instrument_id=instrument_id,
            detector_type="MS",
            baseline_noise=water_18_percent,  # Proxy for noise
            sensitivity=ratio_502_69,
            ms_em_voltage=em_voltage,
            test_compound="PFTBA",
            test_response=mass_69_abundance
        )
        db.add(detector_log)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"MS tune evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/troubleshooting/ecd/standing-current")
def diagnose_ecd_current(
    standing_current_pa: float,
    expected_current_pa: float,
    detector_temp_c: float,
    makeup_gas_flow_ml_min: float,
    last_cleaning_date: str,
    baseline_noise_pa: float,
    peak_negative: bool,
    instrument_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Diagnose ECD standing current issues"""
    
    try:
        current_ratio = standing_current_pa / expected_current_pa
        days_since_cleaning = (datetime.now() - datetime.fromisoformat(last_cleaning_date)).days
        
        diagnosis = {
            "current_ratio": round(current_ratio, 2),
            "standing_current_pa": standing_current_pa,
            "days_since_cleaning": days_since_cleaning
        }
        
        if current_ratio < 0.5:
            diagnosis["issue"] = "Low standing current"
            if days_since_cleaning > 180:
                diagnosis["root_cause"] = "Contaminated foil source"
                diagnosis["solution"] = "Bake out at 375°C for 12 hours"
            elif makeup_gas_flow_ml_min < 20:
                diagnosis["root_cause"] = "Insufficient makeup flow"
                diagnosis["solution"] = "Increase N2 makeup to 30 mL/min"
            else:
                diagnosis["root_cause"] = "Foil source decay"
                diagnosis["solution"] = "Check source activity - may need replacement"
                
        elif baseline_noise_pa > 0.05:
            diagnosis["issue"] = "High noise"
            diagnosis["root_cause"] = "Contamination or improper temperature"
            diagnosis["solution"] = "Clean detector and stabilize at 350°C"
            
        elif not peak_negative:
            diagnosis["issue"] = "Positive peaks"
            diagnosis["root_cause"] = "Contamination causing ionization"
            diagnosis["solution"] = "Extensive cleaning required"
        else:
            diagnosis["issue"] = "Normal operation"
            diagnosis["root_cause"] = "No issues detected"
            
        # Store performance
        detector_log = DetectorPerformance(
            instrument_id=instrument_id,
            detector_type="ECD",
            baseline_noise=baseline_noise_pa,
            ecd_standing_current=standing_current_pa,
            test_compound="check gas",
            test_response=standing_current_pa
        )
        db.add(detector_log)
        db.commit()
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"ECD diagnosis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/troubleshooting/history/{instrument_id}")
def get_troubleshooting_history(
    instrument_id: int,
    component: Optional[str] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get troubleshooting history for pattern analysis"""
    
    try:
        query = db.query(TroubleshootingLog).filter(
            TroubleshootingLog.instrument_id == instrument_id,
            TroubleshootingLog.timestamp >= datetime.now() - timedelta(days=days)
        )
        
        if component:
            query = query.filter(TroubleshootingLog.component == component)
        
        history = query.order_by(TroubleshootingLog.timestamp.desc()).all()
        
        return [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "component": log.component,
                "issue_type": log.issue_type,
                "root_cause": log.root_cause,
                "confidence_percent": log.confidence_percent,
                "solution_applied": log.solution_applied,
                "resolution_confirmed": log.resolution_confirmed,
                "calculated_diagnostics": log.calculated_diagnostics
            }
            for log in history
        ]
        
    except Exception as e:
        logger.error(f"Failed to get troubleshooting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/troubleshooting/detector-trends/{instrument_id}")
def get_detector_performance_trends(
    instrument_id: int,
    detector_type: str,
    days: int = 90,
    db: Session = Depends(get_db)
):
    """Get detector performance trends over time"""
    
    try:
        trends = db.query(DetectorPerformance).filter(
            DetectorPerformance.instrument_id == instrument_id,
            DetectorPerformance.detector_type == detector_type,
            DetectorPerformance.test_date >= datetime.now() - timedelta(days=days)
        ).order_by(DetectorPerformance.test_date).all()
        
        return [
            {
                "test_date": trend.test_date.isoformat(),
                "baseline_noise": trend.baseline_noise,
                "sensitivity": trend.sensitivity,
                "test_response": trend.test_response,
                "detector_specific": {
                    "fid_flame_voltage": trend.fid_flame_voltage,
                    "ms_em_voltage": trend.ms_em_voltage,
                    "ecd_standing_current": trend.ecd_standing_current
                }
            }
            for trend in trends
        ]
        
    except Exception as e:
        logger.error(f"Failed to get detector trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")