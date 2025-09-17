"""
Test script to create sample chromatogram images for ChromaVision AI demo
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import io
import base64
from PIL import Image

def create_sample_chromatogram(scenario="good_separation"):
    """Create synthetic chromatogram for testing"""
    
    # Time axis (0-20 minutes)
    time = np.linspace(0, 20, 2000)
    baseline = 50 + 2 * time  # Slight baseline drift
    noise = np.random.normal(0, 2, len(time))
    
    # Peak parameters based on scenario
    if scenario == "good_separation":
        peaks = [
            {"rt": 3.2, "height": 800, "width": 0.15, "tailing": 1.1, "compound": "Methane"},
            {"rt": 5.8, "height": 1200, "width": 0.18, "tailing": 1.0, "compound": "Ethane"},
            {"rt": 8.1, "height": 950, "width": 0.22, "tailing": 1.05, "compound": "Propane"},
            {"rt": 11.4, "height": 1100, "width": 0.25, "tailing": 1.15, "compound": "n-Butane"},
            {"rt": 14.9, "height": 750, "width": 0.28, "tailing": 1.2, "compound": "n-Pentane"},
        ]
        
    elif scenario == "poor_resolution":
        peaks = [
            {"rt": 8.0, "height": 900, "width": 0.4, "tailing": 1.0, "compound": "Compound A"},
            {"rt": 8.6, "height": 800, "width": 0.38, "tailing": 1.1, "compound": "Compound B"},
            {"rt": 9.1, "height": 650, "width": 0.42, "tailing": 1.25, "compound": "Compound C"},
        ]
        
    elif scenario == "contaminated":
        # Main peaks plus ghost peaks
        peaks = [
            {"rt": 2.1, "height": 150, "width": 0.05, "tailing": 0.8, "compound": "Solvent Peak"},
            {"rt": 4.5, "height": 1000, "width": 0.2, "tailing": 1.0, "compound": "Target 1"},
            {"rt": 7.2, "height": 1200, "width": 0.22, "tailing": 1.1, "compound": "Target 2"},
            {"rt": 10.8, "height": 200, "width": 0.15, "tailing": 2.5, "compound": "Ghost Peak"},
            {"rt": 15.5, "height": 800, "width": 0.35, "tailing": 1.8, "compound": "Late Eluter"},
            {"rt": 18.2, "height": 300, "width": 0.8, "tailing": 3.2, "compound": "Column Bleed"},
        ]
        baseline += np.where(time > 12, (time - 12) * 15, 0)  # Rising baseline
        noise *= 2  # More noise
    
    # Generate chromatogram signal
    signal = baseline + noise
    
    for peak in peaks:
        # Exponentially modified Gaussian for peak shape with tailing
        center = peak["rt"]
        height = peak["height"]
        sigma = peak["width"] / 4  # Convert width to std dev
        tau = peak.get("tailing", 1.0) * sigma  # Tailing parameter
        
        # EMG peak calculation
        for i, t in enumerate(time):
            if t >= center - 5*sigma and t <= center + 10*tau:
                # Exponentially modified Gaussian
                z1 = (t - center) / sigma
                z2 = sigma / tau
                
                if tau > 0.001:  # Avoid division by zero
                    emg = (height * sigma / tau) * np.sqrt(np.pi/2) * np.exp(0.5 * z2**2 - z1/tau) * \
                          (1 + np.sign(z1 - z2**2) * 1)  # Simplified approximation
                    emg *= np.exp(-0.5 * max(0, z1 - z2**2)**2)
                else:
                    # Gaussian fallback
                    emg = height * np.exp(-0.5 * z1**2)
                
                signal[i] += max(0, emg)
    
    return time, signal, peaks

def create_chromatogram_plot(scenario="good_separation"):
    """Create a professional-looking chromatogram plot"""
    
    time, signal, peaks = create_sample_chromatogram(scenario)
    
    # Create figure with GC-style formatting
    fig, ax = plt.subplots(1, 1, figsize=(12, 6))
    fig.patch.set_facecolor('white')
    
    # Plot chromatogram
    ax.plot(time, signal, 'b-', linewidth=1.2, color='#1f4788')
    ax.fill_between(time, 0, signal, alpha=0.1, color='#1f4788')
    
    # Add peak labels for good separation scenario
    if scenario == "good_separation":
        for peak in peaks:
            peak_idx = np.argmin(np.abs(time - peak["rt"]))
            peak_height = signal[peak_idx]
            ax.annotate(f'{peak["compound"]}\n{peak["rt"]:.1f} min', 
                       xy=(peak["rt"], peak_height), 
                       xytext=(peak["rt"], peak_height + 200),
                       ha='center', va='bottom',
                       fontsize=9, color='#333333',
                       arrowprops=dict(arrowstyle='->', color='gray', lw=0.8))
    
    # Formatting
    ax.set_xlabel('Retention Time (min)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Signal Intensity (pA)', fontsize=12, fontweight='bold')
    ax.set_title(f'Gas Chromatogram - {scenario.replace("_", " ").title()}', 
                fontsize=14, fontweight='bold', pad=20)
    
    ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
    ax.set_xlim(0, 20)
    ax.set_ylim(0, max(signal) * 1.15)
    
    # Add analysis parameters text box
    params_text = "Analysis Conditions:\n• Column: DB-1, 30m × 0.25mm\n• Oven: 40°C (2min) → 10°C/min → 200°C\n• Detector: FID, 300°C\n• Carrier: Helium, 1.2 mL/min"
    ax.text(0.02, 0.98, params_text, transform=ax.transAxes, fontsize=8,
           verticalalignment='top', bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.8))
    
    plt.tight_layout()
    return fig

def save_chromatogram_image(scenario, filename):
    """Save chromatogram as image file"""
    fig = create_chromatogram_plot(scenario)
    fig.savefig(f"sample_chromatograms/{filename}", dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"Saved: sample_chromatograms/{filename}")

if __name__ == "__main__":
    import os
    
    # Create output directory
    os.makedirs("sample_chromatograms", exist_ok=True)
    
    # Generate sample chromatograms
    scenarios = {
        "good_separation": "excellent_separation.png",
        "poor_resolution": "poor_resolution.png", 
        "contaminated": "contaminated_analysis.png"
    }
    
    for scenario, filename in scenarios.items():
        save_chromatogram_image(scenario, filename)
    
    print("\n✅ Sample chromatograms created successfully!")
    print("📁 Files saved in: sample_chromatograms/")
    print("🔬 Ready for ChromaVision AI testing!")