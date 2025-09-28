import React, { useState } from 'react';
import { Calculator, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../lib/demoApiClient';
import { VoidVolumeRequest, VoidVolumeResult } from '../../types/api';

export const VoidVolume: React.FC = () => {
  const [inputs, setInputs] = useState<VoidVolumeRequest>({
    column_length: 30, // meters
    column_diameter: 0.25 // mm
  });
  
  const [results, setResults] = useState<VoidVolumeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof VoidVolumeRequest, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setInputs(prev => ({ ...prev, [field]: numValue }));
      setError(null);
    }
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.calculateVoidVolume(inputs);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-50 rounded-lg">
            <Calculator className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <h1 className="page-title">Void Volume Calculator</h1>
            <p className="page-subtitle">Calculate column void volume for method development</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Column Parameters</h3>
            <p className="text-sm text-text-secondary">Enter your column specifications</p>
          </div>
          
          <div className="card-content space-y-6">
            {/* Column Length */}
            <div className="form-group">
              <label htmlFor="column-length" className="form-label">
                Column Length (m)
              </label>
              <input
                id="column-length"
                type="number"
                value={inputs.column_length}
                onChange={(e) => handleInputChange('column_length', e.target.value)}
                className="form-input"
                placeholder="30"
                step="0.1"
                min="1"
                max="100"
                data-testid="column-length-input"
              />
              <p className="form-help">Typical range: 15-60 meters</p>
            </div>

            {/* Column Diameter */}
            <div className="form-group">
              <label htmlFor="column-diameter" className="form-label">
                Internal Diameter (mm)
              </label>
              <input
                id="column-diameter"
                type="number"
                value={inputs.column_diameter}
                onChange={(e) => handleInputChange('column_diameter', e.target.value)}
                className="form-input"
                placeholder="0.25"
                step="0.01"
                min="0.1"
                max="1.0"
                data-testid="column-diameter-input"
              />
              <p className="form-help">Common sizes: 0.25, 0.32, 0.53 mm</p>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="app-button-primary w-full"
              data-testid="calculate-btn"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </div>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Calculate Void Volume
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Results</h3>
            {results && (
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Calculation complete</span>
              </div>
            )}
          </div>
          
          <div className="card-content">
            {error && (
              <div className="alert alert-error">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {results ? (
              <div className="space-y-4">
                {/* Main Result */}
                <div className="result-card">
                  <div className="result-label">Void Volume</div>
                  <div className="result-value">
                    {results.volume_ml.toFixed(3)} mL
                  </div>
                </div>

                {/* Equation */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Calculation</h4>
                  <p className="text-sm font-mono text-text-secondary">
                    {results.equation}
                  </p>
                </div>

                {/* Information Panel */}
                <div className="info-panel">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">About Void Volume</p>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary">
                        <li>Void volume is the space available for mobile phase flow</li>
                        <li>Critical for calculating retention factors and method transfer</li>
                        <li>Used in van Deemter equation for efficiency optimization</li>
                        <li>Affects gradient method development and scaling</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Calculator className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary text-center">
                  Enter column parameters and click Calculate to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Method Development Tips */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Method Development Tips</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Void Volume Applications</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Calculate retention factors (k = (tr - t0) / t0)</li>
                  <li>• Determine theoretical plates efficiency</li>
                  <li>• Scale methods between different column dimensions</li>
                  <li>• Optimize gradient steepness and duration</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Typical Values</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• 30m × 0.25mm: ~0.37 mL</li>
                  <li>• 30m × 0.32mm: ~0.61 mL</li>
                  <li>• 15m × 0.25mm: ~0.18 mL</li>
                  <li>• 60m × 0.53mm: ~3.35 mL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};