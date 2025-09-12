#!/usr/bin/env python3
"""
IntelliLab GC - GC Inlet Simulator
Professional inlet optimization for maximum sample transfer efficiency
"""

import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
from typing import Dict, List, Tuple
import json
import os
from datetime import datetime

class CalibrationDialog:
    """Dialog for performance calibration"""
    
    def __init__(self, parent):
        self.parent = parent
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Performance Calibration")
        self.dialog.geometry("500x600")
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        # Calibration data
        self.calibration_data = {
            'instrument_name': tk.StringVar(value=""),
            'theoretical_transfer': tk.DoubleVar(value=85.0),
            'actual_transfer': tk.DoubleVar(value=45.0),
            'theoretical_discrimination': tk.DoubleVar(value=1.0),
            'actual_discrimination': tk.DoubleVar(value=1.2),
            'theoretical_peak_shape': tk.DoubleVar(value=1.0),
            'actual_peak_shape': tk.DoubleVar(value=0.8),
            'notes': tk.StringVar(value="")
        }
        
        self.create_dialog()
        
    def create_dialog(self):
        """Create the calibration dialog"""
        main_frame = ttk.Frame(self.dialog, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Instrument Performance Calibration", 
                               font=("Arial", 14, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Instrument info
        info_frame = ttk.LabelFrame(main_frame, text="Instrument Information", padding=10)
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(info_frame, text="Instrument Name:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(info_frame, textvariable=self.calibration_data['instrument_name'], width=30).grid(row=0, column=1, padx=5, pady=2)
        
        # Transfer efficiency calibration
        transfer_frame = ttk.LabelFrame(main_frame, text="Transfer Efficiency Calibration", padding=10)
        transfer_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(transfer_frame, text="Theoretical Efficiency (%):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(transfer_frame, textvariable=self.calibration_data['theoretical_transfer'], width=10).grid(row=0, column=1, padx=5, pady=2)
        
        ttk.Label(transfer_frame, text="Your Actual Efficiency (%):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(transfer_frame, textvariable=self.calibration_data['actual_transfer'], width=10).grid(row=1, column=1, padx=5, pady=2)
        
        # Discrimination calibration
        discrimination_frame = ttk.LabelFrame(main_frame, text="Discrimination Factor Calibration", padding=10)
        discrimination_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(discrimination_frame, text="Theoretical Discrimination:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(discrimination_frame, textvariable=self.calibration_data['theoretical_discrimination'], width=10).grid(row=0, column=1, padx=5, pady=2)
        
        ttk.Label(discrimination_frame, text="Your Actual Discrimination:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(discrimination_frame, textvariable=self.calibration_data['actual_discrimination'], width=10).grid(row=1, column=1, padx=5, pady=2)
        
        # Peak shape calibration
        peak_frame = ttk.LabelFrame(main_frame, text="Peak Shape Index Calibration", padding=10)
        peak_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(peak_frame, text="Theoretical Peak Shape:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(peak_frame, textvariable=self.calibration_data['theoretical_peak_shape'], width=10).grid(row=0, column=1, padx=5, pady=2)
        
        ttk.Label(peak_frame, text="Your Actual Peak Shape:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        ttk.Entry(peak_frame, textvariable=self.calibration_data['actual_peak_shape'], width=10).grid(row=1, column=1, padx=5, pady=2)
        
        # Notes
        notes_frame = ttk.LabelFrame(main_frame, text="Calibration Notes", padding=10)
        notes_frame.pack(fill=tk.X, pady=(0, 10))
        
        notes_text = tk.Text(notes_frame, height=4, wrap=tk.WORD)
        notes_text.pack(fill=tk.X)
        notes_text.insert(1.0, "Enter any notes about your instrument's performance...")
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(20, 0))
        
        ttk.Button(button_frame, text="Calculate Ratios", command=self.calculate_ratios).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Save Calibration", command=self.save_calibration).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Cancel", command=self.dialog.destroy).pack(side=tk.RIGHT)
        
        # Results display
        self.results_frame = ttk.LabelFrame(main_frame, text="Calibration Results", padding=10)
        self.results_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.results_text = tk.Text(self.results_frame, height=6, wrap=tk.WORD, font=("Arial", 9))
        self.results_text.pack(fill=tk.X)
        
    def calculate_ratios(self):
        """Calculate performance ratios"""
        try:
            # Calculate ratios
            transfer_ratio = self.calibration_data['actual_transfer'].get() / self.calibration_data['theoretical_transfer'].get()
            discrimination_ratio = self.calibration_data['actual_discrimination'].get() / self.calibration_data['theoretical_discrimination'].get()
            peak_shape_ratio = self.calibration_data['actual_peak_shape'].get() / self.calibration_data['theoretical_peak_shape'].get()
            
            # Display results
            results = f"CALIBRATION RATIOS:\n"
            results += f"Transfer Efficiency: {transfer_ratio:.3f} ({self.calibration_data['actual_transfer'].get():.1f}% / {self.calibration_data['theoretical_transfer'].get():.1f}%)\n"
            results += f"Discrimination Factor: {discrimination_ratio:.3f} ({self.calibration_data['actual_discrimination'].get():.2f} / {self.calibration_data['theoretical_discrimination'].get():.2f})\n"
            results += f"Peak Shape Index: {peak_shape_ratio:.3f} ({self.calibration_data['actual_peak_shape'].get():.2f} / {self.calibration_data['theoretical_peak_shape'].get():.2f})\n\n"
            
            if transfer_ratio < 0.7:
                results += f"⚠️ Your instrument achieves only {transfer_ratio*100:.0f}% of theoretical efficiency.\n"
                results += f"This suggests significant performance degradation.\n"
            elif transfer_ratio < 0.85:
                results += f"⚠️ Your instrument achieves {transfer_ratio*100:.0f}% of theoretical efficiency.\n"
                results += f"Moderate performance degradation detected.\n"
            else:
                results += f"✓ Your instrument achieves {transfer_ratio*100:.0f}% of theoretical efficiency.\n"
                results += f"Good performance maintained.\n"
            
            self.results_text.delete(1.0, tk.END)
            self.results_text.insert(1.0, results)
            
        except Exception as e:
            messagebox.showerror("Calculation Error", f"Error calculating ratios:\n{str(e)}")
    
    def save_calibration(self):
        """Save calibration data"""
        try:
            # Get notes from text widget
            notes_widget = self.dialog.winfo_children()[0].winfo_children()[-2]  # Get the notes text widget
            notes = notes_widget.get(1.0, tk.END).strip()
            
            # Calculate ratios
            transfer_ratio = self.calibration_data['actual_transfer'].get() / self.calibration_data['theoretical_transfer'].get()
            discrimination_ratio = self.calibration_data['actual_discrimination'].get() / self.calibration_data['theoretical_discrimination'].get()
            peak_shape_ratio = self.calibration_data['actual_peak_shape'].get() / self.calibration_data['theoretical_peak_shape'].get()
            
            # Create calibration data
            calibration_data = {
                'transfer_efficiency_ratio': transfer_ratio,
                'discrimination_ratio': discrimination_ratio,
                'peak_shape_ratio': peak_shape_ratio,
                'instrument_name': self.calibration_data['instrument_name'].get(),
                'calibration_date': datetime.now().strftime("%Y-%m-%d %H:%M"),
                'notes': notes
            }
            
            # Save to file
            filename = f"calibration_{self.calibration_data['instrument_name'].get().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(calibration_data, f, indent=2)
            
            messagebox.showinfo("Calibration Saved", f"Calibration profile saved as {filename}")
            
            # Store calibration data for parent to access
            self.calibration_data = calibration_data
            self.dialog.destroy()
            
        except Exception as e:
            messagebox.showerror("Save Error", f"Error saving calibration:\n{str(e)}")


class GCInletSimulator:
    """Professional GC inlet optimization simulator"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.setup_window()
        
        # Load databases FIRST
        self.liner_database = self.load_liner_database()
        self.injection_modes = self.load_injection_modes()
        
        self.setup_variables()
        self.create_interface()
        
        # Load saved instruments
        self.load_saved_instruments()
        
        # Initialize with first calculation
        self.update_all_displays()
        
    def setup_window(self):
        """Configure main window"""
        self.root.title("GC Inlet Simulator - IntelliLab GC")
        self.root.geometry("1400x900")
        self.root.configure(bg='#2b2b2b')
        
        # Apply dark theme
        style = ttk.Style()
        style.theme_use('clam')
        
    def setup_variables(self):
        """Initialize simulation variables"""
        # Inlet parameters
        self.inlet_type = tk.StringVar(value="Split/Splitless")
        self.injection_mode = tk.StringVar(value="Split")
        self.inlet_temp = tk.DoubleVar(value=250.0)
        self.split_ratio = tk.DoubleVar(value=20.0)
        self.purge_flow = tk.DoubleVar(value=50.0)
        self.purge_time = tk.DoubleVar(value=1.0)
        
        # Liner parameters
        self.liner_type = tk.StringVar(value="4mm Split w/ Wool")
        self.liner_volume = tk.DoubleVar(value=920.0)  # microL
        self.liner_packing = tk.StringVar(value="Wool")
        
        # Sample parameters
        self.injection_volume = tk.DoubleVar(value=1.0)
        self.sample_viscosity = tk.DoubleVar(value=1.0)  # relative to water
        self.sample_volatility = tk.StringVar(value="Medium")
        self.matrix_type = tk.StringVar(value="Light Hydrocarbon")
        
        # Syringe parameters
        self.syringe_size = tk.DoubleVar(value=10.0)  # microL
        self.injection_speed = tk.StringVar(value="Medium")
        self.needle_size = tk.StringVar(value="23s/42/AS")
        
        # Instrument condition parameters
        self.instrument_age = tk.DoubleVar(value=5.0)
        self.maintenance_level = tk.StringVar(value="Good")
        self.vacuum_integrity = tk.DoubleVar(value=95.0)
        self.septum_condition = tk.StringVar(value="New")
        self.liner_condition = tk.StringVar(value="Clean")
        
        # Results
        self.transfer_efficiency = tk.StringVar(value="Not calculated")
        self.discrimination_factor = tk.StringVar(value="Not calculated")
        self.peak_shape_index = tk.StringVar(value="Not calculated")
        self.optimization_score = tk.StringVar(value="Not calculated")
        
        # Real-time simulation flag
        self.realtime_enabled = tk.BooleanVar(value=True)
        
        # Performance calibration variables
        self.calibration_data = {
            'transfer_efficiency_ratio': 1.0,  # actual/theoretical
            'discrimination_ratio': 1.0,
            'peak_shape_ratio': 1.0,
            'instrument_name': '',
            'calibration_date': '',
            'notes': ''
        }
        self.is_calibrated = False
        
        # Instrument management variables
        self.quick_load_instrument = tk.StringVar(value="")
        self.instrument_manager = None
        self.saved_instruments = []
        self.current_instrument_profile = {
            'name': 'Default GC',
            'model': 'Generic GC-MS',
            'age_years': 5.0,
            'maintenance_level': 'Good',
            'vacuum_integrity': 95.0,
            'septum_condition': 'New',
            'liner_condition': 'Clean',
            'last_updated': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    def create_interface(self):
        """Create the main interface"""
        
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        title_label = ttk.Label(header_frame, text="GC Inlet Simulator", 
                               font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        subtitle_label = ttk.Label(header_frame, text="Optimize injection conditions for maximum sample transfer", 
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
        
        panel = ttk.LabelFrame(parent, text="Inlet Configuration", padding=10)
        
        # Create notebook for parameter categories
        param_notebook = ttk.Notebook(panel)
        param_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Inlet tab
        self.create_inlet_tab(param_notebook)
        
        # Sample tab
        self.create_sample_tab(param_notebook)
        
        # Instrument condition tab
        self.create_instrument_condition_tab(param_notebook)
        
        # Simulate button
        simulate_frame = ttk.Frame(panel)
        simulate_frame.pack(fill=tk.X, pady=(10, 0))
        
        simulate_btn = ttk.Button(simulate_frame, text="Simulate Injection", 
                                 command=self.simulate_injection)
        simulate_btn.pack(fill=tk.X)
        
        # Export button
        export_btn = ttk.Button(simulate_frame, text="📤 Export to Detection Limit Calculator", 
                               command=self.export_to_detection_calculator)
        export_btn.pack(fill=tk.X, pady=(5, 0))
        
        # Real-time simulation toggle
        realtime_cb = ttk.Checkbutton(simulate_frame, text="Real-time simulation", 
                                     variable=self.realtime_enabled, command=self.toggle_realtime)
        realtime_cb.pack(pady=(5, 0))
        
        return panel
        
    def create_inlet_tab(self, parent):
        """Create inlet configuration tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Inlet Parameters")
        
        # Temperature control
        temp_frame = ttk.LabelFrame(frame, text="Temperature Control", padding=10)
        temp_frame.pack(fill=tk.X, pady=(0, 10))
        temp_frame.grid_columnconfigure(1, weight=1)
        
        ttk.Label(temp_frame, text="Inlet Temp (C):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        temp_scale = ttk.Scale(temp_frame, from_=50, to=450, variable=self.inlet_temp, 
                              orient=tk.HORIZONTAL, command=self.update_temp_label)
        temp_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.inlet_temp_label = ttk.Label(temp_frame, text="250.0 C")
        self.inlet_temp_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Flow control
        flow_frame = ttk.LabelFrame(frame, text="Flow Control", padding=10)
        flow_frame.pack(fill=tk.X, pady=(0, 10))
        flow_frame.grid_columnconfigure(1, weight=1)
        
        # Split ratio
        ttk.Label(flow_frame, text="Split Ratio:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        split_scale = ttk.Scale(flow_frame, from_=1, to=1000, variable=self.split_ratio, 
                               orient=tk.HORIZONTAL, command=self.update_split_label)
        split_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.split_ratio_label = ttk.Label(flow_frame, text="20:1")
        self.split_ratio_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Purge flow
        ttk.Label(flow_frame, text="Purge Flow (mL/min):").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        purge_scale = ttk.Scale(flow_frame, from_=0, to=200, variable=self.purge_flow, 
                               orient=tk.HORIZONTAL, command=self.update_purge_label)
        purge_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.purge_flow_label = ttk.Label(flow_frame, text="50.0 mL/min")
        self.purge_flow_label.grid(row=1, column=2, padx=5, pady=2)
        
        # Injection mode
        mode_frame = ttk.LabelFrame(frame, text="Injection Mode", padding=10)
        mode_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(mode_frame, text="Injection Mode:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        mode_combo = ttk.Combobox(mode_frame, textvariable=self.injection_mode,
                                 values=["Split", "Splitless", "Pulsed Split", "Pulsed Splitless"], 
                                 state="readonly")
        mode_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        mode_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
    def create_sample_tab(self, parent):
        """Create sample parameters tab"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Sample")
        
        # Sample properties
        sample_frame = ttk.LabelFrame(frame, text="Sample Properties", padding=10)
        sample_frame.pack(fill=tk.X, pady=(0, 10))
        sample_frame.grid_columnconfigure(1, weight=1)
        
        # Injection volume slider
        ttk.Label(sample_frame, text="Injection Volume (uL):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        volume_scale = ttk.Scale(sample_frame, from_=0.1, to=10.0, variable=self.injection_volume, 
                                orient=tk.HORIZONTAL, command=self.update_volume_label)
        volume_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.injection_volume_label = ttk.Label(sample_frame, text="1.0 uL")
        self.injection_volume_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Sample viscosity slider
        ttk.Label(sample_frame, text="Sample Viscosity:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        viscosity_scale = ttk.Scale(sample_frame, from_=0.1, to=10.0, variable=self.sample_viscosity, 
                                   orient=tk.HORIZONTAL, command=self.update_viscosity_label)
        viscosity_scale.grid(row=1, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.viscosity_label = ttk.Label(sample_frame, text="1.0x H2O")
        self.viscosity_label.grid(row=1, column=2, padx=5, pady=2)
        
        # Sample type dropdowns
        ttk.Label(sample_frame, text="Matrix Type:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        matrix_combo = ttk.Combobox(sample_frame, textvariable=self.matrix_type,
                                   values=["Light Hydrocarbon", "Heavy Hydrocarbon", "Oxygenated", 
                                          "Aqueous", "Complex Matrix"], state="readonly")
        matrix_combo.grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        matrix_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
    def create_instrument_condition_tab(self, parent):
        """Create instrument condition tab for real-world simulation"""
        
        frame = ttk.Frame(parent)
        parent.add(frame, text="Instrument Condition")
        
        # Instrument age and maintenance
        age_frame = ttk.LabelFrame(frame, text="Instrument Status", padding=10)
        age_frame.pack(fill=tk.X, pady=(0, 10))
        age_frame.grid_columnconfigure(1, weight=1)
        
        # Instrument age slider
        ttk.Label(age_frame, text="Instrument Age (years):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        age_scale = ttk.Scale(age_frame, from_=0, to=30, variable=self.instrument_age, 
                             orient=tk.HORIZONTAL, command=self.update_age_label)
        age_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.age_label = ttk.Label(age_frame, text="5.0 years")
        self.age_label.grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(age_frame, text="Maintenance Level:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        maintenance_combo = ttk.Combobox(age_frame, textvariable=self.maintenance_level,
                                        values=["Excellent", "Good", "Fair", "Poor", "Neglected"], 
                                        state="readonly")
        maintenance_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        maintenance_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Vacuum system condition
        vacuum_frame = ttk.LabelFrame(frame, text="Vacuum System", padding=10)
        vacuum_frame.pack(fill=tk.X, pady=(0, 10))
        vacuum_frame.grid_columnconfigure(1, weight=1)
        
        # Vacuum integrity slider
        ttk.Label(vacuum_frame, text="Vacuum Integrity (%):").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        vacuum_scale = ttk.Scale(vacuum_frame, from_=60, to=100, variable=self.vacuum_integrity, 
                                orient=tk.HORIZONTAL, command=self.update_vacuum_label)
        vacuum_scale.grid(row=0, column=1, sticky=tk.W+tk.E, padx=5, pady=2)
        
        self.vacuum_label = ttk.Label(vacuum_frame, text="95.0%")
        self.vacuum_label.grid(row=0, column=2, padx=5, pady=2)
        
        # Component condition
        component_frame = ttk.LabelFrame(frame, text="Component Condition", padding=10)
        component_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(component_frame, text="Septum Condition:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        septum_combo = ttk.Combobox(component_frame, textvariable=self.septum_condition,
                                   values=["New", "Good", "Worn", "Leaking", "Badly Damaged"], 
                                   state="readonly")
        septum_combo.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        septum_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        ttk.Label(component_frame, text="Liner Condition:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        liner_cond_combo = ttk.Combobox(component_frame, textvariable=self.liner_condition,
                                       values=["Clean", "Lightly Contaminated", "Contaminated", 
                                              "Heavily Contaminated", "Needs Replacement"], 
                                       state="readonly")
        liner_cond_combo.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        liner_cond_combo.bind('<<ComboboxSelected>>', self.on_parameter_change)
        
        # Performance calibration section
        calibration_frame = ttk.LabelFrame(frame, text="Performance Calibration", padding=10)
        calibration_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Calibration status
        self.calibration_status = tk.StringVar(value="Not calibrated")
        ttk.Label(calibration_frame, text="Calibration Status:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.calibration_status_label = ttk.Label(calibration_frame, textvariable=self.calibration_status, 
                                                 foreground='red', font=("Arial", 9, "bold"))
        self.calibration_status_label.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Calibrate button
        calibrate_btn = ttk.Button(calibration_frame, text="Calibrate Performance", 
                                  command=self.open_calibration_dialog)
        calibrate_btn.grid(row=1, column=0, columnspan=2, pady=(10, 0), sticky=tk.W+tk.E)
        
        # Load calibration profile button
        load_cal_btn = ttk.Button(calibration_frame, text="Load Calibration Profile", 
                                 command=self.load_calibration_profile)
        load_cal_btn.grid(row=2, column=0, columnspan=2, pady=(5, 0), sticky=tk.W+tk.E)
        
        # Instrument management section
        instrument_frame = ttk.LabelFrame(frame, text="Instrument Management", padding=10)
        instrument_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Current instrument status
        self.current_instrument_name = tk.StringVar(value="Default GC")
        ttk.Label(instrument_frame, text="Current Instrument:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.instrument_name_label = ttk.Label(instrument_frame, textvariable=self.current_instrument_name, 
                                              font=("Arial", 9, "bold"), foreground='blue')
        self.instrument_name_label.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Instrument management buttons
        manage_btn = ttk.Button(instrument_frame, text="Manage Instruments", 
                               command=self.open_instrument_manager)
        manage_btn.grid(row=1, column=0, columnspan=2, pady=(10, 0), sticky=tk.W+tk.E)
        
        # Quick load instrument dropdown
        ttk.Label(instrument_frame, text="Quick Load:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=(10, 2))
        self.quick_load_combo = ttk.Combobox(instrument_frame, textvariable=self.quick_load_instrument,
                                             values=[], state="readonly", width=25)
        self.quick_load_combo.grid(row=2, column=1, sticky=tk.W, padx=5, pady=(10, 2))
        self.quick_load_combo.bind('<<ComboboxSelected>>', self.quick_load_instrument_profile)
        
        # Save current settings button
        save_current_btn = ttk.Button(instrument_frame, text="Save Current Settings as Profile", 
                                     command=self.save_current_as_profile)
        save_current_btn.grid(row=3, column=0, columnspan=2, pady=(5, 0), sticky=tk.W+tk.E)
        
    def create_results_panel(self, parent):
        """Create results and visualization panel"""
        
        panel = ttk.Frame(parent)
        
        # Results display
        results_frame = ttk.LabelFrame(panel, text="Simulation Results", padding=15)
        results_frame.pack(fill=tk.X, pady=(0, 10))
        
        results_grid = ttk.Frame(results_frame)
        results_grid.pack()
        
        # Key metrics
        ttk.Label(results_grid, text="Transfer Efficiency:", font=("Arial", 12, "bold")).grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        self.transfer_result_label = ttk.Label(results_grid, textvariable=self.transfer_efficiency, 
                                              font=("Arial", 12), foreground='blue')
        self.transfer_result_label.grid(row=0, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Discrimination Factor:", font=("Arial", 12, "bold")).grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        self.discrimination_result_label = ttk.Label(results_grid, textvariable=self.discrimination_factor, 
                                                    font=("Arial", 12), foreground='green')
        self.discrimination_result_label.grid(row=1, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Peak Shape Index:", font=("Arial", 12, "bold")).grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        self.peak_shape_result_label = ttk.Label(results_grid, textvariable=self.peak_shape_index, 
                                                font=("Arial", 12), foreground='purple')
        self.peak_shape_result_label.grid(row=2, column=1, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(results_grid, text="Optimization Score:", font=("Arial", 12, "bold")).grid(row=3, column=0, sticky=tk.W, padx=10, pady=5)
        self.optimization_result_label = ttk.Label(results_grid, textvariable=self.optimization_score, 
                                                  font=("Arial", 12), foreground='red')
        self.optimization_result_label.grid(row=3, column=1, sticky=tk.W, padx=10, pady=5)
        
        # Detailed analysis
        analysis_frame = ttk.LabelFrame(panel, text="Real-World Analysis", padding=15)
        analysis_frame.pack(fill=tk.BOTH, expand=True)
        
        self.analysis_text = tk.Text(analysis_frame, height=20, wrap=tk.WORD, font=("Arial", 10))
        analysis_scroll = ttk.Scrollbar(analysis_frame, command=self.analysis_text.yview)
        self.analysis_text.configure(yscrollcommand=analysis_scroll.set)
        
        self.analysis_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        analysis_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        return panel
    
    # Event handlers and calculations
    def on_parameter_change(self, event=None):
        """Handle parameter changes - MASTER UPDATE FUNCTION"""
        self.update_all_displays()
        
        # Real-time simulation if enabled
        if self.realtime_enabled.get():
            self.simulate_injection()
    
    def update_all_displays(self):
        """Update all display labels and analyses"""
        # Update parameter display labels
        self.inlet_temp_label.config(text=f"{self.inlet_temp.get():.1f} C")
        self.split_ratio_label.config(text=f"{self.split_ratio.get():.0f}:1")
        self.purge_flow_label.config(text=f"{self.purge_flow.get():.1f} mL/min")
        self.injection_volume_label.config(text=f"{self.injection_volume.get():.1f} uL")
        self.viscosity_label.config(text=f"{self.sample_viscosity.get():.1f}x H2O")
        
        # Update instrument condition labels
        if hasattr(self, 'age_label'):
            self.age_label.config(text=f"{self.instrument_age.get():.0f} years")
        if hasattr(self, 'vacuum_label'):
            self.vacuum_label.config(text=f"{self.vacuum_integrity.get():.0f}%")
    
    def update_temp_label(self, value=None):
        """Update temperature label in real-time"""
        self.inlet_temp_label.config(text=f"{self.inlet_temp.get():.1f} C")
        self.on_parameter_change()
    
    def update_split_label(self, value=None):
        """Update split ratio label in real-time"""
        self.split_ratio_label.config(text=f"{self.split_ratio.get():.0f}:1")
        self.on_parameter_change()
    
    def update_purge_label(self, value=None):
        """Update purge flow label in real-time"""
        self.purge_flow_label.config(text=f"{self.purge_flow.get():.1f} mL/min")
        self.on_parameter_change()
    
    def update_volume_label(self, value=None):
        """Update injection volume label in real-time"""
        self.injection_volume_label.config(text=f"{self.injection_volume.get():.1f} uL")
        self.on_parameter_change()
    
    def update_viscosity_label(self, value=None):
        """Update viscosity label in real-time"""
        self.viscosity_label.config(text=f"{self.sample_viscosity.get():.1f}x H2O")
        self.on_parameter_change()
    
    def update_age_label(self, value=None):
        """Update instrument age label in real-time"""
        if hasattr(self, 'age_label'):
            self.age_label.config(text=f"{self.instrument_age.get():.0f} years")
        self.on_parameter_change()
    
    def update_vacuum_label(self, value=None):
        """Update vacuum integrity label in real-time"""
        if hasattr(self, 'vacuum_label'):
            self.vacuum_label.config(text=f"{self.vacuum_integrity.get():.0f}%")
        self.on_parameter_change()
    
    def open_calibration_dialog(self):
        """Open the performance calibration dialog"""
        dialog = CalibrationDialog(self.root)
        self.root.wait_window(dialog.dialog)
        
        # Check if calibration was saved and apply it
        if hasattr(dialog, 'calibration_data') and dialog.calibration_data:
            self.apply_calibration(dialog.calibration_data)
    
    def apply_calibration(self, calibration_data):
        """Apply calibration data to the simulator"""
        self.calibration_data = calibration_data
        self.is_calibrated = True
        
        # Update calibration status
        self.calibration_status.set(f"Calibrated: {calibration_data['instrument_name']}")
        self.calibration_status_label.config(foreground='green')
        
        # Update simulation with calibrated targets
        if self.realtime_enabled.get():
            self.simulate_injection()
    
    def load_calibration_profile(self):
        """Load a saved calibration profile"""
        from tkinter import filedialog
        
        filename = filedialog.askopenfilename(
            title="Load Calibration Profile",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                with open(filename, 'r') as f:
                    calibration_data = json.load(f)
                
                self.apply_calibration(calibration_data)
                messagebox.showinfo("Profile Loaded", f"Calibration profile loaded successfully!")
                
            except Exception as e:
                messagebox.showerror("Load Error", f"Error loading calibration profile:\n{str(e)}")
    
    def export_to_detection_calculator(self):
        """Export optimized inlet parameters to detection limit calculator"""
        try:
            # Create method data with current inlet parameters
            method_data = {
                'method_name': f"Inlet_Optimized_Method_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'created_by': 'GC Inlet Simulator',
                'creation_date': datetime.now().strftime("%Y-%m-%d %H:%M"),
                'inlet_parameters': {
                    'inlet_temp': self.inlet_temp.get(),
                    'split_ratio': self.split_ratio.get(),
                    'purge_flow': self.purge_flow.get(),
                    'injection_mode': self.injection_mode.get(),
                    'injection_volume': self.injection_volume.get(),
                    'sample_viscosity': self.sample_viscosity.get(),
                    'matrix_type': self.matrix_type.get()
                },
                'instrument_condition': {
                    'instrument_age': self.instrument_age.get(),
                    'maintenance_level': self.maintenance_level.get(),
                    'vacuum_integrity': self.vacuum_integrity.get(),
                    'septum_condition': self.septum_condition.get(),
                    'liner_condition': self.liner_condition.get()
                },
                'optimization_results': {
                    'transfer_efficiency': self.transfer_efficiency.get(),
                    'discrimination_factor': self.discrimination_factor.get(),
                    'peak_shape_index': self.peak_shape_index.get(),
                    'optimization_score': self.optimization_score.get()
                },
                'calibration_data': self.calibration_data if self.is_calibrated else None
            }
            
            # Save to file
            filename = f"inlet_optimized_method_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(method_data, f, indent=2)
            
            messagebox.showinfo("Export Successful", 
                              f"Optimized inlet parameters exported to:\n{filename}\n\n"
                              f"Use 'Import from Inlet Simulator' in the Detection Limit Calculator to load these settings.")
            
        except Exception as e:
            messagebox.showerror("Export Error", f"Error exporting to detection calculator:\n{str(e)}")
    
    def open_instrument_manager(self):
        """Open the instrument manager window"""
        try:
            # Import instrument manager
            import sys
            sys.path.append('.')
            from instrument_manager import InstrumentManager
            
            # Create instrument manager instance
            self.instrument_manager = InstrumentManager(self.root)
            
            # Set callback for when instrument is applied
            if hasattr(self.instrument_manager, 'set_apply_callback'):
                self.instrument_manager.set_apply_callback(self.apply_instrument_profile)
            
        except Exception as e:
            messagebox.showerror("Instrument Manager Error", f"Error opening instrument manager:\n{str(e)}")
    
    def apply_instrument_profile(self, instrument_data):
        """Apply instrument profile to the simulator"""
        try:
            # Update current instrument profile
            self.current_instrument_profile = instrument_data.copy()
            self.current_instrument_name.set(instrument_data.get('name', 'Unknown Instrument'))
            
            # Apply instrument parameters to simulator
            if 'age_years' in instrument_data:
                self.instrument_age.set(instrument_data['age_years'])
            if 'maintenance_level' in instrument_data:
                self.maintenance_level.set(instrument_data['maintenance_level'])
            if 'vacuum_integrity' in instrument_data:
                self.vacuum_integrity.set(instrument_data['vacuum_integrity'])
            if 'septum_condition' in instrument_data:
                self.septum_condition.set(instrument_data['septum_condition'])
            if 'liner_condition' in instrument_data:
                self.liner_condition.set(instrument_data['liner_condition'])
            
            # Update displays
            self.update_all_displays()
            
            # Trigger simulation if real-time is enabled
            if self.realtime_enabled.get():
                self.simulate_injection()
            
            messagebox.showinfo("Instrument Applied", f"Instrument profile '{instrument_data.get('name', 'Unknown')}' applied successfully!")
            
        except Exception as e:
            messagebox.showerror("Apply Error", f"Error applying instrument profile:\n{str(e)}")
    
    def quick_load_instrument_profile(self, event=None):
        """Quick load an instrument profile from dropdown"""
        selected = self.quick_load_instrument.get()
        if selected and selected != "":
            try:
                # Load instrument data from file
                instrument_file = f"instruments/{selected}.json"
                if os.path.exists(instrument_file):
                    with open(instrument_file, 'r') as f:
                        instrument_data = json.load(f)
                    
                    self.apply_instrument_profile(instrument_data)
                else:
                    messagebox.showerror("Load Error", f"Instrument profile '{selected}' not found.")
                    
            except Exception as e:
                messagebox.showerror("Load Error", f"Error loading instrument profile:\n{str(e)}")
    
    def save_current_as_profile(self):
        """Save current simulator settings as an instrument profile"""
        try:
            # Get current instrument data
            instrument_data = {
                'name': self.current_instrument_name.get(),
                'model': 'GC Inlet Simulator Profile',
                'age_years': self.instrument_age.get(),
                'maintenance_level': self.maintenance_level.get(),
                'vacuum_integrity': self.vacuum_integrity.get(),
                'septum_condition': self.septum_condition.get(),
                'liner_condition': self.liner_condition.get(),
                'inlet_temp': self.inlet_temp.get(),
                'split_ratio': self.split_ratio.get(),
                'purge_flow': self.purge_flow.get(),
                'injection_volume': self.injection_volume.get(),
                'last_updated': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'notes': f"Saved from Inlet Simulator - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            }
            
            # Create instruments directory if it doesn't exist
            os.makedirs("instruments", exist_ok=True)
            
            # Save to file
            filename = f"instruments/{instrument_data['name'].replace(' ', '_')}.json"
            with open(filename, 'w') as f:
                json.dump(instrument_data, f, indent=2)
            
            # Refresh quick load dropdown
            self.refresh_quick_load_instruments()
            
            messagebox.showinfo("Profile Saved", f"Instrument profile saved as:\n{filename}")
            
        except Exception as e:
            messagebox.showerror("Save Error", f"Error saving instrument profile:\n{str(e)}")
    
    def refresh_quick_load_instruments(self):
        """Refresh the quick load instruments dropdown"""
        try:
            # Get list of saved instruments
            instruments = []
            if os.path.exists("instruments"):
                for file in os.listdir("instruments"):
                    if file.endswith(".json"):
                        instrument_name = file.replace(".json", "").replace("_", " ")
                        instruments.append(instrument_name)
            
            # Update dropdown
            self.quick_load_combo['values'] = instruments
            
        except Exception as e:
            print(f"Error refreshing instruments: {e}")
    
    def load_saved_instruments(self):
        """Load list of saved instruments on startup"""
        self.refresh_quick_load_instruments()
    
    def toggle_realtime(self):
        """Toggle real-time simulation"""
        if self.realtime_enabled.get():
            self.simulate_injection()
    
    def simulate_injection(self):
        """Main injection simulation"""
        try:
            # Calculate simulation metrics with real-world conditions
            transfer_eff = self.calculate_transfer_efficiency()
            discrimination = self.calculate_discrimination_factor()
            peak_shape = self.calculate_peak_shape_index()
            opt_score = self.calculate_optimization_score(transfer_eff, discrimination, peak_shape)
            
            # Update results
            self.transfer_efficiency.set(f"{transfer_eff:.1f}%")
            self.discrimination_factor.set(f"{discrimination:.2f}")
            self.peak_shape_index.set(f"{peak_shape:.2f}")
            self.optimization_score.set(f"{opt_score:.0f}/100")
            
            # Generate detailed analysis
            self.generate_detailed_analysis(transfer_eff, discrimination, peak_shape, opt_score)
            
        except Exception as e:
            messagebox.showerror("Simulation Error", f"Error running simulation:\n{str(e)}")
    
    def calculate_transfer_efficiency(self) -> float:
        """Calculate sample transfer efficiency with real-world conditions"""
        base_efficiency = 85.0  # Base efficiency percentage
        
        # Injection mode effects
        if self.injection_mode.get() == "Splitless":
            base_efficiency += 10.0
        elif self.injection_mode.get() == "Split":
            base_efficiency -= self.split_ratio.get() * 0.1
        
        # Temperature effects
        temp = self.inlet_temp.get()
        if temp < 200:
            base_efficiency *= 0.8
        elif temp > 350:
            base_efficiency *= 0.9
        
        # Volume effects
        if self.injection_volume.get() > 5.0:
            base_efficiency *= 0.9
        
        # Matrix effects
        matrix_factors = {
            'Light Hydrocarbon': 1.0,
            'Heavy Hydrocarbon': 0.9,
            'Oxygenated': 0.85,
            'Aqueous': 0.8,
            'Complex Matrix': 0.75
        }
        base_efficiency *= matrix_factors.get(self.matrix_type.get(), 1.0)
        
        # REAL-WORLD DEGRADATION FACTORS
        # Instrument age impact
        age = self.instrument_age.get()
        if age > 20:
            base_efficiency *= 0.75  # 25% loss for very old instruments
        elif age > 10:
            base_efficiency *= 0.9   # 10% loss for older instruments
        
        # Maintenance impact
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.95,
            'Fair': 0.85,
            'Poor': 0.7,
            'Neglected': 0.5
        }
        base_efficiency *= maintenance_factors.get(self.maintenance_level.get(), 1.0)
        
        # Vacuum integrity impact
        vacuum = self.vacuum_integrity.get()
        vacuum_factor = vacuum / 100.0
        base_efficiency *= vacuum_factor
        
        # Septum condition impact
        septum_factors = {
            'New': 1.0,
            'Good': 0.98,
            'Worn': 0.92,
            'Leaking': 0.75,
            'Badly Damaged': 0.5
        }
        base_efficiency *= septum_factors.get(self.septum_condition.get(), 1.0)
        
        # Liner condition impact
        liner_factors = {
            'Clean': 1.0,
            'Lightly Contaminated': 0.95,
            'Contaminated': 0.85,
            'Heavily Contaminated': 0.7,
            'Needs Replacement': 0.5
        }
        base_efficiency *= liner_factors.get(self.liner_condition.get(), 1.0)
        
        # Apply calibration if available
        if self.is_calibrated:
            base_efficiency *= self.calibration_data['transfer_efficiency_ratio']
        
        return min(max(base_efficiency, 5.0), 98.0)
    
    def calculate_discrimination_factor(self) -> float:
        """Calculate discrimination factor with real-world conditions"""
        base_discrimination = 1.0  # Perfect = 1.0, higher = more discrimination
        
        # Split ratio effects
        if self.injection_mode.get() == "Split":
            base_discrimination += (self.split_ratio.get() - 1) * 0.001
        
        # Temperature effects
        temp_factor = max(0, (self.inlet_temp.get() - 250) / 100)
        base_discrimination -= temp_factor * 0.1
        
        # Real-world degradation factors
        age = self.instrument_age.get()
        if age > 20:
            base_discrimination += 0.15  # Poor temperature stability
        elif age > 10:
            base_discrimination += 0.08
        
        # Poor maintenance increases discrimination
        maintenance_factors = {
            'Excellent': 0.0,
            'Good': 0.02,
            'Fair': 0.08,
            'Poor': 0.15,
            'Neglected': 0.25
        }
        base_discrimination += maintenance_factors.get(self.maintenance_level.get(), 0.0)
        
        # Apply calibration if available
        if self.is_calibrated:
            base_discrimination *= self.calibration_data['discrimination_ratio']
        
        return max(base_discrimination, 0.8)
    
    def calculate_peak_shape_index(self) -> float:
        """Calculate peak shape quality index with real-world conditions"""
        base_shape = 1.0  # Perfect symmetry = 1.0
        
        # Volume effects
        if self.injection_volume.get() > 5.0:
            base_shape *= 0.95
        
        # Temperature effects
        if self.inlet_temp.get() < 200:
            base_shape *= 0.9  # Poor vaporization
        
        # Real-world degradation factors
        age = self.instrument_age.get()
        if age > 20:
            base_shape *= 0.75  # Significant peak distortion
        elif age > 10:
            base_shape *= 0.85
        
        # Maintenance impact
        maintenance_factors = {
            'Excellent': 1.0,
            'Good': 0.98,
            'Fair': 0.92,
            'Poor': 0.8,
            'Neglected': 0.65
        }
        base_shape *= maintenance_factors.get(self.maintenance_level.get(), 1.0)
        
        # Contaminated liner impact
        liner_factors = {
            'Clean': 1.0,
            'Lightly Contaminated': 0.95,
            'Contaminated': 0.85,
            'Heavily Contaminated': 0.7,
            'Needs Replacement': 0.5
        }
        base_shape *= liner_factors.get(self.liner_condition.get(), 1.0)
        
        # Apply calibration if available
        if self.is_calibrated:
            base_shape *= self.calibration_data['peak_shape_ratio']
        
        return max(base_shape, 0.4)
    
    def calculate_optimization_score(self, transfer_eff: float, discrimination: float, peak_shape: float) -> float:
        """Calculate overall optimization score"""
        # Weighted combination of all factors
        transfer = transfer_eff / 100.0
        discrimination_score = 2.0 - discrimination  # Lower discrimination is better
        
        # Weighted score
        score = (transfer * 0.4 + discrimination_score * 0.3 + peak_shape * 0.3) * 100
        
        return max(min(score, 100.0), 0.0)
    
    def generate_detailed_analysis(self, transfer_eff: float, discrimination: float, 
                                 peak_shape: float, opt_score: float):
        """Generate detailed simulation analysis"""
        
        analysis = []
        analysis.append("GC INLET SIMULATION ANALYSIS\n")
        analysis.append("="*50 + "\n\n")
        
        # Performance summary
        analysis.append(f"PERFORMANCE SUMMARY:\n")
        
        if self.is_calibrated:
            # Calculate theoretical values for comparison
            theoretical_transfer = transfer_eff / self.calibration_data['transfer_efficiency_ratio']
            theoretical_discrimination = discrimination / self.calibration_data['discrimination_ratio']
            theoretical_peak_shape = peak_shape / self.calibration_data['peak_shape_ratio']
            
            analysis.append(f"   Transfer Efficiency: {transfer_eff:.1f}% (Your instrument)\n")
            analysis.append(f"   Theoretical Efficiency: {theoretical_transfer:.1f}% (Ideal conditions)\n")
            analysis.append(f"   Discrimination Factor: {discrimination:.2f} (Your instrument)\n")
            analysis.append(f"   Theoretical Discrimination: {theoretical_discrimination:.2f} (Ideal conditions)\n")
            analysis.append(f"   Peak Shape Index: {peak_shape:.2f} (Your instrument)\n")
            analysis.append(f"   Theoretical Peak Shape: {theoretical_peak_shape:.2f} (Ideal conditions)\n")
            analysis.append(f"   Overall Score: {opt_score:.0f}/100\n\n")
            
            analysis.append(f"CALIBRATION STATUS:\n")
            analysis.append(f"   Instrument: {self.calibration_data['instrument_name']}\n")
            analysis.append(f"   Calibrated: {self.calibration_data['calibration_date']}\n")
            analysis.append(f"   Performance Ratio: {self.calibration_data['transfer_efficiency_ratio']:.3f}\n\n")
        else:
            analysis.append(f"   Transfer Efficiency: {transfer_eff:.1f}%\n")
            analysis.append(f"   Discrimination Factor: {discrimination:.2f}\n")
            analysis.append(f"   Peak Shape Index: {peak_shape:.2f}\n")
            analysis.append(f"   Overall Score: {opt_score:.0f}/100\n\n")
            analysis.append(f"NOTE: Not calibrated - showing theoretical values\n")
            analysis.append(f"Use 'Calibrate Performance' for realistic targets\n\n")
        
        # Real-world assessment
        age = self.instrument_age.get()
        maintenance = self.maintenance_level.get()
        vacuum = self.vacuum_integrity.get()
        
        analysis.append(f"REAL-WORLD ASSESSMENT:\n")
        analysis.append(f"   Instrument Age: {age:.0f} years\n")
        analysis.append(f"   Maintenance Level: {maintenance}\n")
        analysis.append(f"   Vacuum Integrity: {vacuum:.0f}%\n\n")
        
        # Recommendations
        analysis.append(f"OPTIMIZATION RECOMMENDATIONS:\n")
        
        if transfer_eff < 60:
            analysis.append(f"   • CRITICAL: Very low transfer efficiency\n")
            analysis.append(f"   • Check instrument maintenance immediately\n")
            analysis.append(f"   • Consider instrument overhaul\n")
        elif transfer_eff < 80:
            analysis.append(f"   • Consider splitless injection for better transfer\n")
            analysis.append(f"   • Check inlet temperature optimization\n")
        
        if age > 20 and maintenance in ["Poor", "Neglected"]:
            analysis.append(f"   • OLD INSTRUMENT ALERT: Major issues expected\n")
            analysis.append(f"   • Results may not match literature values\n")
            analysis.append(f"   • Plan comprehensive maintenance or replacement\n")
        
        if vacuum < 85:
            analysis.append(f"   • VACUUM SYSTEM ISSUES: Check for leaks\n")
            analysis.append(f"   • Inspect septum and fittings\n")
        
        # Overall assessment
        analysis.append(f"\nOVERALL ASSESSMENT:\n")
        if opt_score > 85:
            analysis.append(f"   ✓ Excellent optimization! Method ready for use.\n")
        elif opt_score > 70:
            analysis.append(f"   ⚠ Good optimization, minor improvements possible.\n")
        elif opt_score > 50:
            analysis.append(f"   ! Fair performance, significant optimization needed.\n")
        else:
            analysis.append(f"   ✗ Poor performance, major issues require attention.\n")
        
        # Display analysis
        self.analysis_text.delete(1.0, tk.END)
        self.analysis_text.insert(1.0, ''.join(analysis))
    
    def load_liner_database(self) -> Dict:
        """Load liner database"""
        return {
            "4mm Split w/ Wool": {"volume": 920, "packing": "Wool", "type": "Split"},
            "4mm Split w/o Wool": {"volume": 920, "packing": "None", "type": "Split"},
            "4mm Splitless w/ Wool": {"volume": 920, "packing": "Wool", "type": "Splitless"},
            "4mm Splitless Single Taper": {"volume": 780, "packing": "None", "type": "Splitless"},
            "2mm Splitless w/ Wool": {"volume": 230, "packing": "Wool", "type": "Splitless"},
        }
    
    def load_injection_modes(self) -> Dict:
        """Load injection mode database"""
        return {
            "Split": {"description": "Sample divided between column and vent"},
            "Splitless": {"description": "All sample transferred to column"},
            "Pulsed Split": {"description": "High pressure pulse followed by split"},
            "Pulsed Splitless": {"description": "High pressure pulse in splitless mode"},
        }
    
    def run(self):
        """Start the application"""
        self.root.mainloop()

def main():
    """Main entry point"""
    app = GCInletSimulator()
    app.run()

if __name__ == "__main__":
    main()