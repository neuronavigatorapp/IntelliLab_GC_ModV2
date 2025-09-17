"""
Generate realistic GC chromatograms for testing ChromaVision OCR and AI functionality.
Creates both high-quality and poor-quality chromatograms with realistic parameters.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import matplotlib.patches as mpatches
from datetime import datetime
import os

def gaussian_peak(x, amplitude, center, width):
    """Generate a Gaussian peak."""
    return amplitude * np.exp(-0.5 * ((x - center) / width) ** 2)

def exponentially_modified_gaussian(x, amplitude, center, width, tau):
    """Generate an exponentially modified Gaussian (EMG) peak - more realistic for GC."""
    return amplitude * np.exp(0.5 * (width/tau)**2 - (x-center)/tau) * \
           (1 + np.sign(x-center) * np.sqrt(np.pi/2) * (width/tau) * 
            np.exp(0.5 * ((x-center)/width)**2))

def create_good_chromatogram():
    """Create a high-quality GC chromatogram with well-separated peaks."""
    print("Creating high-quality GC chromatogram...")
    
    # Time axis (minutes)
    time = np.linspace(0, 30, 3000)
    
    # Initialize baseline
    baseline = np.zeros_like(time)
    
    # Add very slight baseline drift (normal)
    baseline += 0.2 * np.sin(0.1 * time) + 0.1 * time * 0.01
    
    # Define well-separated peaks with realistic retention times
    peaks_data = [
        # [amplitude, retention_time, width, tau, compound_name]
        [8.5, 3.2, 0.08, 0.05, "Methanol"],
        [12.3, 5.8, 0.12, 0.08, "Ethanol"],
        [15.7, 8.4, 0.15, 0.10, "Propanol"],
        [22.1, 12.1, 0.18, 0.12, "Butanol"],
        [18.9, 15.6, 0.20, 0.14, "Pentanol"],
        [14.2, 19.3, 0.22, 0.16, "Hexanol"],
        [9.8, 23.7, 0.25, 0.18, "Heptanol"],
        [6.1, 27.2, 0.28, 0.20, "Octanol"]
    ]
    
    signal = baseline.copy()
    
    # Add peaks using EMG (more realistic than Gaussian)
    for amplitude, rt, width, tau, name in peaks_data:
        peak = exponentially_modified_gaussian(time, amplitude, rt, width, tau)
        signal += peak
    
    # Add minimal noise (high S/N ratio)
    noise = np.random.normal(0, 0.05, len(time))
    signal += noise
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.plot(time, signal, 'b-', linewidth=1.0)
    
    # Styling for professional appearance
    ax.set_xlabel('Retention Time (min)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Response (mV)', fontsize=12, fontweight='bold')
    ax.set_title('GC-FID Chromatogram - Alcohol Standards\nHigh Quality Analysis', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Grid and styling
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_facecolor('#fafafa')
    
    # Add instrument info text box
    info_text = """Instrument: Agilent 7890B GC-FID
Column: DB-WAX 30m x 0.25mm x 0.25µm
Carrier Gas: Helium @ 1.2 mL/min
Injection: 1µL, Split 10:1
Detector: FID @ 250°C
Run Date: 2025-09-12 14:30:15"""
    
    ax.text(0.02, 0.98, info_text, transform=ax.transAxes, fontsize=8,
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    # Add peak labels
    for amplitude, rt, width, tau, name in peaks_data:
        peak_height = exponentially_modified_gaussian(rt, amplitude, rt, width, tau) + baseline[int(rt * 100)]
        ax.annotate(f'{name}\nRT: {rt:.1f}', xy=(rt, peak_height), 
                   xytext=(rt, peak_height + 3), ha='center',
                   fontsize=8, fontweight='bold',
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
    
    # Add analysis results
    results_text = """Peak Integration Results:
Total Peaks: 8
Resolution (avg): 2.8
Theoretical Plates: 12,500
Symmetry Factor: 1.02
Baseline Noise: 0.08 mV"""
    
    ax.text(0.98, 0.02, results_text, transform=ax.transAxes, fontsize=8,
            verticalalignment='bottom', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.8))
    
    plt.tight_layout()
    
    # Save with high DPI for OCR testing
    good_path = 'chromatogram_good_quality.png'
    plt.savefig(good_path, dpi=300, bbox_inches='tight')
    print(f"Good quality chromatogram saved as: {good_path}")
    
    plt.show()
    return good_path

def create_poor_chromatogram():
    """Create a poor-quality GC chromatogram with multiple problems."""
    print("Creating poor-quality GC chromatogram...")
    
    # Time axis
    time = np.linspace(0, 30, 3000)
    
    # Initialize problematic baseline with significant drift
    baseline = np.zeros_like(time)
    baseline += 2.0 * np.sin(0.2 * time) + 0.5 * time * 0.08  # Major baseline drift
    baseline += 1.5 * np.cos(0.15 * time + 1.2)  # Additional drift component
    
    # Define overlapping and poorly resolved peaks
    peaks_data = [
        # [amplitude, retention_time, width, tau, compound_name]
        [12.1, 3.1, 0.25, 0.20, "Unknown-1"],
        [14.3, 3.4, 0.28, 0.22, "Unknown-2"],  # Overlapping with previous
        [8.7, 5.9, 0.35, 0.25, "Impurity-A"],
        [19.2, 8.2, 0.40, 0.30, "Target-Compound"],
        [15.1, 8.6, 0.38, 0.28, "Degradant"],  # Poor separation
        [22.8, 12.3, 0.45, 0.35, "Matrix-Peak"],
        [11.4, 15.2, 0.50, 0.40, "Ghost-Peak"],
        [7.9, 18.1, 0.55, 0.45, "Artifact"],
        [13.2, 22.8, 0.60, 0.50, "Late-Eluter"],
        [5.3, 26.1, 0.65, 0.55, "Contaminant"]
    ]
    
    signal = baseline.copy()
    
    # Add peaks with poor shape (broader, asymmetric)
    for amplitude, rt, width, tau, name in peaks_data:
        # Make peaks more asymmetric and broader
        peak = exponentially_modified_gaussian(time, amplitude, rt, width * 1.5, tau * 2)
        signal += peak
    
    # Add significant noise and artifacts
    noise = np.random.normal(0, 0.8, len(time))  # High noise
    signal += noise
    
    # Add electronic spikes
    spike_positions = [500, 1200, 1800, 2400]
    for pos in spike_positions:
        if pos < len(signal):
            signal[pos-2:pos+3] += np.random.uniform(15, 25)  # Random spikes
    
    # Add detector saturation (flat tops)
    saturation_mask = signal > 25
    signal[saturation_mask] = 25 + np.random.normal(0, 0.5, np.sum(saturation_mask))
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.plot(time, signal, 'b-', linewidth=1.0, alpha=0.8)
    
    # Styling to show problems
    ax.set_xlabel('Retention Time (min)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Response (mV)', fontsize=12, fontweight='bold')
    ax.set_title('GC-FID Chromatogram - Failed Analysis\nPoor Quality - Multiple Issues Detected', 
                fontsize=14, fontweight='bold', color='red', pad=20)
    
    # Minimal grid to show poor presentation
    ax.grid(True, alpha=0.2, linestyle=':')
    ax.set_facecolor('#f0f0f0')
    
    # Add problematic instrument info
    problem_info = """Instrument: Agilent 7890B GC-FID
Column: DB-WAX 30m x 0.25mm (DEGRADED)
Carrier Gas: Helium @ 0.8 mL/min (LOW FLOW)
Injection: 2µL, Split 5:1 (OVERLOAD)
Detector: FID @ 300°C (OVERHEATED)
Run Date: 2025-09-12 16:45:22
STATUS: MAINTENANCE REQUIRED"""
    
    ax.text(0.02, 0.98, problem_info, transform=ax.transAxes, fontsize=8,
            verticalalignment='top', 
            bbox=dict(boxstyle='round', facecolor='#ffcccc', alpha=0.9))
    
    # Add problem indicators
    problems_text = """ANALYSIS PROBLEMS DETECTED:
❌ Severe baseline drift
❌ Poor peak resolution
❌ Electronic noise spikes
❌ Detector saturation
❌ Peak asymmetry (As > 2.0)
❌ Low theoretical plates
❌ Matrix interference
❌ Possible column degradation"""
    
    ax.text(0.98, 0.02, problems_text, transform=ax.transAxes, fontsize=8,
            verticalalignment='bottom', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='#ffdddd', alpha=0.9))
    
    # Highlight problem areas
    ax.axhspan(20, 30, alpha=0.2, color='red', label='Saturation Zone')
    
    plt.tight_layout()
    
    # Save with moderate DPI
    poor_path = 'chromatogram_poor_quality.png'
    plt.savefig(poor_path, dpi=300, bbox_inches='tight')
    print(f"Poor quality chromatogram saved as: {poor_path}")
    
    plt.show()
    return poor_path

def main():
    """Generate both test chromatograms."""
    print("=== ChromaVision Test Chromatogram Generator ===")
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Create output directory
    os.makedirs('test_images', exist_ok=True)
    os.chdir('test_images')
    
    # Generate both chromatograms
    good_path = create_good_chromatogram()
    print()
    poor_path = create_poor_chromatogram()
    
    print("\n=== Generation Complete ===")
    print(f"Good quality chromatogram: {os.path.abspath(good_path)}")
    print(f"Poor quality chromatogram: {os.path.abspath(poor_path)}")
    print("\nThese images are ready for ChromaVision OCR and AI analysis testing.")

if __name__ == "__main__":
    main()