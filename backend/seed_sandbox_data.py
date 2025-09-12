#!/usr/bin/env python3
"""
Comprehensive data seeding script for IntelliLab GC Sandbox
Populates instruments, methods, compounds, and method presets for testing
"""

import asyncio
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Instrument, Method, Compound, MethodPreset


async def seed_instruments(db: Session):
    """Seed sample instruments for testing"""
    instruments = [
        {
            "name": "Primary GC-MS",
            "model": "7890A GC/5975C MS",
            "serial_number": "US10123456",
            "location": "Main Lab",
            "age_years": 3.2,
            "maintenance_level": "Good",
            "vacuum_integrity": 96.5,
            "septum_condition": "Good",
            "liner_condition": "Clean",
            "oven_calibration": "Good",
            "column_condition": "Good",
            "notes": "Primary instrument for volatile organics analysis"
        },
        {
            "name": "Backup GC-FID",
            "model": "8860 GC",
            "serial_number": "US20654321",
            "location": "QC Lab",
            "age_years": 1.8,
            "maintenance_level": "Excellent",
            "vacuum_integrity": 98.2,
            "septum_condition": "New",
            "liner_condition": "Clean",
            "oven_calibration": "Excellent",
            "column_condition": "Good",
            "notes": "Backup instrument for routine hydrocarbon analysis"
        },
        {
            "name": "Training GC",
            "model": "7820A GC",
            "serial_number": "US30987654",
            "location": "Training Room",
            "age_years": 5.1,
            "maintenance_level": "Fair",
            "vacuum_integrity": 92.3,
            "septum_condition": "Worn",
            "liner_condition": "Lightly Contaminated",
            "oven_calibration": "Good",
            "column_condition": "Fair",
            "notes": "Older instrument used for training purposes"
        },
        {
            "name": "Research GC-TCD",
            "model": "Clarus 690 GC",
            "serial_number": "PE40123789",
            "location": "Research Lab",
            "age_years": 2.5,
            "maintenance_level": "Good",
            "vacuum_integrity": 94.7,
            "septum_condition": "Good",
            "liner_condition": "Clean",
            "oven_calibration": "Good",
            "column_condition": "Excellent",
            "notes": "Specialized for permanent gas analysis"
        }
    ]
    
    for instrument_data in instruments:
        existing = db.query(Instrument).filter(
            Instrument.serial_number == instrument_data["serial_number"]
        ).first()
        
        if not existing:
            instrument = Instrument(**instrument_data)
            db.add(instrument)
    
    db.commit()
    print("✓ Instruments seeded successfully")


async def seed_compounds(db: Session):
    """Seed comprehensive compound library"""
    compounds = [
        # Light Hydrocarbons
        {"name": "Methane", "category": "Hydrocarbon", "retention_time": 1.2, "molecular_weight": 16.04, "default_intensity": 1000, "default_width": 0.08},
        {"name": "Ethane", "category": "Hydrocarbon", "retention_time": 1.8, "molecular_weight": 30.07, "default_intensity": 850, "default_width": 0.10},
        {"name": "Propane", "category": "Hydrocarbon", "retention_time": 2.5, "molecular_weight": 44.10, "default_intensity": 750, "default_width": 0.12},
        {"name": "n-Butane", "category": "Hydrocarbon", "retention_time": 3.8, "molecular_weight": 58.12, "default_intensity": 650, "default_width": 0.14},
        {"name": "Isobutane", "category": "Hydrocarbon", "retention_time": 3.2, "molecular_weight": 58.12, "default_intensity": 600, "default_width": 0.13},
        {"name": "n-Pentane", "category": "Hydrocarbon", "retention_time": 5.4, "molecular_weight": 72.15, "default_intensity": 580, "default_width": 0.16},
        {"name": "Isopentane", "category": "Hydrocarbon", "retention_time": 4.8, "molecular_weight": 72.15, "default_intensity": 550, "default_width": 0.15},
        {"name": "n-Hexane", "category": "Hydrocarbon", "retention_time": 7.2, "molecular_weight": 86.18, "default_intensity": 520, "default_width": 0.18},
        {"name": "n-Heptane", "category": "Hydrocarbon", "retention_time": 9.1, "molecular_weight": 100.20, "default_intensity": 480, "default_width": 0.20},
        {"name": "n-Octane", "category": "Hydrocarbon", "retention_time": 11.2, "molecular_weight": 114.23, "default_intensity": 450, "default_width": 0.22},
        
        # Aromatics
        {"name": "Benzene", "category": "Aromatic", "retention_time": 8.4, "molecular_weight": 78.11, "default_intensity": 800, "default_width": 0.19},
        {"name": "Toluene", "category": "Aromatic", "retention_time": 10.6, "molecular_weight": 92.14, "default_intensity": 750, "default_width": 0.21},
        {"name": "Ethylbenzene", "category": "Aromatic", "retention_time": 12.8, "molecular_weight": 106.17, "default_intensity": 650, "default_width": 0.23},
        {"name": "p-Xylene", "category": "Aromatic", "retention_time": 13.2, "molecular_weight": 106.17, "default_intensity": 680, "default_width": 0.24},
        {"name": "m-Xylene", "category": "Aromatic", "retention_time": 13.5, "molecular_weight": 106.17, "default_intensity": 670, "default_width": 0.24},
        {"name": "o-Xylene", "category": "Aromatic", "retention_time": 14.1, "molecular_weight": 106.17, "default_intensity": 660, "default_width": 0.25},
        
        # Oxygenates
        {"name": "Methanol", "category": "Alcohol", "retention_time": 3.9, "molecular_weight": 32.04, "default_intensity": 900, "default_width": 0.14},
        {"name": "Ethanol", "category": "Alcohol", "retention_time": 5.1, "molecular_weight": 46.07, "default_intensity": 850, "default_width": 0.16},
        {"name": "Isopropanol", "category": "Alcohol", "retention_time": 6.3, "molecular_weight": 60.10, "default_intensity": 750, "default_width": 0.17},
        {"name": "Acetone", "category": "Ketone", "retention_time": 4.2, "molecular_weight": 58.08, "default_intensity": 880, "default_width": 0.15},
        {"name": "MEK", "category": "Ketone", "retention_time": 6.8, "molecular_weight": 72.11, "default_intensity": 720, "default_width": 0.18},
        {"name": "MTBE", "category": "Ether", "retention_time": 5.7, "molecular_weight": 88.15, "default_intensity": 780, "default_width": 0.17},
        
        # Environmental Compounds
        {"name": "Chloroform", "category": "Halogenated", "retention_time": 7.8, "molecular_weight": 119.38, "default_intensity": 950, "default_width": 0.19},
        {"name": "Carbon Tetrachloride", "category": "Halogenated", "retention_time": 6.9, "molecular_weight": 153.82, "default_intensity": 920, "default_width": 0.18},
        {"name": "1,1,1-Trichloroethane", "category": "Halogenated", "retention_time": 8.2, "molecular_weight": 133.40, "default_intensity": 880, "default_width": 0.20},
        {"name": "Trichloroethylene", "category": "Halogenated", "retention_time": 9.4, "molecular_weight": 131.39, "default_intensity": 860, "default_width": 0.21},
        {"name": "Tetrachloroethylene", "category": "Halogenated", "retention_time": 10.8, "molecular_weight": 165.83, "default_intensity": 840, "default_width": 0.22},
        
        # Internal Standards
        {"name": "Bromochloromethane", "category": "Internal Standard", "retention_time": 6.1, "molecular_weight": 129.38, "default_intensity": 1000, "default_width": 0.17},
        {"name": "1,4-Difluorobenzene", "category": "Internal Standard", "retention_time": 9.7, "molecular_weight": 114.09, "default_intensity": 1000, "default_width": 0.21},
        {"name": "Chlorobenzene-d5", "category": "Internal Standard", "retention_time": 11.4, "molecular_weight": 117.57, "default_intensity": 1000, "default_width": 0.23}
    ]
    
    for compound_data in compounds:
        existing = db.query(Compound).filter(
            Compound.name == compound_data["name"]
        ).first()
        
        if not existing:
            compound = Compound(**compound_data)
            db.add(compound)
    
    db.commit()
    print("✓ Compounds seeded successfully")


async def seed_methods(db: Session):
    """Seed various GC methods for different applications"""
    methods = [
        {
            "name": "EPA 8260B - Volatile Organics",
            "description": "EPA method for volatile organic compounds in water samples",
            "method_type": "environmental",
            "parameters": {
                "column_type": "DB-624",
                "column_length": 75,
                "column_diameter": 0.45,
                "film_thickness": 2.55,
                "initial_temp": 10,
                "initial_hold": 5,
                "ramp_rate_1": 6,
                "final_temp_1": 200,
                "final_hold": 5,
                "injector_temp": 200,
                "detector_temp": 250,
                "carrier_gas": "Helium",
                "flow_rate": 5.0,
                "split_ratio": 5,
                "injection_volume": 5.0
            }
        },
        {
            "name": "ASTM D3588 - Light Hydrocarbons",
            "description": "ASTM method for C1-C5 hydrocarbons in refinery gas",
            "method_type": "petrochemical",
            "parameters": {
                "column_type": "Alumina",
                "column_length": 50,
                "column_diameter": 0.53,
                "film_thickness": 10.0,
                "initial_temp": 100,
                "initial_hold": 8,
                "ramp_rate_1": 8,
                "final_temp_1": 200,
                "final_hold": 5,
                "injector_temp": 150,
                "detector_temp": 250,
                "carrier_gas": "Helium",
                "flow_rate": 15.0,
                "split_ratio": 1,
                "injection_volume": 0.25
            }
        },
        {
            "name": "GPA 2261 - Natural Gas Analysis",
            "description": "GPA method for natural gas composition analysis",
            "method_type": "natural_gas",
            "parameters": {
                "column_type": "Molecular Sieve",
                "column_length": 30,
                "column_diameter": 0.53,
                "film_thickness": 25.0,
                "initial_temp": 35,
                "initial_hold": 5,
                "ramp_rate_1": 10,
                "final_temp_1": 200,
                "final_hold": 10,
                "injector_temp": 100,
                "detector_temp": 200,
                "carrier_gas": "Helium",
                "flow_rate": 10.0,
                "split_ratio": 1,
                "injection_volume": 0.5
            }
        },
        {
            "name": "BTEX Analysis - Gasoline Range",
            "description": "Method for BTEX compounds in gasoline samples",
            "method_type": "general_gc",
            "parameters": {
                "column_type": "DB-5",
                "column_length": 30,
                "column_diameter": 0.25,
                "film_thickness": 0.25,
                "initial_temp": 40,
                "initial_hold": 3,
                "ramp_rate_1": 5,
                "final_temp_1": 100,
                "hold_time_1": 2,
                "ramp_rate_2": 10,
                "final_temp_2": 250,
                "final_hold": 5,
                "injector_temp": 250,
                "detector_temp": 300,
                "carrier_gas": "Helium",
                "flow_rate": 1.2,
                "split_ratio": 100,
                "injection_volume": 1.0
            }
        },
        {
            "name": "Training Method - Basic GC",
            "description": "Simple method for GC training and education",
            "method_type": "training",
            "parameters": {
                "column_type": "DB-1",
                "column_length": 15,
                "column_diameter": 0.32,
                "film_thickness": 1.0,
                "initial_temp": 50,
                "initial_hold": 2,
                "ramp_rate_1": 15,
                "final_temp_1": 200,
                "final_hold": 3,
                "injector_temp": 200,
                "detector_temp": 250,
                "carrier_gas": "Nitrogen",
                "flow_rate": 2.0,
                "split_ratio": 50,
                "injection_volume": 1.0
            }
        },
        {
            "name": "Headspace VOC - Water Analysis",
            "description": "Headspace method for VOCs in water samples",
            "method_type": "headspace",
            "parameters": {
                "column_type": "DB-624",
                "column_length": 30,
                "column_diameter": 0.25,
                "film_thickness": 1.4,
                "initial_temp": 40,
                "initial_hold": 4,
                "ramp_rate_1": 8,
                "final_temp_1": 220,
                "final_hold": 8,
                "injector_temp": 180,
                "detector_temp": 250,
                "carrier_gas": "Helium",
                "flow_rate": 1.5,
                "headspace_temp": 85,
                "equilibration_time": 20,
                "injection_time": 0.5
            }
        }
    ]
    
    for method_data in methods:
        existing = db.query(Method).filter(
            Method.name == method_data["name"]
        ).first()
        
        if not existing:
            method = Method(**method_data)
            db.add(method)
    
    db.commit()
    print("✓ Methods seeded successfully")


async def seed_method_presets(db: Session):
    """Seed standard method presets from ASTM, EPA, GPA"""
    presets = [
        {
            "standard_body": "ASTM",
            "code": "D3588",
            "name": "Dissolved Gases in Electrical Insulating Oil",
            "description": "Standard test method for dissolved gases in electrical insulating oil by gas chromatography",
            "method_type": "transformer_oil",
            "parameters": {
                "column_type": "Molecular Sieve 5A + Porapak Q",
                "carrier_gas": "Argon",
                "detector": "TCD",
                "temperature_program": "Isothermal 80°C"
            }
        },
        {
            "standard_body": "ASTM",
            "code": "D6420",
            "name": "Aromatic Content of Spark Ignition Engine Fuel",
            "description": "Standard test method for aromatic content of spark ignition engine fuel by supercritical fluid chromatography",
            "method_type": "fuel_analysis",
            "parameters": {
                "column_type": "Silica",
                "mobile_phase": "CO2/Methanol",
                "detector": "FID",
                "pressure": "150 bar",
                "temperature": "40°C"
            }
        },
        {
            "standard_body": "EPA",
            "code": "8015D",
            "name": "Nonhalogenated Organics Using GC/FID",
            "description": "EPA method for nonhalogenated organics using gas chromatography/flame ionization detection",
            "method_type": "environmental",
            "parameters": {
                "column_type": "DB-5",
                "detector": "FID",
                "initial_temp": 10,
                "final_temp": 300,
                "ramp_rate": "10°C/min",
                "injection_mode": "Splitless"
            }
        },
        {
            "standard_body": "EPA",
            "code": "8260D",
            "name": "Volatile Organic Compounds by GC/MS",
            "description": "EPA method for volatile organic compounds in various matrices by GC/MS",
            "method_type": "environmental",
            "parameters": {
                "column_type": "DB-624",
                "detector": "MS",
                "initial_temp": 10,
                "final_temp": 200,
                "ramp_rate": "6°C/min",
                "scan_range": "35-300 amu"
            }
        },
        {
            "standard_body": "GPA",
            "code": "2261",
            "name": "Analysis of Natural Gas by Gas Chromatography",
            "description": "GPA standard for the analysis of natural gas and similar gaseous mixtures by gas chromatography",
            "method_type": "natural_gas",
            "parameters": {
                "column_1": "Molecular Sieve 5A",
                "column_2": "Porapak Q",
                "detector": "TCD",
                "carrier_gas": "Helium",
                "injection_temp": "100°C",
                "column_temp": "35°C isothermal"
            }
        },
        {
            "standard_body": "GPA",
            "code": "2286",
            "name": "Sulfur Compounds in Natural Gas",
            "description": "GPA standard for the determination of sulfur compounds in natural gas and gaseous fuels",
            "method_type": "sulfur_analysis",
            "parameters": {
                "column_type": "DB-1",
                "detector": "SCD",
                "initial_temp": 40,
                "final_temp": 200,
                "ramp_rate": "10°C/min",
                "injection_mode": "Split"
            }
        }
    ]
    
    for preset_data in presets:
        existing = db.query(MethodPreset).filter(
            MethodPreset.code == preset_data["code"],
            MethodPreset.standard_body == preset_data["standard_body"]
        ).first()
        
        if not existing:
            preset = MethodPreset(**preset_data)
            db.add(preset)
    
    db.commit()
    print("✓ Method presets seeded successfully")


async def main():
    """Main seeding function"""
    print("🌱 Starting IntelliLab GC Sandbox data seeding...")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Seed all data types
        await seed_instruments(db)
        await seed_compounds(db)
        await seed_methods(db)
        await seed_method_presets(db)
        
        print("✅ All data seeded successfully!")
        print("\n📊 Database Summary:")
        
        # Print summary statistics
        instrument_count = db.query(Instrument).count()
        compound_count = db.query(Compound).count()
        method_count = db.query(Method).count()
        preset_count = db.query(MethodPreset).count()
        
        print(f"   Instruments: {instrument_count}")
        print(f"   Compounds: {compound_count}")
        print(f"   Methods: {method_count}")
        print(f"   Method Presets: {preset_count}")
        
        print("\n🚀 Ready for testing and demonstration!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
