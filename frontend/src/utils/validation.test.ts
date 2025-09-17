import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ValidationError,
  ScientificValidationError,
  validateSplitRatio,
  validateFlowRate,
  validateTemperature,
  validateCalibrationData,
  validateCarrierGas,
  validateDetectionMethod,
  sanitizeNumericInput,
  sanitizeNumericArray,
  validateAllInputs
} from './validation';

describe('Validation Utilities', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.warn to capture warnings
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  describe('ValidationError Classes', () => {
    it('creates ValidationError correctly', () => {
      const error = new ValidationError('Test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test message');
    });

    it('creates ScientificValidationError correctly', () => {
      const error = new ScientificValidationError(
        'Test message',
        'Scientific reason'
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(ScientificValidationError);
      expect(error.name).toBe('ScientificValidationError');
      expect(error.message).toBe('Test message');
      expect(error.scientificReason).toBe('Scientific reason');
    });
  });

  describe('validateSplitRatio', () => {
    it('accepts valid split ratios', () => {
      const validValues = [1, 5, 10, 50, 100, 200, 500];
      
      validValues.forEach(value => {
        expect(() => validateSplitRatio(value)).not.toThrow();
      });
    });

    it('rejects invalid split ratios', () => {
      const invalidValues = [0, -1, -10, 501, 1000];
      
      invalidValues.forEach(value => {
        expect(() => validateSplitRatio(value)).toThrow();
      });
    });

    it('provides scientific reasoning for low ratios', () => {
      expect(() => validateSplitRatio(0)).toThrow(ScientificValidationError);
    });

    it('explains splitless injection for zero ratio', () => {
      let thrownError: ScientificValidationError | null = null;
      try {
        validateSplitRatio(0);
      } catch (error) {
        thrownError = error as ScientificValidationError;
      }
      expect(thrownError?.scientificReason).toContain('Splitless injection');
    });

    it('provides scientific reasoning for high ratios', () => {
      expect(() => validateSplitRatio(501)).toThrow(ScientificValidationError);
    });

    it('explains insufficient sample for high ratios', () => {
      let thrownError: ScientificValidationError | null = null;
      try {
        validateSplitRatio(501);
      } catch (error) {
        thrownError = error as ScientificValidationError;
      }
      expect(thrownError?.scientificReason).toContain('insufficient sample');
    });

    it('warns about suboptimal ranges', () => {
      validateSplitRatio(3); // Should warn about low ratio
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('inlet overload')
      );

      consoleWarnSpy.mockClear();

      validateSplitRatio(300); // Should warn about high ratio
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('detection limits')
      );
    });

    it('rejects non-numeric values', () => {
      const invalidTypes = [NaN, 'string', null, undefined, {}, []];
      
      invalidTypes.forEach(value => {
        expect(() => validateSplitRatio(value as any)).toThrow(ValidationError);
      });
    });
  });

  describe('validateFlowRate', () => {
    it('accepts valid flow rates', () => {
      const validValues = [0.1, 0.5, 1.0, 2.5, 5.0, 10.0];
      
      validValues.forEach(value => {
        expect(() => validateFlowRate(value)).not.toThrow();
      });
    });

    it('rejects invalid flow rates', () => {
      const invalidValues = [0, -1, -0.5, 10.1, 15];
      
      invalidValues.forEach(value => {
        expect(() => validateFlowRate(value)).toThrow();
      });
    });

    it('explains peak broadening for low flow rates', () => {
      let thrownError: ScientificValidationError | null = null;
      try {
        validateFlowRate(0.05);
      } catch (error) {
        thrownError = error as ScientificValidationError;
      }
      expect(thrownError?.scientificReason).toContain('peak broadening');
    });

    it('explains separation efficiency for high flow rates', () => {
      let thrownError: ScientificValidationError | null = null;
      try {
        validateFlowRate(15);
      } catch (error) {
        thrownError = error as ScientificValidationError;
      }
      expect(thrownError?.scientificReason).toContain('separation efficiency');
    });

    it('warns about suboptimal flow rates', () => {
      validateFlowRate(0.3); // Low flow rate
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('peak broadening')
      );

      consoleWarnSpy.mockClear();

      validateFlowRate(7); // High flow rate
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('separation efficiency')
      );
    });
  });

  describe('validateTemperature', () => {
    describe('inlet temperature', () => {
      it('accepts valid inlet temperatures', () => {
        const validValues = [50, 100, 250, 350, 450];
        
        validValues.forEach(value => {
          expect(() => validateTemperature(value, 'inlet')).not.toThrow();
        });
      });

      it('rejects invalid inlet temperatures', () => {
        const invalidValues = [49, 451, -10, 500];
        
        invalidValues.forEach(value => {
          expect(() => validateTemperature(value, 'inlet')).toThrow();
        });
      });

      it('warns about suboptimal inlet temperatures', () => {
        validateTemperature(100, 'inlet'); // Below optimal
        expect(consoleWarnSpy).toHaveBeenCalled();

        consoleWarnSpy.mockClear();

        validateTemperature(400, 'inlet'); // Above optimal
        expect(consoleWarnSpy).toHaveBeenCalled();
      });
    });

    describe('oven temperature', () => {
      it('accepts valid oven temperatures', () => {
        const validValues = [35, 50, 100, 250, 400];
        
        validValues.forEach(value => {
          expect(() => validateTemperature(value, 'oven')).not.toThrow();
        });
      });

      it('rejects invalid oven temperatures', () => {
        const invalidValues = [34, 401, -5, 450];
        
        invalidValues.forEach(value => {
          expect(() => validateTemperature(value, 'oven')).toThrow();
        });
      });
    });

    it('defaults to inlet type', () => {
      expect(() => validateTemperature(250)).not.toThrow();
      expect(() => validateTemperature(500)).toThrow();
    });
  });

  describe('validateCarrierGas', () => {
    it('accepts valid carrier gases', () => {
      const validGases = ['Helium', 'Hydrogen', 'Nitrogen'];
      
      validGases.forEach(gas => {
        expect(() => validateCarrierGas(gas)).not.toThrow();
      });
    });

    it('rejects invalid carrier gases', () => {
      const invalidGases = ['Argon', 'Air', 'CO2', '', 'helium', 'HELIUM'];
      
      invalidGases.forEach(gas => {
        expect(() => validateCarrierGas(gas)).toThrow(ScientificValidationError);
      });
    });

    it('rejects non-string values', () => {
      const invalidTypes = [123, null, undefined, {}, []];
      
      invalidTypes.forEach(value => {
        expect(() => validateCarrierGas(value as any)).toThrow(ValidationError);
      });
    });
  });

  describe('validateDetectionMethod', () => {
    it('accepts valid methods', () => {
      const validMethods = ['3sigma', '10sigma'];
      
      validMethods.forEach(method => {
        expect(() => validateDetectionMethod(method)).not.toThrow();
      });
    });

    it('rejects invalid methods', () => {
      const invalidMethods = ['5sigma', '3-sigma', 'sigma', '', '3SIGMA'];
      
      invalidMethods.forEach(method => {
        expect(() => validateDetectionMethod(method)).toThrow(ValidationError);
      });
    });
  });

  describe('validateCalibrationData', () => {
    it('accepts valid calibration data', () => {
      const testCases = [
        {
          concentrations: [1, 2, 3],
          peakAreas: [100, 200, 300]
        },
        {
          concentrations: [0.1, 0.5, 1.0, 2.0, 5.0],
          peakAreas: [50, 250, 500, 1000, 2500]
        },
        {
          concentrations: Array.from({ length: 10 }, (_, i) => i + 1),
          peakAreas: Array.from({ length: 10 }, (_, i) => (i + 1) * 100)
        }
      ];

      testCases.forEach(({ concentrations, peakAreas }) => {
        expect(() => validateCalibrationData(concentrations, peakAreas)).not.toThrow();
      });
    });

    it('requires minimum data points', () => {
      const insufficientData = [
        { concentrations: [], peakAreas: [] },
        { concentrations: [1], peakAreas: [100] },
        { concentrations: [1, 2], peakAreas: [100, 200] }
      ];

      insufficientData.forEach(({ concentrations, peakAreas }) => {
        expect(() => validateCalibrationData(concentrations, peakAreas))
          .toThrow(ScientificValidationError);
      });
    });

    it('requires matching array lengths', () => {
      const mismatchedData = [
        { concentrations: [1, 2, 3], peakAreas: [100, 200] },
        { concentrations: [1, 2], peakAreas: [100, 200, 300] }
      ];

      mismatchedData.forEach(({ concentrations, peakAreas }) => {
        expect(() => validateCalibrationData(concentrations, peakAreas))
          .toThrow(ValidationError);
      });
    });

    it('rejects negative or zero concentrations', () => {
      const invalidConcentrations = [
        { concentrations: [0, 1, 2], peakAreas: [0, 100, 200] },
        { concentrations: [-1, 1, 2], peakAreas: [100, 200, 300] }
      ];

      invalidConcentrations.forEach(({ concentrations, peakAreas }) => {
        expect(() => validateCalibrationData(concentrations, peakAreas))
          .toThrow(ValidationError);
      });
    });

    it('rejects negative peak areas', () => {
      const concentrations = [1, 2, 3];
      const peakAreas = [-100, 200, 300];

      expect(() => validateCalibrationData(concentrations, peakAreas))
        .toThrow(ValidationError);
    });

    it('detects duplicate concentrations', () => {
      const concentrations = [1, 1, 3];
      const peakAreas = [100, 200, 300];

      expect(() => validateCalibrationData(concentrations, peakAreas))
        .toThrow(ScientificValidationError);
    });

    it('detects poor data quality (too many duplicate areas)', () => {
      const concentrations = [1, 2, 3, 4, 5];
      const peakAreas = [100, 100, 100, 100, 100];

      expect(() => validateCalibrationData(concentrations, peakAreas))
        .toThrow(ScientificValidationError);
    });

    it('warns about wide concentration ranges', () => {
      const concentrations = [0.001, 1, 1000];
      const peakAreas = [1, 1000, 1000000];

      validateCalibrationData(concentrations, peakAreas);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('wide concentration range')
      );
    });

    it('warns about narrow concentration ranges', () => {
      const concentrations = [1, 1.1, 1.2];
      const peakAreas = [100, 110, 120];

      validateCalibrationData(concentrations, peakAreas);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Narrow concentration range')
      );
    });

    it('warns about non-monotonic data', () => {
      const concentrations = [1, 2, 3, 4, 5];
      const peakAreas = [100, 300, 200, 400, 500]; // Non-monotonic

      validateCalibrationData(concentrations, peakAreas);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not be monotonic')
      );
    });

    it('handles maximum allowed data points', () => {
      const concentrations = Array.from({ length: 50 }, (_, i) => i + 1);
      const peakAreas = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);

      expect(() => validateCalibrationData(concentrations, peakAreas)).not.toThrow();
    });

    it('rejects too many data points', () => {
      const concentrations = Array.from({ length: 51 }, (_, i) => i + 1);
      const peakAreas = Array.from({ length: 51 }, (_, i) => (i + 1) * 100);

      expect(() => validateCalibrationData(concentrations, peakAreas))
        .toThrow(ValidationError);
    });
  });

  describe('sanitizeNumericInput', () => {
    it('returns valid numbers unchanged', () => {
      const validNumbers = [0, 1, -1, 3.14, 1e-10, 1e10];
      
      validNumbers.forEach(value => {
        expect(sanitizeNumericInput(value)).toBe(value);
      });
    });

    it('parses valid numeric strings', () => {
      const validStrings = ['123', '3.14', '-5', '1e-5', ' 42 '];
      const expectedValues = [123, 3.14, -5, 1e-5, 42];
      
      validStrings.forEach((str, index) => {
        expect(sanitizeNumericInput(str)).toBe(expectedValues[index]);
      });
    });

    it('rejects invalid inputs', () => {
      const invalidInputs = ['abc', '', ' ', null, undefined, {}, [], NaN];
      
      invalidInputs.forEach(value => {
        expect(() => sanitizeNumericInput(value)).toThrow(ValidationError);
      });
    });
  });

  describe('sanitizeNumericArray', () => {
    it('sanitizes valid numeric arrays', () => {
      const input = [1, '2', ' 3 ', 4.5];
      const expected = [1, 2, 3, 4.5];
      
      expect(sanitizeNumericArray(input)).toEqual(expected);
    });

    it('rejects non-arrays', () => {
      const nonArrays = ['string', 123, null, undefined, {}];
      
      nonArrays.forEach(value => {
        expect(() => sanitizeNumericArray(value as any)).toThrow(ValidationError);
      });
    });

    it('provides detailed error messages for invalid elements', () => {
      const input = [1, 'invalid', 3];
      
      let thrownError: Error | null = null;
      try {
        sanitizeNumericArray(input);
        throw new Error('Should have thrown an error');
      } catch (error) {
        thrownError = error as Error;
      }
      expect(thrownError?.message).toContain('position 2');
    });

    it('includes invalid element in error message', () => {
      const input = [1, 'invalid', 3];
      
      let thrownError: Error | null = null;
      try {
        sanitizeNumericArray(input);
        throw new Error('Should have thrown an error');
      } catch (error) {
        thrownError = error as Error;
      }
      expect(thrownError?.message).toContain('invalid');
    });
  });

  describe('validateAllInputs', () => {
    it('validates all inputs successfully', () => {
      const validInputs = {
        splitRatio: 50,
        flowRate: 1.5,
        temperature: 250,
        concentrations: [1, 2, 3],
        peakAreas: [100, 200, 300],
        carrierGas: 'Helium',
        method: '3sigma'
      };

      const result = validateAllInputs(validInputs);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('collects all validation errors', () => {
      const invalidInputs = {
        splitRatio: -1,
        flowRate: 0,
        temperature: 500,
        concentrations: [1, 1], // Duplicate
        peakAreas: [100, 200], // Mismatched length would be caught first
        carrierGas: 'Invalid',
        method: 'invalid'
      };

      const result = validateAllInputs(invalidInputs);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('collects warnings', () => {
      const suboptimalInputs = {
        splitRatio: 300, // High split ratio
        flowRate: 0.3,  // Low flow rate
        temperature: 100 // Low temperature
      };

      const result = validateAllInputs(suboptimalInputs);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('handles partial input validation', () => {
      const partialInputs = {
        splitRatio: 50,
        flowRate: 1.5
        // Other inputs undefined
      };

      const result = validateAllInputs(partialInputs);
      
      expect(result.isValid).toBe(true);
    });

    it('handles empty input object', () => {
      const result = validateAllInputs({});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('handles extremely large numbers', () => {
      const largeNumber = 1e308; // Near JavaScript's Number.MAX_VALUE
      
      // Should not crash, but may fail validation
      expect(() => validateSplitRatio(largeNumber)).toThrow();
      expect(() => validateFlowRate(largeNumber)).toThrow();
    });

    it('handles extremely small numbers', () => {
      const smallNumber = 1e-308; // Near JavaScript's Number.MIN_VALUE
      
      expect(() => validateSplitRatio(smallNumber)).toThrow();
      expect(() => validateFlowRate(smallNumber)).toThrow();
    });

    it('handles special numeric values', () => {
      const specialValues = [Infinity, -Infinity, Number.MAX_VALUE, Number.MIN_VALUE];
      
      specialValues.forEach(value => {
        expect(() => validateSplitRatio(value)).toThrow();
        expect(() => validateFlowRate(value)).toThrow();
      });
    });

    it('handles very long arrays efficiently', () => {
      const longArray = Array.from({ length: 50 }, (_, i) => i + 1);
      const longAreas = Array.from({ length: 50 }, (_, i) => (i + 1) * 100);
      
      const start = performance.now();
      expect(() => validateCalibrationData(longArray, longAreas)).not.toThrow();
      const end = performance.now();
      
      // Should complete in reasonable time
      expect(end - start).toBeLessThan(100);
    });
  });
});
