#!/usr/bin/env python3
"""
GC Sandbox service for virtual runs, peak generation, and fault injection.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import uuid

from app.models.schemas import (
    Peak, RunRecord, SandboxRunRequest, SandboxRunResponse, FaultParams,
    SimulationProfile, SimulationProfileCreate, SimulationProfileUpdate,
    InletType, OvenRampConfig, FlowConfig, DetectorConfig
)
from app.core.database import SessionLocal, SandboxRun, SimulationProfile as SimulationProfileModel


@dataclass
class FaultDefinition:
    name: str
    description: str
    effects: List[str]
    defaults: Dict[str, Any]


class SandboxService:
    """Service to simulate injections, elution, and inject realistic faults."""

    def __init__(self) -> None:
        self._faults: Dict[str, FaultDefinition] = {
            "noise": FaultDefinition(
                name="noise",
                description="Increases baseline noise",
                effects=["Higher noise floor", "Lower SNR"],
                defaults={"noise_level": 1.0},
            ),
            "rt_shift": FaultDefinition(
                name="rt_shift",
                description="Uniform retention time shift",
                effects=["All peaks move in RT"],
                defaults={"rt_shift": 0.2},
            ),
            "drift": FaultDefinition(
                name="drift",
                description="Baseline drift over time",
                effects=["Tilted baseline"],
                defaults={"drift": 1.0},
            ),
            "ghost_peaks": FaultDefinition(
                name="ghost_peaks",
                description="Occasional spurious peaks",
                effects=["Unassigned peaks"],
                defaults={"ghost_peak_probability": 0.1},
            ),
            "leak": FaultDefinition(
                name="leak",
                description="Carrier gas leak reduces sensitivity and broadens peaks",
                effects=["Peak broadening", "Lower heights"],
                defaults={"leak_severity": 0.3},
            ),
            "detector_drift": FaultDefinition(
                name="detector_drift",
                description="Detector response drifts slowly",
                effects=["Slope over signal"],
                defaults={"detector_drift": 0.5},
            ),
        }

    def list_faults(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": f.name,
                "description": f.description,
                "effects": f.effects,
                "simulation_params": f.defaults,
            }
            for f in self._faults.values()
        ]

    def simulate_inlet_effects(self, inlet_type: InletType, flow_config: FlowConfig, compounds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply inlet-specific effects to compounds."""
        modified_compounds = []
        
        for compound in compounds:
            modified = compound.copy()
            
            # Apply inlet-specific discrimination and effects
            if inlet_type == InletType.SPLIT:
                # Split injection discrimination affects heavier compounds more
                mw = compound.get("molecular_weight", 100)
                discrimination = 1.0 - (mw - 50) * 0.002  # Slight discrimination based on MW
                modified["intensity"] *= max(0.5, discrimination)
                
                # Split ratio affects overall intensity
                if flow_config.split_ratio:
                    split_factor = 1.0 / (1.0 + flow_config.split_ratio)
                    modified["intensity"] *= split_factor
                    
            elif inlet_type == InletType.SPLITLESS:
                # Splitless typically has better sensitivity but can show peak broadening
                modified["intensity"] *= 1.2  # Better sensitivity
                modified["width"] *= 1.1  # Slight peak broadening
                
            elif inlet_type == InletType.ON_COLUMN:
                # On-column injection - best for thermally labile compounds
                modified["intensity"] *= 0.9  # Slightly lower but more consistent
                modified["width"] *= 0.95  # Sharper peaks
                
            modified_compounds.append(modified)
            
        return modified_compounds

    def apply_oven_ramp_effects(self, oven_config: OvenRampConfig, compounds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply oven ramp effects to retention times and peak shapes."""
        modified_compounds = []
        
        for compound in compounds:
            modified = compound.copy()
            
            # Calculate retention time based on oven program
            base_rt = compound["rt"]
            
            # Simple model: faster ramps reduce retention times
            avg_ramp_rate = np.mean([step.ramp_rate for step in oven_config.steps])
            rt_factor = 1.0 - (avg_ramp_rate - 10) * 0.01  # Baseline at 10°C/min
            modified["rt"] = base_rt * max(0.5, rt_factor)
            
            # Peak width affected by ramp rate and hold times
            total_hold_time = sum(step.hold_time for step in oven_config.steps)
            if total_hold_time > 5:  # Long holds can improve resolution
                modified["width"] *= 0.95
                
            modified_compounds.append(modified)
            
        return modified_compounds

    def generate_method_timeline(self, oven_config: OvenRampConfig, flow_config: FlowConfig, detector_config: DetectorConfig) -> Dict[str, Any]:
        """Generate a detailed method timeline for visualization."""
        timeline = {
            "total_time": 0,
            "oven_profile": [],
            "flow_profile": [],
            "detector_events": [],
            "equilibration_time": oven_config.equilibration_time
        }
        
        current_time = 0
        current_temp = oven_config.steps[0].initial_temp if oven_config.steps else 50
        
        # Build oven temperature profile
        for step in oven_config.steps:
            # Initial hold
            if step.hold_time > 0:
                timeline["oven_profile"].append({
                    "time": current_time,
                    "temp": current_temp,
                    "phase": "hold"
                })
                current_time += step.hold_time
                
            # Ramp
            if step.ramp_rate > 0 and step.final_temp != current_temp:
                ramp_time = abs(step.final_temp - current_temp) / step.ramp_rate
                timeline["oven_profile"].append({
                    "time": current_time,
                    "temp": current_temp,
                    "phase": "ramp_start"
                })
                current_time += ramp_time
                timeline["oven_profile"].append({
                    "time": current_time,
                    "temp": step.final_temp,
                    "phase": "ramp_end"
                })
                current_temp = step.final_temp
                
        # Post-run cooling
        timeline["oven_profile"].append({
            "time": current_time,
            "temp": oven_config.post_run_temp,
            "phase": "cooldown"
        })
        
        timeline["total_time"] = current_time + 2  # Add cooldown time
        
        # Flow events
        timeline["flow_profile"] = [
            {"time": 0, "carrier_flow": flow_config.carrier_flow, "event": "start"},
            {"time": timeline["total_time"], "carrier_flow": flow_config.carrier_flow, "event": "end"}
        ]
        
        # Detector events
        timeline["detector_events"] = [
            {"time": -1, "event": "preheat", "temp": detector_config.temp},
            {"time": 0, "event": "acquisition_start"},
            {"time": timeline["total_time"], "event": "acquisition_end"}
        ]
        
        return timeline

    def run(self, request: SandboxRunRequest) -> SandboxRunResponse:
        # Time axis
        total_time = 20.0
        time_points = np.linspace(0, total_time, 2000)
        signal = np.zeros_like(time_points)

        # Build compound list
        compounds = request.compounds or []
        if not compounds and request.compound_ids:
            # Load from DB
            with SessionLocal() as db:
                from app.core.database import Compound as CompoundModel

                db_compounds = (
                    db.query(CompoundModel)
                    .filter(CompoundModel.id.in_(request.compound_ids))
                    .all()
                )
                for c in db_compounds:
                    compounds.append(
                        {
                            "name": c.name,
                            "rt": float(c.retention_time),
                            "intensity": float(c.default_intensity),
                            "width": float(c.default_width),
                        }
                    )

        # Default fall-back
        if not compounds:
            compounds = [
                {"name": "Methane", "rt": 1.2, "intensity": 60, "width": 0.05},
                {"name": "Ethane", "rt": 1.8, "intensity": 100, "width": 0.06},
                {"name": "Propane", "rt": 2.6, "intensity": 140, "width": 0.08},
                {"name": "n-Butane", "rt": 3.9, "intensity": 170, "width": 0.1},
            ]

        # Apply base faults
        applied_faults = {}
        fp: FaultParams = request.fault_params or FaultParams()

        # Baseline noise & drift
        if fp.noise_level > 0:
            signal += np.random.normal(0, fp.noise_level, len(time_points))
            applied_faults["noise_level"] = fp.noise_level

        if fp.drift > 0:
            signal += np.linspace(0, fp.drift, len(time_points))
            applied_faults["drift"] = fp.drift

        if fp.detector_drift != 0:
            signal *= (1.0 + np.linspace(0, fp.detector_drift * 0.01, len(time_points)))
            applied_faults["detector_drift"] = fp.detector_drift

        # Peak generation
        peaks: List[Peak] = []
        for c in compounds:
            rt = c["rt"] + fp.rt_shift
            width = c["width"] * (1.0 + fp.leak_severity * 0.5)
            height = c["intensity"] * (1.0 - fp.leak_severity * 0.5)
            sigma = width / 2.355
            peak_sig = height * np.exp(-0.5 * ((time_points - rt) / sigma) ** 2)
            signal += peak_sig
            peaks.append(
                Peak(
                    id=str(uuid.uuid4()),
                    rt=float(rt),
                    area=float(height * width * np.sqrt(2 * np.pi)),
                    height=float(height),
                    width=float(width),
                    name=c.get("name"),
                )
            )

        # Ghost peaks
        if fp.ghost_peak_probability > 0:
            n_candidates = int(total_time // 2)
            for i in range(n_candidates):
                if np.random.rand() < fp.ghost_peak_probability:
                    rt = float(np.random.uniform(0.5, total_time - 0.5))
                    width = float(np.random.uniform(0.05, 0.2))
                    height = float(np.random.uniform(20, 80))
                    sigma = width / 2.355
                    signal += height * np.exp(-0.5 * ((time_points - rt) / sigma) ** 2)
                    peaks.append(
                        Peak(
                            id=str(uuid.uuid4()),
                            rt=rt,
                            area=float(height * width * np.sqrt(2 * np.pi)),
                            height=height,
                            width=width,
                            name="Ghost",
                        )
                    )
            applied_faults["ghost_peaks"] = fp.ghost_peak_probability

        # Build run record
        run_record = RunRecord(
            instrument_id=request.instrument_id,
            method_id=request.method_id,
            sample_name=request.sample_name,
            time=time_points.tolist(),
            signal=signal.tolist(),
            peaks=peaks,
            baseline=[0.0] * len(time_points),
        )

        # Metrics
        quality_metrics = {
            "total_peaks": len(peaks),
            "max_signal": float(np.max(signal)) if len(signal) else 0.0,
            "snr_estimate": float(np.max(signal) / max(fp.noise_level, 1e-6)),
        }

        # Persist sandbox run
        sandbox_run_id: Optional[int] = None
        with SessionLocal() as db:
            db_run = SandboxRun(
                instrument_id=request.instrument_id,
                method_id=request.method_id,
                sample_name=request.sample_name,
                compound_ids=request.compound_ids,
                fault_params=fp.dict(),
                time=run_record.time,
                signal=run_record.signal,
                peaks=[p.model_dump() for p in peaks],
                baseline=run_record.baseline,
                metrics=quality_metrics,
            )
            db.add(db_run)
            db.commit()
            db.refresh(db_run)
            sandbox_run_id = db_run.id

        return SandboxRunResponse(
            run_record=run_record,
            quality_metrics=quality_metrics,
            applied_faults=applied_faults,
            sandbox_run_id=sandbox_run_id,
        )

    def create_simulation_profile(self, profile_data: SimulationProfileCreate, user_id: int) -> SimulationProfile:
        """Create a new simulation profile."""
        with SessionLocal() as db:
            db_profile = SimulationProfileModel(
                name=profile_data.name,
                description=profile_data.description,
                instrument_id=profile_data.instrument_id,
                method_id=profile_data.method_id,
                inlet_type=profile_data.inlet_type.value,
                oven_ramp_config=profile_data.oven_ramp_config.dict(),
                flow_config=profile_data.flow_config.dict(),
                detector_config=profile_data.detector_config.dict(),
                compound_ids=profile_data.compound_ids,
                fault_config=profile_data.fault_config.dict() if profile_data.fault_config else None,
                created_by=user_id,
                is_public=profile_data.is_public,
                tags=profile_data.tags
            )
            db.add(db_profile)
            db.commit()
            db.refresh(db_profile)
            
            return SimulationProfile.from_orm(db_profile)

    def get_simulation_profiles(self, user_id: Optional[int] = None, public_only: bool = False) -> List[SimulationProfile]:
        """Get simulation profiles for a user or public profiles."""
        with SessionLocal() as db:
            query = db.query(SimulationProfileModel)
            
            if public_only:
                query = query.filter(SimulationProfileModel.is_public == True)
            elif user_id:
                query = query.filter(
                    (SimulationProfileModel.created_by == user_id) |
                    (SimulationProfileModel.is_public == True)
                )
                
            profiles = query.order_by(SimulationProfileModel.modified_date.desc()).all()
            return [SimulationProfile.from_orm(p) for p in profiles]

    def get_simulation_profile(self, profile_id: int) -> Optional[SimulationProfile]:
        """Get a specific simulation profile by ID."""
        with SessionLocal() as db:
            profile = db.query(SimulationProfileModel).filter(SimulationProfileModel.id == profile_id).first()
            return SimulationProfile.from_orm(profile) if profile else None

    def update_simulation_profile(self, profile_id: int, profile_data: SimulationProfileUpdate, user_id: int) -> Optional[SimulationProfile]:
        """Update a simulation profile."""
        with SessionLocal() as db:
            profile = db.query(SimulationProfileModel).filter(
                SimulationProfileModel.id == profile_id,
                SimulationProfileModel.created_by == user_id
            ).first()
            
            if not profile:
                return None
                
            for field, value in profile_data.dict(exclude_unset=True).items():
                if field in ['oven_ramp_config', 'flow_config', 'detector_config', 'fault_config'] and value:
                    value = value.dict() if hasattr(value, 'dict') else value
                setattr(profile, field, value)
                
            db.commit()
            db.refresh(profile)
            return SimulationProfile.from_orm(profile)

    def delete_simulation_profile(self, profile_id: int, user_id: int) -> bool:
        """Delete a simulation profile."""
        with SessionLocal() as db:
            profile = db.query(SimulationProfileModel).filter(
                SimulationProfileModel.id == profile_id,
                SimulationProfileModel.created_by == user_id
            ).first()
            
            if not profile:
                return False
                
            db.delete(profile)
            db.commit()
            return True

    def increment_profile_usage(self, profile_id: int):
        """Increment usage count for a profile."""
        with SessionLocal() as db:
            profile = db.query(SimulationProfileModel).filter(SimulationProfileModel.id == profile_id).first()
            if profile:
                profile.usage_count += 1
                db.commit()


sandbox_service = SandboxService()


