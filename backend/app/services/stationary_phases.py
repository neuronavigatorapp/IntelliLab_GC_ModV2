#!/usr/bin/env python3
"""
McReynolds Constants for Stationary Phase Selection
Addresses Dr. Smith's critique on missing McReynolds constants
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np
from loguru import logger


class CompoundClass(str, Enum):
    """Compound classes for stationary phase selection"""
    HYDROCARBONS = "hydrocarbons"
    AROMATICS = "aromatics" 
    ALCOHOLS = "alcohols"
    FATTY_ACIDS = "fatty_acids"
    ESTERS = "esters"
    KETONES = "ketones"
    ALDEHYDES = "aldehydes"
    PESTICIDES = "pesticides"
    PCBS = "pcbs"
    VOLATILES = "volatiles"
    DRUGS = "drugs"
    STEROIDS = "steroids"
    ENVIRONMENTAL = "environmental"


@dataclass
class StationaryPhase:
    """Stationary phase with McReynolds constants"""
    name: str
    description: str
    mcreynolds_x: int  # Benzene - aromatic selectivity
    mcreynolds_y: int  # n-Butanol - polar selectivity
    mcreynolds_z: int  # 2-Pentanone - carbonyl selectivity  
    mcreynolds_u: int  # Nitropropane - nitro selectivity
    mcreynolds_s: int  # Pyridine - basic selectivity
    max_temp: int      # Maximum operating temperature (°C)
    polarity_index: float  # Relative polarity
    applications: List[str]
    vendor_equivalents: Dict[str, str]  # Vendor -> equivalent phase name


class StationaryPhaseSelector:
    """McReynolds constants for column selection"""
    
    def __init__(self):
        # McReynolds constants database
        self.phases = {
            "DB-1": StationaryPhase(
                name="DB-1",
                description="100% Dimethylpolysiloxane - Non-polar",
                mcreynolds_x=16, mcreynolds_y=55, mcreynolds_z=44, 
                mcreynolds_u=65, mcreynolds_s=42,
                max_temp=350,
                polarity_index=2.0,
                applications=["Hydrocarbons", "PCBs", "Essential oils", "Pesticides"],
                vendor_equivalents={
                    "Agilent": "HP-1",
                    "Phenomenex": "ZB-1",
                    "Restek": "Rtx-1",
                    "Supelco": "SPB-1"
                }
            ),
            
            "DB-5": StationaryPhase(
                name="DB-5",
                description="5% Phenyl, 95% Dimethylpolysiloxane - Low polarity",
                mcreynolds_x=32, mcreynolds_y=72, mcreynolds_z=66,
                mcreynolds_u=99, mcreynolds_s=67,
                max_temp=350,
                polarity_index=8.5,
                applications=["General purpose", "Environmental", "Drugs", "Steroids"],
                vendor_equivalents={
                    "Agilent": "HP-5ms",
                    "Phenomenex": "ZB-5ms", 
                    "Restek": "Rtx-5ms",
                    "Supelco": "SLB-5ms"
                }
            ),
            
            "DB-17": StationaryPhase(
                name="DB-17",
                description="50% Phenyl, 50% Dimethylpolysiloxane - Medium polarity",
                mcreynolds_x=119, mcreynolds_y=158, mcreynolds_z=162,
                mcreynolds_u=243, mcreynolds_s=202,
                max_temp=320,
                polarity_index=36.0,
                applications=["Aromatics", "Pesticides", "Drugs", "Positional isomers"],
                vendor_equivalents={
                    "Agilent": "HP-17",
                    "Phenomenex": "ZB-17",
                    "Restek": "Rtx-17",
                    "Supelco": "SPB-17"
                }
            ),
            
            "DB-35": StationaryPhase(
                name="DB-35",
                description="35% Phenyl, 65% Dimethylpolysiloxane - Medium polarity",
                mcreynolds_x=96, mcreynolds_y=132, mcreynolds_z=135,
                mcreynolds_u=202, mcreynolds_s=168,
                max_temp=340,
                polarity_index=28.0,
                applications=["Pesticides", "Herbicides", "PCBs", "Aromatics"],
                vendor_equivalents={
                    "Agilent": "HP-35",
                    "Phenomenex": "ZB-35",
                    "Restek": "Rtx-35",
                    "Supelco": "SPB-35"
                }
            ),
            
            "DB-WAX": StationaryPhase(
                name="DB-WAX",
                description="Polyethylene glycol - High polarity",
                mcreynolds_x=322, mcreynolds_y=536, mcreynolds_z=368,
                mcreynolds_u=572, mcreynolds_s=510,
                max_temp=260,
                polarity_index=100.0,
                applications=["Alcohols", "Fatty acids", "Essential oils", "Flavor compounds"],
                vendor_equivalents={
                    "Agilent": "HP-Innowax",
                    "Phenomenex": "ZB-WAX",
                    "Restek": "Stabilwax",
                    "Supelco": "Supelcowax-10"
                }
            ),
            
            "DB-624": StationaryPhase(
                name="DB-624",
                description="6% Cyanopropyl, 94% Dimethylpolysiloxane - Low-medium polarity",
                mcreynolds_x=44, mcreynolds_y=86, mcreynolds_z=81,
                mcreynolds_u=124, mcreynolds_s=88,
                max_temp=320,
                polarity_index=12.0,
                applications=["Volatiles", "EPA methods", "Solvents", "Aromatics"],
                vendor_equivalents={
                    "Agilent": "HP-624",
                    "Phenomenex": "ZB-624",
                    "Restek": "Rtx-624",
                    "Supelco": "SPB-624"
                }
            ),
            
            "DB-1701": StationaryPhase(
                name="DB-1701",
                description="14% Cyanopropyl, 86% Dimethylpolysiloxane - Medium polarity",
                mcreynolds_x=47, mcreynolds_y=125, mcreynolds_z=111,
                mcreynolds_u=171, mcreynolds_s=128,
                max_temp=280,
                polarity_index=21.0,
                applications=["Pesticides", "Essential oils", "Steroids", "Drugs"],
                vendor_equivalents={
                    "Agilent": "HP-1701",
                    "Phenomenex": "ZB-1701",
                    "Restek": "Rtx-1701",
                    "Supelco": "SPB-1701"
                }
            ),
            
            "DB-FFAP": StationaryPhase(
                name="DB-FFAP",
                description="Nitroterephthalic acid modified PEG - High polarity",
                mcreynolds_x=377, mcreynolds_y=590, mcreynolds_z=406,
                mcreynolds_u=627, mcreynolds_s=562,
                max_temp=250,
                polarity_index=110.0,
                applications=["Fatty acids", "Organic acids", "Alcohols", "Food analysis"],
                vendor_equivalents={
                    "Agilent": "HP-FFAP",
                    "Phenomenex": "ZB-FFAP",
                    "Restek": "Stabilwax-DA",
                    "Supelco": "SP-FFAP"
                }
            )
        }
        
        # Probe compounds for each McReynolds constant
        self.probe_compounds = {
            "X": {"name": "Benzene", "description": "Aromatic interactions"},
            "Y": {"name": "n-Butanol", "description": "Hydrogen bonding (alcohols)"},
            "Z": {"name": "2-Pentanone", "description": "Dipole interactions (carbonyls)"},
            "U": {"name": "Nitropropane", "description": "Dipole interactions (nitro)"},
            "S": {"name": "Pyridine", "description": "Basic interactions"}
        }
        
        # Compound class recommendations
        self.compound_recommendations = {
            CompoundClass.HYDROCARBONS: ["DB-1", "DB-5"],
            CompoundClass.AROMATICS: ["DB-5", "DB-17", "DB-35"],
            CompoundClass.ALCOHOLS: ["DB-WAX", "DB-FFAP", "DB-1701"],
            CompoundClass.FATTY_ACIDS: ["DB-WAX", "DB-FFAP"],
            CompoundClass.ESTERS: ["DB-WAX", "DB-1701", "DB-5"],
            CompoundClass.KETONES: ["DB-1701", "DB-17", "DB-5"],
            CompoundClass.ALDEHYDES: ["DB-1701", "DB-WAX", "DB-5"],
            CompoundClass.PESTICIDES: ["DB-5", "DB-1701", "DB-17"],
            CompoundClass.PCBS: ["DB-5", "DB-1", "DB-17"],
            CompoundClass.VOLATILES: ["DB-624", "DB-1", "DB-5"],
            CompoundClass.DRUGS: ["DB-5", "DB-17", "DB-1701"],
            CompoundClass.STEROIDS: ["DB-5", "DB-17", "DB-1"],
            CompoundClass.ENVIRONMENTAL: ["DB-5", "DB-624", "DB-1701"]
        }
    
    def recommend_phase(self, compound_class: CompoundClass) -> List[Dict]:
        """Recommend best stationary phases for compound class"""
        
        phase_names = self.compound_recommendations.get(compound_class, ["DB-5"])
        results = []
        
        for phase_name in phase_names:
            if phase_name in self.phases:
                phase = self.phases[phase_name]
                
                # Calculate selectivity index (sum of McReynolds constants)
                selectivity_index = (phase.mcreynolds_x + phase.mcreynolds_y + 
                                   phase.mcreynolds_z + phase.mcreynolds_u + 
                                   phase.mcreynolds_s)
                
                # Calculate compound-specific score
                score = self._calculate_compound_score(phase, compound_class)
                
                results.append({
                    "phase": phase.name,
                    "description": phase.description,
                    "mcreynolds_sum": selectivity_index,
                    "polarity_index": phase.polarity_index,
                    "compound_score": score,
                    "max_temp": phase.max_temp,
                    "mcreynolds_constants": {
                        "X": phase.mcreynolds_x,
                        "Y": phase.mcreynolds_y,
                        "Z": phase.mcreynolds_z,
                        "U": phase.mcreynolds_u,
                        "S": phase.mcreynolds_s
                    },
                    "applications": phase.applications,
                    "vendor_equivalents": phase.vendor_equivalents
                })
        
        # Sort by compound-specific score
        return sorted(results, key=lambda x: x["compound_score"], reverse=True)
    
    def _calculate_compound_score(self, phase: StationaryPhase, 
                                compound_class: CompoundClass) -> float:
        """Calculate compound-specific selectivity score"""
        
        # Weight McReynolds constants based on compound class
        weights = self._get_compound_weights(compound_class)
        
        score = (phase.mcreynolds_x * weights["X"] +
                phase.mcreynolds_y * weights["Y"] +
                phase.mcreynolds_z * weights["Z"] +
                phase.mcreynolds_u * weights["U"] +
                phase.mcreynolds_s * weights["S"])
        
        return score / 100.0  # Normalize
    
    def _get_compound_weights(self, compound_class: CompoundClass) -> Dict[str, float]:
        """Get McReynolds constant weights for compound class"""
        
        weights = {
            CompoundClass.HYDROCARBONS: {"X": 0.3, "Y": 0.1, "Z": 0.1, "U": 0.1, "S": 0.1},
            CompoundClass.AROMATICS: {"X": 1.0, "Y": 0.2, "Z": 0.3, "U": 0.2, "S": 0.3},
            CompoundClass.ALCOHOLS: {"X": 0.2, "Y": 1.0, "Z": 0.3, "U": 0.1, "S": 0.4},
            CompoundClass.FATTY_ACIDS: {"X": 0.1, "Y": 0.8, "Z": 0.4, "U": 0.1, "S": 0.2},
            CompoundClass.ESTERS: {"X": 0.3, "Y": 0.6, "Z": 0.7, "U": 0.2, "S": 0.2},
            CompoundClass.KETONES: {"X": 0.4, "Y": 0.3, "Z": 1.0, "U": 0.3, "S": 0.2},
            CompoundClass.ALDEHYDES: {"X": 0.4, "Y": 0.4, "Z": 0.9, "U": 0.3, "S": 0.2},
            CompoundClass.PESTICIDES: {"X": 0.6, "Y": 0.4, "Z": 0.5, "U": 0.7, "S": 0.3},
            CompoundClass.PCBS: {"X": 0.8, "Y": 0.1, "Z": 0.2, "U": 0.2, "S": 0.1},
            CompoundClass.VOLATILES: {"X": 0.5, "Y": 0.3, "Z": 0.4, "U": 0.3, "S": 0.2},
            CompoundClass.DRUGS: {"X": 0.5, "Y": 0.6, "Z": 0.4, "U": 0.5, "S": 0.8},
            CompoundClass.STEROIDS: {"X": 0.4, "Y": 0.5, "Z": 0.6, "U": 0.2, "S": 0.3},
            CompoundClass.ENVIRONMENTAL: {"X": 0.6, "Y": 0.4, "Z": 0.5, "U": 0.6, "S": 0.4}
        }
        
        return weights.get(compound_class, {"X": 0.4, "Y": 0.4, "Z": 0.4, "U": 0.4, "S": 0.4})
    
    def compare_phases(self, phase_names: List[str]) -> Dict:
        """Compare multiple stationary phases"""
        
        if not phase_names:
            return {"error": "No phases provided for comparison"}
        
        comparison = {
            "phases": [],
            "mcreynolds_comparison": {},
            "polarity_ranking": [],
            "temperature_limits": {}
        }
        
        valid_phases = []
        for name in phase_names:
            if name in self.phases:
                valid_phases.append(self.phases[name])
            else:
                logger.warning(f"Unknown phase: {name}")
        
        if not valid_phases:
            return {"error": "No valid phases found"}
        
        # Collect phase data
        for phase in valid_phases:
            comparison["phases"].append({
                "name": phase.name,
                "description": phase.description,
                "mcreynolds": {
                    "X": phase.mcreynolds_x,
                    "Y": phase.mcreynolds_y,
                    "Z": phase.mcreynolds_z,
                    "U": phase.mcreynolds_u,
                    "S": phase.mcreynolds_s,
                    "sum": (phase.mcreynolds_x + phase.mcreynolds_y + 
                           phase.mcreynolds_z + phase.mcreynolds_u + 
                           phase.mcreynolds_s)
                },
                "polarity_index": phase.polarity_index,
                "max_temp": phase.max_temp,
                "applications": phase.applications
            })
        
        # McReynolds constant comparison
        constants = ["X", "Y", "Z", "U", "S"]
        for constant in constants:
            values = [(phase.name, getattr(phase, f"mcreynolds_{constant.lower()}")) 
                     for phase in valid_phases]
            comparison["mcreynolds_comparison"][constant] = {
                "probe_compound": self.probe_compounds[constant]["name"],
                "description": self.probe_compounds[constant]["description"],
                "values": sorted(values, key=lambda x: x[1], reverse=True)
            }
        
        # Polarity ranking
        polarity_ranking = [(phase.name, phase.polarity_index) for phase in valid_phases]
        comparison["polarity_ranking"] = sorted(polarity_ranking, key=lambda x: x[1])
        
        # Temperature limits
        temp_ranking = [(phase.name, phase.max_temp) for phase in valid_phases]
        comparison["temperature_limits"] = sorted(temp_ranking, key=lambda x: x[1], reverse=True)
        
        return comparison
    
    def find_equivalent_phases(self, phase_name: str, vendor: str = None) -> Dict:
        """Find equivalent phases from different vendors"""
        
        if phase_name not in self.phases:
            return {"error": f"Unknown phase: {phase_name}"}
        
        phase = self.phases[phase_name]
        equivalents = phase.vendor_equivalents.copy()
        
        if vendor and vendor in equivalents:
            return {
                "original_phase": phase_name,
                "vendor": vendor,
                "equivalent": equivalents[vendor],
                "description": phase.description
            }
        
        return {
            "original_phase": phase_name,
            "description": phase.description,
            "vendor_equivalents": equivalents
        }
    
    def get_phase_details(self, phase_name: str) -> Dict:
        """Get detailed information about a specific phase"""
        
        if phase_name not in self.phases:
            return {"error": f"Unknown phase: {phase_name}"}
        
        phase = self.phases[phase_name]
        
        return {
            "name": phase.name,
            "description": phase.description,
            "mcreynolds_constants": {
                "X": {"value": phase.mcreynolds_x, "probe": "Benzene", "selectivity": "Aromatic"},
                "Y": {"value": phase.mcreynolds_y, "probe": "n-Butanol", "selectivity": "Hydrogen bonding"},
                "Z": {"value": phase.mcreynolds_z, "probe": "2-Pentanone", "selectivity": "Carbonyl"},
                "U": {"value": phase.mcreynolds_u, "probe": "Nitropropane", "selectivity": "Nitro"},
                "S": {"value": phase.mcreynolds_s, "probe": "Pyridine", "selectivity": "Basic"}
            },
            "selectivity_sum": (phase.mcreynolds_x + phase.mcreynolds_y + 
                              phase.mcreynolds_z + phase.mcreynolds_u + 
                              phase.mcreynolds_s),
            "polarity_index": phase.polarity_index,
            "max_temp": phase.max_temp,
            "applications": phase.applications,
            "vendor_equivalents": phase.vendor_equivalents
        }


# Global instance
stationary_phase_selector = StationaryPhaseSelector()
