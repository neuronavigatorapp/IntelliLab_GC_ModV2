#!/usr/bin/env python3
"""
AI diagnostics endpoints for chromatogram analysis and fault detection.
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.schemas import ChromatogramDiagnostic, RunRecord
from app.services.ai_diagnostics_service import ai_diagnostics_service
from app.core.database import get_db


router = APIRouter()


@router.post("/analyze-file", response_model=ChromatogramDiagnostic)
async def analyze_chromatogram_file(
    file: UploadFile = File(...),
    run_parameters: Optional[str] = Form(None),  # JSON string of run parameters
    db: Session = Depends(get_db)
):
    """
    Analyze uploaded chromatogram file (CSV or image) for faults and issues.
    Returns AI-powered diagnostic results with suggested method adjustments.
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['csv', 'png', 'jpg', 'jpeg']:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}. Supported: csv, png, jpg, jpeg"
            )
        
        # Save uploaded file temporarily
        upload_dir = "backend/uploads/chromatograms"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        temp_file_path = os.path.join(upload_dir, f"{file_id}.{file_extension}")
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Parse run parameters if provided
        parsed_params = None
        if run_parameters:
            import json
            try:
                parsed_params = json.loads(run_parameters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON in run_parameters")
        
        # Perform AI analysis
        diagnostic = ai_diagnostics_service.analyze_chromatogram_file(
            temp_file_path, 
            file_extension, 
            parsed_params
        )
        
        # Clean up temporary file
        try:
            os.remove(temp_file_path)
        except OSError:
            pass  # File cleanup failure shouldn't affect response
        
        return diagnostic
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-run/{run_id}", response_model=ChromatogramDiagnostic)
async def analyze_run_record(
    run_id: int,
    run_parameters: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze existing run record for faults and issues.
    Uses chromatogram data already stored in the database.
    """
    try:
        # Get run record from database
        from app.core.database import SandboxRun
        
        run = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run record not found")
        
        # Convert to RunRecord schema
        run_record = RunRecord(
            id=run.id,
            sample_name=run.sample_name,
            instrument_id=run.instrument_id,
            method_id=run.method_id,
            time=run.time,
            signal=run.signal,
            peaks=[],  # Would need to convert from JSON
            baseline=run.baseline,
            notes="",
            metadata=run.metrics
        )
        
        # Perform AI analysis
        diagnostic = ai_diagnostics_service.analyze_run_record(run_record, run_parameters)
        
        return diagnostic
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/diagnostics", response_model=List[ChromatogramDiagnostic])
async def get_diagnostic_history(
    run_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get diagnostic history for a specific run or all diagnostics.
    """
    try:
        diagnostics = ai_diagnostics_service.get_diagnostic_history(run_id=run_id, limit=limit)
        return diagnostics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve diagnostics: {str(e)}")


@router.get("/diagnostics/{diagnostic_id}", response_model=ChromatogramDiagnostic)
async def get_diagnostic(diagnostic_id: int, db: Session = Depends(get_db)):
    """
    Get a specific diagnostic result by ID.
    """
    try:
        from app.core.database import ChromatogramDiagnostic as DiagnosticModel
        
        diagnostic = db.query(DiagnosticModel).filter(DiagnosticModel.id == diagnostic_id).first()
        if not diagnostic:
            raise HTTPException(status_code=404, detail="Diagnostic not found")
        
        return ChromatogramDiagnostic.from_orm(diagnostic)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve diagnostic: {str(e)}")


@router.get("/fault-patterns")
async def get_fault_patterns():
    """
    Get available fault patterns that the AI system can detect.
    """
    try:
        patterns = []
        for pattern in ai_diagnostics_service.fault_patterns:
            patterns.append({
                "name": pattern.name,
                "description": pattern.description,
                "indicators": pattern.indicators,
                "severity": pattern.severity,
                "confidence_threshold": pattern.confidence_threshold,
                "method_adjustments": pattern.method_adjustments
            })
        
        return {
            "patterns": patterns,
            "model_version": ai_diagnostics_service.model_version,
            "total_patterns": len(patterns)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve fault patterns: {str(e)}")


@router.post("/quick-diagnosis")
async def quick_diagnosis(
    request: dict,  # Contains basic chromatogram info and symptoms
    db: Session = Depends(get_db)
):
    """
    Quick diagnosis based on user-described symptoms and basic chromatogram info.
    Useful for troubleshooting without uploading full chromatogram files.
    """
    try:
        symptoms = request.get('symptoms', [])
        chromatogram_info = request.get('chromatogram_info', {})
        
        # Simple rule-based diagnosis
        likely_causes = []
        suggested_actions = []
        
        # Check symptoms against known patterns
        for pattern in ai_diagnostics_service.fault_patterns:
            symptom_matches = 0
            for indicator in pattern.indicators:
                if any(indicator.lower() in symptom.lower() for symptom in symptoms):
                    symptom_matches += 1
            
            if symptom_matches > 0:
                confidence = symptom_matches / len(pattern.indicators)
                if confidence >= 0.3:  # Lower threshold for quick diagnosis
                    likely_causes.append({
                        "fault": pattern.name,
                        "description": pattern.description,
                        "confidence": confidence,
                        "severity": pattern.severity
                    })
                    suggested_actions.extend(pattern.method_adjustments)
        
        # Sort by confidence
        likely_causes.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            "likely_causes": likely_causes[:5],  # Top 5 most likely
            "suggested_actions": suggested_actions[:10],  # Top 10 actions
            "analysis_type": "quick_diagnosis",
            "timestamp": str(datetime.now()),
            "confidence_note": "Based on symptom matching. Upload chromatogram for detailed analysis."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick diagnosis failed: {str(e)}")


@router.get("/stats")
async def get_diagnostics_stats(db: Session = Depends(get_db)):
    """
    Get statistics about diagnostic analyses performed.
    """
    try:
        from app.core.database import ChromatogramDiagnostic as DiagnosticModel
        from sqlalchemy import func
        
        # Basic statistics
        total_diagnostics = db.query(DiagnosticModel).count()
        
        # Fault type distribution
        fault_stats = db.query(
            func.json_extract(DiagnosticModel.fault_causes, '$[*]').label('faults'),
            func.count().label('count')
        ).group_by('faults').all()
        
        # Average confidence score
        avg_confidence = db.query(func.avg(DiagnosticModel.confidence_score)).scalar() or 0.0
        
        # Processing time statistics
        avg_processing_time = db.query(func.avg(DiagnosticModel.processing_time)).scalar() or 0.0
        
        return {
            "total_diagnostics": total_diagnostics,
            "average_confidence": round(float(avg_confidence), 3),
            "average_processing_time": round(float(avg_processing_time), 3),
            "model_version": ai_diagnostics_service.model_version,
            "fault_patterns_available": len(ai_diagnostics_service.fault_patterns)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve stats: {str(e)}")


# Import datetime for quick diagnosis
from datetime import datetime
