"""
Professional MDL/LOD/LOQ Calculator
EPA Method, ICH Guidelines, and Agilent-specific parameters
"""

import numpy as np
from scipy import stats
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import json
import logging

# Import rigorous physics calculations
from ..services.rigorous_physics import calculate_uncertainty_budget

logger = logging.getLogger(__name__)

@dataclass
class MDLCalculation:
    """Complete MDL calculation with all statistical parameters"""
    # Input data
    replicate_values: List[float]
    analyte_concentration: float
    baseline_noise: float
    detector_type: str  # FID, SCD, NCD, FPD
    
    # Calculated values
    mean: float
    std_dev: float
    rsd_percent: float
    
    # MDL calculations
    mdl_stats: float  # Statistical MDL (EPA method)
    lod_sn: float     # LOD from S/N ratio (ICH)
    loq_sn: float     # LOQ from S/N ratio
    
    # Statistical tests
    grubbs_outliers: List[int]  # Indices of outliers
    confidence_interval_95: Tuple[float, float]
    t_value: float
    degrees_freedom: int
    
    # Agilent-specific
    chemstation_noise: float  # 6x peak-to-peak/5
    sampling_rate_effect: float
    
    # Validation
    method_used: str
    meets_criteria: bool
    warnings: List[str]
    
    def to_report(self) -> Dict:
        """Generate professional report format"""
        return {
            "Analysis Date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "Method": self.method_used,
            "Statistical Summary": {
                "Number of Replicates": len(self.replicate_values),
                "Mean Response": f"{self.mean:.2f}",
                "Standard Deviation": f"{self.std_dev:.4f}",
                "RSD%": f"{self.rsd_percent:.2f}%",
                "95% CI": f"[{self.confidence_interval_95[0]:.2f}, {self.confidence_interval_95[1]:.2f}]"
            },
            "Detection Limits": {
                "MDL (EPA)": f"{self.mdl_stats:.4f} {self._get_units()}",
                "LOD (3σ)": f"{self.lod_sn:.4f} {self._get_units()}",
                "LOQ (10σ)": f"{self.loq_sn:.4f} {self._get_units()}"
            },
            "Agilent Parameters": {
                "Detector Type": self.detector_type,
                "ChemStation Noise": f"{self.chemstation_noise:.2f} pA",
                "Sampling Rate Correction": f"{self.sampling_rate_effect:.3f}"
            },
            "Quality Control": {
                "Outliers Detected": len(self.grubbs_outliers),
                "Meets EPA Criteria": self.meets_criteria,
                "Warnings": self.warnings
            }
        }
    
    def _get_units(self) -> str:
        """Determine appropriate units based on concentration"""
        if self.analyte_concentration < 0.001:
            return "ppb"
        elif self.analyte_concentration < 1:
            return "ppm"
        else:
            return "mg/L"

class ProfessionalMDLCalculator:
    """
    Professional-grade MDL calculator with multiple methods
    """
    
    # Student's t-values for 95% confidence
    T_VALUES_95 = {
        6: 3.365,   # 7 replicates (n-1 = 6)
        7: 3.143,   # 8 replicates
        8: 2.998,   # 9 replicates
        9: 2.896,   # 10 replicates
        10: 2.821,  # 11 replicates
    }
    
    # Agilent detector characteristics
    DETECTOR_SPECS = {
        "FID": {
            "typical_noise_pa": 0.5,
            "min_area": 1.0,
            "linearity_range": 7,  # orders of magnitude
        },
        "SCD": {
            "typical_noise_pa": 2.0,
            "min_area": 10.0,
            "linearity_range": 4,
        },
        "NCD": {
            "typical_noise_pa": 1.5,
            "min_area": 5.0,
            "linearity_range": 4,
        },
        "FPD": {
            "typical_noise_pa": 5.0,
            "min_area": 20.0,
            "linearity_range": 3,
        }
    }
    
    def calculate_mdl(self,
                     replicate_areas: List[float],
                     concentration: float,
                     baseline_noise: float,
                     detector_type: str = "FID",
                     method: str = "EPA") -> MDLCalculation:
        """
        Calculate MDL using specified method
        
        Args:
            replicate_areas: Peak areas from replicate injections
            concentration: Analyte concentration
            baseline_noise: Baseline noise in pA
            detector_type: FID, SCD, NCD, or FPD
            method: EPA, ICH, or ASTM
        """
        
        # Remove obvious outliers first
        cleaned_data, outlier_indices = self._grubbs_test(replicate_areas)
        
        # Calculate statistics
        mean_area = np.mean(cleaned_data)
        std_dev = np.std(cleaned_data, ddof=1)
        rsd = (std_dev / mean_area) * 100 if mean_area > 0 else 0
        
        # Get t-value for confidence interval
        n = len(cleaned_data)
        dof = n - 1
        t_value = self.T_VALUES_95.get(dof, stats.t.ppf(0.975, dof))
        
        # EPA Method Detection Limit
        mdl_epa = t_value * std_dev * (concentration / mean_area) if mean_area > 0 else 0
        
        # ICH Method (Signal-to-Noise)
        signal_to_noise = mean_area / (2 * baseline_noise) if baseline_noise > 0 else 0
        lod_sn = 3 * concentration / signal_to_noise if signal_to_noise > 0 else 0
        loq_sn = 10 * concentration / signal_to_noise if signal_to_noise > 0 else 0
        
        # Agilent ChemStation noise calculation
        chemstation_noise = self._calculate_chemstation_noise(
            baseline_noise, 
            detector_type
        )
        
        # Sampling rate effect (Agilent specific)
        sampling_effect = self._sampling_rate_correction(detector_type)
        
        # Confidence interval
        margin = t_value * std_dev / np.sqrt(n)
        ci_95 = (mean_area - margin, mean_area + margin)
        
        # Validation checks
        warnings = []
        if rsd > 20:
            warnings.append(f"High RSD ({rsd:.1f}%) - check injection precision")
        if len(outlier_indices) > 1:
            warnings.append(f"Multiple outliers detected - review method")
        if signal_to_noise < 10:
            warnings.append("Low S/N ratio - near detection limit")
        
        meets_criteria = rsd < 20 and signal_to_noise > 3
        
        return MDLCalculation(
            replicate_values=replicate_areas,
            analyte_concentration=concentration,
            baseline_noise=baseline_noise,
            detector_type=detector_type,
            mean=mean_area,
            std_dev=std_dev,
            rsd_percent=rsd,
            mdl_stats=mdl_epa,
            lod_sn=lod_sn,
            loq_sn=loq_sn,
            grubbs_outliers=outlier_indices,
            confidence_interval_95=ci_95,
            t_value=t_value,
            degrees_freedom=dof,
            chemstation_noise=chemstation_noise,
            sampling_rate_effect=sampling_effect,
            method_used=method,
            meets_criteria=meets_criteria,
            warnings=warnings
        )
    
    def _grubbs_test(self, data: List[float], alpha: float = 0.05) -> Tuple[List[float], List[int]]:
        """
        Grubbs test for outlier detection
        Returns cleaned data and indices of outliers
        """
        outliers = []
        cleaned = data.copy()
        
        while True:
            mean = np.mean(cleaned)
            std = np.std(cleaned, ddof=1)
            
            if std == 0:
                break
                
            # Calculate Grubbs statistic for each point
            g_values = [abs(x - mean) / std for x in cleaned]
            max_g = max(g_values)
            max_idx = g_values.index(max_g)
            
            # Critical value
            n = len(cleaned)
            t_crit = stats.t.ppf(1 - alpha/(2*n), n-2)
            g_crit = ((n-1) / np.sqrt(n)) * np.sqrt(t_crit**2 / (n-2 + t_crit**2))
            
            if max_g > g_crit:
                outliers.append(data.index(cleaned[max_idx]))
                cleaned.pop(max_idx)
                
                if len(cleaned) < 4:  # Need at least 4 points
                    break
            else:
                break
                
        return cleaned, outliers
    
    def _calculate_chemstation_noise(self, baseline_noise: float, detector: str) -> float:
        """
        Convert to ChemStation noise calculation
        ChemStation uses 6 * peak-to-peak / 5
        """
        # Conversion factor from RMS to peak-to-peak (approximately 5x for GC baseline)
        pp_noise = baseline_noise * 5
        chemstation_noise = (6 * pp_noise) / 5
        
        # Apply detector-specific corrections
        if detector == "SCD":
            chemstation_noise *= 1.2  # SCD typically noisier
        elif detector == "FPD":
            chemstation_noise *= 1.5  # FPD most noise
            
        return chemstation_noise
    
    def _sampling_rate_correction(self, detector: str) -> float:
        """
        Agilent sampling rate affects noise measurement
        Higher sampling = more apparent noise
        """
        corrections = {
            "FID": 1.0,   # Reference
            "SCD": 1.15,  # Slower response
            "NCD": 1.10,  # Moderate response
            "FPD": 1.25   # Slowest response
        }
        return corrections.get(detector, 1.0)
    
    def validate_linearity(self, 
                          concentrations: List[float],
                          areas: List[float]) -> Dict:
        """
        Validate calibration linearity for method validity
        """
        # Linear regression
        coeffs = np.polyfit(concentrations, areas, 1)
        slope, intercept = coeffs
        
        # Calculate R²
        y_pred = np.polyval(coeffs, concentrations)
        ss_res = np.sum((areas - y_pred) ** 2)
        ss_tot = np.sum((areas - np.mean(areas)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        
        # Residual analysis
        residuals = areas - y_pred
        residual_percent = (residuals / y_pred * 100) if all(y_pred) else [0]
        
        return {
            "slope": slope,
            "intercept": intercept,
            "r_squared": r_squared,
            "linear": r_squared > 0.995,
            "max_residual_percent": max(abs(r) for r in residual_percent),
            "recommendation": "Calibration valid" if r_squared > 0.995 else "Recalibrate"
        }

