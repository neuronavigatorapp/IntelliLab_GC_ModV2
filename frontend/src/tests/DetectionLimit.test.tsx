import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DetectionLimit from '../pages/simulators/DetectionLimit';
import * as api from '../lib/api';

// Mock the API
vi.mock('../lib/api', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

// Mock Plotly component
vi.mock('../components/charts/PlotlyChart', () => ({
  default: ({ data, layout }: any) => (
    <div data-testid="plotly-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-layout">{JSON.stringify(layout)}</div>
    </div>
  )
}));

describe('DetectionLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders detection limit calculator interface', () => {
    render(<DetectionLimit />);
    
    expect(screen.getByText('Detection Limit Calculator')).toBeInTheDocument();
    expect(screen.getByText('Method Parameters')).toBeInTheDocument();
    expect(screen.getByText('Statistical Results')).toBeInTheDocument();
  });

  it('renders input fields with default values', () => {
    render(<DetectionLimit />);
    
    expect(screen.getByLabelText(/concentration levels/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of replicates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confidence level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/signal to noise/i)).toBeInTheDocument();
  });

  it('updates parameter values when inputs change', () => {
    render(<DetectionLimit />);
    
    const concentrationInput = screen.getByLabelText(/concentration levels/i);
    fireEvent.change(concentrationInput, { target: { value: '5' } });
    
    expect(concentrationInput).toHaveValue(5);
  });

  it('calculates detection limit when button is clicked', async () => {
    const mockResponse = {
      detection_limit: 0.15,
      quantification_limit: 0.45,
      regression_stats: {
        slope: 1000,
        intercept: 50,
        r_squared: 0.995,
        std_error: 25
      },
      confidence_intervals: {
        detection_limit_lower: 0.12,
        detection_limit_upper: 0.18,
        quantification_limit_lower: 0.38,
        quantification_limit_upper: 0.52
      },
      residual_analysis: {
        residuals: [2.1, -1.8, 0.5, -0.8, 1.0],
        normality_test_p_value: 0.45,
        homoscedasticity_test_p_value: 0.62
      },
      calibration_data: {
        concentrations: [0.1, 0.2, 0.3, 0.4, 0.5],
        responses: [102, 198, 301, 392, 498],
        fitted_responses: [100, 200, 300, 400, 500]
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<DetectionLimit />);
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('0.150')).toBeInTheDocument(); // Detection limit
      expect(screen.getByText('0.450')).toBeInTheDocument(); // Quantification limit
    });
    
    expect(api.apiClient.post).toHaveBeenCalledWith('/detection-limit/calculate', expect.any(Object));
  });

  it('displays error message when calculation fails', async () => {
    (api.apiClient.post as any).mockRejectedValue(new Error('Calculation failed'));
    
    render(<DetectionLimit />);
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Calculation failed')).toBeInTheDocument();
    });
  });

  it('shows loading state during calculation', async () => {
    (api.apiClient.post as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<DetectionLimit />);
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });

  it('renders calibration curve when results are available', async () => {
    const mockResponse = {
      detection_limit: 0.15,
      quantification_limit: 0.45,
      regression_stats: {
        slope: 1000,
        intercept: 50,
        r_squared: 0.995,
        std_error: 25
      },
      confidence_intervals: {
        detection_limit_lower: 0.12,
        detection_limit_upper: 0.18,
        quantification_limit_lower: 0.38,
        quantification_limit_upper: 0.52
      },
      residual_analysis: {
        residuals: [2.1, -1.8, 0.5, -0.8, 1.0],
        normality_test_p_value: 0.45,
        homoscedasticity_test_p_value: 0.62
      },
      calibration_data: {
        concentrations: [0.1, 0.2, 0.3, 0.4, 0.5],
        responses: [102, 198, 301, 392, 498],
        fitted_responses: [100, 200, 300, 400, 500]
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<DetectionLimit />);
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
  });

  it('exports PNG when export button is clicked', async () => {
    // Mock Plotly downloadImage
    (window as any).Plotly = {
      downloadImage: vi.fn()
    };
    
    const mockResponse = {
      detection_limit: 0.15,
      quantification_limit: 0.45,
      regression_stats: {
        slope: 1000,
        intercept: 50,
        r_squared: 0.995,
        std_error: 25
      },
      confidence_intervals: {
        detection_limit_lower: 0.12,
        detection_limit_upper: 0.18,
        quantification_limit_lower: 0.38,
        quantification_limit_upper: 0.52
      },
      residual_analysis: {
        residuals: [2.1, -1.8, 0.5, -0.8, 1.0],
        normality_test_p_value: 0.45,
        homoscedasticity_test_p_value: 0.62
      },
      calibration_data: {
        concentrations: [0.1, 0.2, 0.3, 0.4, 0.5],
        responses: [102, 198, 301, 392, 498],
        fitted_responses: [100, 200, 300, 400, 500]
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<DetectionLimit />);
    
    // First calculate to get results
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
    });
    
    // Find and click export button
    const exportButton = screen.getByText('PNG');
    fireEvent.click(exportButton);
    
    expect((window as any).Plotly.downloadImage).toHaveBeenCalled();
  });

  it('validates input parameters', () => {
    render(<DetectionLimit />);
    
    // Test concentration levels validation
    const concentrationInput = screen.getByLabelText(/concentration levels/i);
    fireEvent.change(concentrationInput, { target: { value: '2' } }); // Below minimum
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    // Should show validation error or prevent calculation
    expect(api.apiClient.post).not.toHaveBeenCalled();
  });

  it('displays regression statistics', async () => {
    const mockResponse = {
      detection_limit: 0.15,
      quantification_limit: 0.45,
      regression_stats: {
        slope: 1000,
        intercept: 50,
        r_squared: 0.995,
        std_error: 25
      },
      confidence_intervals: {
        detection_limit_lower: 0.12,
        detection_limit_upper: 0.18,
        quantification_limit_lower: 0.38,
        quantification_limit_upper: 0.52
      },
      residual_analysis: {
        residuals: [2.1, -1.8, 0.5, -0.8, 1.0],
        normality_test_p_value: 0.45,
        homoscedasticity_test_p_value: 0.62
      },
      calibration_data: {
        concentrations: [0.1, 0.2, 0.3, 0.4, 0.5],
        responses: [102, 198, 301, 392, 498],
        fitted_responses: [100, 200, 300, 400, 500]
      }
    };

    (api.apiClient.post as any).mockResolvedValue(mockResponse);
    
    render(<DetectionLimit />);
    
    const calculateButton = screen.getByText('Calculate Detection Limit');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument(); // Slope
      expect(screen.getByText('50')).toBeInTheDocument(); // Intercept
      expect(screen.getByText('0.995')).toBeInTheDocument(); // R²
    });
  });
});