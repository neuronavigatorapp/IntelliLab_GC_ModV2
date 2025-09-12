import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import CalibrationManager from '../CalibrationManager';
import { calibrationAPI } from '../../../services/apiService';

// Mock the API service
jest.mock('../../../services/apiService', () => ({
  calibrationAPI: {
    listCalibrations: jest.fn(),
    listVersions: jest.fn(),
    fitCalibration: jest.fn(),
    activateCalibration: jest.fn(),
    validateCalibration: jest.fn(),
    exportCalibration: jest.fn(),
    getResiduals: jest.fn()
  }
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Scatter: () => <div data-testid="scatter" />,
  Line: () => <div data-testid="line" />
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockCalibrationData = {
  calibrations: [
    {
      id: 'cal-1',
      version_id: 'v1',
      method_id: 1,
      target_name: 'Benzene',
      model_type: 'linear',
      mode: 'external',
      outlier_policy: 'none',
      levels: [
        { target_name: 'Benzene', amount: 1.0, unit: 'ppm', area: 1000, included: true },
        { target_name: 'Benzene', amount: 5.0, unit: 'ppm', area: 5000, included: true }
      ],
      slope: 1000,
      intercept: 0,
      r2: 0.999,
      lod: 0.1,
      loq: 0.3,
      active: true,
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  total: 1,
  active_calibration_id: 'cal-1'
};

const mockVersionsData = [
  {
    id: 'v1',
    created_at: '2024-01-01T00:00:00Z',
    model: mockCalibrationData.calibrations[0]
  }
];

describe('CalibrationManager', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses
    (calibrationAPI.listCalibrations as jest.Mock).mockResolvedValue({
      data: mockCalibrationData
    });
    
    (calibrationAPI.listVersions as jest.Mock).mockResolvedValue({
      data: mockVersionsData
    });
  });

  test('renders calibration manager with basic elements', async () => {
    render(<CalibrationManager methodId={1} />);
    
    // Check if main title is rendered
    expect(screen.getByText('Enhanced Calibration Manager')).toBeInTheDocument();
    
    // Check if method/instrument selection is rendered
    expect(screen.getByLabelText('Method ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Instrument ID (Optional)')).toBeInTheDocument();
    
    // Wait for calibrations to load
    await waitFor(() => {
      expect(calibrationAPI.listCalibrations).toHaveBeenCalled();
      expect(calibrationAPI.listVersions).toHaveBeenCalled();
    });
  });

  test('displays active calibration when available', async () => {
    render(<CalibrationManager methodId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Calibration')).toBeInTheDocument();
      expect(screen.getByText('Benzene')).toBeInTheDocument();
      expect(screen.getByText('Active (external)')).toBeInTheDocument();
    });
  });

  test('allows switching between calibration modes', async () => {
    render(<CalibrationManager methodId={1} />);
    
    // Find and click the calibration mode dropdown
    const modeSelect = screen.getByLabelText('Calibration Mode');
    fireEvent.mouseDown(modeSelect);
    
    // Check that both options are available
    expect(screen.getByText('External Standard')).toBeInTheDocument();
    expect(screen.getByText('Internal Standard')).toBeInTheDocument();
    
    // Select internal standard mode
    fireEvent.click(screen.getByText('Internal Standard'));
    
    // Verify that internal standard configuration appears
    await waitFor(() => {
      expect(screen.getByText('Internal Standard Configuration')).toBeInTheDocument();
    });
  });

  test('allows adding and removing calibration levels', async () => {
    render(<CalibrationManager methodId={1} />);
    
    // Add a level
    const addButton = screen.getByRole('button', { name: /add level/i });
    fireEvent.click(addButton);
    
    // Check that a level row appears
    await waitFor(() => {
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // Amount field
    });
    
    // Add another level
    fireEvent.click(addButton);
    
    // Check that we now have 2 levels
    const deleteButtons = screen.getAllByLabelText('delete');
    expect(deleteButtons).toHaveLength(2);
    
    // Remove a level
    fireEvent.click(deleteButtons[0]);
    
    // Check that we're back to 1 level
    await waitFor(() => {
      const remainingDeleteButtons = screen.getAllByLabelText('delete');
      expect(remainingDeleteButtons).toHaveLength(1);
    });
  });

  test('allows selecting outlier policy', async () => {
    render(<CalibrationManager methodId={1} />);
    
    // Find and click the outlier policy dropdown
    const outlierSelect = screen.getByLabelText('Outlier Policy');
    fireEvent.mouseDown(outlierSelect);
    
    // Check that all options are available
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Grubbs Test')).toBeInTheDocument();
    expect(screen.getByText('IQR Method')).toBeInTheDocument();
    
    // Select Grubbs test
    fireEvent.click(screen.getByText('Grubbs Test'));
    
    // Verify selection
    expect(outlierSelect).toHaveValue('grubbs');
  });

  test('disables fit button when insufficient levels', async () => {
    render(<CalibrationManager methodId={1} />);
    
    const fitButton = screen.getByRole('button', { name: /fit calibration/i });
    
    // Should be disabled initially (no levels)
    expect(fitButton).toBeDisabled();
    
    // Add one level - still disabled
    const addButton = screen.getByRole('button', { name: /add level/i });
    fireEvent.click(addButton);
    
    expect(fitButton).toBeDisabled();
    
    // Add second level - should be enabled
    fireEvent.click(addButton);
    
    // Fill in target name
    const targetNameField = screen.getByLabelText('Target Name');
    fireEvent.change(targetNameField, { target: { value: 'Test Compound' } });
    
    expect(fitButton).not.toBeDisabled();
  });

  test('calls fit calibration API with correct parameters', async () => {
    const mockFitResponse = {
      data: {
        id: 'new-cal',
        target_name: 'Test Compound',
        mode: 'external',
        model_type: 'linear',
        slope: 1000,
        intercept: 0,
        r2: 0.995,
        residuals: [0.1, -0.2, 0.05],
        levels: [
          { amount: 1, unit: 'ppm', area: 1000, included: true },
          { amount: 2, unit: 'ppm', area: 2000, included: true }
        ]
      }
    };
    
    (calibrationAPI.fitCalibration as jest.Mock).mockResolvedValue(mockFitResponse);
    (calibrationAPI.getResiduals as jest.Mock).mockResolvedValue({
      data: { concentrations: [1, 2], residuals: [0.1, -0.2] }
    });
    
    render(<CalibrationManager methodId={1} />);
    
    // Set up calibration
    const targetNameField = screen.getByLabelText('Target Name');
    fireEvent.change(targetNameField, { target: { value: 'Test Compound' } });
    
    // Add levels
    const addButton = screen.getByRole('button', { name: /add level/i });
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    
    // Fill in level data
    const amountFields = screen.getAllByDisplayValue('0');
    fireEvent.change(amountFields[0], { target: { value: '1' } });
    fireEvent.change(amountFields[1], { target: { value: '2' } });
    
    // Click fit
    const fitButton = screen.getByRole('button', { name: /fit calibration/i });
    fireEvent.click(fitButton);
    
    await waitFor(() => {
      expect(calibrationAPI.fitCalibration).toHaveBeenCalledWith({
        method_id: 1,
        instrument_id: undefined,
        target_name: 'Test Compound',
        model_type: 'linear',
        mode: 'external',
        internal_standard: undefined,
        outlier_policy: 'none',
        levels: expect.arrayContaining([
          expect.objectContaining({
            target_name: 'Test Compound',
            amount: 1,
            unit: 'ppm'
          })
        ])
      });
    });
  });

  test('displays validation results in dialog', async () => {
    const mockValidationResponse = {
      data: {
        overall_status: 'warning',
        r2: 0.985,
        r2_acceptable: false,
        warnings: ['R² (0.9850) is below 0.99'],
        errors: []
      }
    };
    
    (calibrationAPI.validateCalibration as jest.Mock).mockResolvedValue(mockValidationResponse);
    
    render(<CalibrationManager methodId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Benzene')).toBeInTheDocument();
    });
    
    // Click validate button
    const validateButton = screen.getByRole('button', { name: /validate/i });
    fireEvent.click(validateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Calibration Validation Results')).toBeInTheDocument();
      expect(screen.getByText('Overall Status: WARNING')).toBeInTheDocument();
      expect(screen.getByText('R² (0.9850) is below 0.99')).toBeInTheDocument();
    });
  });

  test('exports calibration data', async () => {
    const mockExportResponse = {
      data: {
        content: 'base64-encoded-content',
        filename: 'calibration_export.csv',
        mime_type: 'text/csv'
      }
    };
    
    (calibrationAPI.exportCalibration as jest.Mock).mockResolvedValue(mockExportResponse);
    
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockClick = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    
    render(<CalibrationManager methodId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Benzene')).toBeInTheDocument();
    });
    
    // Click export CSV button
    const exportButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(calibrationAPI.exportCalibration).toHaveBeenCalledWith('cal-1', 'csv');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  test('resets form when reset button is clicked', async () => {
    render(<CalibrationManager methodId={1} />);
    
    // Fill in some data
    const targetNameField = screen.getByLabelText('Target Name');
    fireEvent.change(targetNameField, { target: { value: 'Test Compound' } });
    
    // Add a level
    const addButton = screen.getByRole('button', { name: /add level/i });
    fireEvent.click(addButton);
    
    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset form/i });
    fireEvent.click(resetButton);
    
    // Check that form is reset
    expect(targetNameField).toHaveValue('');
    expect(screen.queryByDisplayValue('0')).not.toBeInTheDocument(); // No levels
  });
});
