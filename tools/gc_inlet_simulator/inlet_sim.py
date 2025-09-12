"""
GC Inlet Simulator - IntelliLab GC ModV2
Simulates various inlet behaviors and performance characteristics
Windows-compatible standalone version
"""
import sys
import math
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import os

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Try to import from common modules, fall back to local definitions
try:
    from common.base_tool import BaseTool
except ImportError:
    print("Warning: Could not import BaseTool, using local definition")
    class BaseTool:
        def __init__(self, name: str, description: str, category: str = "Analysis", version: str = "1.0.0"):
            self.name = name
            self.description = description
            self.category = category
            self.version = version

try:
    from common.data_models import GCMethod, Compound
except ImportError:
    print("Warning: Could not import from data_models, using local definitions")
    
    @dataclass
    class Compound:
        """Simple compound representation"""
        name: str
        molecular_weight: Optional[float] = None
        boiling_point: Optional[float] = None
        retention_time: Optional[float] = None
    
    @dataclass
    class GCMethod:
        """Simple GC method representation"""
        name: str
        inlet: Any = None
        oven_program: Any = None


# Local inlet-related definitions
class InletType(Enum):
    """Enumeration of GC inlet types"""
    SPLIT = "split"
    SPLITLESS = "splitless"
    COOL_ON_COLUMN = "cool_on_column"
    PROGRAMMABLE_TEMPERATURE_VAPORIZER = "ptv"
    LARGE_VOLUME_INJECTION = "lvi"


@dataclass
class InletSettings:
    """GC inlet configuration settings"""
    inlet_type: InletType
    temperature: float  # °C
    pressure: Optional[float] = None  # psi
    split_ratio: Optional[float] = None  # for split mode
    splitless_time: Optional[float] = None  # minutes for splitless
    purge_flow: Optional[float] = None  # mL/min


@dataclass
class OvenRamp:
    """Simple oven ramp representation"""
    initial_temp: float
    final_temp: float
    rate: float
    hold_time: float


@dataclass
class OvenProgram:
    """Simple oven program representation"""
    ramps: List[OvenRamp]


@dataclass
class InletSimulationResult:
    """Results from inlet simulation"""
    inlet_type: str
    temperature: float
    pressure: float
    split_ratio: Optional[float]
    
    # Performance metrics
    discrimination_factor: float  # How much discrimination occurs
    peak_broadening: float  # Additional peak width from inlet
    transfer_efficiency: float  # % of sample that reaches column
    equilibration_time: float  # Time to reach equilibrium (seconds)
    
    # Detailed results
    compound_responses: List[Dict[str, Any]]
    simulation_notes: List[str]
    
    def summary(self) -> str:
        """Generate a summary of simulation results"""
        lines = [
            f"Inlet Simulation Results - {self.inlet_type.upper()}",
            f"Temperature: {self.temperature}°C, Pressure: {self.pressure} psi",
            f"Transfer Efficiency: {self.transfer_efficiency:.1f}%",
            f"Peak Broadening: +{self.peak_broadening:.2f} seconds",
            f"Equilibration Time: {self.equilibration_time:.1f} seconds"
        ]
        
        if self.split_ratio:
            lines.append(f"Split Ratio: {self.split_ratio}:1")
            lines.append(f"Discrimination Factor: {self.discrimination_factor:.2f}")
        
        if self.simulation_notes:
            lines.append("\nNotes:")
            lines.extend(f"  • {note}" for note in self.simulation_notes)
        
        return "\n".join(lines)


class GCInletSimulator(BaseTool):
    """GC Inlet Simulator Tool"""
    
    def __init__(self):
        super().__init__(
            name="GC Inlet Simulator",
            description="Simulate inlet performance, discrimination, and efficiency for different inlet types",
            category="Simulation",
            version="1.0.0"
        )
        self._setup()
    
    def _setup(self):
        """Initialize simulation parameters"""
        # Default compounds for testing
        self.default_compounds = [
            Compound("n-Hexane", molecular_weight=86.18, boiling_point=68.7),
            Compound("Benzene", molecular_weight=78.11, boiling_point=80.1),
            Compound("Toluene", molecular_weight=92.14, boiling_point=110.6),
            Compound("n-Octane", molecular_weight=114.23, boiling_point=125.7),
            Compound("Ethylbenzene", molecular_weight=106.17, boiling_point=136.2),
            Compound("n-Decane", molecular_weight=142.28, boiling_point=174.0),
        ]
    
    def run(self, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run inlet simulation"""
        if inputs is None:
            # Interactive mode
            return self._run_interactive()
        
        try:
            # Extract inputs
            gc_method = inputs['gc_method']
            compounds = inputs.get('compounds', self.default_compounds)
            sample_volume = inputs.get('sample_volume', 1.0)
            detailed = inputs.get('detailed_analysis', True)
            
            # Convert method if it's a dictionary
            if isinstance(gc_method, dict):
                gc_method = self._dict_to_method(gc_method)
            
            # Run simulation
            result = self._simulate_inlet(gc_method, compounds, sample_volume, detailed)
            
            return {
                "success": True,
                "result": result,
                "summary": result.summary(),
                "recommendations": self._generate_recommendations(result)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _dict_to_method(self, method_dict: dict) -> GCMethod:
        """Convert dictionary to GCMethod object"""
        inlet_data = method_dict.get('inlet', {})
        
        # Create inlet settings
        inlet_type = InletType(inlet_data.get('inlet_type', 'split'))
        inlet = InletSettings(
            inlet_type=inlet_type,
            temperature=inlet_data.get('temperature', 250),
            pressure=inlet_data.get('pressure', 15),
            split_ratio=inlet_data.get('split_ratio', 10)
        )
        
        # Create simple oven program
        oven_program = OvenProgram(ramps=[
            OvenRamp(initial_temp=50, final_temp=250, rate=10, hold_time=2)
        ])
        
        return GCMethod(
            name=method_dict.get('name', 'Simulated Method'),
            inlet=inlet,
            oven_program=oven_program
        )
    
    def _run_interactive(self) -> Dict[str, Any]:
        """Interactive mode for the tool"""
        try:
            # Clear screen and show header
            os.system('cls' if os.name == 'nt' else 'clear')
            print(f"=== GC Inlet Simulator v1.0.0 ===")
            print("Simulate inlet performance, discrimination, and efficiency")
            print("\nOptions:")
            print("1. Run simulation with default method")
            print("2. Create custom method")  
            print("3. Exit")
            
            while True:
                try:
                    choice = input("\nSelect option (1-3): ").strip()
                    
                    if choice == '1':
                        return self._run_default_simulation()
                    elif choice == '2':
                        return self._run_custom_simulation()
                    elif choice == '3':
                        print("Exiting...")
                        return {"success": True, "message": "Exited by user"}
                    else:
                        print("Invalid choice. Please select 1, 2, or 3.")
                        
                except (EOFError, KeyboardInterrupt):
                    print("\nExiting...")
                    return {"success": True, "message": "Exited by user"}
                except Exception as e:
                    print(f"Input error: {e}")
                    continue
                    
        except Exception as e:
            print(f"Interactive mode error: {e}")
            return {"success": False, "error": str(e)}
    
    def _safe_input(self, prompt: str, default: str = "") -> str:
        """Safe input function that handles Windows issues"""
        try:
            sys.stdout.write(prompt)
            sys.stdout.flush()
            response = sys.stdin.readline().strip()
            if not response and default:
                return default
            return response
        except (EOFError, KeyboardInterrupt):
            raise
        except Exception as e:
            print(f"Input error: {e}")
            return default
    
    def _run_default_simulation(self) -> Dict[str, Any]:
        """Run simulation with default method"""
        try:
            print("\n--- Running Default Simulation ---")
            
            # Create a default method
            method = self._create_default_method()
            
            inputs = {
                "gc_method": method,
                "sample_volume": 1.0,
                "detailed_analysis": True
            }
            
            result = self.run(inputs)
            
            if result["success"]:
                print("\n" + "="*50)
                print(result["summary"])
                
                if result["recommendations"]:
                    print("\n=== Recommendations ===")
                    for i, rec in enumerate(result["recommendations"], 1):
                        print(f"{i}. {rec}")
                
                # Show compound details
                sim_result = result["result"]
                if sim_result.compound_responses:
                    print("\n=== Compound Analysis (Top 3) ===")
                    for response in sim_result.compound_responses[:3]:
                        print(f"• {response['compound_name']}: Response factor = {response['relative_response']:.3f}")
                        if response['predicted_issues']:
                            for issue in response['predicted_issues']:
                                print(f"  Warning: {issue}")
                
                # Wait for user to read results
                input("\nPress Enter to continue...")
            
            return result
            
        except Exception as e:
            error_msg = f"Default simulation failed: {e}"
            print(error_msg)
            return {"success": False, "error": error_msg}
    
    def _create_default_method(self) -> GCMethod:
        """Create a default GC method for testing"""
        inlet = InletSettings(
            inlet_type=InletType.SPLIT,
            temperature=250,
            pressure=15,
            split_ratio=10
        )
        
        oven_program = OvenProgram(ramps=[
            OvenRamp(initial_temp=50, final_temp=250, rate=10, hold_time=2)
        ])
        
        return GCMethod(
            name="Default Test Method",
            inlet=inlet,
            oven_program=oven_program
        )
    
    def _run_custom_simulation(self) -> Dict[str, Any]:
        """Run simulation with custom method"""
        try:
            print("\n--- Custom Inlet Simulation ---")
            
            # Get inlet type
            print("\nInlet Types:")
            print("1. Split")
            print("2. Splitless") 
            print("3. Cool-on-Column")
            print("4. PTV (Programmable Temperature Vaporizer)")
            
            inlet_choice = self._safe_input("Select inlet type (1-4) [1]: ", "1")
            inlet_map = {
                '1': InletType.SPLIT,
                '2': InletType.SPLITLESS,
                '3': InletType.COOL_ON_COLUMN,
                '4': InletType.PROGRAMMABLE_TEMPERATURE_VAPORIZER
            }
            
            if inlet_choice not in inlet_map:
                print("Invalid choice, using Split inlet")
                inlet_type = InletType.SPLIT
            else:
                inlet_type = inlet_map[inlet_choice]
            
            # Get parameters with better error handling
            try:
                temp_input = self._safe_input("Inlet temperature (°C) [250]: ", "250")
                temp = float(temp_input)
            except ValueError:
                print("Invalid temperature, using 250°C")
                temp = 250.0
            
            try:
                pressure_input = self._safe_input("Inlet pressure (psi) [15]: ", "15")
                pressure = float(pressure_input)
            except ValueError:
                print("Invalid pressure, using 15 psi")
                pressure = 15.0
            
            split_ratio = None
            if inlet_type == InletType.SPLIT:
                try:
                    split_input = self._safe_input("Split ratio [10]: ", "10")
                    split_ratio = float(split_input)
                except ValueError:
                    print("Invalid split ratio, using 10")
                    split_ratio = 10.0
            
            try:
                vol_input = self._safe_input("Sample volume (µL) [1.0]: ", "1.0")
                sample_vol = float(vol_input)
            except ValueError:
                print("Invalid volume, using 1.0 µL")
                sample_vol = 1.0
            
            # Create method
            inlet_settings = InletSettings(
                inlet_type=inlet_type,
                temperature=temp,
                pressure=pressure,
                split_ratio=split_ratio
            )
            
            oven_program = OvenProgram(ramps=[
                OvenRamp(initial_temp=50, final_temp=250, rate=10, hold_time=2)
            ])
            
            method = GCMethod(
                name="Custom Inlet Test",
                inlet=inlet_settings,
                oven_program=oven_program
            )
            
            # Run simulation
            inputs = {
                "gc_method": method,
                "sample_volume": sample_vol,
                "detailed_analysis": True
            }
            
            result = self.run(inputs)
            
            if result["success"]:
                print("\n" + "="*50)
                print(result["summary"])
                
                if result["recommendations"]:
                    print("\n=== Recommendations ===")
                    for i, rec in enumerate(result["recommendations"], 1):
                        print(f"{i}. {rec}")
                
                # Wait for user to read results
                input("\nPress Enter to continue...")
            
            return result
            
        except (EOFError, KeyboardInterrupt):
            print("\nOperation cancelled by user")
            return {"success": True, "message": "Cancelled by user"}
        except Exception as e:
            error_msg = f"Custom simulation failed: {e}"
            print(error_msg)
            return {"success": False, "error": error_msg}
    
    def _simulate_inlet(self, method: GCMethod, compounds: List[Compound], 
                       sample_volume: float, detailed: bool) -> InletSimulationResult:
        """Core inlet simulation logic"""
        inlet = method.inlet
        
        # Base calculations
        discrimination_factor = self._calculate_discrimination(inlet, compounds)
        peak_broadening = self._calculate_peak_broadening(inlet, method.oven_program)
        transfer_efficiency = self._calculate_transfer_efficiency(inlet, sample_volume)
        equilibration_time = self._calculate_equilibration_time(inlet)
        
        # Compound-specific analysis
        compound_responses = []
        if detailed:
            for compound in compounds:
                response = self._analyze_compound_response(compound, inlet, method)
                compound_responses.append(response)
        
        # Generate simulation notes
        notes = self._generate_simulation_notes(inlet, method, compounds)
        
        return InletSimulationResult(
            inlet_type=inlet.inlet_type.value,
            temperature=inlet.temperature,
            pressure=inlet.pressure or 0,
            split_ratio=inlet.split_ratio,
            discrimination_factor=discrimination_factor,
            peak_broadening=peak_broadening,
            transfer_efficiency=transfer_efficiency,
            equilibration_time=equilibration_time,
            compound_responses=compound_responses,
            simulation_notes=notes
        )
    
    def _calculate_discrimination(self, inlet: InletSettings, compounds: List[Compound]) -> float:
        """Calculate inlet discrimination factor"""
        if inlet.inlet_type == InletType.SPLITLESS:
            return 1.05
        elif inlet.inlet_type == InletType.SPLIT:
            temp_factor = max(0.8, min(1.2, inlet.temperature / 250))
            split_factor = 1 + (inlet.split_ratio or 10) * 0.01
            return temp_factor * split_factor
        elif inlet.inlet_type == InletType.COOL_ON_COLUMN:
            return 1.02
        else:
            return 1.15
    
    def _calculate_peak_broadening(self, inlet: InletSettings, oven_program) -> float:
        """Calculate additional peak width from inlet (seconds)"""
        base_broadening = 0.1
        
        if inlet.inlet_type == InletType.SPLIT:
            initial_temp = 50
            if oven_program and hasattr(oven_program, 'ramps') and oven_program.ramps:
                initial_temp = oven_program.ramps[0].initial_temp
            temp_diff = abs(inlet.temperature - initial_temp)
            return base_broadening + (temp_diff * 0.002)
        elif inlet.inlet_type == InletType.SPLITLESS:
            return base_broadening + 0.3
        elif inlet.inlet_type == InletType.COOL_ON_COLUMN:
            return base_broadening * 0.5
        else:
            return base_broadening + 0.2
    
    def _calculate_transfer_efficiency(self, inlet: InletSettings, sample_volume: float) -> float:
        """Calculate percentage of sample reaching the column"""
        base_efficiency = 95.0
        
        if inlet.inlet_type == InletType.SPLIT:
            split_ratio = inlet.split_ratio or 10
            efficiency = base_efficiency / (1 + split_ratio/100)
            return min(efficiency, 95.0)
        elif inlet.inlet_type == InletType.SPLITLESS:
            volume_factor = max(0.8, min(1.0, 2.0 / sample_volume))
            return base_efficiency * volume_factor
        elif inlet.inlet_type == InletType.COOL_ON_COLUMN:
            return 98.0
        else:
            return 92.0
    
    def _calculate_equilibration_time(self, inlet: InletSettings) -> float:
        """Calculate time to reach thermal equilibrium (seconds)"""
        base_time = 30.0
        temp_factor = 1 + (inlet.temperature - 200) * 0.01
        
        if inlet.inlet_type == InletType.COOL_ON_COLUMN:
            return base_time * 0.5
        elif inlet.inlet_type in [InletType.PROGRAMMABLE_TEMPERATURE_VAPORIZER, InletType.LARGE_VOLUME_INJECTION]:
            return base_time * 1.5
        else:
            return base_time * temp_factor
    
    def _analyze_compound_response(self, compound: Compound, inlet: InletSettings, 
                                  method: GCMethod) -> Dict[str, Any]:
        """Analyze individual compound response"""
        if compound.boiling_point:
            temp_diff = inlet.temperature - compound.boiling_point
            volatility_factor = 1 + temp_diff * 0.002
        else:
            volatility_factor = 1.0
        
        if compound.molecular_weight:
            mw_factor = 1 + (compound.molecular_weight - 100) * 0.001
        else:
            mw_factor = 1.0
        
        relative_response = 1.0 / (volatility_factor * mw_factor)
        
        if inlet.inlet_type == InletType.SPLITLESS:
            tailing_factor = 1.2
        else:
            tailing_factor = 1.05
        
        return {
            "compound_name": compound.name,
            "boiling_point": compound.boiling_point,
            "molecular_weight": compound.molecular_weight,
            "relative_response": relative_response,
            "discrimination_factor": volatility_factor * mw_factor,
            "tailing_factor": tailing_factor,
            "predicted_issues": self._predict_compound_issues(compound, inlet)
        }
    
    def _predict_compound_issues(self, compound: Compound, inlet: InletSettings) -> List[str]:
        """Predict potential issues for specific compounds"""
        issues = []
        
        if compound.boiling_point:
            if compound.boiling_point > inlet.temperature:
                issues.append("Compound BP > inlet temp - may cause discrimination")
            
            if inlet.inlet_type == InletType.SPLITLESS and compound.boiling_point < 80:
                issues.append("Highly volatile compound in splitless - may cause peak distortion")
        
        if inlet.inlet_type == InletType.SPLIT and inlet.split_ratio and inlet.split_ratio > 50:
            issues.append("High split ratio - may reduce sensitivity for trace analysis")
        
        return issues
    
    def _generate_simulation_notes(self, inlet: InletSettings, method: GCMethod, 
                                  compounds: List[Compound]) -> List[str]:
        """Generate helpful simulation notes"""
        notes = []
        
        initial_oven_temp = 50
        if method.oven_program and hasattr(method.oven_program, 'ramps') and method.oven_program.ramps:
            initial_oven_temp = method.oven_program.ramps[0].initial_temp
        
        temp_diff = inlet.temperature - initial_oven_temp
        
        if temp_diff < 20:
            notes.append("Inlet temperature is close to initial oven temperature - consider increasing for better vaporization")
        elif temp_diff > 150:
            notes.append("Large temperature difference between inlet and oven - may cause thermal degradation")
        
        if inlet.inlet_type == InletType.SPLIT:
            if inlet.split_ratio and inlet.split_ratio > 100:
                notes.append("Very high split ratio - consider splitless for better sensitivity")
            elif inlet.split_ratio and inlet.split_ratio < 5:
                notes.append("Low split ratio - may cause solvent overloading")
        elif inlet.inlet_type == InletType.SPLITLESS:
            notes.append("Splitless mode - ensure proper splitless time and purge flow settings")
        
        volatile_compounds = [c for c in compounds if c.boiling_point and c.boiling_point < 100]
        if volatile_compounds and inlet.inlet_type != InletType.COOL_ON_COLUMN:
            notes.append(f"Found {len(volatile_compounds)} volatile compounds - consider cool-on-column for better retention")
        
        return notes
    
    def _generate_recommendations(self, result: InletSimulationResult) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        if result.transfer_efficiency < 80:
            recommendations.append("Low transfer efficiency - consider optimizing injection parameters or changing inlet type")
        
        if result.peak_broadening > 0.5:
            recommendations.append("Significant peak broadening detected - check inlet temperature and liner condition")
        
        if result.discrimination_factor > 1.3:
            recommendations.append("High discrimination factor - consider adjusting temperature or using splitless mode")
        
        if result.equilibration_time > 60:
            recommendations.append("Long equilibration time - consider pre-heating injection syringe")
        
        if result.inlet_type == "split":
            if result.split_ratio and result.split_ratio > 50:
                recommendations.append("High split ratio may reduce sensitivity - consider lower ratio for trace analysis")
        elif result.inlet_type == "splitless":
            recommendations.append("Monitor for solvent effects and peak distortion in splitless mode")
        
        return recommendations


def main():
    """Standalone execution for testing"""
    try:
        print("Starting GC Inlet Simulator...")
        simulator = GCInletSimulator()
        result = simulator.run()
        
        if not result.get("success", False):
            print(f"Error: {result.get('error', 'Unknown error')}")
        
    except KeyboardInterrupt:
        print("\nSimulation cancelled by user")
    except Exception as e:
        print(f"Error running simulator: {e}")
        input("Press Enter to exit...")


if __name__ == "__main__":
    main()