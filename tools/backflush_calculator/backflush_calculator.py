#!/usr/bin/env python3
"""
Bulletproof Backflush Timing Calculator
Enterprise-grade backflush optimization for GC systems
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

class BackflushMode(Enum):
    """Backflush operation modes"""
    FORWARD_BACKFLUSH = "Forward Backflush"
    REVERSE_BACKFLUSH = "Reverse Backflush" 
    DIFFERENTIAL_FLOW = "Differential Flow"

@dataclass
class ColumnSpecs:
    """Column specifications for backflush calculations"""
    length_m: float
    internal_diameter_mm: float
    film_thickness_um: float
    stationary_phase: str
    max_temperature: float

@dataclass
class BackflushSettings:
    """Backflush operation parameters"""
    mode: BackflushMode
    backflush_time_min: float
    backflush_flow_ml_min: float
    backflush_temperature: float
    target_compounds: List[str]
    matrix_compounds: List[str]

@dataclass
class BackflushResults:
    """Backflush calculation results"""
    optimal_timing_min: float
    backflush_efficiency: float
    column_protection_score: float
    cycle_time_reduction: float
    recommendations: List[str]
    warnings: List[str]

def setup_bulletproof_logging(name: str) -> logging.Logger:
    """Setup enterprise logging"""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        try:
            file_handler = logging.FileHandler('backflush_calculator.log', encoding='utf-8')
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

class BackflushTimingCalculator:
    """Bulletproof Enterprise Backflush Timing Calculator"""
    
    def __init__(self):
        # =================== BULLETPROOF INITIALIZATION ===================
        self.logger = setup_bulletproof_logging('tools.backflush.BackflushTimingCalculator')
        self.logger.info("Initializing Bulletproof Backflush Timing Calculator")
        
        # Performance metrics
        self.calculations_performed = 0
        self.total_calculation_time = 0.0
        
        # Compound databases
        self.target_compounds_db = self._load_target_compounds_database()
        self.matrix_compounds_db = self._load_matrix_compounds_database()
        self.column_database = self._load_column_database()
        
        self.logger.info("Backflush calculator initialized successfully")
    
    def _load_target_compounds_database(self) -> Dict[str, Dict]:
        """Load target compounds database for backflush optimization"""
        return {
            "C8-C12 Alkanes": {
                "retention_window_min": [2.5, 8.5],
                "volatility_index": 0.8,
                "backflush_priority": "high"
            },
            "C12-C20 Alkanes": {
                "retention_window_min": [8.5, 25.0], 
                "volatility_index": 0.6,
                "backflush_priority": "high"
            },
            "C20+ Heavy Alkanes": {
                "retention_window_min": [25.0, 60.0],
                "volatility_index": 0.3,
                "backflush_priority": "critical"
            },
            "Aromatics (C6-C10)": {
                "retention_window_min": [3.0, 12.0],
                "volatility_index": 0.7,
                "backflush_priority": "medium"
            },
            "PAHs (C10+)": {
                "retention_window_min": [15.0, 45.0],
                "volatility_index": 0.4,
                "backflush_priority": "critical"
            }
        }
    
    def _load_matrix_compounds_database(self) -> Dict[str, Dict]:
        """Load matrix compounds database"""
        return {
            "Heavy Hydrocarbons": {
                "retention_start_min": 20.0,
                "contamination_factor": 0.9,
                "column_degradation_rate": 0.05
            },
            "Waxes": {
                "retention_start_min": 30.0,
                "contamination_factor": 0.95,
                "column_degradation_rate": 0.08
            },
            "Polymers": {
                "retention_start_min": 35.0,
                "contamination_factor": 0.98,
                "column_degradation_rate": 0.12
            },
            "Involatile Residues": {
                "retention_start_min": 40.0,
                "contamination_factor": 0.99,
                "column_degradation_rate": 0.15
            }
        }
    
    def _load_column_database(self) -> Dict[str, ColumnSpecs]:
        """Load column specifications database"""
        return {
            "DB-5ms (30m x 0.25mm x 0.25um)": ColumnSpecs(
                length_m=30.0,
                internal_diameter_mm=0.25,
                film_thickness_um=0.25,
                stationary_phase="5% Phenyl Methyl Polysiloxane",
                max_temperature=350
            ),
            "DB-1ms (30m x 0.25mm x 0.25um)": ColumnSpecs(
                length_m=30.0,
                internal_diameter_mm=0.25,
                film_thickness_um=0.25,
                stationary_phase="100% Methyl Polysiloxane", 
                max_temperature=370
            ),
            "DB-WAX (30m x 0.25mm x 0.25um)": ColumnSpecs(
                length_m=30.0,
                internal_diameter_mm=0.25,
                film_thickness_um=0.25,
                stationary_phase="Polyethylene Glycol",
                max_temperature=280
            )
        }
    
    @monitor_performance
    def calculate_optimal_backflush_timing(
        self,
        column_type: str,
        target_compounds: List[str],
        matrix_compounds: List[str],
        carrier_flow_ml_min: float,
        oven_temperature: float,
        method_runtime_min: float
    ) -> BackflushResults:
        """Calculate optimal backflush timing with enterprise validation"""
        
        self.logger.info(f"Calculating backflush timing for {column_type}")
        
        # Validate inputs
        if column_type not in self.column_database:
            raise ValueError(f"Unknown column type: {column_type}")
        
        column_specs = self.column_database[column_type]
        
        # Calculate target compound elution window
        target_window = self._calculate_target_elution_window(target_compounds, oven_temperature)
        
        # Calculate matrix interference window  
        matrix_window = self._calculate_matrix_interference_window(matrix_compounds, oven_temperature)
        
        # Determine optimal backflush timing
        optimal_timing = self._calculate_optimal_timing(
            target_window, matrix_window, method_runtime_min
        )
        
        # Calculate backflush efficiency
        efficiency = self._calculate_backflush_efficiency(
            optimal_timing, column_specs, carrier_flow_ml_min, oven_temperature
        )
        
        # Calculate column protection score
        protection_score = self._calculate_column_protection_score(
            optimal_timing, matrix_compounds, column_specs
        )
        
        # Calculate cycle time reduction
        cycle_reduction = self._calculate_cycle_time_reduction(
            optimal_timing, method_runtime_min, matrix_window
        )
        
        # Generate recommendations and warnings
        recommendations = self._generate_recommendations(
            optimal_timing, efficiency, protection_score, column_specs
        )
        warnings = self._generate_warnings(
            optimal_timing, oven_temperature, column_specs, matrix_compounds
        )
        
        results = BackflushResults(
            optimal_timing_min=optimal_timing,
            backflush_efficiency=efficiency,
            column_protection_score=protection_score,
            cycle_time_reduction=cycle_reduction,
            recommendations=recommendations,
            warnings=warnings
        )
        
        self.calculations_performed += 1
        self.logger.info(f"Backflush calculation completed: {optimal_timing:.2f} min timing")
        
        return results
    
    def _calculate_target_elution_window(self, target_compounds: List[str], temperature: float) -> Tuple[float, float]:
        """Calculate when target compounds elute"""
        start_times = []
        end_times = []
        
        for compound in target_compounds:
            if compound in self.target_compounds_db:
                data = self.target_compounds_db[compound]
                # Temperature correction factor
                temp_factor = max(0.5, min(1.5, 250 / temperature))
                
                start_time = data["retention_window_min"][0] * temp_factor
                end_time = data["retention_window_min"][1] * temp_factor
                
                start_times.append(start_time)
                end_times.append(end_time)
        
        if not start_times:
            return (2.0, 15.0)  # Default window
        
        return (min(start_times), max(end_times))
    
    def _calculate_matrix_interference_window(self, matrix_compounds: List[str], temperature: float) -> Tuple[float, float]:
        """Calculate when matrix compounds start interfering"""
        interference_starts = []
        
        for compound in matrix_compounds:
            if compound in self.matrix_compounds_db:
                data = self.matrix_compounds_db[compound]
                # Temperature correction
                temp_factor = max(0.7, min(1.3, 300 / temperature))
                start_time = data["retention_start_min"] * temp_factor
                interference_starts.append(start_time)
        
        if not interference_starts:
            return (25.0, 60.0)  # Default heavy compound window
        
        earliest_start = min(interference_starts)
        return (earliest_start, earliest_start + 40.0)  # 40 min contamination window
    
    def _calculate_optimal_timing(
        self, 
        target_window: Tuple[float, float], 
        matrix_window: Tuple[float, float], 
        method_runtime: float
    ) -> float:
        """Calculate optimal backflush start timing"""
        
        target_end = target_window[1]
        matrix_start = matrix_window[0]
        
        # Safety margin after last target compound
        safety_margin = max(0.5, target_end * 0.1)
        
        # Optimal timing is after targets but before matrix interference
        optimal_timing = target_end + safety_margin
        
        # Ensure it's before matrix contamination starts
        if optimal_timing >= matrix_start:
            optimal_timing = matrix_start - 1.0
        
        # Ensure it's reasonable within method runtime
        if optimal_timing >= method_runtime * 0.8:
            optimal_timing = method_runtime * 0.75
        
        return max(optimal_timing, 1.0)  # Minimum 1 minute
    
    def _calculate_backflush_efficiency(
        self,
        timing: float,
        column_specs: ColumnSpecs,
        flow_rate: float,
        temperature: float
    ) -> float:
        """Calculate backflush cleaning efficiency"""
        
        # Base efficiency depends on timing vs column volume
        column_volume = (np.pi * (column_specs.internal_diameter_mm/2)**2 * 
                        column_specs.length_m * 1000) / 1000  # mL
        
        # Flow dynamics
        residence_time = column_volume / flow_rate  # minutes
        efficiency_factor = min(1.0, timing / (residence_time * 3))
        
        # Temperature efficiency
        temp_factor = min(1.0, temperature / column_specs.max_temperature)
        
        # Film thickness effect
        film_factor = max(0.8, min(1.2, 0.25 / column_specs.film_thickness_um))
        
        efficiency = 85.0 * efficiency_factor * temp_factor * film_factor
        
        return min(max(efficiency, 20.0), 98.0)
    
    def _calculate_column_protection_score(
        self,
        timing: float,
        matrix_compounds: List[str],
        column_specs: ColumnSpecs
    ) -> float:
        """Calculate how well the column is protected"""
        
        base_score = 80.0
        
        # Earlier backflush = better protection
        if timing < 15.0:
            timing_bonus = 15.0
        elif timing < 25.0:
            timing_bonus = 10.0
        else:
            timing_bonus = 0.0
        
        # Matrix severity penalty
        severity_penalty = 0.0
        for compound in matrix_compounds:
            if compound in self.matrix_compounds_db:
                degradation_rate = self.matrix_compounds_db[compound]["column_degradation_rate"]
                severity_penalty += degradation_rate * 50  # Convert to percentage
        
        protection_score = base_score + timing_bonus - severity_penalty
        
        return min(max(protection_score, 10.0), 100.0)
    
    def _calculate_cycle_time_reduction(
        self,
        timing: float,
        method_runtime: float,
        matrix_window: Tuple[float, float]
    ) -> float:
        """Calculate cycle time reduction percentage"""
        
        # Without backflush, need full method + cooldown for matrix
        without_backflush = method_runtime + (matrix_window[1] - matrix_window[0])
        
        # With backflush, can restart after backflush + short equilibration
        with_backflush = timing + 2.0  # 2 min equilibration
        
        if without_backflush <= with_backflush:
            return 0.0
        
        reduction = ((without_backflush - with_backflush) / without_backflush) * 100
        
        return min(max(reduction, 0.0), 80.0)  # Max 80% reduction
    
    def _generate_recommendations(
        self,
        timing: float,
        efficiency: float,
        protection_score: float,
        column_specs: ColumnSpecs
    ) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        if efficiency < 70:
            recommendations.append(f"Increase backflush flow rate for better cleaning efficiency")
            recommendations.append(f"Consider higher backflush temperature (max: {column_specs.max_temperature}°C)")
        
        if protection_score < 60:
            recommendations.append(f"Start backflush earlier (current: {timing:.1f} min)")
            recommendations.append(f"Use differential flow backflush for better matrix removal")
        
        if timing > 30:
            recommendations.append(f"Consider method optimization to reduce analysis time")
        
        recommendations.append(f"Monitor column performance after {int(100/max(0.1, (100-protection_score)))} backflush cycles")
        
        return recommendations
    
    def _generate_warnings(
        self,
        timing: float,
        temperature: float,
        column_specs: ColumnSpecs,
        matrix_compounds: List[str]
    ) -> List[str]:
        """Generate safety and performance warnings"""
        warnings = []
        
        if temperature > column_specs.max_temperature * 0.9:
            warnings.append(f"Temperature near column maximum ({column_specs.max_temperature}°C) - monitor for degradation")
        
        if timing < 2.0:
            warnings.append(f"Very early backflush may affect target compound quantitation")
        
        severe_matrix = [c for c in matrix_compounds if c in ["Polymers", "Involatile Residues"]]
        if severe_matrix:
            warnings.append(f"Severe matrix contamination detected - consider sample cleanup")
        
        if len(matrix_compounds) > 3:
            warnings.append(f"Multiple matrix interferences - monitor method robustness")
        
        return warnings
    
    @monitor_performance
    def generate_backflush_report(self, results: BackflushResults, column_type: str) -> str:
        """Generate comprehensive backflush optimization report"""
        
        report_lines = [
            "🔄 BACKFLUSH TIMING OPTIMIZATION REPORT",
            "=" * 50,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Column: {column_type}",
            "",
            "📊 OPTIMIZATION RESULTS:",
            f"  • Optimal Backflush Timing: {results.optimal_timing_min:.2f} minutes",
            f"  • Backflush Efficiency: {results.backflush_efficiency:.1f}%",
            f"  • Column Protection Score: {results.column_protection_score:.1f}/100",
            f"  • Cycle Time Reduction: {results.cycle_time_reduction:.1f}%",
            "",
            "💡 RECOMMENDATIONS:",
        ]
        
        for i, rec in enumerate(results.recommendations, 1):
            report_lines.append(f"  {i}. {rec}")
        
        if results.warnings:
            report_lines.extend([
                "",
                "⚠️ WARNINGS:",
            ])
            for i, warning in enumerate(results.warnings, 1):
                report_lines.append(f"  {i}. {warning}")
        
        report_lines.extend([
            "",
            f"📈 PERFORMANCE METRICS:",
            f"  • Total Calculations: {self.calculations_performed}",
            f"  • Average Calculation Time: {(self.total_calculation_time/max(1, self.calculations_performed)):.3f}s",
            "",
            "Generated by Bulletproof Backflush Timing Calculator v1.0"
        ])
        
        return "\n".join(report_lines)
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get calculator health status"""
        return {
            "status": "healthy",
            "calculations_performed": self.calculations_performed,
            "average_calculation_time": self.total_calculation_time / max(1, self.calculations_performed),
            "databases_loaded": {
                "target_compounds": len(self.target_compounds_db),
                "matrix_compounds": len(self.matrix_compounds_db),
                "columns": len(self.column_database)
            }
        }

def main():
    """Bulletproof main entry point"""
    logger = setup_bulletproof_logging('tools.backflush.main')
    
    try:
        logger.info("=== Starting Bulletproof Backflush Timing Calculator ===")
        
        calculator = BackflushTimingCalculator()
        
        # Example calculation
        results = calculator.calculate_optimal_backflush_timing(
            column_type="DB-5ms (30m x 0.25mm x 0.25um)",
            target_compounds=["C8-C12 Alkanes", "Aromatics (C6-C10)"],
            matrix_compounds=["Heavy Hydrocarbons", "Waxes"],
            carrier_flow_ml_min=4.0,
            oven_temperature=280.0,
            method_runtime_min=45.0
        )
        
        # Generate report
        report = calculator.generate_backflush_report(results, "DB-5ms (30m x 0.25mm x 0.25um)")
        print(report)
        
        logger.info("Backflush calculation completed successfully")
        
    except Exception as e:
        logger.error(f"Backflush calculator failed: {str(e)}")
        print(f"❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())