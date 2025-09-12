#!/usr/bin/env python3
"""
Base class for all IntelliLab GC tools - Unified signature for modular use
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseTool(ABC):
    """Abstract base class for all GC tools"""
    
    def __init__(self, name: str, description: str, category: str = "Analysis", version: str = "1.0.0"):
        """Initialize the tool with metadata (MATCHES ALL TOOLS)"""
        self.name = name
        self.description = description
        self.category = category
        self.version = version
        self._config: Dict[str, Any] = {}
    
    def get_info(self) -> Dict[str, str]:
        """Get tool information"""
        return {
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'version': self.version
        }
    
    def set_config(self, config: Dict[str, Any]) -> None:
        """Set tool configuration"""
        self._config = config
    
    def get_config(self) -> Dict[str, Any]:
        """Get tool configuration"""
        return self._config.copy()
    
    def run_interactive(self) -> None:
        """Run the tool in interactive mode (default implementation)"""
        print(f"\n=== {self.name} v{self.version} ===")
        print(self.description)
        print(f"Category: {self.category}")
        print("\nThis tool is running in default interactive mode.")
        print("Override run_interactive() method for custom behavior.")
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> bool:
        """Validate input parameters (can be overridden)"""
        return True
    
    def __str__(self) -> str:
        return f"{self.name} v{self.version}"
    
    def __repr__(self) -> str:
        return f"BaseTool(name='{self.name}', version='{self.version}', category='{self.category}')"

class ToolError(Exception):
    """Custom exception for tool-related errors"""
    pass

class ToolValidationError(ToolError):
    """Exception for input validation errors"""
    pass

class ToolConfigurationError(ToolError):
    """Exception for configuration errors"""
    pass
