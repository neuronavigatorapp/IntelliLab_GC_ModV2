#!/usr/bin/env python3
"""
GC Instrument Sandbox Demo Script
Demonstrates the comprehensive GC simulation capabilities
"""

import asyncio
import json
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.models.gc_sandbox_schemas import (
    SandboxRunRequest, SandboxMethodParameters, SandboxSampleProfile,
    SandboxInlet, SandboxColumn, SandboxDetectorFID, SandboxDetectorSCD,
    SandboxOvenProgramStep, SandboxAnalyte, DetectorType, InletType, FlowMode
)
from app.services.gc_simulation_engine import GCSimulationEngine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def demo_astm_d2163_lpg_analysis():
    """
    Demonstrate ASTM D2163-style LPG analysis simulation
    """
    
    print("\n" + "="*80)
    print("🧪 GC INSTRUMENT SANDBOX DEMONSTRATION")
    print("ASTM D2163 - LPG Analysis by GC")
    print("="*80)
    
    # Initialize simulation engine
    engine = GCSimulationEngine()
    
    # Build comprehensive method parameters
    method = SandboxMethodParameters(
        inlets=[
            SandboxInlet(
                inlet_id="INL1",
                inlet_type=InletType.split,
                temperature_c=150.0,
                split_ratio=20.0,
                total_flow_ml_min=60.0,
                carrier_gas="helium",
                gas_saver=True,
                gas_saver_flow_ml_min=25.0,
                gas_saver_delay_min=2.0,
                pulse_pressure_kpa=250.0,
                pulse_duration_min=0.5
            )
        ],
        columns=[
            SandboxColumn(
                column_id="COL1_MOLECULAR_SIEVE",
                length_m=6.0,
                inner_diameter_mm=2.0,
                film_thickness_um=0.0,
                stationary_phase="PLOT_MOLECULAR_SIEVE_5A",
                flow_mode=FlowMode.constant_flow,
                flow_ml_min=3.0,
                backflush_enabled=True,
                backflush_start_min=8.0,
                backflush_duration_min=2.0
            ),
            SandboxColumn(
                column_id="COL2_ALUMINA_PLOT",
                length_m=50.0,
                inner_diameter_mm=0.53,
                film_thickness_um=10.0,
                stationary_phase="PLOT_ALUMINA_KCl",
                flow_mode=FlowMode.constant_flow,
                flow_ml_min=5.0,
                backflush_enabled=False
            )
        ],
        detectors=[
            SandboxDetectorFID(
                detector_id="FID1",
                detector_type=DetectorType.FID,
                temperature_c=200.0,
                h2_flow_ml_min=40.0,
                air_flow_ml_min=400.0,
                makeup_flow_ml_min=30.0,
                data_rate_hz=50.0
            )
        ],
        oven_program=[
            SandboxOvenProgramStep(
                step_number=1,
                temperature_c=80.0,
                hold_time_min=8.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=80.0
            ),
            SandboxOvenProgramStep(
                step_number=2,
                temperature_c=80.0,
                hold_time_min=0.0,
                ramp_rate_c_min=10.0,
                final_temperature_c=200.0
            ),
            SandboxOvenProgramStep(
                step_number=3,
                temperature_c=200.0,
                hold_time_min=5.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=200.0
            )
        ],
        valve_program=[]
    )
    
    # Build LPG sample profile
    sample = SandboxSampleProfile(
        sample_id="LPG_STANDARD_MIX",
        injection_volume_ul=0.5,
        solvent="none",
        matrix="gas",
        analytes=[
            SandboxAnalyte(
                name="Methane",
                concentration_ppm=15000,
                retention_factor=0.8,
                diffusion_coefficient=0.12,
                response_factor=0.9
            ),
            SandboxAnalyte(
                name="Ethane",
                concentration_ppm=25000,
                retention_factor=1.2,
                diffusion_coefficient=0.08,
                response_factor=1.0
            ),
            SandboxAnalyte(
                name="Propane",
                concentration_ppm=400000,
                retention_factor=2.5,
                diffusion_coefficient=0.06,
                response_factor=1.1
            ),
            SandboxAnalyte(
                name="i-Butane",
                concentration_ppm=80000,
                retention_factor=4.2,
                diffusion_coefficient=0.05,
                response_factor=1.2
            ),
            SandboxAnalyte(
                name="n-Butane",
                concentration_ppm=180000,
                retention_factor=5.8,
                diffusion_coefficient=0.05,
                response_factor=1.2
            ),
            SandboxAnalyte(
                name="i-Pentane",
                concentration_ppm=20000,
                retention_factor=8.5,
                diffusion_coefficient=0.04,
                response_factor=1.3
            ),
            SandboxAnalyte(
                name="n-Pentane",
                concentration_ppm=15000,
                retention_factor=10.2,
                diffusion_coefficient=0.04,
                response_factor=1.3
            )
        ]
    )
    
    # Build simulation request
    request = SandboxRunRequest(
        run_id="ASTM_D2163_LPG_DEMO",
        method_parameters=method,
        sample_profile=sample,
        include_noise=True,
        include_baseline_drift=True,
        simulation_seed=42,
        export_csv=False,
        export_png=False
    )
    
    print(f"\n📊 Method Configuration:")
    print(f"   • Inlets: {len(method.inlets)} (Split injection at {method.inlets[0].temperature_c}°C)")
    print(f"   • Columns: {len(method.columns)} (Molecular sieve + Alumina PLOT)")
    print(f"   • Detectors: {len(method.detectors)} ({method.detectors[0].detector_type.value})")
    print(f"   • Oven Steps: {len(method.oven_program)} (Isothermal hold + ramp)")
    print(f"   • Analytes: {len(sample.analytes)} (LPG components)")
    
    # Run simulation
    print(f"\n🔬 Running GC simulation...")
    
    start_time = asyncio.get_event_loop().time()
    result = await engine.simulate_gc_run(request)
    simulation_time = (asyncio.get_event_loop().time() - start_time) * 1000
    
    print(f"   ✅ Simulation completed in {simulation_time:.1f} ms")
    
    # Display results
    print(f"\n📈 Simulation Results:")
    print(f"   • Run ID: {result.run_id}")
    print(f"   • Engine Time: {result.simulation_time_ms:.1f} ms")
    print(f"   • Chromatograms: {len(result.chromatograms)}")
    
    for chrom in result.chromatograms:
        print(f"     - {chrom.detector_id}: {len(chrom.time_min)} data points")
        print(f"       Time range: {min(chrom.time_min):.2f} - {max(chrom.time_min):.2f} min")
        print(f"       Intensity range: {min(chrom.intensity):.0f} - {max(chrom.intensity):.0f} counts")
    
    if result.kpis:
        print(f"\n📊 Chromatogram KPIs:")
        print(f"   • Total Peaks: {result.kpis.total_peaks}")
        print(f"   • Average Resolution: {result.kpis.average_resolution:.2f}")
        print(f"   • Min Resolution: {result.kpis.min_resolution:.2f}")
        print(f"   • Average Theoretical Plates: {result.kpis.average_theoretical_plates:.0f}")
        print(f"   • Average S/N Ratio: {result.kpis.average_signal_to_noise:.1f}")
        print(f"   • Baseline Drift: {result.kpis.baseline_drift_total_percent:.2f}%")
        print(f"   • Actual Run Time: {result.kpis.actual_run_time_min:.2f} min")
        
        if result.kpis.peak_kpis:
            print(f"\n🎯 Peak Details:")
            print(f"   {'Peak':<5} {'Analyte':<12} {'RT (min)':<8} {'Area':<10} {'Area %':<8} {'S/N':<6} {'Res':<6}")
            print(f"   {'-'*5} {'-'*12} {'-'*8} {'-'*10} {'-'*8} {'-'*6} {'-'*6}")
            
            for peak in result.kpis.peak_kpis:
                print(f"   {peak.peak_number:<5} {peak.analyte_name[:12]:<12} "
                      f"{peak.retention_time_min:<8.2f} {peak.peak_area:<10.0f} "
                      f"{peak.area_percent:<8.1f} {peak.signal_to_noise_ratio:<6.1f} "
                      f"{peak.resolution_from_previous or 0:<6.2f}")
    
    # Display method profile data
    print(f"\n🌡️ Method Profile:")
    if result.oven_temperature_series:
        temp_range = (min(result.oven_temperature_series.values), max(result.oven_temperature_series.values))
        print(f"   • Oven Temperature: {temp_range[0]:.0f} - {temp_range[1]:.0f} °C")
    
    print(f"   • Flow Series: {len(result.flow_series)} streams")
    print(f"   • Pressure Series: {len(result.pressure_series)} streams")
    print(f"   • Valve Events: {len(result.valve_events)} events")
    
    for event in result.valve_events:
        print(f"     - {event.valve_id}: {event.state.value} at {event.time_min:.1f} min "
              f"for {event.duration_min:.1f} min")
    
    print(f"\n✅ ASTM D2163 LPG Analysis simulation completed successfully!")
    return result


async def demo_fast_alkanes_analysis():
    """
    Demonstrate fast GC analysis of C1-C6 alkanes
    """
    
    print("\n" + "="*80)
    print("🚀 FAST GC ALKANES ANALYSIS")
    print("C1-C6 Alkanes with DB-1 Column")
    print("="*80)
    
    # Initialize simulation engine
    engine = GCSimulationEngine()
    
    # Build fast GC method
    method = SandboxMethodParameters(
        inlets=[
            SandboxInlet(
                inlet_id="INL1",
                inlet_type=InletType.splitless,
                temperature_c=280.0,
                split_ratio=1.0,
                total_flow_ml_min=30.0,
                carrier_gas="hydrogen",
                gas_saver=False
            )
        ],
        columns=[
            SandboxColumn(
                column_id="COL1_DB1",
                length_m=30.0,
                inner_diameter_mm=0.25,
                film_thickness_um=0.25,
                stationary_phase="DB-1",
                flow_mode=FlowMode.constant_velocity,
                flow_ml_min=0.0,
                average_velocity_cm_s=40.0
            )
        ],
        detectors=[
            SandboxDetectorFID(
                detector_id="FID1",
                detector_type=DetectorType.FID,
                temperature_c=320.0,
                h2_flow_ml_min=35.0,
                air_flow_ml_min=350.0,
                makeup_flow_ml_min=20.0,
                data_rate_hz=100.0
            )
        ],
        oven_program=[
            SandboxOvenProgramStep(
                step_number=1,
                temperature_c=40.0,
                hold_time_min=1.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=40.0
            ),
            SandboxOvenProgramStep(
                step_number=2,
                temperature_c=40.0,
                hold_time_min=0.0,
                ramp_rate_c_min=25.0,
                final_temperature_c=200.0
            ),
            SandboxOvenProgramStep(
                step_number=3,
                temperature_c=200.0,
                hold_time_min=2.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=200.0
            )
        ]
    )
    
    # Build alkanes sample
    sample = SandboxSampleProfile(
        sample_id="ALKANES_C1_C6_MIX",
        injection_volume_ul=1.0,
        solvent="none",
        matrix="liquid",
        analytes=[
            SandboxAnalyte(name="Methane", concentration_ppm=5000, retention_factor=0.5, 
                          diffusion_coefficient=0.15, response_factor=0.8),
            SandboxAnalyte(name="Ethane", concentration_ppm=8000, retention_factor=0.8, 
                          diffusion_coefficient=0.10, response_factor=0.9),
            SandboxAnalyte(name="Propane", concentration_ppm=12000, retention_factor=1.5, 
                          diffusion_coefficient=0.08, response_factor=1.0),
            SandboxAnalyte(name="n-Butane", concentration_ppm=10000, retention_factor=2.8, 
                          diffusion_coefficient=0.06, response_factor=1.1),
            SandboxAnalyte(name="n-Pentane", concentration_ppm=8000, retention_factor=5.2, 
                          diffusion_coefficient=0.05, response_factor=1.2),
            SandboxAnalyte(name="n-Hexane", concentration_ppm=6000, retention_factor=9.5, 
                          diffusion_coefficient=0.04, response_factor=1.3)
        ]
    )
    
    # Build and run simulation
    request = SandboxRunRequest(
        run_id="FAST_GC_ALKANES_DEMO",
        method_parameters=method,
        sample_profile=sample,
        include_noise=True,
        include_baseline_drift=False,
        simulation_seed=123,
        export_csv=False,
        export_png=False
    )
    
    print(f"\n📊 Fast GC Configuration:")
    print(f"   • Carrier: {method.inlets[0].carrier_gas} at {method.columns[0].average_velocity_cm_s} cm/s")
    print(f"   • Column: {method.columns[0].stationary_phase} ({method.columns[0].length_m}m x {method.columns[0].inner_diameter_mm}mm)")
    print(f"   • Temperature Program: {method.oven_program[0].temperature_c}°C → {method.oven_program[-1].final_temperature_c}°C")
    print(f"   • Data Rate: {method.detectors[0].data_rate_hz} Hz")
    
    result = await engine.simulate_gc_run(request)
    
    print(f"\n📈 Fast GC Results:")
    print(f"   • Simulation Time: {result.simulation_time_ms:.1f} ms")
    print(f"   • Total Runtime: {result.kpis.actual_run_time_min:.2f} min")
    print(f"   • Peak Count: {result.kpis.total_peaks}")
    print(f"   • Average Resolution: {result.kpis.average_resolution:.2f}")
    
    return result


async def demo_sulfur_compounds_scd():
    """
    Demonstrate SCD analysis of sulfur compounds
    """
    
    print("\n" + "="*80)
    print("🔥 SULFUR COMPOUNDS ANALYSIS")
    print("SCD Detection with DB-5 Column")
    print("="*80)
    
    # Initialize simulation engine
    engine = GCSimulationEngine()
    
    # Build SCD method
    method = SandboxMethodParameters(
        inlets=[
            SandboxInlet(
                inlet_id="INL1",
                inlet_type=InletType.split,
                temperature_c=250.0,
                split_ratio=5.0,
                total_flow_ml_min=50.0,
                carrier_gas="helium",
                gas_saver=True,
                gas_saver_flow_ml_min=20.0,
                gas_saver_delay_min=3.0,
                pulse_pressure_kpa=150.0,
                pulse_duration_min=1.0
            )
        ],
        columns=[
            SandboxColumn(
                column_id="COL1_DB5",
                length_m=30.0,
                inner_diameter_mm=0.32,
                film_thickness_um=0.5,
                stationary_phase="DB-5",
                flow_mode=FlowMode.constant_flow,
                flow_ml_min=2.0
            )
        ],
        detectors=[
            SandboxDetectorSCD(
                detector_id="SCD1",
                detector_type=DetectorType.SCD,
                temperature_c=800.0,
                air_flow_ml_min=150.0,
                makeup_flow_ml_min=10.0,
                data_rate_hz=20.0,
                attenuation=1,
                offset=-10
            )
        ],
        oven_program=[
            SandboxOvenProgramStep(
                step_number=1,
                temperature_c=50.0,
                hold_time_min=2.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=50.0
            ),
            SandboxOvenProgramStep(
                step_number=2,
                temperature_c=50.0,
                hold_time_min=0.0,
                ramp_rate_c_min=5.0,
                final_temperature_c=180.0
            ),
            SandboxOvenProgramStep(
                step_number=3,
                temperature_c=180.0,
                hold_time_min=0.0,
                ramp_rate_c_min=15.0,
                final_temperature_c=300.0
            ),
            SandboxOvenProgramStep(
                step_number=4,
                temperature_c=300.0,
                hold_time_min=10.0,
                ramp_rate_c_min=0.0,
                final_temperature_c=300.0
            )
        ]
    )
    
    # Build sulfur compounds sample
    sample = SandboxSampleProfile(
        sample_id="SULFUR_COMPOUNDS_MIX",
        injection_volume_ul=1.0,
        solvent="dichloromethane",
        matrix="liquid",
        analytes=[
            SandboxAnalyte(name="Hydrogen Sulfide", concentration_ppm=50, retention_factor=0.9,
                          diffusion_coefficient=0.12, response_factor=2.5),
            SandboxAnalyte(name="Carbonyl Sulfide", concentration_ppm=25, retention_factor=1.2,
                          diffusion_coefficient=0.10, response_factor=2.2),
            SandboxAnalyte(name="Methyl Mercaptan", concentration_ppm=75, retention_factor=1.8,
                          diffusion_coefficient=0.08, response_factor=3.0),
            SandboxAnalyte(name="Ethyl Mercaptan", concentration_ppm=60, retention_factor=3.2,
                          diffusion_coefficient=0.06, response_factor=3.2),
            SandboxAnalyte(name="Dimethyl Sulfide", concentration_ppm=40, retention_factor=4.5,
                          diffusion_coefficient=0.05, response_factor=2.8),
            SandboxAnalyte(name="Thiophene", concentration_ppm=80, retention_factor=8.5,
                          diffusion_coefficient=0.04, response_factor=4.0)
        ]
    )
    
    # Build and run simulation
    request = SandboxRunRequest(
        run_id="SCD_SULFUR_DEMO",
        method_parameters=method,
        sample_profile=sample,
        include_noise=True,
        include_baseline_drift=True,
        simulation_seed=456,
        export_csv=False,
        export_png=False
    )
    
    print(f"\n📊 SCD Method Configuration:")
    print(f"   • Detector Temperature: {method.detectors[0].temperature_c}°C")
    print(f"   • Air Flow: {method.detectors[0].air_flow_ml_min} mL/min")
    print(f"   • Column: {method.columns[0].stationary_phase}")
    print(f"   • Temperature Program: 4-step with ramps")
    
    result = await engine.simulate_gc_run(request)
    
    print(f"\n📈 SCD Analysis Results:")
    print(f"   • Simulation Time: {result.simulation_time_ms:.1f} ms")
    print(f"   • Total Runtime: {result.kpis.actual_run_time_min:.2f} min")
    print(f"   • Peak Count: {result.kpis.total_peaks}")
    print(f"   • Selectivity for Sulfur: Enhanced response factors applied")
    
    return result


async def main():
    """
    Main demonstration function
    """
    
    print("🧬 IntelliLab GC Instrument Sandbox - Comprehensive Demonstration")
    print("Advanced GC simulation with realistic physics modeling")
    print("No placeholders - fully functional simulation engine\n")
    
    try:
        # Demo 1: ASTM D2163 LPG Analysis
        result1 = await demo_astm_d2163_lpg_analysis()
        
        # Demo 2: Fast GC Alkanes  
        result2 = await demo_fast_alkanes_analysis()
        
        # Demo 3: SCD Sulfur Analysis
        result3 = await demo_sulfur_compounds_scd()
        
        print("\n" + "="*80)
        print("📊 DEMONSTRATION SUMMARY")
        print("="*80)
        
        print(f"\n✅ All three GC simulation scenarios completed successfully!")
        print(f"   • ASTM D2163 LPG Analysis: {result1.kpis.total_peaks} peaks in {result1.kpis.actual_run_time_min:.1f} min")
        print(f"   • Fast GC Alkanes C1-C6: {result2.kpis.total_peaks} peaks in {result2.kpis.actual_run_time_min:.1f} min")
        print(f"   • SCD Sulfur Compounds: {result3.kpis.total_peaks} peaks in {result3.kpis.actual_run_time_min:.1f} min")
        
        total_sim_time = result1.simulation_time_ms + result2.simulation_time_ms + result3.simulation_time_ms
        print(f"\n🚀 Total simulation time: {total_sim_time:.1f} ms")
        print(f"   Average simulation speed: {total_sim_time/3:.1f} ms per method")
        
        print(f"\n🎯 Key Features Demonstrated:")
        print(f"   ✓ Multi-inlet configurations (split, splitless)")
        print(f"   ✓ Various column types (molecular sieve, PLOT, capillary)")
        print(f"   ✓ Multiple detector types (FID, SCD)")
        print(f"   ✓ Complex oven programming (isothermal, multi-ramp)")
        print(f"   ✓ Valve timing and backflush operations")
        print(f"   ✓ Realistic peak shapes with EMG modeling")
        print(f"   ✓ Comprehensive KPI calculations")
        print(f"   ✓ Method profile time series data")
        print(f"   ✓ Noise and baseline drift simulation")
        
        print(f"\n🏆 GC Instrument Sandbox is fully operational!")
        print(f"Ready for interactive use through the web interface.")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())