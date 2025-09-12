"""
AI Features API Endpoints
Provides AI-powered features for GC instrumentation with enhanced capabilities
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import json

from app.services.ai_troubleshooting_service import ai_troubleshooting_service
from app.services.predictive_maintenance_service import predictive_maintenance_service
from app.services.chromatogram_analysis_service import chromatogram_analysis_service
from app.models.schemas import AIResponse

router = APIRouter()

# Request Models
class TroubleshootingRequest(BaseModel):
    problem_description: str
    instrument_type: Optional[str] = None
    detector_type: Optional[str] = None
    symptoms: Optional[List[str]] = None
    recent_changes: Optional[str] = None
    method_parameters: Optional[Dict[str, Any]] = None
    chromatogram_data: Optional[Dict[str, Any]] = None

class MethodOptimizationRequest(BaseModel):
    current_method: Dict[str, Any]
    target_compounds: List[str]
    performance_issues: Optional[List[str]] = None
    chromatogram_data: Optional[Dict[str, Any]] = None

class MaintenancePredictionRequest(BaseModel):
    instrument_data: Dict[str, Any]
    instrument_id: Optional[str] = None

class FleetMaintenanceRequest(BaseModel):
    fleet_data: List[Dict[str, Any]]

class MaintenanceScheduleRequest(BaseModel):
    instrument_id: str
    maintenance_type: str
    scheduled_date: str
    estimated_duration: str
    technician_notes: Optional[str] = None

class ChromatogramAnalysisRequest(BaseModel):
    time_data: List[float]
    intensity_data: List[float]
    compound_names: Optional[List[str]] = None
    method_parameters: Optional[Dict[str, Any]] = None
    analysis_type: str = "comprehensive"

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

class FlashbackInput(BaseModel):
    peak_fronting_factor: float
    first_peak_width_ratio: float
    solvent_expansion_volume_ul: float
    liner_volume_ul: float
    injection_volume_ul: float
    inlet_pressure_psi: float
    purge_time_s: float

class ColumnActivityInput(BaseModel):
    toluene_rt: float
    octanol_rt: float
    toluene_tailing: float
    octanol_tailing: float
    octanol_toluene_ratio: float
    expected_ratio: float = 1.0
    column_age_months: int = 6
    total_injections: int = 1000

class AIFeaturesResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

@router.post("/troubleshooting", response_model=AIFeaturesResponse)
async def get_troubleshooting_advice(request: TroubleshootingRequest):
    """
    Get AI-powered troubleshooting advice for GC problems with enhanced context awareness
    """
    try:
        result = await ai_troubleshooting_service.get_troubleshooting_advice(
            problem_description=request.problem_description,
            instrument_type=request.instrument_type,
            detector_type=request.detector_type,
            symptoms=request.symptoms,
            recent_changes=request.recent_changes,
            method_parameters=request.method_parameters,
            chromatogram_data=request.chromatogram_data
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Troubleshooting failed: {str(e)}")

@router.post("/method-optimization", response_model=AIFeaturesResponse)
async def get_method_optimization_suggestions(request: MethodOptimizationRequest):
    """
    Get AI suggestions for method optimization with enhanced analysis
    """
    try:
        result = await ai_troubleshooting_service.get_method_optimization_suggestions(
            current_method=request.current_method,
            target_compounds=request.target_compounds,
            performance_issues=request.performance_issues,
            chromatogram_data=request.chromatogram_data
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Method optimization failed: {str(e)}")

@router.post("/predictive-maintenance", response_model=AIFeaturesResponse)
async def predict_maintenance(request: MaintenancePredictionRequest):
    """
    Predict maintenance needs for a single instrument with enhanced analysis
    """
    try:
        result = predictive_maintenance_service.predict_maintenance(
            instrument_data=request.instrument_data,
            instrument_id=request.instrument_id
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Maintenance prediction failed: {str(e)}")

@router.post("/fleet-maintenance", response_model=AIFeaturesResponse)
async def predict_fleet_maintenance(request: FleetMaintenanceRequest):
    """
    Predict maintenance for entire fleet with fleet-wide analysis
    """
    try:
        result = predictive_maintenance_service.predict_fleet_maintenance(
            fleet_data=request.fleet_data
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fleet maintenance prediction failed: {str(e)}")

@router.get("/maintenance-alerts")
async def get_maintenance_alerts(days_back: int = 30):
    """
    Get recent maintenance alerts with filtering options
    """
    try:
        result = predictive_maintenance_service.get_maintenance_alerts(days_back=days_back)
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance alerts: {str(e)}")

@router.post("/schedule-maintenance", response_model=AIFeaturesResponse)
async def schedule_maintenance(request: MaintenanceScheduleRequest):
    """
    Schedule maintenance for an instrument
    """
    try:
        result = predictive_maintenance_service.schedule_maintenance(
            instrument_id=request.instrument_id,
            maintenance_type=request.maintenance_type,
            scheduled_date=request.scheduled_date,
            estimated_duration=request.estimated_duration,
            technician_notes=request.technician_notes
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule maintenance: {str(e)}")

@router.get("/maintenance-schedule")
async def get_maintenance_schedule(instrument_id: Optional[str] = None):
    """
    Get maintenance schedule for specific instrument or all instruments
    """
    try:
        result = predictive_maintenance_service.get_maintenance_schedule(instrument_id=instrument_id)
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance schedule: {str(e)}")

@router.post("/chromatogram-analysis", response_model=AIFeaturesResponse)
async def analyze_chromatogram(request: ChromatogramAnalysisRequest):
    """
    Analyze chromatogram data with enhanced diagnostics and recommendations
    """
    try:
        result = await chromatogram_analysis_service.analyze_chromatogram(
            time_data=request.time_data,
            intensity_data=request.intensity_data,
            compound_names=request.compound_names,
            method_parameters=request.method_parameters,
            analysis_type=request.analysis_type
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chromatogram analysis failed: {str(e)}")

@router.post("/update-maintenance-model")
async def update_maintenance_model(
    instrument_data: List[Dict[str, Any]],
    actual_outcomes: List[bool]
):
    """
    Update ML model with new training data
    """
    try:
        result = predictive_maintenance_service.update_model_with_new_data(
            instrument_data=instrument_data,
            actual_outcomes=actual_outcomes
        )
        
        if "error" in result:
            return AIFeaturesResponse(
                success=False,
                error=result["error"],
                timestamp=datetime.now().isoformat()
            )
        
        return AIFeaturesResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model update failed: {str(e)}")

@router.get("/ai-status")
async def get_ai_status():
    """
    Get comprehensive AI features status and capabilities
    """
    try:
        # Get status from all AI services
        troubleshooting_status = await ai_troubleshooting_service.get_ai_status()
        maintenance_status = predictive_maintenance_service.get_service_status()
        chromatogram_status = await chromatogram_analysis_service.get_service_status()
        
        combined_status = {
            "overall_status": "operational",
            "services": {
                "troubleshooting": troubleshooting_status,
                "predictive_maintenance": maintenance_status,
                "chromatogram_analysis": chromatogram_status
            },
            "enhanced_features": {
                "context_aware_troubleshooting": True,
                "fleet_monitoring": True,
                "maintenance_scheduling": True,
                "alert_system": True,
                "enhanced_peak_detection": True,
                "intelligent_diagnostics": True,
                "actionable_recommendations": True
            },
            "capabilities": [
                "multi_instrument_support",
                "real_time_monitoring",
                "predictive_analytics",
                "automated_diagnostics",
                "maintenance_optimization",
                "cost_estimation",
                "quality_assessment"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
        return AIFeaturesResponse(
            success=True,
            data=combined_status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI status: {str(e)}")

@router.get("/troubleshooting-status")
async def get_troubleshooting_status():
    """
    Get AI troubleshooting service status
    """
    try:
        status = await ai_troubleshooting_service.get_ai_status()
        return AIFeaturesResponse(
            success=True,
            data=status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get troubleshooting status: {str(e)}")

@router.get("/maintenance-status")
async def get_maintenance_status():
    """
    Get predictive maintenance service status
    """
    try:
        status = predictive_maintenance_service.get_service_status()
        return AIFeaturesResponse(
            success=True,
            data=status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance status: {str(e)}")

@router.get("/chromatogram-status")
async def get_chromatogram_status():
    """
    Get chromatogram analysis service status
    """
    try:
        status = await chromatogram_analysis_service.get_service_status()
        return AIFeaturesResponse(
            success=True,
            data=status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chromatogram status: {str(e)}") 