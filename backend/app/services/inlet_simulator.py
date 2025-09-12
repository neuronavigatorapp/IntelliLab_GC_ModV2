#!/usr/bin/env python3
"""
Inlet Simulator Service
Port of the original GC inlet simulator calculations
"""

import numpy as np
from typing import Dict, Any, List
from loguru import logger
from datetime import datetime

from app.models.schemas import InletSimulationRequest, InletSimulationResponse


class InletSimulatorService:
    """Service for GC inlet simulation calculations"""
    
    def __init__(self):
        self.liner_database = self.load_liner_database()
        self.injection_modes = self.load_injection_modes()
    
    def calculate_transfer_efficiency(self, params: InletSimulationRequest) -> float:
        """Calculate sample transfer efficiency with real-world conditions"""
        base_efficiency = 85.0  # Base efficiency percentage
        
        # Injection mode effects
        if params.injection_mode == "Splitless":
            base_efficiency += 10.0
        elif params.injection_mode == "Split":
            base_efficiency -= params.split_ratio * 0.1
        
        # Temperature effects
        temp = params.inlet_temp
        if temp < 200:
            base_efficiency *= 0.8
        elif temp > 350:
            base_efficiency *= 0.9
        
        # Volume effects
        if params.injection_volume > 5.0:
            base_efficiency *= 0.9
        
        # Matrix effects
        matrix_factors = {
            'Light Hydrocarbon': 1.0,
            'Heavy Hydrocarbon': 0.9,
            'Oxygenated': 0.85,
            'Aqueous': 0.8,
            'Complex Matrix': 0.75
        }
        base_efficiency *= matrix_factors.get(params.matrix_type, 1.0)
        
        # REAL-WORLD DEGRADATION FACTORS
        # Instrument age impact
        age = params.instrument_age
        if age > 20:
            base_efficiency *= 0.75  # 25% loss for very old instruments
        elif age > 10:
            base_efficiency *= 0.9   # 10% loss for older instruments
        
        # Maintenance impact
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Poor': 0.7,
            'Neglected': 0.5
        }
        base_efficiency *= maintenance_factors.get(params.maintenance_level, 1.0)
        
        # Vacuum integrity impact
        vacuum = params.vacuum_integrity
        vacuum_factor = vacuum / 100.0
        base_efficiency *= vacuum_factor
        
        # Septum condition impact
        septum_factors = {
            'New': 1.0,
            'Good': 0.98,
            'Worn': 0.92,
            'Leaking': 0.75,
            'Badly Damaged': 0.5
        }
        base_efficiency *= septum_factors.get(params.septum_condition, 1.0)
        
        # Liner condition impact
        liner_factors = {
            'Clean': 1.0,
            'Lightly Contaminated': 0.95,
            'Contaminated': 0.85,
            'Heavily Contaminated': 0.7,
            'Needs Replacement': 0.5
        }
        base_efficiency *= liner_factors.get(params.liner_condition, 1.0)
        
        # Apply calibration if available
        if params.is_calibrated and params.calibration_data:
            transfer_ratio = params.calibration_data.get('transfer_efficiency_ratio', 1.0)
            base_efficiency *= transfer_ratio
        
        return min(max(base_efficiency, 5.0), 98.0)
    
    def calculate_discrimination_factor(self, params: InletSimulationRequest) -> float:
        """Calculate discrimination factor with real-world conditions"""
        base_discrimination = 1.0  # Perfect = 1.0, higher = more discrimination
        
        # Split ratio effects
        if params.injection_mode == "Split":
            base_discrimination += (params.split_ratio - 1) * 0.001
        
        # Temperature effects
        temp_factor = max(0, (params.inlet_temp - 250) / 100)
        base_discrimination -= temp_factor * 0.1
        
        # Real-world degradation factors
        age = params.instrument_age
        if age > 20:
            base_discrimination += 0.15  # Poor temperature stability
        elif age > 10:
            base_discrimination += 0.08
        
        # Poor maintenance increases discrimination
        maintenance_factors = {
            'Excellent': 0.0,
            'Good': 0.02,
            'Fair': 0.08,
            'Poor': 0.15,
            'Neglected': 0.25
        }
        base_discrimination += maintenance_factors.get(params.maintenance_level, 0.0)
        
        # Vacuum issues increase discrimination
        vacuum_factor = (100 - params.vacuum_integrity) / 100.0
        base_discrimination += vacuum_factor * 0.1
        
        # Apply calibration if available
        if params.is_calibrated and params.calibration_data:
            discrimination_ratio = params.calibration_data.get('discrimination_ratio', 1.0)
            base_discrimination *= discrimination_ratio
        
        return max(base_discrimination, 0.5)
    
    def calculate_peak_shape_index(self, params: InletSimulationRequest) -> float:
        """Calculate peak shape index with real-world conditions"""
        base_shape = 1.0  # Perfect = 1.0, lower = worse shape
        
        # Temperature effects
        temp = params.inlet_temp
        if temp < 200:
            base_shape *= 0.9  # Poor vaporization
        elif temp > 350:
            base_shape *= 0.95  # Thermal degradation
        
        # Volume effects
        if params.injection_volume > 3.0:
            base_shape *= 0.9  # Overloading
        
        # Matrix effects
        matrix_factors = {
            'Light Hydrocarbon': 1.0,
            'Heavy Hydrocarbon': 0.95,
            'Oxygenated': 0.9,
            'Aqueous': 0.8,
            'Complex Matrix': 0.75
        }
        base_shape *= matrix_factors.get(params.matrix_type, 1.0)
        
        # Instrument condition effects
        age = params.instrument_age
        if age > 20:
            base_shape *= 0.85  # Poor performance
        elif age > 10:
            base_shape *= 0.95
        
        # Maintenance effects
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.98,
            'Fair': 0.9,
            'Poor': 0.8,
            'Neglected': 0.7
        }
        base_shape *= maintenance_factors.get(params.maintenance_level, 1.0)
        
        # Apply calibration if available
        if params.is_calibrated and params.calibration_data:
            peak_shape_ratio = params.calibration_data.get('peak_shape_ratio', 1.0)
            base_shape *= peak_shape_ratio
        
        return max(base_shape, 0.3)
    
    def calculate_optimization_score(self, transfer_eff: float, discrimination: float, peak_shape: float) -> float:
        """Calculate overall optimization score"""
        # Weighted scoring system
        transfer_weight = 0.4
        discrimination_weight = 0.3
        peak_shape_weight = 0.3
        
        # Normalize discrimination (lower is better)
        discrimination_score = max(0, 1 - (discrimination - 1.0))
        
        # Calculate weighted score
        score = (transfer_eff / 100.0 * transfer_weight + 
                discrimination_score * discrimination_weight + 
                peak_shape * peak_shape_weight)
        
        return min(max(score, 0.0), 1.0)
    
    def generate_detailed_analysis(self, params: InletSimulationRequest, 
                                 transfer_eff: float, discrimination: float, 
                                 peak_shape: float, opt_score: float) -> Dict[str, Any]:
        """Generate detailed analysis of inlet performance"""
        
        analysis = {
            "transfer_efficiency": {
                "value": transfer_eff,
                "unit": "%",
                "status": "Excellent" if transfer_eff > 80 else "Good" if transfer_eff > 60 else "Poor",
                "description": f"Sample transfer efficiency is {transfer_eff:.1f}%"
            },
            "discrimination_factor": {
                "value": discrimination,
                "unit": "",
                "status": "Excellent" if discrimination < 1.05 else "Good" if discrimination < 1.15 else "Poor",
                "description": f"Discrimination factor is {discrimination:.3f}"
            },
            "peak_shape_index": {
                "value": peak_shape,
                "unit": "",
                "status": "Excellent" if peak_shape > 0.9 else "Good" if peak_shape > 0.7 else "Poor",
                "description": f"Peak shape index is {peak_shape:.3f}"
            },
            "optimization_score": {
                "value": opt_score * 100,
                "unit": "%",
                "status": "Excellent" if opt_score > 0.8 else "Good" if opt_score > 0.6 else "Poor",
                "description": f"Overall optimization score is {opt_score * 100:.1f}%"
            },
            "instrument_condition": {
                "age_impact": "High" if params.instrument_age > 15 else "Medium" if params.instrument_age > 8 else "Low",
                "maintenance_impact": params.maintenance_level.value,
                "vacuum_impact": "Good" if params.vacuum_integrity > 90 else "Fair" if params.vacuum_integrity > 80 else "Poor"
            }
        }
        
        return analysis
    
    def generate_recommendations(self, params: InletSimulationRequest, 
                               transfer_eff: float, discrimination: float, 
                               peak_shape: float) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        # Transfer efficiency recommendations
        if transfer_eff < 60:
            recommendations.append("Increase inlet temperature to improve sample vaporization")
            recommendations.append("Check septum and liner condition - replace if necessary")
            recommendations.append("Consider splitless injection for better transfer efficiency")
        
        # Discrimination recommendations
        if discrimination > 1.15:
            recommendations.append("Optimize split ratio to reduce discrimination")
            recommendations.append("Check for leaks in the inlet system")
            recommendations.append("Verify carrier gas flow rates")
        
        # Peak shape recommendations
        if peak_shape < 0.7:
            recommendations.append("Reduce injection volume to prevent overloading")
            recommendations.append("Clean or replace inlet liner")
            recommendations.append("Check column condition and replace if necessary")
        
        # Instrument condition recommendations
        if params.instrument_age > 15:
            recommendations.append("Consider instrument maintenance or replacement")
            recommendations.append("Calibrate temperature sensors")
        
        if params.maintenance_level.value in ["Poor", "Neglected"]:
            recommendations.append("Schedule immediate instrument maintenance")
            recommendations.append("Replace consumables (septum, liner, O-rings)")
        
        if params.vacuum_integrity < 85:
            recommendations.append("Check for vacuum leaks in the system")
            recommendations.append("Verify detector gas flows")
        
        return recommendations
    
    def simulate_injection(self, params: InletSimulationRequest) -> InletSimulationResponse:
        """Main simulation method"""
        try:
            # Calculate performance metrics
            transfer_efficiency = self.calculate_transfer_efficiency(params)
            discrimination_factor = self.calculate_discrimination_factor(params)
            peak_shape_index = self.calculate_peak_shape_index(params)
            optimization_score = self.calculate_optimization_score(
                transfer_efficiency, discrimination_factor, peak_shape_index
            )
            
            # Generate detailed analysis
            detailed_analysis = self.generate_detailed_analysis(
                params, transfer_efficiency, discrimination_factor, 
                peak_shape_index, optimization_score
            )
            
            # Generate recommendations
            recommendations = self.generate_recommendations(
                params, transfer_efficiency, discrimination_factor, peak_shape_index
            )
            
            return InletSimulationResponse(
                transfer_efficiency=transfer_efficiency,
                discrimination_factor=discrimination_factor,
                peak_shape_index=peak_shape_index,
                optimization_score=optimization_score,
                detailed_analysis=detailed_analysis,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error in inlet simulation: {e}")
            raise
    
    def load_liner_database(self) -> Dict[str, Any]:
        """Load liner database"""
        return {
            "Split Liner": {"type": "split", "volume": 0.8, "efficiency": 0.95},
            "Splitless Liner": {"type": "splitless", "volume": 1.0, "efficiency": 0.98},
            "Purge Liner": {"type": "purge", "volume": 0.6, "efficiency": 0.92},
            "Baffle Liner": {"type": "baffle", "volume": 0.9, "efficiency": 0.94}
        }
    
    def load_injection_modes(self) -> Dict[str, Any]:
        """Load injection modes database"""
        return {
            "Split": {"description": "Split injection for high concentration samples", "efficiency": 0.85},
            "Splitless": {"description": "Splitless injection for trace analysis", "efficiency": 0.95},
            "On-Column": {"description": "On-column injection for sensitive compounds", "efficiency": 0.98},
            "P&T": {"description": "Purge and trap for volatile compounds", "efficiency": 0.90}
        }


# Create service instance
inlet_simulator_service = InletSimulatorService() 