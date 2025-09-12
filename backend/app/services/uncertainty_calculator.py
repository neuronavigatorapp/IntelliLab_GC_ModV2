#!/usr/bin/env python3
"""
ISO GUM-compliant uncertainty propagation for GC measurements
Addresses Dr. Claude's critique on uncertainty propagation
"""

import numpy as np
from scipy import stats
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import math
from loguru import logger


class UncertaintyType(str, Enum):
    """Types of uncertainty per ISO GUM"""
    TYPE_A = "Type A"  # Statistical (random)
    TYPE_B = "Type B"  # Systematic (non-statistical)


@dataclass
class UncertaintyComponent:
    """Individual uncertainty component"""
    name: str
    value: float
    uncertainty: float
    uncertainty_type: UncertaintyType
    distribution: str = "normal"  # normal, rectangular, triangular
    degrees_freedom: Optional[int] = None
    sensitivity_coefficient: float = 1.0


class UncertaintyCalculator:
    """ISO GUM-compliant uncertainty propagation calculator"""
    
    def __init__(self):
        self.components = []
        self.correlation_matrix = None
        
    def add_component(self, component: UncertaintyComponent):
        """Add uncertainty component to calculation"""
        self.components.append(component)
        
    def calculate_combined_uncertainty(self, 
                                     components: List[UncertaintyComponent],
                                     correlation_matrix: Optional[np.ndarray] = None) -> Dict:
        """
        Calculate combined standard uncertainty per ISO GUM
        
        Args:
            components: List of uncertainty components
            correlation_matrix: Correlation matrix for correlated components
            
        Returns:
            Dictionary with uncertainty analysis results
        """
        n = len(components)
        if n == 0:
            return {"combined_uncertainty": 0.0, "error": "No components provided"}
            
        # Extract standard uncertainties and sensitivity coefficients
        u_i = np.array([comp.uncertainty for comp in components])
        c_i = np.array([comp.sensitivity_coefficient for comp in components])
        
        # Calculate combined standard uncertainty
        if correlation_matrix is not None and correlation_matrix.shape == (n, n):
            # With correlations: uc² = Σ(ci²·ui²) + 2·Σ·Σ(ci·cj·ui·uj·r(xi,xj))
            variance_terms = np.sum((c_i * u_i) ** 2)
            
            covariance_terms = 0.0
            for i in range(n):
                for j in range(i + 1, n):
                    covariance_terms += 2 * c_i[i] * c_i[j] * u_i[i] * u_i[j] * correlation_matrix[i, j]
            
            combined_variance = variance_terms + covariance_terms
        else:
            # Without correlations: uc² = Σ(ci²·ui²)
            combined_variance = np.sum((c_i * u_i) ** 2)
        
        combined_uncertainty = math.sqrt(combined_variance)
        
        # Calculate effective degrees of freedom (Welch-Satterthwaite)
        if all(comp.degrees_freedom is not None for comp in components):
            numerator = combined_variance ** 2
            denominator = sum(
                ((c_i[i] * u_i[i]) ** 4) / comp.degrees_freedom
                for i, comp in enumerate(components)
                if comp.degrees_freedom > 0
            )
            effective_dof = numerator / denominator if denominator > 0 else float('inf')
        else:
            effective_dof = float('inf')  # Assume infinite degrees of freedom
            
        # Calculate coverage factor and expanded uncertainty
        if effective_dof == float('inf'):
            coverage_factor = 1.96  # 95% confidence for normal distribution
        else:
            coverage_factor = stats.t.ppf(0.975, effective_dof)  # 95% confidence
            
        expanded_uncertainty = coverage_factor * combined_uncertainty
        
        # Uncertainty budget
        budget = []
        for i, comp in enumerate(components):
            contribution = ((c_i[i] * u_i[i]) ** 2) / combined_variance * 100
            budget.append({
                "component": comp.name,
                "standard_uncertainty": u_i[i],
                "sensitivity_coefficient": c_i[i],
                "uncertainty_contribution": c_i[i] * u_i[i],
                "percent_contribution": contribution,
                "uncertainty_type": comp.uncertainty_type.value
            })
            
        return {
            "combined_standard_uncertainty": combined_uncertainty,
            "expanded_uncertainty": expanded_uncertainty,
            "coverage_factor": coverage_factor,
            "confidence_level": "95%",
            "effective_degrees_freedom": effective_dof,
            "uncertainty_budget": sorted(budget, key=lambda x: x["percent_contribution"], reverse=True)
        }
    
    def calculate_flow_uncertainty(self,
                                 flow: float,
                                 flow_accuracy: float = 0.02,  # 2% from manufacturer
                                 temperature_uncertainty: float = 1.0,  # ±1°C
                                 pressure_uncertainty: float = 0.5,  # ±0.5 psi
                                 temperature: float = 25.0,
                                 pressure: float = 14.7) -> Dict:
        """Calculate combined uncertainty for flow measurements"""
        
        components = []
        
        # Flow controller accuracy (Type B)
        flow_unc = flow * flow_accuracy
        components.append(UncertaintyComponent(
            name="Flow Controller Accuracy",
            value=flow,
            uncertainty=flow_unc,
            uncertainty_type=UncertaintyType.TYPE_B,
            distribution="rectangular",
            sensitivity_coefficient=1.0
        ))
        
        # Temperature contribution (Type B)
        # Flow varies with temperature: F ∝ T^-0.5 for viscosity correction
        temp_sensitivity = -0.5 * flow / (temperature + 273.15)
        temp_contribution = abs(temp_sensitivity * temperature_uncertainty)
        components.append(UncertaintyComponent(
            name="Temperature Uncertainty",
            value=temperature,
            uncertainty=temperature_uncertainty,
            uncertainty_type=UncertaintyType.TYPE_B,
            distribution="rectangular",
            sensitivity_coefficient=temp_sensitivity
        ))
        
        # Pressure contribution (Type B)
        # Flow varies with pressure: F ∝ √(ΔP)
        pressure_sensitivity = 0.5 * flow / pressure
        pressure_contribution = abs(pressure_sensitivity * pressure_uncertainty)
        components.append(UncertaintyComponent(
            name="Pressure Uncertainty",
            value=pressure,
            uncertainty=pressure_uncertainty,
            uncertainty_type=UncertaintyType.TYPE_B,
            distribution="rectangular",
            sensitivity_coefficient=pressure_sensitivity
        ))
        
        # Calculate combined uncertainty
        uncertainty_analysis = self.calculate_combined_uncertainty(components)
        
        return {
            "nominal_value": flow,
            "combined_uncertainty": uncertainty_analysis["combined_standard_uncertainty"],
            "expanded_uncertainty": uncertainty_analysis["expanded_uncertainty"],
            "coverage_factor": uncertainty_analysis["coverage_factor"],
            "confidence_level": uncertainty_analysis["confidence_level"],
            "reported_value": f"{flow:.3f} ± {uncertainty_analysis['expanded_uncertainty']:.3f} mL/min",
            "relative_uncertainty_percent": (uncertainty_analysis["expanded_uncertainty"] / flow) * 100,
            "uncertainty_budget": uncertainty_analysis["uncertainty_budget"]
        }
    
    def calculate_temperature_uncertainty(self,
                                        temperature: float,
                                        calibration_uncertainty: float = 1.0,  # ±1°C calibration
                                        stability_uncertainty: float = 0.5,  # ±0.5°C stability
                                        uniformity_uncertainty: float = 2.0) -> Dict:  # ±2°C uniformity
        """Calculate combined uncertainty for temperature measurements"""
        
        components = [
            UncertaintyComponent(
                name="Calibration Uncertainty",
                value=temperature,
                uncertainty=calibration_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular"
            ),
            UncertaintyComponent(
                name="Temperature Stability",
                value=temperature,
                uncertainty=stability_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_A,
                distribution="normal"
            ),
            UncertaintyComponent(
                name="Temperature Uniformity",
                value=temperature,
                uncertainty=uniformity_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular"
            )
        ]
        
        uncertainty_analysis = self.calculate_combined_uncertainty(components)
        
        return {
            "nominal_value": temperature,
            "combined_uncertainty": uncertainty_analysis["combined_standard_uncertainty"],
            "expanded_uncertainty": uncertainty_analysis["expanded_uncertainty"],
            "reported_value": f"{temperature:.1f} ± {uncertainty_analysis['expanded_uncertainty']:.1f} °C",
            "relative_uncertainty_percent": (uncertainty_analysis["expanded_uncertainty"] / abs(temperature + 273.15)) * 100,
            "uncertainty_budget": uncertainty_analysis["uncertainty_budget"]
        }
    
    def calculate_split_ratio_uncertainty(self,
                                        split_flow: float,
                                        column_flow: float,
                                        split_flow_uncertainty: float,
                                        column_flow_uncertainty: float) -> Dict:
        """Calculate uncertainty for split ratio calculations"""
        
        split_ratio = split_flow / column_flow
        
        # Sensitivity coefficients for ratio calculation
        # Split ratio = Fs/Fc, so:
        # ∂R/∂Fs = 1/Fc
        # ∂R/∂Fc = -Fs/Fc²
        
        split_sensitivity = 1.0 / column_flow
        column_sensitivity = -split_flow / (column_flow ** 2)
        
        components = [
            UncertaintyComponent(
                name="Split Flow Uncertainty",
                value=split_flow,
                uncertainty=split_flow_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_B,
                sensitivity_coefficient=split_sensitivity
            ),
            UncertaintyComponent(
                name="Column Flow Uncertainty",
                value=column_flow,
                uncertainty=column_flow_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_B,
                sensitivity_coefficient=column_sensitivity
            )
        ]
        
        uncertainty_analysis = self.calculate_combined_uncertainty(components)
        
        return {
            "nominal_value": split_ratio,
            "combined_uncertainty": uncertainty_analysis["combined_standard_uncertainty"],
            "expanded_uncertainty": uncertainty_analysis["expanded_uncertainty"],
            "reported_value": f"{split_ratio:.1f} ± {uncertainty_analysis['expanded_uncertainty']:.1f}",
            "relative_uncertainty_percent": (uncertainty_analysis["expanded_uncertainty"] / split_ratio) * 100,
            "uncertainty_budget": uncertainty_analysis["uncertainty_budget"]
        }
    
    def calculate_retention_time_uncertainty(self,
                                           retention_time: float,
                                           temperature_uncertainty: float = 1.0,
                                           flow_uncertainty_percent: float = 2.0,
                                           injection_precision: float = 0.01) -> Dict:
        """Calculate uncertainty for retention time measurements"""
        
        # Temperature coefficient (typical -2%/°C for most compounds)
        temp_coefficient = -0.02 * retention_time
        temp_sensitivity = temp_coefficient  # min/°C
        
        # Flow rate coefficient (typical -1 for retention time vs flow)
        flow_sensitivity = -retention_time * (flow_uncertainty_percent / 100)
        
        components = [
            UncertaintyComponent(
                name="Temperature Control",
                value=retention_time,
                uncertainty=temperature_uncertainty,
                uncertainty_type=UncertaintyType.TYPE_B,
                sensitivity_coefficient=temp_sensitivity
            ),
            UncertaintyComponent(
                name="Flow Rate Control",
                value=retention_time,
                uncertainty=flow_sensitivity,
                uncertainty_type=UncertaintyType.TYPE_B,
                sensitivity_coefficient=1.0
            ),
            UncertaintyComponent(
                name="Injection Precision",
                value=retention_time,
                uncertainty=injection_precision,
                uncertainty_type=UncertaintyType.TYPE_A,
                sensitivity_coefficient=1.0
            )
        ]
        
        uncertainty_analysis = self.calculate_combined_uncertainty(components)
        
        return {
            "nominal_value": retention_time,
            "combined_uncertainty": uncertainty_analysis["combined_standard_uncertainty"],
            "expanded_uncertainty": uncertainty_analysis["expanded_uncertainty"],
            "reported_value": f"{retention_time:.3f} ± {uncertainty_analysis['expanded_uncertainty']:.3f} min",
            "relative_uncertainty_percent": (uncertainty_analysis["expanded_uncertainty"] / retention_time) * 100,
            "uncertainty_budget": uncertainty_analysis["uncertainty_budget"]
        }


# Global instance
uncertainty_calculator = UncertaintyCalculator()
