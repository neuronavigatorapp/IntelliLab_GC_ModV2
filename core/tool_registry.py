# core/tool_registry.py

import os
import importlib
import traceback

TOOL_DIR = os.path.join(os.path.dirname(__file__), "..", "tools")


class ToolRegistry:
    """
    Discovers and manages all modular tools in the /tools directory.
    """

    def __init__(self, tool_dir=TOOL_DIR):
        self.tool_dir = os.path.abspath(tool_dir)

    def discover_tools(self):
        """
        Discover all tools in the tool directory that contain a main.py or __init__.py file.
        Returns a list of tool metadata dicts.
        """
        tools = []
        for folder in os.listdir(self.tool_dir):
            tool_path = os.path.join(self.tool_dir, folder)
            if os.path.isdir(tool_path):
                meta = self.get_tool_metadata(tool_path)
                if meta:
                    tools.append(meta)
        return tools

    def get_tool_metadata(self, tool_path):
        """
        Loads tool metadata from the tool module, or falls back to folder name.
        """
        meta = {
            "name": os.path.basename(tool_path),
            "description": "",
            "category": "Uncategorized",
            "version": "",
            "entry": "",
            "icon": "",
        }
        try:
            # Try loading metadata from a __init__.py or main.py file
            for entry_file in ["__init__.py", "main.py"]:
                entry_path = os.path.join(tool_path, entry_file)
                if os.path.exists(entry_path):
                    spec = importlib.util.spec_from_file_location(meta["name"], entry_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    # Check for expected metadata
                    for field in ["name", "description", "category", "version", "icon"]:
                        if hasattr(module, field):
                            meta[field] = getattr(module, field)
                    meta["entry"] = entry_path
                    break
        except Exception as e:
            meta["description"] = f"⚠️ Error loading: {e}"
            meta["icon"] = ""
        return meta

    def get_tool_by_name(self, name):
        """
        Returns metadata for the tool with the given name.
        """
        for meta in self.discover_tools():
            if meta["name"].lower() == name.lower():
                return meta
        return None

    def list_tool_names(self):
        """
        Return a list of tool names.
        """
        return [meta["name"] for meta in self.discover_tools()]


def main():
    registry = ToolRegistry()
    tools = registry.discover_tools()
    print("=" * 50)
    print(f"Discovered {len(tools)} tools in {TOOL_DIR}:")
    for tool in tools:
        print(f" - {tool['name']}: {tool.get('description', '')}")
    print("=" * 50)


# --- Legacy API for ModV2: Provide a registry function for main.py ---
def get_registry():
    """
    Return a registry of all available tools as a list of metadata dicts.
    This provides backwards compatibility with code expecting get_registry().
    """
    registry = ToolRegistry()
    return registry.discover_tools()


if __name__ == "__main__":
    main()
