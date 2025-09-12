#!/usr/bin/env python3
"""
Calculation API endpoints for GC simulations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from loguru import logger
from datetime import datetime
import json
import math
import numpy as np

from app.core.database import get_db, Calculation as CalculationModel
from app.models.schemas import (
    InletSimulationRequest, InletSimulationResponse,
    DetectionLimitRequest, DetectionLimitResponse,
    OvenRampRequest, OvenRampResponse,
    ColumnParametersRequest, ColumnParametersResponse,
    PressureDropRequest, PressureDropResponse,
    SplitlessTimingRequest, SplitlessTimingResponse
)
from app.services.inlet_simulator import inlet_simulator_service
from app.services.detection_limit_service import detection_limit_service
from app.services.oven_ramp_service import oven_ramp_service
from app.services.uncertainty_calculator import uncertainty_calculator
from app.services.stationary_phases import stationary_phase_selector, CompoundClass
from app.core.websocket import websocket_manager

router = APIRouter()


@router.post("/inlet-simulator", response_model=InletSimulationResponse)
async def calculate_inlet_simulation(
    request: InletSimulationRequest,
    db: Session = Depends(get_db)
):
    """Calculate inlet simulation results"""
    try:
        start_time = datetime.now()
        
        # Perform calculation
        result = inlet_simulator_service.simulate_injection(request)
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="inlet_simulation",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "calculation_update",
            "calculation_type": "inlet_simulation",
            "results": result.dict(),
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Inlet simulation completed in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in inlet simulation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating inlet simulation: {str(e)}"
        )


@router.post("/detection-limit", response_model=DetectionLimitResponse)
async def calculate_detection_limit(
    request: DetectionLimitRequest,
    db: Session = Depends(get_db)
):
    """Calculate detection limit results"""
    try:
        start_time = datetime.now()
        
        # Convert request to service parameters
        params = {
            'detector_type': request.detector_type.value,
            'carrier_gas': request.carrier_gas.value,
            'column_type': request.column_type,
            'injector_temp': request.injector_temp,
            'detector_temp': request.detector_temp,
            'oven_temp': request.oven_temp,
            'flow_rate': request.flow_rate,
            'split_ratio': request.split_ratio,
            'h2_flow': request.h2_flow,
            'air_flow': request.air_flow,
            'makeup_flow': request.makeup_flow,
            'injection_volume': request.injection_volume,
            'sample_concentration': request.sample_concentration,
            'target_compound': request.target_compound,
            'instrument_age': request.instrument_age,
            'maintenance_level': request.maintenance_level.value,
            'detector_calibration': request.detector_calibration.value,
            'column_condition': request.column_condition.value,
            'noise_level': request.noise_level,
            'sample_matrix': request.sample_matrix,
            'analysis_type': request.analysis_type
        }
        
        # Use detection limit service
        result_data = detection_limit_service.calculate_detection_limit(params)
        
        result = DetectionLimitResponse(
            detection_limit=result_data['detection_limit'],
            signal_to_noise=result_data['signal_to_noise'],
            confidence_level=result_data['confidence_level'],
            calculation_time=result_data['calculation_time'],
            recommendations=result_data['recommendations'],
            statistical_analysis=result_data['statistical_analysis'],
            instrument_factors=result_data['instrument_factors'],
            astm_comparison=result_data.get('astm_comparison', {}),
            optimization_potential=result_data.get('optimization_potential', {}),
            calibration_curve=result_data.get('calibration_curve', {}),
            noise_analysis=result_data.get('noise_analysis', {})
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="detection_limit",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "calculation_update",
            "calculation_type": "detection_limit",
            "results": result.dict(),
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Detection limit calculation completed in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in detection limit calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating detection limit: {str(e)}"
        )


@router.post("/oven-ramp", response_model=OvenRampResponse)
async def calculate_oven_ramp(
    request: OvenRampRequest,
    db: Session = Depends(get_db)
):
    """Calculate oven ramp program results"""
    try:
        start_time = datetime.now()
        
        # Convert request to service parameters
        params = {
            'initial_temp': request.initial_temp,
            'initial_hold': request.initial_hold,
            'ramp_rate_1': request.ramp_rate_1,
            'final_temp_1': request.final_temp_1,
            'hold_time_1': request.hold_time_1,
            'ramp_rate_2': request.ramp_rate_2,
            'final_temp_2': request.final_temp_2,
            'final_hold': request.final_hold,
            'instrument_age': request.instrument_age,
            'maintenance_level': request.maintenance_level,
            'oven_calibration': request.oven_calibration,
            'column_condition': request.column_condition,
            'heating_rate_limit': request.heating_rate_limit,
            'compound_class': request.compound_class,
            'volatility_range': request.volatility_range,
            'sample_complexity': request.sample_complexity
        }
        
        # Use oven ramp service
        result_data = oven_ramp_service.calculate_oven_ramp(params)
        
        result = OvenRampResponse(
            total_runtime=result_data['total_runtime'],
            resolution_score=result_data['resolution_score'],
            efficiency_score=result_data['efficiency_score'],
            optimization_score=result_data['optimization_score'],
            temperature_profile=result_data['temperature_profile'],
            chromatogram_data=result_data['chromatogram_data'],
            recommendations=result_data['recommendations'],
            actual_heating_rates=result_data.get('actual_heating_rates'),
            retention_predictions=result_data.get('retention_predictions'),
            efficiency_metrics=result_data.get('efficiency_metrics'),
            optimization_suggestions=result_data.get('optimization_suggestions'),
            column_performance=result_data.get('column_performance'),
            method_robustness=result_data.get('method_robustness'),
            calculation_timestamp=result_data.get('calculation_timestamp')
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="oven_ramp",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "calculation_update",
            "calculation_type": "oven_ramp",
            "results": result.dict(),
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Oven ramp calculation completed in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in oven ramp calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating oven ramp: {str(e)}"
        )





@router.get("/history")
async def get_calculation_history(
    calculation_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get calculation history"""
    try:
        query = db.query(CalculationModel)
        if calculation_type:
            query = query.filter(CalculationModel.calculation_type == calculation_type)
        
        calculations = query.order_by(CalculationModel.created_date.desc()).limit(limit).all()
        
        return {
            "calculations": [
                {
                    "id": calc.id,
                    "calculation_type": calc.calculation_type,
                    "execution_time": calc.execution_time,
                    "created_date": calc.created_date.isoformat(),
                    "input_parameters": calc.input_parameters,
                    "output_results": calc.output_results
                }
                for calc in calculations
            ],
            "total": len(calculations)
        }
        
    except Exception as e:
        logger.error(f"Error getting calculation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving calculation history"
        )


@router.post("/column-parameters", response_model=ColumnParametersResponse)
async def calculate_column_parameters(
    request: ColumnParametersRequest,
    db: Session = Depends(get_db)
):
    """Calculate REAL column parameters used daily by GC specialists"""
    try:
        start_time = datetime.now()
        
        # Convert units
        id_m = request.id_mm / 1000
        radius_m = id_m / 2
        temp_k = request.temperature_c + 273.15
        
        # Cross-sectional area
        area_m2 = math.pi * radius_m ** 2
        
        # Linear velocity (cm/s)
        flow_m3_s = request.flow_ml_min / 60 / 1000000
        linear_velocity_m_s = flow_m3_s / area_m2
        linear_velocity_cm_s = linear_velocity_m_s * 100
        
        # Void time (dead time)
        void_time_s = request.length_m / linear_velocity_m_s
        void_time_min = void_time_s / 60
        
        # Calculate optimal flow based on van Deemter
        # Diffusion coefficients at 25°C (cm²/s)
        D_ref = {"Helium": 0.7, "Hydrogen": 0.9, "Nitrogen": 0.16}
        D_25 = D_ref.get(request.carrier_gas, 0.7)
        
        # Temperature correction for diffusion coefficient
        D_T = D_25 * (temp_k / 298.15) ** 1.75
        
        # Optimal linear velocity (Uopt = sqrt(B/C))
        # B = 2 * Dm, C = f(k) * dc²/(24*Dm)
        B = 2 * D_T
        dc_cm = request.id_mm / 10  # column diameter in cm
        C = 0.01 * dc_cm ** 2 / (24 * D_T)  # simplified for unretained peak
        
        u_opt_cm_s = math.sqrt(B / C)
        optimal_flow_ml_min = u_opt_cm_s * area_m2 * 100 * 60 * 1000000
        
        # Efficiency at current flow
        H_current = B / linear_velocity_cm_s + C * linear_velocity_cm_s
        N_current = (request.length_m * 100) / H_current  # plates
        
        # Efficiency at optimal flow  
        H_optimal = B / u_opt_cm_s + C * u_opt_cm_s
        N_optimal = (request.length_m * 100) / H_optimal
        
        # Generate recommendation
        if abs(request.flow_ml_min - optimal_flow_ml_min) < 0.2:
            recommendation = "Optimal"
        else:
            plate_gain = int(N_optimal - N_current)
            recommendation = f"Adjust flow to {optimal_flow_ml_min:.2f} mL/min for {plate_gain} more plates"
        
        result = ColumnParametersResponse(
            linear_velocity_cm_s=round(linear_velocity_cm_s, 2),
            void_time_min=round(void_time_min, 3),
            void_volume_ml=round(area_m2 * request.length_m * 1000000, 3),
            optimal_flow_ml_min=round(optimal_flow_ml_min, 2),
            current_plates=int(N_current),
            optimal_plates=int(N_optimal),
            efficiency_percent=round((N_current / N_optimal) * 100, 1),
            recommendation=recommendation
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="column_parameters",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        logger.info(f"Column parameters calculated in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in column parameters calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating column parameters: {str(e)}"
        )


@router.post("/pressure-drop", response_model=PressureDropResponse)
async def calculate_pressure_drop(
    request: PressureDropRequest,
    db: Session = Depends(get_db)
):
    """Calculate actual pressure drop across column - critical for method safety"""
    try:
        start_time = datetime.now()
        
        # Viscosity data (micropoise)
        viscosity_data = {
            "Helium": {25: 196, 100: 233, 200: 289, 300: 339},
            "Hydrogen": {25: 89, 100: 108, 200: 131, 300: 152},
            "Nitrogen": {25: 176, 100: 212, 200: 257, 300: 297}
        }
        
        # Interpolate viscosity for temperature
        temps = sorted(viscosity_data[request.carrier_gas].keys())
        viscosities = [viscosity_data[request.carrier_gas][t] for t in temps]
        viscosity_micropoise = np.interp(request.temperature_c, temps, viscosities)
        viscosity_pa_s = viscosity_micropoise * 1e-7
        
        # Convert units
        id_m = request.id_mm / 1000
        flow_m3_s = request.flow_ml_min / 60 / 1000000
        
        if request.particle_size_um is None:
            # Capillary column - use Hagen-Poiseuille equation
            # ΔP = 32 * η * L * u / d²
            linear_velocity = flow_m3_s / (math.pi * (id_m/2)**2)
            pressure_drop_pa = 32 * viscosity_pa_s * request.length_m * linear_velocity / (id_m**2)
        else:
            # Packed column - use Darcy's law
            # ΔP = (η * L * u) / K
            # K = (dp² * ε³) / (180 * (1-ε)²)
            dp_m = request.particle_size_um / 1000000
            porosity = 0.4  # typical for GC packed columns
            permeability = (dp_m**2 * porosity**3) / (180 * (1-porosity)**2)
            linear_velocity = flow_m3_s / (math.pi * (id_m/2)**2 * porosity)
            pressure_drop_pa = viscosity_pa_s * request.length_m * linear_velocity / permeability
        
        # Convert to psi
        pressure_drop_psi = pressure_drop_pa * 0.000145038
        
        # Calculate inlet pressure needed (outlet = atmospheric)
        inlet_pressure_psi = 14.7 + pressure_drop_psi
        
        # Check if dangerous
        max_pressure_psi = 100 if request.id_mm <= 0.25 else 60  # typical column limits
        is_safe = inlet_pressure_psi < max_pressure_psi
        warning = None if is_safe else f"Pressure too high! Reduce flow or temperature"
        
        result = PressureDropResponse(
            pressure_drop_psi=round(pressure_drop_psi, 1),
            inlet_pressure_required_psi=round(inlet_pressure_psi, 1),
            viscosity_micropoise=round(viscosity_micropoise, 1),
            safe=is_safe,
            max_recommended_psi=max_pressure_psi,
            warning=warning
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="pressure_drop",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        logger.info(f"Pressure drop calculated in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in pressure drop calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating pressure drop: {str(e)}"
        )


@router.post("/splitless-timing", response_model=SplitlessTimingResponse)
async def calculate_splitless_timing(
    request: SplitlessTimingRequest,
    db: Session = Depends(get_db)
):
    """Calculate optimal splitless time - critical for trace analysis"""
    try:
        start_time = datetime.now()
        
        # Solvent vapor volumes at different temperatures (mL/μL)
        # Based on ideal gas law and solvent properties
        solvent_expansion = {
            "Methanol": {"bp": 64.7, "mw": 32.04, "density": 0.79},
            "Acetonitrile": {"bp": 82.0, "mw": 41.05, "density": 0.78},
            "Hexane": {"bp": 69.0, "mw": 86.18, "density": 0.66},
            "Dichloromethane": {"bp": 39.6, "mw": 84.93, "density": 1.33},
            "Ethyl Acetate": {"bp": 77.1, "mw": 88.11, "density": 0.90},
            "Acetone": {"bp": 56.0, "mw": 58.08, "density": 0.78}
        }
        
        solvent_props = solvent_expansion[request.solvent]
        
        # Calculate vapor volume using ideal gas law
        # V = nRT/P where n = mass/MW
        R = 0.08206  # L·atm/(mol·K)
        T_inlet_K = request.inlet_temp_c + 273.15
        P_atm = 1  # atmospheric pressure
        
        # Assume 1 μL of solvent
        mass_g = 0.001 * solvent_props["density"]  # 1 μL
        moles = mass_g / solvent_props["mw"]
        
        vapor_volume_ml = moles * R * T_inlet_K * 1000 / P_atm
        
        # Calculate sweep time
        # Time = (liner volume * number of sweeps) / flow rate
        sweeps_needed = 2.5  # typically 1.5-2.5 liner volumes
        total_volume_to_sweep = request.liner_volume_ul * sweeps_needed / 1000  # convert to mL
        
        splitless_time_min = total_volume_to_sweep / request.column_flow_ml_min
        splitless_time_s = splitless_time_min * 60
        
        # Check if solvent is condensing (focusing)
        solvent_focusing = request.column_temp_c < (solvent_props["bp"] - 20)
        
        focusing_assessment = "Good - solvent will condense" if solvent_focusing else "Poor - increase initial temp difference"
        optimization_tip = f"Try {round(splitless_time_s - 10, 1)}s to {round(splitless_time_s + 10, 1)}s range"
        
        result = SplitlessTimingResponse(
            recommended_splitless_time_s=round(splitless_time_s, 1),
            vapor_volume_ml_per_ul=round(vapor_volume_ml, 1),
            total_sweep_volume_ml=round(total_volume_to_sweep, 2),
            solvent_focusing=solvent_focusing,
            focusing_assessment=focusing_assessment,
            optimization_tip=optimization_tip
        )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="splitless_timing",
            input_parameters=request.dict(),
            output_results=result.dict(),
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        logger.info(f"Splitless timing calculated in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in splitless timing calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating splitless timing: {str(e)}"
        )


@router.post("/with-uncertainty")
async def calculate_with_uncertainty(
    measurement_type: str,
    value: float,
    conditions: Dict[str, float] = None,
    db: Session = Depends(get_db)
):
    """Return all calculations with ISO GUM-compliant uncertainty bounds"""
    try:
        start_time = datetime.now()
        
        if conditions is None:
            conditions = {}
        
        result = {}
        
        if measurement_type == "flow":
            result = uncertainty_calculator.calculate_flow_uncertainty(
                flow=value,
                temperature=conditions.get("temperature", 25.0),
                pressure=conditions.get("pressure", 14.7),
                flow_accuracy=conditions.get("flow_accuracy", 0.02),
                temperature_uncertainty=conditions.get("temperature_uncertainty", 1.0),
                pressure_uncertainty=conditions.get("pressure_uncertainty", 0.5)
            )
        
        elif measurement_type == "temperature":
            result = uncertainty_calculator.calculate_temperature_uncertainty(
                temperature=value,
                calibration_uncertainty=conditions.get("calibration_uncertainty", 1.0),
                stability_uncertainty=conditions.get("stability_uncertainty", 0.5),
                uniformity_uncertainty=conditions.get("uniformity_uncertainty", 2.0)
            )
        
        elif measurement_type == "split_ratio":
            split_flow = conditions.get("split_flow", 50.0)
            column_flow = conditions.get("column_flow", 1.0)
            split_flow_unc = conditions.get("split_flow_uncertainty", 1.0)
            column_flow_unc = conditions.get("column_flow_uncertainty", 0.02)
            
            result = uncertainty_calculator.calculate_split_ratio_uncertainty(
                split_flow=split_flow,
                column_flow=column_flow,
                split_flow_uncertainty=split_flow_unc,
                column_flow_uncertainty=column_flow_unc
            )
        
        elif measurement_type == "retention_time":
            result = uncertainty_calculator.calculate_retention_time_uncertainty(
                retention_time=value,
                temperature_uncertainty=conditions.get("temperature_uncertainty", 1.0),
                flow_uncertainty_percent=conditions.get("flow_uncertainty_percent", 2.0),
                injection_precision=conditions.get("injection_precision", 0.01)
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported measurement type: {measurement_type}"
            )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type=f"uncertainty_{measurement_type}",
            input_parameters={"measurement_type": measurement_type, "value": value, "conditions": conditions},
            output_results=result,
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        # Add ISO compliance metadata
        result.update({
            "iso_compliance": "ISO GUM (Guide to Uncertainty in Measurement)",
            "calculation_method": "Combined standard uncertainty with coverage factor",
            "traceability": "NIST traceable standards assumed",
            "calculation_timestamp": datetime.now().isoformat()
        })
        
        logger.info(f"Uncertainty calculation completed for {measurement_type} in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in uncertainty calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating uncertainty: {str(e)}"
        )


@router.post("/stationary-phase-recommendation")
async def recommend_stationary_phase(
    compound_class: str,
    db: Session = Depends(get_db)
):
    """Recommend stationary phase based on McReynolds constants"""
    try:
        start_time = datetime.now()
        
        # Validate compound class
        try:
            compound_enum = CompoundClass(compound_class.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid compound class. Valid options: {[c.value for c in CompoundClass]}"
            )
        
        # Get recommendations
        recommendations = stationary_phase_selector.recommend_phase(compound_enum)
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="stationary_phase_recommendation",
            input_parameters={"compound_class": compound_class},
            output_results={"recommendations": recommendations},
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        result = {
            "compound_class": compound_class,
            "recommendations": recommendations,
            "mcreynolds_explanation": {
                "X": "Benzene - Aromatic selectivity",
                "Y": "n-Butanol - Hydrogen bonding (alcohols)",
                "Z": "2-Pentanone - Dipole interactions (carbonyls)",
                "U": "Nitropropane - Dipole interactions (nitro compounds)",
                "S": "Pyridine - Basic interactions"
            },
            "selection_criteria": "Ranked by compound-specific McReynolds weighting",
            "calculation_timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Stationary phase recommendation completed in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in stationary phase recommendation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recommending stationary phase: {str(e)}"
        )


@router.post("/compare-stationary-phases")
async def compare_stationary_phases(
    phase_names: List[str],
    db: Session = Depends(get_db)
):
    """Compare multiple stationary phases using McReynolds constants"""
    try:
        start_time = datetime.now()
        
        # Get comparison
        comparison = stationary_phase_selector.compare_phases(phase_names)
        
        if "error" in comparison:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=comparison["error"]
            )
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Save calculation to database
        calculation_record = CalculationModel(
            calculation_type="stationary_phase_comparison",
            input_parameters={"phase_names": phase_names},
            output_results=comparison,
            execution_time=execution_time
        )
        db.add(calculation_record)
        db.commit()
        
        result = {
            "comparison": comparison,
            "methodology": "McReynolds constants comparison",
            "reference": "McReynolds, W.O. (1970). Characterization of some liquid phases. J. Chromatogr. Sci. 8, 685-691",
            "calculation_timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Stationary phase comparison completed in {execution_time:.3f}s")
        return result
        
    except Exception as e:
        logger.error(f"Error in stationary phase comparison: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing stationary phases: {str(e)}"
        ) 