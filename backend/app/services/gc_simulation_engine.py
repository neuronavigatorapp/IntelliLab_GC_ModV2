"""
GC Instrument Simulation Engine
Real-time GC simulation with comprehensive physical modeling
"""

import numpy as np
import math
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, field
from scipy import special

from backend.app.models.gc_sandbox_schemas import (
    SandboxMethodParameters, SandboxInlet, SandboxColumn, SandboxOvenProgramStep,
    SandboxDetectorConfig, SandboxDetectorFID, SandboxDetectorTCD, SandboxDetectorSCD,
    SandboxSampleProfile, SandboxRunRequest, SandboxRunResult,
    SandboxChromatogramSeries, SandboxTimeSeriesData, SandboxValveEvent,
    SandboxPeakKPIs, SandboxRunKPIs,
    CarrierGasType, FlowMode, DetectorType, ValveState
)


@dataclass
class GCPhysicalConstants:
    """Physical constants for GC calculations"""
    
    # Gas viscosities at 25°C (Pa·s × 10^6)
    GAS_VISCOSITIES = {
        CarrierGasType.HELIUM: 19.9,
        CarrierGasType.HYDROGEN: 8.9,
        CarrierGasType.NITROGEN: 17.8,
        CarrierGasType.ARGON: 22.7
    }
    
    # Gas thermal conductivities (W/m·K × 10^3) 
    GAS_THERMAL_CONDUCTIVITY = {
        CarrierGasType.HELIUM: 151.3,
        CarrierGasType.HYDROGEN: 185.9,
        CarrierGasType.NITROGEN: 25.9,
        CarrierGasType.ARGON: 17.7
    }
    
    # Standard conditions
    STANDARD_PRESSURE_KPA = 101.325
    STANDARD_TEMPERATURE_K = 273.15


class GCSimulationEngine:
    """
    Comprehensive GC simulation engine with realistic physics modeling
    
    Features:
    - Column hold-up time and linear velocity calculations
    - Retention time prediction with temperature programming
    - Peak shape modeling (EMG - Exponentially Modified Gaussian)
    - Detector response simulation
    - Valve timing and backflush modeling
    - Realistic noise and baseline drift
    """
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize simulation engine"""
        
        self.logger = logging.getLogger(__name__)
        self.constants = GCPhysicalConstants()
        
        # Set random seed for reproducible results
        if seed is not None:
            np.random.seed(seed)
            
        # Simulation state
        self.current_time_min = 0.0
        self.simulation_step_s = 0.05  # 50ms time steps (20 Hz default)
        
    async def simulate_gc_run(self, request: SandboxRunRequest) -> SandboxRunResult:
        """
        Execute complete GC simulation
        
        Args:
            request: Complete simulation request with method and sample
            
        Returns:
            Comprehensive simulation results with chromatograms and KPIs
        """
        
        start_time = datetime.now()
        self.logger.info(f"Starting GC simulation for run {request.run_id}")
        
        try:
            # Extract method and sample parameters
            method = request.method_parameters
            sample = request.sample_profile
            
            # Set simulation parameters
            if request.simulation_seed:
                np.random.seed(request.simulation_seed)
                
            self.simulation_step_s = 1.0 / method.acquisition_rate_hz
            
            # Calculate column parameters
            column_params = self._calculate_column_parameters(method)
            
            # Calculate retention times for all analytes
            retention_times = self._calculate_retention_times(method, sample, column_params)
            
            # Generate oven temperature profile
            oven_temp_series = self._simulate_oven_program(method.oven_program, method.expected_run_time_min)
            
            # Generate flow and pressure profiles
            flow_series, pressure_series = self._simulate_flow_pressure_profiles(method, oven_temp_series)
            
            # Generate valve events
            valve_events = self._simulate_valve_programs(method.valve_programs, method.expected_run_time_min)
            
            # Generate chromatograms for each detector
            chromatograms = []
            for detector in method.detectors:
                chrom_data = self._generate_chromatogram(
                    detector, sample, retention_times, method.expected_run_time_min,
                    oven_temp_series, request.include_noise, request.include_baseline_drift
                )
                chromatograms.append(chrom_data)
                
            # Calculate KPIs
            kpis = self._calculate_run_kpis(chromatograms, retention_times, sample)
            
            # Calculate simulation time
            simulation_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            
            # Create result
            result = SandboxRunResult(
                run_id=request.run_id,
                chromatograms=chromatograms,
                oven_temperature_series=oven_temp_series,
                flow_series=flow_series,
                pressure_series=pressure_series,
                valve_events=valve_events,
                kpis=kpis,
                simulation_time_ms=simulation_time_ms,
                simulation_parameters={
                    "seed": request.simulation_seed,
                    "acquisition_rate_hz": method.acquisition_rate_hz,
                    "include_noise": request.include_noise,
                    "include_baseline_drift": request.include_baseline_drift
                }
            )
            
            self.logger.info(f"Simulation completed in {simulation_time_ms:.1f} ms")
            return result
            
        except Exception as e:
            self.logger.error(f"Simulation failed: {e}")
            raise
    
    def _calculate_column_parameters(self, method: SandboxMethodParameters) -> Dict[str, Any]:
        """Calculate fundamental column parameters"""
        
        params = {}
        
        for column in method.columns:
            # Column dimensions
            length_cm = column.length_meters * 100
            radius_cm = column.inner_diameter_mm / 2 / 10  # Convert mm to cm
            volume_ml = math.pi * radius_cm**2 * length_cm
            
            # Get carrier gas properties
            inlet = method.inlets[0]  # Assume first inlet for simplicity
            gas_viscosity = self.constants.GAS_VISCOSITIES[inlet.carrier_gas] * 1e-6  # Convert to Pa·s
            
            # Calculate hold-up time at reference conditions (isothermal at 100°C)
            ref_temp_k = 373.15  # 100°C
            ref_pressure_pa = inlet.inlet_pressure_kpa * 1000
            
            # Poiseuille flow equation for hold-up time
            if column.flow_mode == FlowMode.CONSTANT_FLOW and column.target_flow_ml_min:
                flow_ml_s = column.target_flow_ml_min / 60
                hold_up_time_s = volume_ml / flow_ml_s
            else:
                # Estimate from pressure and column geometry
                flow_ml_s = (math.pi * radius_cm**4 * ref_pressure_pa) / (8 * gas_viscosity * length_cm * 60)
                hold_up_time_s = volume_ml / flow_ml_s
            
            # Linear velocity
            linear_velocity_cm_s = length_cm / hold_up_time_s
            
            params[column.column_id] = {
                "hold_up_time_s": hold_up_time_s,
                "linear_velocity_cm_s": linear_velocity_cm_s,
                "volume_ml": volume_ml,
                "length_cm": length_cm,
                "radius_cm": radius_cm,
                "flow_ml_s": flow_ml_s
            }
            
        return params
    
    def _calculate_retention_times(self, method: SandboxMethodParameters, 
                                 sample: SandboxSampleProfile, 
                                 column_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate retention times for all analytes"""
        
        retention_times = []
        
        # Use first column for retention time calculation
        column = method.columns[0]
        col_params = column_params[column.column_id]
        
        for i, analyte in enumerate(sample.analytes):
            # Base retention time calculation using retention factor
            base_rt_min = analyte.retention_factor * 2.0  # Use retention_factor from analyte
            
            # Adjust for temperature programming
            # Simplified model: longer retention for lower average temperature
            avg_temp_c = self._calculate_average_oven_temperature(method.oven_program)
            temp_factor = 1.0 + (100.0 - avg_temp_c) * 0.01  # 1% change per °C difference from 100°C
            
            # Adjust for flow rate
            flow_factor = 1.0
            if column.target_flow_ml_min:
                ref_flow_ml_min = 1.0  # Reference flow
                flow_factor = ref_flow_ml_min / column.target_flow_ml_min
            
            # Calculate final retention time
            retention_time_min = base_rt_min * temp_factor * flow_factor
            
            retention_data = {
                "analyte_name": analyte.name,
                "retention_time_min": retention_time_min,
                "base_retention_time_min": base_rt_min,
                "response_factor": analyte.response_factor,
                "concentration": analyte.concentration_ppm,
                "peak_width_base_min": 0.1,  # Default peak width
                "tailing_factor": 1.2,  # Default tailing
                "theoretical_plates": 5000  # Default plates
            }
            
            retention_times.append(retention_data)
            
        # Sort by retention time
        retention_times.sort(key=lambda x: x["retention_time_min"])
        
        return retention_times
    
    def _calculate_average_oven_temperature(self, oven_program: List[SandboxOvenProgramStep]) -> float:
        """Calculate time-weighted average oven temperature"""
        
        if not oven_program:
            return 100.0  # Default temperature
            
        total_time = 0.0
        weighted_temp = 0.0
        
        current_temp = oven_program[0].target_temperature_celsius
        current_time = 0.0
        
        for step in oven_program:
            if step.step_number == 1:
                # Initial hold
                segment_time = step.hold_time_min
                weighted_temp += current_temp * segment_time
                total_time += segment_time
                current_time += segment_time
            else:
                # Ramp and hold
                if step.ramp_rate_c_min and step.ramp_rate_c_min > 0:
                    ramp_time = abs(step.target_temperature_celsius - current_temp) / step.ramp_rate_c_min
                    avg_ramp_temp = (current_temp + step.target_temperature_celsius) / 2
                    weighted_temp += avg_ramp_temp * ramp_time
                    total_time += ramp_time
                    current_time += ramp_time
                
                # Hold at target
                if step.hold_time_min > 0:
                    weighted_temp += step.target_temperature_celsius * step.hold_time_min
                    total_time += step.hold_time_min
                    current_time += step.hold_time_min
                
                current_temp = step.target_temperature_celsius
        
        return weighted_temp / total_time if total_time > 0 else current_temp
    
    def _simulate_oven_program(self, oven_program: List[SandboxOvenProgramStep], 
                              run_time_min: float) -> SandboxTimeSeriesData:
        """Generate oven temperature profile"""
        
        time_points = np.arange(0, run_time_min + self.simulation_step_s/60, self.simulation_step_s/60)
        temperatures = np.zeros_like(time_points)
        
        current_temp = oven_program[0].target_temperature_celsius
        current_time = 0.0
        
        for i, time_min in enumerate(time_points):
            if time_min <= current_time:
                temperatures[i] = current_temp
                continue
                
            # Find which program step we're in
            step_start_time = 0.0
            for step in oven_program:
                if step.step_number == 1:
                    # Initial step
                    if time_min <= step.hold_time_min:
                        temperatures[i] = step.target_temperature_celsius
                        break
                    step_start_time += step.hold_time_min
                    current_temp = step.target_temperature_celsius
                else:
                    # Ramp step
                    if step.ramp_rate_c_min and step.ramp_rate_c_min > 0:
                        ramp_time = abs(step.target_temperature_celsius - current_temp) / step.ramp_rate_c_min
                        
                        if step_start_time <= time_min <= step_start_time + ramp_time:
                            # During ramp
                            ramp_progress = (time_min - step_start_time) / ramp_time
                            temp_diff = step.target_temperature_celsius - current_temp
                            temperatures[i] = current_temp + temp_diff * ramp_progress
                            break
                        elif time_min <= step_start_time + ramp_time + step.hold_time_min:
                            # During hold
                            temperatures[i] = step.target_temperature_celsius
                            break
                        
                        step_start_time += ramp_time + step.hold_time_min
                        current_temp = step.target_temperature_celsius
                    else:
                        # Instantaneous change
                        if time_min <= step_start_time + step.hold_time_min:
                            temperatures[i] = step.target_temperature_celsius
                            break
                        step_start_time += step.hold_time_min
                        current_temp = step.target_temperature_celsius
            else:
                # After program ends, maintain final temperature
                temperatures[i] = current_temp
        
        return SandboxTimeSeriesData(
            series_id="oven_temperature",
            parameter_name="oven_temperature",
            time_min=time_points.tolist(),
            values=temperatures.tolist(),
            units="°C"
        )
    
    def _simulate_flow_pressure_profiles(self, method: SandboxMethodParameters, 
                                       oven_temp_series: SandboxTimeSeriesData) -> Tuple[List[SandboxTimeSeriesData], List[SandboxTimeSeriesData]]:
        """Generate flow and pressure profiles"""
        
        flow_series = []
        pressure_series = []
        
        # For each inlet, calculate flow/pressure vs time
        for inlet in method.inlets:
            time_points = oven_temp_series.time_min
            
            # Constant flow mode (most common)
            if inlet.total_flow_ml_min:
                flows = [inlet.total_flow_ml_min] * len(time_points)
                
                flow_series.append(SandboxTimeSeriesData(
                    series_id=f"{inlet.inlet_id}_flow",
                    parameter_name="total_flow",
                    time_min=time_points,
                    values=flows,
                    units="mL/min"
                ))
            
            # Pressure varies with temperature (simplified)
            base_pressure = inlet.inlet_pressure_kpa
            pressures = []
            
            for temp_c in oven_temp_series.values:
                # Gas law: pressure increases with temperature
                temp_k = temp_c + 273.15
                pressure_factor = temp_k / (100 + 273.15)  # Relative to 100°C
                pressure = base_pressure * pressure_factor
                pressures.append(pressure)
            
            pressure_series.append(SandboxTimeSeriesData(
                series_id=f"{inlet.inlet_id}_pressure",
                parameter_name="inlet_pressure",
                time_min=time_points,
                values=pressures,
                units="kPa"
            ))
            
            # Split ratio (if applicable)
            if inlet.split_ratio:
                split_ratios = [inlet.split_ratio] * len(time_points)
                
                flow_series.append(SandboxTimeSeriesData(
                    series_id=f"{inlet.inlet_id}_split_ratio",
                    parameter_name="split_ratio",
                    time_min=time_points,
                    values=split_ratios,
                    units="ratio"
                ))
        
        return flow_series, pressure_series
    
    def _simulate_valve_programs(self, valve_programs: List, run_time_min: float) -> List[SandboxValveEvent]:
        """Generate valve state timeline"""
        
        valve_events = []
        
        for valve_program in valve_programs:
            valve_id = valve_program.valve_id
            
            # Generate events based on valve type
            if valve_program.valve_type == "rotary" and valve_program.loop_size_ul:
                # LPG rotary valve program
                load_time = valve_program.load_time_min or 2.0
                inject_time = valve_program.inject_time_min or 0.5
                
                # Load phase
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=0.0,
                    state=ValveState.LOAD,
                    duration_min=load_time
                ))
                
                # Inject phase
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=load_time,
                    state=ValveState.INJECT,
                    duration_min=inject_time
                ))
                
                # Back to load for remainder
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=load_time + inject_time,
                    state=ValveState.LOAD,
                    duration_min=run_time_min - load_time - inject_time
                ))
                
            elif valve_program.valve_type == "backflush":
                # Backflush valve program - typically near end of run
                backflush_start = run_time_min * 0.8  # Start at 80% of run
                backflush_duration = 2.0
                
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=0.0,
                    state=ValveState.INJECT,
                    duration_min=backflush_start
                ))
                
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=backflush_start,
                    state=ValveState.BACKFLUSH,
                    duration_min=backflush_duration
                ))
                
                valve_events.append(SandboxValveEvent(
                    valve_id=valve_id,
                    time_min=backflush_start + backflush_duration,
                    state=ValveState.INJECT,
                    duration_min=run_time_min - backflush_start - backflush_duration
                ))
        
        return sorted(valve_events, key=lambda x: x.time_min)
    
    def _generate_chromatogram(self, detector: SandboxDetectorConfig, sample: SandboxSampleProfile,
                             retention_times: List[Dict[str, Any]], run_time_min: float,
                             oven_temp_series: SandboxTimeSeriesData, 
                             include_noise: bool, include_baseline_drift: bool) -> SandboxChromatogramSeries:
        """Generate synthetic chromatogram with realistic peak shapes"""
        
        # Time axis
        time_points = np.arange(0, run_time_min, self.simulation_step_s / 60)
        signal = np.zeros_like(time_points)
        
        # Generate peaks using EMG (Exponentially Modified Gaussian) model
        for peak_data in retention_times:
            rt = peak_data["retention_time_min"]
            width_base = peak_data["peak_width_base_min"]
            tailing = peak_data["tailing_factor"]
            concentration = peak_data["concentration"]
            response_factor = peak_data["response_factor"]
            
            # Skip peaks outside time range
            if rt < 0 or rt > run_time_min:
                continue
                
            # EMG parameters
            sigma = width_base / 4.0  # Width parameter
            tau = sigma * (tailing - 1.0)  # Tailing parameter
            
            # Peak height based on detector type and response
            base_height = concentration * response_factor * sample.target_signal_to_noise
            
            # Apply detector-specific response
            if isinstance(detector, SandboxDetectorFID):
                # FID responds to carbon content
                detector_response = 1.0  # Assume all carbon-containing
            elif isinstance(detector, SandboxDetectorTCD):
                # TCD universal detector
                detector_response = 0.8  # Slightly lower sensitivity
            elif isinstance(detector, SandboxDetectorSCD):
                # SCD specific to sulfur
                detector_response = 0.5 if "sulfur" in peak_data["analyte_name"].lower() else 0.0
            else:
                detector_response = 1.0
                
            peak_height = base_height * detector_response
            
            if peak_height <= 0:
                continue
            
            # Generate EMG peak
            peak_signal = self._generate_emg_peak(time_points, rt, sigma, tau, peak_height)
            signal += peak_signal
        
        # Add baseline
        baseline_level = 100.0  # Arbitrary baseline units
        signal += baseline_level
        
        # Add baseline drift
        if include_baseline_drift:
            drift_rate = sample.baseline_drift_percent_min / 100.0 * baseline_level
            drift = np.linspace(0, drift_rate * run_time_min, len(time_points))
            signal += drift
        
        # Add noise
        if include_noise:
            noise_level = sample.baseline_noise_level
            noise = np.random.normal(0, noise_level, len(time_points))
            signal += noise
        
        # Ensure non-negative signal
        signal = np.maximum(signal, 0.1)
        
        # Determine detector type
        if isinstance(detector, SandboxDetectorFID):
            detector_type = DetectorType.FID
        elif isinstance(detector, SandboxDetectorTCD):
            detector_type = DetectorType.TCD
        elif isinstance(detector, SandboxDetectorSCD):
            detector_type = DetectorType.SCD
        else:
            detector_type = DetectorType.FID  # Default
        
        return SandboxChromatogramSeries(
            detector_id=detector.detector_id,
            detector_type=detector_type,
            time_min=time_points.tolist(),
            intensity=signal.tolist(),
            sampling_rate_hz=1.0 / self.simulation_step_s,
            signal_units="counts"
        )
    
    def _generate_emg_peak(self, time_points: np.ndarray, rt_min: float, 
                          sigma: float, tau: float, height: float) -> np.ndarray:
        """Generate Exponentially Modified Gaussian peak"""
        
        # EMG function
        t = time_points
        
        # Handle tau = 0 case (pure Gaussian)
        if abs(tau) < 1e-6:
            # Pure Gaussian
            exponent = -0.5 * ((t - rt_min) / sigma) ** 2
            peak = height * np.exp(exponent)
        else:
            # EMG calculation
            lambda_param = 1.0 / tau
            
            # Compute EMG components
            z = lambda_param * (sigma**2 * lambda_param - (t - rt_min)) / (sigma * math.sqrt(2))
            
            # Use stable computation for large values
            arg1 = lambda_param * (t - rt_min - sigma**2 * lambda_param)
            arg2 = (t - rt_min) / (sigma * math.sqrt(2))
            
            # Avoid overflow in exponential
            arg1 = np.clip(arg1, -50, 50)
            arg2 = np.clip(arg2, -10, 10)
            
            # EMG formula
            peak = np.zeros_like(t)
            valid_mask = (t > 0)  # Only compute for positive times
            
            if np.any(valid_mask):
                exp_term = np.exp(arg1[valid_mask])
                # Complementary error function approximation
                erfc_term = np.where(z[valid_mask] < -5, 2.0, 
                                   np.where(z[valid_mask] > 5, 0.0, 
                                          1.0 - special.erf(z[valid_mask]/math.sqrt(2))))
                
                peak[valid_mask] = height * (lambda_param / 2.0) * exp_term * erfc_term
        
        return peak
    
    def _calculate_run_kpis(self, chromatograms: List[SandboxChromatogramSeries],
                           retention_times: List[Dict[str, Any]], 
                           sample: SandboxSampleProfile) -> SandboxRunKPIs:
        """Calculate comprehensive run performance indicators"""
        
        # Use first chromatogram for peak analysis
        if not chromatograms:
            raise ValueError("No chromatograms available for KPI calculation")
            
        chrom = chromatograms[0]
        time_array = np.array(chrom.time_min)
        signal_array = np.array(chrom.intensity)
        
        peak_kpis = []
        total_area = 0.0
        resolutions = []
        
        for i, peak_data in enumerate(retention_times):
            # Find peak in chromatogram
            rt = peak_data["retention_time_min"]
            
            # Find peak maximum near retention time
            rt_idx = np.argmin(np.abs(time_array - rt))
            search_range = int(0.5 / (time_array[1] - time_array[0]))  # ±0.5 min search
            
            start_idx = max(0, rt_idx - search_range)
            end_idx = min(len(signal_array), rt_idx + search_range)
            
            peak_region_signal = signal_array[start_idx:end_idx]
            peak_region_time = time_array[start_idx:end_idx]
            
            if len(peak_region_signal) == 0:
                continue
                
            # Find actual peak maximum
            max_idx = np.argmax(peak_region_signal)
            actual_rt = peak_region_time[max_idx]
            peak_height = peak_region_signal[max_idx]
            
            # Calculate peak area (simple integration)
            baseline = np.min(signal_array)  # Simple baseline
            peak_area = np.trapz(peak_region_signal - baseline, peak_region_time)
            total_area += peak_area
            
            # Calculate peak width at half height
            half_height = (peak_height + baseline) / 2
            half_height_indices = np.where(peak_region_signal >= half_height)[0]
            
            if len(half_height_indices) > 1:
                width_at_half_height = peak_region_time[half_height_indices[-1]] - peak_region_time[half_height_indices[0]]
            else:
                width_at_half_height = 0.1  # Default
            
            # Estimate peak width at base (4σ for Gaussian)
            width_at_base = width_at_half_height * 2.35  # Convert FWHM to base width
            
            # Calculate theoretical plates
            theoretical_plates = int(5.54 * (actual_rt / width_at_half_height) ** 2)
            
            # Estimate tailing factor
            tailing_factor = peak_data.get("tailing_factor", 1.2)
            asymmetry_factor = tailing_factor  # Simplified
            
            # Calculate S/N ratio
            noise_region = signal_array[:min(100, len(signal_array)//10)]  # First 10% as noise
            noise_std = np.std(noise_region)
            signal_to_noise = (peak_height - baseline) / (2 * noise_std) if noise_std > 0 else 100.0
            
            # Calculate resolution from previous peak
            resolution_from_previous = None
            if i > 0:
                prev_rt = retention_times[i-1]["retention_time_min"]
                prev_width = peak_kpis[-1].width_at_half_height_min if peak_kpis else 0.1
                
                resolution = 2 * (actual_rt - prev_rt) / (width_at_half_height + prev_width)
                resolution_from_previous = resolution
                resolutions.append(resolution)
            
            # Create peak KPIs
            peak_kpi = SandboxPeakKPIs(
                peak_number=i + 1,
                analyte_name=peak_data["analyte_name"],
                retention_time_min=actual_rt,
                peak_width_min=width_at_base,
                width_at_half_height_min=width_at_half_height,
                tailing_factor=tailing_factor,
                asymmetry_factor=asymmetry_factor,
                theoretical_plates=theoretical_plates,
                peak_area=peak_area,
                peak_height=peak_height - baseline,
                area_percent=(peak_area / total_area * 100) if total_area > 0 else 0.0,
                signal_to_noise_ratio=signal_to_noise,
                resolution_from_previous=resolution_from_previous
            )
            
            peak_kpis.append(peak_kpi)
        
        # Calculate overall statistics
        if peak_kpis:
            average_resolution = np.mean(resolutions) if resolutions else 0.0
            min_resolution = np.min(resolutions) if resolutions else 0.0
            average_theoretical_plates = np.mean([p.theoretical_plates for p in peak_kpis])
            average_signal_to_noise = np.mean([p.signal_to_noise_ratio for p in peak_kpis])
        else:
            average_resolution = 0.0
            min_resolution = 0.0
            average_theoretical_plates = 0.0
            average_signal_to_noise = 0.0
        
        # Update area percentages
        if total_area > 0:
            for peak_kpi in peak_kpis:
                peak_kpi.area_percent = peak_kpi.peak_area / total_area * 100
        
        # Calculate baseline drift
        baseline_start = np.mean(signal_array[:10]) if len(signal_array) > 10 else 0
        baseline_end = np.mean(signal_array[-10:]) if len(signal_array) > 10 else 0
        baseline_drift_percent = abs(baseline_end - baseline_start) / baseline_start * 100 if baseline_start > 0 else 0
        
        return SandboxRunKPIs(
            total_peaks=len(peak_kpis),
            peak_kpis=peak_kpis,
            average_resolution=average_resolution,
            min_resolution=min_resolution,
            average_theoretical_plates=average_theoretical_plates,
            average_signal_to_noise=average_signal_to_noise,
            baseline_drift_total_percent=baseline_drift_percent,
            actual_run_time_min=max(chrom.time_min) if chrom.time_min else 0.0
        )