import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChromatogramSimulator from '../pages/tools/ChromatogramSimulator';
import * as api from '../lib/api';

// Mock the API
vi.mock('../lib/api', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

// Mock Plotly component
vi.mock('../components/charts/PlotlyChart', () => ({
  default: ({ data, layout, onHover }: any) => (
    <div 
      data-testid="plotly-chart"
      onMouseMove={() => onHover?.({ points: [{ x: 5.5, y: 1200 }] })}
    >
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-layout">{JSON.stringify(layout)}</div>
    </div>
  )
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = vi.fn();

describe('ChromatogramSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders chromatogram simulator interface', () => {
    render(<ChromatogramSimulator />);
    
    expect(screen.getByText('Chromatogram Simulator')).toBeInTheDocument();
    expect(screen.getByText('Method Parameters')).toBeInTheDocument();
    expect(screen.getByText('Live Chromatogram')).toBeInTheDocument();
  });

  it('renders temperature program controls', () => {
    render(<ChromatogramSimulator />);
    
    expect(screen.getByLabelText(/start temp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end temp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ramp rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hold time/i)).toBeInTheDocument();
  });

  it('renders chromatographic conditions controls', () => {
    render(<ChromatogramSimulator />);
    
    expect(screen.getByLabelText(/carrier flow/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/split ratio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inlet temp/i)).toBeInTheDocument();
  });

  it('renders sample profile selector', () => {
    render(<ChromatogramSimulator />);
    
    expect(screen.getByText('Compound Mix')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Light Hydrocarbons C1-C6')).toBeInTheDocument();
  });

  it('updates parameter values when inputs change', () => {
    render(<ChromatogramSimulator />);
    
    const startTempInput = screen.getByLabelText(/start temp/i);
    fireEvent.change(startTempInput, { target: { value: '60' } });
    
    expect(startTempInput).toHaveValue(60);
  });

  it('calculates and displays estimated runtime', () => {
    render(<ChromatogramSimulator />);
    
    // Should show initial estimated runtime
    expect(screen.getByText(/estimated runtime/i)).toBeInTheDocument();
    expect(screen.getByText(/25.0 minutes/i)).toBeInTheDocument(); // (280-50)/10 + 2 + 2
  });

  it('updates estimated runtime when parameters change', () => {
    render(<ChromatogramSimulator />);
    
    const rampRateInput = screen.getByLabelText(/ramp rate/i);
    fireEvent.change(rampRateInput, { target: { value: '20' } });
    
    // Runtime should update: (280-50)/20 + 2 + 2 = 15.5 minutes
    expect(screen.getByText(/15.5 minutes/i)).toBeInTheDocument();
  });

  it('starts simulation when run button is clicked', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      signal_points: [0, 10, 50, 120, 800, 1200, 900, 400, 100, 20, 0],
      peaks: [
        {
          compound: 'Methane',
          retention_time: 2.1,
          peak_height: 800,
          peak_area: 1500
        },
        {
          compound: 'Ethane',
          retention_time: 3.5,
          peak_height: 1200,
          peak_area: 2200
        }
      ],
      analysis_summary: {
        total_peaks: 2,
        best_resolution: 2.5,
        analysis_efficiency: 0.85
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    expect(screen.getByText('Starting...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.apiClient.post).toHaveBeenCalledWith('/chromatogram/simulate', expect.any(Object));
    });
  });

  it('displays chart when simulation starts', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
  });

  it('pauses and resumes simulation', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Should now show pause button
    const pauseButton = screen.getByRole('button', { name: '' }); // Pause icon button
    fireEvent.click(pauseButton);
    
    // Should now show play button for resume
    const resumeButton = screen.getByRole('button', { name: '' }); // Play icon button
    expect(resumeButton).toBeInTheDocument();
  });

  it('stops simulation', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    const stopButton = screen.getByRole('button', { name: '' }); // Stop icon button
    fireEvent.click(stopButton);
    
    // Should be back to initial state
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('changes playback speed', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Click 2x speed button
    const speed2xButton = screen.getByText('2×');
    fireEvent.click(speed2xButton);
    
    // Button should be selected (default variant)
    expect(speed2xButton).toHaveClass('bg-blue-600'); // default variant styling
  });

  it('displays peak information when peaks are detected', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      signal_points: [0, 10, 50, 120, 800, 1200, 900, 400, 100, 20, 0],
      peaks: [
        {
          compound: 'Methane',
          retention_time: 2.1,
          peak_height: 800,
          peak_area: 1500
        },
        {
          compound: 'Ethane',
          retention_time: 3.5,
          peak_height: 1200,
          peak_area: 2200
        }
      ],
      analysis_summary: {
        total_peaks: 2,
        best_resolution: 2.5,
        analysis_efficiency: 0.85
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Detected Peaks')).toBeInTheDocument();
      expect(screen.getByText('Methane')).toBeInTheDocument();
      expect(screen.getByText('Ethane')).toBeInTheDocument();
      expect(screen.getByText('2.10 min')).toBeInTheDocument();
      expect(screen.getByText('3.50 min')).toBeInTheDocument();
    });
  });

  it('displays analysis summary', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 5,
        best_resolution: 3.2,
        analysis_efficiency: 0.92
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total peaks
      expect(screen.getByText('3.2')).toBeInTheDocument(); // Best resolution
      expect(screen.getByText('92%')).toBeInTheDocument(); // Efficiency percentage
    });
  });

  it('displays crosshair information on hover', async () => {
    const mockResponse = {
      time_points: [0, 1, 2, 3, 4, 5],
      signal_points: [0, 10, 50, 120, 800, 1200],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Trigger hover event
    const chart = screen.getByTestId('plotly-chart');
    fireEvent.mouseMove(chart);
    
    // Should show crosshair info
    expect(screen.getByText(/RT:/)).toBeInTheDocument();
    expect(screen.getByText(/Response:/)).toBeInTheDocument();
  });

  it('exports CSV data', async () => {
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    const mockResponse = {
      time_points: [0, 1, 2],
      signal_points: [0, 10, 50],
      peaks: [
        {
          compound: 'Test',
          retention_time: 1.5,
          peak_height: 25,
          peak_area: 100
        }
      ],
      analysis_summary: {
        total_peaks: 1,
        best_resolution: 1.0,
        analysis_efficiency: 0.8
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('exports PNG image', async () => {
    // Mock Plotly downloadImage
    (window as any).Plotly = {
      downloadImage: vi.fn()
    };
    
    const mockResponse = {
      time_points: [0, 1, 2],
      signal_points: [0, 10, 50],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    const pngButton = screen.getByText('PNG');
    fireEvent.click(pngButton);
    
    expect((window as any).Plotly.downloadImage).toHaveBeenCalled();
  });

  it('displays error message when simulation fails', async () => {
    (api.apiClient.post as any).mockRejectedValue(new Error('Simulation failed'));
    
    render(<ChromatogramSimulator />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Simulation failed')).toBeInTheDocument();
    });
  });

  it('validates temperature program parameters', () => {
    render(<ChromatogramSimulator />);
    
    // Set end temp lower than start temp
    const startTempInput = screen.getByLabelText(/start temp/i);
    const endTempInput = screen.getByLabelText(/end temp/i);
    
    fireEvent.change(startTempInput, { target: { value: '300' } });
    fireEvent.change(endTempInput, { target: { value: '200' } });
    
    // Runtime should handle this gracefully
    expect(screen.getByText(/estimated runtime/i)).toBeInTheDocument();
  });

  it('changes compound profile', () => {
    render(<ChromatogramSimulator />);
    
    const profileSelect = screen.getByDisplayValue('Light Hydrocarbons C1-C6');
    fireEvent.change(profileSelect, { target: { value: 'BTEX' } });
    
    expect(screen.getByDisplayValue('BTEX Aromatics')).toBeInTheDocument();
    expect(screen.getByText('Environmental monitoring of aromatic hydrocarbons')).toBeInTheDocument();
  });

  it('toggles overlay of previous run', async () => {
    const mockResponse = {
      time_points: [0, 1, 2],
      signal_points: [0, 10, 50],
      peaks: [],
      analysis_summary: {
        total_peaks: 0,
        best_resolution: 0,
        analysis_efficiency: 0
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<ChromatogramSimulator />);
    
    // Run first simulation
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Stop simulation to save as last run
    const stopButton = screen.getByRole('button', { name: '' }); // Stop icon button
    fireEvent.click(stopButton);
    
    // Run again
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Should now be able to toggle overlay
    const overlayButton = screen.getByText('Overlay Last Run');
    expect(overlayButton).not.toBeDisabled();
  });
});