#!/usr/bin/env python3
"""
LIMS Service for IntelliLab GC
Handles LIMS connectivity, data export/import, and connection management
"""

import sqlite3
import json
import requests
import csv
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
import base64

from app.models.schemas import (
    LIMSConfig, LIMSConfigCreate, LIMSConfigUpdate, 
    LIMSExportRequest, LIMSImportRequest, LIMSConnectionResult
)


class LIMSService:
    """LIMS connectivity and data management service"""
    
    def __init__(self, db_path: str = "intellilab_gc.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize LIMS database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS lims_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    base_url TEXT NOT NULL,
                    api_key TEXT NOT NULL,
                    format TEXT DEFAULT 'json',
                    is_active BOOLEAN DEFAULT TRUE,
                    connection_name TEXT NOT NULL,
                    description TEXT,
                    created_date TEXT DEFAULT CURRENT_TIMESTAMP,
                    modified_date TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_lims_configs_active 
                ON lims_configs (is_active)
            """)
    
    def create_lims_config(self, config: LIMSConfigCreate) -> LIMSConfig:
        """Create a new LIMS configuration"""
        with sqlite3.connect(self.db_path) as conn:
            # Encrypt API key (basic encryption for demo)
            encrypted_key = self._encrypt_api_key(config.api_key)
            
            cursor = conn.execute("""
                INSERT INTO lims_configs (
                    base_url, api_key, format, connection_name, description
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                config.base_url, encrypted_key, config.format,
                config.connection_name, config.description
            ))
            
            config_id = cursor.lastrowid
            return self.get_lims_config(config_id)
    
    def get_lims_config(self, config_id: int) -> Optional[LIMSConfig]:
        """Get a LIMS configuration by ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM lims_configs WHERE id = ?
            """, (config_id,))
            
            row = cursor.fetchone()
            if row:
                # Decrypt API key
                row_dict = dict(row)
                row_dict['api_key'] = self._decrypt_api_key(row_dict['api_key'])
                return LIMSConfig(**row_dict)
            return None
    
    def get_all_lims_configs(self) -> List[LIMSConfig]:
        """Get all LIMS configurations"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM lims_configs ORDER BY connection_name
            """)
            
            configs = []
            for row in cursor.fetchall():
                row_dict = dict(row)
                row_dict['api_key'] = self._decrypt_api_key(row_dict['api_key'])
                configs.append(LIMSConfig(**row_dict))
            
            return configs
    
    def update_lims_config(self, config_id: int, update: LIMSConfigUpdate) -> Optional[LIMSConfig]:
        """Update a LIMS configuration"""
        with sqlite3.connect(self.db_path) as conn:
            # Get current config
            current = self.get_lims_config(config_id)
            if not current:
                return None
            
            # Build update query
            updates = []
            values = []
            
            for field, value in update.dict(exclude_unset=True).items():
                if value is not None:
                    if field == 'api_key':
                        value = self._encrypt_api_key(value)
                    updates.append(f"{field} = ?")
                    values.append(value)
            
            if not updates:
                return current
            
            # Add modified date
            updates.append("modified_date = ?")
            values.append(datetime.now().isoformat())
            values.append(config_id)
            
            conn.execute(f"""
                UPDATE lims_configs 
                SET {', '.join(updates)}
                WHERE id = ?
            """, values)
            
            return self.get_lims_config(config_id)
    
    def delete_lims_config(self, config_id: int) -> bool:
        """Delete a LIMS configuration"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                DELETE FROM lims_configs WHERE id = ?
            """, (config_id,))
            
            return cursor.rowcount > 0
    
    def test_lims_connection(self, config_id: int) -> LIMSConnectionResult:
        """Test connection to LIMS"""
        config = self.get_lims_config(config_id)
        if not config:
            return LIMSConnectionResult(
                success=False,
                message="LIMS configuration not found",
                response_time=None,
                error_details="Invalid config_id"
            )
        
        try:
            # Test basic connectivity
            start_time = datetime.now()
            
            # Try to connect to the base URL
            response = requests.get(
                f"{config.base_url}/health",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            if response.status_code == 200:
                return LIMSConnectionResult(
                    success=True,
                    message="Connection successful",
                    response_time=response_time,
                    error_details=None
                )
            else:
                return LIMSConnectionResult(
                    success=False,
                    message=f"Connection failed with status {response.status_code}",
                    response_time=response_time,
                    error_details=response.text
                )
                
        except requests.exceptions.RequestException as e:
            return LIMSConnectionResult(
                success=False,
                message="Connection failed",
                response_time=None,
                error_details=str(e)
            )
    
    def export_data_to_lims(self, request: LIMSExportRequest) -> Dict[str, Any]:
        """Export data to LIMS"""
        config = self.get_lims_config(request.config_id)
        if not config:
            raise ValueError("LIMS configuration not found")
        
        # Get data based on type
        data = self._get_export_data(request.data_type, request.date_range)
        
        # Format data according to LIMS format
        formatted_data = self._format_export_data(data, request.format or config.format)
        
        # Send to LIMS
        try:
            response = requests.post(
                f"{config.base_url}/import",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "data_type": request.data_type,
                    "data": formatted_data,
                    "include_metadata": request.include_metadata
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "Data exported successfully",
                    "records_exported": len(data),
                    "response": response.json()
                }
            else:
                return {
                    "success": False,
                    "message": f"Export failed with status {response.status_code}",
                    "error": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "message": "Export failed",
                "error": str(e)
            }
    
    def import_data_from_lims(self, request: LIMSImportRequest) -> Dict[str, Any]:
        """Import data from LIMS"""
        config = self.get_lims_config(request.config_id)
        if not config:
            raise ValueError("LIMS configuration not found")
        
        try:
            # Read file data
            with open(request.file_path, 'r') as f:
                if request.format.lower() == 'json':
                    data = json.load(f)
                elif request.format.lower() == 'xml':
                    tree = ET.parse(f)
                    data = self._xml_to_dict(tree.getroot())
                elif request.format.lower() == 'csv':
                    data = list(csv.DictReader(f))
                else:
                    raise ValueError(f"Unsupported format: {request.format}")
            
            # Validate data if requested
            if request.validate_only:
                validation_result = self._validate_import_data(data, request.data_type)
                return {
                    "success": True,
                    "validation_only": True,
                    "valid": validation_result["valid"],
                    "errors": validation_result.get("errors", []),
                    "records_validated": len(data)
                }
            
            # Import data
            import_result = self._import_data(data, request.data_type)
            
            return {
                "success": True,
                "validation_only": False,
                "records_imported": import_result["imported_count"],
                "errors": import_result.get("errors", []),
                "details": import_result.get("details", {})
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": "Import failed",
                "error": str(e)
            }
    
    def _encrypt_api_key(self, api_key: str) -> str:
        """Basic encryption for API key (demo implementation)"""
        # In production, use proper encryption
        return base64.b64encode(api_key.encode()).decode()
    
    def _decrypt_api_key(self, encrypted_key: str) -> str:
        """Basic decryption for API key (demo implementation)"""
        # In production, use proper decryption
        return base64.b64decode(encrypted_key.encode()).decode()
    
    def _get_export_data(self, data_type: str, date_range: Optional[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Get data for export based on type"""
        # This would integrate with other services to get actual data
        # For demo purposes, return sample data
        
        if data_type == "methods":
            return [
                {
                    "id": 1,
                    "name": "GC Method 1",
                    "type": "hydrocarbon_analysis",
                    "parameters": {"temperature": 250, "flow_rate": 2.0},
                    "created_date": "2024-01-01T00:00:00"
                }
            ]
        elif data_type == "runs":
            return [
                {
                    "id": 1,
                    "method_id": 1,
                    "instrument_id": 1,
                    "timestamp": "2024-01-01T10:00:00",
                    "results": {"peak_areas": [100, 200, 300]}
                }
            ]
        elif data_type == "qc":
            return [
                {
                    "id": 1,
                    "analyte": "Benzene",
                    "value": 1.5,
                    "ucl": 2.0,
                    "lcl": 1.0,
                    "date": "2024-01-01T10:00:00"
                }
            ]
        elif data_type == "audit":
            return [
                {
                    "id": 1,
                    "user": "analyst1",
                    "action": "method_modified",
                    "entity_type": "method",
                    "entity_id": 1,
                    "timestamp": "2024-01-01T10:00:00"
                }
            ]
        else:
            return []
    
    def _format_export_data(self, data: List[Dict[str, Any]], format: str) -> str:
        """Format data for export"""
        if format.lower() == "json":
            return json.dumps(data, indent=2)
        elif format.lower() == "xml":
            return self._dict_to_xml({"records": data})
        elif format.lower() == "csv":
            if not data:
                return ""
            
            output = []
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            return "".join(output)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _dict_to_xml(self, data: Dict[str, Any]) -> str:
        """Convert dictionary to XML string"""
        def dict_to_xml_element(data, root_name="root"):
            root = ET.Element(root_name)
            for key, value in data.items():
                if isinstance(value, dict):
                    child = dict_to_xml_element(value, key)
                    root.append(child)
                elif isinstance(value, list):
                    for item in value:
                        child = dict_to_xml_element(item, key)
                        root.append(child)
                else:
                    child = ET.SubElement(root, key)
                    child.text = str(value)
            return root
        
        root = dict_to_xml_element(data)
        return ET.tostring(root, encoding='unicode')
    
    def _xml_to_dict(self, element: ET.Element) -> Dict[str, Any]:
        """Convert XML element to dictionary"""
        result = {}
        for child in element:
            if len(child) == 0:
                result[child.tag] = child.text
            else:
                result[child.tag] = self._xml_to_dict(child)
        return result
    
    def _validate_import_data(self, data: List[Dict[str, Any]], data_type: str) -> Dict[str, Any]:
        """Validate imported data"""
        errors = []
        valid_count = 0
        
        for i, record in enumerate(data):
            try:
                if data_type == "methods":
                    if "name" not in record or "type" not in record:
                        errors.append(f"Record {i+1}: Missing required fields")
                    else:
                        valid_count += 1
                elif data_type == "runs":
                    if "method_id" not in record or "timestamp" not in record:
                        errors.append(f"Record {i+1}: Missing required fields")
                    else:
                        valid_count += 1
                elif data_type == "qc":
                    if "analyte" not in record or "value" not in record:
                        errors.append(f"Record {i+1}: Missing required fields")
                    else:
                        valid_count += 1
            except Exception as e:
                errors.append(f"Record {i+1}: {str(e)}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "valid_count": valid_count,
            "total_count": len(data)
        }
    
    def _import_data(self, data: List[Dict[str, Any]], data_type: str) -> Dict[str, Any]:
        """Import data into the system"""
        imported_count = 0
        errors = []
        
        # This would integrate with other services to actually import data
        # For demo purposes, just count valid records
        
        for record in data:
            try:
                if data_type in ["methods", "runs", "qc"]:
                    imported_count += 1
            except Exception as e:
                errors.append(str(e))
        
        return {
            "imported_count": imported_count,
            "errors": errors,
            "details": {
                "data_type": data_type,
                "total_records": len(data)
            }
        }


# Global LIMS service instance
lims_service = LIMSService()
