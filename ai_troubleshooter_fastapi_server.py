#!/usr/bin/env python3
"""
FastAPI Server for AI Troubleshooter System
Complete web API for OCR-to-AI troubleshooting pipeline
"""

import sys
import os
from pathlib import Path
import uvicorn
import logging
from contextlib import asynccontextmanager

# Add backend to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

# Import our services
try:
    from app.models.schemas import (
        TroubleshooterRequest, TroubleshooterResponse, ChromatogramData,
        OCRProcessingResult, AITroubleshooterHealth, Peak, MethodParameters
    )
    from app.services.ai_troubleshooter import AITroubleshooterEngine
    from app.services.ocr_ai_bridge import get_ai_integration_service
    
    SERVICES_AVAILABLE = True
    print("✅ All AI troubleshooter services imported successfully")
    
except ImportError as e:
    print(f"⚠️  Import error: {e}")
    SERVICES_AVAILABLE = False


# Global service instances
ai_engine = None
ocr_bridge = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ai_engine, ocr_bridge
    
    print("🚀 Starting AI Troubleshooter FastAPI Server...")
    
    if SERVICES_AVAILABLE:
        try:
            # Initialize services
            ai_engine = AITroubleshooterEngine()
            ocr_bridge = get_ai_integration_service()
            print("✅ AI Troubleshooter services initialized")
        except Exception as e:
            print(f"⚠️  Service initialization failed: {e}")
            ai_engine = None
            ocr_bridge = None
    
    yield
    
    print("🛑 Shutting down AI Troubleshooter server...")


# Create FastAPI app
app = FastAPI(
    title="AI Troubleshooter System",
    description="Intelligent GC-MS troubleshooting with OCR integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mock authentication for development
def get_current_user():
    """Mock authentication - replace with real auth in production"""
    return {"username": "test_user", "experience_level": "intermediate"}


# =================== HEALTH & STATUS ENDPOINTS ===================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Troubleshooter System",
        "version": "1.0.0",
        "status": "online",
        "services_available": SERVICES_AVAILABLE,
        "timestamp": datetime.utcnow()
    }


@app.get("/health")
async def health_check():
    """System health check"""
    
    if not SERVICES_AVAILABLE or not ai_engine:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": "AI services not available",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    try:
        health = ai_engine.get_health_status()
        return {
            "status": "healthy",
            "ai_engine": {
                "service_status": health.service_status,
                "knowledge_base_entries": health.knowledge_base_entries,
                "model_version": health.model_version,
                "total_analyses": health.total_analyses,
                "success_rate": health.success_rate
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded", 
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# =================== AI ANALYSIS ENDPOINTS ===================

@app.post("/api/troubleshooter/analyze")
async def analyze_chromatogram(
    request_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform comprehensive AI troubleshooting analysis
    
    Accepts chromatogram data and performs intelligent diagnosis with recommendations.
    """
    
    if not SERVICES_AVAILABLE or not ai_engine:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    try:
        # Convert dict to TroubleshooterRequest-like object
        request = create_troubleshooter_request_from_dict(request_data)
        
        # Perform analysis
        response = await ai_engine.analyze_chromatogram(request)
        
        # Convert response to dict for JSON serialization
        result = {
            "request_id": getattr(request, 'request_id', 'unknown'),
            "status": response.status if hasattr(response, 'status') else "completed",
            "diagnostic_result": format_diagnostic_result(response.diagnostic_result) if hasattr(response, 'diagnostic_result') else None,
            "recommendations": format_recommendations(response.recommendations) if hasattr(response, 'recommendations') else [],
            "processing_time": getattr(response, 'processing_time', 0.0),
            "metadata": getattr(response, 'metadata', {}),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log analysis
        background_tasks.add_task(
            log_analysis,
            getattr(request, 'request_id', 'unknown'),
            current_user.get("username"),
            result["status"]
        )
        
        return result
        
    except Exception as e:
        logging.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/troubleshooter/analyze-ocr")
async def analyze_from_ocr(
    ocr_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Perform AI analysis directly from OCR-extracted data
    
    Automatically converts OCR data to chromatogram format and analyzes.
    """
    
    if not SERVICES_AVAILABLE or not ai_engine or not ocr_bridge:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    try:
        # Create OCR result object from dict
        ocr_result = create_ocr_result_from_dict(ocr_data)
        
        # Validate OCR data
        validation = ocr_bridge.validate_ocr_for_ai_processing(ocr_result)
        
        if not validation.get("is_suitable_for_ai", False):
            return JSONResponse(
                status_code=422,
                content={
                    "error": "OCR data not suitable for analysis",
                    "issues": validation.get("issues", []),
                    "recommendations": validation.get("recommendations", [])
                }
            )
        
        # Transform OCR to chromatogram data
        chromatogram_data = ocr_bridge.transform_ocr_to_chromatogram_data(ocr_result)
        
        # Create analysis request
        request = create_troubleshooter_request_with_chromatogram_data(chromatogram_data)
        
        # Perform analysis
        response = await ai_engine.analyze_chromatogram(request)
        
        # Format response
        result = {
            "request_id": getattr(request, 'request_id', 'ocr_analysis'),
            "status": response.status if hasattr(response, 'status') else "completed",
            "ocr_validation": validation,
            "diagnostic_result": format_diagnostic_result(response.diagnostic_result) if hasattr(response, 'diagnostic_result') else None,
            "recommendations": format_recommendations(response.recommendations) if hasattr(response, 'recommendations') else [],
            "processing_time": getattr(response, 'processing_time', 0.0),
            "source": "ocr_integration",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return result
        
    except Exception as e:
        logging.error(f"OCR analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR analysis failed: {str(e)}")


@app.post("/api/troubleshooter/validate-data")
async def validate_analysis_data(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Validate chromatogram or OCR data quality for analysis
    """
    
    try:
        validation_result = {
            "data_quality_score": 0.8,  # Mock score
            "quality_level": "Good",
            "analysis_feasible": True,
            "recommendations": ["Data appears suitable for comprehensive analysis"],
            "validated_at": datetime.utcnow().isoformat()
        }
        
        # Basic validation
        if "chromatogram_data" in data:
            chromatogram_data = data["chromatogram_data"]
            peaks = chromatogram_data.get("peaks", [])
            
            if not peaks:
                validation_result["analysis_feasible"] = False
                validation_result["recommendations"] = ["No peak data available - analysis not possible"]
                validation_result["quality_level"] = "Insufficient"
                validation_result["data_quality_score"] = 0.1
            
        elif "ocr_data" in data:
            if ocr_bridge:
                ocr_result = create_ocr_result_from_dict(data["ocr_data"])
                validation = ocr_bridge.validate_ocr_for_ai_processing(ocr_result)
                validation_result = {
                    **validation,
                    "validated_at": datetime.utcnow().isoformat()
                }
        
        return validation_result
        
    except Exception as e:
        logging.error(f"Data validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data validation failed: {str(e)}")


# =================== KNOWLEDGE BASE ENDPOINTS ===================

@app.get("/api/troubleshooter/knowledge-base/statistics")
async def get_knowledge_base_statistics(current_user: dict = Depends(get_current_user)):
    """Get knowledge base statistics"""
    
    if not SERVICES_AVAILABLE or not ai_engine:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    try:
        kb = ai_engine.knowledge_base
        stats = kb.get_statistics()
        
        return {
            "knowledge_base": stats,
            "service_stats": {
                "total_analyses": ai_engine.total_analyses,
                "success_rate": ai_engine.successful_analyses / max(1, ai_engine.total_analyses),
                "model_version": ai_engine.model_version
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"KB statistics failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KB statistics failed: {str(e)}")


@app.get("/api/troubleshooter/knowledge-base/entries")
async def get_knowledge_base_entries(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get knowledge base entries"""
    
    if not SERVICES_AVAILABLE or not ai_engine:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    try:
        kb = ai_engine.knowledge_base
        
        if category:
            solutions = kb.get_solutions_by_category(category)
        else:
            solutions = list(kb.solutions.values())
        
        # Format solutions for JSON response
        entries = []
        for solution in solutions:
            entry = {
                "title": solution.title,
                "category": solution.category,
                "description": solution.description,
                "expected_impact": solution.expected_impact,
                "implementation_difficulty": solution.implementation_difficulty,
                "parameters_to_check": solution.parameters_to_check
            }
            entries.append(entry)
        
        return {
            "entries": entries,
            "total_count": len(entries),
            "category_filter": category,
            "retrieved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logging.error(f"KB entries query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KB entries query failed: {str(e)}")


# =================== UTILITY ENDPOINTS ===================

@app.get("/api/troubleshooter/demo")
async def run_demo_analysis():
    """Run a demonstration analysis"""
    
    if not SERVICES_AVAILABLE or not ai_engine:
        raise HTTPException(status_code=503, detail="AI services not available")
    
    # Create demo data
    demo_data = {
        "request_id": f"demo_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "chromatogram_data": {
            "file_path": "demo_sample.d",
            "sample_name": "Demo Aromatics Standard",
            "method_name": "Demo Method",
            "injection_date": datetime.utcnow().isoformat(),
            "peaks": [
                {
                    "retention_time": 2.15,
                    "area": 850000.0,
                    "height": 95000.0,
                    "width": 0.12,
                    "name": "Benzene"
                },
                {
                    "retention_time": 7.23,
                    "area": 980000.0,
                    "height": 75000.0,
                    "width": 0.35,
                    "name": "Ethylbenzene"
                }
            ],
            "peak_count": 2,
            "total_area": 1830000.0,
            "baseline_noise": 250.0,
            "signal_to_noise_ratio": 12.0
        },
        "analysis_type": "comprehensive"
    }
    
    return await analyze_chromatogram(demo_data, BackgroundTasks(), get_current_user())


# =================== HELPER FUNCTIONS ===================

def create_troubleshooter_request_from_dict(data: Dict[str, Any]):
    """Create troubleshooter request from dictionary"""
    
    from types import SimpleNamespace
    
    # Create chromatogram data if provided
    chromatogram_data = None
    if "chromatogram_data" in data:
        cd = data["chromatogram_data"]
        
        # Convert peaks
        peaks = []
        for peak_data in cd.get("peaks", []):
            peak = SimpleNamespace(
                retention_time=peak_data.get("retention_time"),
                area=peak_data.get("area"),
                height=peak_data.get("height"),
                width=peak_data.get("width", 0.15),
                name=peak_data.get("name", "Unknown"),
                confidence_score=peak_data.get("confidence_score", 0.8)
            )
            peaks.append(peak)
        
        # Convert method parameters
        method_params = None
        if "method_parameters" in cd:
            mp = cd["method_parameters"]
            method_params = SimpleNamespace(
                inlet_temperature=mp.get("inlet_temperature"),
                column_temperature=mp.get("column_temperature"),
                carrier_gas_flow=mp.get("carrier_gas_flow"),
                injection_volume=mp.get("injection_volume")
            )
        
        chromatogram_data = SimpleNamespace(
            file_path=cd.get("file_path", "unknown.d"),
            sample_name=cd.get("sample_name", "Unknown Sample"),
            method_name=cd.get("method_name", "Unknown Method"),
            injection_date=datetime.fromisoformat(cd.get("injection_date", datetime.utcnow().isoformat())),
            peaks=peaks,
            peak_count=len(peaks),
            total_area=cd.get("total_area", 0.0),
            baseline_noise=cd.get("baseline_noise", 0.0),
            signal_to_noise_ratio=cd.get("signal_to_noise_ratio", 0.0),
            method_parameters=method_params,
            metadata=cd.get("metadata", {})
        )
    
    # Create request
    request = SimpleNamespace(
        request_id=data.get("request_id", f"req_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
        chromatogram_data=chromatogram_data,
        analysis_type=data.get("analysis_type", "comprehensive"),
        sensitivity_level=data.get("sensitivity_level", "medium"),
        include_solutions=data.get("include_solutions", True),
        user_context=data.get("user_context", {})
    )
    
    return request


def create_troubleshooter_request_with_chromatogram_data(chromatogram_data):
    """Create troubleshooter request with chromatogram data"""
    
    from types import SimpleNamespace
    
    return SimpleNamespace(
        request_id=f"ocr_req_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        chromatogram_data=chromatogram_data,
        analysis_type="comprehensive",
        sensitivity_level="medium", 
        include_solutions=True,
        user_context={"source": "ocr_integration"}
    )


def create_ocr_result_from_dict(data: Dict[str, Any]):
    """Create OCR result from dictionary"""
    
    from types import SimpleNamespace
    
    # Convert peaks data
    peaks_data = []
    for peak_dict in data.get("peaks_data", []):
        peak = SimpleNamespace(
            peak_number=peak_dict.get("peak_number"),
            retention_time=peak_dict.get("retention_time"),
            area=peak_dict.get("area"),
            height=peak_dict.get("height"),
            area_percent=peak_dict.get("area_percent"),
            compound_name=peak_dict.get("compound_name"),
            confidence=peak_dict.get("confidence", 0.8)
        )
        peaks_data.append(peak)
    
    # Convert sample info
    sample_info = None
    if "sample_info" in data:
        si = data["sample_info"]
        sample_info = SimpleNamespace(
            sample_name=si.get("sample_name"),
            operator=si.get("operator"),
            injection_date=si.get("injection_date")
        )
    
    return SimpleNamespace(
        success=data.get("success", True),
        confidence_score=data.get("confidence_score", 0.8),
        peaks_data=peaks_data,
        sample_info=sample_info,
        processing_metadata=data.get("processing_metadata", {})
    )


def format_diagnostic_result(diagnostic_result):
    """Format diagnostic result for JSON response"""
    
    if not diagnostic_result:
        return None
    
    issues = []
    if hasattr(diagnostic_result, 'issues'):
        for issue in diagnostic_result.issues:
            issue_dict = {
                "category": getattr(issue, 'category', 'unknown'),
                "severity": getattr(issue, 'severity', 'unknown'),
                "description": getattr(issue, 'description', ''),
                "confidence": getattr(issue, 'confidence', 0.0),
                "affected_peaks": getattr(issue, 'affected_peaks', [])
            }
            issues.append(issue_dict)
    
    return {
        "overall_score": getattr(diagnostic_result, 'overall_score', 0.0),
        "issues": issues,
        "critical_issues_count": getattr(diagnostic_result, 'critical_issues_count', 0),
        "major_issues_count": getattr(diagnostic_result, 'major_issues_count', 0),
        "minor_issues_count": getattr(diagnostic_result, 'minor_issues_count', 0)
    }


def format_recommendations(recommendations):
    """Format recommendations for JSON response"""
    
    if not recommendations:
        return []
    
    formatted = []
    for rec in recommendations:
        rec_dict = {
            "solution": {
                "title": getattr(rec.solution, 'title', ''),
                "description": getattr(rec.solution, 'description', ''),
                "category": getattr(rec.solution, 'category', ''),
                "expected_impact": getattr(rec.solution, 'expected_impact', '')
            },
            "priority_score": getattr(rec, 'priority_score', 0.0),
            "implementation_difficulty": getattr(rec, 'implementation_difficulty', ''),
            "expected_impact": getattr(rec, 'expected_impact', '')
        }
        
        if hasattr(rec, 'immediate_actions'):
            rec_dict["immediate_actions"] = rec.immediate_actions
        
        formatted.append(rec_dict)
    
    return formatted


async def log_analysis(request_id: str, username: str, status: str):
    """Log analysis for audit trail"""
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id,
        "username": username,
        "status": status
    }
    
    logging.info(f"Analysis logged: {log_entry}")


# =================== SERVER STARTUP ===================

def start_server():
    """Start the FastAPI server"""
    
    print("🚀 Starting AI Troubleshooter FastAPI Server...")
    print(f"   Backend services available: {SERVICES_AVAILABLE}")
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Start server
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8001,
        log_level="info",
        reload=False
    )
    
    server = uvicorn.Server(config)
    
    print(f"🌐 Server starting at: http://127.0.0.1:8001")
    print(f"📚 API Documentation: http://127.0.0.1:8001/docs")
    print(f"🔍 Alternative docs: http://127.0.0.1:8001/redoc")
    
    server.run()


if __name__ == "__main__":
    start_server()