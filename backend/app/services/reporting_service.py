#!/usr/bin/env python3
"""
Enhanced reporting service for calibration exports with PDF/CSV/XLSX support
"""

import csv
import json
import io
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

# Optional imports for advanced features
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False

from app.models.schemas import CalibrationModel
from app.services.quant_service import quant_service
from app.services.sequence_service import sequence_service
from app.services.qc_service import qc_service
from app.services.audit_service import audit_service

logger = logging.getLogger(__name__)


class ReportingService:
    """Service for generating calibration reports in various formats"""
    
    def __init__(self):
        self.reports_dir = "reports"
    
    def generate_calibration_report(self, calibration_id: str, format: str = 'csv') -> Dict[str, Any]:
        """
        Generate a calibration report in specified format
        
        Args:
            calibration_id: ID of the calibration to export
            format: Report format ('csv', 'pdf', 'xlsx', 'json')
            
        Returns:
            Dictionary with file content and metadata
        """
        try:
            # Get calibration
            if calibration_id not in quant_service.calibrations:
                raise ValueError("Calibration not found")
            
            calibration = quant_service.calibrations[calibration_id]
            
            if format.lower() == 'csv':
                return self._generate_csv_report(calibration)
            elif format.lower() == 'pdf':
                return self._generate_pdf_report(calibration)
            elif format.lower() == 'xlsx':
                return self._generate_xlsx_report(calibration)
            elif format.lower() == 'json':
                return self._generate_json_report(calibration)
            else:
                raise ValueError(f"Unsupported format: {format}")
                
        except Exception as e:
            logger.error(f"Failed to generate calibration report: {str(e)}")
            raise

    def generate_sequence_report(self, sequence_id: str, format: str = 'csv') -> Dict[str, Any]:
        try:
            sequence_run = sequence_service.get_sequence_run(sequence_id)
            if not sequence_run:
                raise ValueError("Sequence run not found")
            if format.lower() == 'csv':
                # Simple CSV with items and quant summary
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(['Sequence ID', sequence_run.id])
                writer.writerow(['Created At', getattr(sequence_run, 'created_at', '')])
                writer.writerow([])
                writer.writerow(['Order', 'Type', 'Sample Name', 'Method ID', 'Expected Level'])
                for item in sequence_run.items:
                    writer.writerow([item.order, item.type, item.sample_name, item.method_id, item.expected_level or ''])
                writer.writerow([])
                writer.writerow(['Quantitation Results'])
                writer.writerow(['Sample', 'Target', 'RT', 'Area', 'Concentration', 'Unit', 'Flags'])
                for q in sequence_run.quant:
                    for r in q.results:
                        writer.writerow([q.sample_name, r.get('targetName',''), r.get('rt',''), r.get('area',''), r.get('concentration',''), r.get('unit',''), ", ".join(r.get('flags', []))])
                content = output.getvalue()
                output.close()
                return {
                    'content': base64.b64encode(content.encode()).decode(),
                    'filename': f"sequence_{sequence_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    'mime_type': 'text/csv',
                    'size': len(content)
                }
            elif format.lower() in ('json',):
                data = json.dumps({'sequence_run': sequence_run.model_dump()}, indent=2, default=str)
                return {
                    'content': base64.b64encode(data.encode()).decode(),
                    'filename': f"sequence_{sequence_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    'mime_type': 'application/json',
                    'size': len(data)
                }
            else:
                # Fallback to CSV if advanced formats not available
                return self.generate_sequence_report(sequence_id, 'csv')
        except Exception as e:
            logger.error(f"Failed to generate sequence report: {str(e)}")
            raise

    def generate_qc_report(self, limit: int = 100, format: str = 'csv') -> Dict[str, Any]:
        try:
            records = qc_service.get_qc_records(limit)
            if format.lower() == 'csv':
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(['QC Record ID', 'Run ID', 'Timestamp', 'Analyte', 'Value', 'Unit', 'Z', 'Status', 'RuleHits'])
                for rec in records:
                    for res in rec.results:
                        rule_names = ','.join({hit.rule for hit in rec.ruleHits})
                        writer.writerow([rec.id, rec.runId, rec.timestamp.isoformat(), res.analyte, res.value, res.unit, res.zscore, res.status, rule_names])
                content = output.getvalue()
                output.close()
                return {
                    'content': base64.b64encode(content.encode()).decode(),
                    'filename': f"qc_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    'mime_type': 'text/csv',
                    'size': len(content)
                }
            else:
                # JSON fallback
                data = json.dumps([rec.model_dump() for rec in records], indent=2, default=str)
                return {
                    'content': base64.b64encode(data.encode()).decode(),
                    'filename': f"qc_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    'mime_type': 'application/json',
                    'size': len(data)
                }
        except Exception as e:
            logger.error(f"Failed to generate QC report: {str(e)}")
            raise

    def generate_audit_report(self, format: str = 'csv') -> Dict[str, Any]:
        try:
            # Re-use export from audit service
            if format.lower() == 'csv':
                data = audit_service.export_audit_log(format='csv')
                return {
                    'content': base64.b64encode(data.encode()).decode(),
                    'filename': f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    'mime_type': 'text/csv',
                    'size': len(data)
                }
            else:
                data = audit_service.export_audit_log(format='json')
                return {
                    'content': base64.b64encode(data.encode()).decode(),
                    'filename': f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    'mime_type': 'application/json',
                    'size': len(data)
                }
        except Exception as e:
            logger.error(f"Failed to generate audit report: {str(e)}")
            raise
    
    def _generate_csv_report(self, calibration: CalibrationModel) -> Dict[str, Any]:
        """Generate CSV calibration report"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Metadata section
        writer.writerow(['Calibration Report'])
        writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Calibration ID:', calibration.id])
        writer.writerow(['Version ID:', calibration.version_id])
        writer.writerow(['Target:', calibration.target_name])
        writer.writerow(['Method ID:', calibration.method_id])
        writer.writerow(['Instrument ID:', calibration.instrument_id or 'Any'])
        writer.writerow(['Model Type:', calibration.model_type])
        writer.writerow(['Mode:', calibration.mode.value])
        writer.writerow(['Outlier Policy:', calibration.outlier_policy.value])
        writer.writerow(['Active:', 'Yes' if calibration.active else 'No'])
        writer.writerow([])
        
        # Internal Standard info (if applicable)
        if calibration.internal_standard:
            writer.writerow(['Internal Standard Configuration:'])
            writer.writerow(['IS Peak Name:', calibration.internal_standard.peak_name])
            writer.writerow(['IS Amount:', calibration.internal_standard.amount])
            writer.writerow(['IS Unit:', calibration.internal_standard.unit])
            writer.writerow([])
        
        # Fit Results
        writer.writerow(['Fit Results:'])
        writer.writerow(['Slope:', calibration.slope])
        writer.writerow(['Intercept:', calibration.intercept])
        writer.writerow(['R²:', calibration.r2])
        writer.writerow(['LOD:', calibration.lod])
        writer.writerow(['LOQ:', calibration.loq])
        writer.writerow(['LOD Method:', calibration.lod_method])
        writer.writerow([])
        
        # Levels data
        writer.writerow(['Calibration Levels:'])
        if calibration.mode.value == 'internal_standard':
            writer.writerow(['Level', 'Amount', 'Unit', 'Peak Area', 'IS Area', 'Response Factor', 'Included', 'Outlier Reason'])
        else:
            writer.writerow(['Level', 'Amount', 'Unit', 'Peak Area', 'Included', 'Outlier Reason'])
        
        for i, level in enumerate(calibration.levels):
            if calibration.mode.value == 'internal_standard':
                rf = level.area / level.is_area if level.area and level.is_area and level.is_area > 0 else 0
                writer.writerow([
                    i + 1, level.amount, level.unit, level.area or 0, 
                    level.is_area or 0, rf, 
                    'Yes' if level.included else 'No', 
                    level.outlier_reason or ''
                ])
            else:
                writer.writerow([
                    i + 1, level.amount, level.unit, level.area or 0,
                    'Yes' if level.included else 'No', 
                    level.outlier_reason or ''
                ])
        
        # Residuals
        if calibration.residuals:
            writer.writerow([])
            writer.writerow(['Residuals:'])
            for i, residual in enumerate(calibration.residuals):
                writer.writerow([f'Level {i+1}', residual])
        
        # Excluded points
        if calibration.excluded_points:
            writer.writerow([])
            writer.writerow(['Excluded Points:', ', '.join(map(str, calibration.excluded_points))])
        
        # Notes
        if calibration.notes:
            writer.writerow([])
            writer.writerow(['Notes:', calibration.notes])
        
        content = output.getvalue()
        output.close()
        
        return {
            "content": base64.b64encode(content.encode()).decode(),
            "filename": f"calibration_{calibration.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "mime_type": "text/csv",
            "size": len(content)
        }
    
    def _generate_pdf_report(self, calibration: CalibrationModel) -> Dict[str, Any]:
        """Generate PDF calibration report"""
        if not REPORTLAB_AVAILABLE:
            logger.warning("ReportLab not available, falling back to CSV")
            return self._generate_csv_report(calibration)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
        )
        story.append(Paragraph("Calibration Report", title_style))
        
        # Metadata table
        metadata_data = [
            ['Calibration ID:', calibration.id],
            ['Version ID:', calibration.version_id],
            ['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['Target Compound:', calibration.target_name],
            ['Method ID:', str(calibration.method_id)],
            ['Instrument ID:', str(calibration.instrument_id or 'Any')],
            ['Model Type:', calibration.model_type],
            ['Calibration Mode:', calibration.mode.value],
            ['Outlier Policy:', calibration.outlier_policy.value],
            ['Status:', 'Active' if calibration.active else 'Inactive']
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(metadata_table)
        story.append(Spacer(1, 20))
        
        # Internal Standard info
        if calibration.internal_standard:
            story.append(Paragraph("Internal Standard Configuration", styles['Heading2']))
            is_data = [
                ['Peak Name:', calibration.internal_standard.peak_name],
                ['Amount:', f"{calibration.internal_standard.amount} {calibration.internal_standard.unit}"]
            ]
            is_table = Table(is_data, colWidths=[2*inch, 3*inch])
            is_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
            ]))
            story.append(is_table)
            story.append(Spacer(1, 20))
        
        # Fit results
        story.append(Paragraph("Calibration Fit Results", styles['Heading2']))
        fit_data = [
            ['Parameter', 'Value'],
            ['Slope', f"{calibration.slope:.6e}" if calibration.slope else 'N/A'],
            ['Intercept', f"{calibration.intercept:.6e}" if calibration.intercept else 'N/A'],
            ['R²', f"{calibration.r2:.6f}" if calibration.r2 else 'N/A'],
            ['LOD', f"{calibration.lod:.6e}" if calibration.lod else 'N/A'],
            ['LOQ', f"{calibration.loq:.6e}" if calibration.loq else 'N/A'],
            ['LOD Method', calibration.lod_method or 'N/A']
        ]
        
        fit_table = Table(fit_data, colWidths=[2*inch, 3*inch])
        fit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(fit_table)
        story.append(Spacer(1, 20))
        
        # Calibration levels
        story.append(Paragraph("Calibration Levels", styles['Heading2']))
        
        if calibration.mode.value == 'internal_standard':
            levels_data = [['Level', 'Amount', 'Unit', 'Peak Area', 'IS Area', 'RF', 'Included']]
            for i, level in enumerate(calibration.levels):
                rf = level.area / level.is_area if level.area and level.is_area and level.is_area > 0 else 0
                levels_data.append([
                    str(i + 1),
                    f"{level.amount:.3f}",
                    level.unit,
                    f"{level.area:.0f}" if level.area else 'N/A',
                    f"{level.is_area:.0f}" if level.is_area else 'N/A',
                    f"{rf:.6f}",
                    'Yes' if level.included else 'No'
                ])
        else:
            levels_data = [['Level', 'Amount', 'Unit', 'Peak Area', 'Included']]
            for i, level in enumerate(calibration.levels):
                levels_data.append([
                    str(i + 1),
                    f"{level.amount:.3f}",
                    level.unit,
                    f"{level.area:.0f}" if level.area else 'N/A',
                    'Yes' if level.included else 'No'
                ])
        
        levels_table = Table(levels_data)
        levels_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(levels_table)
        
        # Add residuals plot if matplotlib is available
        if MATPLOTLIB_AVAILABLE and calibration.residuals:
            plot_buffer = self._create_residuals_plot(calibration)
            if plot_buffer:
                story.append(Spacer(1, 20))
                story.append(Paragraph("Residuals Plot", styles['Heading2']))
                img = Image(plot_buffer, width=5*inch, height=3*inch)
                story.append(img)
        
        # Notes
        if calibration.notes:
            story.append(Spacer(1, 20))
            story.append(Paragraph("Notes", styles['Heading2']))
            story.append(Paragraph(calibration.notes, styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Report generated by IntelliLab GC on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, styles['Normal']))
        
        doc.build(story)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return {
            "content": base64.b64encode(pdf_content).decode(),
            "filename": f"calibration_{calibration.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            "mime_type": "application/pdf",
            "size": len(pdf_content)
        }
    
    def _generate_xlsx_report(self, calibration: CalibrationModel) -> Dict[str, Any]:
        """Generate Excel calibration report"""
        if not PANDAS_AVAILABLE:
            logger.warning("Pandas not available, falling back to CSV")
            return self._generate_csv_report(calibration)
        
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Metadata sheet
            metadata_dict = {
                'Property': [
                    'Calibration ID', 'Version ID', 'Generated', 'Target Compound',
                    'Method ID', 'Instrument ID', 'Model Type', 'Calibration Mode',
                    'Outlier Policy', 'Status', 'Slope', 'Intercept', 'R²',
                    'LOD', 'LOQ', 'LOD Method'
                ],
                'Value': [
                    calibration.id, calibration.version_id,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    calibration.target_name, calibration.method_id,
                    calibration.instrument_id or 'Any',
                    calibration.model_type, calibration.mode.value,
                    calibration.outlier_policy.value,
                    'Active' if calibration.active else 'Inactive',
                    calibration.slope, calibration.intercept, calibration.r2,
                    calibration.lod, calibration.loq, calibration.lod_method
                ]
            }
            metadata_df = pd.DataFrame(metadata_dict)
            metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
            
            # Levels sheet
            levels_data = []
            for i, level in enumerate(calibration.levels):
                level_dict = {
                    'Level': i + 1,
                    'Amount': level.amount,
                    'Unit': level.unit,
                    'Peak_Area': level.area,
                    'Included': level.included,
                    'Outlier_Reason': level.outlier_reason
                }
                if calibration.mode.value == 'internal_standard':
                    level_dict['IS_Area'] = level.is_area
                    rf = level.area / level.is_area if level.area and level.is_area and level.is_area > 0 else 0
                    level_dict['Response_Factor'] = rf
                levels_data.append(level_dict)
            
            levels_df = pd.DataFrame(levels_data)
            levels_df.to_excel(writer, sheet_name='Levels', index=False)
            
            # Residuals sheet
            if calibration.residuals:
                residuals_df = pd.DataFrame({
                    'Level': range(1, len(calibration.residuals) + 1),
                    'Residual': calibration.residuals
                })
                residuals_df.to_excel(writer, sheet_name='Residuals', index=False)
        
        xlsx_content = buffer.getvalue()
        buffer.close()
        
        return {
            "content": base64.b64encode(xlsx_content).decode(),
            "filename": f"calibration_{calibration.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "size": len(xlsx_content)
        }
    
    def _generate_json_report(self, calibration: CalibrationModel) -> Dict[str, Any]:
        """Generate JSON calibration report"""
        # Convert calibration to dict and add metadata
        report_data = {
            "report_metadata": {
                "generated_at": datetime.now().isoformat(),
                "report_type": "calibration",
                "format": "json",
                "generator": "IntelliLab GC"
            },
            "calibration": calibration.model_dump()
        }
        
        json_content = json.dumps(report_data, indent=2, default=str)
        
        return {
            "content": base64.b64encode(json_content.encode()).decode(),
            "filename": f"calibration_{calibration.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "mime_type": "application/json",
            "size": len(json_content)
        }
    
    def _create_residuals_plot(self, calibration: CalibrationModel) -> Optional[io.BytesIO]:
        """Create residuals plot for PDF report"""
        if not MATPLOTLIB_AVAILABLE or not calibration.residuals:
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(6, 4))
            
            # Get concentrations for included points
            concentrations = [level.amount for level in calibration.levels if level.included]
            residuals = calibration.residuals
            
            # Plot residuals
            ax.scatter(concentrations, residuals, alpha=0.7, s=50)
            ax.axhline(y=0, color='r', linestyle='--', alpha=0.5)
            
            ax.set_xlabel('Concentration')
            ax.set_ylabel('Residuals')
            ax.set_title(f'Residuals Plot - {calibration.target_name}')
            ax.grid(True, alpha=0.3)
            
            # Add R² annotation
            if calibration.r2:
                ax.text(0.05, 0.95, f'R² = {calibration.r2:.4f}', 
                       transform=ax.transAxes, verticalalignment='top',
                       bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            
            plt.tight_layout()
            
            # Save to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            plt.close()
            buffer.seek(0)
            
            return buffer
            
        except Exception as e:
            logger.error(f"Failed to create residuals plot: {str(e)}")
            plt.close()
            return None


# Global service instance
reporting_service = ReportingService()