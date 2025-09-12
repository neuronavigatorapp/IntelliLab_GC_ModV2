#!/usr/bin/env python3
"""
GC Method Manager for IntelliLab GC ModV2
Enables method import/export and data sharing between tools
"""

import json
import pickle
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import asdict, dataclass
from datetime import datetime

# Add project root to path
import sys
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from common.data_models import GCMethod, Compound, InletSettings, OvenProgram


@dataclass
class AnalysisResult:
    """Container for analysis results from any tool"""
    tool_name: str
    timestamp: datetime
    method_used: GCMethod
    results: Dict[str, Any]
    compounds: List[Compound]
    notes: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'tool_name': self.tool_name,
            'timestamp': self.timestamp.isoformat(),
            'method_used': asdict(self.method_used) if self.method_used else None,
            'results': self.results,
            'compounds': [asdict(c) for c in self.compounds],
            'notes': self.notes
        }


class MethodManager:
    """Manages GC method import/export and inter-tool data sharing"""
    
    def __init__(self, project_root: Optional[Path] = None):
        """Initialize method manager"""
        self.project_root = project_root or Path.cwd()
        self.methods_dir = self.project_root / "methods"
        self.results_dir = self.project_root / "results"
        self.shared_data_dir = self.project_root / "shared_data"
        
        # Create directories if they don't exist
        self.methods_dir.mkdir(exist_ok=True)
        self.results_dir.mkdir(exist_ok=True)
        self.shared_data_dir.mkdir(exist_ok=True)
    
    def save_method(self, method: GCMethod, filename: Optional[str] = None) -> Path:
        """Save a GC method to file"""
        if not filename:
            # Generate filename from method name and timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_name = "".join(c for c in method.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{safe_name}_{timestamp}.json"
        
        if not filename.endswith('.json'):
            filename += '.json'
        
        file_path = self.methods_dir / filename
        
        # Convert method to dictionary
        method_dict = {
            'name': method.name,
            'created': datetime.now().isoformat(),
            'inlet': asdict(method.inlet) if method.inlet else None,
            'oven_program': asdict(method.oven_program) if method.oven_program else None,
            'version': '1.0',
            'created_by': 'IntelliLab GC ModV2'
        }
        
        # Save to JSON
        with open(file_path, 'w') as f:
            json.dump(method_dict, f, indent=2, default=str)
        
        print(f"✅ Method saved: {file_path}")
        return file_path
    
    def load_method(self, filename: str) -> GCMethod:
        """Load a GC method from file"""
        file_path = self.methods_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Method file not found: {file_path}")
        
        with open(file_path, 'r') as f:
            method_dict = json.load(f)
        
        # Reconstruct method objects
        method = GCMethod(name=method_dict['name'])
        
        # Reconstruct inlet settings
        if method_dict.get('inlet'):
            from common.data_models import InletType
            inlet_data = method_dict['inlet']
            
            # Handle enum conversion
            if isinstance(inlet_data.get('inlet_type'), str):
                inlet_data['inlet_type'] = InletType(inlet_data['inlet_type'])
            
            method.inlet = InletSettings(**inlet_data)
        
        # Reconstruct oven program
        if method_dict.get('oven_program'):
            from common.data_models import OvenRamp
            oven_data = method_dict['oven_program']
            
            ramps = []
            for ramp_data in oven_data.get('ramps', []):
                ramps.append(OvenRamp(**ramp_data))
            
            method.oven_program = OvenProgram(ramps=ramps)
        
        print(f"✅ Method loaded: {method.name}")
        return method
    
    def list_methods(self) -> List[Dict[str, Any]]:
        """List all saved methods"""
        methods = []
        
        for file_path in self.methods_dir.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    method_dict = json.load(f)
                
                methods.append({
                    'filename': file_path.name,
                    'name': method_dict.get('name', 'Unknown'),
                    'created': method_dict.get('created', 'Unknown'),
                    'size_kb': file_path.stat().st_size / 1024
                })
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}")
        
        return sorted(methods, key=lambda x: x['created'], reverse=True)
    
    def save_analysis_result(self, result: AnalysisResult, filename: Optional[str] = None) -> Path:
        """Save analysis results for sharing between tools"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_tool_name = "".join(c for c in result.tool_name if c.isalnum() or c in ('_', '-'))
            filename = f"{safe_tool_name}_result_{timestamp}.json"
        
        if not filename.endswith('.json'):
            filename += '.json'
        
        file_path = self.results_dir / filename
        
        # Save to JSON
        with open(file_path, 'w') as f:
            json.dump(result.to_dict(), f, indent=2, default=str)
        
        print(f"✅ Analysis result saved: {file_path}")
        return file_path
    
    def load_analysis_result(self, filename: str) -> AnalysisResult:
        """Load analysis results"""
        file_path = self.results_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Result file not found: {file_path}")
        
        with open(file_path, 'r') as f:
            result_dict = json.load(f)
        
        # Reconstruct objects
        method = None
        if result_dict.get('method_used'):
            # Create a simple method reconstruction
            method_data = result_dict['method_used']
            method = GCMethod(name=method_data.get('name', 'Loaded Method'))
        
        compounds = []
        for comp_data in result_dict.get('compounds', []):
            compounds.append(Compound(**comp_data))
        
        result = AnalysisResult(
            tool_name=result_dict['tool_name'],
            timestamp=datetime.fromisoformat(result_dict['timestamp']),
            method_used=method,
            results=result_dict['results'],
            compounds=compounds,
            notes=result_dict['notes']
        )
        
        print(f"✅ Analysis result loaded from {result.tool_name}")
        return result
    
    def share_data(self, data: Dict[str, Any], data_type: str, source_tool: str) -> Path:
        """Share data between tools"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{source_tool}_{data_type}_{timestamp}.json"
        file_path = self.shared_data_dir / filename
        
        shared_data = {
            'source_tool': source_tool,
            'data_type': data_type,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        with open(file_path, 'w') as f:
            json.dump(shared_data, f, indent=2, default=str)
        
        print(f"✅ Data shared: {file_path}")
        return file_path
    
    def get_shared_data(self, data_type: Optional[str] = None, source_tool: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available shared data"""
        shared_data = []
        
        for file_path in self.shared_data_dir.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                # Filter by criteria
                if data_type and data.get('data_type') != data_type:
                    continue
                if source_tool and data.get('source_tool') != source_tool:
                    continue
                
                data['filename'] = file_path.name
                shared_data.append(data)
                
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}")
        
        return sorted(shared_data, key=lambda x: x['timestamp'], reverse=True)
    
    def create_workflow_chain(self, tools: List[str], base_method: GCMethod) -> Dict[str, Any]:
        """Create a workflow chain across multiple tools"""
        workflow = {
            'name': f"Workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'created': datetime.now().isoformat(),
            'base_method': asdict(base_method),
            'tools': tools,
            'steps': [],
            'status': 'created'
        }
        
        # Define workflow steps
        tool_steps = {
            'inlet_simulator': {
                'description': 'Simulate inlet conditions and discrimination',
                'inputs': ['method', 'compounds'],
                'outputs': ['inlet_performance', 'optimized_conditions']
            },
            'oven_visualizer': {
                'description': 'Optimize temperature program',
                'inputs': ['method', 'compounds'],
                'outputs': ['temperature_profile', 'program_efficiency']
            },
            'detector_simulator': {
                'description': 'Simulate detector response and chromatogram',
                'inputs': ['method', 'compounds', 'inlet_performance'],
                'outputs': ['chromatogram', 'peak_table', 'detection_limits']
            }
        }
        
        for tool in tools:
            if tool in tool_steps:
                workflow['steps'].append(tool_steps[tool])
        
        return workflow
    
    def export_complete_method(self, method: GCMethod, results: List[AnalysisResult], 
                              filename: Optional[str] = None) -> Path:
        """Export a complete method with all analysis results"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_name = "".join(c for c in method.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"Complete_{safe_name}_{timestamp}.json"
        
        if not filename.endswith('.json'):
            filename += '.json'
        
        file_path = self.methods_dir / filename
        
        complete_method = {
            'method': asdict(method),
            'analysis_results': [result.to_dict() for result in results],
            'created': datetime.now().isoformat(),
            'version': '1.0',
            'type': 'complete_method_package'
        }
        
        with open(file_path, 'w') as f:
            json.dump(complete_method, f, indent=2, default=str)
        
        print(f"✅ Complete method package exported: {file_path}")
        return file_path


def main():
    """Test the method manager"""
    try:
        from common.data_models import create_standard_method
        
        print("🧪 Testing Method Manager")
        print("=" * 30)
        
        # Create manager
        manager = MethodManager()
        
        # Test method save/load
        test_method = create_standard_method("Test Method Export")
        saved_path = manager.save_method(test_method)
        
        loaded_method = manager.load_method(saved_path.name)
        print(f"✅ Method round-trip successful: {loaded_method.name}")
        
        # Test method listing
        methods = manager.list_methods()
        print(f"✅ Found {len(methods)} saved methods")
        
        # Test data sharing
        test_data = {"temperature": 250, "pressure": 15}
        shared_path = manager.share_data(test_data, "inlet_conditions", "inlet_simulator")
        
        shared_data = manager.get_shared_data("inlet_conditions")
        print(f"✅ Found {len(shared_data)} shared data items")
        
        print("\n🎉 Method Manager working correctly!")
        
    except Exception as e:
        print(f"❌ Method Manager test failed: {e}")


if __name__ == "__main__":
    main()