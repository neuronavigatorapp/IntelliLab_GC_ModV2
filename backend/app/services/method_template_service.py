#!/usr/bin/env python3
"""
Method Template Service for IntelliLab GC
Handles CRUD operations for reusable method templates
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import json

from app.core.database import MethodTemplate, User
from app.models.schemas import MethodTemplateCreate, MethodTemplateUpdate


class MethodTemplateService:
    """Service for managing method templates"""
    
    def __init__(self):
        self.predefined_categories = [
            "Hydrocarbons",
            "Environmental", 
            "Pharmaceutical",
            "Food & Beverage",
            "Petrochemical",
            "Forensic",
            "Research",
            "Quality Control",
            "Custom"
        ]
        
        self.tool_types = [
            "inlet_simulator",
            "detection_limit",
            "oven_ramp",
            "chromatogram_analysis",
            "predictive_maintenance"
        ]
    
    def create_template(
        self, 
        db: Session, 
        template_data: Dict[str, Any], 
        user_id: int
    ) -> MethodTemplate:
        """Create a new method template"""
        
        # Validate tool type
        if template_data.get("tool_type") not in self.tool_types:
            raise ValueError(f"Invalid tool_type. Must be one of: {self.tool_types}")
        
        # Create template instance
        template = MethodTemplate(
            name=template_data["name"],
            category=template_data.get("category", "Custom"),
            tool_type=template_data["tool_type"],
            description=template_data.get("description", ""),
            parameters=template_data["parameters"],
            created_by=user_id,
            is_public=template_data.get("is_public", False),
            tags=template_data.get("tags", [])
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return template
    
    def get_template(self, db: Session, template_id: int) -> Optional[MethodTemplate]:
        """Get a template by ID"""
        return db.query(MethodTemplate).filter(MethodTemplate.id == template_id).first()
    
    def get_templates(
        self, 
        db: Session, 
        user_id: Optional[int] = None,
        category: Optional[str] = None,
        tool_type: Optional[str] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MethodTemplate]:
        """Get templates with optional filtering"""
        
        query = db.query(MethodTemplate)
        
        # Filter by access rights (public templates + user's own templates)
        if user_id is not None:
            query = query.filter(
                or_(
                    MethodTemplate.is_public == True,
                    MethodTemplate.created_by == user_id
                )
            )
        elif is_public is not None:
            query = query.filter(MethodTemplate.is_public == is_public)
        
        # Filter by category
        if category:
            query = query.filter(MethodTemplate.category == category)
        
        # Filter by tool type
        if tool_type:
            query = query.filter(MethodTemplate.tool_type == tool_type)
        
        # Search in name, description, and tags
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    MethodTemplate.name.ilike(search_term),
                    MethodTemplate.description.ilike(search_term),
                    MethodTemplate.tags.contains(search)
                )
            )
        
        # Order by popularity (usage_count) and creation date
        query = query.order_by(
            MethodTemplate.usage_count.desc(),
            MethodTemplate.created_date.desc()
        )
        
        return query.offset(skip).limit(limit).all()
    
    def update_template(
        self, 
        db: Session, 
        template_id: int, 
        template_data: Dict[str, Any],
        user_id: int
    ) -> Optional[MethodTemplate]:
        """Update an existing template"""
        
        template = self.get_template(db, template_id)
        if not template:
            return None
        
        # Check if user has permission to update
        if template.created_by != user_id:
            # Only allow if user is admin (this would need role checking)
            # For now, only allow the creator to update
            raise PermissionError("Only the template creator can update this template")
        
        # Update fields
        for field, value in template_data.items():
            if hasattr(template, field) and field != "id":
                setattr(template, field, value)
        
        template.modified_date = datetime.utcnow()
        
        db.commit()
        db.refresh(template)
        
        return template
    
    def delete_template(
        self, 
        db: Session, 
        template_id: int, 
        user_id: int
    ) -> bool:
        """Delete a template"""
        
        template = self.get_template(db, template_id)
        if not template:
            return False
        
        # Check permissions
        if template.created_by != user_id:
            raise PermissionError("Only the template creator can delete this template")
        
        db.delete(template)
        db.commit()
        
        return True
    
    def increment_usage(self, db: Session, template_id: int) -> bool:
        """Increment usage count when template is used"""
        
        template = self.get_template(db, template_id)
        if not template:
            return False
        
        template.usage_count += 1
        db.commit()
        
        return True
    
    def get_categories(self) -> List[str]:
        """Get available template categories"""
        return self.predefined_categories
    
    def get_tool_types(self) -> List[str]:
        """Get available tool types"""
        return self.tool_types
    
    def create_predefined_templates(self, db: Session, admin_user_id: int) -> List[MethodTemplate]:
        """Create predefined templates for common GC analyses"""
        
        predefined_templates = [
            {
                "name": "BTEX Analysis - Split Injection",
                "category": "Environmental",
                "tool_type": "inlet_simulator",
                "description": "Standard BTEX (Benzene, Toluene, Ethylbenzene, Xylenes) analysis using split injection",
                "parameters": {
                    "injection_temperature": 250.0,
                    "split_ratio": 20.0,
                    "injection_volume": 1.0,
                    "liner_type": "Split",
                    "carrier_gas": "Helium",
                    "carrier_flow": 1.5,
                    "inlet_pressure": 12.0
                },
                "tags": ["BTEX", "environmental", "split", "VOC"]
            },
            {
                "name": "TPH Analysis - Splitless Injection", 
                "category": "Environmental",
                "tool_type": "inlet_simulator",
                "description": "Total Petroleum Hydrocarbons analysis using splitless injection for trace analysis",
                "parameters": {
                    "injection_temperature": 280.0,
                    "split_ratio": 0.0,
                    "injection_volume": 2.0,
                    "liner_type": "Splitless",
                    "carrier_gas": "Helium",
                    "carrier_flow": 1.2,
                    "inlet_pressure": 15.0
                },
                "tags": ["TPH", "environmental", "splitless", "hydrocarbons"]
            },
            {
                "name": "Pharmaceutical Impurities - High Sensitivity",
                "category": "Pharmaceutical",
                "tool_type": "detection_limit",
                "description": "Detection limit optimization for pharmaceutical impurity analysis",
                "parameters": {
                    "signal_to_noise": 3.0,
                    "noise_level": 0.5,
                    "peak_height": 2.5,
                    "injection_volume": 1.0,
                    "concentration_factor": 1.0,
                    "optimization_target": "sensitivity"
                },
                "tags": ["pharmaceutical", "impurities", "sensitivity", "LOD"]
            },
            {
                "name": "Pesticide Residues - Multi-residue Method",
                "category": "Food & Beverage", 
                "tool_type": "detection_limit",
                "description": "Multi-residue pesticide analysis with optimized detection limits",
                "parameters": {
                    "signal_to_noise": 10.0,
                    "noise_level": 1.0,
                    "peak_height": 15.0,
                    "injection_volume": 2.0,
                    "concentration_factor": 5.0,
                    "optimization_target": "LOQ"
                },
                "tags": ["pesticides", "food", "multi-residue", "LOQ"]
            },
            {
                "name": "Standard Temperature Program - General Purpose",
                "category": "Quality Control",
                "tool_type": "oven_ramp",
                "description": "General purpose temperature program for routine analysis",
                "parameters": {
                    "initial_temp": 50.0,
                    "initial_time": 2.0,
                    "ramp_rate": 10.0,
                    "final_temp": 280.0,
                    "final_time": 5.0,
                    "ramp_segments": [
                        {"rate": 10.0, "final_temp": 150.0, "hold_time": 1.0},
                        {"rate": 15.0, "final_temp": 280.0, "hold_time": 5.0}
                    ]
                },
                "tags": ["general", "routine", "temperature", "QC"]
            },
            {
                "name": "Fast GC - High Throughput",
                "category": "Quality Control", 
                "tool_type": "oven_ramp",
                "description": "Fast temperature program for high throughput analysis",
                "parameters": {
                    "initial_temp": 40.0,
                    "initial_time": 0.5,
                    "ramp_rate": 25.0,
                    "final_temp": 250.0,
                    "final_time": 2.0,
                    "ramp_segments": [
                        {"rate": 25.0, "final_temp": 120.0, "hold_time": 0.0},
                        {"rate": 30.0, "final_temp": 250.0, "hold_time": 2.0}
                    ]
                },
                "tags": ["fast", "high-throughput", "rapid", "productivity"]
            }
        ]
        
        created_templates = []
        for template_data in predefined_templates:
            # Check if template already exists
            existing = db.query(MethodTemplate).filter(
                and_(
                    MethodTemplate.name == template_data["name"],
                    MethodTemplate.tool_type == template_data["tool_type"]
                )
            ).first()
            
            if not existing:
                template = MethodTemplate(
                    **template_data,
                    created_by=admin_user_id,
                    is_public=True
                )
                db.add(template)
                created_templates.append(template)
        
        if created_templates:
            db.commit()
            for template in created_templates:
                db.refresh(template)
        
        return created_templates


# Create service instance
method_template_service = MethodTemplateService()
