#!/usr/bin/env python3
"""
Run history and reporting service for filtering, searching, and exporting run data.
"""

import os
import json
import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import csv
import io
import base64

from app.core.database import SessionLocal, SandboxRun, Instrument, Method
from app.models.schemas import Peak


class RunHistoryService:
    """Service for run history management and reporting."""
    
    def __init__(self):
        self.export_formats = ["pdf", "excel", "csv"]
    
    def search_runs(
        self,
        search_query: Optional[str] = None,
        instrument_ids: Optional[List[int]] = None,
        method_ids: Optional[List[int]] = None,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None,
        has_peaks: Optional[bool] = None,
        min_peaks: Optional[int] = None,
        max_peaks: Optional[int] = None,
        sample_name_filter: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search and filter runs with various criteria.
        Returns (runs, total_count).
        """
        with SessionLocal() as db:
            query = db.query(SandboxRun)
            
            # Text search in sample name
            if search_query:
                query = query.filter(SandboxRun.sample_name.contains(search_query))
            
            # Instrument filter
            if instrument_ids:
                query = query.filter(SandboxRun.instrument_id.in_(instrument_ids))
            
            # Method filter
            if method_ids:
                query = query.filter(SandboxRun.method_id.in_(method_ids))
            
            # Date range filter
            if date_from:
                query = query.filter(SandboxRun.created_date >= date_from)
            if date_to:
                query = query.filter(SandboxRun.created_date <= date_to)
            
            # Sample name specific filter
            if sample_name_filter:
                query = query.filter(SandboxRun.sample_name.contains(sample_name_filter))
            
            # Get total count before pagination
            total_count = query.count()
            
            # Apply pagination
            runs = query.order_by(SandboxRun.created_date.desc()).offset(offset).limit(limit).all()
            
            # Convert to detailed format with related data
            result_runs = []
            for run in runs:
                # Get instrument info
                instrument = db.query(Instrument).filter(Instrument.id == run.instrument_id).first()
                method = db.query(Method).filter(Method.id == run.method_id).first()
                
                # Count peaks
                peak_count = len(run.peaks) if run.peaks else 0
                
                # Apply peak filters
                if has_peaks is not None:
                    if has_peaks and peak_count == 0:
                        continue
                    elif not has_peaks and peak_count > 0:
                        continue
                
                if min_peaks is not None and peak_count < min_peaks:
                    continue
                    
                if max_peaks is not None and peak_count > max_peaks:
                    continue
                
                # Calculate run metrics
                max_signal = max(run.signal) if run.signal else 0
                run_time = max(run.time) if run.time else 0
                
                run_data = {
                    "id": run.id,
                    "sample_name": run.sample_name,
                    "instrument_id": run.instrument_id,
                    "instrument_name": instrument.name if instrument else "Unknown",
                    "instrument_model": instrument.model if instrument else "Unknown",
                    "method_id": run.method_id,
                    "method_name": method.name if method else "Unknown",
                    "method_type": method.method_type if method else "Unknown",
                    "peak_count": peak_count,
                    "max_signal": max_signal,
                    "run_time": run_time,
                    "created_date": run.created_date.isoformat(),
                    "fault_params": run.fault_params,
                    "metrics": run.metrics,
                    "compound_ids": run.compound_ids
                }
                result_runs.append(run_data)
            
            return result_runs, total_count
    
    def get_run_summary(self, run_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed summary for a specific run."""
        with SessionLocal() as db:
            run = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
            if not run:
                return None
            
            # Get related data
            instrument = db.query(Instrument).filter(Instrument.id == run.instrument_id).first()
            method = db.query(Method).filter(Method.id == run.method_id).first()
            
            # Analyze peaks
            peaks_analysis = self._analyze_peaks(run.peaks) if run.peaks else {}
            
            # Analyze signal
            signal_analysis = self._analyze_signal(run.time, run.signal) if run.signal else {}
            
            # Get diagnostics if available
            diagnostics = self._get_run_diagnostics(run_id, db)
            
            summary = {
                "run_info": {
                    "id": run.id,
                    "sample_name": run.sample_name,
                    "created_date": run.created_date.isoformat(),
                    "run_time": max(run.time) if run.time else 0
                },
                "instrument_info": {
                    "id": instrument.id if instrument else None,
                    "name": instrument.name if instrument else "Unknown",
                    "model": instrument.model if instrument else "Unknown",
                    "serial_number": instrument.serial_number if instrument else "Unknown"
                },
                "method_info": {
                    "id": method.id if method else None,
                    "name": method.name if method else "Unknown",
                    "type": method.method_type if method else "Unknown",
                    "parameters": method.parameters if method else {}
                },
                "peaks_analysis": peaks_analysis,
                "signal_analysis": signal_analysis,
                "fault_params": run.fault_params or {},
                "metrics": run.metrics or {},
                "diagnostics": diagnostics,
                "compound_ids": run.compound_ids or []
            }
            
            return summary
    
    def export_runs(
        self,
        run_ids: List[int],
        export_format: str = "excel",
        include_chromatograms: bool = False
    ) -> Dict[str, Any]:
        """
        Export selected runs to specified format.
        Returns dict with file content and metadata.
        """
        if export_format not in self.export_formats:
            raise ValueError(f"Unsupported export format: {export_format}")
        
        with SessionLocal() as db:
            runs = db.query(SandboxRun).filter(SandboxRun.id.in_(run_ids)).all()
            
            if export_format == "csv":
                return self._export_csv(runs)
            elif export_format == "excel":
                return self._export_excel(runs, include_chromatograms)
            elif export_format == "pdf":
                return self._export_pdf(runs, include_chromatograms)
    
    def get_run_statistics(
        self,
        date_from: Optional[datetime.datetime] = None,
        date_to: Optional[datetime.datetime] = None
    ) -> Dict[str, Any]:
        """Get run statistics for a date range."""
        with SessionLocal() as db:
            query = db.query(SandboxRun)
            
            if date_from:
                query = query.filter(SandboxRun.created_date >= date_from)
            if date_to:
                query = query.filter(SandboxRun.created_date <= date_to)
            
            runs = query.all()
            
            if not runs:
                return {
                    "total_runs": 0,
                    "total_peaks": 0,
                    "avg_peaks_per_run": 0,
                    "instruments_used": 0,
                    "methods_used": 0,
                    "date_range": {
                        "from": date_from.isoformat() if date_from else None,
                        "to": date_to.isoformat() if date_to else None
                    }
                }
            
            # Calculate statistics
            total_runs = len(runs)
            total_peaks = sum(len(run.peaks) if run.peaks else 0 for run in runs)
            avg_peaks = total_peaks / total_runs if total_runs > 0 else 0
            
            instruments_used = len(set(run.instrument_id for run in runs if run.instrument_id))
            methods_used = len(set(run.method_id for run in runs if run.method_id))
            
            # Peak distribution
            peak_counts = [len(run.peaks) if run.peaks else 0 for run in runs]
            peak_distribution = {
                "min": min(peak_counts) if peak_counts else 0,
                "max": max(peak_counts) if peak_counts else 0,
                "avg": avg_peaks
            }
            
            # Daily run counts
            daily_counts = {}
            for run in runs:
                date_str = run.created_date.date().isoformat()
                daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
            
            return {
                "total_runs": total_runs,
                "total_peaks": total_peaks,
                "avg_peaks_per_run": round(avg_peaks, 2),
                "instruments_used": instruments_used,
                "methods_used": methods_used,
                "peak_distribution": peak_distribution,
                "daily_run_counts": daily_counts,
                "date_range": {
                    "from": date_from.isoformat() if date_from else None,
                    "to": date_to.isoformat() if date_to else None
                }
            }
    
    def _analyze_peaks(self, peaks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze peaks data for summary."""
        if not peaks_data:
            return {"count": 0}
        
        peak_count = len(peaks_data)
        retention_times = [p.get("rt", 0) for p in peaks_data]
        peak_areas = [p.get("area", 0) for p in peaks_data]
        peak_heights = [p.get("height", 0) for p in peaks_data]
        
        return {
            "count": peak_count,
            "retention_time_range": {
                "min": min(retention_times) if retention_times else 0,
                "max": max(retention_times) if retention_times else 0
            },
            "total_area": sum(peak_areas),
            "avg_area": sum(peak_areas) / len(peak_areas) if peak_areas else 0,
            "max_height": max(peak_heights) if peak_heights else 0,
            "identified_peaks": len([p for p in peaks_data if p.get("name")])
        }
    
    def _analyze_signal(self, time_data: List[float], signal_data: List[float]) -> Dict[str, Any]:
        """Analyze signal data for summary."""
        if not signal_data:
            return {}
        
        import numpy as np
        signal_array = np.array(signal_data)
        
        return {
            "data_points": len(signal_data),
            "max_signal": float(np.max(signal_array)),
            "min_signal": float(np.min(signal_array)),
            "mean_signal": float(np.mean(signal_array)),
            "std_signal": float(np.std(signal_array)),
            "signal_range": float(np.max(signal_array) - np.min(signal_array)),
            "run_time": max(time_data) if time_data else 0
        }
    
    def _get_run_diagnostics(self, run_id: int, db) -> List[Dict[str, Any]]:
        """Get AI diagnostics for a run."""
        try:
            from app.core.database import ChromatogramDiagnostic
            diagnostics = db.query(ChromatogramDiagnostic).filter(
                ChromatogramDiagnostic.run_id == run_id
            ).all()
            
            return [
                {
                    "id": d.id,
                    "fault_causes": d.fault_causes,
                    "confidence_score": d.confidence_score,
                    "created_date": d.created_date.isoformat(),
                    "method_adjustments_count": len(d.method_adjustments) if d.method_adjustments else 0
                }
                for d in diagnostics
            ]
        except ImportError:
            return []
    
    def _export_csv(self, runs: List) -> Dict[str, Any]:
        """Export runs to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Run ID", "Sample Name", "Instrument ID", "Method ID",
            "Peak Count", "Max Signal", "Run Time", "Created Date"
        ])
        
        # Write data
        for run in runs:
            peak_count = len(run.peaks) if run.peaks else 0
            max_signal = max(run.signal) if run.signal else 0
            run_time = max(run.time) if run.time else 0
            
            writer.writerow([
                run.id,
                run.sample_name,
                run.instrument_id,
                run.method_id,
                peak_count,
                max_signal,
                run_time,
                run.created_date.isoformat()
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        return {
            "content": base64.b64encode(csv_content.encode()).decode(),
            "filename": f"runs_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "mime_type": "text/csv",
            "size": len(csv_content)
        }
    
    def _export_excel(self, runs: List, include_chromatograms: bool = False) -> Dict[str, Any]:
        """Export runs to Excel format."""
        try:
            import pandas as pd
            from io import BytesIO
            
            # Create runs data
            runs_data = []
            for run in runs:
                peak_count = len(run.peaks) if run.peaks else 0
                max_signal = max(run.signal) if run.signal else 0
                run_time = max(run.time) if run.time else 0
                
                runs_data.append({
                    "Run ID": run.id,
                    "Sample Name": run.sample_name,
                    "Instrument ID": run.instrument_id,
                    "Method ID": run.method_id,
                    "Peak Count": peak_count,
                    "Max Signal": max_signal,
                    "Run Time": run_time,
                    "Created Date": run.created_date.isoformat()
                })
            
            # Create Excel file in memory
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Runs summary sheet
                df_runs = pd.DataFrame(runs_data)
                df_runs.to_excel(writer, sheet_name='Runs Summary', index=False)
                
                # Individual run details
                if include_chromatograms:
                    for i, run in enumerate(runs[:10]):  # Limit to 10 runs to avoid large files
                        if run.time and run.signal:
                            chrom_data = pd.DataFrame({
                                'Time': run.time,
                                'Signal': run.signal
                            })
                            sheet_name = f'Run_{run.id}_Chromatogram'[:31]  # Excel sheet name limit
                            chrom_data.to_excel(writer, sheet_name=sheet_name, index=False)
            
            output.seek(0)
            excel_content = output.read()
            output.close()
            
            return {
                "content": base64.b64encode(excel_content).decode(),
                "filename": f"runs_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "size": len(excel_content)
            }
            
        except ImportError:
            # Fallback to CSV if pandas/openpyxl not available
            return self._export_csv(runs)
    
    def _export_pdf(self, runs: List, include_chromatograms: bool = False) -> Dict[str, Any]:
        """Export runs to PDF format."""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors
            from io import BytesIO
            
            output = BytesIO()
            doc = SimpleDocTemplate(output, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title = Paragraph("IntelliLab GC - Run History Report", styles['Title'])
            story.append(title)
            story.append(Spacer(1, 20))
            
            # Summary table
            table_data = [["Run ID", "Sample Name", "Instrument", "Method", "Peaks", "Created Date"]]
            
            for run in runs:
                peak_count = len(run.peaks) if run.peaks else 0
                table_data.append([
                    str(run.id),
                    run.sample_name,
                    str(run.instrument_id),
                    str(run.method_id),
                    str(peak_count),
                    run.created_date.strftime('%Y-%m-%d %H:%M')
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
            doc.build(story)
            
            output.seek(0)
            pdf_content = output.read()
            output.close()
            
            return {
                "content": base64.b64encode(pdf_content).decode(),
                "filename": f"runs_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                "mime_type": "application/pdf",
                "size": len(pdf_content)
            }
            
        except ImportError:
            # Fallback to CSV if reportlab not available
            return self._export_csv(runs)


# Service instance
run_history_service = RunHistoryService()
