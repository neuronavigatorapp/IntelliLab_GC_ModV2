"""
Cost Calculation Service
Handles cost analysis and calculations for GC operations
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import json

class CostCalculationService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_method_cost(self, method_data: Dict) -> Dict:
        """Calculate comprehensive method costs"""
        
        # Base costs (realistic GC lab costs)
        consumables = {
            'column': 800.0,  # GC column cost
            'carrier_gas': 15.0,  # Per hour
            'vials': 0.50,  # Per sample
            'septa': 0.25,  # Per injection
            'liners': 2.50   # Per batch
        }
        
        # Calculate analysis time from method parameters
        analysis_time = self._calculate_analysis_time(method_data)
        
        # Calculate costs
        column_cost = consumables['column'] / 1000  # Per analysis (assuming 1000 injections per column)
        gas_cost = consumables['carrier_gas'] * (analysis_time / 60)  # Convert minutes to hours
        sample_prep_cost = consumables['vials'] + consumables['septa']
        maintenance_cost = consumables['liners'] / 50  # Per 50 analyses
        
        # Labor cost (assuming $30/hour technician)
        labor_cost = 30.0 * (analysis_time / 60) * 1.2  # 20% overhead
        
        # Instrument cost (assuming $150/hour instrument depreciation)
        instrument_cost = 150.0 * (analysis_time / 60)
        
        total_consumables = column_cost + gas_cost + sample_prep_cost + maintenance_cost
        total_cost = total_consumables + labor_cost + instrument_cost
        
        return {
            "breakdown": {
                "consumables": {
                    "column": round(column_cost, 2),
                    "carrier_gas": round(gas_cost, 2),
                    "sample_prep": round(sample_prep_cost, 2),
                    "maintenance": round(maintenance_cost, 2),
                    "total": round(total_consumables, 2)
                },
                "labor": round(labor_cost, 2),
                "instrument": round(instrument_cost, 2),
                "total": round(total_cost, 2)
            },
            "analysis_time_minutes": analysis_time,
            "cost_per_sample": round(total_cost, 2),
            "optimization_suggestions": self._generate_cost_optimizations(method_data, total_cost)
        }
    
    def _calculate_analysis_time(self, method_data: Dict) -> float:
        """Estimate analysis time from method parameters"""
        base_time = 10.0  # Base analysis time in minutes
        
        # Add time based on temperature program
        if 'final_temp' in method_data and 'initial_temp' in method_data:
            temp_range = method_data.get('final_temp', 300) - method_data.get('initial_temp', 50)
            ramp_rate = method_data.get('ramp_rate', 10)
            ramp_time = temp_range / ramp_rate
            hold_time = method_data.get('hold_time', 5)
            base_time += ramp_time + hold_time
        
        return base_time
    
    def _generate_cost_optimizations(self, method_data: Dict, current_cost: float) -> List[str]:
        """Generate cost optimization suggestions"""
        suggestions = []
        
        if current_cost > 50.0:
            suggestions.append("Consider increasing ramp rate to reduce analysis time")
            suggestions.append("Evaluate if lower final temperature is acceptable")
        
        if method_data.get('split_ratio', 1) > 50:
            suggestions.append("Lower split ratio may improve sensitivity and reduce sample prep")
        
        suggestions.append("Batch multiple samples to reduce per-sample instrument overhead")
        
        return suggestions
    
    def get_cost_items(self) -> List[Dict]:
        """Return standard cost items database"""
        return [
            {"name": "GC Column", "category": "consumables", "unit_cost": 800.0, "unit": "each"},
            {"name": "Helium Carrier Gas", "category": "consumables", "unit_cost": 15.0, "unit": "hour"},
            {"name": "Sample Vials", "category": "consumables", "unit_cost": 0.50, "unit": "each"},
            {"name": "Septa", "category": "consumables", "unit_cost": 0.25, "unit": "each"},
            {"name": "Inlet Liners", "category": "consumables", "unit_cost": 2.50, "unit": "each"},
            {"name": "Technician Labor", "category": "labor", "unit_cost": 30.0, "unit": "hour"},
            {"name": "Instrument Time", "category": "instrument", "unit_cost": 150.0, "unit": "hour"}
        ]
