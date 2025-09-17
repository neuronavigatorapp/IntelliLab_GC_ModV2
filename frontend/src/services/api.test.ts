import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  calculateSplitRatio,
  calculateDetectionLimits,
  simulateChromatogram,
  checkBackendHealth,
  testApiConnection,
  SplitRatioInput,
  DetectionLimitInput,
  ChromatogramInput
} from './api';
import { ValidationError } from '../utils/validation';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('API Service', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default axios mock
    mockedAxios.create.mockReturnValue({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    });
  });

  describe('calculateSplitRatio', () => {
    const validInput: SplitRatioInput = {
      split_ratio: 50,
      column_flow_rate: 1.5,
      inlet_temperature: 250,
      carrier_gas: 'Helium'
    };

    const mockResponse = {
      data: {
        total_inlet_flow: 78.5,
        split_vent_flow: 75.0,
        septum_purge_flow: 3.0,
        column_flow_rate: 1.5,
        actual_split_ratio: '1:50',
        efficiency_score: 95.0
      }
    };

    it('successfully calculates split ratio with valid input', async () => {
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await calculateSplitRatio(validInput);

      expect(mockPost).toHaveBeenCalledWith('/api/split-ratio/calculate', validInput);
      expect(result).toEqual(mockResponse.data);
    });

    it('validates input parameters before API call', async () => {
      const invalidInput: SplitRatioInput = {
        split_ratio: -1, // Invalid
        column_flow_rate: 1.5
      };

      await expect(calculateSplitRatio(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates inlet temperature bounds', async () => {
      const invalidInput: SplitRatioInput = {
        split_ratio: 50,
        column_flow_rate: 1.5,
        inlet_temperature: 500 // Too high
      };

      await expect(calculateSplitRatio(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates carrier gas options', async () => {
      const invalidInput: SplitRatioInput = {
        split_ratio: 50,
        column_flow_rate: 1.5,
        carrier_gas: 'Argon' as any // Invalid
      };

      await expect(calculateSplitRatio(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates response format', async () => {
      const invalidResponse = { data: { invalid: 'response' } };
      const mockPost = vi.fn().mockResolvedValue(invalidResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await expect(calculateSplitRatio(validInput)).rejects.toThrow('Invalid response format');
    });

    it('handles network errors gracefully', async () => {
      const mockPost = vi.fn().mockRejectedValue(new Error('Network Error'));
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await expect(calculateSplitRatio(validInput)).rejects.toThrow();
    });
  });

  describe('calculateDetectionLimits', () => {
    const validInput: DetectionLimitInput = {
      concentrations: [1, 2, 3, 4, 5],
      peak_areas: [100, 200, 300, 400, 500],
      method: '3sigma'
    };

    const mockResponse = {
      data: {
        lod: 0.1234,
        loq: 0.4567,
        regression_slope: 100,
        regression_intercept: 0,
        r_squared: 0.9999,
        standard_error: 5.0,
        method_used: '3sigma'
      }
    };

    it('successfully calculates detection limits with valid input', async () => {
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await calculateDetectionLimits(validInput);

      expect(mockPost).toHaveBeenCalledWith('/api/detection-limits/calculate', validInput);
      expect(result).toEqual(mockResponse.data);
    });

    it('validates calibration data before API call', async () => {
      const invalidInput: DetectionLimitInput = {
        concentrations: [1, 2], // Too few points
        peak_areas: [100, 200],
        method: '3sigma'
      };

      await expect(calculateDetectionLimits(invalidInput)).rejects.toThrow();
    });

    it('validates method parameter', async () => {
      const invalidInput: DetectionLimitInput = {
        concentrations: [1, 2, 3],
        peak_areas: [100, 200, 300],
        method: 'invalid' as any
      };

      await expect(calculateDetectionLimits(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates blank areas if provided', async () => {
      const invalidInput: DetectionLimitInput = {
        concentrations: [1, 2, 3],
        peak_areas: [100, 200, 300],
        method: '3sigma',
        blank_areas: [-10, 5, 3] // Negative values
      };

      await expect(calculateDetectionLimits(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates response data integrity', async () => {
      const invalidResponse = {
        data: {
          lod: -1, // Invalid negative LOD
          loq: 0.4567,
          regression_slope: 100,
          regression_intercept: 0,
          r_squared: 0.9999,
          standard_error: 5.0,
          method_used: '3sigma'
        }
      };

      const mockPost = vi.fn().mockResolvedValue(invalidResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await expect(calculateDetectionLimits(validInput)).rejects.toThrow();
    });

    it('warns about poor correlation', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const poorCorrelationResponse = {
        data: {
          ...mockResponse.data,
          r_squared: 0.85 // Poor correlation
        }
      };

      const mockPost = vi.fn().mockResolvedValue(poorCorrelationResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await calculateDetectionLimits(validInput);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low correlation')
      );

      consoleWarnSpy.mockRestore();
    });

    it('validates LOQ > LOD relationship', async () => {
      const invalidResponse = {
        data: {
          lod: 0.5,
          loq: 0.3, // LOQ < LOD is invalid
          regression_slope: 100,
          regression_intercept: 0,
          r_squared: 0.9999,
          standard_error: 5.0,
          method_used: '3sigma'
        }
      };

      const mockPost = vi.fn().mockResolvedValue(invalidResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await expect(calculateDetectionLimits(validInput)).rejects.toThrow('LOQ cannot be less than LOD');
    });
  });

  describe('simulateChromatogram', () => {
    const validInput: ChromatogramInput = {
      column_temp: 40,
      ramp_rate: 10,
      flow_rate: 1.0,
      split_ratio: 50,
      column_length: 30,
      column_diameter: 0.25
    };

    const mockResponse = {
      data: {
        peaks: [
          {
            compound: 'Methane (C1)',
            retention_time: 1.5,
            peak_height: 1000,
            peak_area: 5000,
            boiling_point: -161.5,
            peak_width: 0.1
          }
        ],
        total_runtime: 15.0,
        data_points: [
          { time: 0, signal: 50 },
          { time: 1.5, signal: 1050 },
          { time: 3, signal: 50 }
        ]
      }
    };

    it('successfully simulates chromatogram with valid input', async () => {
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await simulateChromatogram(validInput);

      expect(mockPost).toHaveBeenCalledWith('/api/chromatogram/simulate', validInput);
      expect(result).toEqual(mockResponse.data);
    });

    it('validates temperature bounds', async () => {
      const invalidInput: ChromatogramInput = {
        ...validInput,
        column_temp: 500 // Too high
      };

      await expect(simulateChromatogram(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates ramp rate bounds', async () => {
      const invalidInput: ChromatogramInput = {
        ...validInput,
        ramp_rate: 100 // Too high
      };

      await expect(simulateChromatogram(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates column dimensions', async () => {
      const invalidInput: ChromatogramInput = {
        ...validInput,
        column_length: 5, // Too short
        column_diameter: 2.0 // Too wide
      };

      await expect(simulateChromatogram(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('validates response contains peaks', async () => {
      const noPeaksResponse = {
        data: {
          peaks: [], // No peaks
          total_runtime: 15.0,
          data_points: [{ time: 0, signal: 50 }]
        }
      };

      const mockPost = vi.fn().mockResolvedValue(noPeaksResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      await expect(simulateChromatogram(validInput)).rejects.toThrow('No peaks generated');
    });
  });

  describe('checkBackendHealth', () => {
    it('returns true for healthy backend', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await checkBackendHealth();

      expect(result).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/api/health', { timeout: 5000 });
    });

    it('returns false for unhealthy backend', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        status: 200,
        data: { status: 'unhealthy' }
      });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await checkBackendHealth();

      expect(result).toBe(false);
    });

    it('returns false for network errors', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Network Error'));
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await checkBackendHealth();

      expect(result).toBe(false);
    });
  });

  describe('testApiConnection', () => {
    it('returns success for healthy backend', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        status: 200,
        data: { status: 'healthy' }
      });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await testApiConnection();

      expect(result.connected).toBe(true);
      expect(result.message).toContain('healthy');
    });

    it('returns failure message for connection issues', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await testApiConnection();

      expect(result.connected).toBe(false);
      expect(result.message).toContain('Cannot connect');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('handles timeout errors with descriptive messages', async () => {
      const timeoutError = { code: 'ECONNABORTED' };
      const mockPost = vi.fn().mockRejectedValue(timeoutError);
      
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const validInput: SplitRatioInput = {
        split_ratio: 50,
        column_flow_rate: 1.5
      };

      await expect(calculateSplitRatio(validInput)).rejects.toThrow('timeout');
    });

    it('handles validation errors from backend', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            detail: [
              { loc: ['split_ratio'], msg: 'value too large' }
            ]
          }
        }
      };

      const mockPost = vi.fn().mockRejectedValue(validationError);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const validInput: SplitRatioInput = {
        split_ratio: 50,
        column_flow_rate: 1.5
      };

      await expect(calculateSplitRatio(validInput)).rejects.toThrow(ValidationError);
    });

    it('handles generic HTTP errors', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { detail: 'Not found' }
        }
      };

      const mockPost = vi.fn().mockRejectedValue(httpError);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const validInput: SplitRatioInput = {
        split_ratio: 50,
        column_flow_rate: 1.5
      };

      await expect(calculateSplitRatio(validInput)).rejects.toThrow('API Error (404)');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', async () => {
      const largeInput: DetectionLimitInput = {
        concentrations: Array.from({ length: 50 }, (_, i) => i + 1),
        peak_areas: Array.from({ length: 50 }, (_, i) => (i + 1) * 100),
        method: '3sigma'
      };

      const mockResponse = {
        data: {
          lod: 0.1,
          loq: 0.3,
          regression_slope: 100,
          regression_intercept: 0,
          r_squared: 0.999,
          standard_error: 1.0,
          method_used: '3sigma'
        }
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const start = performance.now();
      const result = await calculateDetectionLimits(largeInput);
      const end = performance.now();

      expect(result).toEqual(mockResponse.data);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles boundary values correctly', async () => {
      const boundaryInput: SplitRatioInput = {
        split_ratio: 1, // Minimum allowed
        column_flow_rate: 0.1, // Minimum allowed
        inlet_temperature: 50, // Minimum allowed
        carrier_gas: 'Helium'
      };

      const mockResponse = {
        data: {
          total_inlet_flow: 4.1,
          split_vent_flow: 0.1,
          septum_purge_flow: 3.0,
          column_flow_rate: 0.1,
          actual_split_ratio: '1:1',
          efficiency_score: 60.0
        }
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
      });

      const result = await calculateSplitRatio(boundaryInput);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
