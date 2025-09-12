#!/usr/bin/env python3
"""
LIMS Integration Service
Addresses Dr. Williams' critique on missing LIMS integration
"""

import requests
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json
import base64
import hashlib
from datetime import datetime, timezone
import asyncio
import aiohttp
from loguru import logger
from urllib.parse import urljoin


class LIMSType(str, Enum):
    """Supported LIMS systems"""
    LABWARE = "LabWare"
    STARLIMS = "STARLIMS"
    SAMPLE_MANAGER = "SampleManager"
    WATSON = "Watson LIMS"
    LABVANTAGE = "LabVantage"
    GENERIC_REST = "Generic REST"


class DataFormat(str, Enum):
    """Data exchange formats"""
    XML = "XML"
    JSON = "JSON"
    CSV = "CSV"
    HL7 = "HL7"


@dataclass
class LIMSCredentials:
    """LIMS connection credentials"""
    endpoint: str
    username: str
    password: str
    api_key: Optional[str] = None
    certificate_path: Optional[str] = None
    timeout: int = 30


@dataclass
class SampleResult:
    """Sample analysis result for LIMS export"""
    sample_id: str
    sample_name: str
    analysis_date: datetime
    method_name: str
    operator: str
    instrument: str
    results: List[Dict[str, Any]]
    qc_flags: List[str]
    comments: Optional[str] = None


@dataclass
class LIMSResponse:
    """LIMS operation response"""
    success: bool
    message: str
    lims_id: Optional[str] = None
    errors: List[str] = None
    warnings: List[str] = None


class LIMSConnector:
    """Base LIMS connector class"""
    
    def __init__(self, lims_type: LIMSType, credentials: LIMSCredentials):
        self.lims_type = lims_type
        self.credentials = credentials
        self.session = None
        
    async def connect(self) -> bool:
        """Establish connection to LIMS"""
        raise NotImplementedError
        
    async def disconnect(self):
        """Close LIMS connection"""
        if self.session:
            await self.session.close()
            
    async def export_results(self, sample_results: List[SampleResult]) -> LIMSResponse:
        """Export results to LIMS"""
        raise NotImplementedError
        
    async def import_samples(self, criteria: Dict[str, Any]) -> List[Dict]:
        """Import sample information from LIMS"""
        raise NotImplementedError


class LabWareLIMS(LIMSConnector):
    """LabWare LIMS integration"""
    
    def __init__(self, credentials: LIMSCredentials):
        super().__init__(LIMSType.LABWARE, credentials)
        
    async def connect(self) -> bool:
        """Connect to LabWare LIMS"""
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.credentials.timeout)
            )
            
            # LabWare authentication
            auth_url = urljoin(self.credentials.endpoint, "/api/auth/login")
            auth_data = {
                "username": self.credentials.username,
                "password": self.credentials.password
            }
            
            async with self.session.post(auth_url, json=auth_data) as response:
                if response.status == 200:
                    auth_result = await response.json()
                    self.session.headers.update({
                        "Authorization": f"Bearer {auth_result.get('token')}"
                    })
                    logger.info("Connected to LabWare LIMS")
                    return True
                else:
                    logger.error(f"LabWare authentication failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"LabWare connection error: {e}")
            return False
    
    async def export_results(self, sample_results: List[SampleResult]) -> LIMSResponse:
        """Export results to LabWare LIMS using XML format"""
        try:
            if not self.session:
                if not await self.connect():
                    return LIMSResponse(False, "Failed to connect to LabWare")
            
            # Build LabWare XML format
            root = ET.Element("AnalysisResults")
            root.set("xmlns", "http://labware.com/schemas/results")
            root.set("version", "2.0")
            
            for sample in sample_results:
                sample_elem = ET.SubElement(root, "Sample")
                sample_elem.set("id", sample.sample_id)
                sample_elem.set("name", sample.sample_name)
                
                # Analysis information
                analysis_elem = ET.SubElement(sample_elem, "Analysis")
                analysis_elem.set("date", sample.analysis_date.isoformat())
                analysis_elem.set("method", sample.method_name)
                analysis_elem.set("operator", sample.operator)
                analysis_elem.set("instrument", sample.instrument)
                
                # Results
                results_elem = ET.SubElement(sample_elem, "Results")
                for result in sample.results:
                    result_elem = ET.SubElement(results_elem, "Result")
                    result_elem.set("compound", result.get("compound_name", ""))
                    result_elem.set("cas", result.get("cas_number", ""))
                    result_elem.set("concentration", str(result.get("concentration", 0)))
                    result_elem.set("units", result.get("units", "mg/L"))
                    result_elem.set("detection_limit", str(result.get("detection_limit", 0)))
                    result_elem.set("uncertainty", str(result.get("uncertainty", 0)))
                    result_elem.set("flag", result.get("flag", ""))
                
                # QC flags
                if sample.qc_flags:
                    qc_elem = ET.SubElement(sample_elem, "QualityControl")
                    for flag in sample.qc_flags:
                        flag_elem = ET.SubElement(qc_elem, "Flag")
                        flag_elem.text = flag
                
                # Comments
                if sample.comments:
                    comment_elem = ET.SubElement(sample_elem, "Comments")
                    comment_elem.text = sample.comments
            
            xml_data = ET.tostring(root, encoding='unicode')
            
            # Send to LabWare
            export_url = urljoin(self.credentials.endpoint, "/api/results/import")
            headers = {
                "Content-Type": "application/xml",
                "X-LabWare-Format": "GC-Results-v2"
            }
            
            async with self.session.post(export_url, data=xml_data, headers=headers) as response:
                if response.status == 200:
                    result_data = await response.json()
                    return LIMSResponse(
                        success=True,
                        message="Results exported successfully",
                        lims_id=result_data.get("batch_id"),
                        warnings=result_data.get("warnings", [])
                    )
                else:
                    error_text = await response.text()
                    return LIMSResponse(
                        success=False,
                        message=f"Export failed: {response.status}",
                        errors=[error_text]
                    )
                    
        except Exception as e:
            logger.error(f"LabWare export error: {e}")
            return LIMSResponse(
                success=False,
                message=f"Export error: {str(e)}",
                errors=[str(e)]
            )
    
    async def import_samples(self, criteria: Dict[str, Any]) -> List[Dict]:
        """Import sample worklist from LabWare"""
        try:
            if not self.session:
                if not await self.connect():
                    return []
            
            # Build query parameters
            params = {
                "status": criteria.get("status", "Pending"),
                "method": criteria.get("method"),
                "date_from": criteria.get("date_from"),
                "date_to": criteria.get("date_to"),
                "limit": criteria.get("limit", 100)
            }
            
            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}
            
            import_url = urljoin(self.credentials.endpoint, "/api/samples/worklist")
            
            async with self.session.get(import_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("samples", [])
                else:
                    logger.error(f"LabWare import failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"LabWare import error: {e}")
            return []


class StarLIMS(LIMSConnector):
    """STARLIMS integration"""
    
    def __init__(self, credentials: LIMSCredentials):
        super().__init__(LIMSType.STARLIMS, credentials)
        
    async def connect(self) -> bool:
        """Connect to STARLIMS"""
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.credentials.timeout)
            )
            
            # STARLIMS uses API key authentication
            self.session.headers.update({
                "X-API-Key": self.credentials.api_key,
                "Content-Type": "application/json"
            })
            
            # Test connection
            test_url = urljoin(self.credentials.endpoint, "/api/v1/ping")
            async with self.session.get(test_url) as response:
                if response.status == 200:
                    logger.info("Connected to STARLIMS")
                    return True
                else:
                    logger.error(f"STARLIMS connection failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"STARLIMS connection error: {e}")
            return False
    
    async def export_results(self, sample_results: List[SampleResult]) -> LIMSResponse:
        """Export results to STARLIMS using JSON format"""
        try:
            if not self.session:
                if not await self.connect():
                    return LIMSResponse(False, "Failed to connect to STARLIMS")
            
            # Build STARLIMS JSON format
            export_data = {
                "batch_id": f"GC_BATCH_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "export_date": datetime.now(timezone.utc).isoformat(),
                "instrument_type": "GC",
                "samples": []
            }
            
            for sample in sample_results:
                sample_data = {
                    "sample_id": sample.sample_id,
                    "sample_name": sample.sample_name,
                    "analysis_info": {
                        "date": sample.analysis_date.isoformat(),
                        "method": sample.method_name,
                        "operator": sample.operator,
                        "instrument": sample.instrument
                    },
                    "analytes": []
                }
                
                for result in sample.results:
                    analyte_data = {
                        "name": result.get("compound_name"),
                        "cas_number": result.get("cas_number"),
                        "result_value": result.get("concentration"),
                        "result_units": result.get("units", "mg/L"),
                        "detection_limit": result.get("detection_limit"),
                        "uncertainty": result.get("uncertainty"),
                        "qualifier": result.get("flag", ""),
                        "retention_time": result.get("retention_time")
                    }
                    sample_data["analytes"].append(analyte_data)
                
                if sample.qc_flags:
                    sample_data["qc_flags"] = sample.qc_flags
                    
                if sample.comments:
                    sample_data["comments"] = sample.comments
                    
                export_data["samples"].append(sample_data)
            
            # Send to STARLIMS
            export_url = urljoin(self.credentials.endpoint, "/api/v1/results/import")
            
            async with self.session.post(export_url, json=export_data) as response:
                if response.status == 201:
                    result_data = await response.json()
                    return LIMSResponse(
                        success=True,
                        message="Results exported successfully",
                        lims_id=result_data.get("import_id"),
                        warnings=result_data.get("warnings", [])
                    )
                else:
                    error_data = await response.json()
                    return LIMSResponse(
                        success=False,
                        message=f"Export failed: {response.status}",
                        errors=error_data.get("errors", [])
                    )
                    
        except Exception as e:
            logger.error(f"STARLIMS export error: {e}")
            return LIMSResponse(
                success=False,
                message=f"Export error: {str(e)}",
                errors=[str(e)]
            )


class SampleManagerLIMS(LIMSConnector):
    """Thermo SampleManager LIMS integration"""
    
    def __init__(self, credentials: LIMSCredentials):
        super().__init__(LIMSType.SAMPLE_MANAGER, credentials)
        
    async def connect(self) -> bool:
        """Connect to SampleManager LIMS"""
        try:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.credentials.timeout)
            )
            
            # SampleManager uses basic authentication
            auth_string = base64.b64encode(
                f"{self.credentials.username}:{self.credentials.password}".encode()
            ).decode()
            
            self.session.headers.update({
                "Authorization": f"Basic {auth_string}",
                "Content-Type": "application/json"
            })
            
            # Test connection
            test_url = urljoin(self.credentials.endpoint, "/samplemanager/api/version")
            async with self.session.get(test_url) as response:
                if response.status == 200:
                    logger.info("Connected to SampleManager LIMS")
                    return True
                else:
                    logger.error(f"SampleManager connection failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"SampleManager connection error: {e}")
            return False
    
    async def export_results(self, sample_results: List[SampleResult]) -> LIMSResponse:
        """Export results to SampleManager LIMS"""
        try:
            if not self.session:
                if not await self.connect():
                    return LIMSResponse(False, "Failed to connect to SampleManager")
            
            # SampleManager uses their proprietary format
            results_batch = []
            
            for sample in sample_results:
                for result in sample.results:
                    result_record = {
                        "SAMPLE_NUMBER": sample.sample_id,
                        "SAMPLE_NAME": sample.sample_name,
                        "ANALYSIS": sample.method_name,
                        "COMPONENT": result.get("compound_name"),
                        "ENTRY": "R",  # Result entry
                        "NUMERIC_RESULT": result.get("concentration"),
                        "UNITS": result.get("units", "mg/L"),
                        "ANALYSIS_DATE": sample.analysis_date.strftime("%Y-%m-%d"),
                        "ANALYSIS_TIME": sample.analysis_date.strftime("%H:%M:%S"),
                        "OPERATOR": sample.operator,
                        "INSTRUMENT": sample.instrument,
                        "STATUS": "A",  # Approved
                        "UNCERTAINTY": result.get("uncertainty"),
                        "DETECTION_LIMIT": result.get("detection_limit"),
                        "QUALIFIER": result.get("flag", "")
                    }
                    results_batch.append(result_record)
            
            # Send batch to SampleManager
            export_url = urljoin(self.credentials.endpoint, "/samplemanager/api/results/batch")
            export_data = {
                "batch_name": f"GC_BATCH_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "results": results_batch
            }
            
            async with self.session.post(export_url, json=export_data) as response:
                if response.status == 200:
                    result_data = await response.json()
                    return LIMSResponse(
                        success=True,
                        message="Results exported successfully",
                        lims_id=result_data.get("batch_id"),
                        warnings=result_data.get("warnings", [])
                    )
                else:
                    error_data = await response.json()
                    return LIMSResponse(
                        success=False,
                        message=f"Export failed: {response.status}",
                        errors=error_data.get("errors", [])
                    )
                    
        except Exception as e:
            logger.error(f"SampleManager export error: {e}")
            return LIMSResponse(
                success=False,
                message=f"Export error: {str(e)}",
                errors=[str(e)]
            )


class LIMSIntegrationService:
    """Main LIMS integration service"""
    
    def __init__(self):
        self.connectors = {}
        
    def register_lims(self, name: str, lims_type: LIMSType, credentials: LIMSCredentials):
        """Register a LIMS system"""
        if lims_type == LIMSType.LABWARE:
            connector = LabWareLIMS(credentials)
        elif lims_type == LIMSType.STARLIMS:
            connector = StarLIMS(credentials)
        elif lims_type == LIMSType.SAMPLE_MANAGER:
            connector = SampleManagerLIMS(credentials)
        else:
            raise ValueError(f"Unsupported LIMS type: {lims_type}")
        
        self.connectors[name] = connector
        logger.info(f"Registered {lims_type.value} LIMS as '{name}'")
    
    async def export_to_lims(self, lims_name: str, sample_results: List[SampleResult]) -> LIMSResponse:
        """Export results to specified LIMS"""
        if lims_name not in self.connectors:
            return LIMSResponse(
                success=False,
                message=f"LIMS '{lims_name}' not registered",
                errors=[f"Unknown LIMS: {lims_name}"]
            )
        
        connector = self.connectors[lims_name]
        
        try:
            response = await connector.export_results(sample_results)
            return response
        finally:
            await connector.disconnect()
    
    async def import_from_lims(self, lims_name: str, criteria: Dict[str, Any]) -> List[Dict]:
        """Import samples from specified LIMS"""
        if lims_name not in self.connectors:
            logger.error(f"LIMS '{lims_name}' not registered")
            return []
        
        connector = self.connectors[lims_name]
        
        try:
            samples = await connector.import_samples(criteria)
            return samples
        finally:
            await connector.disconnect()
    
    async def test_connection(self, lims_name: str) -> bool:
        """Test connection to LIMS"""
        if lims_name not in self.connectors:
            return False
        
        connector = self.connectors[lims_name]
        
        try:
            return await connector.connect()
        finally:
            await connector.disconnect()
    
    def get_supported_formats(self, lims_type: LIMSType) -> List[DataFormat]:
        """Get supported data formats for LIMS type"""
        formats = {
            LIMSType.LABWARE: [DataFormat.XML, DataFormat.JSON],
            LIMSType.STARLIMS: [DataFormat.JSON, DataFormat.CSV],
            LIMSType.SAMPLE_MANAGER: [DataFormat.JSON, DataFormat.CSV],
            LIMSType.WATSON: [DataFormat.XML, DataFormat.HL7],
            LIMSType.LABVANTAGE: [DataFormat.JSON, DataFormat.XML],
            LIMSType.GENERIC_REST: [DataFormat.JSON]
        }
        
        return formats.get(lims_type, [DataFormat.JSON])


# Global instance
lims_service = LIMSIntegrationService()
