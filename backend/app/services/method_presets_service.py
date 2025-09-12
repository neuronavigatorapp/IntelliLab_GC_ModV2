#!/usr/bin/env python3
"""
Enhanced method presets service with ASTM/GPA/EPA standard methods.
"""

from typing import List, Dict, Any, Optional
from app.core.database import SessionLocal, MethodPreset as MethodPresetModel
from app.models.schemas import MethodPreset, MethodPresetCreate, MethodPresetUpdate


class MethodPresetsService:
    """Service for managing method presets including standard industry methods."""
    
    def __init__(self):
        self.standard_presets = self._get_standard_method_presets()
    
    def _get_standard_method_presets(self) -> List[Dict[str, Any]]:
        """Get predefined standard method presets for ASTM/GPA/EPA methods."""
        return [
            {
                "standard_body": "ASTM",
                "code": "D2163",
                "name": "Analysis of Liquefied Petroleum (LP) Gases and Propene Concentrates by Gas Chromatography",
                "description": "Standard test method for the analysis of liquefied petroleum gases and propene concentrates using gas chromatography with thermal conductivity detection",
                "method_type": "hydrocarbon_analysis",
                "parameters": {
                    "column": {
                        "type": "Packed",
                        "stationary_phase": "Porapak Q or equivalent",
                        "length": "6 ft (1.8 m)",
                        "id": "2 mm",
                        "carrier_gas": "helium",
                        "flow_rate": "30 mL/min"
                    },
                    "oven": {
                        "initial_temp": 70,
                        "final_temp": 200,
                        "ramp_rate": 8,
                        "initial_hold": 8,
                        "final_hold": 15
                    },
                    "detector": {
                        "type": "TCD",
                        "temp": 250,
                        "reference_flow": 30,
                        "makeup_flow": 5
                    },
                    "injection": {
                        "type": "gas_sampling_valve",
                        "volume": 0.5,
                        "temp": 150
                    },
                    "compounds": [
                        "methane", "ethylene", "ethane", "propylene", "propane",
                        "isobutane", "n-butane", "isopentane", "n-pentane"
                    ]
                }
            },
            {
                "standard_body": "ASTM",
                "code": "D6730",
                "name": "Determination of Individual Components in Spark Ignition Engine Fuels by 100-Metre Capillary High Resolution Gas Chromatography",
                "description": "Test method for detailed hydrocarbon analysis of gasoline by high-resolution gas chromatography",
                "method_type": "detailed_hydrocarbon_analysis",
                "parameters": {
                    "column": {
                        "type": "Capillary",
                        "stationary_phase": "100% dimethylpolysiloxane",
                        "length": "100 m",
                        "id": "0.25 mm",
                        "film_thickness": "0.5 μm",
                        "carrier_gas": "helium",
                        "flow_rate": "1.2 mL/min"
                    },
                    "oven": {
                        "initial_temp": 35,
                        "initial_hold": 20,
                        "ramp1_rate": 2,
                        "ramp1_final": 200,
                        "ramp1_hold": 0,
                        "ramp2_rate": 10,
                        "ramp2_final": 300,
                        "final_hold": 10
                    },
                    "detector": {
                        "type": "FID",
                        "temp": 300,
                        "h2_flow": 40,
                        "air_flow": 400,
                        "makeup_flow": 25
                    },
                    "injection": {
                        "type": "split",
                        "ratio": 100,
                        "volume": 0.2,
                        "temp": 250
                    },
                    "analysis_groups": [
                        "paraffins", "iso-paraffins", "aromatics", "naphthenes", "olefins"
                    ]
                }
            },
            {
                "standard_body": "ASTM",
                "code": "D5623",
                "name": "Sulfur Compounds in Light Petroleum Liquids by Gas Chromatography and Sulfur Selective Detection",
                "description": "Test method for sulfur compounds in light petroleum liquids using gas chromatography with sulfur chemiluminescence detection",
                "method_type": "sulfur_analysis",
                "parameters": {
                    "column": {
                        "type": "Capillary",
                        "stationary_phase": "DB-1 or equivalent",
                        "length": "30 m",
                        "id": "0.32 mm",
                        "film_thickness": "4.0 μm",
                        "carrier_gas": "helium",
                        "flow_rate": "4.0 mL/min"
                    },
                    "oven": {
                        "initial_temp": 45,
                        "initial_hold": 5,
                        "ramp_rate": 4,
                        "final_temp": 300,
                        "final_hold": 10
                    },
                    "detector": {
                        "type": "SCD",
                        "temp": 800,
                        "burner_temp": 800,
                        "h2_flow": "specific to detector",
                        "air_flow": "specific to detector"
                    },
                    "injection": {
                        "type": "splitless",
                        "volume": 1.0,
                        "temp": 250,
                        "splitless_time": 1.0
                    },
                    "target_compounds": [
                        "hydrogen_sulfide", "carbonyl_sulfide", "methyl_mercaptan",
                        "ethyl_mercaptan", "dimethyl_sulfide", "thiophene"
                    ]
                }
            },
            {
                "standard_body": "GPA",
                "code": "2177",
                "name": "Analysis of Demethanized Hydrocarbon Liquid Mixtures Containing Nitrogen and Carbon Dioxide by Gas Chromatography",
                "description": "GPA standard for analysis of demethanized hydrocarbon liquids with nitrogen and CO2 impurities",
                "method_type": "demethanized_analysis",
                "parameters": {
                    "column": {
                        "type": "Packed",
                        "stationary_phase": "Chromosorb 102",
                        "length": "12 ft (3.7 m)",
                        "id": "1/8 inch",
                        "carrier_gas": "helium",
                        "flow_rate": "50 mL/min"
                    },
                    "oven": {
                        "initial_temp": 90,
                        "initial_hold": 8,
                        "ramp_rate": 8,
                        "final_temp": 200,
                        "final_hold": 20
                    },
                    "detector": {
                        "type": "TCD",
                        "temp": 250,
                        "reference_flow": 50,
                        "sensitivity": "high"
                    },
                    "injection": {
                        "type": "liquid_sampling",
                        "volume": 1.0,
                        "temp": 150
                    },
                    "target_compounds": [
                        "nitrogen", "carbon_dioxide", "ethane", "propane",
                        "isobutane", "n-butane", "isopentane", "n-pentane", "hexanes_plus"
                    ]
                }
            },
            {
                "standard_body": "GPA",
                "code": "2186",
                "name": "Tentative Method of Extended Analysis for Natural Gas and Similar Gaseous Mixtures by Temperature Programmed Gas Chromatography",
                "description": "Extended analysis method for detailed natural gas composition including C6+ hydrocarbons",
                "method_type": "extended_natural_gas",
                "parameters": {
                    "column": {
                        "type": "Capillary",
                        "stationary_phase": "PLOT Alumina or PLOT Molecular Sieve",
                        "length": "50 m",
                        "id": "0.53 mm",
                        "carrier_gas": "helium",
                        "flow_rate": "5.0 mL/min"
                    },
                    "oven": {
                        "initial_temp": 80,
                        "initial_hold": 5,
                        "ramp1_rate": 5,
                        "ramp1_final": 120,
                        "ramp1_hold": 0,
                        "ramp2_rate": 3,
                        "ramp2_final": 200,
                        "final_hold": 30
                    },
                    "detector": {
                        "type": "TCD",
                        "temp": 250,
                        "reference_flow": 5,
                        "makeup_flow": 5
                    },
                    "injection": {
                        "type": "gas_sampling_valve",
                        "volume": 0.25,
                        "temp": 120
                    },
                    "analysis_range": [
                        "hydrogen", "nitrogen", "carbon_dioxide", "methane",
                        "ethane", "propane", "isobutane", "n-butane",
                        "isopentane", "n-pentane", "hexanes", "heptanes_plus"
                    ]
                }
            }
        ]
    
    def create_preset(self, preset_data: MethodPresetCreate) -> MethodPreset:
        """Create a new method preset."""
        with SessionLocal() as db:
            db_preset = MethodPresetModel(**preset_data.dict())
            db.add(db_preset)
            db.commit()
            db.refresh(db_preset)
            return MethodPreset.from_orm(db_preset)
    
    def get_presets(self, standard_body: Optional[str] = None) -> List[MethodPreset]:
        """Get method presets, optionally filtered by standard body."""
        with SessionLocal() as db:
            query = db.query(MethodPresetModel)
            if standard_body:
                query = query.filter(MethodPresetModel.standard_body == standard_body)
            
            presets = query.order_by(MethodPresetModel.created_date.desc()).all()
            return [MethodPreset.from_orm(p) for p in presets]
    
    def get_preset(self, preset_id: int) -> Optional[MethodPreset]:
        """Get a specific preset by ID."""
        with SessionLocal() as db:
            preset = db.query(MethodPresetModel).filter(MethodPresetModel.id == preset_id).first()
            return MethodPreset.from_orm(preset) if preset else None
    
    def update_preset(self, preset_id: int, preset_data: MethodPresetUpdate) -> Optional[MethodPreset]:
        """Update a method preset."""
        with SessionLocal() as db:
            preset = db.query(MethodPresetModel).filter(MethodPresetModel.id == preset_id).first()
            if not preset:
                return None
            
            for field, value in preset_data.dict(exclude_unset=True).items():
                setattr(preset, field, value)
            
            db.commit()
            db.refresh(preset)
            return MethodPreset.from_orm(preset)
    
    def delete_preset(self, preset_id: int) -> bool:
        """Delete a method preset."""
        with SessionLocal() as db:
            preset = db.query(MethodPresetModel).filter(MethodPresetModel.id == preset_id).first()
            if not preset:
                return False
            
            db.delete(preset)
            db.commit()
            return True
    
    def clone_preset(self, preset_id: int, new_name: str, modifications: Optional[Dict[str, Any]] = None) -> Optional[MethodPreset]:
        """Clone an existing preset with optional modifications."""
        with SessionLocal() as db:
            original = db.query(MethodPresetModel).filter(MethodPresetModel.id == preset_id).first()
            if not original:
                return None
            
            # Create clone data
            clone_data = {
                "standard_body": original.standard_body,
                "code": f"{original.code}_clone",
                "name": new_name,
                "description": f"Cloned from {original.name}",
                "method_type": original.method_type,
                "parameters": original.parameters.copy() if original.parameters else {}
            }
            
            # Apply modifications if provided
            if modifications:
                if "parameters" in modifications:
                    clone_data["parameters"].update(modifications["parameters"])
                for key, value in modifications.items():
                    if key != "parameters":
                        clone_data[key] = value
            
            # Create new preset
            clone_preset = MethodPresetModel(**clone_data)
            db.add(clone_preset)
            db.commit()
            db.refresh(clone_preset)
            
            return MethodPreset.from_orm(clone_preset)
    
    def initialize_standard_presets(self) -> List[MethodPreset]:
        """Initialize standard ASTM/GPA presets in the database if they don't exist."""
        created_presets = []
        
        with SessionLocal() as db:
            for preset_data in self.standard_presets:
                # Check if preset already exists
                existing = db.query(MethodPresetModel).filter(
                    MethodPresetModel.standard_body == preset_data["standard_body"],
                    MethodPresetModel.code == preset_data["code"]
                ).first()
                
                if not existing:
                    preset = MethodPresetModel(**preset_data)
                    db.add(preset)
                    db.commit()
                    db.refresh(preset)
                    created_presets.append(MethodPreset.from_orm(preset))
        
        return created_presets
    
    def search_presets(self, query: str, method_type: Optional[str] = None) -> List[MethodPreset]:
        """Search presets by name, code, or description."""
        with SessionLocal() as db:
            search_filter = db.query(MethodPresetModel).filter(
                (MethodPresetModel.name.contains(query)) |
                (MethodPresetModel.code.contains(query)) |
                (MethodPresetModel.description.contains(query))
            )
            
            if method_type:
                search_filter = search_filter.filter(MethodPresetModel.method_type == method_type)
            
            presets = search_filter.order_by(MethodPresetModel.created_date.desc()).all()
            return [MethodPreset.from_orm(p) for p in presets]
    
    def get_preset_categories(self) -> List[Dict[str, Any]]:
        """Get all available preset categories and method types."""
        with SessionLocal() as db:
            categories = db.query(
                MethodPresetModel.standard_body,
                MethodPresetModel.method_type
            ).distinct().all()
            
            result = {}
            for std_body, method_type in categories:
                if std_body not in result:
                    result[std_body] = []
                if method_type not in result[std_body]:
                    result[std_body].append(method_type)
            
            return [
                {"standard_body": body, "method_types": types}
                for body, types in result.items()
            ]


# Service instance
method_presets_service = MethodPresetsService()
