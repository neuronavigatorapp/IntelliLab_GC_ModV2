#!/usr/bin/env python3
"""
Sandbox endpoints for virtual GC runs and troubleshooting.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.schemas import (
    SandboxRunRequest, SandboxRunResponse, SandboxFault,
    SimulationProfile, SimulationProfileCreate, SimulationProfileUpdate
)
from app.services.sandbox_service import sandbox_service
from app.core.database import get_db


router = APIRouter()


@router.get("/faults", response_model=List[SandboxFault])
async def list_faults():
    try:
        return sandbox_service.list_faults()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/run", response_model=SandboxRunResponse)
async def run_sandbox(request: SandboxRunRequest, db: Session = Depends(get_db)):
    """
    Run sandbox simulation and store in database for persistence
    """
    try:
        from app.core.database import SandboxRun as SandboxRunModel
        
        # Run the sandbox simulation
        result = sandbox_service.run(request)
        
        # Store in database for persistence
        try:
            sandbox_run = SandboxRunModel(
                instrument_id=request.instrument_id,
                method_id=request.method_id,
                sample_name=getattr(request, 'sample_name', 'Sandbox Run'),
                compound_ids=request.compound_ids,
                fault_params=request.fault_params,
                time=result.time,
                signal=result.signal,
                peaks=result.peaks,
                baseline=result.baseline,
                metrics=result.metrics
            )
            
            db.add(sandbox_run)
            db.commit()
            db.refresh(sandbox_run)
            
            # Add the database ID to the response
            result.run_id = sandbox_run.id
            
        except Exception as db_error:
            # Don't fail the simulation if DB storage fails
            db.rollback()
            print(f"Warning: Failed to store sandbox run in database: {db_error}")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs")
async def list_sandbox_runs(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """List historical sandbox runs from database"""
    try:
        from app.core.database import SandboxRun as SandboxRunModel
        
        runs = db.query(SandboxRunModel)\
                .order_by(SandboxRunModel.created_date.desc())\
                .offset(offset)\
                .limit(limit)\
                .all()
        
        return {"success": True, "runs": runs, "count": len(runs)}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs/{run_id}")
async def get_sandbox_run(run_id: int, db: Session = Depends(get_db)):
    """Get a specific sandbox run by ID"""
    try:
        from app.core.database import SandboxRun as SandboxRunModel
        
        run = db.query(SandboxRunModel).filter(SandboxRunModel.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Sandbox run not found")
        
        return {"success": True, "run": run}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Simulation Profiles endpoints
@router.get("/profiles", response_model=List[SimulationProfile])
async def list_simulation_profiles(
    user_id: int = 1,  # TODO: Get from auth
    public_only: bool = False
):
    """List simulation profiles for user or public profiles"""
    try:
        return sandbox_service.get_simulation_profiles(user_id=user_id, public_only=public_only)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/profiles", response_model=SimulationProfile)
async def create_simulation_profile(
    profile_data: SimulationProfileCreate,
    user_id: int = 1  # TODO: Get from auth
):
    """Create a new simulation profile"""
    try:
        return sandbox_service.create_simulation_profile(profile_data, user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/profiles/{profile_id}", response_model=SimulationProfile)
async def get_simulation_profile(profile_id: int):
    """Get a specific simulation profile by ID"""
    try:
        profile = sandbox_service.get_simulation_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Simulation profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/profiles/{profile_id}", response_model=SimulationProfile)
async def update_simulation_profile(
    profile_id: int,
    profile_data: SimulationProfileUpdate,
    user_id: int = 1  # TODO: Get from auth
):
    """Update a simulation profile"""
    try:
        profile = sandbox_service.update_simulation_profile(profile_id, profile_data, user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Simulation profile not found or no permission")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/profiles/{profile_id}")
async def delete_simulation_profile(
    profile_id: int,
    user_id: int = 1  # TODO: Get from auth
):
    """Delete a simulation profile"""
    try:
        success = sandbox_service.delete_simulation_profile(profile_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Simulation profile not found or no permission")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/profiles/{profile_id}/use")
async def use_simulation_profile(profile_id: int):
    """Increment usage count for a profile"""
    try:
        sandbox_service.increment_profile_usage(profile_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


