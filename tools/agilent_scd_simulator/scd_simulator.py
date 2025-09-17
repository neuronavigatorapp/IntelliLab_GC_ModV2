#!/usr/bin/env python3
"""
Bulletproof Agilent 355/8355 SCD Simulator & Troubleshooter
Enterprise-grade sulfur chemiluminescence detector simulation and diagnostics
"""

import logging
import time
import functools
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np
from datetime import datetime

# =================== BULLETPROOF ENTERPRISE INFRASTRUCTURE ===================

class SCDComponent(Enum):
    """SCD component identifiers"""
    BURNER = "Burner Assembly"
    PMT = "Photomultiplier Tube"
    OZONE_GENERATOR = "Ozone Generator"
    SO2_SCRUBBER = "SO2 Scrubber"
    AIR_SUPPLY = "Air Supply"
    H2_SUPPLY = "Hydrogen Supply"
    VACUUM_PUMP = "Vacuum Pump"
    CERAMIC_TUBE = "Ceramic Reaction Tube"

class SCDStatus(Enum):
    """SCD operational status"""
    OPTIMAL = "Optimal Performance"
    WARNING = "Performance Warning"
    CRITICAL = "Critical Issue"
    OFFLINE = "Offline/Failed"

@dataclass
class SCDParameters:
    """SCD operational parameters"""
    air_flow_ml_min: float
    h2_flow_ml_min: float
    burner_temperature: float
    pmt_voltage: int
    ozone_flow_ml_min: float
    vacuum_level_torr: float
    ceramic_tube_temperature: float

@dataclass
class SCDDiagnostics:
    """SCD diagnostic results"""
    component: SCDComponent
    status: SCDStatus
    current_value: float
    optimal_range: Tuple[float, float]
    deviation_percent: float
    recommendations: List[str]
    troubleshooting_steps: List[str]

@dataclass
class SCDPerformance:
    """SCD performance metrics"""
    sulfur_sensitivity_pg_s: float
    signal_to_noise_ratio: float
    baseline_stability: float
    detection_limit_ng_s: float
    linearity_r2: float
    response_time_s: float
    selectivity_ratio: float
    temperature_coefficient: float
    flame_stability_index: float

@dataclass 
class ComponentDegradation:
    """Component degradation analysis"""
    component: SCDComponent
    age_hours: float
    degradation_percent: float
    failure_probability: float
    remaining_life_hours: float
    maintenance_priority: str
    failure_indicators: List[str]

class FailureMode(Enum):
    """SCD component failure modes"""
    PMT_AGING = "PMT Photocathode Aging"
    PMT_NOISE = "PMT Excessive Noise"
    OZONE_UV_DEGRADATION = "UV Lamp Degradation"
    CERAMIC_FOULING = "Ceramic Tube Fouling"
    FLAME_INSTABILITY = "Flame Instability"
    BURNER_CONTAMINATION = "Burner Contamination"
    VACUUM_LEAK = "Vacuum System Leak"
    GAS_CONTAMINATION = "Gas Line Contamination"
    TEMPERATURE_DRIFT = "Temperature Control Drift"
    FLOW_CONTROLLER_DRIFT = "Flow Controller Drift"

def setup_bulletproof_logging(name: str) -> logging.Logger:
    """Setup enterprise logging"""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        try:
            file_handler = logging.FileHandler('scd_simulator.log', encoding='utf-8')
            file_handler.setLevel(logging.DEBUG)
            
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
            )
            
            console_handler.setFormatter(formatter)
            file_handler.setFormatter(formatter)
            
            logger.addHandler(console_handler) 
            logger.addHandler(file_handler)
            
        except Exception:
            logger.addHandler(console_handler)
    
    return logger

def monitor_performance(func):
    """Enterprise performance monitoring decorator"""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        start_time = time.time()
        method_name = f"{self.__class__.__name__}.{func.__name__}"
        
        self.logger.info(f"Starting {func.__name__} with args: {len(args)}, kwargs: {len(kwargs)}")
        
        try:
            result = func(self, *args, **kwargs)
            execution_time = time.time() - start_time
            self.logger.info(f"Completed {func.__name__} in {execution_time:.3f}s")
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.logger.error(f"{method_name} failed after {execution_time:.3f}s: {str(e)}")
            raise
    
    return wrapper

class AgilentSCDSimulator:
    """Bulletproof Enterprise Agilent 355/8355 SCD Simulator"""
    
    def __init__(self):
        # =================== BULLETPROOF INITIALIZATION ===================
        self.logger = setup_bulletproof_logging('tools.scd.AgilentSCDSimulator')
        self.logger.info("Initializing Bulletproof Agilent SCD Simulator")
        
        # Performance metrics
        self.simulations_performed = 0
        self.diagnostics_performed = 0
        self.total_simulation_time = 0.0
        
        # SCD specifications and databases
        self.scd_specifications = self._load_scd_specifications()
        self.optimal_parameters = self._load_optimal_parameters()
        self.troubleshooting_database = self._load_troubleshooting_database()
        self.compound_responses = self._load_compound_response_database()
        self.component_failure_db = self._load_component_failure_database()
        self.matrix_interference_db = self._load_matrix_interference_database()
        
        # Expert-level component tracking
        self.component_usage_hours = {}
        self.performance_history = []
        self.failure_predictions = {}
        
        self.logger.info("Agilent SCD simulator initialized successfully")
    
    def _load_component_failure_database(self) -> Dict[str, Dict]:
        """Load expert component failure analysis database"""
        return {
            "PMT": {
                "typical_lifetime_hours": 8760,  # 1 year continuous
                "degradation_rate_per_1000h": 2.5,  # % sensitivity loss
                "failure_indicators": [
                    "Dark current >0.5 nA",
                    "Gain decrease >20%",
                    "Noise increase >3x baseline"
                ],
                "predictive_parameters": {
                    "voltage_stress_factor": 1.5,  # Higher voltage = faster aging
                    "temperature_factor": 1.2,     # Higher temp = faster aging
                    "light_exposure_factor": 2.0   # Light leaks accelerate aging
                }
            },
            "Ozone_Generator": {
                "typical_lifetime_hours": 4380,  # 6 months continuous
                "degradation_rate_per_1000h": 5.0,
                "failure_indicators": [
                    "UV output <70% of new",
                    "Ozone production <15 ppm",
                    "Lamp current drift >20%"
                ],
                "predictive_parameters": {
                    "power_cycle_factor": 1.3,
                    "contamination_factor": 1.8,
                    "temperature_factor": 1.1
                }
            },
            "Ceramic_Tube": {
                "typical_lifetime_hours": 2190,  # 3 months continuous
                "degradation_rate_per_1000h": 8.0,
                "failure_indicators": [
                    "Visible deposits/discoloration",
                    "Peak tailing factor >2.0",
                    "Temperature nonuniformity >±10°C"
                ],
                "predictive_parameters": {
                    "sulfur_exposure_factor": 2.5,
                    "temperature_factor": 1.8,
                    "matrix_complexity_factor": 1.6
                }
            },
            "Burner": {
                "typical_lifetime_hours": 4380,
                "degradation_rate_per_1000h": 3.0,
                "failure_indicators": [
                    "Flame color change",
                    "Temperature instability >±5°C",
                    "Carbon deposits visible"
                ],
                "predictive_parameters": {
                    "contamination_factor": 2.0,
                    "flow_rate_factor": 1.2,
                    "maintenance_factor": 0.7
                }
            }
        }
    
    def _load_scd_specifications(self) -> Dict[str, Dict]:
        """Load Agilent 355/8355 SCD specifications"""
        return {
            "Agilent 355 SCD": {
                "sensitivity_pg_s": 0.5,  # Detection limit
                "linear_range_decades": 4,
                "max_temperature": 1000,
                "response_time_s": 0.5,
                "air_flow_range": [60, 120],  # mL/min
                "h2_flow_range": [40, 80],   # mL/min
                "selectivity": 10**6         # C/S selectivity
            },
            "Agilent 8355 SCD": {
                "sensitivity_pg_s": 0.2,    # Enhanced sensitivity
                "linear_range_decades": 5,
                "max_temperature": 1200,
                "response_time_s": 0.3,
                "air_flow_range": [80, 150], # mL/min
                "h2_flow_range": [50, 100],  # mL/min
                "selectivity": 5*10**6       # Enhanced selectivity
            }
        }
    
    def _load_optimal_parameters(self) -> Dict[str, SCDParameters]:
        """Load optimal operating parameters for different SCD models"""
        return {
            "Agilent 355 SCD": SCDParameters(
                air_flow_ml_min=85.0,
                h2_flow_ml_min=55.0,
                burner_temperature=800.0,
                pmt_voltage=800,
                ozone_flow_ml_min=15.0,
                vacuum_level_torr=5.0,
                ceramic_tube_temperature=1000.0
            ),
            "Agilent 8355 SCD": SCDParameters(
                air_flow_ml_min=110.0,
                h2_flow_ml_min=70.0,
                burner_temperature=850.0,
                pmt_voltage=900,
                ozone_flow_ml_min=20.0,
                vacuum_level_torr=3.0,
                ceramic_tube_temperature=1100.0
            )
        }
    
    def _load_troubleshooting_database(self) -> Dict[str, Dict]:
        """Load comprehensive troubleshooting database with expert-level diagnostics"""
        return {
            "Low Sensitivity": {
                "symptoms": ["Weak sulfur peaks", "High detection limits", "Poor S/N ratio"],
                "causes": [
                    "PMT voltage too low",
                    "Contaminated ceramic tube", 
                    "Insufficient air flow",
                    "Ozone generator failing",
                    "Burner contamination"
                ],
                "solutions": [
                    "Increase PMT voltage (750-950V)",
                    "Replace ceramic reaction tube",
                    "Optimize air flow (80-120 mL/min)",
                    "Service ozone generator",
                    "Clean burner assembly"
                ],
                "expert_diagnostics": {
                    "pmt_dark_current_test": "Measure dark current <0.1 nA at 800V",
                    "ceramic_tube_inspection": "Check for sulfur deposits (yellow/brown coloration)",
                    "flame_color_analysis": "Blue flame = good; yellow/orange = contamination",
                    "ozone_concentration_test": "Should be 15-25 ppm at detector outlet"
                }
            },
            "PMT Aging": {
                "symptoms": ["Gradual sensitivity loss", "Increased noise", "Dark current drift"],
                "causes": ["Photocathode degradation", "Internal contamination", "High voltage stress"],
                "solutions": ["Replace PMT", "Reduce operating voltage", "Check for light leaks"],
                "expert_diagnostics": {
                    "photocurrent_test": "Test with known light source - <80% of new PMT response",
                    "dark_current_drift": "Monitor over 30 min - should be <5% change",
                    "gain_stability": "Check gain at different voltages - should be linear"
                }
            },
            "Ozone Generator Degradation": {
                "symptoms": ["Poor chemiluminescence", "Low ozone output", "UV lamp failure"],
                "causes": ["UV lamp aging", "Contaminated optics", "Power supply issues"],
                "solutions": ["Replace UV lamp", "Clean optical surfaces", "Check power supply"],
                "expert_diagnostics": {
                    "uv_intensity_test": "Measure at 185nm - should be >75% of new lamp",
                    "ozone_production_rate": "Test with O2 input - should produce 20-30 ppm O3",
                    "lamp_current_check": "Verify 200-400mA operating current"
                }
            },
            "Ceramic Tube Fouling": {
                "symptoms": ["Peak tailing", "Memory effects", "Reduced efficiency"],
                "causes": ["Sulfur compound deposits", "Carbon buildup", "Metal contamination"],
                "solutions": ["Condition at high temperature", "Replace ceramic tube", "Use cleaning compounds"],
                "expert_diagnostics": {
                    "visual_inspection": "Look for discoloration, cracks, deposits",
                    "temperature_profile": "Check uniformity across tube length",
                    "cleaning_efficiency": "Test before/after conditioning cycles"
                }
            },
            "Flame Stability Issues": {
                "symptoms": ["Flickering baseline", "Periodic noise", "Temperature fluctuations"],
                "causes": ["Flow rate variations", "Pressure fluctuations", "Contaminated gases"],
                "solutions": ["Check gas pressures", "Replace gas filters", "Calibrate flow controllers"],
                "expert_diagnostics": {
                    "flame_visualization": "Use flame ionization detector mode if available",
                    "pressure_stability": "Monitor inlet pressures - should be ±1 psi",
                    "flow_controller_drift": "Check calibration with external flow meter"
                }
            },
            "Baseline Instability": {
                "symptoms": ["Drifting baseline", "Noisy signal", "Random spikes"],
                "causes": [
                    "Temperature fluctuations",
                    "Gas flow instabilities", 
                    "PMT noise",
                    "Vacuum leaks",
                    "Contaminated gas lines"
                ],
                "solutions": [
                    "Check thermal stability",
                    "Verify gas pressures and flows",
                    "Replace PMT if >5 years old",
                    "Check vacuum system integrity",
                    "Replace gas filters"
                ]
            },
            "No Response": {
                "symptoms": ["No sulfur peaks", "Flat baseline", "Zero signal"],
                "causes": [
                    "PMT failure",
                    "Burner not ignited",
                    "Gas flow blockage",
                    "Ozone generator off",
                    "Vacuum system failure"
                ],
                "solutions": [
                    "Replace PMT",
                    "Check burner ignition and temperature",
                    "Clear gas line blockages",
                    "Restart ozone generation",
                    "Service vacuum pump"
                ]
            },
            "Peak Tailing": {
                "symptoms": ["Asymmetric peaks", "Poor chromatography", "Carryover"],
                "causes": [
                    "Ceramic tube degradation",
                    "Cold spots in transfer line",
                    "Insufficient temperature",
                    "Active sites in detector"
                ],
                "solutions": [
                    "Replace ceramic tube",
                    "Heat transfer line to 250°C",
                    "Increase burner temperature",
                    "Condition detector with sulfur standards"
                ]
            }
        }
    
    def _load_compound_response_database(self) -> Dict[str, Dict]:
        """Load comprehensive sulfur compound response database with matrix effects"""
        return {
            # =================== PRIMARY SULFUR COMPOUNDS ===================
            "H2S": {
                "response_factor": 1.15,
                "retention_time_min": 0.8,
                "molecular_weight": 34.08,
                "sulfur_content": 94.1,
                "volatility": "very_high",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 0.95, "interference_level": "low"},
                    "natural_gas": {"response_multiplier": 1.05, "interference_level": "none"},
                    "biofuel": {"response_multiplier": 0.90, "interference_level": "medium"}
                },
                "detection_challenges": ["Memory effects", "Rapid elution", "Corrosion potential"]
            },
            "Thiophene": {
                "response_factor": 1.0,  # Reference compound
                "retention_time_min": 3.5,
                "molecular_weight": 84.14,
                "sulfur_content": 38.1,
                "volatility": "high",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 1.0, "interference_level": "none"},
                    "coal_tar": {"response_multiplier": 0.85, "interference_level": "medium"},
                    "shale_oil": {"response_multiplier": 0.92, "interference_level": "low"}
                },
                "detection_challenges": ["Standard reference", "Minimal interference"]
            },
            "2-Methylthiophene": {
                "response_factor": 0.98,
                "retention_time_min": 4.1,
                "molecular_weight": 98.17,
                "sulfur_content": 32.7,
                "volatility": "high",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 0.95, "interference_level": "low"},
                    "gasoline": {"response_multiplier": 0.88, "interference_level": "medium"}
                },
                "detection_challenges": ["Co-elution with aromatics", "Matrix suppression"]
            },
            "3-Methylthiophene": {
                "response_factor": 0.96,
                "retention_time_min": 4.3,
                "molecular_weight": 98.17,
                "sulfur_content": 32.7,
                "volatility": "high",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 0.94, "interference_level": "low"},
                    "jet_fuel": {"response_multiplier": 0.91, "interference_level": "medium"}
                },
                "detection_challenges": ["Isomer separation", "Matrix complexity"]
            },
            "Benzothiophene": {
                "response_factor": 0.95,
                "retention_time_min": 8.2,
                "molecular_weight": 134.20,
                "sulfur_content": 23.9,
                "volatility": "medium",
                "matrix_effects": {
                    "diesel": {"response_multiplier": 0.90, "interference_level": "medium"},
                    "heavy_crude": {"response_multiplier": 0.82, "interference_level": "high"},
                    "heating_oil": {"response_multiplier": 0.87, "interference_level": "medium"}
                },
                "detection_challenges": ["Heavy matrix interference", "Peak broadening"]
            },
            "2-Methylbenzothiophene": {
                "response_factor": 0.93,
                "retention_time_min": 9.8,
                "molecular_weight": 148.23,
                "sulfur_content": 21.6,
                "volatility": "medium",
                "matrix_effects": {
                    "diesel": {"response_multiplier": 0.88, "interference_level": "high"},
                    "biodiesel": {"response_multiplier": 0.75, "interference_level": "very_high"}
                },
                "detection_challenges": ["Severe matrix effects", "Poor peak shape"]
            },
            "Dibenzothiophene": {
                "response_factor": 0.90,
                "retention_time_min": 15.8,
                "molecular_weight": 184.26,
                "sulfur_content": 17.4,
                "volatility": "low",
                "matrix_effects": {
                    "heavy_crude": {"response_multiplier": 0.75, "interference_level": "very_high"},
                    "vacuum_gas_oil": {"response_multiplier": 0.80, "interference_level": "high"},
                    "residual_fuel": {"response_multiplier": 0.70, "interference_level": "extreme"}
                },
                "detection_challenges": ["Extreme matrix suppression", "Thermal decomposition"]
            },
            "4,6-Dimethyldibenzothiophene": {
                "response_factor": 0.85,
                "retention_time_min": 18.5,
                "molecular_weight": 212.31,
                "sulfur_content": 15.1,
                "volatility": "low",
                "matrix_effects": {
                    "heavy_crude": {"response_multiplier": 0.65, "interference_level": "extreme"},
                    "bitumen": {"response_multiplier": 0.60, "interference_level": "extreme"}
                },
                "detection_challenges": ["Refractory compound", "Extreme suppression", "Poor volatility"]
            },

            # =================== MERCAPTANS & SULFIDES ===================
            "Methanethiol": {
                "response_factor": 1.12,
                "retention_time_min": 1.0,
                "molecular_weight": 48.11,
                "sulfur_content": 66.7,
                "volatility": "very_high",
                "matrix_effects": {
                    "natural_gas": {"response_multiplier": 1.08, "interference_level": "none"},
                    "lpg": {"response_multiplier": 1.02, "interference_level": "low"}
                },
                "detection_challenges": ["Extreme volatility", "Memory effects", "Odorant levels"]
            },
            "Ethanethiol": {
                "response_factor": 1.10,
                "retention_time_min": 1.5,
                "molecular_weight": 62.13,
                "sulfur_content": 51.6,
                "volatility": "very_high",
                "matrix_effects": {
                    "gasoline": {"response_multiplier": 0.95, "interference_level": "medium"},
                    "natural_gas": {"response_multiplier": 1.05, "interference_level": "low"}
                },
                "detection_challenges": ["Odorant interference", "Rapid breakthrough"]
            },
            "Dimethyl Sulfide": {
                "response_factor": 1.05,
                "retention_time_min": 1.2,
                "molecular_weight": 62.13,
                "sulfur_content": 51.6,
                "volatility": "very_high",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 0.92, "interference_level": "medium"},
                    "biofuel": {"response_multiplier": 0.85, "interference_level": "high"}
                },
                "detection_challenges": ["Biogenic interference", "Matrix complexity"]
            },
            "Diethyl Sulfide": {
                "response_factor": 1.02,
                "retention_time_min": 3.8,
                "molecular_weight": 90.19,
                "sulfur_content": 35.5,
                "volatility": "high",
                "matrix_effects": {
                    "gasoline": {"response_multiplier": 0.88, "interference_level": "high"},
                    "aviation_fuel": {"response_multiplier": 0.91, "interference_level": "medium"}
                },
                "detection_challenges": ["Hydrocarbon co-elution", "Matrix suppression"]
            },

            # =================== DISULFIDES & POLYSULFIDES ===================
            "Dimethyl Disulfide": {
                "response_factor": 0.92,
                "retention_time_min": 5.2,
                "molecular_weight": 94.19,
                "sulfur_content": 68.1,
                "volatility": "medium",
                "matrix_effects": {
                    "petroleum": {"response_multiplier": 0.85, "interference_level": "medium"},
                    "sour_crude": {"response_multiplider": 0.78, "interference_level": "high"}
                },
                "detection_challenges": ["Thermal instability", "Decomposition products"]
            },

            # =================== INTERFERENCE COMPOUNDS ===================
            "Toluene": {
                "response_factor": 0.0001,  # Minimal sulfur response
                "retention_time_min": 3.2,
                "molecular_weight": 92.14,
                "sulfur_content": 0.0,
                "volatility": "high",
                "interference_type": "co_elution",
                "interference_level": "medium",
                "mitigation": "Use selective SCD conditions or different column"
            },
            "Xylene": {
                "response_factor": 0.0002,
                "retention_time_min": 4.8,
                "molecular_weight": 106.17,
                "sulfur_content": 0.0,
                "volatility": "medium",
                "interference_type": "peak_overlap",
                "interference_level": "low",
                "mitigation": "Optimize temperature program"
            },
            "Naphthalene": {
                "response_factor": 0.0005,
                "retention_time_min": 12.1,
                "molecular_weight": 128.17,
                "sulfur_content": 0.0,
                "volatility": "medium",
                "interference_type": "matrix_suppression",
                "interference_level": "high",
                "mitigation": "Use matrix-matched standards"
            },

            # =================== SULFUR OXIDES & ACIDS ===================
            "SO2": {
                "response_factor": 0.05,  # Poor SCD response to oxidized forms
                "retention_time_min": 2.1,
                "molecular_weight": 64.06,
                "sulfur_content": 50.0,
                "volatility": "high", 
                "detection_challenges": ["Oxidized sulfur", "Poor chemiluminescence", "Scrubber interference"]
            },
            "Sulfuric_Acid": {
                "response_factor": 0.01,
                "retention_time_min": 25.0,  # Late elution, poor volatility
                "molecular_weight": 98.08,
                "sulfur_content": 32.7,
                "volatility": "very_low",
                "detection_challenges": ["Non-volatile", "Acid damage", "Thermal decomposition"]
            }
        }

    def _load_matrix_interference_database(self) -> Dict[str, Dict]:
        """Load matrix-specific interference patterns"""
        return {
            "petroleum_crude": {
                "primary_interferences": ["Heavy aromatics", "Asphaltenes", "Metal complexes"],
                "suppression_factor": 0.75,
                "recommended_dilution": "1:10 with isooctane",
                "cleanup_required": True,
                "matrix_complexity": "very_high"
            },
            "gasoline": {
                "primary_interferences": ["BTEX aromatics", "Oxygenates", "Odorants"],
                "suppression_factor": 0.85,
                "recommended_dilution": "1:5 with n-pentane",
                "cleanup_required": False,
                "matrix_complexity": "medium"
            },
            "diesel_fuel": {
                "primary_interferences": ["PAH compounds", "Biodiesel blend", "Additives"],
                "suppression_factor": 0.80,
                "recommended_dilution": "1:10 with n-hexane",
                "cleanup_required": True,
                "matrix_complexity": "high"
            },
            "natural_gas": {
                "primary_interferences": ["Odorants", "CO2", "N2"],
                "suppression_factor": 0.95,
                "recommended_dilution": "Direct injection",
                "cleanup_required": False,
                "matrix_complexity": "low"
            },
            "biofuel": {
                "primary_interferences": ["Fatty acid methyl esters", "Glycerides", "Antioxidants"],
                "suppression_factor": 0.70,
                "recommended_dilution": "1:20 with toluene",
                "cleanup_required": True,
                "matrix_complexity": "very_high"
            }
        }
    
    @monitor_performance
    def simulate_scd_performance(
        self,
        scd_model: str,
        parameters: SCDParameters,
        sample_compounds: List[str],
        sample_concentration_ppm: float
    ) -> SCDPerformance:
        """Simulate SCD performance with given parameters"""
        
        self.logger.info(f"Simulating {scd_model} performance")
        
        if scd_model not in self.scd_specifications:
            raise ValueError(f"Unknown SCD model: {scd_model}")
        
        specs = self.scd_specifications[scd_model]
        optimal = self.optimal_parameters[scd_model]
        
        # Calculate performance metrics based on parameter deviations
        sensitivity = self._calculate_sensitivity(parameters, optimal, specs)
        snr = self._calculate_signal_to_noise_ratio(parameters, optimal, sample_concentration_ppm)
        baseline_stability = self._calculate_baseline_stability(parameters, optimal)
        detection_limit = self._calculate_detection_limit(sensitivity, snr)
        linearity = self._calculate_linearity(parameters, optimal)
        response_time = self._calculate_response_time(parameters, specs)
        
        performance = SCDPerformance(
            sulfur_sensitivity_pg_s=sensitivity,
            signal_to_noise_ratio=snr,
            baseline_stability=baseline_stability,
            detection_limit_ng_s=detection_limit,
            linearity_r2=linearity,
            response_time_s=response_time
        )
        
        self.simulations_performed += 1
        self.logger.info(f"SCD simulation completed: sensitivity={sensitivity:.2f} pg/s")
        
        return performance
    
    @monitor_performance
    def diagnose_scd_system(
        self,
        scd_model: str,
        current_parameters: SCDParameters,
        observed_issues: List[str]
    ) -> List[SCDDiagnostics]:
        """Comprehensive SCD system diagnostics"""
        
        self.logger.info(f"Diagnosing {scd_model} system")
        
        diagnostics = []
        optimal = self.optimal_parameters[scd_model]
        
        # Diagnose each component
        components_to_check = [
            (SCDComponent.AIR_SUPPLY, current_parameters.air_flow_ml_min, optimal.air_flow_ml_min, 15.0),
            (SCDComponent.H2_SUPPLY, current_parameters.h2_flow_ml_min, optimal.h2_flow_ml_min, 10.0),
            (SCDComponent.BURNER, current_parameters.burner_temperature, optimal.burner_temperature, 50.0),
            (SCDComponent.PMT, current_parameters.pmt_voltage, optimal.pmt_voltage, 100.0),
            (SCDComponent.OZONE_GENERATOR, current_parameters.ozone_flow_ml_min, optimal.ozone_flow_ml_min, 5.0),
            (SCDComponent.VACUUM_PUMP, current_parameters.vacuum_level_torr, optimal.vacuum_level_torr, 2.0),
            (SCDComponent.CERAMIC_TUBE, current_parameters.ceramic_tube_temperature, optimal.ceramic_tube_temperature, 100.0)
        ]
        
        for component, current, optimal_val, tolerance in components_to_check:
            diagnostic = self._diagnose_component(
                component, current, optimal_val, tolerance, observed_issues
            )
            diagnostics.append(diagnostic)
        
        self.diagnostics_performed += 1
        self.logger.info(f"SCD diagnostics completed: {len(diagnostics)} components checked")
        
        return diagnostics
    
    def _calculate_sensitivity(self, params: SCDParameters, optimal: SCDParameters, specs: Dict) -> float:
        """Calculate SCD sensitivity based on parameter deviations"""
        
        base_sensitivity = specs["sensitivity_pg_s"]
        
        # Air flow effect (critical for combustion)
        air_ratio = params.air_flow_ml_min / optimal.air_flow_ml_min
        air_efficiency = max(0.3, min(1.0, 1 - abs(air_ratio - 1.0)))
        
        # Hydrogen flow effect
        h2_ratio = params.h2_flow_ml_min / optimal.h2_flow_ml_min
        h2_efficiency = max(0.4, min(1.0, 1 - abs(h2_ratio - 1.0) * 0.8))
        
        # Temperature effect (burner)
        temp_ratio = params.burner_temperature / optimal.burner_temperature
        temp_efficiency = max(0.2, min(1.0, 1 - abs(temp_ratio - 1.0) * 1.5))
        
        # PMT voltage effect
        pmt_ratio = params.pmt_voltage / optimal.pmt_voltage
        pmt_efficiency = max(0.1, min(1.2, pmt_ratio))
        
        # Ozone effect
        ozone_ratio = params.ozone_flow_ml_min / optimal.ozone_flow_ml_min
        ozone_efficiency = max(0.3, min(1.0, 1 - abs(ozone_ratio - 1.0) * 0.6))
        
        # Combined efficiency
        total_efficiency = (air_efficiency * h2_efficiency * temp_efficiency * 
                          pmt_efficiency * ozone_efficiency)
        
        calculated_sensitivity = base_sensitivity / total_efficiency
        
        return max(calculated_sensitivity, base_sensitivity * 0.1)  # Minimum 10% of spec
    
    def _calculate_signal_to_noise_ratio(
        self, 
        params: SCDParameters, 
        optimal: SCDParameters, 
        concentration_ppm: float
    ) -> float:
        """Calculate signal-to-noise ratio"""
        
        # Base SNR for 1 ppm sulfur compound
        base_snr = 1000.0
        
        # Concentration scaling (linear in log scale)
        conc_factor = max(0.1, concentration_ppm)
        
        # Parameter stability effects
        temp_stability = max(0.5, 1 - abs(params.ceramic_tube_temperature - optimal.ceramic_tube_temperature) / 200.0)
        flow_stability = max(0.6, 1 - abs(params.air_flow_ml_min - optimal.air_flow_ml_min) / 50.0)
        vacuum_stability = max(0.7, 1 - abs(params.vacuum_level_torr - optimal.vacuum_level_torr) / 3.0)
        
        stability_factor = temp_stability * flow_stability * vacuum_stability
        
        calculated_snr = base_snr * conc_factor * stability_factor
        
        return max(calculated_snr, 10.0)  # Minimum SNR of 10
    
    def _calculate_baseline_stability(self, params: SCDParameters, optimal: SCDParameters) -> float:
        """Calculate baseline stability percentage"""
        
        base_stability = 95.0  # %
        
        # Temperature stability is critical
        temp_deviation = abs(params.ceramic_tube_temperature - optimal.ceramic_tube_temperature)
        temp_penalty = (temp_deviation / 100.0) * 15.0  # 15% penalty per 100°C deviation
        
        # Flow stability
        flow_deviation = abs(params.air_flow_ml_min - optimal.air_flow_ml_min)
        flow_penalty = (flow_deviation / 20.0) * 10.0  # 10% penalty per 20 mL/min deviation
        
        # PMT stability
        pmt_deviation = abs(params.pmt_voltage - optimal.pmt_voltage)
        pmt_penalty = (pmt_deviation / 100.0) * 5.0  # 5% penalty per 100V deviation
        
        stability = base_stability - temp_penalty - flow_penalty - pmt_penalty
        
        return max(stability, 20.0)  # Minimum 20% stability
    
    def _calculate_detection_limit(self, sensitivity: float, snr: float) -> float:
        """Calculate detection limit in ng/s"""
        
        # Detection limit = sensitivity * (3 / SNR) 
        # Factor of 3 for 3-sigma detection limit
        detection_limit = sensitivity * (3.0 / max(snr, 1.0)) * 1000  # Convert pg to ng
        
        return max(detection_limit, 0.001)  # Minimum 1 pg/s
    
    def _calculate_linearity(self, params: SCDParameters, optimal: SCDParameters) -> float:
        """Calculate linearity R²"""
        
        base_linearity = 0.9995
        
        # Parameter stability affects linearity
        stability_score = self._calculate_baseline_stability(params, optimal) / 100.0
        
        # PMT voltage affects linearity through response uniformity
        pmt_ratio = params.pmt_voltage / optimal.pmt_voltage
        pmt_factor = max(0.8, min(1.0, 1 - abs(pmt_ratio - 1.0) * 0.3))
        
        linearity = base_linearity * stability_score * pmt_factor
        
        return max(linearity, 0.90)  # Minimum R² of 0.90
    
    def _calculate_response_time(self, params: SCDParameters, specs: Dict) -> float:
        """Calculate detector response time"""
        
        base_response_time = specs["response_time_s"]
        
        # Higher temperatures = faster response
        temp_factor = max(0.8, min(1.5, params.ceramic_tube_temperature / 1000.0))
        
        # Flow rates affect mixing and response
        flow_factor = max(0.9, min(1.2, (params.air_flow_ml_min + params.h2_flow_ml_min) / 150.0))
        
        response_time = base_response_time / (temp_factor * flow_factor)
        
        return max(response_time, 0.1)  # Minimum 0.1 s
    
    def _diagnose_component(
        self,
        component: SCDComponent,
        current_value: float,
        optimal_value: float,
        tolerance: float,
        observed_issues: List[str]
    ) -> SCDDiagnostics:
        """Diagnose individual SCD component"""
        
        # Calculate deviation
        deviation_percent = abs((current_value - optimal_value) / optimal_value) * 100.0
        
        # Determine status
        if deviation_percent <= 5.0:
            status = SCDStatus.OPTIMAL
        elif deviation_percent <= 15.0:
            status = SCDStatus.WARNING
        else:
            status = SCDStatus.CRITICAL
        
        # Generate recommendations based on component and deviation
        recommendations = self._generate_component_recommendations(
            component, current_value, optimal_value, deviation_percent
        )
        
        # Generate troubleshooting steps
        troubleshooting_steps = self._generate_troubleshooting_steps(
            component, observed_issues, deviation_percent
        )
        
        return SCDDiagnostics(
            component=component,
            status=status,
            current_value=current_value,
            optimal_range=(optimal_value - tolerance, optimal_value + tolerance),
            deviation_percent=deviation_percent,
            recommendations=recommendations,
            troubleshooting_steps=troubleshooting_steps
        )
    
    def _generate_component_recommendations(
        self,
        component: SCDComponent,
        current: float,
        optimal: float,
        deviation: float
    ) -> List[str]:
        """Generate specific recommendations for each component"""
        
        recommendations = []
        
        if component == SCDComponent.AIR_SUPPLY:
            if current < optimal:
                recommendations.append(f"Increase air flow to {optimal:.0f} mL/min for optimal combustion")
            else:
                recommendations.append(f"Reduce air flow to {optimal:.0f} mL/min to prevent flame blowout")
            
        elif component == SCDComponent.H2_SUPPLY:
            if current < optimal:
                recommendations.append(f"Increase hydrogen flow to {optimal:.0f} mL/min for complete combustion")
            else:
                recommendations.append(f"Reduce hydrogen flow to {optimal:.0f} mL/min to prevent reducing conditions")
        
        elif component == SCDComponent.BURNER:
            if current < optimal:
                recommendations.append(f"Increase burner temperature to {optimal:.0f}°C for complete S→SO conversion")
            else:
                recommendations.append(f"Reduce temperature to {optimal:.0f}°C to prevent ceramic tube damage")
        
        elif component == SCDComponent.PMT:
            if current < optimal:
                recommendations.append(f"Increase PMT voltage to {optimal:.0f}V for better sensitivity")
            else:
                recommendations.append(f"Reduce PMT voltage to {optimal:.0f}V to prevent noise and degradation")
        
        elif component == SCDComponent.OZONE_GENERATOR:
            recommendations.append(f"Adjust ozone flow to {optimal:.0f} mL/min for optimal SO2→SO2* conversion")
        
        elif component == SCDComponent.VACUUM_PUMP:
            recommendations.append(f"Adjust vacuum to {optimal:.1f} Torr for proper gas flow dynamics")
        
        elif component == SCDComponent.CERAMIC_TUBE:
            if current < optimal:
                recommendations.append(f"Increase reaction temperature to {optimal:.0f}°C")
            else:
                recommendations.append(f"Check ceramic tube integrity at {current:.0f}°C")
        
        if deviation > 20.0:
            recommendations.append("Consider system recalibration or component replacement")
        
        return recommendations
    
    def _generate_troubleshooting_steps(
        self,
        component: SCDComponent,
        observed_issues: List[str],
        deviation: float
    ) -> List[str]:
        """Generate troubleshooting steps based on component and issues"""
        
        steps = []
        
        # Map observed issues to troubleshooting procedures
        for issue in observed_issues:
            if issue.lower() in ["low sensitivity", "weak peaks", "poor detection"]:
                if component in [SCDComponent.PMT, SCDComponent.BURNER, SCDComponent.OZONE_GENERATOR]:
                    steps.extend(self.troubleshooting_database["Low Sensitivity"]["solutions"])
            
            elif issue.lower() in ["baseline drift", "noise", "instability"]:
                if component in [SCDComponent.VACUUM_PUMP, SCDComponent.AIR_SUPPLY, SCDComponent.CERAMIC_TUBE]:
                    steps.extend(self.troubleshooting_database["Baseline Instability"]["solutions"])
            
            elif issue.lower() in ["no response", "no signal", "detector dead"]:
                steps.extend(self.troubleshooting_database["No Response"]["solutions"])
            
            elif issue.lower() in ["peak tailing", "poor peaks", "carryover"]:
                if component in [SCDComponent.CERAMIC_TUBE, SCDComponent.BURNER]:
                    steps.extend(self.troubleshooting_database["Peak Tailing"]["solutions"])
        
        # Add component-specific troubleshooting if high deviation
        if deviation > 15.0:
            if component == SCDComponent.PMT:
                steps.append("Test PMT with known sulfur standard")
                steps.append("Check PMT dark current and noise levels")
            
            elif component == SCDComponent.BURNER:
                steps.append("Check burner flame color and stability")
                steps.append("Clean burner jet and ceramic tube")
            
            elif component == SCDComponent.OZONE_GENERATOR:
                steps.append("Check ozone generator UV lamp intensity")
                steps.append("Verify ozone destruction catalyst")
        
        return list(set(steps))  # Remove duplicates
    
    @monitor_performance
    def analyze_component_degradation(
        self,
        component: SCDComponent,
        usage_hours: float,
        current_performance: Dict[str, float],
        operating_conditions: Dict[str, float]
    ) -> ComponentDegradation:
        """Expert-level component degradation analysis"""
        
        # Map component to failure database key
        component_map = {
            SCDComponent.PMT: "PMT",
            SCDComponent.OZONE_GENERATOR: "Ozone_Generator", 
            SCDComponent.CERAMIC_TUBE: "Ceramic_Tube",
            SCDComponent.BURNER: "Burner"
        }
        
        if component not in component_map:
            # Return default analysis for other components
            return ComponentDegradation(
                component=component,
                age_hours=usage_hours,
                degradation_percent=min(50.0, usage_hours / 100.0),
                failure_probability=min(0.8, usage_hours / 10000.0),
                remaining_life_hours=max(0, 5000 - usage_hours),
                maintenance_priority="Monitor",
                failure_indicators=[]
            )
        
        failure_data = self.component_failure_db[component_map[component]]
        
        # Calculate base degradation
        base_degradation = (usage_hours / 1000.0) * failure_data["degradation_rate_per_1000h"]
        
        # Apply stress factors
        stress_multiplier = 1.0
        for factor, value in operating_conditions.items():
            if factor in failure_data["predictive_parameters"]:
                stress_multiplier *= failure_data["predictive_parameters"][factor] * value
        
        total_degradation = min(95.0, base_degradation * stress_multiplier)
        
        # Calculate failure probability
        typical_lifetime = failure_data["typical_lifetime_hours"]
        failure_probability = min(0.95, (usage_hours / typical_lifetime) * stress_multiplier)
        
        # Estimate remaining life
        remaining_life = max(0, typical_lifetime - (usage_hours * stress_multiplier))
        
        # Determine maintenance priority
        if failure_probability > 0.8 or total_degradation > 75:
            priority = "URGENT - Replace Immediately"
        elif failure_probability > 0.5 or total_degradation > 50:
            priority = "HIGH - Schedule Replacement"
        elif failure_probability > 0.3 or total_degradation > 25:
            priority = "MEDIUM - Monitor Closely"
        else:
            priority = "LOW - Normal Operation"
        
        # Check for failure indicators
        active_indicators = []
        for indicator in failure_data["failure_indicators"]:
            if self._check_failure_indicator(component, indicator, current_performance):
                active_indicators.append(indicator)
        
        return ComponentDegradation(
            component=component,
            age_hours=usage_hours,
            degradation_percent=total_degradation,
            failure_probability=failure_probability,
            remaining_life_hours=remaining_life,
            maintenance_priority=priority,
            failure_indicators=active_indicators
        )
    
    def _check_failure_indicator(
        self, 
        component: SCDComponent, 
        indicator: str, 
        performance: Dict[str, float]
    ) -> bool:
        """Check if specific failure indicator is present"""
        
        # PMT indicators
        if "Dark current" in indicator and "dark_current" in performance:
            threshold = float(indicator.split('>')[1].split(' ')[0])
            return performance["dark_current"] > threshold
            
        if "Gain decrease" in indicator and "gain_factor" in performance:
            threshold = float(indicator.split('>')[1].split('%')[0])
            return performance["gain_factor"] < (100 - threshold) / 100.0
            
        if "Noise increase" in indicator and "noise_level" in performance:
            multiplier = float(indicator.split('>')[1].split('x')[0])
            baseline_noise = performance.get("baseline_noise", 1.0)
            return performance["noise_level"] > (baseline_noise * multiplier)
        
        # Ozone generator indicators
        if "UV output" in indicator and "uv_intensity" in performance:
            threshold = float(indicator.split('<')[1].split('%')[0])
            return performance["uv_intensity"] < threshold / 100.0
            
        if "Ozone production" in indicator and "ozone_concentration" in performance:
            threshold = float(indicator.split('<')[1].split(' ')[0])
            return performance["ozone_concentration"] < threshold
        
        # Ceramic tube indicators  
        if "Peak tailing factor" in indicator and "tailing_factor" in performance:
            threshold = float(indicator.split('>')[1])
            return performance["tailing_factor"] > threshold
            
        if "Temperature nonuniformity" in indicator and "temp_uniformity" in performance:
            threshold = float(indicator.split('>±')[1].split('°')[0])
            return performance["temp_uniformity"] > threshold
        
        # Default: indicator not detected
        return False
    
    @monitor_performance
    def predict_maintenance_needs(
        self,
        scd_model: str,
        component_ages: Dict[SCDComponent, float],
        operating_conditions: Dict[str, float],
        performance_metrics: SCDPerformance
    ) -> Dict[str, Any]:
        """Predictive maintenance analysis"""
        
        predictions = {}
        total_risk_score = 0.0
        
        # Analyze each critical component
        critical_components = [
            SCDComponent.PMT,
            SCDComponent.OZONE_GENERATOR,
            SCDComponent.CERAMIC_TUBE,
            SCDComponent.BURNER
        ]
        
        for component in critical_components:
            age_hours = component_ages.get(component, 0)
            
            # Mock current performance data (in real system this would come from sensors)
            mock_performance = {
                "dark_current": 0.3,
                "gain_factor": 0.85,
                "noise_level": 2.5,
                "baseline_noise": 1.0,
                "uv_intensity": 0.75,
                "ozone_concentration": 18.0,
                "tailing_factor": 1.8,
                "temp_uniformity": 8.0
            }
            
            degradation = self.analyze_component_degradation(
                component, age_hours, mock_performance, operating_conditions
            )
            
            predictions[component.value] = {
                "degradation_percent": degradation.degradation_percent,
                "failure_probability": degradation.failure_probability,
                "remaining_life_days": degradation.remaining_life_hours / 24,
                "priority": degradation.maintenance_priority,
                "indicators": degradation.failure_indicators
            }
            
            total_risk_score += degradation.failure_probability
        
        # Overall system assessment
        average_risk = total_risk_score / len(critical_components)
        
        if average_risk > 0.7:
            system_status = "CRITICAL - Immediate Action Required"
            recommended_action = "Schedule emergency maintenance within 24 hours"
        elif average_risk > 0.5:
            system_status = "WARNING - Maintenance Needed"
            recommended_action = "Schedule maintenance within 1 week"
        elif average_risk > 0.3:
            system_status = "ATTENTION - Monitor Closely"
            recommended_action = "Increase monitoring frequency, plan maintenance"
        else:
            system_status = "NORMAL - Continue Operation"
            recommended_action = "Continue routine maintenance schedule"
        
        return {
            "system_status": system_status,
            "overall_risk_score": average_risk,
            "recommended_action": recommended_action,
            "component_predictions": predictions,
            "next_maintenance_component": min(
                predictions.keys(),
                key=lambda k: predictions[k]["remaining_life_days"]
            ),
            "estimated_downtime_hours": self._estimate_maintenance_downtime(predictions)
        }
    
    def _estimate_maintenance_downtime(self, predictions: Dict) -> float:
        """Estimate maintenance downtime based on components needing service"""
        
        downtime_map = {
            "PMT": 4.0,                    # 4 hours to replace PMT
            "Ozone Generator": 2.0,        # 2 hours for UV lamp replacement
            "Ceramic Reaction Tube": 6.0,  # 6 hours for tube replacement
            "Burner Assembly": 3.0         # 3 hours for burner service
        }
        
        total_downtime = 0.0
        for component, prediction in predictions.items():
            if prediction["failure_probability"] > 0.5:
                total_downtime += downtime_map.get(component, 2.0)
        
        # Add 1 hour for system warmup and testing
        return total_downtime + 1.0 if total_downtime > 0 else 0.0
    
    @monitor_performance
    def machine_learning_failure_prediction(
        self,
        component: SCDComponent,
        historical_data: List[Dict[str, float]],
        current_conditions: Dict[str, float]
    ) -> Dict[str, Any]:
        """Advanced ML-based failure prediction using trend analysis"""
        
        if len(historical_data) < 10:
            return {
                "prediction_confidence": 0.0,
                "failure_probability_30_days": 0.0,
                "recommended_action": "Insufficient data for ML prediction",
                "trend_analysis": "Not available"
            }
        
        # Simulate advanced trend analysis (in real implementation, use scikit-learn)
        performance_trend = []
        time_points = []
        
        for i, data_point in enumerate(historical_data):
            # Calculate composite performance score
            score = 100.0
            
            if "sensitivity" in data_point:
                score *= min(1.0, data_point["sensitivity"] / 1.0)  # Normalize to 1.0 pg/s baseline
            if "noise_level" in data_point:
                score *= max(0.1, 1.0 / data_point["noise_level"])   # Lower noise = higher score
            if "stability" in data_point:
                score *= data_point["stability"] / 100.0            # Normalize percentage
                
            performance_trend.append(score)
            time_points.append(i)
        
        # Calculate trend slope (simple linear regression)
        n = len(performance_trend)
        if n >= 3:
            sum_x = sum(time_points)
            sum_y = sum(performance_trend)
            sum_xy = sum(x * y for x, y in zip(time_points, performance_trend))
            sum_x2 = sum(x * x for x in time_points)
            
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
            intercept = (sum_y - slope * sum_x) / n
            
            # R-squared calculation
            y_mean = sum_y / n
            ss_tot = sum((y - y_mean) ** 2 for y in performance_trend)
            ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(time_points, performance_trend))
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        else:
            slope = 0
            r_squared = 0
        
        # Predict failure probability
        degradation_rate = abs(slope) if slope < 0 else 0
        current_performance = performance_trend[-1] if performance_trend else 50.0
        
        # Exponential decay model for failure prediction
        failure_threshold = 30.0  # Performance score below which failure is likely
        
        if current_performance <= failure_threshold:
            failure_prob_30_days = 0.8
        elif degradation_rate == 0:
            failure_prob_30_days = 0.1
        else:
            # Calculate time to reach failure threshold
            days_to_failure = max(1, (current_performance - failure_threshold) / (degradation_rate * 7))  # Weekly degradation
            failure_prob_30_days = min(0.95, max(0.05, 1.0 / (days_to_failure / 30.0)))
        
        # Confidence based on data quality and trend consistency
        confidence = min(0.95, r_squared * (n / 20.0))  # Higher confidence with more data and better fit
        
        # Generate recommendations
        if failure_prob_30_days > 0.7:
            action = "URGENT: Schedule immediate replacement"
        elif failure_prob_30_days > 0.5:
            action = "HIGH: Plan replacement within 2 weeks"
        elif failure_prob_30_days > 0.3:
            action = "MEDIUM: Monitor weekly, plan maintenance"
        else:
            action = "LOW: Continue routine monitoring"
        
        # Trend analysis
        if slope < -1.0:
            trend = "Rapid degradation detected"
        elif slope < -0.5:
            trend = "Moderate degradation trend"
        elif slope < 0:
            trend = "Slight performance decline"
        elif slope > 0.5:
            trend = "Performance improving"
        else:
            trend = "Stable performance"
        
        return {
            "prediction_confidence": confidence,
            "failure_probability_30_days": failure_prob_30_days,
            "recommended_action": action,
            "trend_analysis": trend,
            "degradation_rate_per_week": degradation_rate,
            "current_performance_score": current_performance,
            "data_points_analyzed": n,
            "trend_r_squared": r_squared
        }
    
    @monitor_performance
    def statistical_process_control(
        self,
        parameter_name: str,
        recent_values: List[float],
        control_limits: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Statistical process control analysis for SCD parameters"""
        
        if len(recent_values) < 5:
            return {"status": "insufficient_data", "message": "Need at least 5 data points"}
        
        # Calculate statistical measures
        mean_value = sum(recent_values) / len(recent_values)
        variance = sum((x - mean_value) ** 2 for x in recent_values) / (len(recent_values) - 1)
        std_dev = variance ** 0.5
        
        # Set default control limits if not provided (±3 sigma)
        if control_limits is None:
            control_limits = {
                "upper_control_limit": mean_value + 3 * std_dev,
                "lower_control_limit": mean_value - 3 * std_dev,
                "upper_warning_limit": mean_value + 2 * std_dev,
                "lower_warning_limit": mean_value - 2 * std_dev
            }
        
        # Check for control violations
        violations = []
        warning_points = []
        
        for i, value in enumerate(recent_values):
            if (value > control_limits["upper_control_limit"] or 
                value < control_limits["lower_control_limit"]):
                violations.append(f"Point {i+1}: {value:.3f} outside control limits")
            elif (value > control_limits["upper_warning_limit"] or 
                  value < control_limits["lower_warning_limit"]):
                warning_points.append(f"Point {i+1}: {value:.3f} in warning zone")
        
        # Check for trends (7 consecutive points on same side of centerline)
        above_center = sum(1 for x in recent_values[-7:] if x > mean_value)
        below_center = sum(1 for x in recent_values[-7:] if x < mean_value)
        
        trend_detected = False
        if len(recent_values) >= 7:
            if above_center == 7:
                violations.append("Trend detected: 7 consecutive points above centerline")
                trend_detected = True
            elif below_center == 7:
                violations.append("Trend detected: 7 consecutive points below centerline")
                trend_detected = True
        
        # Process capability (if specification limits provided)
        process_capability = None
        if parameter_name in ["sensitivity", "stability", "snr"]:
            # Example specification limits
            spec_limits = {
                "sensitivity": {"upper": 2.0, "lower": 0.1},  # pg/s
                "stability": {"upper": 100.0, "lower": 90.0},  # %
                "snr": {"upper": 10000, "lower": 100}         # ratio
            }
            
            if parameter_name in spec_limits:
                usl = spec_limits[parameter_name]["upper"]
                lsl = spec_limits[parameter_name]["lower"]
                
                cp = (usl - lsl) / (6 * std_dev) if std_dev > 0 else float('inf')
                cpk = min((usl - mean_value) / (3 * std_dev), 
                         (mean_value - lsl) / (3 * std_dev)) if std_dev > 0 else float('inf')
                
                process_capability = {
                    "cp": cp,
                    "cpk": cpk,
                    "capability_assessment": "Excellent" if cpk >= 2.0 
                                           else "Good" if cpk >= 1.33
                                           else "Marginal" if cpk >= 1.0
                                           else "Poor"
                }
        
        # Overall status
        if violations:
            status = "out_of_control"
        elif warning_points:
            status = "warning"
        else:
            status = "in_control"
        
        return {
            "status": status,
            "mean": mean_value,
            "standard_deviation": std_dev,
            "control_limits": control_limits,
            "violations": violations,
            "warning_points": warning_points,
            "trend_detected": trend_detected,
            "process_capability": process_capability,
            "data_points": len(recent_values),
            "latest_value": recent_values[-1]
        }
    
    @monitor_performance
    def optimize_parameters_expert(
        self,
        scd_model: str,
        sample_matrix: str,
        target_compounds: List[str],
        detector_condition: Dict[str, float]
    ) -> SCDParameters:
        """Expert-level parameter optimization based on conditions"""
        
        base_params = self.optimal_parameters[scd_model]
        
        # Matrix-specific adjustments
        matrix_adjustments = {
            "petroleum": {"air_flow": 1.1, "h2_flow": 1.0, "temperature": 1.05},
            "biofuel": {"air_flow": 1.05, "h2_flow": 0.95, "temperature": 1.02},
            "natural_gas": {"air_flow": 0.95, "h2_flow": 1.05, "temperature": 0.98},
            "coal_derived": {"air_flow": 1.15, "h2_flow": 1.1, "temperature": 1.08}
        }
        
        adjustments = matrix_adjustments.get(sample_matrix, {
            "air_flow": 1.0, "h2_flow": 1.0, "temperature": 1.0
        })
        
        # Component condition adjustments
        pmt_efficiency = detector_condition.get("pmt_efficiency", 1.0)
        ozone_efficiency = detector_condition.get("ozone_efficiency", 1.0)
        
        # Calculate optimized parameters
        optimized = SCDParameters(
            air_flow_ml_min=base_params.air_flow_ml_min * adjustments["air_flow"],
            h2_flow_ml_min=base_params.h2_flow_ml_min * adjustments["h2_flow"],
            burner_temperature=base_params.burner_temperature * adjustments["temperature"],
            pmt_voltage=min(950, int(base_params.pmt_voltage / pmt_efficiency)),
            ozone_flow_ml_min=base_params.ozone_flow_ml_min / ozone_efficiency,
            vacuum_level_torr=base_params.vacuum_level_torr,
            ceramic_tube_temperature=base_params.ceramic_tube_temperature * adjustments["temperature"]
        )
        
        self.logger.info(f"Optimized parameters for {sample_matrix} matrix")
        
        return optimized
    
    @monitor_performance
    def calculate_compound_selectivity(
        self,
        target_compound: str,
        matrix_type: str,
        interference_compounds: List[str]
    ) -> Dict[str, float]:
        """Calculate advanced selectivity metrics for complex matrices"""
        
        if target_compound not in self.compound_responses:
            raise ValueError(f"Unknown target compound: {target_compound}")
        
        target_data = self.compound_responses[target_compound]
        selectivity_metrics = {}
        
        # Base selectivity (C/S ratio from specifications)
        base_selectivity = 10**6  # Typical SCD selectivity
        
        # Matrix-specific effects
        matrix_effect = target_data.get("matrix_effects", {}).get(matrix_type, {})
        matrix_suppression = matrix_effect.get("response_multiplier", 1.0)
        
        # Calculate interference from co-eluting compounds
        total_interference = 0.0
        for interference_compound in interference_compounds:
            if interference_compound in self.compound_responses:
                interference_data = self.compound_responses[interference_compound]
                
                # Time window for co-elution (±0.2 min)
                target_rt = target_data["retention_time_min"]
                interference_rt = interference_data["retention_time_min"]
                
                if abs(target_rt - interference_rt) <= 0.2:
                    # Calculate interference contribution
                    interference_response = interference_data.get("response_factor", 0.0)
                    total_interference += interference_response * 0.1  # 10% cross-response
        
        # Effective selectivity
        effective_selectivity = (base_selectivity * matrix_suppression) / (1.0 + total_interference)
        
        selectivity_metrics = {
            "base_selectivity": base_selectivity,
            "matrix_suppression_factor": matrix_suppression,
            "interference_level": total_interference,
            "effective_selectivity": effective_selectivity,
            "detection_feasibility": "Excellent" if effective_selectivity > 10**5 
                                   else "Good" if effective_selectivity > 10**4
                                   else "Poor" if effective_selectivity > 10**3
                                   else "Not Recommended"
        }
        
        return selectivity_metrics
    
    @monitor_performance
    def optimize_method_conditions(
        self,
        scd_model: str,
        target_compounds: List[str],
        matrix_type: str,
        sensitivity_requirement: float,
        analysis_time_target: float
    ) -> Dict[str, Any]:
        """Advanced method optimization for specific analytical requirements"""
        
        self.logger.info(f"Optimizing method for {len(target_compounds)} compounds in {matrix_type}")
        
        # Start with base optimized parameters
        detector_condition = {"pmt_efficiency": 0.9, "ozone_efficiency": 0.85}
        base_params = self.optimize_parameters_expert(
            scd_model, matrix_type, target_compounds, detector_condition
        )
        
        # Matrix-specific optimizations
        matrix_data = self.matrix_interference_db.get(matrix_type, {})
        
        optimizations = {
            "detector_parameters": base_params,
            "sample_preparation": {
                "dilution_factor": matrix_data.get("recommended_dilution", "Direct"),
                "cleanup_required": matrix_data.get("cleanup_required", False),
                "matrix_complexity": matrix_data.get("matrix_complexity", "medium")
            },
            "method_conditions": {},
            "performance_predictions": {}
        }
        
        # Temperature program optimization
        if analysis_time_target < 15.0:  # Fast analysis
            optimizations["method_conditions"].update({
                "initial_temperature": 40,
                "initial_hold_time": 2.0,
                "ramp_rate": 15,  # Fast ramp
                "final_temperature": 300,
                "final_hold_time": 2.0,
                "total_runtime": analysis_time_target
            })
        else:  # High resolution analysis
            optimizations["method_conditions"].update({
                "initial_temperature": 35,
                "initial_hold_time": 3.0,
                "ramp_rate": 8,   # Slower for better separation
                "final_temperature": 320,
                "final_hold_time": 5.0,
                "total_runtime": analysis_time_target
            })
        
        # Predict performance for each target compound
        for compound in target_compounds:
            if compound in self.compound_responses:
                compound_data = self.compound_responses[compound]
                
                # Calculate matrix-adjusted response
                matrix_effect = compound_data.get("matrix_effects", {}).get(matrix_type, {})
                adjusted_response = (compound_data["response_factor"] * 
                                   matrix_effect.get("response_multiplier", 1.0))
                
                # Estimate detection limit
                base_sensitivity = self.scd_specifications[scd_model]["sensitivity_pg_s"]
                predicted_dl = base_sensitivity / adjusted_response
                
                optimizations["performance_predictions"][compound] = {
                    "adjusted_response_factor": adjusted_response,
                    "predicted_detection_limit": predicted_dl,
                    "meets_requirement": predicted_dl <= sensitivity_requirement,
                    "interference_level": matrix_effect.get("interference_level", "unknown"),
                    "challenges": compound_data.get("detection_challenges", [])
                }
        
        # Overall method assessment
        compounds_meeting_spec = sum(
            1 for pred in optimizations["performance_predictions"].values()
            if pred["meets_requirement"]
        )
        
        success_rate = compounds_meeting_spec / len(target_compounds) if target_compounds else 0.0
        
        optimizations["method_assessment"] = {
            "compounds_meeting_spec": compounds_meeting_spec,
            "total_compounds": len(target_compounds),
            "success_rate_percent": success_rate * 100,
            "overall_feasibility": "Excellent" if success_rate >= 0.9
                                 else "Good" if success_rate >= 0.7
                                 else "Marginal" if success_rate >= 0.5
                                 else "Poor",
            "recommended_actions": self._generate_method_recommendations(
                success_rate, matrix_type, optimizations["performance_predictions"]
            )
        }
        
        return optimizations
    
    def _generate_method_recommendations(
        self,
        success_rate: float,
        matrix_type: str,
        performance_predictions: Dict
    ) -> List[str]:
        """Generate expert recommendations for method improvement"""
        
        recommendations = []
        
        if success_rate < 0.7:
            recommendations.append("Consider sample cleanup or dilution to reduce matrix effects")
            
            # Check for specific issues
            high_interference_compounds = [
                comp for comp, pred in performance_predictions.items()
                if pred["interference_level"] in ["high", "very_high", "extreme"]
            ]
            
            if high_interference_compounds:
                recommendations.append(
                    f"High matrix interference detected for: {', '.join(high_interference_compounds[:3])}"
                )
                recommendations.append("Use matrix-matched calibration standards")
        
        if matrix_type in ["heavy_crude", "bitumen", "residual_fuel"]:
            recommendations.append("Consider thermal desorption or headspace sampling")
            recommendations.append("Increase detector temperature to prevent condensation")
        
        if success_rate < 0.5:
            recommendations.append("Alternative detection method may be required (e.g., MS)")
            recommendations.append("Consider two-dimensional GC for better separation")
        
        failing_compounds = [
            comp for comp, pred in performance_predictions.items()
            if not pred["meets_requirement"]
        ]
        
        if failing_compounds:
            recommendations.append(
                f"Sensitivity issues for: {', '.join(failing_compounds[:3])}"
            )
            recommendations.append("Optimize PMT voltage and ozone flow for maximum sensitivity")
        
        return recommendations
    
    @monitor_performance
    def guided_troubleshooting_workflow(
        self,
        reported_symptoms: List[str],
        current_parameters: SCDParameters,
        recent_performance: Dict[str, float]
    ) -> Dict[str, Any]:
        """Expert-guided troubleshooting with step-by-step diagnostics"""
        
        workflow = {
            "primary_diagnosis": None,
            "confidence_level": 0.0,
            "diagnostic_steps": [],
            "immediate_actions": [],
            "detailed_procedures": [],
            "expected_outcomes": [],
            "escalation_criteria": []
        }
        
        # Analyze symptoms and match to diagnostic patterns
        symptom_patterns = {
            "no_response": ["no signal", "flat baseline", "zero response", "dead detector"],
            "low_sensitivity": ["weak peaks", "poor detection", "high detection limits"],
            "baseline_issues": ["drift", "noise", "instability", "spikes"],
            "peak_shape": ["tailing", "broadening", "asymmetry", "poor resolution"],
            "temperature_issues": ["thermal", "heating", "cooling", "temperature"]
        }
        
        # Match symptoms to patterns
        detected_issues = []
        for issue_type, keywords in symptom_patterns.items():
            symptom_text = " ".join(reported_symptoms).lower()
            if any(keyword in symptom_text for keyword in keywords):
                detected_issues.append(issue_type)
        
        # Primary diagnosis based on most likely issue
        if not detected_issues:
            workflow["primary_diagnosis"] = "General Performance Check"
            workflow["confidence_level"] = 0.5
        else:
            primary_issue = detected_issues[0]  # Take first detected issue
            workflow["primary_diagnosis"] = primary_issue
            workflow["confidence_level"] = 0.8 if len(detected_issues) == 1 else 0.6
        
        # Generate diagnostic workflow based on primary diagnosis
        if workflow["primary_diagnosis"] == "no_response":
            workflow.update(self._generate_no_response_workflow(current_parameters))
        elif workflow["primary_diagnosis"] == "low_sensitivity":
            workflow.update(self._generate_sensitivity_workflow(current_parameters, recent_performance))
        elif workflow["primary_diagnosis"] == "baseline_issues":
            workflow.update(self._generate_baseline_workflow(current_parameters))
        elif workflow["primary_diagnosis"] == "peak_shape":
            workflow.update(self._generate_peak_shape_workflow(current_parameters))
        else:
            workflow.update(self._generate_general_workflow(current_parameters))
        
        return workflow
    
    def _generate_no_response_workflow(self, params: SCDParameters) -> Dict:
        """Diagnostic workflow for no detector response"""
        return {
            "diagnostic_steps": [
                "1. Check PMT power supply and voltage settings",
                "2. Verify burner ignition and flame presence", 
                "3. Test gas flow rates (Air and H2)",
                "4. Check ozone generator operation",
                "5. Verify vacuum system operation",
                "6. Test detector electrical connections"
            ],
            "immediate_actions": [
                "SAFETY: Ensure proper ventilation before checking gas flows",
                "Check PMT voltage reading on display",
                "Look for burner flame through viewport (if available)",
                "Verify gas supply pressures are adequate"
            ],
            "detailed_procedures": [
                "PMT Test: Set voltage to 800V, measure dark current (<0.1 nA expected)",
                "Burner Test: Check H2 ignition - should see blue flame, temp >800°C",
                "Flow Test: Verify air flow 80-120 mL/min, H2 flow 40-80 mL/min",
                "Ozone Test: Check UV lamp current (200-400 mA) and ozone output",
                "Vacuum Test: Should achieve <10 Torr, no audible leaks"
            ],
            "expected_outcomes": [
                "PMT dark current <0.1 nA indicates good PMT",
                "Stable blue flame indicates proper combustion",
                "Stable flow rates indicate good gas supplies",
                "Normal ozone output enables chemiluminescence"
            ],
            "escalation_criteria": [
                "PMT dark current >1.0 nA - Replace PMT",
                "No flame ignition - Check gas supplies and igniter",
                "No vacuum - Service vacuum pump",
                "No ozone output - Replace UV lamp"
            ]
        }
    
    def _generate_sensitivity_workflow(self, params: SCDParameters, performance: Dict) -> Dict:
        """Diagnostic workflow for low sensitivity issues"""
        return {
            "diagnostic_steps": [
                "1. Inject sulfur standard (1 ppm thiophene)",
                "2. Measure peak response and calculate S/N ratio",
                "3. Check PMT voltage and optimize if needed",
                "4. Verify ozone generator performance",
                "5. Inspect ceramic reaction tube condition",
                "6. Check for system contamination"
            ],
            "immediate_actions": [
                "Record current sensitivity with thiophene standard",
                "Check PMT voltage - should be 750-950V",
                "Verify ozone flow rate and concentration",
                "Inspect ceramic tube for discoloration/deposits"
            ],
            "detailed_procedures": [
                f"Standard Test: Inject 1 μL of 1 ppm thiophene, expect >10,000:1 S/N",
                f"PMT Optimization: Current setting {params.pmt_voltage}V, try ±100V steps",
                f"Ozone Check: Should produce 15-25 ppm O3 at current flow {params.ozone_flow_ml_min} mL/min",
                "Ceramic Inspection: Look for yellow/brown sulfur deposits, cracks, or carbon buildup"
            ],
            "expected_outcomes": [
                "1 ppm thiophene should give >1000 mV peak height",
                "S/N ratio should be >1000:1 for good sensitivity",
                "Clean ceramic tube shows white/beige color",
                "Proper ozone concentration gives strong chemiluminescence"
            ],
            "escalation_criteria": [
                "S/N ratio <100:1 - Replace ceramic tube",
                "No improvement with PMT voltage changes - Replace PMT",
                "Ozone concentration <10 ppm - Replace UV lamp",
                "Heavy contamination visible - Full system cleaning required"
            ]
        }
    
    def _generate_baseline_workflow(self, params: SCDParameters) -> Dict:
        """Diagnostic workflow for baseline stability issues"""
        return {
            "diagnostic_steps": [
                "1. Monitor baseline for 30 minutes without injection",
                "2. Check temperature stability of all heated zones",
                "3. Verify gas flow stability and pressure regulation",
                "4. Test PMT dark current and noise characteristics",
                "5. Check for vacuum leaks or contamination",
                "6. Evaluate electronic noise sources"
            ],
            "immediate_actions": [
                "Record baseline noise level over 10 minutes",
                "Check all temperature controllers for stability",
                "Monitor gas pressure gauges for fluctuations",
                "Look for obvious contamination or leaks"
            ],
            "detailed_procedures": [
                "Baseline Test: Record signal for 30 min, calculate RMS noise",
                f"Temperature Check: Burner should be ±2°C of {params.burner_temperature}°C",
                f"Flow Stability: Air and H2 flows should be ±2% of set points",
                "PMT Dark Current: Measure with detector head covered, should be <0.1 nA"
            ],
            "expected_outcomes": [
                "Baseline noise should be <2% of full scale",
                "Temperature stability within ±2°C",
                "Gas flows stable within ±2%",
                "Dark current stable and low"
            ],
            "escalation_criteria": [
                "Baseline drift >5%/hour - Check for leaks",
                "Temperature instability >±5°C - Service temperature controller",
                "Flow instability >±5% - Replace flow controllers",
                "Excessive PMT noise - Replace PMT"
            ]
        }
    
    def _generate_peak_shape_workflow(self, params: SCDParameters) -> Dict:
        """Diagnostic workflow for peak shape problems"""
        return {
            "diagnostic_steps": [
                "1. Inject test compounds and analyze peak shapes",
                "2. Check transfer line and detector temperatures",
                "3. Inspect ceramic reaction tube condition",
                "4. Verify column-detector interface integrity",
                "5. Test for active sites and memory effects",
                "6. Optimize gas flow ratios"
            ],
            "immediate_actions": [
                "Measure peak tailing factors for standard compounds",
                "Check transfer line temperature (should be >250°C)",
                "Verify detector temperature matches or exceeds column",
                "Look for cold spots in heated zones"
            ],
            "detailed_procedures": [
                "Peak Shape Test: Inject thiophene and measure tailing factor (should be <2.0)",
                f"Temperature Verification: Transfer line and detector at >{params.ceramic_tube_temperature - 50}°C",
                "Memory Test: Inject high concentration, then blanks to check carryover",
                f"Flow Optimization: Try air:H2 ratios around {params.air_flow_ml_min}:{params.h2_flow_ml_min}"
            ],
            "expected_outcomes": [
                "Peak tailing factors <1.5 for good chromatography",
                "No memory effects between injections",
                "Symmetric peak shapes for all test compounds",
                "Consistent retention times"
            ],
            "escalation_criteria": [
                "Tailing factor >3.0 - Replace ceramic tube",
                "Severe memory effects - Deep cleaning required",
                "Cold spots detected - Repair heating elements",
                "No improvement with optimization - Check column condition"
            ]
        }
    
    def _generate_general_workflow(self, params: SCDParameters) -> Dict:
        """General diagnostic workflow for performance verification"""
        return {
            "diagnostic_steps": [
                "1. Perform complete system performance check",
                "2. Run standard test mixture analysis",
                "3. Verify all operating parameters",
                "4. Check calibration and response factors",
                "5. Document current performance metrics",
                "6. Compare against specifications"
            ],
            "immediate_actions": [
                "Run system suitability test with thiophene standard",
                "Check all parameter settings against optimal values",
                "Record current performance metrics",
                "Document any unusual observations"
            ],
            "detailed_procedures": [
                "System Suitability: S/N >1000:1 for 1 ppm thiophene",
                "Parameter Check: Verify all settings match optimized values",
                "Calibration: Run 5-point calibration curve (R² >0.999)",
                "Performance Documentation: Record sensitivity, stability, linearity"
            ],
            "expected_outcomes": [
                "System meets all manufacturer specifications",
                "Calibration linearity R² >0.999",
                "Baseline stability >95%",
                "Detection limits meet analytical requirements"
            ],
            "escalation_criteria": [
                "Performance significantly below specifications",
                "Calibration linearity poor (R² <0.995)",
                "Multiple parameter deviations detected",
                "Systematic performance degradation observed"
            ]
        }
    
    @monitor_performance
    def benchmark_performance(
        self,
        current_performance: SCDPerformance,
        scd_model: str,
        application_type: str = "general"
    ) -> Dict[str, Any]:
        """Benchmark current performance against industry standards"""
        
        # Industry benchmark data
        industry_benchmarks = {
            "Agilent 355 SCD": {
                "general": {
                    "sensitivity_pg_s": {"excellent": 0.3, "good": 0.5, "acceptable": 1.0},
                    "snr_ratio": {"excellent": 5000, "good": 2000, "acceptable": 500},
                    "baseline_stability": {"excellent": 98, "good": 95, "acceptable": 90},
                    "linearity_r2": {"excellent": 0.9999, "good": 0.999, "acceptable": 0.995}
                },
                "petroleum": {
                    "sensitivity_pg_s": {"excellent": 0.5, "good": 0.8, "acceptable": 1.5},
                    "snr_ratio": {"excellent": 3000, "good": 1500, "acceptable": 300},
                    "baseline_stability": {"excellent": 96, "good": 92, "acceptable": 85},
                    "linearity_r2": {"excellent": 0.9995, "good": 0.998, "acceptable": 0.99}
                }
            },
            "Agilent 8355 SCD": {
                "general": {
                    "sensitivity_pg_s": {"excellent": 0.15, "good": 0.2, "acceptable": 0.5},
                    "snr_ratio": {"excellent": 8000, "good": 4000, "acceptable": 1000},
                    "baseline_stability": {"excellent": 99, "good": 97, "acceptable": 92},
                    "linearity_r2": {"excellent": 0.99995, "good": 0.9999, "acceptable": 0.998}
                }
            }
        }
        
        benchmarks = industry_benchmarks.get(scd_model, {}).get(application_type, {})
        if not benchmarks:
            return {"error": f"No benchmarks available for {scd_model} in {application_type} application"}
        
        # Compare current performance to benchmarks
        comparison_results = {}
        overall_scores = []
        
        for metric, current_value in {
            "sensitivity_pg_s": current_performance.sulfur_sensitivity_pg_s,
            "snr_ratio": current_performance.signal_to_noise_ratio,
            "baseline_stability": current_performance.baseline_stability,
            "linearity_r2": current_performance.linearity_r2
        }.items():
            
            if metric in benchmarks:
                benchmark_levels = benchmarks[metric]
                
                # Determine performance level (note: for sensitivity, lower is better)
                if metric == "sensitivity_pg_s":
                    if current_value <= benchmark_levels["excellent"]:
                        level = "Excellent"
                        score = 100
                    elif current_value <= benchmark_levels["good"]:
                        level = "Good"
                        score = 80
                    elif current_value <= benchmark_levels["acceptable"]:
                        level = "Acceptable"
                        score = 60
                    else:
                        level = "Below Standard"
                        score = 30
                else:
                    # For other metrics, higher is better
                    if current_value >= benchmark_levels["excellent"]:
                        level = "Excellent"
                        score = 100
                    elif current_value >= benchmark_levels["good"]:
                        level = "Good"
                        score = 80
                    elif current_value >= benchmark_levels["acceptable"]:
                        level = "Acceptable"
                        score = 60
                    else:
                        level = "Below Standard"
                        score = 30
                
                comparison_results[metric] = {
                    "current_value": current_value,
                    "benchmarks": benchmark_levels,
                    "performance_level": level,
                    "score": score
                }
                overall_scores.append(score)
        
        # Calculate overall performance score
        overall_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0
        
        if overall_score >= 90:
            overall_rating = "Excellent - Exceeds industry standards"
        elif overall_score >= 75:
            overall_rating = "Good - Meets industry standards"
        elif overall_score >= 60:
            overall_rating = "Acceptable - Minimum industry standards"
        else:
            overall_rating = "Below Standard - Requires improvement"
        
        return {
            "overall_score": overall_score,
            "overall_rating": overall_rating,
            "individual_metrics": comparison_results,
            "benchmark_source": f"{scd_model} - {application_type} application",
            "industry_percentile": self._calculate_industry_percentile(overall_score)
        }
    
    def _calculate_industry_percentile(self, score: float) -> str:
        """Calculate approximate industry percentile based on performance score"""
        if score >= 95:
            return "Top 5% (Best in class)"
        elif score >= 90:
            return "Top 10% (Excellent)"
        elif score >= 80:
            return "Top 25% (Very Good)"
        elif score >= 70:
            return "Top 50% (Above Average)"
        elif score >= 60:
            return "Average (50th percentile)"
        else:
            return "Below Average (<50th percentile)"
    
    @monitor_performance
    def generate_scd_report(
        self,
        scd_model: str,
        performance: SCDPerformance,
        diagnostics: List[SCDDiagnostics]
    ) -> str:
        """Generate comprehensive SCD performance and diagnostic report"""
        
        critical_issues = [d for d in diagnostics if d.status == SCDStatus.CRITICAL]
        warning_issues = [d for d in diagnostics if d.status == SCDStatus.WARNING]
        
        report_lines = [
            f"🔬 AGILENT {scd_model.upper()} SCD PERFORMANCE REPORT",
            "=" * 60,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "📊 PERFORMANCE METRICS:",
            f"  • Sulfur Sensitivity: {performance.sulfur_sensitivity_pg_s:.2f} pg/s",
            f"  • Signal-to-Noise Ratio: {performance.signal_to_noise_ratio:.1f}:1",
            f"  • Baseline Stability: {performance.baseline_stability:.1f}%",
            f"  • Detection Limit: {performance.detection_limit_ng_s:.3f} ng/s",
            f"  • Linearity (R²): {performance.linearity_r2:.4f}",
            f"  • Response Time: {performance.response_time_s:.2f} s",
            "",
            "🔧 SYSTEM STATUS:",
            f"  • Critical Issues: {len(critical_issues)}",
            f"  • Warning Conditions: {len(warning_issues)}",
            f"  • Optimal Components: {len([d for d in diagnostics if d.status == SCDStatus.OPTIMAL])}",
            ""
        ]
        
        if critical_issues:
            report_lines.extend([
                "🚨 CRITICAL ISSUES:",
                ""
            ])
            for diagnostic in critical_issues:
                report_lines.extend([
                    f"  Component: {diagnostic.component.value}",
                    f"  Current: {diagnostic.current_value:.1f}",
                    f"  Optimal Range: {diagnostic.optimal_range[0]:.1f} - {diagnostic.optimal_range[1]:.1f}",
                    f"  Deviation: {diagnostic.deviation_percent:.1f}%",
                    f"  Recommendations:",
                ])
                for rec in diagnostic.recommendations[:2]:  # Limit to top 2
                    report_lines.append(f"    - {rec}")
                report_lines.append("")
        
        if warning_issues:
            report_lines.extend([
                "⚠️ WARNING CONDITIONS:",
                ""
            ])
            for diagnostic in warning_issues:
                report_lines.extend([
                    f"  {diagnostic.component.value}: {diagnostic.deviation_percent:.1f}% deviation",
                    f"    → {diagnostic.recommendations[0] if diagnostic.recommendations else 'Monitor closely'}",
                    ""
                ])
        
        # Performance assessment
        overall_score = min(100, (performance.baseline_stability + 
                                 min(100, performance.signal_to_noise_ratio/10) + 
                                 performance.linearity_r2*100) / 3)
        
        report_lines.extend([
            "📈 OVERALL ASSESSMENT:",
            f"  • Performance Score: {overall_score:.1f}/100",
            f"  • Detector Status: {'EXCELLENT' if overall_score > 90 else 'GOOD' if overall_score > 70 else 'NEEDS ATTENTION'}",
            f"  • Recommended Action: {'Continue operation' if overall_score > 80 else 'Schedule maintenance'}",
            "",
            f"📊 STATISTICS:",
            f"  • Total Simulations: {self.simulations_performed}",
            f"  • Total Diagnostics: {self.diagnostics_performed}",
            "",
            "Generated by Bulletproof Agilent SCD Simulator v1.0"
        ])
        
        return "\n".join(report_lines)
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get simulator health status"""
        return {
            "status": "healthy",
            "simulations_performed": self.simulations_performed,
            "diagnostics_performed": self.diagnostics_performed,
            "average_simulation_time": self.total_simulation_time / max(1, self.simulations_performed),
            "databases_loaded": {
                "scd_specifications": len(self.scd_specifications),
                "troubleshooting_cases": len(self.troubleshooting_database),
                "compound_responses": len(self.compound_responses)
            }
        }

def main():
    """Bulletproof main entry point"""
    logger = setup_bulletproof_logging('tools.scd.main')
    
    try:
        logger.info("=== Starting Bulletproof Agilent SCD Simulator ===")
        
        simulator = AgilentSCDSimulator()
        
        # Example simulation
        test_params = SCDParameters(
            air_flow_ml_min=85.0,
            h2_flow_ml_min=55.0,
            burner_temperature=800.0,
            pmt_voltage=800,
            ozone_flow_ml_min=15.0,
            vacuum_level_torr=5.0,
            ceramic_tube_temperature=1000.0
        )
        
        # Simulate performance
        performance = simulator.simulate_scd_performance(
            scd_model="Agilent 355 SCD",
            parameters=test_params,
            sample_compounds=["Thiophene", "Benzothiophene"],
            sample_concentration_ppm=1.0
        )
        
        # Run diagnostics
        diagnostics = simulator.diagnose_scd_system(
            scd_model="Agilent 355 SCD",
            current_parameters=test_params,
            observed_issues=["baseline drift"]
        )
        
        # Generate report
        report = simulator.generate_scd_report("Agilent 355 SCD", performance, diagnostics)
        print(report)
        
        logger.info("SCD simulation completed successfully")
        
    except Exception as e:
        logger.error(f"SCD simulator failed: {str(e)}")
        print(f"❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())