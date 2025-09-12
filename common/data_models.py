# Add these classes to your common/data_models.py file

from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

@dataclass
class OvenRamp:
    """Represents a single ramp in a GC oven program"""
    initial_temp: float    # Starting temperature in °C
    final_temp: float      # Ending temperature in °C  
    rate: float           # Ramp rate in °C/min
    hold_time: float      # Hold time at final temperature in minutes

@dataclass
class OvenProgram:
    """Complete GC oven temperature program"""
    ramps: List[OvenRamp] = field(default_factory=list)
    
    def total_time(self) -> float:
        """Calculate total program time in minutes"""
        total = 0.0
        for ramp in self.ramps:
            # Time to ramp from initial to final temperature
            if ramp.rate > 0:
                ramp_time = abs(ramp.final_temp - ramp.initial_temp) / ramp.rate
                total += ramp_time
            # Hold time at final temperature
            total += ramp.hold_time
        return total

class InletType(Enum):
    """Types of GC inlets"""
    SPLIT = "split"
    SPLITLESS = "splitless"
    COOL_ON_COLUMN = "cool_on_column"
    PROGRAMMABLE_TEMPERATURE_VAPORIZER = "ptv"
    LARGE_VOLUME_INJECTION = "lvi"

@dataclass
class InletSettings:
    """GC inlet configuration settings"""
    inlet_type: InletType
    temperature: float = 250  # °C
    pressure: Optional[float] = None  # psi
    split_ratio: Optional[float] = None  # for split mode
    splitless_time: Optional[float] = None  # minutes for splitless
    purge_flow: Optional[float] = None  # mL/min

@dataclass
class GCMethod:
    """Complete GC method"""
    name: str
    inlet: Optional[InletSettings] = None
    oven_program: Optional[OvenProgram] = None
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create GCMethod from dictionary"""
        return cls(
            name=data.get('name', 'Unnamed Method'),
            inlet=data.get('inlet'),
            oven_program=data.get('oven_program')
        )

@dataclass
class Compound:
    """Represents a chemical compound"""
    name: str
    molecular_weight: Optional[float] = None
    boiling_point: Optional[float] = None
    retention_time: Optional[float] = None
    concentration: Optional[float] = None

def create_standard_method(name: str) -> GCMethod:
    """Create a standard GC method for testing"""
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
        name=name,
        inlet=inlet,
        oven_program=oven_program
    )