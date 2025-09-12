#!/usr/bin/env python3
"""
Database initialization script for Phase 6 Advanced Workflow Features
Populates sample data for templates, cost items, samples, and more.
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import (
    engine, SessionLocal, init_db,
    MethodTemplate, Sample, CostItem, Report, Instrument, User
)
from app.services.qc_service import qc_service
from app.models.schemas import QCTarget


def populate_qc_targets():
    """Populate sample QC targets for demonstration"""
    
    # Sample QC targets for different analytes and methods
    qc_targets = [
        QCTarget(
            id="qc-target-benzene-1",
            methodId="1",
            instrumentId="1",
            analyte="Benzene",
            mean=5.000,
            sd=0.250,
            unit="ppm",
            n_required=20
        ),
        QCTarget(
            id="qc-target-toluene-1",
            methodId="1",
            instrumentId="1",
            analyte="Toluene",
            mean=10.000,
            sd=0.500,
            unit="ppm",
            n_required=20
        ),
        QCTarget(
            id="qc-target-xylene-1",
            methodId="1",
            instrumentId="1",
            analyte="Xylene",
            mean=7.500,
            sd=0.375,
            unit="ppm",
            n_required=20
        ),
        QCTarget(
            id="qc-target-ethylbenzene-1",
            methodId="1",
            instrumentId=None,  # Applies to all instruments
            analyte="Ethylbenzene",
            mean=3.000,
            sd=0.150,
            unit="ppm",
            n_required=15
        ),
        QCTarget(
            id="qc-target-btex-composite-2",
            methodId="2",
            instrumentId="2",
            analyte="BTEX Composite",
            mean=25.000,
            sd=1.250,
            unit="ppm",
            n_required=25
        )
    ]
    
    # Add targets to QC service
    for target in qc_targets:
        try:
            qc_service.upsert_qc_target(target)
            print(f"✓ Added QC target: {target.analyte} (Method {target.methodId})")
        except Exception as e:
            print(f"✗ Failed to add QC target {target.analyte}: {e}")


def populate_sample_templates(db: Session):
    """Populate sample method templates for all tool types"""
    
    # Detection Limit Calculator Templates
    detection_templates = [
        {
            "name": "EPA Method 8260D - VOCs",
            "category": "Environmental",
            "tool_type": "detection_limit",
            "description": "Standard EPA method for volatile organic compounds analysis",
            "parameters": {
                "detector_type": "MS",
                "carrier_gas": "Helium",
                "column_type": "DB-624",
                "injector_temp": 200,
                "detector_temp": 280,
                "oven_temp": 40,
                "flow_rate": 1.2,
                "split_ratio": 10.0,
                "injection_volume": 1.0,
                "sample_concentration": 50.0,
                "signal_to_noise": 3.0,
                "noise_level": 0.1,
                "peak_height": 15.0,
                "concentration_factor": 1.0,
                "optimization_target": "sensitivity",
                "h2_flow": 0,
                "air_flow": 0,
                "makeup_flow": 1.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 45,
            "tags": ["EPA", "VOC", "Environmental", "MS"]
        },
        {
            "name": "BTEX Analysis - Petrochemicals",
            "category": "Petrochemical",
            "tool_type": "detection_limit",
            "description": "Benzene, Toluene, Ethylbenzene, and Xylene analysis for petrochemical samples",
            "parameters": {
                "detector_type": "FID",
                "carrier_gas": "Helium",
                "column_type": "DB-1",
                "injector_temp": 250,
                "detector_temp": 300,
                "oven_temp": 35,
                "flow_rate": 2.0,
                "split_ratio": 50.0,
                "injection_volume": 0.5,
                "sample_concentration": 100.0,
                "signal_to_noise": 5.0,
                "noise_level": 0.3,
                "peak_height": 25.0,
                "concentration_factor": 1.0,
                "optimization_target": "sensitivity",
                "h2_flow": 30,
                "air_flow": 300,
                "makeup_flow": 25
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 32,
            "tags": ["BTEX", "Petrochemical", "FID", "Aromatics"]
        },
        {
            "name": "Pharmaceutical Impurities",
            "category": "Pharmaceutical",
            "tool_type": "detection_limit",
            "description": "Detection of trace impurities in pharmaceutical compounds",
            "parameters": {
                "detector_type": "FID",
                "carrier_gas": "Nitrogen",
                "column_type": "HP-5",
                "injector_temp": 280,
                "detector_temp": 320,
                "oven_temp": 60,
                "flow_rate": 1.5,
                "split_ratio": 20.0,
                "injection_volume": 2.0,
                "sample_concentration": 10.0,
                "signal_to_noise": 10.0,
                "noise_level": 0.05,
                "peak_height": 50.0,
                "concentration_factor": 1.0,
                "optimization_target": "sensitivity",
                "h2_flow": 35,
                "air_flow": 350,
                "makeup_flow": 30
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 18,
            "tags": ["Pharmaceutical", "Impurities", "Trace", "FID"]
        }
    ]
    
    # Oven Ramp Templates
    oven_templates = [
        {
            "name": "Fast GC - Light Hydrocarbons",
            "category": "Petrochemical",
            "tool_type": "oven_ramp",
            "description": "Rapid analysis of C1-C6 hydrocarbons",
            "parameters": {
                "initial_temp": 35.0,
                "initial_hold": 2.0,
                "ramp_rate_1": 20.0,
                "final_temp_1": 120.0,
                "hold_time_1": 1.0,
                "ramp_rate_2": 30.0,
                "final_temp_2": 200.0,
                "hold_time_2": 0.0,
                "ramp_rate_3": 0.0,
                "final_temp_3": 200.0,
                "hold_time_3": 0.0,
                "equilibration_time": 1.0,
                "post_run_temp": 35.0,
                "post_run_time": 2.0,
                "total_time": 12.0,
                "flow_rate": 2.5,
                "pressure": 15.0,
                "split_ratio": 100.0,
                "injector_temp": 200.0,
                "detector_temp": 250.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 67,
            "tags": ["Fast GC", "Hydrocarbons", "Petrochemical", "C1-C6"]
        },
        {
            "name": "General Purpose - Wide Range",
            "category": "General",
            "tool_type": "oven_ramp",
            "description": "General purpose method for wide boiling point range compounds",
            "parameters": {
                "initial_temp": 50.0,
                "initial_hold": 3.0,
                "ramp_rate_1": 10.0,
                "final_temp_1": 150.0,
                "hold_time_1": 2.0,
                "ramp_rate_2": 15.0,
                "final_temp_2": 250.0,
                "hold_time_2": 5.0,
                "ramp_rate_3": 20.0,
                "final_temp_3": 300.0,
                "hold_time_3": 3.0,
                "equilibration_time": 1.0,
                "post_run_temp": 50.0,
                "post_run_time": 5.0,
                "total_time": 35.0,
                "flow_rate": 1.5,
                "pressure": 12.0,
                "split_ratio": 20.0,
                "injector_temp": 250.0,
                "detector_temp": 280.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 89,
            "tags": ["General", "Wide Range", "Versatile", "Multi-compound"]
        },
        {
            "name": "High Boilers - Wax Analysis",
            "category": "Petrochemical",
            "tool_type": "oven_ramp",
            "description": "Analysis of high boiling point compounds and waxes",
            "parameters": {
                "initial_temp": 80.0,
                "initial_hold": 1.0,
                "ramp_rate_1": 5.0,
                "final_temp_1": 200.0,
                "hold_time_1": 5.0,
                "ramp_rate_2": 8.0,
                "final_temp_2": 350.0,
                "hold_time_2": 10.0,
                "ramp_rate_3": 0.0,
                "final_temp_3": 350.0,
                "hold_time_3": 0.0,
                "equilibration_time": 2.0,
                "post_run_temp": 80.0,
                "post_run_time": 8.0,
                "total_time": 50.0,
                "flow_rate": 1.0,
                "pressure": 8.0,
                "split_ratio": 5.0,
                "injector_temp": 350.0,
                "detector_temp": 380.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 23,
            "tags": ["High Boilers", "Wax", "Petrochemical", "Heavy Compounds"]
        }
    ]
    
    # Inlet Simulator Templates
    inlet_templates = [
        {
            "name": "Split Injection - Volatiles",
            "category": "General",
            "tool_type": "inlet_simulator",
            "description": "Optimized split injection for volatile compounds",
            "parameters": {
                "injection_mode": "split",
                "injector_temp": 250,
                "carrier_gas": "Helium",
                "flow_rate": 1.5,
                "split_ratio": 10.0,
                "splitless_time": 0.0,
                "liner_type": "Single taper with wool",
                "injection_volume": 1.0,
                "syringe_type": "10µL",
                "sample_solvent": "methanol",
                "sample_concentration": 100.0,
                "needle_penetration": 50,
                "injection_speed": "fast",
                "pressure": 12.0,
                "total_flow": 15.0,
                "septum_purge": 3.0,
                "gas_saver": True,
                "gas_saver_flow": 5.0,
                "gas_saver_time": 2.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 78,
            "tags": ["Split", "Volatiles", "Standard", "General"]
        },
        {
            "name": "Splitless - Trace Analysis",
            "category": "Environmental",
            "tool_type": "inlet_simulator",
            "description": "Splitless injection for trace level analysis",
            "parameters": {
                "injection_mode": "splitless",
                "injector_temp": 280,
                "carrier_gas": "Helium",
                "flow_rate": 1.2,
                "split_ratio": 1.0,
                "splitless_time": 1.5,
                "liner_type": "Straight with wool",
                "injection_volume": 2.0,
                "syringe_type": "10µL",
                "sample_solvent": "hexane",
                "sample_concentration": 10.0,
                "needle_penetration": 45,
                "injection_speed": "medium",
                "pressure": 15.0,
                "total_flow": 1.2,
                "septum_purge": 1.0,
                "gas_saver": True,
                "gas_saver_flow": 2.0,
                "gas_saver_time": 3.0
            },
            "created_by": 1,
            "is_public": True,
            "usage_count": 54,
            "tags": ["Splitless", "Trace", "Environmental", "Sensitive"]
        }
    ]
    
    # Add all templates to database
    all_templates = detection_templates + oven_templates + inlet_templates
    
    for template_data in all_templates:
        template = MethodTemplate(**template_data)
        db.add(template)
    
    print(f"Added {len(all_templates)} method templates")


def populate_cost_items(db: Session):
    """Populate cost calculation items"""
    
    cost_items = [
        # Consumables - Columns
        {
            "name": "DB-1 Column (30m x 0.32mm x 0.25µm)",
            "category": "consumables",
            "subcategory": "columns",
            "unit_cost": 850.0,
            "unit": "column",
            "supplier": "Agilent",
            "part_number": "122-1033",
            "description": "General purpose non-polar column",
            "is_active": True,
            "parameters": {
                "current_stock": 2,
                "reorder_threshold": 1,
                "critical_threshold": 0,
                "reorder_quantity": 5,
                "supplier_lead_time_days": 14,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 1,
                        "quantity_used": 0.1,
                        "analysis_count": 100,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Column wear from analysis"
                    }
                ]
            }
        },
        {
            "name": "DB-5 Column (30m x 0.25mm x 0.25µm)",
            "category": "consumables",
            "subcategory": "columns",
            "unit_cost": 920.0,
            "unit": "column",
            "supplier": "Agilent",
            "part_number": "122-5532",
            "description": "Low-polarity phase column",
            "is_active": True,
            "parameters": {
                "current_stock": 1,
                "reorder_threshold": 1,
                "critical_threshold": 0,
                "reorder_quantity": 3,
                "supplier_lead_time_days": 14,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 2,
                        "quantity_used": 0.1,
                        "analysis_count": 50,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Column wear from analysis"
                    }
                ]
            }
        },
        {
            "name": "DB-624 Column (30m x 0.32mm x 1.8µm)",
            "category": "consumables",
            "subcategory": "columns",
            "unit_cost": 1150.0,
            "unit": "column",
            "supplier": "Agilent",
            "part_number": "122-1334",
            "description": "VOC analysis column",
            "is_active": True,
            "parameters": {
                "current_stock": 0,
                "reorder_threshold": 1,
                "critical_threshold": 0,
                "reorder_quantity": 2,
                "supplier_lead_time_days": 14,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 3,
                        "quantity_used": 1,
                        "analysis_count": 200,
                        "usage_date": "2024-01-10T10:30:00",
                        "notes": "Column replacement needed"
                    }
                ]
            }
        },
        
        # Consumables - Carrier Gases
        {
            "name": "Helium Ultra High Purity",
            "category": "consumables",
            "subcategory": "gases",
            "unit_cost": 0.15,
            "unit": "L",
            "supplier": "Airgas",
            "part_number": "HE UHP300",
            "description": "99.9999% pure helium carrier gas",
            "is_active": True,
            "parameters": {
                "current_stock": 5000,
                "reorder_threshold": 1000,
                "critical_threshold": 500,
                "reorder_quantity": 10000,
                "supplier_lead_time_days": 3,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 4,
                        "quantity_used": 100,
                        "analysis_count": 20,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Daily gas consumption"
                    }
                ]
            }
        },
        {
            "name": "Hydrogen Generator Gas",
            "category": "consumables",
            "subcategory": "gases",
            "unit_cost": 0.05,
            "unit": "L",
            "supplier": "Peak Scientific",
            "part_number": "H2-300",
            "description": "On-demand hydrogen generation",
            "is_active": True,
            "parameters": {
                "current_stock": 2000,
                "reorder_threshold": 500,
                "critical_threshold": 200,
                "reorder_quantity": 5000,
                "supplier_lead_time_days": 5,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 5,
                        "quantity_used": 50,
                        "analysis_count": 20,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Daily FID gas consumption"
                    }
                ]
            }
        },
        {
            "name": "Zero Air",
            "category": "consumables",
            "subcategory": "gases",
            "unit_cost": 0.02,
            "unit": "L",
            "supplier": "Airgas",
            "part_number": "AI Z300",
            "description": "Hydrocarbon-free air",
            "is_active": True,
            "parameters": {
                "current_stock": 3000,
                "reorder_threshold": 1000,
                "critical_threshold": 500,
                "reorder_quantity": 8000,
                "supplier_lead_time_days": 3,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 6,
                        "quantity_used": 200,
                        "analysis_count": 20,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Daily FID air consumption"
                    }
                ]
            }
        },
        
        # Consumables - Vials and Accessories
        {
            "name": "2mL Clear Glass Vials",
            "category": "consumables",
            "subcategory": "vials",
            "unit_cost": 0.45,
            "unit": "vial",
            "supplier": "Agilent",
            "part_number": "5182-0543",
            "description": "Clear glass autosampler vials",
            "is_active": True,
            "parameters": {
                "current_stock": 200,
                "reorder_threshold": 50,
                "critical_threshold": 20,
                "reorder_quantity": 500,
                "supplier_lead_time_days": 7,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 7,
                        "quantity_used": 20,
                        "analysis_count": 20,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Daily sample vials"
                    }
                ]
            }
        },
        {
            "name": "Crimp Top Caps with Septa",
            "category": "consumables",
            "subcategory": "vials",
            "unit_cost": 0.18,
            "unit": "cap",
            "supplier": "Agilent",
            "part_number": "5182-0717",
            "description": "Aluminum crimp caps with PTFE/silicone septa",
            "is_active": True,
            "parameters": {
                "current_stock": 500,
                "reorder_threshold": 100,
                "critical_threshold": 50,
                "reorder_quantity": 1000,
                "supplier_lead_time_days": 7,
                "auto_reorder_enabled": False,
                "alert_email": "",
                "usage_history": [
                    {
                        "consumable_id": 1,
                        "quantity_used": 10,
                        "analysis_count": 20,
                        "usage_date": "2024-01-15T10:30:00",
                        "notes": "Daily analysis batch"
                    },
                    {
                        "consumable_id": 1,
                        "quantity_used": 8,
                        "analysis_count": 16,
                        "usage_date": "2024-01-14T10:30:00",
                        "notes": "Daily analysis batch"
                    }
                ]
            }
        },
        {
            "name": "Inlet Liner - Single Taper",
            "category": "consumables",
            "subcategory": "liners",
            "unit_cost": 25.0,
            "unit": "liner",
            "supplier": "Agilent",
            "part_number": "5183-4647",
            "description": "Single taper liner with wool",
            "is_active": True
        },
        {
            "name": "Inlet Septum - 11mm",
            "category": "consumables",
            "subcategory": "septa",
            "unit_cost": 2.50,
            "unit": "septum",
            "supplier": "Agilent",
            "part_number": "5183-4759",
            "description": "Pre-slit inlet septum",
            "is_active": True
        },
        
        # Labor Costs
        {
            "name": "Analytical Chemist",
            "category": "labor",
            "subcategory": "analyst",
            "unit_cost": 65.0,
            "unit": "hour",
            "supplier": "Internal",
            "part_number": "LAB-CHEM",
            "description": "Analytical chemist hourly rate",
            "is_active": True
        },
        {
            "name": "Senior Scientist",
            "category": "labor",
            "subcategory": "scientist",
            "unit_cost": 85.0,
            "unit": "hour",
            "supplier": "Internal",
            "part_number": "LAB-SCI",
            "description": "Senior scientist hourly rate",
            "is_active": True
        },
        {
            "name": "Laboratory Technician",
            "category": "labor",
            "subcategory": "technician",
            "unit_cost": 45.0,
            "unit": "hour",
            "supplier": "Internal",
            "part_number": "LAB-TECH",
            "description": "Laboratory technician hourly rate",
            "is_active": True
        },
        
        # Instrument Time
        {
            "name": "GC-MS Instrument Time",
            "category": "instrument_time",
            "subcategory": "gc_ms",
            "unit_cost": 25.0,
            "unit": "hour",
            "supplier": "Internal",
            "part_number": "INST-GCMS",
            "description": "GC-MS instrument hourly operating cost",
            "is_active": True
        },
        {
            "name": "GC-FID Instrument Time",
            "category": "instrument_time",
            "subcategory": "gc_fid",
            "unit_cost": 15.0,
            "unit": "hour",
            "supplier": "Internal",
            "part_number": "INST-GCFID",
            "description": "GC-FID instrument hourly operating cost",
            "is_active": True
        }
    ]
    
    for item_data in cost_items:
        cost_item = CostItem(**item_data)
        db.add(cost_item)
    
    print(f"Added {len(cost_items)} cost items")


def populate_sample_data(db: Session):
    """Populate sample tracking data"""
    
    base_date = datetime.now()
    
    samples = [
        {
            "sample_id": "ENV-2024-001",
            "name": "Groundwater Monitoring Well #3",
            "matrix": "Water",
            "prep_date": base_date - timedelta(days=2),
            "analyst_id": 1,
            "status": "analysis",
            "priority": "normal",
            "notes": "VOC screening for EPA Method 8260D",
            "sample_metadata": {
                "client": "Environmental Services Inc.",
                "project": "Groundwater Monitoring Q4 2024",
                "sampling_location": "MW-03, 15ft depth",
                "preservation": "HCl, 4°C",
                "holding_time": "14 days"
            },
            "chain_of_custody": [
                {
                    "date": (base_date - timedelta(days=3)).isoformat(),
                    "from": "Field Sampler",
                    "to": "Laboratory",
                    "condition": "Good"
                },
                {
                    "date": (base_date - timedelta(days=2)).isoformat(),
                    "from": "Laboratory",
                    "to": "Prep Tech",
                    "condition": "Good"
                }
            ]
        },
        {
            "sample_id": "PET-2024-057",
            "name": "Crude Oil - Texas Sweet",
            "matrix": "Oil",
            "prep_date": base_date - timedelta(days=1),
            "analyst_id": 1,
            "status": "prep",
            "priority": "high",
            "notes": "BTEX analysis for refinery quality control",
            "sample_metadata": {
                "client": "Petrotech Refining",
                "project": "Daily QC Batch 057",
                "sampling_location": "Tank 5, mid-level",
                "preservation": "Ambient temperature",
                "holding_time": "7 days"
            },
            "chain_of_custody": [
                {
                    "date": (base_date - timedelta(days=1)).isoformat(),
                    "from": "Process Engineer",
                    "to": "Laboratory",
                    "condition": "Good"
                }
            ]
        },
        {
            "sample_id": "PHARM-2024-QC23",
            "name": "Active Pharmaceutical Ingredient Lot QC23",
            "matrix": "Solid",
            "prep_date": base_date,
            "analyst_id": 1,
            "status": "received",
            "priority": "urgent",
            "notes": "Impurity analysis for batch release",
            "sample_metadata": {
                "client": "PharmaCorp Manufacturing",
                "project": "Batch Release Testing",
                "sampling_location": "Production Line A, Final Product",
                "preservation": "Desiccant, room temperature",
                "holding_time": "30 days"
            },
            "chain_of_custody": [
                {
                    "date": base_date.isoformat(),
                    "from": "QC Manager",
                    "to": "Laboratory",
                    "condition": "Sealed"
                }
            ]
        },
        {
            "sample_id": "ENV-2024-002",
            "name": "Soil Composite - Building Site",
            "matrix": "Soil",
            "prep_date": base_date - timedelta(days=5),
            "analyst_id": 1,
            "status": "complete",
            "priority": "normal",
            "notes": "Hydrocarbon screening for site assessment",
            "sample_metadata": {
                "client": "Environmental Consultants LLC",
                "project": "Phase II Site Assessment",
                "sampling_location": "Grid locations 1-5, 0-2ft depth",
                "preservation": "4°C, no headspace",
                "holding_time": "14 days"
            },
            "chain_of_custody": [
                {
                    "date": (base_date - timedelta(days=6)).isoformat(),
                    "from": "Field Geologist",
                    "to": "Laboratory",
                    "condition": "Good"
                },
                {
                    "date": (base_date - timedelta(days=5)).isoformat(),
                    "from": "Laboratory",
                    "to": "Analyst",
                    "condition": "Good"
                }
            ],
            "analysis_results": {
                "compounds_detected": ["Benzene", "Toluene", "Xylenes"],
                "total_petroleum_hydrocarbons": 45.2,
                "analysis_date": (base_date - timedelta(days=3)).isoformat(),
                "method": "EPA 8260D Modified"
            }
        },
        {
            "sample_id": "REF-2024-018",
            "name": "Diesel Fuel Blend Analysis",
            "matrix": "Fuel",
            "prep_date": base_date - timedelta(hours=8),
            "analyst_id": 1,
            "status": "analysis",
            "priority": "high",
            "notes": "Blend verification for fuel quality standards",
            "sample_metadata": {
                "client": "Regional Fuel Distributors",
                "project": "Blend Verification Program",
                "sampling_location": "Storage Tank 12, Loading Rack",
                "preservation": "Ambient temperature, sealed container",
                "holding_time": "7 days"
            },
            "chain_of_custody": [
                {
                    "date": (base_date - timedelta(hours=10)).isoformat(),
                    "from": "Terminal Operator",
                    "to": "Laboratory",
                    "condition": "Good"
                }
            ]
        }
    ]
    
    for sample_data in samples:
        sample = Sample(**sample_data)
        db.add(sample)
    
    print(f"Added {len(samples)} sample records")


def populate_instruments(db: Session):
    """Populate instrument data if not already present"""
    
    # Check if instruments already exist
    existing_count = db.query(Instrument).count()
    if existing_count > 0:
        print(f"Instruments already exist ({existing_count} found), skipping instrument creation")
        return
    
    instruments = [
        {
            "name": "PDH-GC001",
            "model": "Agilent 7890A",
            "serial_number": "CN15123001",
            "install_date": "2019-03-15",
            "location": "Lab A - Petrochemical Division",
            "age_years": 5.8,
            "maintenance_level": "Excellent",
            "vacuum_integrity": 98.5,
            "septum_condition": "Good",
            "liner_condition": "Clean",
            "oven_calibration": "Excellent",
            "column_condition": "Good",
            "last_maintenance": "2024-01-15",
            "notes": "Primary instrument for petrochemical analysis",
            "parameters": {
                "max_temp": 450,
                "detectors": ["FID", "TCD"],
                "injectors": ["Split/Splitless"],
                "autosampler": "7693A"
            }
        },
        {
            "name": "PDH-GC002",
            "model": "Agilent 7890B",
            "serial_number": "CN16234002",
            "install_date": "2020-07-22",
            "location": "Lab A - Petrochemical Division",
            "age_years": 4.4,
            "maintenance_level": "Good",
            "vacuum_integrity": 96.2,
            "septum_condition": "New",
            "liner_condition": "Clean",
            "oven_calibration": "Good",
            "column_condition": "Excellent",
            "last_maintenance": "2024-02-01",
            "notes": "Backup instrument for high-throughput analysis",
            "parameters": {
                "max_temp": 450,
                "detectors": ["FID", "MS"],
                "injectors": ["Split/Splitless", "PTV"],
                "autosampler": "7693A"
            }
        },
        {
            "name": "IBDH-GC001",
            "model": "Shimadzu GC-2030",
            "serial_number": "S2030001",
            "install_date": "2022-11-10",
            "location": "Lab B - Environmental Division",
            "age_years": 2.1,
            "maintenance_level": "Excellent",
            "vacuum_integrity": 99.1,
            "septum_condition": "New",
            "liner_condition": "New",
            "oven_calibration": "Excellent",
            "column_condition": "New",
            "last_maintenance": "2024-01-30",
            "notes": "Dedicated to environmental analysis and trace detection",
            "parameters": {
                "max_temp": 450,
                "detectors": ["FID", "ECD", "MS"],
                "injectors": ["Split/Splitless"],
                "autosampler": "AOC-20i"
            }
        }
    ]
    
    for instrument_data in instruments:
        instrument = Instrument(**instrument_data)
        db.add(instrument)
    
    print(f"Added {len(instruments)} instruments")


def populate_users(db: Session):
    """Populate user data if not already present"""
    
    # Check if users already exist
    existing_count = db.query(User).count()
    if existing_count > 0:
        print(f"Users already exist ({existing_count} found), skipping user creation")
        return
    
    users = [
        {
            "email": "analyst@intellilab.com",
            "full_name": "Dr. Sarah Chen",
            "hashed_password": "hashed_password_here",  # In real app, properly hash this
            "role": "scientist",
            "is_active": True,
            "department": "Analytical Chemistry",
            "phone": "(555) 123-4567"
        },
        {
            "email": "admin@intellilab.com",
            "full_name": "Michael Rodriguez",
            "hashed_password": "hashed_password_here",  # In real app, properly hash this
            "role": "admin",
            "is_active": True,
            "department": "Laboratory Management",
            "phone": "(555) 987-6543"
        }
    ]
    
    for user_data in users:
        user = User(**user_data)
        db.add(user)
    
    print(f"Added {len(users)} users")


def populate_calibration_data():
    """Populate sample calibration data"""
    from app.services.quant_service import quant_service
    from app.models.schemas import CalibrationLevel, CalibrationModel
    
    # Create sample calibration for Benzene analysis
    benzene_levels = [
        CalibrationLevel(
            level_id="1",
            target_name="Benzene",
            amount=1.0,
            unit="ppm",
            peak_name="Benzene",
            area=150.5,
            rt=8.5
        ),
        CalibrationLevel(
            level_id="2", 
            target_name="Benzene",
            amount=5.0,
            unit="ppm",
            peak_name="Benzene",
            area=750.2,
            rt=8.5
        ),
        CalibrationLevel(
            level_id="3",
            target_name="Benzene", 
            amount=10.0,
            unit="ppm",
            peak_name="Benzene",
            area=1500.8,
            rt=8.5
        )
    ]
    
    benzene_calibration = quant_service.create_calibration(
        method_id=1,
        instrument_id=1,
        target_name="Benzene",
        model_type="linear",
        levels=benzene_levels,
        notes="Benzene calibration for environmental analysis"
    )
    
    # Activate the calibration
    quant_service.activate_calibration(benzene_calibration.id)
    
    print(f"Created sample calibration: {benzene_calibration.id}")


def populate_sequence_data():
    """Populate sample sequence templates"""
    from app.services.sequence_service import sequence_service
    from app.models.schemas import SequenceItem, SequenceTemplate
    
    # Create a standard calibration sequence
    calibration_items = [
        SequenceItem(
            order=1,
            type="Blank",
            sample_name="Blank_1",
            method_id=1
        ),
        SequenceItem(
            order=2,
            type="Std",
            sample_name="Std_1ppm",
            method_id=1,
            expected_level=1.0
        ),
        SequenceItem(
            order=3,
            type="Std", 
            sample_name="Std_5ppm",
            method_id=1,
            expected_level=5.0
        ),
        SequenceItem(
            order=4,
            type="Std",
            sample_name="Std_10ppm", 
            method_id=1,
            expected_level=10.0
        ),
        SequenceItem(
            order=5,
            type="Sample",
            sample_name="Sample_Unknown_1",
            method_id=1
        )
    ]
    
    calibration_template = sequence_service.create_template(
        name="Benzene Calibration Sequence",
        instrument_id=1,
        items=calibration_items,
        notes="Standard calibration sequence for benzene analysis"
    )
    
    print(f"Created sample sequence template: {calibration_template.id}")


def main():
    """Main initialization function"""
    print("Initializing IntelliLab GC database...")
    
    # Initialize database
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Populate sample data
        populate_sample_templates(db)
        populate_cost_items(db)
        populate_sample_data(db)
        populate_instruments(db)
        populate_users(db)
        
        # Populate calibration and sequence data
        populate_calibration_data()
        populate_sequence_data()
        
        # Populate QC targets
        populate_qc_targets()
        
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
