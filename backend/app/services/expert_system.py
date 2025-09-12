#!/usr/bin/env python3
"""
GC Expert System for uncertainty analysis and teaching explanations
Provides expert-level insights into GC measurements and calculations
"""

import numpy as np
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from .uncertainty_calculator import UncertaintyCalculator, UncertaintyComponent, UncertaintyType


class MeasurementType(str, Enum):
    """Types of GC measurements for expert analysis"""
    FLOW = "flow"
    TEMPERATURE = "temperature"
    PRESSURE = "pressure"
    SPLIT_RATIO = "split_ratio"
    RETENTION_TIME = "retention_time"


@dataclass
class ExpertAnalysis:
    """Expert analysis result with uncertainty and explanations"""
    measurement_value: float
    uncertainty: float
    confidence_level: float
    distribution_decision: str
    expert_explanation: str
    recommendations: List[str]
    quality_assessment: str


class GCExpertSystem:
    """Expert system for GC measurement analysis and uncertainty propagation"""
    
    def __init__(self):
        self.uncertainty_calc = UncertaintyCalculator()
        self.knowledge_base = self._load_expert_knowledge()
        
    def _load_expert_knowledge(self) -> Dict[str, Any]:
        """Load expert knowledge base for GC measurements"""
        return {
            "flow_measurement": {
                "typical_uncertainty": 0.02,  # 2% for mass flow controllers
                "factors": [
                    "Mass flow controller accuracy",
                    "Temperature compensation",
                    "Pressure fluctuations",
                    "Gas purity effects"
                ],
                "best_practices": [
                    "Use NIST-traceable calibration standards",
                    "Maintain constant temperature and pressure",
                    "Regular calibration verification"
                ]
            },
            "temperature_measurement": {
                "typical_uncertainty": 1.0,  # ±1°C for GC ovens
                "factors": [
                    "Thermocouple calibration",
                    "Temperature uniformity",
                    "Thermal lag effects",
                    "Electronic stability"
                ],
                "best_practices": [
                    "Multi-point calibration verification",
                    "Use certified reference thermometers",
                    "Monitor temperature uniformity"
                ]
            },
            "split_ratio": {
                "typical_uncertainty": 0.05,  # 5% relative
                "factors": [
                    "Flow measurement accuracy",
                    "Pressure drop calculations",
                    "Viscosity corrections",
                    "Temperature effects"
                ],
                "best_practices": [
                    "Verify with actual flow measurements",
                    "Account for temperature effects",
                    "Use calibrated flow sensors"
                ]
            }
        }
    
    def analyze_measurement_with_explanation(self,
                                           value: float,
                                           std_dev: float,
                                           n: int,
                                           measurement_type: str,
                                           teaching_mode: bool = True) -> Dict[str, Any]:
        """
        Analyze measurement with expert explanations for teaching
        
        Args:
            value: Measured value
            std_dev: Standard deviation
            n: Number of measurements
            measurement_type: Type of measurement
            teaching_mode: Whether to include detailed explanations
            
        Returns:
            Dictionary with analysis results and explanations
        """
        try:
            # Calculate uncertainty components
            components = self._identify_uncertainty_components(value, std_dev, measurement_type)
            
            # Perform uncertainty analysis
            uncertainty_result = self.uncertainty_calc.calculate_combined_uncertainty(components)
            
            # Determine appropriate distribution
            distribution_info = self._select_distribution(n, std_dev, measurement_type)
            
            # Calculate coverage factor and expanded uncertainty
            coverage_factor = distribution_info["coverage_factor"]
            expanded_uncertainty = uncertainty_result["combined_uncertainty"] * coverage_factor
            
            # Generate expert explanation
            explanation = self._generate_expert_explanation(
                measurement_type, components, distribution_info, teaching_mode
            )
            
            # Quality assessment
            quality = self._assess_measurement_quality(
                expanded_uncertainty / value, measurement_type
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                measurement_type, expanded_uncertainty / value
            )
            
            result = {
                "uncertainty": round(expanded_uncertainty, 3),
                "confidence_level": 95.0,
                "coverage_factor": round(coverage_factor, 2),
                "distribution_decision": distribution_info["explanation"],
                "expert_explanation": explanation if teaching_mode else None,
                "quality_assessment": quality,
                "recommendations": recommendations if teaching_mode else [],
                "uncertainty_budget": {
                    comp.name: {
                        "value": round(comp.uncertainty, 4),
                        "contribution_percent": round(
                            (comp.uncertainty * comp.sensitivity_coefficient) ** 2 / 
                            uncertainty_result["combined_uncertainty"] ** 2 * 100, 1
                        )
                    } for comp in components
                } if teaching_mode else {}
            }
            
            logger.info(f"Expert analysis completed for {measurement_type}")
            return result
            
        except Exception as e:
            logger.error(f"Expert analysis failed: {e}")
            return {
                "uncertainty": std_dev * 2.0,  # Fallback 95% estimate
                "confidence_level": 95.0,
                "coverage_factor": 2.0,
                "distribution_decision": "Normal distribution assumed (fallback)",
                "expert_explanation": "Analysis failed, using conservative estimate",
                "quality_assessment": "Unable to assess",
                "recommendations": ["Verify measurement conditions", "Check instrument calibration"]
            }
    
    def _identify_uncertainty_components(self, 
                                       value: float, 
                                       std_dev: float,
                                       measurement_type: str) -> List[UncertaintyComponent]:
        """Identify and quantify uncertainty components"""
        components = []
        
        if measurement_type == "flow":
            # Mass flow controller accuracy
            components.append(UncertaintyComponent(
                name="MFC_accuracy",
                value=value,
                uncertainty=value * 0.02,  # 2% of reading
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular",
                sensitivity_coefficient=1.0
            ))
            
            # Temperature effects
            components.append(UncertaintyComponent(
                name="temperature_effect",
                value=value,
                uncertainty=value * 0.005,  # 0.5% temperature correction
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular",
                sensitivity_coefficient=1.0
            ))
            
            # Repeatability
            if std_dev > 0:
                components.append(UncertaintyComponent(
                    name="repeatability",
                    value=value,
                    uncertainty=std_dev,
                    uncertainty_type=UncertaintyType.TYPE_A,
                    distribution="normal",
                    sensitivity_coefficient=1.0
                ))
        
        elif measurement_type == "temperature":
            # Calibration uncertainty
            components.append(UncertaintyComponent(
                name="calibration",
                value=value,
                uncertainty=1.0,  # ±1°C calibration
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular",
                sensitivity_coefficient=1.0
            ))
            
            # Uniformity
            components.append(UncertaintyComponent(
                name="uniformity",
                value=value,
                uncertainty=2.0,  # ±2°C uniformity
                uncertainty_type=UncertaintyType.TYPE_B,
                distribution="rectangular",
                sensitivity_coefficient=1.0
            ))
        
        return components
    
    def _select_distribution(self, n: int, std_dev: float, measurement_type: str) -> Dict[str, Any]:
        """Select appropriate statistical distribution"""
        if n < 10:
            # Use t-distribution for small sample sizes
            from scipy import stats
            dof = n - 1 if n > 1 else 1
            coverage_factor = stats.t.ppf(0.975, dof)
            explanation = f"t-distribution used (n={n}, ν={dof}) for small sample size. Coverage factor k={coverage_factor:.2f}"
        else:
            # Use normal distribution for large samples
            coverage_factor = 1.96
            explanation = f"Normal distribution used (n={n} ≥ 10). Coverage factor k=1.96 for 95% confidence"
        
        return {
            "coverage_factor": coverage_factor,
            "explanation": explanation,
            "distribution": "t" if n < 10 else "normal"
        }
    
    def _generate_expert_explanation(self, 
                                   measurement_type: str,
                                   components: List[UncertaintyComponent],
                                   distribution_info: Dict[str, Any],
                                   teaching_mode: bool) -> Optional[str]:
        """Generate expert explanation for teaching purposes"""
        if not teaching_mode:
            return None
            
        knowledge = self.knowledge_base.get(measurement_type, {})
        
        explanation = f"""
EXPERT ANALYSIS FOR {measurement_type.upper()} MEASUREMENT:

Statistical Distribution:
{distribution_info['explanation']}

Uncertainty Components Identified:
"""
        for comp in components:
            explanation += f"• {comp.name}: ±{comp.uncertainty:.3f} ({comp.uncertainty_type.value})\n"
        
        explanation += f"""
Key Factors Affecting Measurement:
"""
        for factor in knowledge.get("factors", []):
            explanation += f"• {factor}\n"
        
        explanation += f"""
Best Practices:
"""
        for practice in knowledge.get("best_practices", []):
            explanation += f"• {practice}\n"
        
        return explanation.strip()
    
    def _assess_measurement_quality(self, relative_uncertainty: float, measurement_type: str) -> str:
        """Assess measurement quality based on relative uncertainty"""
        if relative_uncertainty < 0.01:  # < 1%
            return "Excellent - High precision measurement"
        elif relative_uncertainty < 0.05:  # < 5%
            return "Good - Acceptable for most applications"
        elif relative_uncertainty < 0.10:  # < 10%
            return "Fair - May need improvement for critical applications"
        else:
            return "Poor - Significant improvement needed"
    
    def _generate_recommendations(self, measurement_type: str, relative_uncertainty: float) -> List[str]:
        """Generate expert recommendations for improvement"""
        recommendations = []
        
        if relative_uncertainty > 0.05:  # > 5%
            knowledge = self.knowledge_base.get(measurement_type, {})
            recommendations.extend(knowledge.get("best_practices", []))
            
            if relative_uncertainty > 0.10:  # > 10%
                recommendations.extend([
                    "Consider instrument recalibration",
                    "Check for systematic errors",
                    "Increase number of measurements"
                ])
        
        return recommendations[:3]  # Limit to top 3 recommendations
