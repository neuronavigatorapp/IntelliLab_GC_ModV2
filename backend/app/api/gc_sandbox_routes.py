"""
GC Instrument Sandbox API Routes
FastAPI endpoints for GC simulation and method development sandbox
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Depends
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional, Dict, Any
import asyncio
import json
import csv
import io
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import tempfile
import os
import logging

from backend.app.models.gc_sandbox_schemas import (
    SandboxRunRequest, SandboxRunResult, SandboxMethodParameters,
    SandboxChromatogramSeries, SandboxTimeSeriesData,
    DetectorType
)
from backend.app.services.gc_simulation_engine import GCSimulationEngine

router = APIRouter(prefix="/api/gc-sandbox", tags=["GC Sandbox"])
logger = logging.getLogger(__name__)

# Global simulation engine instance
simulation_engine = GCSimulationEngine()

# In-memory storage for results (in production, use Redis or database)
simulation_results: Dict[str, SandboxRunResult] = {}


@router.post("/simulate", response_model=SandboxRunResult)
async def run_gc_simulation(
    request: SandboxRunRequest,
    background_tasks: BackgroundTasks
):
    """
    Execute GC instrument simulation
    
    - **run_id**: Unique identifier for this simulation run
    - **method_parameters**: Complete GC method configuration
    - **sample_profile**: Sample and analyte characteristics
    - **simulation_seed**: Optional seed for reproducible results
    - **include_noise**: Include realistic detector noise
    - **include_baseline_drift**: Include baseline drift effects
    """
    
    try:
        logger.info(f"Starting GC simulation for run {request.run_id}")
        
        # Validate request
        if not request.method_parameters.inlets:
            raise HTTPException(status_code=400, detail="At least one inlet configuration required")
        if not request.method_parameters.columns:
            raise HTTPException(status_code=400, detail="At least one column configuration required")
        if not request.method_parameters.detectors:
            raise HTTPException(status_code=400, detail="At least one detector configuration required")
        if not request.method_parameters.oven_program:
            raise HTTPException(status_code=400, detail="Oven temperature program required")
        if not request.sample_profile.analytes:
            raise HTTPException(status_code=400, detail="At least one analyte required in sample profile")
        
        # Run simulation
        start_time = datetime.now()
        result = await simulation_engine.simulate_gc_run(request)
        
        # Store result for later retrieval
        simulation_results[request.run_id] = result
        
        # Schedule export files if requested
        if request.export_csv or request.export_png:
            background_tasks.add_task(
                generate_export_files, 
                request.run_id, 
                result, 
                request.export_csv, 
                request.export_png
            )
        
        logger.info(f"Simulation completed in {result.simulation_time_ms:.1f} ms")
        return result
        
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/results/{run_id}", response_model=SandboxRunResult)
async def get_simulation_result(run_id: str):
    """
    Retrieve simulation results by run ID
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    return simulation_results[run_id]


@router.get("/results/{run_id}/chromatogram/{detector_id}")
async def get_chromatogram_data(
    run_id: str, 
    detector_id: str,
    format: str = Query("json", regex="^(json|csv)$")
):
    """
    Get chromatogram data for specific detector
    
    - **format**: Response format (json or csv)
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    result = simulation_results[run_id]
    
    # Find chromatogram for detector
    chromatogram = None
    for chrom in result.chromatograms:
        if chrom.detector_id == detector_id:
            chromatogram = chrom
            break
    
    if not chromatogram:
        raise HTTPException(status_code=404, detail=f"Chromatogram not found for detector {detector_id}")
    
    if format == "csv":
        # Return CSV format
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["time_min", "intensity", "detector_id", "detector_type"])
        
        for time_val, intensity_val in zip(chromatogram.time_min, chromatogram.intensity):
            writer.writerow([time_val, intensity_val, chromatogram.detector_id, chromatogram.detector_type.value])
        
        csv_content = output.getvalue()
        output.close()
        
        return JSONResponse(
            content={"csv_data": csv_content},
            headers={"Content-Type": "application/json"}
        )
    else:
        # Return JSON format
        return chromatogram


@router.get("/results/{run_id}/export/chromatogram.png")
async def export_chromatogram_png(
    run_id: str,
    detector_id: Optional[str] = Query(None, description="Specific detector ID, or all if not specified"),
    width: int = Query(12, ge=6, le=20, description="Figure width in inches"),
    height: int = Query(8, ge=4, le=16, description="Figure height in inches"),
    dpi: int = Query(150, ge=72, le=300, description="Resolution in DPI")
):
    """
    Export chromatogram as PNG image
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    result = simulation_results[run_id]
    
    try:
        # Create matplotlib figure
        fig, ax = plt.subplots(figsize=(width, height))
        
        if detector_id:
            # Plot specific detector
            chromatogram = None
            for chrom in result.chromatograms:
                if chrom.detector_id == detector_id:
                    chromatogram = chrom
                    break
            
            if not chromatogram:
                raise HTTPException(status_code=404, detail=f"Chromatogram not found for detector {detector_id}")
            
            ax.plot(chromatogram.time_min, chromatogram.intensity, 
                   label=f"{chromatogram.detector_id} ({chromatogram.detector_type.value})")
        else:
            # Plot all detectors
            for chrom in result.chromatograms:
                ax.plot(chrom.time_min, chrom.intensity, 
                       label=f"{chrom.detector_id} ({chrom.detector_type.value})")
        
        ax.set_xlabel("Time (min)")
        ax.set_ylabel("Intensity (counts)")
        ax.set_title(f"GC Chromatogram - Run {run_id}")
        ax.grid(True, alpha=0.3)
        ax.legend()
        
        # Add peak annotations if there are KPIs
        if result.kpis and result.kpis.peak_kpis:
            for peak_kpi in result.kpis.peak_kpis:
                ax.axvline(x=peak_kpi.retention_time_min, color='red', linestyle='--', alpha=0.5)
                ax.text(peak_kpi.retention_time_min, ax.get_ylim()[1] * 0.9, 
                       peak_kpi.analyte_name, rotation=90, ha='right', va='top', fontsize=8)
        
        plt.tight_layout()
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        plt.savefig(temp_file.name, dpi=dpi, bbox_inches='tight')
        plt.close()
        
        return FileResponse(
            temp_file.name, 
            media_type="image/png", 
            filename=f"chromatogram_{run_id}_{detector_id or 'all'}.png"
        )
        
    except Exception as e:
        logger.error(f"PNG export failed: {e}")
        raise HTTPException(status_code=500, detail=f"PNG export failed: {str(e)}")


@router.get("/results/{run_id}/export/method_profile.png")
async def export_method_profile_png(
    run_id: str,
    width: int = Query(14, ge=8, le=20, description="Figure width in inches"),
    height: int = Query(10, ge=6, le=16, description="Figure height in inches"),
    dpi: int = Query(150, ge=72, le=300, description="Resolution in DPI")
):
    """
    Export method profile (temperature, flow, pressure vs time) as PNG
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    result = simulation_results[run_id]
    
    try:
        # Create subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(width, height))
        
        # Oven temperature
        oven_series = result.oven_temperature_series
        ax1.plot(oven_series.time_min, oven_series.values, 'r-', linewidth=2)
        ax1.set_ylabel(f"Temperature ({oven_series.units})")
        ax1.set_title("Oven Temperature Program")
        ax1.grid(True, alpha=0.3)
        
        # Flow rates
        for flow_series in result.flow_series:
            if "flow" in flow_series.parameter_name.lower():
                ax2.plot(flow_series.time_min, flow_series.values, 
                        label=flow_series.series_id.replace("_flow", ""))
        ax2.set_ylabel("Flow Rate (mL/min)")
        ax2.set_title("Flow Rates")
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Pressures
        for pressure_series in result.pressure_series:
            if "pressure" in pressure_series.parameter_name.lower():
                ax3.plot(pressure_series.time_min, pressure_series.values,
                        label=pressure_series.series_id.replace("_pressure", ""))
        ax3.set_ylabel("Pressure (kPa)")
        ax3.set_xlabel("Time (min)")
        ax3.set_title("Inlet Pressures")
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Valve states (Gantt chart)
        valve_colors = {'load': 'blue', 'inject': 'red', 'backflush': 'green', 'bypass': 'orange'}
        
        y_pos = 0
        valve_ids = list(set(event.valve_id for event in result.valve_events))
        
        for valve_id in valve_ids:
            valve_events = [e for e in result.valve_events if e.valve_id == valve_id]
            
            for event in valve_events:
                color = valve_colors.get(event.state.value, 'gray')
                ax4.barh(y_pos, event.duration_min, left=event.time_min, 
                        color=color, alpha=0.7, height=0.8)
                
                # Add state label
                ax4.text(event.time_min + event.duration_min/2, y_pos, 
                        event.state.value, ha='center', va='center', fontsize=8)
            
            y_pos += 1
        
        ax4.set_yticks(range(len(valve_ids)))
        ax4.set_yticklabels(valve_ids)
        ax4.set_xlabel("Time (min)")
        ax4.set_title("Valve State Timeline")
        ax4.grid(True, alpha=0.3)
        
        plt.suptitle(f"GC Method Profile - Run {run_id}", fontsize=16)
        plt.tight_layout()
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        plt.savefig(temp_file.name, dpi=dpi, bbox_inches='tight')
        plt.close()
        
        return FileResponse(
            temp_file.name,
            media_type="image/png",
            filename=f"method_profile_{run_id}.png"
        )
        
    except Exception as e:
        logger.error(f"Method profile PNG export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Method profile PNG export failed: {str(e)}")


@router.get("/results/{run_id}/export/kpis.csv")
async def export_kpis_csv(run_id: str):
    """
    Export run KPIs as CSV file
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    result = simulation_results[run_id]
    
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "peak_number", "analyte_name", "retention_time_min", "peak_area", "area_percent",
            "peak_height", "width_at_base_min", "width_at_half_height_min", 
            "tailing_factor", "asymmetry_factor", "theoretical_plates",
            "signal_to_noise_ratio", "resolution_from_previous"
        ])
        
        # Peak data
        for peak_kpi in result.kpis.peak_kpis:
            writer.writerow([
                peak_kpi.peak_number,
                peak_kpi.analyte_name,
                f"{peak_kpi.retention_time_min:.3f}",
                f"{peak_kpi.peak_area:.1f}",
                f"{peak_kpi.area_percent:.2f}",
                f"{peak_kpi.peak_height:.1f}",
                f"{peak_kpi.peak_width_min:.3f}",
                f"{peak_kpi.width_at_half_height_min:.3f}",
                f"{peak_kpi.tailing_factor:.2f}",
                f"{peak_kpi.asymmetry_factor:.2f}",
                peak_kpi.theoretical_plates,
                f"{peak_kpi.signal_to_noise_ratio:.1f}",
                f"{peak_kpi.resolution_from_previous:.2f}" if peak_kpi.resolution_from_previous else ""
            ])
        
        # Summary statistics
        writer.writerow([])  # Empty row
        writer.writerow(["Summary Statistics"])
        writer.writerow(["Total Peaks", result.kpis.total_peaks])
        writer.writerow(["Average Resolution", f"{result.kpis.average_resolution:.2f}"])
        writer.writerow(["Minimum Resolution", f"{result.kpis.min_resolution:.2f}"])
        writer.writerow(["Average Theoretical Plates", f"{result.kpis.average_theoretical_plates:.0f}"])
        writer.writerow(["Average S/N Ratio", f"{result.kpis.average_signal_to_noise:.1f}"])
        writer.writerow(["Baseline Drift (%)", f"{result.kpis.baseline_drift_total_percent:.2f}"])
        writer.writerow(["Actual Run Time (min)", f"{result.kpis.actual_run_time_min:.2f}"])
        
        csv_content = output.getvalue()
        output.close()
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        temp_file.write(csv_content)
        temp_file.close()
        
        return FileResponse(
            temp_file.name,
            media_type="text/csv",
            filename=f"gc_kpis_{run_id}.csv"
        )
        
    except Exception as e:
        logger.error(f"KPIs CSV export failed: {e}")
        raise HTTPException(status_code=500, detail=f"KPIs CSV export failed: {str(e)}")


@router.post("/presets/save")
async def save_method_preset(
    preset_name: str,
    method_parameters: SandboxMethodParameters,
    description: Optional[str] = None
):
    """
    Save method parameters as a reusable preset
    """
    
    try:
        preset_data = {
            "name": preset_name,
            "description": description or "",
            "method_parameters": method_parameters.model_dump(),
            "created_at": datetime.now().isoformat(),
            "version": "1.0"
        }
        
        # In production, save to database
        # For now, save to file
        preset_dir = "presets"
        os.makedirs(preset_dir, exist_ok=True)
        
        preset_file = os.path.join(preset_dir, f"{preset_name}.json")
        with open(preset_file, 'w') as f:
            json.dump(preset_data, f, indent=2, default=str)
        
        return {"message": f"Preset '{preset_name}' saved successfully", "file": preset_file}
        
    except Exception as e:
        logger.error(f"Preset save failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save preset: {str(e)}")


@router.get("/presets/{preset_name}", response_model=SandboxMethodParameters)
async def load_method_preset(preset_name: str):
    """
    Load method parameters from a saved preset
    """
    
    try:
        preset_file = os.path.join("presets", f"{preset_name}.json")
        
        if not os.path.exists(preset_file):
            raise HTTPException(status_code=404, detail=f"Preset '{preset_name}' not found")
        
        with open(preset_file, 'r') as f:
            preset_data = json.load(f)
        
        return SandboxMethodParameters(**preset_data["method_parameters"])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preset load failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load preset: {str(e)}")


@router.get("/presets")
async def list_method_presets():
    """
    List available method presets
    """
    
    try:
        preset_dir = "presets"
        
        if not os.path.exists(preset_dir):
            return {"presets": []}
        
        presets = []
        for filename in os.listdir(preset_dir):
            if filename.endswith('.json'):
                preset_name = filename[:-5]  # Remove .json extension
                
                try:
                    with open(os.path.join(preset_dir, filename), 'r') as f:
                        preset_data = json.load(f)
                    
                    presets.append({
                        "name": preset_name,
                        "description": preset_data.get("description", ""),
                        "created_at": preset_data.get("created_at", ""),
                        "version": preset_data.get("version", "1.0")
                    })
                except:
                    continue  # Skip invalid preset files
        
        return {"presets": sorted(presets, key=lambda x: x["name"])}
        
    except Exception as e:
        logger.error(f"Preset listing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list presets: {str(e)}")


@router.delete("/results/{run_id}")
async def delete_simulation_result(run_id: str):
    """
    Delete simulation result from memory
    """
    
    if run_id not in simulation_results:
        raise HTTPException(status_code=404, detail="Simulation result not found")
    
    del simulation_results[run_id]
    
    return {"message": f"Simulation result {run_id} deleted successfully"}


@router.get("/health")
async def sandbox_health_check():
    """
    Health check endpoint for GC sandbox service
    """
    
    return {
        "status": "healthy",
        "service": "gc-sandbox",
        "timestamp": datetime.now().isoformat(),
        "active_simulations": len(simulation_results),
        "engine_ready": simulation_engine is not None
    }


async def generate_export_files(run_id: str, result: SandboxRunResult, 
                               export_csv: bool, export_png: bool):
    """
    Background task to generate export files
    """
    
    try:
        export_paths = {}
        
        if export_csv:
            # Export chromatogram CSV
            for chrom in result.chromatograms:
                csv_path = f"exports/{run_id}_{chrom.detector_id}_chromatogram.csv"
                os.makedirs(os.path.dirname(csv_path), exist_ok=True)
                
                with open(csv_path, 'w', newline='') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(["time_min", "intensity"])
                    for time_val, intensity_val in zip(chrom.time_min, chrom.intensity):
                        writer.writerow([time_val, intensity_val])
                
                export_paths[f"{chrom.detector_id}_csv"] = csv_path
        
        if export_png:
            # Export chromatogram PNG (simplified version)
            png_path = f"exports/{run_id}_chromatogram.png"
            os.makedirs(os.path.dirname(png_path), exist_ok=True)
            
            # Simple matplotlib export
            fig, ax = plt.subplots(figsize=(10, 6))
            for chrom in result.chromatograms:
                ax.plot(chrom.time_min, chrom.intensity, label=chrom.detector_id)
            
            ax.set_xlabel("Time (min)")
            ax.set_ylabel("Intensity")
            ax.legend()
            ax.grid(True)
            
            plt.savefig(png_path, dpi=150, bbox_inches='tight')
            plt.close()
            
            export_paths["chromatogram_png"] = png_path
        
        # Update result with export paths
        result.exported_files.update(export_paths)
        
        logger.info(f"Export files generated for run {run_id}: {list(export_paths.keys())}")
        
    except Exception as e:
        logger.error(f"Export file generation failed for run {run_id}: {e}")