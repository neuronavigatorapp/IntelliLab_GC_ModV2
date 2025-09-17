#!/usr/bin/env python3
"""
Simple GC Sandbox Test
Quick verification of the simulation engine
"""

import asyncio
import sys
import os

# Add backend path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_gc_simulation():
    try:
        print("🧪 Testing GC Instrument Sandbox...")
        
        # Import modules
        from app.models.gc_sandbox_schemas import (
            SandboxRunRequest, SandboxMethodParameters, SandboxSampleProfile,
            SandboxInlet, SandboxColumn, SandboxDetectorFID, 
            SandboxOvenProgramStep, SandboxAnalyte,
            InletMode, CarrierGasType, FlowMode, DetectorType
        )
        from app.services.gc_simulation_engine import GCSimulationEngine
        
        print("   ✅ Imports successful")
        
        # Create simulation engine
        engine = GCSimulationEngine()
        print("   ✅ Engine created")
        
        # Build simple method - using correct field names and enum values
        method = SandboxMethodParameters(
            method_name="TEST_METHOD",  # Add required field
            expected_run_time_min=10.0,  # Add required field
            inlets=[
                SandboxInlet(
                    inlet_id="INL1",
                    mode=InletMode.SPLIT,  # Use proper enum
                    temperature_celsius=250.0,
                    inlet_pressure_kpa=100.0,
                    split_ratio=10.0,
                    total_flow_ml_min=50.0,
                    carrier_gas=CarrierGasType.HELIUM,  # Use proper enum
                    gas_saver_enabled=False  # Correct field name
                )
            ],
            columns=[
                SandboxColumn(
                    column_id="COL1",
                    length_meters=30.0,  # Correct field name
                    inner_diameter_mm=0.25,
                    film_thickness_um=0.25,
                    stationary_phase="DB-1",
                    max_temperature_celsius=350.0,  # Add required field
                    flow_mode=FlowMode.CONSTANT_FLOW,
                    target_flow_ml_min=1.0  # Correct field name
                )
            ],
            detectors=[
                SandboxDetectorFID(
                    detector_id="FID1",
                    detector_type=DetectorType.FID,
                    temperature_celsius=300.0,  # Correct field name
                    hydrogen_flow_ml_min=30.0,  # Correct field name
                    air_flow_ml_min=300.0,
                    makeup_flow_ml_min=25.0,
                    data_rate_hz=50.0
                )
            ],
            oven_program=[
                SandboxOvenProgramStep(
                    step_number=1,
                    target_temperature_celsius=50.0,  # Correct field name
                    hold_time_minutes=2.0,  # Correct field name  
                    ramp_rate_celsius_min=None,  # First step can't have ramp
                )
            ],
            valve_program=[]
        )
        
        print("   ✅ Method parameters created")
        
        # Build simple sample
        sample = SandboxSampleProfile(
            sample_id="TEST_SAMPLE",
            injection_volume_ul=1.0,
            solvent="none",
            matrix="gas",
            analytes=[
                SandboxAnalyte(
                    name="n-Hexane",
                    concentration_ppm=1000.0,
                    retention_factor=2.0,
                    diffusion_coefficient=0.05,
                    response_factor=1.0
                )
            ]
        )
        
        print("   ✅ Sample profile created")
        
        # Build simulation request
        request = SandboxRunRequest(
            run_id="SIMPLE_TEST",
            method_parameters=method,
            sample_profile=sample,
            include_noise=True,
            include_baseline_drift=True,
            simulation_seed=42
        )
        
        print("   ✅ Simulation request created")
        
        # Run simulation
        print("   🔬 Running simulation...")
        result = await engine.simulate_gc_run(request)
        
        print(f"   ✅ Simulation completed in {result.simulation_time_ms:.1f} ms")
        
        # Display results
        print(f"\n📊 Results:")
        print(f"   • Run ID: {result.run_id}")
        print(f"   • Chromatograms: {len(result.chromatograms)}")
        
        for chrom in result.chromatograms:
            print(f"     - {chrom.detector_id}: {len(chrom.time_min)} data points")
            if chrom.time_min and chrom.intensity:
                print(f"       Time: {min(chrom.time_min):.2f} - {max(chrom.time_min):.2f} min")
                print(f"       Intensity: {min(chrom.intensity):.0f} - {max(chrom.intensity):.0f} counts")
        
        if result.kpis:
            print(f"\n📈 KPIs:")
            print(f"   • Total Peaks: {result.kpis.total_peaks}")
            print(f"   • Run Time: {result.kpis.actual_run_time_min:.2f} min")
            if result.kpis.average_resolution is not None:
                print(f"   • Avg Resolution: {result.kpis.average_resolution:.2f}")
        
        print(f"\n✅ GC Instrument Sandbox test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_gc_simulation())
    sys.exit(0 if success else 1)