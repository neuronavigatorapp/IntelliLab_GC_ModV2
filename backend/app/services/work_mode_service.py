#!/usr/bin/env python3
"""
Work Mode service for managing user work mode preferences in refinery environments.
"""

from typing import Optional, List, Dict, Any
from app.core.database import SessionLocal, WorkMode as WorkModeModel
from app.models.schemas import WorkMode, WorkModeCreate, WorkModeUpdate, WorkModeType


class WorkModeService:
    """Service for managing work mode preferences."""
    
    def __init__(self):
        self.predefined_modes = self._get_predefined_work_modes()
    
    def _get_predefined_work_modes(self) -> Dict[str, Dict[str, Any]]:
        """Get predefined work mode configurations."""
        return {
            "full": {
                "mode_name": WorkModeType.FULL,
                "enabled_modules": [
                    "dashboard", "sandbox", "instruments", "methods", "compounds",
                    "analytics", "reports", "settings", "ai_diagnostics", "run_history",
                    "method_presets", "templates", "costs", "samples", "qc"
                ],
                "dashboard_config": {
                    "layout": "full",
                    "show_recent_runs": True,
                    "show_statistics": True,
                    "show_instruments": True,
                    "show_methods": True,
                    "show_alerts": True,
                    "charts": ["run_trends", "peak_statistics", "instrument_status"]
                },
                "quick_access_tools": [
                    "sandbox_run", "inlet_simulator", "detection_limit", "oven_ramp",
                    "ai_diagnostics", "method_comparison"
                ],
                "auto_launch_module": "dashboard"
            },
            "work": {
                "mode_name": WorkModeType.WORK,
                "enabled_modules": [
                    "dashboard", "sandbox", "instruments", "methods",
                    "ai_diagnostics", "run_history", "method_presets"
                ],
                "dashboard_config": {
                    "layout": "compact",
                    "show_recent_runs": True,
                    "show_statistics": True,
                    "show_instruments": True,
                    "show_methods": False,
                    "show_alerts": True,
                    "charts": ["run_trends", "instrument_status"]
                },
                "quick_access_tools": [
                    "sandbox_run", "ai_diagnostics", "quick_method_select"
                ],
                "auto_launch_module": "sandbox"
            },
            "troubleshooting": {
                "mode_name": WorkModeType.TROUBLESHOOTING,
                "enabled_modules": [
                    "dashboard", "ai_diagnostics", "run_history", "instruments",
                    "method_presets", "analytics"
                ],
                "dashboard_config": {
                    "layout": "diagnostic",
                    "show_recent_runs": True,
                    "show_statistics": False,
                    "show_instruments": True,
                    "show_methods": False,
                    "show_alerts": True,
                    "charts": ["fault_patterns", "diagnostic_history"]
                },
                "quick_access_tools": [
                    "ai_diagnostics", "fault_patterns", "run_comparison",
                    "instrument_status"
                ],
                "auto_launch_module": "ai_diagnostics"
            },
            "maintenance": {
                "mode_name": WorkModeType.MAINTENANCE,
                "enabled_modules": [
                    "dashboard", "instruments", "analytics", "run_history",
                    "qc", "reports"
                ],
                "dashboard_config": {
                    "layout": "maintenance",
                    "show_recent_runs": False,
                    "show_statistics": True,
                    "show_instruments": True,
                    "show_methods": False,
                    "show_alerts": True,
                    "charts": ["instrument_health", "maintenance_schedule"]
                },
                "quick_access_tools": [
                    "instrument_status", "maintenance_schedule", "performance_trends",
                    "calibration_check"
                ],
                "auto_launch_module": "instruments"
            },
            "quality_control": {
                "mode_name": WorkModeType.QUALITY_CONTROL,
                "enabled_modules": [
                    "dashboard", "qc", "run_history", "analytics",
                    "reports", "methods", "calibration"
                ],
                "dashboard_config": {
                    "layout": "qc",
                    "show_recent_runs": True,
                    "show_statistics": True,
                    "show_instruments": False,
                    "show_methods": True,
                    "show_alerts": True,
                    "charts": ["qc_trends", "control_charts", "method_performance"]
                },
                "quick_access_tools": [
                    "qc_check", "control_charts", "method_validation",
                    "calibration_verify"
                ],
                "auto_launch_module": "qc"
            }
        }
    
    def get_user_work_mode(self, user_id: int) -> Optional[WorkMode]:
        """Get work mode for a user."""
        with SessionLocal() as db:
            work_mode = db.query(WorkModeModel).filter(WorkModeModel.user_id == user_id).first()
            return WorkMode.from_orm(work_mode) if work_mode else None
    
    def create_user_work_mode(self, user_id: int, mode_data: WorkModeCreate) -> WorkMode:
        """Create work mode for a user."""
        with SessionLocal() as db:
            # Check if user already has a work mode
            existing = db.query(WorkModeModel).filter(WorkModeModel.user_id == user_id).first()
            if existing:
                db.delete(existing)
                db.commit()
            
            # Create new work mode
            work_mode = WorkModeModel(
                user_id=user_id,
                mode_name=mode_data.mode_name.value,
                enabled_modules=mode_data.enabled_modules,
                dashboard_config=mode_data.dashboard_config,
                quick_access_tools=mode_data.quick_access_tools,
                auto_launch_module=mode_data.auto_launch_module
            )
            db.add(work_mode)
            db.commit()
            db.refresh(work_mode)
            
            return WorkMode.from_orm(work_mode)
    
    def update_user_work_mode(self, user_id: int, mode_data: WorkModeUpdate) -> Optional[WorkMode]:
        """Update work mode for a user."""
        with SessionLocal() as db:
            work_mode = db.query(WorkModeModel).filter(WorkModeModel.user_id == user_id).first()
            if not work_mode:
                return None
            
            # Update fields
            for field, value in mode_data.dict(exclude_unset=True).items():
                if field == "mode_name" and value:
                    value = value.value
                setattr(work_mode, field, value)
            
            # Update last_used timestamp
            from datetime import datetime
            work_mode.last_used = datetime.now()
            
            db.commit()
            db.refresh(work_mode)
            
            return WorkMode.from_orm(work_mode)
    
    def set_predefined_mode(self, user_id: int, mode_name: str) -> WorkMode:
        """Set a predefined work mode for a user."""
        if mode_name not in self.predefined_modes:
            raise ValueError(f"Unknown predefined mode: {mode_name}")
        
        mode_config = self.predefined_modes[mode_name]
        
        mode_data = WorkModeCreate(
            user_id=user_id,
            mode_name=WorkModeType(mode_config["mode_name"]),
            enabled_modules=mode_config["enabled_modules"],
            dashboard_config=mode_config["dashboard_config"],
            quick_access_tools=mode_config["quick_access_tools"],
            auto_launch_module=mode_config["auto_launch_module"]
        )
        
        return self.create_user_work_mode(user_id, mode_data)
    
    def get_predefined_modes(self) -> List[Dict[str, Any]]:
        """Get list of available predefined work modes."""
        modes = []
        for mode_name, config in self.predefined_modes.items():
            modes.append({
                "name": mode_name,
                "display_name": mode_name.replace("_", " ").title(),
                "description": self._get_mode_description(mode_name),
                "enabled_modules": config["enabled_modules"],
                "quick_access_tools": config["quick_access_tools"],
                "auto_launch_module": config["auto_launch_module"]
            })
        
        return modes
    
    def _get_mode_description(self, mode_name: str) -> str:
        """Get description for a work mode."""
        descriptions = {
            "full": "Complete access to all IntelliLab GC features and modules",
            "work": "Streamlined interface focused on essential analysis tools for daily work",
            "troubleshooting": "Diagnostic-focused interface for instrument troubleshooting and fault analysis",
            "maintenance": "Maintenance-focused interface for instrument health monitoring and upkeep",
            "quality_control": "QC-focused interface for quality control procedures and compliance"
        }
        return descriptions.get(mode_name, "Custom work mode configuration")
    
    def get_module_availability(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all available modules."""
        return {
            "dashboard": {
                "name": "Dashboard",
                "description": "Main overview and system status",
                "category": "core",
                "required": True
            },
            "sandbox": {
                "name": "GC Sandbox",
                "description": "Virtual instrument simulation and testing",
                "category": "simulation",
                "required": False
            },
            "instruments": {
                "name": "Instrument Management",
                "description": "Manage and monitor GC instruments",
                "category": "management",
                "required": False
            },
            "methods": {
                "name": "Method Management", 
                "description": "Create and manage GC methods",
                "category": "management",
                "required": False
            },
            "compounds": {
                "name": "Compound Library",
                "description": "Manage compound database",
                "category": "data",
                "required": False
            },
            "analytics": {
                "name": "Analytics",
                "description": "Advanced data analysis and reporting",
                "category": "analysis",
                "required": False
            },
            "ai_diagnostics": {
                "name": "AI Diagnostics",
                "description": "AI-powered fault detection and troubleshooting",
                "category": "ai",
                "required": False
            },
            "run_history": {
                "name": "Run History",
                "description": "Search and analyze historical runs",
                "category": "data",
                "required": False
            },
            "method_presets": {
                "name": "Method Presets",
                "description": "ASTM/GPA/EPA standard method templates",
                "category": "standards",
                "required": False
            },
            "qc": {
                "name": "Quality Control",
                "description": "QC procedures and compliance monitoring",
                "category": "quality",
                "required": False
            },
            "reports": {
                "name": "Reports",
                "description": "Generate and export reports",
                "category": "reporting",
                "required": False
            },
            "settings": {
                "name": "Settings",
                "description": "System configuration and preferences",
                "category": "system",
                "required": False
            }
        }
    
    def validate_work_mode(self, work_mode: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a work mode configuration."""
        available_modules = self.get_module_availability()
        errors = []
        warnings = []
        
        # Check enabled modules
        enabled_modules = work_mode.get("enabled_modules", [])
        for module in enabled_modules:
            if module not in available_modules:
                errors.append(f"Unknown module: {module}")
        
        # Check required modules
        required_modules = [name for name, info in available_modules.items() if info.get("required")]
        for required in required_modules:
            if required not in enabled_modules:
                warnings.append(f"Required module not enabled: {required}")
        
        # Check auto-launch module
        auto_launch = work_mode.get("auto_launch_module")
        if auto_launch and auto_launch not in enabled_modules:
            errors.append(f"Auto-launch module '{auto_launch}' is not in enabled modules")
        
        # Check quick access tools (simplified validation)
        quick_tools = work_mode.get("quick_access_tools", [])
        if len(quick_tools) > 10:
            warnings.append("Too many quick access tools (recommended: max 10)")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def get_work_mode_statistics(self) -> Dict[str, Any]:
        """Get statistics about work mode usage."""
        with SessionLocal() as db:
            from sqlalchemy import func
            
            # Count users by mode
            mode_counts = db.query(
                WorkModeModel.mode_name,
                func.count(WorkModeModel.id).label('count')
            ).group_by(WorkModeModel.mode_name).all()
            
            # Get total users with work modes
            total_users = db.query(WorkModeModel).count()
            
            # Get recently active modes
            recent_modes = db.query(WorkModeModel).order_by(
                WorkModeModel.last_used.desc()
            ).limit(10).all()
            
            return {
                "total_users_with_modes": total_users,
                "mode_distribution": {
                    mode: count for mode, count in mode_counts
                },
                "recent_activity": [
                    {
                        "user_id": mode.user_id,
                        "mode_name": mode.mode_name,
                        "last_used": mode.last_used.isoformat() if mode.last_used else None
                    }
                    for mode in recent_modes
                ],
                "available_predefined_modes": len(self.predefined_modes)
            }


# Service instance
work_mode_service = WorkModeService()
