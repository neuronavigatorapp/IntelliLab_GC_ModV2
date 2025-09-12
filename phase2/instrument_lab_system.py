"""
IntelliLab GC - Professional Instrumentation Lab Notebook System
For instrumentation specialists managing large GC fleets with method optimization
Supports method modification beyond ASTM limits for enhanced detection
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import json
import sqlite3
from dataclasses import dataclass, asdict, field
from datetime import datetime
import uuid
from enum import Enum

# Import our Phase 2 modules
from compounds_database import CompoundDatabase, ProcessStream, DetectorType, ColumnType
from method_templates import MethodTemplateDatabase, MethodTemplate, GCConditions, CarrierGas

@dataclass
class InjectionChannel:
    """Individual injection channel configuration"""
    channel_id: str  # "A", "B", "C", etc.
    injector_type: str  # "Split", "Splitless", "PTV", "On-column", "Valve"
    injector_temp: float  # °C
    split_ratio: Optional[float] = None
    splitless_time: Optional[float] = None  # minutes
    injection_volume: float = 1.0  # μL
    
    # Column configuration
    column_type: ColumnType = ColumnType.DB1
    column_length: float = 30.0  # meters
    column_id: float = 0.32  # mm
    film_thickness: Optional[float] = None  # μm
    
    # Carrier gas (can be different per channel)
    carrier_gas: CarrierGas = CarrierGas.HELIUM
    flow_mode: str = "Constant Flow"  # "Constant Flow", "Constant Pressure", "Ramped Flow"
    flow_rate: float = 2.0  # mL/min
    initial_pressure: Optional[float] = None  # psig
    
    # Detector configuration
    detector_type: DetectorType = DetectorType.FID
    detector_temp: float = 280.0  # °C
    detector_flows: Dict[str, float] = field(default_factory=dict)
    
    # Sample prep specific to this channel
    sample_prep: str = "Direct injection"
    derivatization: Optional[str] = None
    preconcentration: bool = False

@dataclass
class OvenProgram:
    """Oven temperature program - shared across all channels"""
    initial_temp: float  # °C
    initial_hold: float  # minutes
    
    # Support multiple ramps
    ramps: List[Tuple[float, float, float]] = field(default_factory=list)  # (rate, temp, hold)
    
    # Cryo cooling if available
    cryo_cooling: bool = False
    cryo_temp: Optional[float] = None  # °C
    
    # Fast heating options
    fast_heating: bool = False
    max_ramp_rate: float = 50.0  # °C/min

@dataclass
class InstrumentConfiguration:
    """Complete GC instrument configuration"""
    instrument_id: str
    instrument_name: str
    manufacturer: str  # "Agilent", "Shimadzu", "ThermoFisher", "PerkinElmer"
    model: str
    serial_number: str
    location: str  # Lab bench/room location
    
    # Multi-channel support (most have 2, some have 3+)
    injection_channels: List[InjectionChannel]
    
    # Shared oven program
    oven_program: OvenProgram
    
    # Instrument capabilities
    has_autosampler: bool = False
    autosampler_model: Optional[str] = None
    has_headspace: bool = False
    has_thermal_desorption: bool = False
    has_valve_oven: bool = False
    valve_configurations: List[str] = field(default_factory=list)
    
    # Maintenance tracking
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    maintenance_notes: str = ""
    
    # Performance tracking
    baseline_stability: Dict[str, float] = field(default_factory=dict)  # detector: %drift/hour
    detection_limits: Dict[str, float] = field(default_factory=dict)  # compound: ppm
    
    # Custom modifications beyond ASTM
    modifications: List[str] = field(default_factory=list)
    method_deviations: List[str] = field(default_factory=list)
    
    created_date: datetime = field(default_factory=datetime.now)
    modified_date: datetime = field(default_factory=datetime.now)

@dataclass
class AnalysisRun:
    """Individual analysis run record"""
    run_id: str
    instrument_id: str
    method_name: str
    sample_id: str
    sample_type: str  # "Standard", "Sample", "Blank", "QC"
    
    # Run conditions (can deviate from method)
    actual_conditions: Dict[str, Any]
    
    # Results
    retention_times: Dict[str, float]  # compound: RT
    peak_areas: Dict[str, float]  # compound: area
    concentrations: Dict[str, float]  # compound: ppm/mol%
    
    # Quality metrics
    resolution_achieved: Dict[Tuple[str, str], float]  # (comp1, comp2): resolution
    detection_limits_achieved: Dict[str, float]  # compound: actual DL
    baseline_noise: Dict[str, float]  # detector: noise level
    
    # Method deviations
    deviations_from_astm: List[str]
    justification: str
    
    run_date: datetime = field(default_factory=datetime.now)
    analyst: str = ""
    notes: str = ""

class InstrumentDatabase:
    """SQLite database for instrument fleet management"""
    
    def __init__(self, db_path="intellilab_instruments.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with proper schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Instruments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS instruments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                manufacturer TEXT,
                model TEXT,
                serial_number TEXT,
                location TEXT,
                config_json TEXT,
                created_date TEXT,
                modified_date TEXT
            )
        ''')
        
        # Analysis runs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_runs (
                run_id TEXT PRIMARY KEY,
                instrument_id TEXT,
                method_name TEXT,
                sample_id TEXT,
                sample_type TEXT,
                conditions_json TEXT,
                results_json TEXT,
                run_date TEXT,
                analyst TEXT,
                notes TEXT,
                FOREIGN KEY (instrument_id) REFERENCES instruments (id)
            )
        ''')
        
        # Method templates table (for custom modifications)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS custom_methods (
                method_id TEXT PRIMARY KEY,
                method_name TEXT,
                base_astm TEXT,
                modifications TEXT,
                config_json TEXT,
                created_by TEXT,
                created_date TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def save_instrument(self, instrument: InstrumentConfiguration):
        """Save instrument configuration to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        config_json = json.dumps(asdict(instrument), default=str)
        
        cursor.execute('''
            INSERT OR REPLACE INTO instruments 
            (id, name, manufacturer, model, serial_number, location, config_json, created_date, modified_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            instrument.instrument_id,
            instrument.instrument_name,
            instrument.manufacturer,
            instrument.model,
            instrument.serial_number,
            instrument.location,
            config_json,
            instrument.created_date.isoformat(),
            instrument.modified_date.isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def load_instrument(self, instrument_id: str) -> Optional[InstrumentConfiguration]:
        """Load instrument configuration from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT config_json FROM instruments WHERE id = ?', (instrument_id,))
        result = cursor.fetchone()
        
        conn.close()
        
        if result:
            config_data = json.loads(result[0])
            # Note: This would need proper deserialization in production
            return None  # Simplified for now
        
        return None
    
    def get_all_instruments(self) -> List[Tuple[str, str, str, str]]:
        """Get list of all instruments (id, name, manufacturer, model)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, name, manufacturer, model FROM instruments ORDER BY name')
        results = cursor.fetchall()
        
        conn.close()
        return results

class InstrumentLabNotebook:
    """Main application class for instrumentation lab notebook"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("IntelliLab GC - Instrumentation Lab Notebook")
        self.root.geometry("1400x900")
        
        # Initialize databases
        self.compound_db = CompoundDatabase()
        self.method_db = MethodTemplateDatabase()
        self.instrument_db = InstrumentDatabase()
        
        # Current state
        self.current_instrument = None
        self.current_method = None
        self.active_modifications = []
        
        self.setup_gui()
        self.load_instrument_list()
    
    def setup_gui(self):
        """Setup main GUI interface"""
        
        # Create main menu
        self.setup_menu()
        
        # Create main paned window
        main_paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Left panel - Instrument fleet
        left_frame = ttk.LabelFrame(main_paned, text="🏭 Instrument Fleet (50+ GCs)", padding=10)
        main_paned.add(left_frame, weight=1)
        
        # Instrument list with search
        search_frame = ttk.Frame(left_frame)
        search_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Label(search_frame, text="Search:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var)
        self.search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.search_entry.bind('<KeyRelease>', self.filter_instruments)
        
        # Instrument tree
        self.instrument_tree = ttk.Treeview(left_frame, height=12)
        self.instrument_tree.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.instrument_tree['columns'] = ('Manufacturer', 'Model', 'Location', 'Status')
        self.instrument_tree.column('#0', width=150)
        self.instrument_tree.column('Manufacturer', width=100)
        self.instrument_tree.column('Model', width=100)
        self.instrument_tree.column('Location', width=80)
        self.instrument_tree.column('Status', width=80)
        
        self.instrument_tree.heading('#0', text='Instrument ID')
        self.instrument_tree.heading('Manufacturer', text='Make')
        self.instrument_tree.heading('Model', text='Model')
        self.instrument_tree.heading('Location', text='Location')
        self.instrument_tree.heading('Status', text='Status')
        
        self.instrument_tree.bind('<<TreeviewSelect>>', self.on_instrument_selected)
        
        # Instrument management buttons
        button_frame = ttk.Frame(left_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="➕ New GC", command=self.create_new_instrument).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="📋 Clone", command=self.clone_instrument).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="🔧 Modify", command=self.modify_instrument).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="📊 Report", command=self.generate_fleet_report).pack(side=tk.RIGHT, padx=2)
        
        # Right panel - Configuration and notebook
        right_frame = ttk.Frame(main_paned)
        main_paned.add(right_frame, weight=3)
        
        # Right panel notebook
        self.right_notebook = ttk.Notebook(right_frame)
        self.right_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Tab 1: Instrument Configuration
        self.config_tab = ttk.Frame(self.right_notebook)
        self.right_notebook.add(self.config_tab, text="🔧 Instrument Config")
        self.setup_instrument_config_tab()
        
        # Tab 2: Method Development
        self.method_tab = ttk.Frame(self.right_notebook)
        self.right_notebook.add(self.method_tab, text="📋 Method Development")
        self.setup_method_development_tab()
        
        # Tab 3: Run Log & Results
        self.run_tab = ttk.Frame(self.right_notebook)
        self.right_notebook.add(self.run_tab, text="📊 Run Log")
        self.setup_run_log_tab()
        
        # Tab 4: Performance Tracking
        self.performance_tab = ttk.Frame(self.right_notebook)
        self.right_notebook.add(self.performance_tab, text="📈 Performance")
        self.setup_performance_tab()
        
    def setup_menu(self):
        """Setup application menu"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Import Instrument Config", command=self.import_instrument_config)
        file_menu.add_command(label="Export Fleet Data", command=self.export_fleet_data)
        file_menu.add_separator()
        file_menu.add_command(label="Backup Database", command=self.backup_database)
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="🔍 Detection Limit Calculator", command=self.open_dl_calculator)
        tools_menu.add_command(label="📊 Method Comparison Tool", command=self.open_method_comparison)
        tools_menu.add_command(label="🏭 Fleet Status Dashboard", command=self.open_fleet_dashboard)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="Carrier Gas Calculator", command=self.open_carrier_calculator)
        help_menu.add_command(label="Resolution Predictor", command=self.open_resolution_predictor)
        help_menu.add_command(label="About", command=self.show_about)
    
    def setup_instrument_config_tab(self):
        """Setup instrument configuration interface"""
        
        # Create a simple message for now
        config_frame = ttk.LabelFrame(self.config_tab, text="Instrument Configuration", padding=20)
        config_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(config_frame, text="🔧 Instrument Configuration", font=("Arial", 16, "bold")).pack(pady=10)
        ttk.Label(config_frame, text="This tab will contain instrument configuration tools.", font=("Arial", 12)).pack(pady=5)
        ttk.Label(config_frame, text="Features: Dual injection channels, carrier gas optimization, detector setup", wrap=400).pack(pady=5)
        
        # Initialize required variables for parameter controls
        self.injector_temp_var = tk.DoubleVar(value=250.0)
        self.split_ratio_var = tk.DoubleVar(value=20.0)
        self.flow_rate_var = tk.DoubleVar(value=2.0)
        self.carrier_gas_var = tk.StringVar(value="Helium")
        self.detector_type_var = tk.StringVar(value="FID")
        self.detector_temp_var = tk.DoubleVar(value=280.0)
        self.h2_flow_var = tk.DoubleVar(value=40.0)
        self.air_flow_var = tk.DoubleVar(value=400.0)
        
        # Oven variables
        self.initial_temp_var = tk.DoubleVar(value=40.0)
        self.initial_hold_var = tk.DoubleVar(value=5.0)
        self.ramp_rate_var = tk.DoubleVar(value=10.0)
        self.final_temp_var = tk.DoubleVar(value=200.0)
        
        # Form variables
        self.id_var = tk.StringVar()
        self.name_var = tk.StringVar()
        self.manufacturer_var = tk.StringVar()
        self.model_var = tk.StringVar()
        self.serial_var = tk.StringVar()
        self.location_var = tk.StringVar()
        
        # Run variables
        self.sample_id_var = tk.StringVar()
        self.sample_type_var = tk.StringVar()
        self.analyst_var = tk.StringVar()
        self.run_method_var = tk.StringVar()
        
        # Method variables
        self.base_method_var = tk.StringVar()
        
        # Oven program variables
        self.oven_initial_var = tk.DoubleVar(value=40.0)
        self.oven_hold_var = tk.DoubleVar(value=5.0)
        self.oven_ramp_var = tk.DoubleVar(value=10.0)
        self.oven_final_var = tk.DoubleVar(value=200.0)
    
    def setup_method_development_tab(self):
        """Setup method development and modification interface"""
        
        method_frame = ttk.LabelFrame(self.method_tab, text="Method Development", padding=20)
        method_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(method_frame, text="📋 Method Development", font=("Arial", 16, "bold")).pack(pady=10)
        ttk.Label(method_frame, text="Push ASTM limits for enhanced detection capabilities.", font=("Arial", 12)).pack(pady=5)
        ttk.Label(method_frame, text="Features: ASTM base methods, real-time optimization, carrier gas modeling", wrap=400).pack(pady=5)
    
    def setup_run_log_tab(self):
        """Setup run logging and results tracking"""
        
        run_frame = ttk.LabelFrame(self.run_tab, text="Run Log & Results", padding=20)
        run_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(run_frame, text="📊 Run Log & Results", font=("Arial", 16, "bold")).pack(pady=10)
        ttk.Label(run_frame, text="Professional lab notebook with full traceability.", font=("Arial", 12)).pack(pady=5)
        ttk.Label(run_frame, text="Features: Analysis tracking, detection limit achievements, method deviations", wrap=400).pack(pady=5)
        
        # Create run tree for display
        self.run_tree = ttk.Treeview(run_frame)
        self.run_tree.pack(fill=tk.BOTH, expand=True, pady=10)
    
    def setup_performance_tab(self):
        """Setup performance tracking and optimization"""
        
        perf_frame = ttk.LabelFrame(self.performance_tab, text="Performance Tracking", padding=20)
        perf_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(perf_frame, text="📈 Performance Tracking", font=("Arial", 16, "bold")).pack(pady=10)
        ttk.Label(perf_frame, text="Monitor detection limits and instrument performance.", font=("Arial", 12)).pack(pady=5)
        ttk.Label(perf_frame, text="Features: Detection limit trends, baseline stability, fleet comparison", wrap=400).pack(pady=5)
        
        # Create performance chart area
        try:
            self.dl_fig, self.dl_ax = plt.subplots(figsize=(8, 4))
            self.dl_canvas = FigureCanvasTkAgg(self.dl_fig, perf_frame)
            self.dl_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True, pady=10)
        except Exception as e:
            ttk.Label(perf_frame, text=f"Matplotlib not available: {e}").pack(pady=10)
    
    # Event handlers and utility methods
    def load_instrument_list(self):
        """Load instrument list from database"""
        instruments = self.instrument_db.get_all_instruments()
        
        # Clear existing items
        for item in self.instrument_tree.get_children():
            self.instrument_tree.delete(item)
        
        # Add instruments to tree
        for inst_id, name, manufacturer, model in instruments:
            # Mock status - would be real in production
            status = "Online" if hash(inst_id) % 3 == 0 else "Offline"
            location = f"Lab {hash(inst_id) % 5 + 1}"
            
            self.instrument_tree.insert('', 'end', 
                                      text=inst_id,
                                      values=(manufacturer, model, location, status))
    
    def create_new_instrument(self):
        """Create new instrument configuration"""
        messagebox.showinfo("New Instrument", "Creating new instrument configuration...")
    
    def clone_instrument(self):
        """Clone selected instrument configuration"""
        messagebox.showinfo("Clone", "Cloning instrument configuration...")
    
    def modify_instrument(self):
        """Open instrument for modification"""
        messagebox.showinfo("Modify", "Opening instrument for modification...")
    
    def generate_fleet_report(self):
        """Generate fleet report"""
        messagebox.showinfo("Fleet Report", "Generating fleet performance report...")
    
    def on_instrument_selected(self, event=None):
        """Handle instrument selection from tree"""
        selection = self.instrument_tree.selection()
        if selection:
            item = self.instrument_tree.item(selection[0])
            instrument_id = item['text']
            messagebox.showinfo("Selected", f"Selected instrument: {instrument_id}")
    
    def filter_instruments(self, event=None):
        """Filter instrument list based on search"""
        search_term = self.search_var.get().lower()
        
        # Clear current tree
        for item in self.instrument_tree.get_children():
            self.instrument_tree.delete(item)
        
        # Get all instruments and filter
        instruments = self.instrument_db.get_all_instruments()
        
        for inst_id, name, manufacturer, model in instruments:
            if (search_term in inst_id.lower() or 
                search_term in name.lower() or 
                search_term in manufacturer.lower() or
                search_term in model.lower()):
                
                status = "Online" if hash(inst_id) % 3 == 0 else "Offline"
                location = f"Lab {hash(inst_id) % 5 + 1}"
                
                self.instrument_tree.insert('', 'end',
                                          text=inst_id,
                                          values=(manufacturer, model, location, status))
    
    # Menu handlers - simplified stubs
    def open_dl_calculator(self):
        """Open detection limit calculator tool"""
        messagebox.showinfo("Detection Limit Calculator", "Advanced detection limit optimization coming in Phase 3!")
    
    def open_method_comparison(self):
        """Open method comparison tool"""
        messagebox.showinfo("Method Comparison", "Method comparison tool coming in Phase 3!")
    
    def open_fleet_dashboard(self):
        """Open fleet status dashboard"""
        messagebox.showinfo("Fleet Dashboard", "Fleet status dashboard coming in Phase 3!")
    
    def open_carrier_calculator(self):
        """Open carrier gas calculator"""
        messagebox.showinfo("Carrier Calculator", "Carrier gas optimization calculator coming in Phase 3!")
    
    def open_resolution_predictor(self):
        """Open resolution predictor"""
        messagebox.showinfo("Resolution Predictor", "Resolution prediction tool coming in Phase 3!")
    
    def show_about(self):
        """Show about dialog"""
        about_text = """IntelliLab GC - Instrumentation Lab Notebook

Version: 2.0 (Phase 2 Foundation)

Features:
• Manage 50+ GC instruments with dual injections
• Method development beyond ASTM limits  
• Real-time parameter optimization
• Detection limit enhancement
• Carrier gas modeling
• Professional lab notebook

For Instrumentation Specialists in Midstream Facilities

Phase 3 Coming Soon:
• Advanced parameter controls
• Real-time detection limit prediction
• Method deviation tracking
• Performance analytics"""
        
        messagebox.showinfo("About IntelliLab GC", about_text)
    
    # File operations - simplified stubs
    def import_instrument_config(self):
        """Import instrument configuration from file"""
        messagebox.showinfo("Import", "Import instrument configuration coming in Phase 3!")
    
    def export_fleet_data(self):
        """Export fleet data to CSV"""
        messagebox.showinfo("Export", "Export fleet data coming in Phase 3!")
    
    def backup_database(self):
        """Backup the instrument database"""
        messagebox.showinfo("Backup", "Database backup functionality coming in Phase 3!")

# Main application entry point
if __name__ == "__main__":
    root = tk.Tk()
    app = InstrumentLabNotebook(root)
    root.mainloop()