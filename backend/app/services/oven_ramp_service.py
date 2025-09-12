#!/usr/bin/env python3
"""
Enhanced Oven Ramp Visualizer Service - Phase 2.2
Professional temperature program optimization with advanced algorithms
"""

from typing import Dict, List, Tuple, Optional
from enum import Enum
import numpy as np
from datetime import datetime
from loguru import logger
import json

class CompoundClass(str, Enum):
    HYDROCARBONS = "Hydrocarbons"
    ALCOHOLS = "Alcohols"
    ESTERS = "Esters"
    KETONES = "Ketones"
    ALDEHYDES = "Aldehydes"
    AROMATICS = "Aromatics"
    HALOGENATED = "Halogenated"
    TERPENES = "Terpenes"
    PESTICIDES = "Pesticides"
    PHARMACEUTICALS = "Pharmaceuticals"

class VolatilityRange(str, Enum):
    C5_C10 = "C5-C10"
    C8_C20 = "C8-C20"
    C10_C30 = "C10-C30"
    C15_C40 = "C15-C40"
    C20_C50 = "C20-C50"

class ColumnType(str, Enum):
    DB5 = "DB-5ms"
    DB1 = "DB-1ms"
    DB17 = "DB-17ms"
    DBWAX = "DB-WAX"
    DB624 = "DB-624"
    DB1301 = "DB-1301"
    PLOT_AL2O3 = "PLOT Al2O3"
    PLOT_Q = "PLOT Q"

class OvenRampService:
    """Enhanced GC oven temperature program optimizer with advanced algorithms"""
    
    def __init__(self):
        # Enhanced column database with efficiency factors
        self.column_database = {
            "DB-5ms (30m x 0.25mm x 0.25um)": {
                "length": 30, "id": 0.25, "film": 0.25,
                "efficiency": 1.0, "polarity": "Non-polar",
                "temp_limit": 325, "optimal_flow": 1.5
            },
            "DB-5ms (60m x 0.25mm x 0.25um)": {
                "length": 60, "id": 0.25, "film": 0.25,
                "efficiency": 1.2, "polarity": "Non-polar",
                "temp_limit": 325, "optimal_flow": 1.2
            },
            "DB-1ms (30m x 0.25mm x 0.25um)": {
                "length": 30, "id": 0.25, "film": 0.25,
                "efficiency": 0.95, "polarity": "Non-polar",
                "temp_limit": 325, "optimal_flow": 1.5
            },
            "DB-17ms (30m x 0.25mm x 0.25um)": {
                "length": 30, "id": 0.25, "film": 0.25,
                "efficiency": 1.1, "polarity": "Mid-polar",
                "temp_limit": 280, "optimal_flow": 1.5
            },
            "DB-WAX (30m x 0.25mm x 0.25um)": {
                "length": 30, "id": 0.25, "film": 0.25,
                "efficiency": 1.05, "polarity": "Polar",
                "temp_limit": 250, "optimal_flow": 1.5
            },
            "DB-624 (30m x 0.25mm x 1.4um)": {
                "length": 30, "id": 0.25, "film": 1.4,
                "efficiency": 0.9, "polarity": "Mid-polar",
                "temp_limit": 200, "optimal_flow": 1.0
            },
            "DB-1301 (30m x 0.25mm x 1.0um)": {
                "length": 30, "id": 0.25, "film": 1.0,
                "efficiency": 0.85, "polarity": "Mid-polar",
                "temp_limit": 200, "optimal_flow": 1.0
            },
            "PLOT Al2O3 (30m x 0.32mm)": {
                "length": 30, "id": 0.32, "film": 0.0,
                "efficiency": 1.3, "polarity": "Non-polar",
                "temp_limit": 200, "optimal_flow": 2.0
            }
        }
        
        # Enhanced compound database with retention characteristics
        self.compound_database = {
            CompoundClass.HYDROCARBONS: {
                "temp_range": [40, 320], "category": "Non-polar",
                "retention_factors": {"DB5": 1.0, "DB1": 0.95, "DBWAX": 1.2},
                "optimal_ramp": {"low": 8, "medium": 6, "high": 4}
            },
            CompoundClass.ALCOHOLS: {
                "temp_range": [50, 280], "category": "Polar",
                "retention_factors": {"DB5": 1.1, "DB1": 1.0, "DBWAX": 0.9},
                "optimal_ramp": {"low": 6, "medium": 4, "high": 3}
            },
            CompoundClass.ESTERS: {
                "temp_range": [60, 300], "category": "Polar",
                "retention_factors": {"DB5": 1.05, "DB1": 1.0, "DBWAX": 0.95},
                "optimal_ramp": {"low": 7, "medium": 5, "high": 3}
            },
            CompoundClass.KETONES: {
                "temp_range": [55, 290], "category": "Polar",
                "retention_factors": {"DB5": 1.08, "DB1": 1.0, "DBWAX": 0.92},
                "optimal_ramp": {"low": 7, "medium": 5, "high": 3}
            },
            CompoundClass.ALDEHYDES: {
                "temp_range": [45, 285], "category": "Polar",
                "retention_factors": {"DB5": 1.12, "DB1": 1.0, "DBWAX": 0.88},
                "optimal_ramp": {"low": 6, "medium": 4, "high": 3}
            },
            CompoundClass.AROMATICS: {
                "temp_range": [70, 320], "category": "Non-polar",
                "retention_factors": {"DB5": 0.98, "DB1": 1.0, "DBWAX": 1.15},
                "optimal_ramp": {"low": 8, "medium": 6, "high": 4}
            },
            CompoundClass.HALOGENATED: {
                "temp_range": [50, 310], "category": "Non-polar",
                "retention_factors": {"DB5": 1.02, "DB1": 1.0, "DBWAX": 1.1},
                "optimal_ramp": {"low": 7, "medium": 5, "high": 3}
            },
            CompoundClass.TERPENES: {
                "temp_range": [80, 280], "category": "Non-polar",
                "retention_factors": {"DB5": 0.95, "DB1": 1.0, "DBWAX": 1.25},
                "optimal_ramp": {"low": 6, "medium": 4, "high": 2}
            },
            CompoundClass.PESTICIDES: {
                "temp_range": [100, 320], "category": "Mixed",
                "retention_factors": {"DB5": 1.0, "DB1": 0.98, "DBWAX": 1.05},
                "optimal_ramp": {"low": 5, "medium": 3, "high": 2}
            },
            CompoundClass.PHARMACEUTICALS: {
                "temp_range": [80, 300], "category": "Mixed",
                "retention_factors": {"DB5": 1.03, "DB1": 1.0, "DBWAX": 0.97},
                "optimal_ramp": {"low": 6, "medium": 4, "high": 2}
            }
        }
        
        # Advanced optimization library with multi-step programs
        self.optimization_library = {
            CompoundClass.HYDROCARBONS: {
                VolatilityRange.C8_C20: {
                    "initial_temp": 60.0,
                    "initial_hold": 2.0,
                    "ramp_rate_1": 8.0,
                    "final_temp_1": 180.0,
                    "hold_time_1": 1.0,
                    "ramp_rate_2": 4.0,
                    "final_temp_2": 280.0,
                    "final_hold": 5.0,
                    "resolution_target": 1.5,
                    "efficiency_target": 0.85
                },
                VolatilityRange.C10_C30: {
                    "initial_temp": 70.0,
                    "initial_hold": 2.0,
                    "ramp_rate_1": 6.0,
                    "final_temp_1": 220.0,
                    "hold_time_1": 1.0,
                    "ramp_rate_2": 3.0,
                    "final_temp_2": 320.0,
                    "final_hold": 8.0,
                    "resolution_target": 1.8,
                    "efficiency_target": 0.80
                }
            }
        }
        
        # Retention time prediction coefficients
        self.retention_coefficients = {
            "base_retention": 2.0,
            "temp_factor": 0.02,
            "column_factor": 0.1,
            "compound_factor": 0.15
        }
    
    def calculate_oven_ramp(self, params: Dict) -> Dict:
        """
        Calculate enhanced oven ramp program with advanced features
        
        Args:
            params: Dictionary containing calculation parameters
            
        Returns:
            Dictionary with comprehensive calculation results
        """
        try:
            # Extract parameters
            initial_temp = params.get('initial_temp', 50.0)
            initial_hold = params.get('initial_hold', 2.0)
            ramp_rate_1 = params.get('ramp_rate_1', 10.0)
            final_temp_1 = params.get('final_temp_1', 150.0)
            hold_time_1 = params.get('hold_time_1', 0.0)
            ramp_rate_2 = params.get('ramp_rate_2', 5.0)
            final_temp_2 = params.get('final_temp_2', 280.0)
            final_hold = params.get('final_hold', 5.0)
            
            # Advanced parameters
            column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
            compound_class = params.get('compound_class', 'Hydrocarbons')
            volatility_range = params.get('volatility_range', 'C8-C20')
            sample_complexity = params.get('sample_complexity', 'Medium')
            
            # Instrument condition parameters
            instrument_age = params.get('instrument_age', 5.0)
            maintenance_level = params.get('maintenance_level', 'Good')
            oven_calibration = params.get('oven_calibration', 'Good')
            column_condition = params.get('column_condition', 'Good')
            heating_rate_limit = params.get('heating_rate_limit', 20.0)
            
            # Calculate enhanced temperature profile
            times, temps, actual_rates = self._calculate_enhanced_temperature_profile(
                initial_temp, initial_hold, ramp_rate_1, final_temp_1,
                hold_time_1, ramp_rate_2, final_temp_2, final_hold,
                instrument_age, maintenance_level, oven_calibration,
                heating_rate_limit, column_type
            )
            
            # Calculate advanced scores
            resolution_score = self._calculate_enhanced_resolution_score(times, temps, params)
            efficiency_score = self._calculate_enhanced_efficiency_score(times, temps, params)
            optimization_score = self._calculate_optimization_score(resolution_score, efficiency_score, params)
            
            # Generate advanced recommendations
            recommendations = self._generate_enhanced_recommendations(
                params, resolution_score, efficiency_score, heating_rate_limit
            )
            
            # Simulate enhanced chromatogram
            chromatogram_data = self._simulate_enhanced_chromatogram(times, temps, params)
            
            # Calculate retention time predictions
            retention_predictions = self._predict_retention_times(params, temps)
            
            # Calculate column efficiency metrics
            efficiency_metrics = self._calculate_column_efficiency_metrics(params, temps, times)
            
            # Generate optimization suggestions
            optimization_suggestions = self._generate_optimization_suggestions(params, resolution_score, efficiency_score)
            
            return {
                'total_runtime': times[-1] if times else 0.0,
                'resolution_score': resolution_score,
                'efficiency_score': efficiency_score,
                'optimization_score': optimization_score,
                'temperature_profile': [{"time": t, "temperature": temp} for t, temp in zip(times, temps)],
                'chromatogram_data': chromatogram_data,
                'recommendations': recommendations,
                'actual_heating_rates': actual_rates,
                'retention_predictions': retention_predictions,
                'efficiency_metrics': efficiency_metrics,
                'optimization_suggestions': optimization_suggestions,
                'column_performance': self._assess_column_performance(params),
                'method_robustness': self._assess_method_robustness(params),
                'calculation_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced oven ramp calculation: {e}")
            raise
    
    def _calculate_enhanced_temperature_profile(self, initial_temp: float, initial_hold: float,
                                             ramp_rate_1: float, final_temp_1: float,
                                             hold_time_1: float, ramp_rate_2: float,
                                             final_temp_2: float, final_hold: float,
                                             instrument_age: float, maintenance_level: str,
                                             oven_calibration: str, heating_rate_limit: float,
                                             column_type: str) -> Tuple[List[float], List[float], List[float]]:
        """Calculate enhanced temperature profile with column-specific effects"""
        
        # Get column characteristics
        column_data = self.column_database.get(column_type, {})
        column_efficiency = column_data.get('efficiency', 1.0)
        column_temp_limit = column_data.get('temp_limit', 325)
        
        # Calculate real-world degradation factors
        age_factor = max(0.7, 1.0 - instrument_age * 0.02)
        maintenance_factor = {"Poor": 0.8, "Fair": 0.9, "Good": 0.95, "Excellent": 1.0}[maintenance_level]
        calibration_factor = {"Poor": 0.85, "Fair": 0.92, "Good": 0.97, "Excellent": 1.0}[oven_calibration]
        
        overall_factor = age_factor * maintenance_factor * calibration_factor * column_efficiency
        
        # Apply column temperature limits
        final_temp_1 = min(final_temp_1, column_temp_limit - 20)
        final_temp_2 = min(final_temp_2, column_temp_limit)
        
        # Calculate actual ramp rates (limited by instrument capabilities)
        actual_ramp1 = min(ramp_rate_1, heating_rate_limit * overall_factor)
        actual_ramp2 = min(ramp_rate_2, heating_rate_limit * overall_factor)
        
        # Calculate time points with enhanced precision
        t0 = 0
        t1 = initial_hold
        t2 = t1 + (final_temp_1 - initial_temp) / actual_ramp1
        t3 = t2 + hold_time_1
        t4 = t3 + (final_temp_2 - final_temp_1) / actual_ramp2
        t5 = t4 + final_hold
        
        times = [t0, t1, t2, t3, t4, t5]
        temps = [initial_temp, initial_temp, final_temp_1, final_temp_1, final_temp_2, final_temp_2]
        actual_rates = [0, 0, actual_ramp1, 0, actual_ramp2, 0]
        
        return times, temps, actual_rates
    
    def _calculate_enhanced_resolution_score(self, times: List[float], temps: List[float], params: Dict) -> float:
        """Calculate enhanced resolution score with compound-specific factors"""
        if not times or not temps:
            return 0.0
        
        # Base resolution factors
        temp_range = max(temps) - min(temps)
        ramp_efficiency = 1.0
        
        ramp_rate_1 = params.get('ramp_rate_1', 10.0)
        heating_rate_limit = params.get('heating_rate_limit', 20.0)
        instrument_age = params.get('instrument_age', 5.0)
        compound_class = params.get('compound_class', 'Hydrocarbons')
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        
        # Compound-specific adjustments
        compound_data = self.compound_database.get(compound_class, {})
        optimal_ramp = compound_data.get('optimal_ramp', {})
        
        # Check if ramp rates are optimal for compound class
        if ramp_rate_1 > optimal_ramp.get('medium', 6) * 1.5:
            ramp_efficiency *= 0.8
        elif ramp_rate_1 < optimal_ramp.get('medium', 6) * 0.5:
            ramp_efficiency *= 0.9
        
        if ramp_rate_1 > heating_rate_limit:
            ramp_efficiency *= 0.8
        
        if instrument_age > 10:
            ramp_efficiency *= 0.9
        
        # Column-specific adjustments
        column_data = self.column_database.get(column_type, {})
        column_efficiency = column_data.get('efficiency', 1.0)
        
        resolution_score = min(10, (temp_range / 300) * 5 + ramp_efficiency * 3 + column_efficiency * 2)
        return resolution_score
    
    def _calculate_enhanced_efficiency_score(self, times: List[float], temps: List[float], params: Dict) -> float:
        """Calculate enhanced efficiency score with complexity factors"""
        if not times:
            return 0.0
        
        total_time = times[-1]
        base_efficiency = 10 - (total_time / 60)  # Shorter time = higher efficiency
        
        # Adjust for real-world conditions
        maintenance_level = params.get('maintenance_level', 'Good')
        sample_complexity = params.get('sample_complexity', 'Medium')
        compound_class = params.get('compound_class', 'Hydrocarbons')
        
        # Complexity adjustments
        complexity_factors = {
            'Simple': 1.1,
            'Medium': 1.0,
            'Complex': 0.9
        }
        
        # Compound-specific efficiency
        compound_data = self.compound_database.get(compound_class, {})
        temp_range = compound_data.get('temp_range', [50, 300])
        actual_temp_range = max(temps) - min(temps)
        
        if actual_temp_range < (temp_range[1] - temp_range[0]) * 0.5:
            base_efficiency *= 0.9  # Inefficient temperature range
        
        efficiency_score = base_efficiency * complexity_factors.get(sample_complexity, 1.0)
        
        if maintenance_level in ["Poor", "Fair"]:
            efficiency_score *= 0.8
        
        return max(0, efficiency_score)
    
    def _calculate_optimization_score(self, resolution_score: float, efficiency_score: float, params: Dict) -> float:
        """Calculate overall optimization score"""
        # Weighted average based on analysis type
        analysis_type = params.get('analysis_type', 'Routine')
        
        if analysis_type == 'Research':
            # Prioritize resolution
            optimization_score = resolution_score * 0.7 + efficiency_score * 0.3
        elif analysis_type == 'Routine':
            # Balanced approach
            optimization_score = resolution_score * 0.5 + efficiency_score * 0.5
        else:  # Fast screening
            # Prioritize efficiency
            optimization_score = resolution_score * 0.3 + efficiency_score * 0.7
        
        return optimization_score
    
    def _generate_enhanced_recommendations(self, params: Dict, resolution_score: float, 
                                         efficiency_score: float, heating_rate_limit: float) -> List[str]:
        """Generate enhanced optimization recommendations"""
        
        recommendations = []
        
        # Resolution-based recommendations
        if resolution_score < 7.0:
            recommendations.append("Optimize ramp rates for better resolution")
            recommendations.append("Consider longer hold times for critical separations")
            recommendations.append("Review column selection for compound class")
        
        # Efficiency-based recommendations
        if efficiency_score < 7.0:
            recommendations.append("Reduce total runtime for better efficiency")
            recommendations.append("Optimize temperature program for faster analysis")
            recommendations.append("Consider higher ramp rates if instrument allows")
        
        # Compound-specific recommendations
        compound_class = params.get('compound_class', 'Hydrocarbons')
        volatility_range = params.get('volatility_range', 'C8-C20')
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        
        compound_data = self.compound_database.get(compound_class, {})
        optimal_ramp = compound_data.get('optimal_ramp', {})
        
        ramp_rate_1 = params.get('ramp_rate_1', 10.0)
        if ramp_rate_1 > optimal_ramp.get('medium', 6) * 1.5:
            recommendations.append(f"Reduce initial ramp rate for {compound_class} analysis")
        elif ramp_rate_1 < optimal_ramp.get('medium', 6) * 0.5:
            recommendations.append(f"Increase initial ramp rate for {compound_class} analysis")
        
        # Column-specific recommendations
        column_data = self.column_database.get(column_type, {})
        column_polarity = column_data.get('polarity', 'Non-polar')
        compound_category = compound_data.get('category', 'Non-polar')
        
        if column_polarity != compound_category:
            recommendations.append(f"Consider {column_polarity} column for {compound_category} compounds")
        
        # Instrument capability recommendations
        if heating_rate_limit < ramp_rate_1 or heating_rate_limit < params.get('ramp_rate_2', 5.0):
            recommendations.append("Reduce ramp rates to match instrument capabilities")
        
        return recommendations
    
    def _simulate_enhanced_chromatogram(self, times: List[float], temps: List[float], params: Dict) -> List[Dict]:
        """Simulate enhanced chromatogram with compound-specific retention"""
        
        if not times or not temps:
            return []
        
        chromatogram_data = []
        compound_class = params.get('compound_class', 'Hydrocarbons')
        volatility_range = params.get('volatility_range', 'C8-C20')
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        
        # Get compound-specific data
        compound_data = self.compound_database.get(compound_class, {})
        retention_factors = compound_data.get('retention_factors', {})
        
        # Get column data
        column_data = self.column_database.get(column_type, {})
        column_efficiency = column_data.get('efficiency', 1.0)
        
        # Determine retention factor for column
        column_key = column_type.split()[0] if column_type else "DB5"
        retention_factor = retention_factors.get(column_key, 1.0)
        
        # Simulate peaks based on compound class and volatility
        if compound_class == CompoundClass.HYDROCARBONS:
            if volatility_range == VolatilityRange.C8_C20:
                # Simulate hydrocarbon peaks with enhanced retention prediction
                base_retention = 5.0 * retention_factor * column_efficiency
                for i in range(8, 21, 2):  # C8, C10, C12, etc.
                    retention = base_retention + (i - 8) * 1.5 * retention_factor
                    if retention <= times[-1]:
                        # Calculate temperature at retention time
                        temp_index = min(len(temps)-1, int(retention * 2))
                        temp_at_retention = temps[temp_index] if temps else 0
                        
                        chromatogram_data.append({
                            "time": retention,
                            "intensity": 100 - (i - 8) * 3,  # Decreasing peak height
                            "temperature": temp_at_retention,
                            "compound": f"C{i}",
                            "retention_factor": retention_factor,
                            "column_efficiency": column_efficiency
                        })
        
        return chromatogram_data
    
    def _predict_retention_times(self, params: Dict, temps: List[float]) -> Dict:
        """Predict retention times for target compounds"""
        
        compound_class = params.get('compound_class', 'Hydrocarbons')
        volatility_range = params.get('volatility_range', 'C8-C20')
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        
        # Get compound and column data
        compound_data = self.compound_database.get(compound_class, {})
        column_data = self.column_database.get(column_type, {})
        
        retention_factors = compound_data.get('retention_factors', {})
        column_key = column_type.split()[0] if column_type else "DB5"
        retention_factor = retention_factors.get(column_key, 1.0)
        column_efficiency = column_data.get('efficiency', 1.0)
        
        # Predict retention times for key compounds
        predictions = {}
        
        if compound_class == CompoundClass.HYDROCARBONS:
            if volatility_range == VolatilityRange.C8_C20:
                base_retention = 5.0 * retention_factor * column_efficiency
                for i in range(8, 21, 2):
                    retention = base_retention + (i - 8) * 1.5 * retention_factor
                    predictions[f"C{i}"] = {
                        "retention_time": retention,
                        "confidence": 0.85,
                        "factors": {
                            "compound_factor": retention_factor,
                            "column_efficiency": column_efficiency,
                            "volatility": i
                        }
                    }
        
        return {
            "predictions": predictions,
            "method": "Compound-specific retention modeling",
            "confidence_level": 0.85
        }
    
    def _calculate_column_efficiency_metrics(self, params: Dict, temps: List[float], times: List[float]) -> Dict:
        """Calculate column efficiency metrics"""
        
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        column_data = self.column_database.get(column_type, {})
        
        # Calculate theoretical plates
        column_length = column_data.get('length', 30)
        column_id = column_data.get('id', 0.25)
        theoretical_plates = (column_length * 1000) / column_id
        
        # Calculate temperature efficiency
        temp_range = max(temps) - min(temps) if temps else 0
        temp_efficiency = min(1.0, temp_range / 250)  # Normalize to typical range
        
        # Calculate time efficiency
        total_time = times[-1] if times else 0
        time_efficiency = max(0, 1.0 - (total_time / 60))  # Shorter is better
        
        return {
            "theoretical_plates": theoretical_plates,
            "temperature_efficiency": temp_efficiency,
            "time_efficiency": time_efficiency,
            "overall_efficiency": (temp_efficiency + time_efficiency) / 2,
            "column_condition": self._assess_column_condition(params)
        }
    
    def _assess_column_performance(self, params: Dict) -> Dict:
        """Assess column performance based on parameters"""
        
        column_type = params.get('column_type', 'DB-5ms (30m x 0.25mm x 0.25um)')
        column_data = self.column_database.get(column_type, {})
        column_condition = params.get('column_condition', 'Good')
        
        # Calculate performance score
        base_score = column_data.get('efficiency', 1.0)
        
        condition_factors = {
            'Excellent': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Poor': 0.7
        }
        
        condition_factor = condition_factors.get(column_condition, 0.9)
        performance_score = base_score * condition_factor
        
        return {
            "performance_score": performance_score,
            "column_type": column_type,
            "condition": column_condition,
            "efficiency_factor": column_data.get('efficiency', 1.0),
            "temperature_limit": column_data.get('temp_limit', 325)
        }
    
    def _assess_method_robustness(self, params: Dict) -> Dict:
        """Assess method robustness"""
        
        robustness_score = 1.0
        
        # Check parameter ranges
        ramp_rate_1 = params.get('ramp_rate_1', 10.0)
        ramp_rate_2 = params.get('ramp_rate_2', 5.0)
        heating_limit = params.get('heating_rate_limit', 20.0)
        
        if ramp_rate_1 > heating_limit * 0.9:
            robustness_score *= 0.8
        if ramp_rate_2 > heating_limit * 0.9:
            robustness_score *= 0.8
        
        # Check temperature ranges
        initial_temp = params.get('initial_temp', 50.0)
        final_temp_2 = params.get('final_temp_2', 280.0)
        
        if initial_temp < 40 or final_temp_2 > 320:
            robustness_score *= 0.9
        
        return {
            "robustness_score": robustness_score,
            "parameter_quality": "Good" if robustness_score > 0.8 else "Fair",
            "recommendations": self._generate_robustness_recommendations(params)
        }
    
    def _generate_optimization_suggestions(self, params: Dict, resolution_score: float, efficiency_score: float) -> List[str]:
        """Generate specific optimization suggestions"""
        
        suggestions = []
        
        if resolution_score < 7.0:
            suggestions.append("Consider multi-step temperature program for better resolution")
            suggestions.append("Optimize hold times for critical peak pairs")
            suggestions.append("Review column selection for compound class compatibility")
        
        if efficiency_score < 7.0:
            suggestions.append("Implement faster ramp rates if instrument allows")
            suggestions.append("Reduce unnecessary hold times")
            suggestions.append("Consider higher initial temperature for early eluting compounds")
        
        # Compound-specific suggestions
        compound_class = params.get('compound_class', 'Hydrocarbons')
        compound_data = self.compound_database.get(compound_class, {})
        optimal_ramp = compound_data.get('optimal_ramp', {})
        
        current_ramp = params.get('ramp_rate_1', 10.0)
        optimal_medium = optimal_ramp.get('medium', 6)
        
        if current_ramp > optimal_medium * 1.5:
            suggestions.append(f"Reduce ramp rate to {optimal_medium}°C/min for {compound_class}")
        elif current_ramp < optimal_medium * 0.5:
            suggestions.append(f"Increase ramp rate to {optimal_medium}°C/min for {compound_class}")
        
        return suggestions
    
    def _generate_robustness_recommendations(self, params: Dict) -> List[str]:
        """Generate robustness recommendations"""
        
        recommendations = []
        
        ramp_rate_1 = params.get('ramp_rate_1', 10.0)
        heating_limit = params.get('heating_rate_limit', 20.0)
        
        if ramp_rate_1 > heating_limit * 0.9:
            recommendations.append("Reduce ramp rate to 80% of instrument limit for robustness")
        
        initial_temp = params.get('initial_temp', 50.0)
        if initial_temp < 40:
            recommendations.append("Increase initial temperature for better method stability")
        
        return recommendations
    
    def _assess_column_condition(self, params: Dict) -> str:
        """Assess column condition based on parameters"""
        
        column_condition = params.get('column_condition', 'Good')
        instrument_age = params.get('instrument_age', 5.0)
        
        if instrument_age > 10 and column_condition in ['Fair', 'Poor']:
            return "Consider column replacement"
        elif column_condition == 'Excellent':
            return "Optimal"
        elif column_condition == 'Good':
            return "Good"
        else:
            return "Needs attention"

# Create enhanced service instance
oven_ramp_service = OvenRampService() 