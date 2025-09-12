#!/usr/bin/env python3
"""
Cost Calculation Service for IntelliLab GC
Calculates method costs including consumables, labor, and instrument time
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import json

from app.core.database import CostItem
from app.models.schemas import CostItemCreate, CostItemUpdate


class CostService:
    """Service for calculating method costs and managing cost items"""
    
    def __init__(self):
        self.labor_rates = {
            "technician": 25.0,  # $/hour
            "scientist": 45.0,   # $/hour
            "admin": 35.0        # $/hour
        }
        
        self.instrument_rates = {
            "gc_fid": 15.0,      # $/hour
            "gc_ms": 25.0,       # $/hour
            "gc_ms_ms": 35.0,    # $/hour
            "gc_ecd": 20.0       # $/hour
        }
    
    def create_cost_item(
        self, 
        db: Session, 
        cost_data: Dict[str, Any]
    ) -> CostItem:
        """Create a new cost item"""
        
        cost_item = CostItem(
            name=cost_data["name"],
            category=cost_data["category"],
            subcategory=cost_data.get("subcategory"),
            unit_cost=cost_data["unit_cost"],
            unit=cost_data["unit"],
            supplier=cost_data.get("supplier"),
            part_number=cost_data.get("part_number"),
            description=cost_data.get("description", ""),
            is_active=cost_data.get("is_active", True)
        )
        
        db.add(cost_item)
        db.commit()
        db.refresh(cost_item)
        
        return cost_item
    
    def get_cost_item(self, db: Session, item_id: int) -> Optional[CostItem]:
        """Get a cost item by ID"""
        return db.query(CostItem).filter(CostItem.id == item_id).first()
    
    def get_cost_items(
        self,
        db: Session,
        category: Optional[str] = None,
        is_active: bool = True,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[CostItem]:
        """Get cost items with optional filtering"""
        
        query = db.query(CostItem)
        
        # Filter by active status
        if is_active is not None:
            query = query.filter(CostItem.is_active == is_active)
        
        # Filter by category
        if category:
            query = query.filter(CostItem.category == category)
        
        # Search in name and description
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    CostItem.name.ilike(search_term),
                    CostItem.description.ilike(search_term)
                )
            )
        
        # Order by category and name
        query = query.order_by(CostItem.category, CostItem.name)
        
        return query.offset(skip).limit(limit).all()
    
    def update_cost_item(
        self,
        db: Session,
        item_id: int,
        cost_data: Dict[str, Any]
    ) -> Optional[CostItem]:
        """Update an existing cost item"""
        
        cost_item = self.get_cost_item(db, item_id)
        if not cost_item:
            return None
        
        # Update fields
        for field, value in cost_data.items():
            if hasattr(cost_item, field) and field != "id":
                setattr(cost_item, field, value)
        
        cost_item.modified_date = datetime.utcnow()
        
        db.commit()
        db.refresh(cost_item)
        
        return cost_item
    
    def delete_cost_item(self, db: Session, item_id: int) -> bool:
        """Delete (deactivate) a cost item"""
        cost_item = self.get_cost_item(db, item_id)
        if not cost_item:
            return False
        
        cost_item.is_active = False
        cost_item.modified_date = datetime.utcnow()
        
        db.commit()
        return True
    
    def calculate_method_cost(
        self,
        db: Session,
        method_parameters: Dict[str, Any],
        analysis_count: int,
        include_overhead: bool = True,
        overhead_percentage: float = 20.0,
        custom_rates: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate total cost for a method based on parameters and analysis count"""
        
        try:
            # Use custom rates if provided
            labor_rates = custom_rates.get("labor", self.labor_rates) if custom_rates else self.labor_rates
            instrument_rates = custom_rates.get("instrument", self.instrument_rates) if custom_rates else self.instrument_rates
            
            # Calculate individual cost components
            consumables_cost = self._calculate_consumables_cost(db, method_parameters, analysis_count)
            labor_cost = self._calculate_labor_cost(method_parameters, analysis_count, labor_rates)
            instrument_cost = self._calculate_instrument_cost(method_parameters, analysis_count, instrument_rates)
            
            # Calculate subtotal
            subtotal = consumables_cost + labor_cost + instrument_cost
            
            # Calculate overhead
            overhead_cost = (subtotal * overhead_percentage / 100) if include_overhead else 0.0
            
            # Calculate total
            total_cost = subtotal + overhead_cost
            cost_per_analysis = total_cost / analysis_count if analysis_count > 0 else 0.0
            
            # Detailed breakdown
            breakdown = {
                "consumables": consumables_cost,
                "labor": labor_cost,
                "instrument_time": instrument_cost,
                "overhead": overhead_cost,
                "subtotal": subtotal
            }
            
            return {
                "total_cost": round(total_cost, 2),
                "cost_per_analysis": round(cost_per_analysis, 2),
                "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
                "consumables_cost": round(consumables_cost, 2),
                "labor_cost": round(labor_cost, 2),
                "instrument_time_cost": round(instrument_cost, 2),
                "overhead_cost": round(overhead_cost, 2),
                "analysis_count": analysis_count,
                "calculation_details": self._get_calculation_details(
                    db, method_parameters, analysis_count, labor_rates, instrument_rates
                )
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "total_cost": 0.0,
                "cost_per_analysis": 0.0,
                "breakdown": {},
                "consumables_cost": 0.0,
                "labor_cost": 0.0,
                "instrument_time_cost": 0.0,
                "overhead_cost": 0.0,
                "analysis_count": analysis_count
            }
    
    def _calculate_consumables_cost(
        self, 
        db: Session, 
        method_parameters: Dict[str, Any], 
        analysis_count: int
    ) -> float:
        """Calculate consumables cost based on method parameters"""
        
        total_cost = 0.0
        
        # Get consumables from database
        consumables = self.get_cost_items(db, category="consumables")
        consumables_map = {item.name.lower(): item for item in consumables}
        
        # Calculate costs based on method parameters
        
        # Carrier gas consumption
        if "carrier_flow" in method_parameters and "total_time" in method_parameters:
            flow_rate = method_parameters["carrier_flow"]  # mL/min
            analysis_time = method_parameters["total_time"]  # minutes
            total_gas_volume = flow_rate * analysis_time * analysis_count  # mL
            
            # Convert to L and calculate cost
            gas_volume_l = total_gas_volume / 1000
            if "helium" in consumables_map:
                helium_cost = consumables_map["helium"].unit_cost * gas_volume_l
                total_cost += helium_cost
            else:
                # Default gas cost if not in database
                total_cost += gas_volume_l * 0.05  # $0.05/L estimate
        
        # Injection consumables
        if "injection_volume" in method_parameters:
            injection_vol = method_parameters["injection_volume"]  # μL
            total_injection_vol = injection_vol * analysis_count
            
            # Syringe and septum wear
            if "syringe_maintenance" in consumables_map:
                # Assume syringe needs replacement every 1000 injections
                syringe_cost = consumables_map["syringe_maintenance"].unit_cost * (analysis_count / 1000)
                total_cost += syringe_cost
            
            if "septum" in consumables_map:
                # Assume septum needs replacement every 500 injections
                septum_cost = consumables_map["septum"].unit_cost * (analysis_count / 500)
                total_cost += septum_cost
        
        # Column maintenance
        if "column_maintenance" in consumables_map:
            # Assume column maintenance cost per 100 analyses
            column_cost = consumables_map["column_maintenance"].unit_cost * (analysis_count / 100)
            total_cost += column_cost
        else:
            # Default column maintenance estimate
            total_cost += analysis_count * 0.50  # $0.50 per analysis estimate
        
        # Sample vials and caps
        if "sample_vials" in consumables_map:
            vial_cost = consumables_map["sample_vials"].unit_cost * analysis_count
            total_cost += vial_cost
        else:
            # Default vial cost
            total_cost += analysis_count * 0.25  # $0.25 per vial estimate
        
        # Solvent usage (if applicable)
        if method_parameters.get("uses_solvent", False):
            if "solvent" in consumables_map:
                # Estimate 1 mL solvent per analysis
                solvent_volume = analysis_count * 1.0  # mL
                solvent_cost = consumables_map["solvent"].unit_cost * (solvent_volume / 1000)  # Convert to L
                total_cost += solvent_cost
        
        return total_cost
    
    def _calculate_labor_cost(
        self, 
        method_parameters: Dict[str, Any], 
        analysis_count: int,
        labor_rates: Dict[str, float]
    ) -> float:
        """Calculate labor cost based on method complexity and analysis count"""
        
        # Base labor time per analysis (minutes)
        base_time_per_analysis = 5.0  # 5 minutes base time
        
        # Adjust based on method complexity
        complexity_factor = 1.0
        
        # Sample preparation time
        if method_parameters.get("requires_prep", False):
            complexity_factor += 0.5  # 50% more time for prep
        
        # Splitless injection takes more time
        if method_parameters.get("split_ratio", 10) == 0:
            complexity_factor += 0.2  # 20% more time for splitless
        
        # Complex oven programs take more setup time
        if "ramp_segments" in method_parameters:
            segments = len(method_parameters["ramp_segments"])
            complexity_factor += segments * 0.1  # 10% per additional segment
        
        # Total labor time
        total_labor_minutes = base_time_per_analysis * complexity_factor * analysis_count
        total_labor_hours = total_labor_minutes / 60
        
        # Use scientist rate as default
        hourly_rate = labor_rates.get("scientist", 45.0)
        
        return total_labor_hours * hourly_rate
    
    def _calculate_instrument_cost(
        self, 
        method_parameters: Dict[str, Any], 
        analysis_count: int,
        instrument_rates: Dict[str, float]
    ) -> float:
        """Calculate instrument time cost"""
        
        # Get analysis time per sample
        analysis_time = method_parameters.get("total_time", 20.0)  # minutes
        
        # Add equilibration and cool-down time
        equilibration_time = 5.0  # minutes before first analysis
        cooldown_time = 10.0     # minutes after last analysis
        
        # Total instrument time
        total_time_minutes = equilibration_time + (analysis_time * analysis_count) + cooldown_time
        total_time_hours = total_time_minutes / 60
        
        # Determine instrument type from parameters
        instrument_type = "gc_fid"  # default
        
        if method_parameters.get("detector_type"):
            detector = method_parameters["detector_type"].lower()
            if "ms" in detector:
                if "ms/ms" in detector or "triple" in detector:
                    instrument_type = "gc_ms_ms"
                else:
                    instrument_type = "gc_ms"
            elif "ecd" in detector:
                instrument_type = "gc_ecd"
        
        # Get hourly rate
        hourly_rate = instrument_rates.get(instrument_type, 15.0)
        
        return total_time_hours * hourly_rate
    
    def _get_calculation_details(
        self,
        db: Session,
        method_parameters: Dict[str, Any],
        analysis_count: int,
        labor_rates: Dict[str, float],
        instrument_rates: Dict[str, float]
    ) -> Dict[str, Any]:
        """Get detailed breakdown of cost calculations"""
        
        details = {
            "method_parameters": method_parameters,
            "analysis_count": analysis_count,
            "rates_used": {
                "labor": labor_rates,
                "instrument": instrument_rates
            },
            "assumptions": {
                "base_labor_time_per_analysis": "5 minutes",
                "gas_cost_estimate": "$0.05/L if not in database",
                "vial_cost_estimate": "$0.25/vial if not in database",
                "column_maintenance": "$0.50/analysis if not in database",
                "syringe_replacement": "Every 1000 injections",
                "septum_replacement": "Every 500 injections"
            },
            "calculation_timestamp": datetime.utcnow().isoformat()
        }
        
        return details
    
    def get_cost_optimization_suggestions(
        self,
        cost_result: Dict[str, Any],
        method_parameters: Dict[str, Any]
    ) -> List[str]:
        """Generate cost optimization suggestions"""
        
        suggestions = []
        breakdown = cost_result.get("breakdown", {})
        
        # High consumables cost
        if breakdown.get("consumables", 0) > breakdown.get("labor", 0) * 2:
            suggestions.append(
                "Consumables represent a large portion of cost. Consider bulk purchasing "
                "or negotiating better rates with suppliers."
            )
        
        # High instrument time cost
        if breakdown.get("instrument_time", 0) > breakdown.get("labor", 0):
            suggestions.append(
                "Instrument time is a major cost factor. Consider optimizing the temperature "
                "program for faster analysis or running multiple samples in sequence."
            )
        
        # Optimization based on method parameters
        if method_parameters.get("total_time", 20) > 30:
            suggestions.append(
                "Analysis time is >30 minutes. Consider increasing temperature ramp rates "
                "or optimizing the method for faster analysis."
            )
        
        if method_parameters.get("carrier_flow", 1.0) > 2.0:
            suggestions.append(
                "High carrier gas flow rate increases consumables cost. Verify if flow "
                "can be reduced while maintaining performance."
            )
        
        if method_parameters.get("injection_volume", 1.0) > 2.0:
            suggestions.append(
                "Large injection volumes may reduce sample throughput. Consider using "
                "more concentrated samples or splitless injection for better sensitivity."
            )
        
        # General suggestions
        if not suggestions:
            suggestions.extend([
                "Method costs are well-optimized for current parameters.",
                "Consider preventive maintenance to avoid unexpected instrument downtime.",
                "Regular calibration checks can prevent costly re-analysis."
            ])
        
        return suggestions
    
    def initialize_default_cost_items(self, db: Session) -> List[CostItem]:
        """Initialize default cost items for GC analysis"""
        
        default_items = [
            # Consumables
            {
                "name": "Helium",
                "category": "consumables",
                "subcategory": "carrier_gas",
                "unit_cost": 0.05,
                "unit": "L",
                "description": "Carrier gas for GC analysis"
            },
            {
                "name": "Sample Vials",
                "category": "consumables", 
                "subcategory": "labware",
                "unit_cost": 0.25,
                "unit": "vial",
                "description": "2mL amber vials with caps"
            },
            {
                "name": "Septum",
                "category": "consumables",
                "subcategory": "injection",
                "unit_cost": 15.0,
                "unit": "piece",
                "description": "Injection port septum replacement"
            },
            {
                "name": "Syringe Maintenance",
                "category": "consumables",
                "subcategory": "injection", 
                "unit_cost": 150.0,
                "unit": "maintenance",
                "description": "Syringe cleaning and replacement"
            },
            {
                "name": "Column Maintenance",
                "category": "consumables",
                "subcategory": "column",
                "unit_cost": 50.0,
                "unit": "maintenance",
                "description": "Column conditioning and replacement"
            },
            {
                "name": "Solvent",
                "category": "consumables",
                "subcategory": "solvents",
                "unit_cost": 0.50,
                "unit": "L",
                "description": "HPLC grade solvents for sample prep"
            },
            
            # Labor rates (stored as cost items for flexibility)
            {
                "name": "Technician Labor",
                "category": "labor",
                "subcategory": "technical",
                "unit_cost": 25.0,
                "unit": "hour",
                "description": "Laboratory technician hourly rate"
            },
            {
                "name": "Scientist Labor", 
                "category": "labor",
                "subcategory": "analytical",
                "unit_cost": 45.0,
                "unit": "hour",
                "description": "Analytical scientist hourly rate"
            },
            
            # Instrument time
            {
                "name": "GC-FID Time",
                "category": "instrument_time",
                "subcategory": "gc",
                "unit_cost": 15.0,
                "unit": "hour",
                "description": "GC with flame ionization detector"
            },
            {
                "name": "GC-MS Time",
                "category": "instrument_time", 
                "subcategory": "gc_ms",
                "unit_cost": 25.0,
                "unit": "hour",
                "description": "GC with mass spectrometer"
            },
            {
                "name": "GC-MS/MS Time",
                "category": "instrument_time",
                "subcategory": "gc_ms",
                "unit_cost": 35.0,
                "unit": "hour", 
                "description": "GC with triple quadrupole MS"
            }
        ]
        
        created_items = []
        for item_data in default_items:
            # Check if item already exists
            existing = db.query(CostItem).filter(
                and_(
                    CostItem.name == item_data["name"],
                    CostItem.category == item_data["category"]
                )
            ).first()
            
            if not existing:
                item = CostItem(**item_data)
                db.add(item)
                created_items.append(item)
        
        if created_items:
            db.commit()
            for item in created_items:
                db.refresh(item)
        
        return created_items


# Create service instance
cost_service = CostService()
