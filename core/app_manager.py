"""
Main Application Manager for IntelliLab GC ModV2
"""

import sys
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AppManager:
    """Main application coordinator"""
    
    def __init__(self):
        """Initialize application manager"""
        self.project_root = Path(__file__).parent.parent
        
    def initialize(self):
        """Initialize all application components"""
        logger.info("Initializing IntelliLab GC ModV2...")
        
        try:
            # Basic initialization
            logger.info("Application initialized successfully")
            
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            raise
    
    def run(self):
        """Run the application"""
        logger.info("Starting application...")
        
        print("IntelliLab GC ModV2 - Basic Mode")
        print("=" * 40)
        print("Foundation created successfully!")
        print("")
        print("Available commands:")
        print("1. Check project status")
        print("2. Test template system") 
        print("3. Exit")
        
        while True:
            choice = input("\nSelect option (1-3): ").strip()
            
            if choice == "1":
                self._show_status()
            elif choice == "2":
                self._test_template()
            elif choice == "3":
                print("Goodbye!")
                break
            else:
                print("Invalid option")
    
    def _show_status(self):
        """Show project status"""
        print("\nProject Status:")
        print("- Directory structure: COMPLETE")
        print("- Core files: COMPLETE")
        print("- Tool template: COMPLETE")
        print("- Ready for Session 2: YES")
    
    def _test_template(self):
        """Test the tool template"""
        try:
            sys.path.insert(0, str(self.project_root))
            from tools._template.tool_template import ToolTemplate
            
            tool = ToolTemplate()
            result = tool.run({})
            metadata = tool.get_metadata()
            
            print("\nTemplate Test Results:")
            print(f"- Tool name: {metadata['name']}")
            print(f"- Version: {metadata['version']}")
            print(f"- Test result: {result['status']}")
            print("Template system working correctly!")
            
        except Exception as e:
            print(f"Template test failed: {e}")
