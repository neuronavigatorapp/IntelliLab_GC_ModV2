#!/usr/bin/env python3
"""
Detection Limit Calculator Service
Advanced statistical calculations for GC detection limits beyond ASTM requirements
"""

from typing import Dict, List, Tuple, Optional
from enum import Enum
import numpy as np
from datetime import datetime
from loguru import logger
import json

class DetectorType(str, Enum):
    FID = "FID"
    TCD = "TCD"
    SCD = "SCD"
    MS = "MS"
    PID = "PID"
    ECD = "ECD"

class CarrierGas(str, Enum):
    HYDROGEN = "Hydrogen"
    HELIUM = "Helium"
    NITROGEN = "Nitrogen"
    ARGON = "Argon"

class DetectionLimitService:
    """Advanced detection limit calculation service"""
    
    def __init__(self):
        # Base S/N ratios for different detector types
        self.base_snr = {
            DetectorType.FID: 1000,
            DetectorType.TCD: 300,
            DetectorType.SCD: 2000,
            DetectorType.MS: 800,
            DetectorType.PID: 500,
            DetectorType.ECD: 1500
        }
        
        # ASTM detection limits (ppm)
        self.astm_limits = {
            DetectorType.FID: 0.1,
            DetectorType.TCD: 1.0,
            DetectorType.SCD: 0.05,
            DetectorType.MS: 0.01,
            DetectorType.PID: 0.5,
            DetectorType.ECD: 0.001
        }
        
        # Carrier gas efficiency factors
        self.carrier_efficiency = {
            CarrierGas.HYDROGEN: 1.3,
            CarrierGas.HELIUM: 1.0,
            CarrierGas.NITROGEN: 0.6,
            CarrierGas.ARGON: 0.8
        }
        
        # Compound database for typical concentrations and properties
        self.compound_data = {
            'Methane': {
                'typical_concentration': 50.0, 
                'astm_dl': 0.1,
                'molecular_weight': 16.04,
                'response_factor': 1.0,
                'volatility': 'high'
            },
            'Ethane': {
                'typical_concentration': 25.0, 
                'astm_dl': 0.08,
                'molecular_weight': 30.07,
                'response_factor': 1.2,
                'volatility': 'high'
            },
            'Propane': {
                'typical_concentration': 100.0, 
                'astm_dl': 0.06,
                'molecular_weight': 44.10,
                'response_factor': 1.5,
                'volatility': 'medium'
            },
            'Propylene': {
                'typical_concentration': 80.0, 
                'astm_dl': 0.07,
                'molecular_weight': 42.08,
                'response_factor': 1.3,
                'volatility': 'medium'
            },
            'Isobutane': {
                'typical_concentration': 75.0, 
                'astm_dl': 0.05,
                'molecular_weight': 58.12,
                'response_factor': 1.8,
                'volatility': 'medium'
            },
            'n-Butane': {
                'typical_concentration': 60.0, 
                'astm_dl': 0.05,
                'molecular_weight': 58.12,
                'response_factor': 1.8,
                'volatility': 'medium'
            },
            'Isobutylene': {
                'typical_concentration': 90.0, 
                'astm_dl': 0.06,
                'molecular_weight': 56.11,
                'response_factor': 1.6,
                'volatility': 'medium'
            },
            '1-Butene': {
                'typical_concentration': 70.0, 
                'astm_dl': 0.06,
                'molecular_weight': 56.11,
                'response_factor': 1.6,
                'volatility': 'medium'
            },
            'H2S': {
                'typical_concentration': 10.0, 
                'astm_dl': 0.1,
                'molecular_weight': 34.08,
                'response_factor': 0.8,
                'volatility': 'high'
            },
            'Ethyl Mercaptan': {
                'typical_concentration': 5.0, 
                'astm_dl': 0.2,
                'molecular_weight': 62.13,
                'response_factor': 0.6,
                'volatility': 'medium'
            }
        }
        
        # ASTM method database
        self.astm_methods = {
            'D2163': {
                'name': 'LPG Analysis',
                'dl': 0.05,
                'detector': DetectorType.FID,
                'applicable_compounds': ['Methane', 'Ethane', 'Propane', 'Butane']
            },
            'D6730': {
                'name': 'Light Hydrocarbons',
                'dl': 0.02,
                'detector': DetectorType.FID,
                'applicable_compounds': ['Methane', 'Ethane', 'Propane', 'Propylene']
            },
            'D5504': {
                'name': 'Sulfur Compounds',
                'dl': 0.1,
                'detector': DetectorType.SCD,
                'applicable_compounds': ['H2S', 'Ethyl Mercaptan']
            }
        }
    
    def calculate_detection_limit(self, params: Dict) -> Dict:
        """
        Calculate detection limit with advanced optimization
        
        Args:
            params: Dictionary containing calculation parameters
            
        Returns:
            Dictionary with calculation results
        """
        try:
            # Extract parameters
            detector_type = DetectorType(params.get('detector_type', 'FID'))
            carrier_gas = CarrierGas(params.get('carrier_gas', 'Helium'))
            detector_temp = params.get('detector_temp', 280.0)
            flow_rate = params.get('flow_rate', 2.0)
            injection_volume = params.get('injection_volume', 1.0)
            split_ratio = params.get('split_ratio', 20.0)
            sample_concentration = params.get('sample_concentration', 100.0)
            h2_flow = params.get('h2_flow', 40.0)
            air_flow = params.get('air_flow', 400.0)
            target_compound = params.get('target_compound', 'Methane')
            instrument_age = params.get('instrument_age', 5.0)
            maintenance_level = params.get('maintenance_level', 'Good')
            detector_calibration = params.get('detector_calibration', 'Good')
            column_condition = params.get('column_condition', 'Good')
            noise_level = params.get('noise_level', 'Low')
            sample_matrix = params.get('sample_matrix', 'Light Hydrocarbon')
            analysis_type = params.get('analysis_type', 'Routine')
            
            # Calculate base S/N ratio
            base_snr = self._calculate_base_snr(
                detector_type, carrier_gas, detector_temp, 
                flow_rate, injection_volume, split_ratio,
                h2_flow, air_flow, instrument_age, maintenance_level
            )
            
            # Calculate detection limit
            detection_limit = self._calculate_dl(
                base_snr, sample_concentration, target_compound,
                detector_type, carrier_gas
            )
            
            # Generate optimization suggestions
            suggestions = self._generate_optimization_suggestions(
                params, detection_limit, base_snr
            )
            
            # Calculate ASTM comparison
            astm_comparison = self._calculate_astm_comparison(
                detector_type, detection_limit, target_compound
            )
            
            # Calculate performance factors
            performance_factors = self._calculate_performance_factors(
                params, base_snr, detection_limit
            )
            
            # Calculate statistical analysis
            statistical_analysis = self._calculate_statistical_analysis(
                detection_limit, base_snr, params
            )
            
            # Calculate confidence level
            confidence_level = self._calculate_confidence_level(
                detection_limit, base_snr, params
            )
            
            # Calculate calculation time (simulated)
            calculation_time = 0.15  # Simulated calculation time
            
            return {
                'detection_limit': detection_limit,
                'signal_to_noise': base_snr,
                'confidence_level': confidence_level,
                'calculation_time': calculation_time,
                'recommendations': suggestions,
                'statistical_analysis': statistical_analysis,
                'instrument_factors': performance_factors,
                'astm_comparison': astm_comparison,
                'optimization_potential': self._calculate_optimization_potential(params, detection_limit),
                'calibration_curve': self._generate_calibration_curve_data(params, detection_limit),
                'noise_analysis': self._analyze_noise_characteristics(params, base_snr)
            }
            
        except Exception as e:
            logger.error(f"Error in detection limit calculation: {e}")
            raise
    
    def _calculate_base_snr(self, detector_type: DetectorType, 
                           carrier_gas: CarrierGas, detector_temp: float,
                           flow_rate: float, injection_volume: float,
                           split_ratio: float, h2_flow: float, 
                           air_flow: float, instrument_age: float,
                           maintenance_level: str) -> float:
        """Calculate signal-to-noise ratio based on parameters"""
        
        # Base S/N for the detector type
        base_snr = self.base_snr.get(detector_type, 1000)
        
        # Temperature effects
        if detector_type == DetectorType.FID:
            if detector_temp < 250:
                base_snr *= 0.7
            elif detector_temp > 350:
                base_snr *= 0.8
            elif 270 <= detector_temp <= 290:
                base_snr *= 1.1  # Optimal temperature range
        
        # Carrier gas effects
        carrier_multiplier = self.carrier_efficiency.get(carrier_gas, 1.0)
        base_snr *= carrier_multiplier
        
        # Flow rate effects
        if flow_rate < 1.0:
            base_snr *= 0.8
        elif flow_rate > 5.0:
            base_snr *= 0.9
        elif 1.5 <= flow_rate <= 3.0:
            base_snr *= 1.05  # Optimal flow range
        
        # Injection volume effect
        volume_factor = min(injection_volume / 1.0, 5.0)  # Max 5x benefit
        base_snr *= volume_factor
        
        # Split ratio effect (less split = more sample)
        split_factor = 20.0 / max(split_ratio, 1.0)
        base_snr *= split_factor
        
        # Detector flow optimization (FID only)
        if detector_type == DetectorType.FID:
            h2_air_ratio = air_flow / h2_flow
            if 8 <= h2_air_ratio <= 12:
                base_snr *= 1.0  # Optimal
            elif 6 <= h2_air_ratio <= 15:
                base_snr *= 0.9  # Acceptable
            else:
                base_snr *= 0.7  # Poor
        
        # Instrument age effects
        age_factor = max(0.5, 1.0 - (instrument_age * 0.02))  # 2% degradation per year
        base_snr *= age_factor
        
        # Maintenance level effects
        maintenance_factors = {
            'Excellent': 1.1,
            'Good': 1.0,
            'Fair': 0.9,
            'Poor': 0.7,
            'Neglected': 0.5
        }
        maintenance_factor = maintenance_factors.get(maintenance_level, 1.0)
        base_snr *= maintenance_factor
        
        return base_snr
    
    def _calculate_dl(self, snr: float, sample_concentration: float, 
                     target_compound: str, detector_type: DetectorType,
                     carrier_gas: CarrierGas) -> float:
        """Calculate detection limit based on S/N ratio"""
        
        # Get compound-specific base detection limit
        compound_data = self.compound_data.get(target_compound, {
            'astm_dl': 0.1,
            'response_factor': 1.0
        })
        
        base_dl = compound_data['astm_dl']
        response_factor = compound_data['response_factor']
        
        # Detection limit is inversely proportional to S/N
        # Assume 3:1 S/N is the detection limit
        detection_limit = base_dl * (3.0 / (snr / 1000.0)) / response_factor
        
        # Apply carrier gas correction
        carrier_correction = self.carrier_efficiency.get(carrier_gas, 1.0)
        detection_limit /= carrier_correction
        
        return max(detection_limit, 0.001)  # Minimum realistic DL
    
    def _generate_optimization_suggestions(self, params: Dict, 
                                         detection_limit: float, 
                                         snr: float) -> List[str]:
        """Generate intelligent optimization suggestions"""
        
        suggestions = []
        
        # Carrier gas optimization
        if params.get('carrier_gas') != 'Hydrogen':
            potential_gain = 30  # % improvement with H2
            suggestions.append(f"Switch to Hydrogen carrier gas for ~{potential_gain}% better detection limit")
        
        # Split ratio optimization
        split_ratio = params.get('split_ratio', 20.0)
        if split_ratio > 10:
            new_split = max(split_ratio / 2, 5)
            improvement = split_ratio / new_split
            suggestions.append(f"Reduce split ratio from {split_ratio:.0f}:1 to {new_split:.0f}:1 for {improvement:.1f}x better sensitivity")
        
        # Temperature optimization
        if params.get('detector_type') == 'FID':
            detector_temp = params.get('detector_temp', 280.0)
            optimal_temp = 280
            if abs(detector_temp - optimal_temp) > 20:
                suggestions.append(f"Adjust detector temperature to {optimal_temp}°C for ~15% better S/N ratio")
        
        # Detector flow optimization
        if params.get('detector_type') == 'FID':
            h2_flow = params.get('h2_flow', 40.0)
            air_flow = params.get('air_flow', 400.0)
            h2_air_ratio = air_flow / h2_flow
            if not (8 <= h2_air_ratio <= 12):
                optimal_h2 = air_flow / 10  # Target 10:1 ratio
                suggestions.append(f"Adjust H2 flow to {optimal_h2:.0f} mL/min for optimal 10:1 H2:Air ratio")
        
        # Injection volume optimization
        injection_volume = params.get('injection_volume', 1.0)
        if injection_volume < 2.0:
            suggestions.append(f"Increase injection volume to {min(injection_volume * 2, 5):.1f} μL for better sensitivity")
        
        # Column optimization
        target_compound = params.get('target_compound', 'Methane')
        if 'butene' in target_compound.lower() and params.get('column_type') not in ['LOWOX', 'PLOT Al2O3']:
            suggestions.append("Consider PLOT Al2O3 column for better olefin separation")
        
        # Advanced optimizations
        suggestions.append("Consider sample preconcentration techniques for ultra-low detection limits")
        suggestions.append("Optimize inlet liner design for better transfer efficiency")
        suggestions.append("Use electronic pressure control for better flow stability")
        
        return suggestions
    
    def _calculate_astm_comparison(self, detector_type: DetectorType, 
                                  detection_limit: float, 
                                  target_compound: str) -> Dict:
        """Calculate ASTM method comparison"""
        
        # Find applicable ASTM methods
        applicable_methods = []
        for method_id, method_data in self.astm_methods.items():
            if (method_data['detector'] == detector_type and 
                target_compound in method_data['applicable_compounds']):
                applicable_methods.append({
                    'method_id': method_id,
                    'method_name': method_data['name'],
                    'astm_dl': method_data['dl'],
                    'compliance_status': 'Compliant' if detection_limit <= method_data['dl'] else 'Non-Compliant',
                    'performance_ratio': method_data['dl'] / detection_limit
                })
        
        # Calculate overall compliance
        if applicable_methods:
            compliant_methods = [m for m in applicable_methods if m['compliance_status'] == 'Compliant']
            compliance_rate = len(compliant_methods) / len(applicable_methods)
        else:
            compliance_rate = 0.0
        
        return {
            'applicable_methods': applicable_methods,
            'compliance_rate': compliance_rate,
            'best_performance_ratio': max([m['performance_ratio'] for m in applicable_methods]) if applicable_methods else 1.0,
            'astm_compliance': compliance_rate >= 0.5
        }
    
    def _calculate_performance_factors(self, params: Dict, snr: float, 
                                     detection_limit: float) -> Dict:
        """Calculate instrument performance factors"""
        
        return {
            'signal_strength': min(snr / 1000.0, 1.0),
            'noise_level': max(0.0, 1.0 - (snr / 2000.0)),
            'sensitivity_score': max(0.0, 1.0 - (detection_limit / 0.1)),
            'optimization_potential': self._calculate_optimization_score(params),
            'instrument_condition': self._assess_instrument_condition(params),
            'method_robustness': self._assess_method_robustness(params)
        }
    
    def _calculate_statistical_analysis(self, detection_limit: float, 
                                      snr: float, params: Dict) -> Dict:
        """Calculate statistical analysis of results"""
        
        # Simulate calibration curve data
        concentrations = np.linspace(detection_limit * 0.1, detection_limit * 10, 20)
        responses = concentrations * snr / 1000.0 + np.random.normal(0, snr * 0.1, 20)
        
        # Calculate R²
        correlation_matrix = np.corrcoef(concentrations, responses)
        r_squared = correlation_matrix[0, 1] ** 2
        
        # Calculate LOD and LOQ
        lod = detection_limit * 3.3  # 3.3 × standard deviation
        loq = detection_limit * 10    # 10 × standard deviation
        
        return {
            'r_squared': r_squared,
            'calibration_curve': {
                'concentrations': concentrations.tolist(),
                'responses': responses.tolist()
            },
            'lod': lod,
            'loq': loq,
            'linear_range': {
                'lower': detection_limit * 0.1,
                'upper': detection_limit * 10
            },
            'precision': self._calculate_precision(snr),
            'accuracy': self._calculate_accuracy(params)
        }
    
    def _calculate_confidence_level(self, detection_limit: float, 
                                  snr: float, params: Dict) -> float:
        """Calculate confidence level of the detection limit"""
        
        # Base confidence on S/N ratio and parameter quality
        base_confidence = min(snr / 1000.0, 1.0)
        
        # Adjust for parameter quality
        parameter_quality = self._assess_parameter_quality(params)
        
        # Adjust for instrument condition
        instrument_condition = self._assess_instrument_condition(params)
        
        confidence = base_confidence * parameter_quality * instrument_condition
        
        return min(confidence, 0.99)  # Cap at 99%
    
    def _calculate_optimization_potential(self, params: Dict, 
                                        current_dl: float) -> Dict:
        """Calculate optimization potential"""
        
        # Estimate potential improvements
        carrier_improvement = 1.3 if params.get('carrier_gas') != 'Hydrogen' else 1.0
        split_improvement = min(params.get('split_ratio', 20.0) / 10.0, 2.0)
        temperature_improvement = 1.15 if params.get('detector_temp', 280.0) != 280.0 else 1.0
        
        total_improvement = carrier_improvement * split_improvement * temperature_improvement
        optimized_dl = current_dl / total_improvement
        
        return {
            'current_dl': current_dl,
            'optimized_dl': optimized_dl,
            'improvement_factor': total_improvement,
            'carrier_improvement': carrier_improvement,
            'split_improvement': split_improvement,
            'temperature_improvement': temperature_improvement
        }
    
    def _generate_calibration_curve_data(self, params: Dict, 
                                        detection_limit: float) -> Dict:
        """Generate calibration curve data for visualization"""
        
        # Generate realistic calibration curve
        base_concentration = detection_limit * 5
        concentrations = np.linspace(0, base_concentration * 2, 15)
        
        # Add some realistic scatter
        base_response = 1000
        responses = base_response * (concentrations / base_concentration) + np.random.normal(0, 50, 15)
        
        return {
            'concentrations': concentrations.tolist(),
            'responses': responses.tolist(),
            'detection_limit_point': detection_limit,
            'linear_range': base_concentration
        }
    
    def _analyze_noise_characteristics(self, params: Dict, snr: float) -> Dict:
        """Analyze noise characteristics"""
        
        return {
            'baseline_noise': snr * 0.1,
            'drift_rate': snr * 0.01,
            'noise_type': 'Gaussian',
            'stability_score': min(snr / 1000.0, 1.0),
            'recommendations': self._generate_noise_recommendations(params, snr)
        }
    
    # Helper methods
    def _calculate_optimization_score(self, params: Dict) -> float:
        """Calculate optimization score"""
        score = 1.0
        
        if params.get('carrier_gas') != 'Hydrogen':
            score *= 0.8
        if params.get('split_ratio', 20.0) > 15:
            score *= 0.9
        if params.get('detector_temp', 280.0) != 280.0:
            score *= 0.95
            
        return score
    
    def _assess_instrument_condition(self, params: Dict) -> float:
        """Assess instrument condition"""
        age_factor = max(0.5, 1.0 - (params.get('instrument_age', 5.0) * 0.02))
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Poor': 0.7,
            'Neglected': 0.5
        }
        maintenance_factor = maintenance_factors.get(params.get('maintenance_level', 'Good'), 0.9)
        
        return age_factor * maintenance_factor
    
    def _assess_method_robustness(self, params: Dict) -> float:
        """Assess method robustness"""
        robustness = 1.0
        
        # Check for optimal parameters
        if 1.5 <= params.get('flow_rate', 2.0) <= 3.0:
            robustness *= 1.1
        if 270 <= params.get('detector_temp', 280.0) <= 290:
            robustness *= 1.1
        if params.get('split_ratio', 20.0) <= 15:
            robustness *= 1.05
            
        return min(robustness, 1.2)
    
    def _calculate_precision(self, snr: float) -> float:
        """Calculate precision based on S/N ratio"""
        return min(snr / 1000.0, 1.0)
    
    def _calculate_accuracy(self, params: Dict) -> float:
        """Calculate accuracy based on parameters"""
        accuracy = 1.0
        
        # Reduce accuracy for suboptimal conditions
        if params.get('carrier_gas') != 'Hydrogen':
            accuracy *= 0.95
        if params.get('detector_temp', 280.0) != 280.0:
            accuracy *= 0.98
            
        return accuracy
    
    def _assess_parameter_quality(self, params: Dict) -> float:
        """Assess quality of input parameters"""
        quality = 1.0
        
        # Check for realistic parameter ranges
        if not (50 <= params.get('detector_temp', 280.0) <= 400):
            quality *= 0.9
        if not (0.5 <= params.get('flow_rate', 2.0) <= 10):
            quality *= 0.9
        if not (1 <= params.get('split_ratio', 20.0) <= 1000):
            quality *= 0.9
            
        return quality
    
    def _generate_noise_recommendations(self, params: Dict, snr: float) -> List[str]:
        """Generate noise reduction recommendations"""
        recommendations = []
        
        if snr < 500:
            recommendations.append("Check detector cleanliness and alignment")
            recommendations.append("Verify carrier gas purity")
            recommendations.append("Optimize detector flows")
        
        if params.get('instrument_age', 5.0) > 10:
            recommendations.append("Consider detector maintenance")
            recommendations.append("Check column condition")
        
        return recommendations

# Service instance
detection_limit_service = DetectionLimitService() 