#!/usr/bin/env python3
"""
IntelliLab GC - Oven Ramp Visualizer
Professional temperature program optimization for optimal separation and analysis time
"""

import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
from typing import Dict, List, Tuple
import json
from datetime import datetime

class GCOvenRampVisualizer:
    """Professional GC oven temperature program optimizer"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.setup_window()
        
        # Load databases FIRST
        self.column_database = self.load_column_database()
        self.compound_database = self.load_compound_database()
        
        self.setup_variables()
        self.create_interface()
        
        # Initialize with first calculation
        self.on_parameter_change()
        
    def setup_window(self):
        """Configure main window"""
        self.root.title("Oven Ramp Visualizer - IntelliLab GC")
        self.root.geometry("1400x900")
        self.root.configure(bg='#2b2b2b')
        
        # Apply dark theme
        style = ttk.Style()
        style.theme_use('clam')
        
    def setup_variables(self):
        """Initialize temperature program variables"""
        # Temperature program parameters
        self.initial_temp = tk.DoubleVar(value=50.0)
        self.initial_hold = tk.DoubleVar(value=2.0)
        self.ramp_rate_1 = tk.DoubleVar(value=10.0)
        self.final_temp_1 = tk.DoubleVar(value=150.0)
        self.hold_time_1 = tk.DoubleVar(value=0.0)
        self.ramp_rate_2 = tk.DoubleVar(value=5.0)
        self.final_temp_2 = tk.DoubleVar(value=280.0)
        self.final_hold = tk.DoubleVar(value=5.0)
        
        # Column parameters
        self.column_type = tk.StringVar(value="DB-5ms (30m x 0.25mm x 0.25um)")
        self.column_length = tk.DoubleVar(value=30.0)
        self.column_id = tk.DoubleVar(value=0.25)
        self.film_thickness = tk.DoubleVar(value=0.25)
        
        # Carrier gas parameters
        self.carrier_gas = tk.StringVar(value="Helium")
        self.flow_rate = tk.DoubleVar(value=1.2)
        self.pressure_mode = tk.StringVar(value="Constant Flow")
        
        # Sample parameters
        self.compound_class = tk.StringVar(value="Hydrocarbons")
        self.volatility_range = tk.StringVar(value="C8-C20")
        self.sample_complexity = tk.StringVar(value="Medium")
        
        # Instrument condition parameters
        self.instrument_age = tk.DoubleVar(value=5.0)
        self.maintenance_level = tk.StringVar(value="Good")
        self.oven_calibration = tk.StringVar(value="Good")
        self.column_condition = tk.StringVar(value="Good")
        self.heating_rate_limit = tk.DoubleVar(value=20.0)  # Real-world heating rate limitation
        
        # Results
        self.total_runtime = tk.StringVar(value="Not calculated")
        self.resolution_score = tk.StringVar(value="Not calculated")
        self.efficiency_score = tk.StringVar(value="Not calculated")
        self.optimization_score = tk.StringVar(value="Not calculated")
        
        # Real-time simulation flag
        self.realtime_enabled = tk.BooleanVar(value=True)
        
        # Chromatogram simulation data
        self.chromatogram_data = None
        self.peak_data = None
        
    def create_interface(self):
        """Create the main interface"""
        
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        title_label = ttk.Label(header_frame, text="Oven Ramp Visualizer", 
                               font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        subtitle_label = ttk.Label(header_frame, text="Optimize temperature programs for maximum separation efficiency", 
                                  font=("Arial", 11), foreground='gray')
        subtitle_label.pack(side=tk.LEFT, padx=(20, 0))
        
        # Main content paned window
        content_paned = ttk.PanedWindow(main_frame, orient=tk.HORIZONTAL)
        content_paned.pack(fill=tk.BOTH, expand=True)
        
        # Left panel - Parameter controls
        left_panel = self.create_parameter_panel(content_paned)
        content_paned.add(left_panel, weight=1)
        
        # Right panel - Results and visualization
        right_panel = self.create_results_panel(content_paned)
        content_paned.add(right_panel, weight=2)
        
    def create_parameter_panel(self, parent):
        """Create parameter input panel"""
        
        panel = ttk.LabelFrame(parent, text="Temperature Program Configuration", padding=10)
        
        # Create notebook for parameter categories
        param_notebook = ttk.Notebook(panel)
        param_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Temperature program tab
        self.create_temperature_tab(param_notebook)
        
        # Column tab
        self.create_column_tab(param_notebook)
        
        # Sample tab
        self.create_sample_tab(param_notebook)
        
        # Instrument condition tab
        self.create_instrument_condition_tab(param_notebook)
        
        # Optimize button
        optimize_frame = ttk.Frame(panel)
        optimize_frame.pack(fill=tk.X, pady=(10, 0))
        
        optimize_btn = ttk.Button(optimize_frame, text="Optimize Temperature Program", 
                                 command=self.optimize_program)
        optimize_btn.pack(fill=tk.X)
        
        # Integration buttons
        integration_frame = ttk.LabelFrame(panel, text="Integration with Other Tools", padding=10)
        integration_frame.pack(fill=tk.X, pady=(10, 0))
        
        export_btn = ttk.Button(integration_frame, text="Export to Inlet Simulator", 
                               command=self.export_to_inlet_simulator)
        export_btn.pack(fill=tk.X, pady=(0, 5))
        
        import_btn = ttk.Button(integration_frame, text="Import from Inlet Simulator", 
                               command=self.import_from_inlet_simulator)
        import_btn.pack(fill=tk.X)
        
        # Real-time simulation toggle
        realtime_cb = ttk.Checkbutton(optimize_frame, text="Real-time optimization", 
                                     variable=self.realtime_enabled, command=self.toggle_realtime)
        realtime_cb.pack(pady=(5, 0))
        
        return panel

    def create_temperature_tab(self, parent):
        frame = ttk.Frame(parent)
        parent.add(frame, text="Temperature Program")
        
        # Scrollable frame for all controls
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Initial Conditions
        initial_frame = ttk.LabelFrame(scrollable_frame, text="Initial Conditions", padding=10)
        initial_frame.pack(fill=tk.X, pady=10)
        initial_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(initial_frame, text="Initial Temp (C):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        initial_temp_scale = ttk.Scale(initial_frame, from_=30, to=150, variable=self.initial_temp, 
                                      orient=tk.HORIZONTAL, command=self.update_initial_temp_label)
        initial_temp_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.initial_temp_label = ttk.Label(initial_frame, text="50.0 C")
        self.initial_temp_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(initial_frame, text="Initial Hold (min):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        initial_hold_scale = ttk.Scale(initial_frame, from_=0, to=10, variable=self.initial_hold, 
                                      orient=tk.HORIZONTAL, command=self.update_initial_hold_label)
        initial_hold_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.initial_hold_label = ttk.Label(initial_frame, text="2.0 min")
        self.initial_hold_label.grid(row=1, column=2, padx=5, pady=2)
        
        # First Ramp
        ramp1_frame = ttk.LabelFrame(scrollable_frame, text="First Ramp", padding=10)
        ramp1_frame.pack(fill=tk.X, pady=10)
        ramp1_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(ramp1_frame, text="Ramp Rate (C/min):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ramp1_rate_scale = ttk.Scale(ramp1_frame, from_=1, to=30, variable=self.ramp_rate_1, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp1_rate_label)
        ramp1_rate_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp1_rate_label = ttk.Label(ramp1_frame, text="10.0 C/min")
        self.ramp1_rate_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(ramp1_frame, text="Final Temp (C):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ramp1_temp_scale = ttk.Scale(ramp1_frame, from_=100, to=250, variable=self.final_temp_1, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp1_temp_label)
        ramp1_temp_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp1_temp_label = ttk.Label(ramp1_frame, text="150.0 C")
        self.ramp1_temp_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(ramp1_frame, text="Hold Time (min):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        ramp1_hold_scale = ttk.Scale(ramp1_frame, from_=0, to=10, variable=self.hold_time_1, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp1_hold_label)
        ramp1_hold_scale.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp1_hold_label = ttk.Label(ramp1_frame, text="0.0 min")
        self.ramp1_hold_label.grid(row=2, column=2, padx=5, pady=2)
        
        # Second Ramp
        ramp2_frame = ttk.LabelFrame(scrollable_frame, text="Second Ramp", padding=10)
        ramp2_frame.pack(fill=tk.X, pady=10)
        ramp2_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(ramp2_frame, text="Ramp Rate (C/min):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ramp2_rate_scale = ttk.Scale(ramp2_frame, from_=1, to=20, variable=self.ramp_rate_2, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp2_rate_label)
        ramp2_rate_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp2_rate_label = ttk.Label(ramp2_frame, text="5.0 C/min")
        self.ramp2_rate_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(ramp2_frame, text="Final Temp (C):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ramp2_temp_scale = ttk.Scale(ramp2_frame, from_=200, to=350, variable=self.final_temp_2, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp2_temp_label)
        ramp2_temp_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp2_temp_label = ttk.Label(ramp2_frame, text="280.0 C")
        self.ramp2_temp_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(ramp2_frame, text="Final Hold (min):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        ramp2_hold_scale = ttk.Scale(ramp2_frame, from_=0, to=15, variable=self.final_hold, 
                                    orient=tk.HORIZONTAL, command=self.update_ramp2_hold_label)
        ramp2_hold_scale.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.ramp2_hold_label = ttk.Label(ramp2_frame, text="5.0 min")
        self.ramp2_hold_label.grid(row=2, column=2, padx=5, pady=2)
        
        # Pack the scrollable components
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def create_column_tab(self, parent):
        frame = ttk.Frame(parent)
        parent.add(frame, text="Column")
        
        # Scrollable frame
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Column Selection
        column_frame = ttk.LabelFrame(scrollable_frame, text="Column Selection", padding=10)
        column_frame.pack(fill=tk.X, pady=10)
        column_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(column_frame, text="Column Type:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        column_combo = ttk.Combobox(column_frame, textvariable=self.column_type, 
                                   values=list(self.column_database.keys()), state="readonly")
        column_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        column_combo.bind('<<ComboboxSelected>>', self.on_column_change)
        
        # Column Parameters
        params_frame = ttk.LabelFrame(scrollable_frame, text="Column Parameters", padding=10)
        params_frame.pack(fill=tk.X, pady=10)
        params_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(params_frame, text="Length (m):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        length_scale = ttk.Scale(params_frame, from_=10, to=60, variable=self.column_length, 
                                orient=tk.HORIZONTAL, command=self.update_length_label)
        length_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.length_label = ttk.Label(params_frame, text="30.0 m")
        self.length_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(params_frame, text="ID (mm):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        id_scale = ttk.Scale(params_frame, from_=0.1, to=0.53, variable=self.column_id, 
                            orient=tk.HORIZONTAL, command=self.update_id_label)
        id_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.id_label = ttk.Label(params_frame, text="0.25 mm")
        self.id_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(params_frame, text="Film (μm):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        film_scale = ttk.Scale(params_frame, from_=0.1, to=5.0, variable=self.film_thickness, 
                              orient=tk.HORIZONTAL, command=self.update_film_label)
        film_scale.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.film_label = ttk.Label(params_frame, text="0.25 μm")
        self.film_label.grid(row=2, column=2, padx=5, pady=2)
        
        # Carrier Gas
        gas_frame = ttk.LabelFrame(scrollable_frame, text="Carrier Gas", padding=10)
        gas_frame.pack(fill=tk.X, pady=10)
        gas_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(gas_frame, text="Gas Type:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        gas_combo = ttk.Combobox(gas_frame, textvariable=self.carrier_gas, 
                                values=["Helium", "Hydrogen", "Nitrogen"], state="readonly")
        gas_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        gas_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(gas_frame, text="Flow Rate (mL/min):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        flow_scale = ttk.Scale(gas_frame, from_=0.5, to=3.0, variable=self.flow_rate, 
                              orient=tk.HORIZONTAL, command=self.update_flow_label)
        flow_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.flow_label = ttk.Label(gas_frame, text="1.2 mL/min")
        self.flow_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(gas_frame, text="Pressure Mode:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        pressure_combo = ttk.Combobox(gas_frame, textvariable=self.pressure_mode, 
                                    values=["Constant Flow", "Constant Pressure"], state="readonly")
        pressure_combo.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        pressure_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Pack the scrollable components
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def create_sample_tab(self, parent):
        frame = ttk.Frame(parent)
        parent.add(frame, text="Sample")
        
        # Scrollable frame
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Compound Class Selection
        compound_frame = ttk.LabelFrame(scrollable_frame, text="Compound Class", padding=10)
        compound_frame.pack(fill=tk.X, pady=10)
        compound_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(compound_frame, text="Compound Class:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        compound_combo = ttk.Combobox(compound_frame, textvariable=self.compound_class, 
                                    values=list(self.compound_database.keys()), state="readonly")
        compound_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        compound_combo.bind('<<ComboboxSelected>>', self.on_compound_change)
        
        # Volatility Range
        volatility_frame = ttk.LabelFrame(scrollable_frame, text="Volatility Range", padding=10)
        volatility_frame.pack(fill=tk.X, pady=10)
        volatility_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(volatility_frame, text="Carbon Range:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        volatility_combo = ttk.Combobox(volatility_frame, textvariable=self.volatility_range, 
                                      values=["C5-C10", "C8-C20", "C10-C30", "C15-C40", "C20-C50"], 
                                      state="readonly")
        volatility_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        volatility_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Sample Complexity
        complexity_frame = ttk.LabelFrame(scrollable_frame, text="Sample Complexity", padding=10)
        complexity_frame.pack(fill=tk.X, pady=10)
        complexity_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(complexity_frame, text="Complexity Level:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        complexity_combo = ttk.Combobox(complexity_frame, textvariable=self.sample_complexity, 
                                      values=["Simple", "Medium", "Complex"], state="readonly")
        complexity_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        complexity_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Optimization Recommendations
        rec_frame = ttk.LabelFrame(scrollable_frame, text="Optimization Recommendations", padding=10)
        rec_frame.pack(fill=tk.X, pady=10)
        
        self.recommendation_text = tk.Text(rec_frame, height=8, width=50, wrap=tk.WORD)
        self.recommendation_text.pack(fill=tk.BOTH, expand=True)
        self.recommendation_text.insert(tk.END, "Select compound class and volatility range for specific recommendations.")
        self.recommendation_text.config(state=tk.DISABLED)
        
        # Pack the scrollable components
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def create_instrument_condition_tab(self, parent):
        frame = ttk.Frame(parent)
        parent.add(frame, text="Instrument Condition")
        
        # Scrollable frame
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Instrument Age Effects
        age_frame = ttk.LabelFrame(scrollable_frame, text="Instrument Age Effects", padding=10)
        age_frame.pack(fill=tk.X, pady=10)
        age_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(age_frame, text="Instrument Age (years):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        age_scale = ttk.Scale(age_frame, from_=0, to=15, variable=self.instrument_age, 
                             orient=tk.HORIZONTAL, command=self.update_age_label)
        age_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.age_label = ttk.Label(age_frame, text="5.0 years")
        self.age_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Heating Rate Limitations
        heating_frame = ttk.LabelFrame(scrollable_frame, text="Heating Rate Limitations", padding=10)
        heating_frame.pack(fill=tk.X, pady=10)
        heating_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(heating_frame, text="Max Heating Rate (C/min):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        heating_scale = ttk.Scale(heating_frame, from_=5, to=30, variable=self.heating_rate_limit, 
                                 orient=tk.HORIZONTAL, command=self.update_heating_label)
        heating_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        self.heating_label = ttk.Label(heating_frame, text="20.0 C/min")
        self.heating_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Maintenance Level
        maintenance_frame = ttk.LabelFrame(scrollable_frame, text="Maintenance Level", padding=10)
        maintenance_frame.pack(fill=tk.X, pady=10)
        maintenance_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(maintenance_frame, text="Maintenance Level:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        maintenance_combo = ttk.Combobox(maintenance_frame, textvariable=self.maintenance_level, 
                                       values=["Poor", "Fair", "Good", "Excellent"], state="readonly")
        maintenance_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        maintenance_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Oven Calibration
        calibration_frame = ttk.LabelFrame(scrollable_frame, text="Oven Calibration", padding=10)
        calibration_frame.pack(fill=tk.X, pady=10)
        calibration_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(calibration_frame, text="Calibration Status:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        calibration_combo = ttk.Combobox(calibration_frame, textvariable=self.oven_calibration, 
                                       values=["Poor", "Fair", "Good", "Excellent"], state="readonly")
        calibration_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        calibration_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Column Condition
        column_condition_frame = ttk.LabelFrame(scrollable_frame, text="Column Condition", padding=10)
        column_condition_frame.pack(fill=tk.X, pady=10)
        column_condition_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(column_condition_frame, text="Column Condition:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        column_condition_combo = ttk.Combobox(column_condition_frame, textvariable=self.column_condition, 
                                            values=["Poor", "Fair", "Good", "Excellent"], state="readonly")
        column_condition_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        column_condition_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Real-world Effects Summary
        effects_frame = ttk.LabelFrame(scrollable_frame, text="Real-World Effects Summary", padding=10)
        effects_frame.pack(fill=tk.X, pady=10)
        
        self.effects_text = tk.Text(effects_frame, height=6, width=50, wrap=tk.WORD)
        self.effects_text.pack(fill=tk.BOTH, expand=True)
        self.effects_text.insert(tk.END, "Adjust instrument parameters to see real-world effects on temperature programs.")
        self.effects_text.config(state=tk.DISABLED)
        
        # Pack the scrollable components
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def create_results_panel(self, parent):
        panel = ttk.Frame(parent)
        
        # Results summary frame
        results_frame = ttk.LabelFrame(panel, text="Optimization Results", padding=10)
        results_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Results grid
        results_grid = ttk.Frame(results_frame)
        results_grid.pack(fill=tk.X)
        results_grid.grid_columnconfigure(1, weight=1)
        
        ttk.Label(results_grid, text="Total Runtime:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Label(results_grid, textvariable=self.total_runtime, font=("Arial", 10, "bold")).grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(results_grid, text="Resolution Score:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Label(results_grid, textvariable=self.resolution_score, font=("Arial", 10, "bold")).grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(results_grid, text="Efficiency Score:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Label(results_grid, textvariable=self.efficiency_score, font=("Arial", 10, "bold")).grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(results_grid, text="Overall Score:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Label(results_grid, textvariable=self.optimization_score, font=("Arial", 10, "bold")).grid(row=3, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Visualization frame
        viz_frame = ttk.LabelFrame(panel, text="Temperature Program Visualization", padding=20)
        viz_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create matplotlib plot
        self.fig, self.ax = plt.subplots(figsize=(10, 6))
        self.fig.patch.set_facecolor('#2b2b2b')
        
        self.ax.set_title('Temperature Program Profile (Real-World Effects)', color='white', fontsize=14)
        self.ax.set_xlabel('Time (minutes)', color='white')
        self.ax.set_ylabel('Temperature (°C)', color='white')
        self.ax.set_facecolor('#3c3c3c')
        self.ax.tick_params(colors='white')
        self.ax.grid(True, alpha=0.3, color='white')
        for spine in self.ax.spines.values():
            spine.set_color('white')
        
        # Initial plot
        times = np.array([0, 2, 12, 37])
        temps = np.array([50, 50, 150, 280])
        self.ax.plot(times, temps, 'cyan', linewidth=3, marker='o', markersize=8, label='Initial Profile')
        self.ax.legend(loc='upper left')
        
        self.canvas = FigureCanvasTkAgg(self.fig, viz_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        
        return panel
        
    def update_initial_temp_label(self, event=None):
        """Update initial temperature label"""
        self.initial_temp_label.config(text=f"{self.initial_temp.get():.1f} C")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_initial_hold_label(self, event=None):
        """Update initial hold time label"""
        self.initial_hold_label.config(text=f"{self.initial_hold.get():.1f} min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp1_rate_label(self, event=None):
        """Update first ramp rate label"""
        self.ramp1_rate_label.config(text=f"{self.ramp_rate_1.get():.1f} C/min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp1_temp_label(self, event=None):
        """Update first ramp final temperature label"""
        self.ramp1_temp_label.config(text=f"{self.final_temp_1.get():.1f} C")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp1_hold_label(self, event=None):
        """Update first ramp hold time label"""
        self.ramp1_hold_label.config(text=f"{self.hold_time_1.get():.1f} min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp2_rate_label(self, event=None):
        """Update second ramp rate label"""
        self.ramp2_rate_label.config(text=f"{self.ramp_rate_2.get():.1f} C/min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp2_temp_label(self, event=None):
        """Update second ramp final temperature label"""
        self.ramp2_temp_label.config(text=f"{self.final_temp_2.get():.1f} C")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_ramp2_hold_label(self, event=None):
        """Update second ramp final hold time label"""
        self.ramp2_hold_label.config(text=f"{self.final_hold.get():.1f} min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_length_label(self, event=None):
        """Update column length label"""
        self.length_label.config(text=f"{self.column_length.get():.1f} m")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_id_label(self, event=None):
        """Update column ID label"""
        self.id_label.config(text=f"{self.column_id.get():.2f} mm")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_film_label(self, event=None):
        """Update film thickness label"""
        self.film_label.config(text=f"{self.film_thickness.get():.2f} μm")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_flow_label(self, event=None):
        """Update flow rate label"""
        self.flow_label.config(text=f"{self.flow_rate.get():.1f} mL/min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def on_column_change(self, event=None):
        """Handle column type change"""
        # Update column parameters based on selection
        column_info = self.column_database.get(self.column_type.get(), {})
        if column_info:
            self.column_length.set(column_info.get('length', 30.0))
            self.column_id.set(column_info.get('id', 0.25))
            self.film_thickness.set(column_info.get('film', 0.25))
            self.update_length_label()
            self.update_id_label()
            self.update_film_label()
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_age_label(self, event=None):
        """Update instrument age label"""
        self.age_label.config(text=f"{self.instrument_age.get():.1f} years")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_heating_label(self, event=None):
        """Update heating rate limit label"""
        self.heating_label.config(text=f"{self.heating_rate_limit.get():.1f} C/min")
        if self.realtime_enabled.get():
            self.update_plot()
    
    def on_compound_change(self, event=None):
        """Handle compound class change"""
        self.update_recommendations()
        if self.realtime_enabled.get():
            self.update_plot()
    
    def update_recommendations(self):
        """Update compound-specific recommendations"""
        compound = self.compound_class.get()
        volatility = self.volatility_range.get()
        
        recommendations = self.get_compound_recommendations(compound, volatility)
        
        self.recommendation_text.config(state=tk.NORMAL)
        self.recommendation_text.delete(1.0, tk.END)
        self.recommendation_text.insert(tk.END, recommendations)
        self.recommendation_text.config(state=tk.DISABLED)
    
    def get_compound_recommendations(self, compound, volatility):
        """Get compound-specific temperature program recommendations"""
        recommendations = {
            "Hydrocarbons": {
                "C5-C10": "• Initial temperature: 40-60°C\n• Ramp rate: 8-12°C/min\n• Final temperature: 120-150°C\n• Focus on early elution optimization",
                "C8-C20": "• Initial temperature: 50-70°C\n• Ramp rate: 6-10°C/min\n• Final temperature: 180-220°C\n• Balance resolution and analysis time",
                "C10-C30": "• Initial temperature: 60-80°C\n• Ramp rate: 4-8°C/min\n• Final temperature: 250-300°C\n• Optimize for late eluting compounds",
                "C15-C40": "• Initial temperature: 70-90°C\n• Ramp rate: 3-6°C/min\n• Final temperature: 300-350°C\n• Consider column temperature limits",
                "C20-C50": "• Initial temperature: 80-100°C\n• Ramp rate: 2-5°C/min\n• Final temperature: 320-380°C\n• Monitor column degradation"
            }
        }
        
        return recommendations.get(compound, {}).get(volatility, "Select compound class and volatility range for recommendations.")
    
    def on_parameter_change(self, event=None):
        """Handle parameter changes"""
        self.update_plot()
        self.update_effects_summary()
    
    def update_effects_summary(self):
        """Update real-world effects summary"""
        age = self.instrument_age.get()
        heating_limit = self.heating_rate_limit.get()
        maintenance = self.maintenance_level.get()
        calibration = self.oven_calibration.get()
        column_condition = self.column_condition.get()
        
        effects = []
        
        if age > 10:
            effects.append(f"• Instrument age ({age:.1f} years) may limit heating rates")
        if heating_limit < 15:
            effects.append(f"• Heating rate limited to {heating_limit:.1f}°C/min")
        if maintenance in ["Poor", "Fair"]:
            effects.append(f"• Maintenance level ({maintenance}) may affect temperature accuracy")
        if calibration in ["Poor", "Fair"]:
            effects.append(f"• Oven calibration ({calibration}) may cause temperature deviations")
        if column_condition in ["Poor", "Fair"]:
            effects.append(f"• Column condition ({column_condition}) may affect resolution")
        
        if not effects:
            effects.append("• Instrument conditions are optimal for temperature programming")
        
        self.effects_text.config(state=tk.NORMAL)
        self.effects_text.delete(1.0, tk.END)
        self.effects_text.insert(tk.END, "\n".join(effects))
        self.effects_text.config(state=tk.DISABLED)
        
    def update_plot(self):
        """Update the temperature profile plot with real-world effects"""
        self.ax.clear()
        
        # Calculate temperature program with real-world limitations
        times, temps, actual_rates = self.calculate_temperature_profile()
        
        # Plot theoretical vs actual temperature profile
        theoretical_times = np.array([0, self.initial_hold.get(), 
                                    self.initial_hold.get() + (self.final_temp_1.get() - self.initial_temp.get()) / self.ramp_rate_1.get(),
                                    self.initial_hold.get() + (self.final_temp_1.get() - self.initial_temp.get()) / self.ramp_rate_1.get() + self.hold_time_1.get(),
                                    self.initial_hold.get() + (self.final_temp_1.get() - self.initial_temp.get()) / self.ramp_rate_1.get() + self.hold_time_1.get() + (self.final_temp_2.get() - self.final_temp_1.get()) / self.ramp_rate_2.get(),
                                    self.initial_hold.get() + (self.final_temp_1.get() - self.initial_temp.get()) / self.ramp_rate_1.get() + self.hold_time_1.get() + (self.final_temp_2.get() - self.final_temp_1.get()) / self.ramp_rate_2.get() + self.final_hold.get()])
        
        theoretical_temps = np.array([self.initial_temp.get(), self.initial_temp.get(), 
                                    self.final_temp_1.get(), self.final_temp_1.get(),
                                    self.final_temp_2.get(), self.final_temp_2.get()])
        
        # Plot theoretical profile
        self.ax.plot(theoretical_times, theoretical_temps, 'cyan', linewidth=2, linestyle='--', 
                    label='Theoretical', alpha=0.7)
        
        # Plot actual profile with real-world effects
        self.ax.plot(times, temps, 'orange', linewidth=3, marker='o', markersize=6, 
                    label='Actual (with limitations)')
        
        # Add heating rate annotations
        for i, rate in enumerate(actual_rates):
            if i < len(times) - 1:
                mid_time = (times[i] + times[i+1]) / 2
                mid_temp = (temps[i] + temps[i+1]) / 2
                self.ax.annotate(f'{rate:.1f}°C/min', 
                               xy=(mid_time, mid_temp), 
                               xytext=(10, 10), textcoords='offset points',
                               bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7),
                               fontsize=8)
        
        self.ax.set_title('Temperature Program Profile (Real-World Effects)', color='white', fontsize=14)
        self.ax.set_xlabel('Time (minutes)', color='white')
        self.ax.set_ylabel('Temperature (°C)', color='white')
        self.ax.set_facecolor('#3c3c3c')
        self.ax.tick_params(colors='white')
        self.ax.grid(True, alpha=0.3, color='white')
        self.ax.legend(loc='upper left')
        
        for spine in self.ax.spines.values():
            spine.set_color('white')
            
        self.canvas.draw()
        
        # Update results
        self.update_results(times, temps)
        
        # Generate chromatogram simulation
        self.simulate_chromatogram(times, temps)
    
    def calculate_temperature_profile(self):
        """Calculate temperature profile with real-world limitations"""
        heating_limit = self.heating_rate_limit.get()
        age_factor = max(0.7, 1.0 - self.instrument_age.get() * 0.02)  # Age reduces efficiency
        maintenance_factor = {"Poor": 0.8, "Fair": 0.9, "Good": 0.95, "Excellent": 1.0}[self.maintenance_level.get()]
        calibration_factor = {"Poor": 0.85, "Fair": 0.92, "Good": 0.97, "Excellent": 1.0}[self.oven_calibration.get()]
        
        overall_factor = age_factor * maintenance_factor * calibration_factor
        
        # Calculate actual ramp rates (limited by instrument capabilities)
        actual_ramp1 = min(self.ramp_rate_1.get(), heating_limit * overall_factor)
        actual_ramp2 = min(self.ramp_rate_2.get(), heating_limit * overall_factor)
        
        # Calculate time points
        t0 = 0
        t1 = self.initial_hold.get()
        t2 = t1 + (self.final_temp_1.get() - self.initial_temp.get()) / actual_ramp1
        t3 = t2 + self.hold_time_1.get()
        t4 = t3 + (self.final_temp_2.get() - self.final_temp_1.get()) / actual_ramp2
        t5 = t4 + self.final_hold.get()
        
        times = np.array([t0, t1, t2, t3, t4, t5])
        temps = np.array([self.initial_temp.get(), self.initial_temp.get(), 
                         self.final_temp_1.get(), self.final_temp_1.get(),
                         self.final_temp_2.get(), self.final_temp_2.get()])
        
        actual_rates = [0, 0, actual_ramp1, 0, actual_ramp2, 0]
        
        return times, temps, actual_rates
    
    def update_results(self, times, temps):
        """Update calculation results"""
        total_time = times[-1]
        self.total_runtime.set(f"{total_time:.1f} minutes")
        
        # Calculate resolution score based on temperature program efficiency
        resolution_score = self.calculate_resolution_score(times, temps)
        self.resolution_score.set(f"{resolution_score:.1f}/10")
        
        # Calculate efficiency score
        efficiency_score = self.calculate_efficiency_score(times, temps)
        self.efficiency_score.set(f"{efficiency_score:.1f}/10")
        
        # Overall optimization score
        optimization_score = (resolution_score + efficiency_score) / 2
        self.optimization_score.set(f"{optimization_score:.1f}/10")
    
    def calculate_resolution_score(self, times, temps):
        """Calculate resolution score based on temperature program"""
        # Factors affecting resolution
        temp_range = max(temps) - min(temps)
        ramp_efficiency = 1.0
        
        if self.ramp_rate_1.get() > self.heating_rate_limit.get():
            ramp_efficiency *= 0.8
        
        if self.instrument_age.get() > 10:
            ramp_efficiency *= 0.9
        
        resolution_score = min(10, (temp_range / 300) * 5 + ramp_efficiency * 5)
        return resolution_score
    
    def calculate_efficiency_score(self, times, temps):
        """Calculate efficiency score based on analysis time and conditions"""
        total_time = times[-1]
        efficiency_score = 10 - (total_time / 60)  # Shorter time = higher efficiency
        
        # Adjust for real-world conditions
        if self.maintenance_level.get() in ["Poor", "Fair"]:
            efficiency_score *= 0.8
        
        return max(0, efficiency_score)
    
    def simulate_chromatogram(self, times, temps):
        """Simulate chromatogram based on temperature program"""
        # This is a simplified chromatogram simulation
        # In a real implementation, this would use retention time models
        
        # Generate retention times based on temperature program
        retention_times = []
        peak_heights = []
        
        # Simulate peaks for different compound classes
        compound_class = self.compound_class.get()
        volatility = self.volatility_range.get()
        
        if compound_class == "Hydrocarbons":
            if volatility == "C8-C20":
                # Simulate hydrocarbon peaks
                base_retention = 5.0
                for i in range(8, 21, 2):  # C8, C10, C12, etc.
                    retention = base_retention + (i - 8) * 1.5
                    if retention <= times[-1]:
                        retention_times.append(retention)
                        peak_heights.append(100 - (i - 8) * 3)  # Decreasing peak height
        
        # Store chromatogram data for potential plotting
        self.chromatogram_data = {
            'times': times,
            'temps': temps,
            'retention_times': retention_times,
            'peak_heights': peak_heights
        }
        
    def toggle_realtime(self):
        """Toggle real-time optimization"""
        pass
        
    def optimize_program(self):
        """Optimize temperature program based on current parameters"""
        # Get current parameters
        compound = self.compound_class.get()
        volatility = self.volatility_range.get()
        complexity = self.sample_complexity.get()
        
        # Apply compound-specific optimization
        optimized_params = self.get_optimized_parameters(compound, volatility, complexity)
        
        # Apply optimized parameters
        if optimized_params:
            self.initial_temp.set(optimized_params.get('initial_temp', self.initial_temp.get()))
            self.initial_hold.set(optimized_params.get('initial_hold', self.initial_hold.get()))
            self.ramp_rate_1.set(optimized_params.get('ramp_rate_1', self.ramp_rate_1.get()))
            self.final_temp_1.set(optimized_params.get('final_temp_1', self.final_temp_1.get()))
            self.hold_time_1.set(optimized_params.get('hold_time_1', self.hold_time_1.get()))
            self.ramp_rate_2.set(optimized_params.get('ramp_rate_2', self.ramp_rate_2.get()))
            self.final_temp_2.set(optimized_params.get('final_temp_2', self.final_temp_2.get()))
            self.final_hold.set(optimized_params.get('final_hold', self.final_hold.get()))
            
            # Update all labels
            self.update_initial_temp_label()
            self.update_initial_hold_label()
            self.update_ramp1_rate_label()
            self.update_ramp1_temp_label()
            self.update_ramp1_hold_label()
            self.update_ramp2_rate_label()
            self.update_ramp2_temp_label()
            self.update_ramp2_hold_label()
            
            # Update plot
            self.update_plot()
            
            messagebox.showinfo("Optimization Complete", 
                              f"Temperature program optimized for {compound} ({volatility})\n\n" +
                              f"Optimization Score: {self.optimization_score.get()}\n" +
                              f"Total Runtime: {self.total_runtime.get()}\n\n" +
                              "Parameters have been updated automatically.")
        else:
            messagebox.showwarning("Optimization", "No optimization parameters available for selected compound class.")
    
    def get_optimized_parameters(self, compound, volatility, complexity):
        """Get optimized parameters based on compound class and conditions"""
        optimization_library = {
            "Hydrocarbons": {
                "C8-C20": {
                    "initial_temp": 60.0,
                    "initial_hold": 2.0,
                    "ramp_rate_1": 8.0,
                    "final_temp_1": 180.0,
                    "hold_time_1": 1.0,
                    "ramp_rate_2": 4.0,
                    "final_temp_2": 280.0,
                    "final_hold": 5.0
                },
                "C10-C30": {
                    "initial_temp": 70.0,
                    "initial_hold": 2.0,
                    "ramp_rate_1": 6.0,
                    "final_temp_1": 220.0,
                    "hold_time_1": 1.0,
                    "ramp_rate_2": 3.0,
                    "final_temp_2": 320.0,
                    "final_hold": 8.0
                }
            }
        }
        
        # Get base parameters
        base_params = optimization_library.get(compound, {}).get(volatility, {})
        
        # Adjust for complexity
        if complexity == "Complex":
            # Slower ramps for better resolution
            base_params = {k: v * 0.8 if 'ramp_rate' in k else v for k, v in base_params.items()}
        elif complexity == "Simple":
            # Faster ramps for efficiency
            base_params = {k: v * 1.2 if 'ramp_rate' in k else v for k, v in base_params.items()}
        
        # Adjust for instrument limitations
        heating_limit = self.heating_rate_limit.get()
        for key in ['ramp_rate_1', 'ramp_rate_2']:
            if key in base_params and base_params[key] > heating_limit:
                base_params[key] = heating_limit * 0.9  # Leave some margin
        
        return base_params
    
    def export_to_inlet_simulator(self):
        """Export optimized temperature program to inlet simulator"""
        # Create method data for inlet simulator
        method_data = {
            "oven_parameters": {
                "initial_temp": self.initial_temp.get(),
                "initial_hold": self.initial_hold.get(),
                "ramp_rate_1": self.ramp_rate_1.get(),
                "final_temp_1": self.final_temp_1.get(),
                "hold_time_1": self.hold_time_1.get(),
                "ramp_rate_2": self.ramp_rate_2.get(),
                "final_temp_2": self.final_temp_2.get(),
                "final_hold": self.final_hold.get()
            },
            "column_parameters": {
                "column_type": self.column_type.get(),
                "column_length": self.column_length.get(),
                "column_id": self.column_id.get(),
                "film_thickness": self.film_thickness.get(),
                "carrier_gas": self.carrier_gas.get(),
                "flow_rate": self.flow_rate.get()
            },
            "optimization_results": {
                "total_runtime": self.total_runtime.get(),
                "resolution_score": self.resolution_score.get(),
                "efficiency_score": self.efficiency_score.get(),
                "optimization_score": self.optimization_score.get()
            },
            "export_info": {
                "export_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "source": "Oven Ramp Visualizer",
                "version": "1.0"
            }
        }
        
        # Save to file
        filename = f"oven_optimized_method_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w') as f:
                json.dump(method_data, f, indent=2)
            
            messagebox.showinfo("Export Successful", 
                              f"Temperature program exported to:\n{filename}\n\n" +
                              "You can now import this into the Inlet Simulator\n" +
                              "for complete method development.")
        except Exception as e:
            messagebox.showerror("Export Error", f"Failed to export: {str(e)}")
    
    def import_from_inlet_simulator(self):
        """Import parameters from inlet simulator"""
        from tkinter import filedialog
        
        filename = filedialog.askopenfilename(
            title="Select Inlet Simulator Export File",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                with open(filename, 'r') as f:
                    data = json.load(f)
                
                # Extract inlet parameters that affect oven programming
                inlet_params = data.get('inlet_parameters', {})
                
                # Update relevant parameters
                if 'injection_volume' in inlet_params:
                    # Adjust initial hold based on injection volume
                    volume = inlet_params['injection_volume']
                    if volume > 2.0:
                        self.initial_hold.set(self.initial_hold.get() + 1.0)
                
                if 'split_ratio' in inlet_params:
                    # Adjust flow rate based on split ratio
                    split_ratio = inlet_params['split_ratio']
                    if split_ratio > 50:
                        self.flow_rate.set(self.flow_rate.get() * 1.2)
                
                # Update labels and plot
                self.update_initial_hold_label()
                self.update_flow_label()
                self.update_plot()
                
                messagebox.showinfo("Import Successful", 
                                  f"Parameters imported from inlet simulator.\n" +
                                  f"File: {filename}\n\n" +
                                  "Temperature program has been adjusted accordingly.")
                
            except Exception as e:
                messagebox.showerror("Import Error", f"Failed to import: {str(e)}")
        
    def load_column_database(self):
        return {
            "DB-5ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25},
            "DB-5ms (60m x 0.25mm x 0.25um)": {"length": 60, "id": 0.25, "film": 0.25},
            "DB-1ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25},
            "DB-17ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25},
            "DB-WAX (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25},
            "DB-624 (30m x 0.25mm x 1.4um)": {"length": 30, "id": 0.25, "film": 1.4},
            "DB-1301 (30m x 0.25mm x 1.0um)": {"length": 30, "id": 0.25, "film": 1.0}
        }
        
    def load_compound_database(self):
        return {
            "Hydrocarbons": {"temp_range": [40, 320], "category": "Non-polar"},
            "Alcohols": {"temp_range": [50, 280], "category": "Polar"},
            "Esters": {"temp_range": [60, 300], "category": "Polar"},
            "Ketones": {"temp_range": [55, 290], "category": "Polar"},
            "Aldehydes": {"temp_range": [45, 285], "category": "Polar"},
            "Aromatics": {"temp_range": [70, 320], "category": "Non-polar"},
            "Halogenated": {"temp_range": [50, 310], "category": "Non-polar"},
            "Terpenes": {"temp_range": [80, 280], "category": "Non-polar"}
        }
        
    def run(self):
        """Start the application"""
        self.root.mainloop()

def main():
    """Main entry point"""
    app = GCOvenRampVisualizer()
    app.run()

if __name__ == "__main__":
    main()