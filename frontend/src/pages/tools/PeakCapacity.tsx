import React, { useState } from 'react';
import { Calculator, Info, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { apiClient } from '../../lib/demoApiClient';
import { PeakCapacityRequest, PeakCapacityResult } from '../../types/api';

export const PeakCapacity: React.FC = () => {
  const [inputs, setInputs] = useState<PeakCapacityRequest>({
    gradient_time: 20, // minutes
    peak_width: 0.2, // minutes
    dead_time: 1.0 // minutes (optional)
  });
  
  const [results, setResults] = useState<PeakCapacityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PeakCapacityRequest, value: string) => {
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
      const result = await apiClient.calculatePeakCapacity(inputs);
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
            <BarChart3 className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <h1 className="page-title">Peak Capacity Calculator</h1>
            <p className="page-subtitle">Calculate chromatographic peak capacity for method optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gradient Parameters</h3>
            <p className="text-sm text-text-secondary">Enter your gradient method conditions</p>
          </div>
          
          <div className="card-content space-y-6">
            {/* Gradient Time */}
            <div className="form-group">
              <label htmlFor="gradient-time" className="form-label">
                Gradient Time (min)
              </label>
              <input
                id="gradient-time"
                type="number"
                value={inputs.gradient_time}
                onChange={(e) => handleInputChange('gradient_time', e.target.value)}
                className="form-input"
                placeholder="20"
                step="0.1"
                min="1"
                max="120"
                data-testid="gradient-time-input"
              />
              <p className="form-help">Total gradient duration (5-60 min typical)</p>
            </div>

            {/* Peak Width */}
            <div className="form-group">
              <label htmlFor="peak-width" className="form-label">
                Average Peak Width (min)
              </label>
              <input
                id="peak-width"
                type="number"
                value={inputs.peak_width}
                onChange={(e) => handleInputChange('peak_width', e.target.value)}
                className="form-input"
                placeholder="0.2"
                step="0.01"
                min="0.05"
                max="2.0"
                data-testid="peak-width-input"
              />
              <p className="form-help">At baseline (4σ), typically 0.1-0.5 min</p>
            </div>

            {/* Dead Time (Optional) */}
            <div className="form-group">
              <label htmlFor="dead-time" className="form-label">
                Dead Time (min) <span className="text-text-tertiary">(optional)</span>
              </label>
              <input
                id="dead-time"
                type="number"
                value={inputs.dead_time}
                onChange={(e) => handleInputChange('dead_time', e.target.value)}
                className="form-input"
                placeholder="1.0"
                step="0.1"
                min="0.1"
                max="10"
                data-testid="dead-time-input"
              />
              <p className="form-help">Void time for unretained compound</p>
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
                  <BarChart3 className="h-4 w-4" />
                  Calculate Peak Capacity
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
                  <div className="result-label">Peak Capacity</div>
                  <div className="result-value">
                    {results.peak_capacity}
                  </div>
                  <div className="result-unit">peaks</div>
                </div>

                {/* Equation */}
                {results.equation && (
                  <div className="bg-surface-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Calculation</h4>
                    <p className="text-sm font-mono text-text-secondary">
                      {results.equation}
                    </p>
                  </div>
                )}

                {/* Performance Interpretation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-card">
                    <div className="metric-label">Separation Quality</div>
                    <div className="metric-value">
                      {results.peak_capacity > 100 ? 'Excellent' :
                       results.peak_capacity > 50 ? 'Good' :
                       results.peak_capacity > 25 ? 'Fair' : 'Poor'}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Method Efficiency</div>
                    <div className="metric-value">
                      {results.peak_capacity > 80 ? 'High' :
                       results.peak_capacity > 40 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                </div>

                {/* Information Panel */}
                <div className="info-panel">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Peak Capacity Guidelines</p>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary">
                        <li>&gt;100: Excellent for complex samples</li>
                        <li>50-100: Good for routine analysis</li>
                        <li>25-50: Adequate for simple mixtures</li>
                        <li>&lt;25: May need method optimization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary text-center">
                  Enter gradient parameters and click Calculate to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Guidelines */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Peak Capacity Optimization</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Increase Peak Capacity</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Extend gradient time</li>
                  <li>• Use longer columns</li>
                  <li>• Optimize flow rate</li>
                  <li>• Reduce peak width (efficiency)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Typical Values</h4>  
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Fast LC: 20-40 peaks</li>
                  <li>• Routine LC: 40-80 peaks</li>
                  <li>• High-res LC: 100-200 peaks</li>
                  <li>• UHPLC: 200-400+ peaks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Applications</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Method development planning</li>
                  <li>• Complex sample analysis</li>
                  <li>• Gradient optimization</li>
                  <li>• Column comparison</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};