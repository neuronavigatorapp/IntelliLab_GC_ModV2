"""
IntelliLab GC - Comprehensive Midstream Compound Database
Supports all process streams, detectors, and column types
"""

import json
import pandas as pd
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Union
from enum import Enum

class ProcessStream(Enum):
    PDH = "Propane Dehydrogenation"
    IBDH = "Isobutane Dehydrogenation" 
    FRACTIONATOR = "Fractionator"
    Y_GRADE = "Y-Grade Pipeline"
    CRUDE_SEPARATION = "Crude Separation"
    HIGH_PURITY = "High Purity Products"
    OXYGENATES = "Oxygenates/Additives"
    PERMANENT_GASES = "Permanent Gases"
    SULFUR_COMPOUNDS = "Sulfur Compounds"

class DetectorType(Enum):
    FID = "Flame Ionization Detector"
    TCD = "Thermal Conductivity Detector"
    SCD = "Sulfur Chemiluminescence Detector"
    MS = "Mass Spectrometer"
    PID = "Photoionization Detector"
    ECD = "Electron Capture Detector"

class ColumnType(Enum):
    # Packed Columns
    PORAPAK_Q = "Porapak Q"
    PORAPAK_N = "Porapak N"
    MOLECULAR_SIEVE = "Molecular Sieve 5A"
    CHROMOSORB = "Chromosorb 102"
    
    # Capillary - General Purpose
    DB1 = "DB-1 (100% Dimethylpolysiloxane)"
    DB5 = "DB-5 (5% Phenyl 95% Dimethylpolysiloxane)"
    HP1 = "HP-1 (100% Dimethylpolysiloxane)"
    
    # Capillary - PLOT Columns
    PLOT_Q = "HP-PLOT Q (Divinylbenzene)"
    PLOT_U = "HP-PLOT U (Divinylbenzene)"
    PLOT_AL2O3 = "HP-PLOT Al2O3"
    PLOT_MOLESIEVE = "HP-PLOT MoleSieve"
    
    # Specialized Midstream Columns
    LOWOX = "Lowox (Low Oxygen PLOT)"
    MAPD = "MAPD (Methyl Aluminum Phosphonate Deactivated)"
    GS_GASPRO = "GS-GasPro"
    CP_PORABOND = "CP-PoraBOND Q"
    RT_QBOND = "RT-QBond"
    
    # Oxygenates Specific
    DB_WAX = "DB-Wax (Polyethylene Glycol)"
    FFAP = "FFAP (Nitroterephthalic Acid)"
    
    # Sulfur Specific  
    DB_SULFUR_SCD = "DB-Sulfur SCD"
    HP_1_SULFUR = "HP-1 for Sulfur"
    
    # TCD Column (added for compatibility)
    TCD = "TCD Compatible Column"

@dataclass
class CompoundData:
    name: str
    formula: str
    cas_number: str
    molecular_weight: float
    boiling_point: float  # °C at 1 atm
    process_streams: List[ProcessStream]
    astm_methods: List[str]
    
    # Retention times by column type (minutes)
    retention_times: Dict[ColumnType, float]
    
    # Detector responses (relative)
    detector_responses: Dict[DetectorType, float]
    
    # Typical concentration ranges (ppm or mol%)
    typical_ranges: Dict[ProcessStream, tuple]  # (min, max)
    
    # Physical properties for simulation
    vapor_pressure: Optional[float] = None  # kPa at 25°C
    antoine_constants: Optional[tuple] = None  # (A, B, C)
    critical_temp: Optional[float] = None  # °C
    critical_pressure: Optional[float] = None  # bar

class CompoundDatabase:
    def __init__(self):
        self.compounds = self._initialize_database()
        
    def _initialize_database(self) -> Dict[str, CompoundData]:
        """Initialize comprehensive compound database"""
        compounds = {}
        
        # PERMANENT GASES & LIGHT HYDROCARBONS
        compounds["hydrogen"] = CompoundData(
            name="Hydrogen",
            formula="H2",
            cas_number="1333-74-0",
            molecular_weight=2.016,
            boiling_point=-252.9,
            process_streams=[ProcessStream.PDH, ProcessStream.IBDH, ProcessStream.PERMANENT_GASES],
            astm_methods=["D6730", "D1946"],
            retention_times={
                ColumnType.MOLECULAR_SIEVE: 0.8,
                ColumnType.PLOT_MOLESIEVE: 1.2,
                ColumnType.TCD: 0.9
            },
            detector_responses={
                DetectorType.TCD: 1.0,
                DetectorType.FID: 0.0,  # No response
                DetectorType.MS: 0.8
            },
            typical_ranges={
                ProcessStream.PDH: (1000, 50000),  # ppm
                ProcessStream.IBDH: (500, 30000)
            }
        )
        
        compounds["methane"] = CompoundData(
            name="Methane",
            formula="CH4", 
            cas_number="74-82-8",
            molecular_weight=16.043,
            boiling_point=-161.5,
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.FRACTIONATOR, ProcessStream.PDH],
            astm_methods=["D6730", "D2163", "D1946"], 
            retention_times={
                ColumnType.PORAPAK_Q: 1.5,
                ColumnType.PLOT_Q: 2.1,
                ColumnType.LOWOX: 1.8,
                ColumnType.GS_GASPRO: 1.2
            },
            detector_responses={
                DetectorType.FID: 1.0,
                DetectorType.TCD: 0.7,
                DetectorType.MS: 1.0
            },
            typical_ranges={
                ProcessStream.Y_GRADE: (10000, 85000),  # ppm
                ProcessStream.PDH: (100, 5000)
            }
        )
        
        compounds["ethane"] = CompoundData(
            name="Ethane",
            formula="C2H6",
            cas_number="74-84-0", 
            molecular_weight=30.070,
            boiling_point=-88.6,
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.FRACTIONATOR, ProcessStream.PDH],
            astm_methods=["D6730", "D2163"],
            retention_times={
                ColumnType.PORAPAK_Q: 2.8,
                ColumnType.PLOT_Q: 3.5,
                ColumnType.LOWOX: 3.1,
                ColumnType.DB1: 1.2
            },
            detector_responses={
                DetectorType.FID: 2.0,
                DetectorType.TCD: 0.8,
                DetectorType.MS: 1.1
            },
            typical_ranges={
                ProcessStream.Y_GRADE: (5000, 25000),
                ProcessStream.PDH: (50, 2000)
            }
        )
        
        compounds["ethylene"] = CompoundData(
            name="Ethylene", 
            formula="C2H4",
            cas_number="74-85-1",
            molecular_weight=28.054,
            boiling_point=-103.8,
            process_streams=[ProcessStream.PDH, ProcessStream.FRACTIONATOR],
            astm_methods=["D6730", "UOP539"],
            retention_times={
                ColumnType.PLOT_AL2O3: 2.2,
                ColumnType.LOWOX: 2.5,
                ColumnType.MAPD: 2.1,
                ColumnType.GS_GASPRO: 1.8
            },
            detector_responses={
                DetectorType.FID: 1.9,
                DetectorType.TCD: 0.75,
                DetectorType.MS: 1.0
            },
            typical_ranges={
                ProcessStream.PDH: (100, 8000),
                ProcessStream.FRACTIONATOR: (10, 1000)
            }
        )
        
        # PROPANE/PROPYLENE - Critical PDH Components
        compounds["propane"] = CompoundData(
            name="Propane",
            formula="C3H8",
            cas_number="74-98-6", 
            molecular_weight=44.097,
            boiling_point=-42.1,
            process_streams=[ProcessStream.PDH, ProcessStream.Y_GRADE, ProcessStream.HIGH_PURITY],
            astm_methods=["D2163", "D6730", "D2504"],
            retention_times={
                ColumnType.PORAPAK_Q: 4.5,
                ColumnType.PLOT_Q: 5.2,
                ColumnType.LOWOX: 4.8,
                ColumnType.DB1: 2.1,
                ColumnType.PLOT_AL2O3: 3.8
            },
            detector_responses={
                DetectorType.FID: 3.0,
                DetectorType.TCD: 0.9,
                DetectorType.MS: 1.2
            },
            typical_ranges={
                ProcessStream.PDH: (800000, 950000),  # Feed stream - very high
                ProcessStream.HIGH_PURITY: (980000, 999500),  # Product spec
                ProcessStream.Y_GRADE: (15000, 45000)
            }
        )
        
        compounds["propylene"] = CompoundData(
            name="Propylene",
            formula="C3H6", 
            cas_number="115-07-1",
            molecular_weight=42.081,
            boiling_point=-47.7,
            process_streams=[ProcessStream.PDH, ProcessStream.HIGH_PURITY, ProcessStream.FRACTIONATOR],
            astm_methods=["D2163", "UOP539", "D6159"],
            retention_times={
                ColumnType.PLOT_AL2O3: 3.2,
                ColumnType.LOWOX: 4.2,
                ColumnType.MAPD: 3.5,
                ColumnType.DB1: 1.9,
                ColumnType.PLOT_Q: 4.8
            },
            detector_responses={
                DetectorType.FID: 2.8,
                DetectorType.TCD: 0.85,
                DetectorType.MS: 1.15
            },
            typical_ranges={
                ProcessStream.PDH: (20000, 180000),  # Product stream
                ProcessStream.HIGH_PURITY: (950000, 998000),  # Polymer grade
                ProcessStream.FRACTIONATOR: (100, 15000)
            }
        )
        
        # BUTANES/BUTENES - IBDH Critical Components
        compounds["isobutane"] = CompoundData(
            name="Isobutane",
            formula="C4H10",
            cas_number="75-28-5",
            molecular_weight=58.123,
            boiling_point=-11.7,
            process_streams=[ProcessStream.IBDH, ProcessStream.Y_GRADE, ProcessStream.HIGH_PURITY],
            astm_methods=["D2163", "D6730"],
            retention_times={
                ColumnType.PORAPAK_Q: 6.8,
                ColumnType.PLOT_Q: 8.1,
                ColumnType.DB1: 3.5,
                ColumnType.LOWOX: 7.2
            },
            detector_responses={
                DetectorType.FID: 4.0,
                DetectorType.TCD: 1.0,
                DetectorType.MS: 1.3
            },
            typical_ranges={
                ProcessStream.IBDH: (750000, 920000),  # Feed stream
                ProcessStream.HIGH_PURITY: (995000, 999000),  # Product spec
                ProcessStream.Y_GRADE: (8000, 25000)
            }
        )
        
        compounds["n_butane"] = CompoundData(
            name="n-Butane", 
            formula="C4H10",
            cas_number="106-97-8",
            molecular_weight=58.123,
            boiling_point=-0.5,
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.FRACTIONATOR, ProcessStream.IBDH],
            astm_methods=["D2163", "D6730"],
            retention_times={
                ColumnType.PORAPAK_Q: 7.5,
                ColumnType.PLOT_Q: 8.8,
                ColumnType.DB1: 4.1,
                ColumnType.LOWOX: 7.9
            },
            detector_responses={
                DetectorType.FID: 4.0,
                DetectorType.TCD: 1.0,
                DetectorType.MS: 1.3
            },
            typical_ranges={
                ProcessStream.Y_GRADE: (12000, 35000),
                ProcessStream.IBDH: (50, 5000),  # Impurity in feed
                ProcessStream.FRACTIONATOR: (100000, 800000)
            }
        )
        
        compounds["isobutylene"] = CompoundData(
            name="Isobutylene",
            formula="C4H8",
            cas_number="115-11-7", 
            molecular_weight=56.108,
            boiling_point=-6.9,
            process_streams=[ProcessStream.IBDH, ProcessStream.HIGH_PURITY, ProcessStream.OXYGENATES],
            astm_methods=["UOP539", "D6159", "D5441"],
            retention_times={
                ColumnType.PLOT_AL2O3: 5.1,
                ColumnType.LOWOX: 6.5,
                ColumnType.MAPD: 5.8,
                ColumnType.DB1: 3.2
            },
            detector_responses={
                DetectorType.FID: 3.8,
                DetectorType.TCD: 0.95,
                DetectorType.MS: 1.25
            },
            typical_ranges={
                ProcessStream.IBDH: (15000, 150000),  # Product stream
                ProcessStream.HIGH_PURITY: (940000, 995000),  # MTBE feedstock
                ProcessStream.OXYGENATES: (50000, 300000)
            }
        )
        
        compounds["1_butene"] = CompoundData(
            name="1-Butene",
            formula="C4H8", 
            cas_number="106-98-9",
            molecular_weight=56.108,
            boiling_point=-6.3,
            process_streams=[ProcessStream.FRACTIONATOR, ProcessStream.IBDH],
            astm_methods=["UOP539", "D6159"],
            retention_times={
                ColumnType.PLOT_AL2O3: 5.8,
                ColumnType.LOWOX: 7.1,
                ColumnType.MAPD: 6.5,
                ColumnType.DB1: 3.8
            },
            detector_responses={
                DetectorType.FID: 3.7,
                DetectorType.TCD: 0.92,
                DetectorType.MS: 1.2
            },
            typical_ranges={
                ProcessStream.FRACTIONATOR: (5000, 85000),
                ProcessStream.IBDH: (1000, 15000)
            }
        )
        
        # OXYGENATES - Critical for gasoline blending
        compounds["mtbe"] = CompoundData(
            name="MTBE (Methyl tert-Butyl Ether)",
            formula="C5H12O",
            cas_number="1634-04-4",
            molecular_weight=88.150,
            boiling_point=55.2,
            process_streams=[ProcessStream.OXYGENATES, ProcessStream.FRACTIONATOR],
            astm_methods=["D4815", "D5599", "D5845"],
            retention_times={
                ColumnType.DB_WAX: 8.5,
                ColumnType.FFAP: 9.2,
                ColumnType.DB1: 6.8,
                ColumnType.DB5: 7.1
            },
            detector_responses={
                DetectorType.FID: 5.2,
                DetectorType.MS: 1.8,
                DetectorType.PID: 2.1
            },
            typical_ranges={
                ProcessStream.OXYGENATES: (850000, 980000),  # Product stream
                ProcessStream.FRACTIONATOR: (10, 5000)  # Trace contamination
            }
        )
        
        compounds["methanol"] = CompoundData(
            name="Methanol",
            formula="CH4O",
            cas_number="67-56-1", 
            molecular_weight=32.042,
            boiling_point=64.7,
            process_streams=[ProcessStream.OXYGENATES],
            astm_methods=["D5501", "D4815"],
            retention_times={
                ColumnType.DB_WAX: 4.2,
                ColumnType.FFAP: 3.8,
                ColumnType.PORAPAK_Q: 12.5
            },
            detector_responses={
                DetectorType.FID: 1.8,
                DetectorType.TCD: 0.6,
                DetectorType.MS: 1.0
            },
            typical_ranges={
                ProcessStream.OXYGENATES: (100, 15000)  # Impurity/byproduct
            }
        )
        
        # SULFUR COMPOUNDS - Critical for pipeline specs
        compounds["h2s"] = CompoundData(
            name="Hydrogen Sulfide",
            formula="H2S",
            cas_number="7783-06-4",
            molecular_weight=34.082,
            boiling_point=-60.3,
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.CRUDE_SEPARATION, ProcessStream.SULFUR_COMPOUNDS],
            astm_methods=["D5504", "D6228", "UOP163"],
            retention_times={
                ColumnType.DB_SULFUR_SCD: 2.1,
                ColumnType.PORAPAK_Q: 8.5,
                ColumnType.CHROMOSORB: 3.2
            },
            detector_responses={
                DetectorType.SCD: 10.0,  # Excellent response
                DetectorType.TCD: 1.2,
                DetectorType.FID: 0.0,  # No response
                DetectorType.MS: 2.5
            },
            typical_ranges={
                ProcessStream.Y_GRADE: (0.1, 50),  # ppm - pipeline spec <4ppm
                ProcessStream.CRUDE_SEPARATION: (10, 1000)
            }
        )
        
        compounds["mercaptan_ethyl"] = CompoundData(
            name="Ethyl Mercaptan",
            formula="C2H6S",
            cas_number="75-08-1",
            molecular_weight=62.140,
            boiling_point=35.0,
            process_streams=[ProcessStream.SULFUR_COMPOUNDS, ProcessStream.Y_GRADE],
            astm_methods=["D5504", "UOP163"],
            retention_times={
                ColumnType.DB_SULFUR_SCD: 4.8,
                ColumnType.HP_1_SULFUR: 5.2
            },
            detector_responses={
                DetectorType.SCD: 8.5,
                DetectorType.FID: 2.1,
                DetectorType.MS: 2.8
            },
            typical_ranges={
                ProcessStream.Y_GRADE: (0.1, 10),  # ppm
                ProcessStream.SULFUR_COMPOUNDS: (1, 500)
            }
        )
        
        # AROMATICS - Fractionator analysis
        compounds["benzene"] = CompoundData(
            name="Benzene",
            formula="C6H6",
            cas_number="71-43-2",
            molecular_weight=78.114,
            boiling_point=80.1,
            process_streams=[ProcessStream.FRACTIONATOR, ProcessStream.CRUDE_SEPARATION],
            astm_methods=["D3606", "D5134", "D6159"],
            retention_times={
                ColumnType.DB1: 8.5,
                ColumnType.DB5: 9.1,
                ColumnType.DB_WAX: 15.2
            },
            detector_responses={
                DetectorType.FID: 6.2,
                DetectorType.PID: 8.5,  # Excellent for aromatics
                DetectorType.MS: 2.1
            },
            typical_ranges={
                ProcessStream.FRACTIONATOR: (100, 5000),  # ppm
                ProcessStream.CRUDE_SEPARATION: (1000, 50000)
            }
        )
        
        # Add more compounds as needed...
        # This structure allows for easy expansion
        
        return compounds
    
    def get_compound(self, name: str) -> Optional[CompoundData]:
        """Get compound data by name"""
        return self.compounds.get(name.lower())
    
    def get_compounds_by_stream(self, stream: ProcessStream) -> List[CompoundData]:
        """Get all compounds relevant to a process stream"""
        return [comp for comp in self.compounds.values() 
                if stream in comp.process_streams]
    
    def get_compounds_by_method(self, method: str) -> List[CompoundData]:
        """Get all compounds analyzed by an ASTM method"""
        return [comp for comp in self.compounds.values() 
                if method in comp.astm_methods]
    
    def get_retention_time(self, compound_name: str, column: ColumnType) -> Optional[float]:
        """Get retention time for compound on specific column"""
        comp = self.get_compound(compound_name)
        if comp and column in comp.retention_times:
            return comp.retention_times[column]
        return None
    
    def get_detector_response(self, compound_name: str, detector: DetectorType) -> Optional[float]:
        """Get relative detector response for compound"""
        comp = self.get_compound(compound_name)
        if comp and detector in comp.detector_responses:
            return comp.detector_responses[detector]
        return None
    
    def export_to_csv(self, filename: str):
        """Export database to CSV for external use"""
        data = []
        for name, comp in self.compounds.items():
            row = {
                'name': comp.name,
                'formula': comp.formula,
                'cas_number': comp.cas_number,
                'molecular_weight': comp.molecular_weight,
                'boiling_point': comp.boiling_point,
                'process_streams': ', '.join([s.value for s in comp.process_streams]),
                'astm_methods': ', '.join(comp.astm_methods)
            }
            
            # Add retention times
            for col_type in ColumnType:
                if col_type in comp.retention_times:
                    row[f'rt_{col_type.name}'] = comp.retention_times[col_type]
            
            # Add detector responses  
            for det_type in DetectorType:
                if det_type in comp.detector_responses:
                    row[f'response_{det_type.name}'] = comp.detector_responses[det_type]
                    
            data.append(row)
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        print(f"Database exported to {filename}")

# Usage example
if __name__ == "__main__":
    # Initialize database
    db = CompoundDatabase()
    
    # Example queries
    print("PDH Stream Compounds:")
    pdh_compounds = db.get_compounds_by_stream(ProcessStream.PDH)
    for comp in pdh_compounds:
        print(f"  {comp.name} ({comp.formula})")
    
    print("\nD2163 Method Compounds:")
    d2163_compounds = db.get_compounds_by_method("D2163")
    for comp in d2163_compounds:
        print(f"  {comp.name}")
    
    print("\nPropylene retention times:")
    for col_type in ColumnType:
        rt = db.get_retention_time("propylene", col_type)
        if rt:
            print(f"  {col_type.value}: {rt} min")
    
    # Export to CSV
    db.export_to_csv("midstream_gc_database.csv")