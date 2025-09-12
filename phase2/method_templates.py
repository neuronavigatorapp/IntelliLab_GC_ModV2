"""
IntelliLab GC - ASTM/UOP Method Templates for Midstream Analysis
Pre-configured method parameters for common petrochemical analyses
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union
from enum import Enum
import json

# Import from compounds_database
from compounds_database import ProcessStream, DetectorType, ColumnType

class CarrierGas(Enum):
    HELIUM = "Helium"
    HYDROGEN = "Hydrogen" 
    NITROGEN = "Nitrogen"
    ARGON = "Argon"
    SYNTHETIC_AIR = "Synthetic Air"

@dataclass
class GCConditions:
    """Standard GC operating conditions"""
    # Required parameters (no defaults)
    column_type: ColumnType
    column_length: float  # meters
    column_id: float  # mm
    injector_temp: float  # °C
    injector_type: str  # "Split", "Splitless", "On-column", "PTV"
    initial_temp: float  # °C
    initial_hold: float  # minutes
    ramp_rate: float  # °C/min
    final_temp: float  # °C
    final_hold: float  # minutes
    carrier_gas: str  # "Helium", "Hydrogen", "Nitrogen"
    flow_rate: float  # mL/min
    detector_type: DetectorType
    detector_temp: float  # °C
    
    # Optional parameters (with defaults)
    split_ratio: Optional[float] = None
    injection_volume: float = 1.0  # μL
    film_thickness: Optional[float] = None  # μm for capillary
    pressure: Optional[float] = None  # psig
    detector_flows: Dict[str, float] = field(default_factory=dict)  # H2, Air, Makeup flows
    sample_prep: str = "Direct injection"
    dilution_factor: float = 1.0

@dataclass
class MethodTemplate:
    """Complete analytical method template"""
    name: str
    astm_number: str
    title: str
    scope: str
    process_streams: List[ProcessStream]
    target_compounds: List[str]
    
    # Multiple possible GC conditions (for different configurations)
    gc_conditions: List[GCConditions]
    
    # Quality control parameters
    precision_rsd: float  # % RSD
    detection_limit: float  # ppm or mol%
    quantitation_limit: float  # ppm or mol%
    
    # Calibration requirements
    calibration_type: str  # "External standard", "Internal standard", "Area normalization"
    calibration_levels: int
    calibration_range: tuple  # (min, max) in appropriate units
    
    # Performance requirements
    resolution_requirements: List[tuple]  # [(compound1, compound2, min_resolution)]
    retention_time_windows: Dict[str, tuple]  # compound: (min_rt, max_rt)
    
    # Additional notes
    interferences: List[str]
    sample_storage: str
    holding_time: str
    notes: str

class MethodTemplateDatabase:
    def __init__(self):
        self.methods = self._initialize_methods()
    
    def _initialize_methods(self) -> Dict[str, MethodTemplate]:
        """Initialize comprehensive method template database"""
        methods = {}
        
        # ASTM D2163 - Analysis of Hydrocarbons in Petroleum Fractions
        methods["D2163"] = MethodTemplate(
            name="D2163",
            astm_number="ASTM D2163-14",
            title="Standard Test Method for Determination of Hydrocarbons in Liquefied Petroleum Gas (LPG) Samples by Gas Chromatography",
            scope="C1-C6+ hydrocarbons in LPG, propane, butane products",
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.HIGH_PURITY, ProcessStream.FRACTIONATOR],
            target_compounds=["methane", "ethane", "propane", "propylene", "isobutane", "n_butane", "isobutylene", "1_butene"],
            
            gc_conditions=[
                # Configuration 1: Packed column (traditional)
                GCConditions(
                    column_type=ColumnType.PORAPAK_Q,
                    column_length=6.0,  # 6 ft packed
                    column_id=3.175,  # 1/8" OD
                    injector_temp=150.0,
                    injector_type="Split",
                    initial_temp=35.0,
                    initial_hold=8.0,
                    ramp_rate=8.0,
                    final_temp=200.0,
                    final_hold=10.0,
                    carrier_gas="Helium",
                    flow_rate=30.0,
                    detector_type=DetectorType.FID,
                    detector_temp=250.0,
                    split_ratio=100.0,
                    injection_volume=0.5,
                    detector_flows={"H2": 40.0, "Air": 400.0, "Makeup": 25.0},
                    sample_prep="Direct gas sampling with 6-port valve"
                ),
                # Configuration 2: Capillary column (modern)
                GCConditions(
                    column_type=ColumnType.PLOT_Q,
                    column_length=30.0,
                    column_id=0.32,
                    injector_temp=200.0,
                    injector_type="Split",
                    initial_temp=40.0,
                    initial_hold=5.0,
                    ramp_rate=10.0,
                    final_temp=200.0,
                    final_hold=5.0,
                    carrier_gas="Helium",
                    flow_rate=2.0,
                    detector_type=DetectorType.FID,
                    detector_temp=280.0,
                    split_ratio=50.0,
                    injection_volume=0.2,
                    film_thickness=20.0,
                    detector_flows={"H2": 40.0, "Air": 400.0, "Makeup": 25.0},
                    sample_prep="Direct gas sampling with 6-port valve"
                )
            ],
            
            precision_rsd=2.0,  # % RSD
            detection_limit=0.01,  # mol%
            quantitation_limit=0.05,  # mol%
            calibration_type="Area normalization",
            calibration_levels=5,
            calibration_range=(0.01, 100.0),  # mol%
            resolution_requirements=[
                ("propane", "propylene", 1.5),
                ("isobutane", "n_butane", 2.0),
                ("isobutylene", "1_butene", 1.8)
            ],
            retention_time_windows={
                "methane": (1.0, 2.5),
                "ethane": (2.0, 4.0),
                "propane": (3.5, 6.0),
                "propylene": (3.0, 5.5)
            },
            interferences=["CO2", "H2S", "Water"],
            sample_storage="Pressurized cylinder at ambient temperature",
            holding_time="30 days in properly sealed container",
            notes="Critical for propane/propylene separation in PDH products"
        )
        
        # ASTM D6730 - Permanent Gases and Light Hydrocarbons
        methods["D6730"] = MethodTemplate(
            name="D6730",
            astm_number="ASTM D6730-19",
            title="Standard Test Method for Determination of Individual Components in Spark Ignition Engine Fuels by 100-Metre Capillary High Resolution Gas Chromatography",
            scope="Permanent gases (H2, N2, CO, CO2) and C1-C5 hydrocarbons",
            process_streams=[ProcessStream.PERMANENT_GASES, ProcessStream.Y_GRADE, ProcessStream.PDH],
            target_compounds=["hydrogen", "nitrogen", "carbon_monoxide", "methane", "carbon_dioxide", "ethane", "ethylene", "propane", "propylene"],
            
            gc_conditions=[
                # TCD Configuration for permanent gases
                GCConditions(
                    column_type=ColumnType.PLOT_MOLESIEVE,
                    column_length=30.0,
                    column_id=0.32,
                    injector_temp=150.0,
                    injector_type="Split",
                    initial_temp=35.0,
                    initial_hold=5.0,
                    ramp_rate=5.0,
                    final_temp=100.0,
                    final_hold=10.0,
                    carrier_gas="Helium",
                    flow_rate=3.0,
                    detector_type=DetectorType.TCD,
                    detector_temp=200.0,
                    split_ratio=10.0,
                    injection_volume=0.25,
                    film_thickness=30.0,
                    detector_flows={"Reference": 20.0, "Makeup": 5.0},
                    sample_prep="Gas sampling loop injection"
                ),
                # FID Configuration for hydrocarbons
                GCConditions(
                    column_type=ColumnType.LOWOX,
                    column_length=50.0,
                    column_id=0.32,
                    injector_temp=200.0,
                    injector_type="Split",
                    initial_temp=35.0,
                    initial_hold=3.0,
                    ramp_rate=8.0,
                    final_temp=150.0,
                    final_hold=5.0,
                    carrier_gas="Helium",
                    flow_rate=2.5,
                    detector_type=DetectorType.FID,
                    detector_temp=280.0,
                    split_ratio=20.0,
                    injection_volume=0.1,
                    film_thickness=10.0,
                    detector_flows={"H2": 40.0, "Air": 400.0, "Makeup": 25.0},
                    sample_prep="Gas sampling loop injection"
                )
            ],
            
            precision_rsd=3.0,
            detection_limit=0.005,  # mol%
            quantitation_limit=0.02,  # mol%
            calibration_type="External standard",
            calibration_levels=6,
            calibration_range=(0.005, 50.0),
            resolution_requirements=[
                ("hydrogen", "nitrogen", 2.0),
                ("carbon_monoxide", "methane", 1.5),
                ("ethane", "ethylene", 2.5)
            ],
            retention_time_windows={
                "hydrogen": (0.5, 1.5),
                "nitrogen": (0.8, 2.0),
                "methane": (1.5, 3.0),
                "carbon_dioxide": (2.0, 4.0)
            },
            interferences=["Water vapor", "Oxygen"],
            sample_storage="Pressurized sample cylinder",
            holding_time="7 days for permanent gases, 30 days for hydrocarbons",
            notes="Dual detector system required for complete analysis"
        )
        
        # ASTM D5504 - Sulfur Compounds in Natural Gas
        methods["D5504"] = MethodTemplate(
            name="D5504",
            astm_number="ASTM D5504-12",
            title="Standard Test Method for Determination of Sulfur Compounds in Natural Gas and Gaseous Fuels by Gas Chromatography and Sulfur Selective Detection",
            scope="Sulfur compounds in natural gas, Y-grade, pipeline gas",
            process_streams=[ProcessStream.Y_GRADE, ProcessStream.SULFUR_COMPOUNDS, ProcessStream.CRUDE_SEPARATION],
            target_compounds=["h2s", "carbonyl_sulfide", "mercaptan_methyl", "mercaptan_ethyl", "thiophene", "dimethyl_sulfide"],
            
            gc_conditions=[
                GCConditions(
                    column_type=ColumnType.DB_SULFUR_SCD,
                    column_length=60.0,
                    column_id=0.32,
                    injector_temp=150.0,
                    injector_type="Split",
                    initial_temp=35.0,
                    initial_hold=2.0,
                    ramp_rate=4.0,
                    final_temp=200.0,
                    final_hold=10.0,
                    carrier_gas="Helium",
                    flow_rate=2.0,
                    detector_type=DetectorType.SCD,
                    detector_temp=250.0,
                    split_ratio=5.0,  # Low split for trace analysis
                    injection_volume=1.0,
                    film_thickness=4.0,
                    detector_flows={"H2": 5.0, "Air": 17.0, "SO2": 0.1},
                    sample_prep="Direct gas injection with sample loop"
                )
            ],
            
            precision_rsd=5.0,
            detection_limit=0.1,  # ppmv
            quantitation_limit=0.5,  # ppmv
            calibration_type="External standard",
            calibration_levels=5,
            calibration_range=(0.1, 100.0),  # ppmv
            resolution_requirements=[
                ("h2s", "carbonyl_sulfide", 2.0),
                ("mercaptan_methyl", "mercaptan_ethyl", 1.5)
            ],
            retention_time_windows={
                "h2s": (1.5, 3.0),
                "mercaptan_methyl": (4.0, 6.0),
                "mercaptan_ethyl": (6.0, 8.0)
            },
            interferences=["Hydrocarbons (minimal with SCD)", "Water"],
            sample_storage="Pressurized cylinder, avoid contact with metals",
            holding_time="14 days maximum",
            notes="SCD detector essential for selectivity and low detection limits"
        )
        
        # UOP 539 - Light Olefins in C4 and Lighter Hydrocarbon Mixtures
        methods["UOP539"] = MethodTemplate(
            name="UOP539",
            astm_number="UOP 539-12",
            title="Olefins in C4 and Lighter Hydrocarbon Mixtures by Gas Chromatography",
            scope="Olefins analysis in PDH/IBDH products, cracker streams",
            process_streams=[ProcessStream.PDH, ProcessStream.IBDH, ProcessStream.FRACTIONATOR],
            target_compounds=["ethylene", "propylene", "isobutylene", "1_butene", "cis_2_butene", "trans_2_butene", "1_3_butadiene"],
            
            gc_conditions=[
                GCConditions(
                    column_type=ColumnType.PLOT_AL2O3,
                    column_length=50.0,
                    column_id=0.32,
                    injector_temp=200.0,
                    injector_type="Split",
                    initial_temp=100.0,
                    initial_hold=20.0,  # Isothermal for better separation
                    ramp_rate=0.0,  # Isothermal method
                    final_temp=100.0,
                    final_hold=0.0,
                    carrier_gas="Helium",
                    flow_rate=2.0,
                    detector_type=DetectorType.FID,
                    detector_temp=280.0,
                    split_ratio=100.0,
                    injection_volume=0.1,
                    film_thickness=5.0,
                    detector_flows={"H2": 40.0, "Air": 400.0, "Makeup": 25.0},
                    sample_prep="Direct gas injection"
                ),
                # Alternative MAPD column configuration
                GCConditions(
                    column_type=ColumnType.MAPD,
                    column_length=100.0,
                    column_id=0.25,
                    injector_temp=180.0,
                    injector_type="Split",
                    initial_temp=40.0,
                    initial_hold=30.0,
                    ramp_rate=2.0,
                    final_temp=120.0,
                    final_hold=15.0,
                    carrier_gas="Helium",
                    flow_rate=1.5,
                    detector_type=DetectorType.FID,
                    detector_temp=280.0,
                    split_ratio=50.0,
                    injection_volume=0.2,
                    film_thickness=8.0,
                    detector_flows={"H2": 40.0, "Air": 400.0, "Makeup": 25.0},
                    sample_prep="Direct gas injection"
                )
            ],
            
            precision_rsd=2.0,
            detection_limit=0.01,  # mol%
            quantitation_limit=0.05,  # mol%
            calibration_type="Area normalization",
            calibration_levels=4,
            calibration_range=(0.01, 100.0),
            resolution_requirements=[
                ("propylene", "propane", 2.0),
                ("isobutylene", "1_butene", 1.5),
                ("cis_2_butene", "trans_2_butene", 1.2)
            ],
            retention_time_windows={
                "ethylene": (2.0, 4.0),
                "propylene": (8.0, 12.0),
                "isobutylene": (15.0, 20.0),
                "1_butene": (18.0, 24.0)
            },
            interferences=["Saturated hydrocarbons (resolved chromatographically)"],
            sample_storage="Pressurized cylinder at constant temperature",
            holding_time="30 days",
            notes="Critical for PDH/IBDH product quality control"
        )
        
        return methods
    
    def get_method(self, method_name: str) -> Optional[MethodTemplate]:
        """Get method template by name"""
        return self.methods.get(method_name.upper())
    
    def get_methods_by_stream(self, stream: ProcessStream) -> List[MethodTemplate]:
        """Get all methods applicable to a process stream"""
        return [method for method in self.methods.values() 
                if stream in method.process_streams]
    
    def get_methods_by_detector(self, detector: DetectorType) -> List[MethodTemplate]:
        """Get all methods using specific detector"""
        return [method for method in self.methods.values()
                for condition in method.gc_conditions
                if condition.detector_type == detector]
    
    def get_methods_by_compound(self, compound: str) -> List[MethodTemplate]:
        """Get all methods that analyze a specific compound"""
        return [method for method in self.methods.values()
                if compound.lower() in [c.lower() for c in method.target_compounds]]
    
    def export_method_summary(self, filename: str):
        """Export method summary to CSV"""
        data = []
        for name, method in self.methods.items():
            for i, condition in enumerate(method.gc_conditions):
                row = {
                    'method_name': method.name,
                    'astm_number': method.astm_number,
                    'title': method.title,
                    'config_number': i + 1,
                    'column_type': condition.column_type.value,
                    'detector_type': condition.detector_type.value,
                    'injector_temp': condition.injector_temp,
                    'initial_temp': condition.initial_temp,
                    'final_temp': condition.final_temp,
                    'ramp_rate': condition.ramp_rate,
                    'carrier_gas': condition.carrier_gas,
                    'flow_rate': condition.flow_rate,
                    'split_ratio': condition.split_ratio,
                    'target_compounds': ', '.join(method.target_compounds),
                    'process_streams': ', '.join([s.value for s in method.process_streams])
                }
                data.append(row)
        
        try:
            import pandas as pd
            df = pd.DataFrame(data)
            df.to_csv(filename, index=False)
            print(f"Method summary exported to {filename}")
        except ImportError:
            print("Pandas not available for export")

# Usage example
if __name__ == "__main__":
    # Initialize method database
    method_db = MethodTemplateDatabase()
    
    # Example queries
    print("Available Methods:")
    for name, method in method_db.methods.items():
        print(f"  {method.astm_number}: {method.title}")
    
    print("\nPDH Process Methods:")
    pdh_methods = method_db.get_methods_by_stream(ProcessStream.PDH)
    for method in pdh_methods:
        print(f"  {method.name}")
    
    print("\nFID Detector Methods:")
    fid_methods = method_db.get_methods_by_detector(DetectorType.FID)
    for method in fid_methods:
        print(f"  {method.name}")
    
    # Get specific method details
    d2163 = method_db.get_method("D2163")
    if d2163:
        print(f"\nD2163 Method Details:")
        print(f"  Target compounds: {d2163.target_compounds}")
        print(f"  Number of configurations: {len(d2163.gc_conditions)}")
        for i, condition in enumerate(d2163.gc_conditions):
            print(f"    Config {i+1}: {condition.column_type.value} with {condition.detector_type.value}")