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
        
        # Results
        self.total_runtime = tk.StringVar(value="Not calculated")
        self.resolution_score = tk.StringVar(value="Not calculated")
        self.efficiency_score = tk.StringVar(value="Not calculated")
        self.optimization_score = tk.StringVar(value="Not calculated")
        
        # Real-time simulation flag
        self.realtime_enabled = tk.BooleanVar(value=True)
        
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
        
        # Real-time simulation toggle
        realtime_cb = ttk.Checkbutton(optimize_frame, text="Real-time optimization", 
                                     variable=self.realtime_enabled, command=self.toggle_realtime)
        realtime_cb.pack(pady=(5, 0))
        
        return panel
        
    def create_temperature_tab(self, parent):
        """Create temperature program configuration tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Temperature Program")
        
        # Initial conditions
        initial_frame = ttk.LabelFrame(frame, text="Initial Conditions", padding=10)
        initial_frame.pack(fill=tk.X, pady=(0, 10))
        initial_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(initial_frame, text="Initial Temp (C):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        initial_temp_scale = ttk.Scale(initial_frame, from_=30, to=150, variable=self.initial_temp, 
                                      orient=tk.HORIZONTAL, command=self.on_parameter_change)
        initial_temp_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.initial_temp_label = ttk.Label(initial_frame, text="50.0 C")
        self.initial_temp_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(initial_frame, text="Initial Hold (min):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        initial_hold_scale = ttk.Scale(initial_frame, from_=0, to=10, variable=self.initial_hold, 
                                      orient=tk.HORIZONTAL, command=self.on_parameter_change)
        initial_hold_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.initial_hold_label = ttk.Label(initial_frame, text="2.0 min")
        self.initial_hold_label.grid(row=1, column=2, padx=5, pady=2)
        
        # Ramp 1
        ramp1_frame = ttk.LabelFrame(frame, text="First Ramp", padding=10)
        ramp1_frame.pack(fill=tk.X, pady=(0, 10))
        ramp1_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(ramp1_frame, text="Ramp Rate (C/min):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ramp1_scale = ttk.Scale(ramp1_frame, from_=1, to=50, variable=self.ramp_rate_1, 
                               orient=tk.HORIZONTAL, command=self.on_parameter_change)
        ramp1_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.ramp1_label = ttk.Label(ramp1_frame, text="10.0 C/min")
        self.ramp1_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(ramp1_frame, text="Final Temp (C):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        final1_scale = ttk.Scale(ramp1_frame, from_=50, to=350, variable=self.final_temp_1, 
                                orient=tk.HORIZONTAL, command=self.on_parameter_change)
        final1_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.final1_label = ttk.Label(ramp1_frame, text="150.0 C")
        self.final1_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(ramp1_frame, text="Hold Time (min):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        hold1_scale = ttk.Scale(ramp1_frame, from_=0, to=20, variable=self.hold_time_1, 
                               orient=tk.HORIZONTAL, command=self.on_parameter_change)
        hold1_scale.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.hold1_label = ttk.Label(ramp1_frame, text="0.0 min")
        self.hold1_label.grid(row=2, column=2, padx=5, pady=2)
        
        # Ramp 2
        ramp2_frame = ttk.LabelFrame(frame, text="Second Ramp", padding=10)
        ramp2_frame.pack(fill=tk.X, pady=(0, 10))
        ramp2_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(ramp2_frame, text="Ramp Rate (C/min):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ramp2_scale = ttk.Scale(ramp2_frame, from_=1, to=50, variable=self.ramp_rate_2, 
                               orient=tk.HORIZONTAL, command=self.on_parameter_change)
        ramp2_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.ramp2_label = ttk.Label(ramp2_frame, text="5.0 C/min")
        self.ramp2_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(ramp2_frame, text="Final Temp (C):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        final2_scale = ttk.Scale(ramp2_frame, from_=100, to=400, variable=self.final_temp_2, 
                                orient=tk.HORIZONTAL, command=self.on_parameter_change)
        final2_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.final2_label = ttk.Label(ramp2_frame, text="280.0 C")
        self.final2_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(ramp2_frame, text="Final Hold (min):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        final_hold_scale = ttk.Scale(ramp2_frame, from_=0, to=30, variable=self.final_hold, 
                                    orient=tk.HORIZONTAL, command=self.on_parameter_change)
        final_hold_scale.grid(row=2, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.final_hold_label = ttk.Label(ramp2_frame, text="5.0 min")
        self.final_hold_label.grid(row=2, column=2, padx=5, pady=2)
        
    def create_column_tab(self, parent):
        """Create column configuration tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Column")
        
        # Column selection
        column_frame = ttk.LabelFrame(frame, text="Column Selection", padding=10)
        column_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(column_frame, text="Column Type:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        column_combo = ttk.Combobox(column_frame, textvariable=self.column_type,
                                   values=list(self.column_database.keys()), state="readonly")
        column_combo.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        column_combo.bind('<<ComboboxSelected>>', self.on_column_change)
        
        # Column dimensions
        dim_frame = ttk.LabelFrame(frame, text="Column Dimensions", padding=10)
        dim_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(dim_frame, text="Length (m):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.length_label = ttk.Label(dim_frame, text="30.0 m", font=("Arial", 10, "bold"))
        self.length_label.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(dim_frame, text="Inner Diameter (mm):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.id_label = ttk.Label(dim_frame, text="0.25 mm", font=("Arial", 10, "bold"))
        self.id_label.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(dim_frame, text="Film Thickness (um):").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        self.film_label = ttk.Label(dim_frame, text="0.25 um", font=("Arial", 10, "bold"))
        self.film_label.grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Carrier gas
        carrier_frame = ttk.LabelFrame(frame, text="Carrier Gas", padding=10)
        carrier_frame.pack(fill=tk.X, pady=(0, 10))
        carrier_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(carrier_frame, text="Carrier Gas:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        carrier_combo = ttk.Combobox(carrier_frame, textvariable=self.carrier_gas,
                                    values=["Helium", "Hydrogen", "Nitrogen"], state="readonly")
        carrier_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        carrier_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(carrier_frame, text="Flow Rate (mL/min):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        flow_scale = ttk.Scale(carrier_frame, from_=0.5, to=5.0, variable=self.flow_rate, 
                              orient=tk.HORIZONTAL, command=self.on_parameter_change)
        flow_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.flow_label = ttk.Label(carrier_frame, text="1.2 mL/min")
        self.flow_label.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(carrier_frame, text="Pressure Mode:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        pressure_combo = ttk.Combobox(carrier_frame, textvariable=self.pressure_mode,
                                     values=["Constant Flow", "Constant Pressure", "Ramped Flow"], 
                                     state="readonly")
        pressure_combo.grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        pressure_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
    def create_sample_tab(self, parent):
        """Create sample parameters tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Sample")
        
        # Compound class
        compound_frame = ttk.LabelFrame(frame, text="Compound Class", padding=10)
        compound_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(compound_frame, text="Compound Type:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        compound_combo = ttk.Combobox(compound_frame, textvariable=self.compound_class,
                                     values=["Hydrocarbons", "Aromatics", "Alcohols", "Esters", 
                                            "Fatty Acids", "Pesticides", "Pharmaceuticals"], 
                                     state="readonly")
        compound_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        compound_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(compound_frame, text="Volatility Range:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        volatility_combo = ttk.Combobox(compound_frame, textvariable=self.volatility_range,
                                       values=["C4-C8", "C8-C12", "C8-C20", "C12-C24", "C20-C40"], 
                                       state="readonly")
        volatility_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        volatility_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(compound_frame, text="Sample Complexity:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        complexity_combo = ttk.Combobox(compound_frame, textvariable=self.sample_complexity,
                                       values=["Simple", "Medium", "Complex", "Very Complex"], 
                                       state="readonly")
        complexity_combo.grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        complexity_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Temperature recommendations
        rec_frame = ttk.LabelFrame(frame, text="Temperature Program Recommendations", padding=10)
        rec_frame.pack(fill=tk.BOTH, expand=True)
        
        self.temp_rec_label = ttk.Label(rec_frame, 
                                       text="Adjust parameters above to see compound-specific recommendations",
                                       font=("Arial", 10), justify=tk.LEFT, wraplength=300)
        self.temp_rec_label.pack(expand=True)
        
    def create_instrument_condition_tab(self, parent):
        """Create instrument condition tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Instrument Condition")
        
        # Instrument status
        status_frame = ttk.LabelFrame(frame, text="Instrument Status", padding=10)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        status_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(status_frame, text="Instrument Age (years):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        age_scale = ttk.Scale(status_frame, from_=0, to=30, variable=self.instrument_age, 
                             orient=tk.HORIZONTAL, command=self.on_parameter_change)
        age_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.age_label = ttk.Label(status_frame, text="5.0 years")
        self.age_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(status_frame, text="Maintenance Level:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        maintenance_combo = ttk.Combobox(status_frame, textvariable=self.maintenance_level,
                                        values=["Excellent", "Good", "Fair", "Poor", "Neglected"], 
                                        state="readonly")
        maintenance_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        maintenance_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Oven and column condition
        condition_frame = ttk.LabelFrame(frame, text="Component Condition", padding=10)
        condition_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(condition_frame, text="Oven Calibration:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        oven_combo = ttk.Combobox(condition_frame, textvariable=self.oven_calibration,
                                 values=["Excellent", "Good", "Fair", "Poor", "Uncalibrated"], 
                                 state="readonly")
        oven_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        oven_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(condition_frame, text="Column Condition:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        column_cond_combo = ttk.Combobox(condition_frame, textvariable=self.column_condition,
                                        values=["New", "Good", "Fair", "Degraded", "Needs Replacement"], 
                                        state="readonly")
        column_cond_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        column_cond_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Real-world impact
        impact_frame = ttk.LabelFrame(frame, text="Real-World Temperature Impact", padding=10)
        impact_frame.pack(fill=tk.BOTH, expand=True)
        
        self.temp_analysis = tk.Text(impact_frame, height=8, wrap=tk.WORD, font=("Arial", 9))
        temp_scroll = ttk.Scrollbar(impact_frame, command=self.temp_analysis.yview)
        self.temp_analysis.configure(yscrollcommand=temp_scroll.set)
        
        self.temp_analysis.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        temp_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
    def create_results_panel(self, parent):
        """Create results and visualization panel"""
        
        panel = ttk.Frame(parent)
        
        # Results notebook
        results_notebook = ttk.Notebook(panel)
        results_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Temperature program visualization
        self.create_visualization_tab(results_notebook)
        
        # Optimization results
        self.create_results_tab(results_notebook)
        
        # Method export
        self.create_export_tab(results_notebook)
        
        return panel
        
    def create_visualization_tab(self, parent):
        """Create temperature program visualization"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Temperature Program")
        
        # Create matplotlib figure
        self.fig, (self.ax1, self.ax2) = plt.subplots(2, 1, figsize=(12, 8))
        self.fig.patch.set_facecolor('#2b2b2b')
        
        # Configure plots
        self.ax1.set_title('Temperature Program Profile', color='white', fontsize=12)
        self.ax1.set_xlabel('Time (minutes)', color='white')
        self.ax1.set_ylabel('Temperature (C)', color='white')
        self.ax1.set_facecolor('#3c3c3c')
        self.ax1.tick_params(colors='white')
        self.ax1.grid(True, alpha=0.3, color='white')
        for spine in self.ax1.spines.values():
            spine.set_color('white')
            
        self.ax2.set_title('Predicted Chromatogram', color='white', fontsize=12)
        self.ax2.set_xlabel('Time (minutes)', color='white')
        self.ax2.set_ylabel('Signal Intensity', color='white')
        self.ax2.set_facecolor('#3c3c3c')
        self.ax2.tick_params(colors='white')
        self.ax2.grid(True, alpha=0.3, color='white')
        for spine in self.ax2.spines.values():
            spine.set_color('white')
        
        # Embed plot
        self.canvas = FigureCanvasTkAgg(self.fig, frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        
    def create_results_tab(self, parent):
        """Create optimization results tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Results")
        
        # Current results
        results_frame = ttk.LabelFrame(frame, text="Optimization Results", padding=15)
        results_frame.pack(fill=tk.X, pady=(0, 10))
        
        results_grid = ttk.Frame(results_frame)
        results_grid.pack()
        
        # Key metrics
        ttk.Label(results_grid, text="Total Runtime:", font=("Arial", 12, "bold")).grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        self.runtime_result_label = ttk.Label(results_grid, textvariable=self.total_runtime, 
                                             font=("Arial", 12), foreground='blue')
        self.runtime_result_label.grid(row=0, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Resolution Score:", font=("Arial", 12, "bold")).grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        self.resolution_result_label = ttk.Label(results_grid, textvariable=self.resolution_score, 
                                                font=("Arial", 12), foreground='green')
        self.resolution_result_label.grid(row=1, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Efficiency Score:", font=("Arial", 12, "bold")).grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.efficiency_result_label = ttk.Label(results_grid, textvariable=self.efficiency_score, 
                                                font=("Arial", 12), foreground='purple')
        self.efficiency_result_label.grid(row=2, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Optimization Score:", font=("Arial", 12, "bold")).grid(row=3, column=0, sticky=tk.W, padx=10, pady=5)
        self.opt_result_label = ttk.Label(results_grid, textvariable=self.optimization_score, 
                                         font=("Arial", 12), foreground='red')
        self.opt_result_label.grid(row=3, column=1, sticky=tk.W, padx=10, pady=5)
        
        # Detailed analysis
        analysis_frame = ttk.LabelFrame(frame, text="Detailed Analysis", padding=15)
        analysis_frame.pack(fill=tk.BOTH, expand=True)
        
        self.analysis_text = tk.Text(analysis_frame, height=15, wrap=tk.WORD, font=("Arial", 10))
        analysis_scroll = ttk.Scrollbar(analysis_frame, command=self.analysis_text.yview)
        self.analysis_text.configure(yscrollcommand=analysis_scroll.set)
        
        self.analysis_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        analysis_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
    def create_export_tab(self, parent):
        """Create export tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Export")
        
        export_frame = ttk.LabelFrame(frame, text="Method Export Options", padding=20)
        export_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Export buttons
        button_frame = ttk.Frame(export_frame)
        button_frame.pack(pady=20)
        
        ttk.Button(button_frame, text="Export to Inlet Simulator", 
                  command=self.export_to_inlet_sim).pack(fill=tk.X, pady=5)
        ttk.Button(button_frame, text="Export to Fleet Manager", 
                  command=self.export_to_fleet).pack(fill=tk.X, pady=5)
        ttk.Button(button_frame, text="Save Temperature Program", 
                  command=self.save_program).pack(fill=tk.X, pady=5)
        ttk.Button(button_frame, text="Generate Report", 
                  command=self.generate_report).pack(fill=tk.X, pady=5)
        
        # Method preview
        preview_frame = ttk.LabelFrame(export_frame, text="Program Preview", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(20, 0))
        
        self.program_preview = tk.Text(preview_frame, height=10, wrap=tk.WORD, font=("Courier", 9))
        preview_scroll = ttk.Scrollbar(preview_frame, command=self.program_preview.yview)
        self.program_preview.configure(yscrollcommand=preview_scroll.set)
        
        self.program_preview.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        preview_scroll.pack(side=tk.RIGHT, fill=tk.Y)
    
    # Event handlers and calculations
    def on_column_change(self, event=None):
        """Handle column type change"""
        column = self.column_type.get()
        if column in self.column_database:
            col_data = self.column_database[column]
            self.column_length.set(col_data['length'])
            self.column_id.set(col_data['id'])
            self.film_thickness.set(col_data['film'])
            
            self.length_label.config(text=f"{col_data['length']:.0f} m")
            self.id_label.config(text=f"{col_data['id']:.2f} mm")
            self.film_label.config(text=f"{col_data['film']:.2f} um")
        
        self.on_parameter_change()
    
    def on_parameter_change(self, event=None):
        """Handle parameter changes"""
        # Update display labels
        self.initial_temp_label.config(text=f"{self.initial_temp.get():.0f} C")
        self.initial_hold_label.config(text=f"{self.initial_hold.get():.1f} min")
        self.ramp1_label.config(text=f"{self.ramp_rate_1.get():.0f} C/min")
        self.final1_label.config(text=f"{self.final_temp_1.get():.0f} C")
        self.hold1_label.config(text=f"{self.hold_time_1.get():.1f} min")
        self.ramp2_label.config(text=f"{self.ramp_rate_2.get():.0f} C/min")
        self.final2_label.config(text=f"{self.final_temp_2.get():.0f} C")
        self.final_hold_label.config(text=f"{self.final_hold.get():.1f} min")
        self.flow_label.config(text=f"{self.flow_rate.get():.1f} mL/min")
        
        # Update instrument condition labels
        if hasattr(self, 'age_label'):
            self.age_label.config(text=f"{self.instrument_age.get():.0f} years")
        
        # Update recommendations
        self.update_temperature_recommendations()
        
        # Update real-world analysis
        self.update_real_world_analysis()
        
        # Update program preview
        self.update_program_preview()
        
        # Real-time optimization if enabled
        if self.realtime_enabled.get():
            self.optimize_program()
    
    def update_temperature_recommendations(self):
        """Update temperature program recommendations"""
        compound = self.compound_class.get()
        volatility = self.volatility_range.get()
        complexity = self.sample_complexity.get()
        
        recommendations = f"Temperature Program for {compound} ({volatility}):\n\n"
        
        # Compound-specific recommendations
        if compound == "Hydrocarbons":
            recommendations += "• Start low (40-60 C) for light compounds\n"
            recommendations += "• Moderate ramp rates (5-15 C/min)\n"
            recommendations += "• Final temp based on heaviest compound\n"
        elif compound == "Aromatics":
            recommendations += "• Higher initial temp (60-80 C)\n"
            recommendations += "• Slower ramps for better resolution\n"
            recommendations += "• Extended final hold for heavy aromatics\n"
        elif compound == "Alcohols":
            recommendations += "• Low initial temp for volatiles\n"
            recommendations += "• Watch for peak tailing\n"
            recommendations += "• Consider derivatization\n"
        
        # Volatility recommendations
        if "C4-C8" in volatility:
            recommendations += "• Sub-ambient start may be needed\n"
            recommendations += "• Fast initial ramp to retain volatiles\n"
        elif "C20" in volatility:
            recommendations += "• High final temperature (300+ C)\n"
            recommendations += "• Extended final hold time\n"
        
        # Complexity recommendations
        if complexity == "Very Complex":
            recommendations += "• Multiple ramp segments needed\n"
            recommendations += "• Slower ramp rates for resolution\n"
            recommendations += "• Consider longer column\n"
        elif complexity == "Simple":
            recommendations += "• Single ramp may be sufficient\n"
            recommendations += "• Faster analysis possible\n"
        
        self.temp_rec_label.config(text=recommendations)
    
    def update_real_world_analysis(self):
        """Update real-world temperature program analysis"""
        if not hasattr(self, 'temp_analysis'):
            return
            
        age = self.instrument_age.get()
        maintenance = self.maintenance_level.get()
        oven_cal = self.oven_calibration.get()
        column_cond = self.column_condition.get()
        
        analysis = []
        analysis.append("REAL-WORLD TEMPERATURE IMPACT\n")
        analysis.append("="*35 + "\n\n")
        
        # Oven calibration issues
        if oven_cal in ["Poor", "Uncalibrated"]:
            analysis.append("OVEN CALIBRATION ISSUES (CRITICAL):\n")
            analysis.append("- Actual temps may be +/- 20 C from setpoint\n")
            analysis.append("- Poor reproducibility between runs\n")
            analysis.append("- Retention time drift\n")
            analysis.append("- CALIBRATION REQUIRED\n\n")
        elif oven_cal == "Fair":
            analysis.append("OVEN CALIBRATION ISSUES (MODERATE):\n")
            analysis.append("- Temps may be +/- 10 C from setpoint\n")
            analysis.append("- Some retention time variation\n\n")
        
        # Age-related issues
        if age > 20:
            analysis.append("OLD INSTRUMENT ISSUES:\n")
            analysis.append("- Slower heating/cooling rates\n")
            analysis.append("- Temperature overshoot on ramps\n")
            analysis.append("- Poor zone-to-zone uniformity\n")
            analysis.append("- Add 20-30% to ramp times\n\n")
        elif age > 10:
            analysis.append("AGING INSTRUMENT:\n")
            analysis.append("- Slightly slower response\n")
            analysis.append("- Monitor calibration more frequently\n\n")
        
        # Column condition
        if column_cond == "Needs Replacement":
            analysis.append("COLUMN ISSUES (CRITICAL):\n")
            analysis.append("- Severe peak tailing/fronting\n")
            analysis.append("- Loss of resolution\n")
            analysis.append("- Active sites causing breakdown\n")
            analysis.append("- REPLACE BEFORE CRITICAL ANALYSIS\n\n")
        elif column_cond == "Degraded":
            analysis.append("COLUMN DEGRADATION:\n")
            analysis.append("- Reduced efficiency\n")
            analysis.append("- May need higher temps\n")
            analysis.append("- Plan replacement soon\n\n")
        
        # Maintenance impact
        if maintenance == "Neglected":
            analysis.append("MAINTENANCE ISSUES (SEVERE):\n")
            analysis.append("- Contamination buildup\n")
            analysis.append("- Poor baseline stability\n")
            analysis.append("- Ghost peaks possible\n")
            analysis.append("- Expect 30-50% performance loss\n\n")
        elif maintenance == "Poor":
            analysis.append("MAINTENANCE ISSUES:\n")
            analysis.append("- Some contamination present\n")
            analysis.append("- Baseline drift possible\n")
            analysis.append("- 15-30% performance impact\n\n")
        
        # Overall assessment
        analysis.append("TEMPERATURE PROGRAM ADJUSTMENTS:\n")
        if oven_cal in ["Poor", "Uncalibrated"]:
            analysis.append("- Verify temps with external standard\n")
            analysis.append("- Use wider temperature safety margins\n")
        if age > 20:
            analysis.append("- Extend hold times by 25-50%\n")
            analysis.append("- Use slower ramp rates\n")
        if column_cond in ["Degraded", "Needs Replacement"]:
            analysis.append("- May need higher final temps\n")
            analysis.append("- Consider isothermal segments\n")
        
        self.temp_analysis.delete(1.0, tk.END)
        self.temp_analysis.insert(1.0, ''.join(analysis))
    
    def update_program_preview(self):
        """Update temperature program preview"""
        program_text = f"""GC Temperature Program - {datetime.now().strftime('%Y-%m-%d %H:%M')}

TEMPERATURE PROGRAM:
  Initial Temperature: {self.initial_temp.get():.0f} C
  Initial Hold Time: {self.initial_hold.get():.1f} min
  
  Ramp 1: {self.ramp_rate_1.get():.0f} C/min to {self.final_temp_1.get():.0f} C
  Hold 1: {self.hold_time_1.get():.1f} min
  
  Ramp 2: {self.ramp_rate_2.get():.0f} C/min to {self.final_temp_2.get():.0f} C
  Final Hold: {self.final_hold.get():.1f} min

COLUMN CONFIGURATION:
  Column: {self.column_type.get()}
  Dimensions: {self.column_length.get():.0f}m x {self.column_id.get():.2f}mm x {self.film_thickness.get():.2f}um
  Carrier Gas: {self.carrier_gas.get()}
  Flow Rate: {self.flow_rate.get():.1f} mL/min
  Pressure Mode: {self.pressure_mode.get()}

SAMPLE INFORMATION:
  Compound Class: {self.compound_class.get()}
  Volatility Range: {self.volatility_range.get()}
  Sample Complexity: {self.sample_complexity.get()}

INSTRUMENT CONDITION:
  Age: {self.instrument_age.get():.0f} years
  Maintenance: {self.maintenance_level.get()}
  Oven Calibration: {self.oven_calibration.get()}
  Column Condition: {self.column_condition.get()}

Generated by IntelliLab GC Oven Ramp Visualizer v1.0
"""
        
        self.program_preview.delete(1.0, tk.END)
        self.program_preview.insert(1.0, program_text)
    
    def toggle_realtime(self):
        """Toggle real-time optimization"""
        if self.realtime_enabled.get():
            self.optimize_program()
    
    def optimize_program(self):
        """Main temperature program optimization"""
        try:
            # Calculate program metrics
            runtime = self.calculate_total_runtime()
            resolution = self.calculate_resolution_score()
            efficiency = self.calculate_efficiency_score() 
            opt_score = self.calculate_optimization_score(runtime, resolution, efficiency)
            
            # Update results
            self.total_runtime.set(f"{runtime:.1f} min")
            self.resolution_score.set(f"{resolution:.0f}/100")
            self.efficiency_score.set(f"{efficiency:.0f}/100")
            self.optimization_score.set(f"{opt_score:.0f}/100")
            
            # Generate detailed analysis
            self.generate_detailed_analysis(runtime, resolution, efficiency, opt_score)
            
            # Update visualization
            self.update_plots()
            
        except Exception as e:
            messagebox.showerror("Optimization Error", f"Error optimizing program:\n{str(e)}")
    
    def calculate_total_runtime(self) -> float:
        """Calculate total program runtime with real-world factors"""
        # Basic program time
        runtime = self.initial_hold.get()
        
        # Ramp 1 time
        if self.ramp_rate_1.get() > 0:
            ramp1_time = (self.final_temp_1.get() - self.initial_temp.get()) / self.ramp_rate_1.get()
            
            # Real-world adjustment for old instruments
            age = self.instrument_age.get()
            if age > 20:
                ramp1_time *= 1.3  # 30% slower heating
            elif age > 10:
                ramp1_time *= 1.15  # 15% slower
            
            runtime += ramp1_time
        
        runtime += self.hold_time_1.get()
        
        # Ramp 2 time
        if self.ramp_rate_2.get() > 0:
            ramp2_time = (self.final_temp_2.get() - self.final_temp_1.get()) / self.ramp_rate_2.get()
            
            # Real-world adjustment
            if age > 20:
                ramp2_time *= 1.3
            elif age > 10:
                ramp2_time *= 1.15
                
            runtime += ramp2_time
        
        runtime += self.final_hold.get()
        
        return max(runtime, 1.0)
    
    def calculate_resolution_score(self) -> float:
        """Calculate resolution score with real-world factors"""
        base_score = 80.0
        
        # Column length effect
        length_factor = min(self.column_length.get() / 30.0, 1.5)
        base_score *= length_factor
        
        # Ramp rate effects (slower = better resolution)
        avg_ramp = (self.ramp_rate_1.get() + self.ramp_rate_2.get()) / 2
        if avg_ramp > 20:
            base_score *= 0.8
        elif avg_ramp < 5:
            base_score *= 1.1
        
        # Sample complexity effects
        complexity_factors = {
            'Simple': 1.2,
            'Medium': 1.0,
            'Complex': 0.8,
            'Very Complex': 0.6
        }
        base_score *= complexity_factors.get(self.sample_complexity.get(), 1.0)
        
        # REAL-WORLD DEGRADATION
        # Column condition impact
        column_factors = {
            'New': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Degraded': 0.7,
            'Needs Replacement': 0.5
        }
        base_score *= column_factors.get(self.column_condition.get(), 1.0)
        
        # Oven calibration impact
        oven_factors = {
            'Excellent': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Poor': 0.7,
            'Uncalibrated': 0.5
        }
        base_score *= oven_factors.get(self.oven_calibration.get(), 1.0)
        
        # Maintenance impact
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.98,
            'Fair': 0.9,
            'Poor': 0.8,
            'Neglected': 0.6
        }
        base_score *= maintenance_factors.get(self.maintenance_level.get(), 1.0)
        
        return min(max(base_score, 20.0), 100.0)
    
    def calculate_efficiency_score(self) -> float:
        """Calculate analysis efficiency score"""
        runtime = self.calculate_total_runtime()
        resolution = self.calculate_resolution_score()
        
        # Efficiency = Resolution / Time (with scaling)
        efficiency = (resolution / runtime) * 2.0
        
        # Carrier gas efficiency
        carrier_factors = {
            'Hydrogen': 1.2,
            'Helium': 1.0,
            'Nitrogen': 0.8
        }
        efficiency *= carrier_factors.get(self.carrier_gas.get(), 1.0)
        
        # Flow rate optimization
        optimal_flow = 1.0  # mL/min for 0.25mm ID
        flow_deviation = abs(self.flow_rate.get() - optimal_flow) / optimal_flow
        if flow_deviation < 0.2:
            efficiency *= 1.1  # Good flow rate
        elif flow_deviation > 0.5:
            efficiency *= 0.9  # Poor flow rate
        
        return min(max(efficiency, 10.0), 100.0)
    
    def calculate_optimization_score(self, runtime: float, resolution: float, efficiency: float) -> float:
        """Calculate overall optimization score"""
        # Weighted combination: resolution most important, then efficiency, then time
        score = (resolution * 0.5 + efficiency * 0.3 + (100 - min(runtime * 2, 50)) * 0.2)
        
        return min(max(score, 0.0), 100.0)
    
    def generate_detailed_analysis(self, runtime: float, resolution: float, efficiency: float, opt_score: float):
        """Generate detailed optimization analysis"""
        
        analysis = []
        analysis.append("TEMPERATURE PROGRAM ANALYSIS\n")
        analysis.append("="*40 + "\n\n")
        
        # Performance summary
        analysis.append("PERFORMANCE SUMMARY:\n")
        analysis.append(f"   Total Runtime: {runtime:.1f} minutes\n")
        analysis.append(f"   Resolution Score: {resolution:.0f}/100\n")
        analysis.append(f"   Efficiency Score: {efficiency:.0f}/100\n")
        analysis.append(f"   Overall Score: {opt_score:.0f}/100\n\n")
        
        # Optimization recommendations
        analysis.append("OPTIMIZATION RECOMMENDATIONS:\n")
        
        if runtime > 60:
            analysis.append("   • Long analysis time - consider faster ramps\n")
            analysis.append("   • Check if all temperature steps are necessary\n")
        
        if resolution < 70:
            analysis.append("   • Poor resolution - try slower ramp rates\n")
            analysis.append("   • Consider longer column or different phase\n")
            analysis.append("   • Check column condition\n")
        
        if efficiency < 60:
            analysis.append("   • Low efficiency - optimize flow rate\n")
            analysis.append("   • Consider different carrier gas\n")
            analysis.append("   • Balance resolution vs speed\n")
        
        # Program evaluation
        avg_ramp = (self.ramp_rate_1.get() + self.ramp_rate_2.get()) / 2
        if avg_ramp > 25:
            analysis.append("   • Very fast ramps may compromise resolution\n")
        elif avg_ramp < 3:
            analysis.append("   • Very slow ramps - analysis time could be optimized\n")
        
        # Real-world considerations
        analysis.append("\nREAL-WORLD CONSIDERATIONS:\n")
        
        age = self.instrument_age.get()
        if age > 20:
            analysis.append("   • Old instrument: Actual ramp rates may be slower\n")
            analysis.append("   • Allow extra time for temperature equilibration\n")
        
        if self.oven_calibration.get() in ["Poor", "Uncalibrated"]:
            analysis.append("   • Poor oven calibration: Verify actual temperatures\n")
            analysis.append("   • Consider recalibration before critical analysis\n")
        
        if self.column_condition.get() in ["Degraded", "Needs Replacement"]:
            analysis.append("   • Column degradation: Resolution will be lower\n")
            analysis.append("   • May need higher final temperature\n")
        
        # Overall assessment
        analysis.append("\nOVERALL ASSESSMENT:\n")
        if opt_score > 85:
            analysis.append("   ✓ Excellent program! Ready for analysis.\n")
        elif opt_score > 70:
            analysis.append("   ⚠ Good program, minor optimizations possible.\n")
        elif opt_score > 50:
            analysis.append("   ! Fair program, significant improvements needed.\n")
        else:
            analysis.append("   ✗ Poor program, major optimization required.\n")
        
        # Display analysis
        self.analysis_text.delete(1.0, tk.END)
        self.analysis_text.insert(1.0, ''.join(analysis))
    
    def update_plots(self):
        """Update temperature program and chromatogram plots"""
        
        # Clear plots
        self.ax1.clear()
        self.ax2.clear()
        
        # Calculate temperature profile
        times, temps = self.calculate_temperature_profile()
        
        # Plot temperature program
        self.ax1.plot(times, temps, 'cyan', linewidth=3, label='Temperature Program')
        self.ax1.fill_between(times, temps, alpha=0.3, color='cyan')
        
        # Add segment labels
        self.ax1.axhline(y=self.initial_temp.get(), color='yellow', linestyle='--', alpha=0.7, label='Initial')
        self.ax1.axhline(y=self.final_temp_1.get(), color='orange', linestyle='--', alpha=0.7, label='Intermediate')
        self.ax1.axhline(y=self.final_temp_2.get(), color='red', linestyle='--', alpha=0.7, label='Final')
        
        self.ax1.set_title('Temperature Program Profile', color='white', fontsize=12)
        self.ax1.set_xlabel('Time (minutes)', color='white')
        self.ax1.set_ylabel('Temperature (C)', color='white')
        self.ax1.legend()
        
        # Simulate chromatogram
        chrom_times, chrom_signal = self.simulate_chromatogram(times, temps)
        
        # Plot chromatogram
        self.ax2.plot(chrom_times, chrom_signal, 'lime', linewidth=2)
        self.ax2.fill_between(chrom_times, chrom_signal, alpha=0.2, color='lime')
        
        self.ax2.set_title('Predicted Chromatogram', color='white', fontsize=12)
        self.ax2.set_xlabel('Time (minutes)', color='white')
        self.ax2.set_ylabel('Signal Intensity', color='white')
        
        # Style plots
        for ax in [self.ax1, self.ax2]:
            ax.set_facecolor('#3c3c3c')
            ax.tick_params(colors='white')
            ax.grid(True, alpha=0.3, color='white')
            for spine in ax.spines.values():
                spine.set_color('white')
        
        self.fig.tight_layout()
        self.canvas.draw()
    
    def calculate_temperature_profile(self) -> Tuple[np.ndarray, np.ndarray]:
        """Calculate the complete temperature profile"""
        time_points = []
        temp_points = []
        
        current_time = 0.0
        current_temp = self.initial_temp.get()
        
        # Initial hold
        time_points.extend([current_time, current_time + self.initial_hold.get()])
        temp_points.extend([current_temp, current_temp])
        current_time += self.initial_hold.get()
        
        # Ramp 1
        if self.ramp_rate_1.get() > 0:
            ramp_time = (self.final_temp_1.get() - current_temp) / self.ramp_rate_1.get()
            
            # Adjust for instrument age
            age = self.instrument_age.get()
            if age > 20:
                ramp_time *= 1.3
            elif age > 10:
                ramp_time *= 1.15
            
            time_points.append(current_time + ramp_time)
            temp_points.append(self.final_temp_1.get())
            current_time += ramp_time
            current_temp = self.final_temp_1.get()
        
        # Hold 1
        if self.hold_time_1.get() > 0:
            time_points.append(current_time + self.hold_time_1.get())
            temp_points.append(current_temp)
            current_time += self.hold_time_1.get()
        
        # Ramp 2
        if self.ramp_rate_2.get() > 0:
            ramp_time = (self.final_temp_2.get() - current_temp) / self.ramp_rate_2.get()
            
            # Adjust for instrument age
            if age > 20:
                ramp_time *= 1.3
            elif age > 10:
                ramp_time *= 1.15
                
            time_points.append(current_time + ramp_time)
            temp_points.append(self.final_temp_2.get())
            current_time += ramp_time
            current_temp = self.final_temp_2.get()
        
        # Final hold
        time_points.append(current_time + self.final_hold.get())
        temp_points.append(current_temp)
        
        return np.array(time_points), np.array(temp_points)
    
    def simulate_chromatogram(self, times: np.ndarray, temps: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Simulate a basic chromatogram based on temperature program"""
        
        # Generate peak times based on volatility range
        volatility = self.volatility_range.get()
        complexity = self.sample_complexity.get()
        
        # Number of peaks based on complexity
        complexity_peaks = {'Simple': 3, 'Medium': 8, 'Complex': 15, 'Very Complex': 25}
        num_peaks = complexity_peaks.get(complexity, 8)
        
        # Peak positions based on volatility range
        if "C4-C8" in volatility:
            peak_times = np.linspace(2, times[-1] * 0.3, num_peaks)
        elif "C8-C12" in volatility:
            peak_times = np.linspace(3, times[-1] * 0.5, num_peaks)
        elif "C8-C20" in volatility:
            peak_times = np.linspace(4, times[-1] * 0.7, num_peaks)
        elif "C12-C24" in volatility:
            peak_times = np.linspace(times[-1] * 0.2, times[-1] * 0.8, num_peaks)
        else:  # C20-C40
            peak_times = np.linspace(times[-1] * 0.4, times[-1] * 0.9, num_peaks)
        
        # Generate chromatogram time axis
        chrom_times = np.linspace(0, times[-1], 1000)
        chrom_signal = np.zeros_like(chrom_times)
        
        # Add peaks with real-world degradation
        column_factor = {'New': 1.0, 'Good': 0.9, 'Fair': 0.7, 'Degraded': 0.5, 'Needs Replacement': 0.3}.get(self.column_condition.get(), 1.0)
        
        for i, peak_time in enumerate(peak_times):
            # Peak height decreases for later peaks
            height = (1.0 - i * 0.05) * column_factor
            # Peak width increases for later peaks (poor resolution)
            width = 0.3 + i * 0.1 / column_factor
            
            # Gaussian peak
            peak = height * np.exp(-0.5 * ((chrom_times - peak_time) / width) ** 2)
            chrom_signal += peak
        
        # Add baseline noise for old/poorly maintained instruments
        maintenance_factors = {'Excellent': 0.01, 'Good': 0.02, 'Fair': 0.05, 'Poor': 0.1, 'Neglected': 0.2}
        noise_level = maintenance_factors.get(self.maintenance_level.get(), 0.02)
        noise = np.random.normal(0, noise_level, len(chrom_signal))
        chrom_signal += noise
        
        return chrom_times, chrom_signal
    
    # Export methods
    def export_to_inlet_sim(self):
        """Export program to Inlet Simulator"""
        messagebox.showinfo("Export", "Integration with Inlet Simulator - Coming soon!")
    
    def export_to_fleet(self):
        """Export program to Fleet Manager"""
        messagebox.showinfo("Export", "Integration with Fleet Manager - Coming soon!")
    
    def save_program(self):
        """Save temperature program"""
        program_data = {
            'timestamp': datetime.now().isoformat(),
            'tool': 'Oven Ramp Visualizer',
            'temperature_program': {
                'initial_temp': self.initial_temp.get(),
                'initial_hold': self.initial_hold.get(),
                'ramp_rate_1': self.ramp_rate_1.get(),
                'final_temp_1': self.final_temp_1.get(),
                'hold_time_1': self.hold_time_1.get(),
                'ramp_rate_2': self.ramp_rate_2.get(),
                'final_temp_2': self.final_temp_2.get(),
                'final_hold': self.final_hold.get()
            },
            'column_config': {
                'column_type': self.column_type.get(),
                'length': self.column_length.get(),
                'id': self.column_id.get(),
                'film_thickness': self.film_thickness.get(),
                'carrier_gas': self.carrier_gas.get(),
                'flow_rate': self.flow_rate.get(),
                'pressure_mode': self.pressure_mode.get()
            },
            'sample_info': {
                'compound_class': self.compound_class.get(),
                'volatility_range': self.volatility_range.get(),
                'complexity': self.sample_complexity.get()
            },
            'instrument_condition': {
                'age': self.instrument_age.get(),
                'maintenance': self.maintenance_level.get(),
                'oven_calibration': self.oven_calibration.get(),
                'column_condition': self.column_condition.get()
            },
            'results': {
                'total_runtime': self.total_runtime.get(),
                'resolution_score': self.resolution_score.get(),
                'efficiency_score': self.efficiency_score.get(),
                'optimization_score': self.optimization_score.get()
            }
        }
        
        filename = f"temperature_program_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(program_data, f, indent=2)
            messagebox.showinfo("Program Saved", f"Temperature program saved as {filename}")
        except Exception as e:
            messagebox.showerror("Save Error", f"Could not save program: {str(e)}")
    
    def generate_report(self):
        """Generate professional report"""
        messagebox.showinfo("Report", "Professional reporting - Coming in next update!")
    
    def load_column_database(self) -> Dict:
        """Load column database"""
        return {
            "DB-5ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "5% Phenyl"},
            "DB-1ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "100% Methyl"},
            "DB-17ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "50% Phenyl"},
            "DB-WAXetr (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "PEG"},
            "DB-5ms (60m x 0.25mm x 0.25um)": {"length": 60, "id": 0.25, "film": 0.25, "type": "5% Phenyl"},
            "DB-1ms (15m x 0.25mm x 0.10um)": {"length": 15, "id": 0.25, "film": 0.10, "type": "100% Methyl"},
            "DB-5ms (15m x 0.25mm x 0.10um)": {"length": 15, "id": 0.25, "film": 0.10, "type": "5% Phenyl"},
            "Rtx-5ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "5% Phenyl"},
            "HP-5ms (30m x 0.25mm x 0.25um)": {"length": 30, "id": 0.25, "film": 0.25, "type": "5% Phenyl"}
        }
    
    def load_compound_database(self) -> Dict:
        """Load compound database for retention predictions"""
        return {
            "Hydrocarbons": {
                "temp_range": [40, 320],
                "typical_ramp": [5, 15],
                "complexity": "Medium"
            },
            "Aromatics": {
                "temp_range": [60, 280],
                "typical_ramp": [3, 10],
                "complexity": "Medium"
            },
            "Alcohols": {
                "temp_range": [35, 250],
                "typical_ramp": [5, 20],
                "complexity": "High"
            },
            "Esters": {
                "temp_range": [40, 220],
                "typical_ramp": [8, 25],
                "complexity": "Medium"
            },
            "Fatty Acids": {
                "temp_range": [120, 320],
                "typical_ramp": [3, 8],
                "complexity": "Low"
            },
            "Pesticides": {
                "temp_range": [80, 300],
                "typical_ramp": [5, 15],
                "complexity": "Very High"
            },
            "Pharmaceuticals": {
                "temp_range": [100, 350],
                "typical_ramp": [5, 20],
                "complexity": "Very High"
            }
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