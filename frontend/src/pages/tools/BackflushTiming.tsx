import React, { useState } from 'react';
import { Calculator, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '../../lib/demoApiClient';
import { BackflushTimingRequest, BackflushTimingResult } from '../../types/api';

export const BackflushTiming: React.FC = () => {
  const [inputs, setInputs] = useState<BackflushTimingRequest>({
    last_peak_rt: 15.0, // minutes
    safety_factor: 1.2 // 20% safety margin
  });
  
  const [results, setResults] = useState<BackflushTimingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof BackflushTimingRequest, value: string) => {
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
      const result = await apiClient.calculateBackflushTiming(inputs);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate time savings
  const timeSavings = results ? (inputs.last_peak_rt * 2) - results.t_bf_min : 0;
  const efficiencyGain = results ? ((timeSavings / (inputs.last_peak_rt * 2)) * 100) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-50 rounded-lg">
            <Clock className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <h1 className="page-title">Backflush Timing Calculator</h1>
            <p className="page-subtitle">Optimize backflush timing for column maintenance and run time reduction</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Method Parameters</h3>
            <p className="text-sm text-text-secondary">Enter your chromatographic method conditions</p>
          </div>
          
          <div className="card-content space-y-6">
            {/* Last Peak Retention Time */}
            <div className="form-group">
              <label htmlFor="last-peak-rt" className="form-label">
                Last Peak Retention Time (min)
              </label>
              <input
                id="last-peak-rt"
                type="number"
                value={inputs.last_peak_rt}
                onChange={(e) => handleInputChange('last_peak_rt', e.target.value)}
                className="form-input"
                placeholder="15.0"
                step="0.1"
                min="1"
                max="120"
                data-testid="last-peak-rt-input"
              />
              <p className="form-help">Retention time of the last compound of interest</p>
            </div>

            {/* Safety Factor */}
            <div className="form-group">
              <label htmlFor="safety-factor" className="form-label">
                Safety Factor
              </label>
              <select
                id="safety-factor"
                value={inputs.safety_factor}
                onChange={(e) => handleInputChange('safety_factor', e.target.value)}
                className="form-input"
                data-testid="safety-factor-select"
              >
                <option value="1.1">1.1 (10% margin)</option>
                <option value="1.2">1.2 (20% margin - recommended)</option>
                <option value="1.3">1.3 (30% margin)</option>
                <option value="1.5">1.5 (50% margin - conservative)</option>
              </select>
              <p className="form-help">Safety margin to ensure complete elution</p>
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
                  <Clock className="h-4 w-4" />
                  Calculate Backflush Timing
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
                  <div className="result-label">Backflush Start Time</div>
                  <div className="result-value">
                    {results.t_bf_min.toFixed(1)}
                  </div>
                  <div className="result-unit">minutes</div>
                </div>

                {/* Time Savings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-card">
                    <div className="metric-label">Time Saved</div>
                    <div className="metric-value text-status-success">
                      {timeSavings.toFixed(1)} min
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Efficiency Gain</div>
                    <div className="metric-value text-status-success">
                      {efficiencyGain.toFixed(0)}%
                    </div>
                  </div>
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

                {/* Timeline Visualization */}
                <div className="bg-surface-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Run Timeline</h4>
                  <div className="relative">
                    {/* Timeline bar */}
                    <div className="h-8 bg-gray-200 rounded-md relative overflow-hidden">
                      {/* Analysis phase */}
                      <div 
                        className="h-full bg-accent-500 rounded-l-md flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(results.t_bf_min / (results.t_bf_min + 5)) * 100}%` }}
                      >
                        Analysis
                      </div>
                      {/* Backflush phase */}
                      <div 
                        className="h-full bg-orange-400 absolute right-0 top-0 flex items-center justify-center text-white text-xs font-medium rounded-r-md"
                        style={{ width: `${(5 / (results.t_bf_min + 5)) * 100}%` }}
                      >
                        Backflush
                      </div>
                    </div>
                    {/* Time markers */}
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>0 min</span>
                      <span>{results.t_bf_min.toFixed(1)} min</span>
                      <span>{(results.t_bf_min + 5).toFixed(1)} min</span>
                    </div>
                  </div>
                </div>

                {/* Information Panel */}
                <div className="info-panel">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Backflush Benefits</p>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary">
                        <li>Removes high-boiling contaminants from column</li>
                        <li>Reduces ghost peaks in subsequent runs</li>
                        <li>Extends column lifetime significantly</li>
                        <li>Improves baseline stability and reproducibility</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Clock className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary text-center">
                  Enter method parameters and click Calculate to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Backflush Best Practices</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">When to Use Backflush</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Complex sample matrices</li>
                  <li>• High-boiling point compounds</li>
                  <li>• Petroleum product analysis</li>
                  <li>• Environmental samples</li>
                  <li>• Food and flavor analysis</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Timing Guidelines</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• 10-20% safety margin typical</li>
                  <li>• Conservative: 30-50% margin</li>
                  <li>• Fast methods: 10% margin</li>
                  <li>• Complex samples: 30% margin</li>
                  <li>• Monitor baseline for optimization</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Benefits</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• 30-50% run time reduction</li>
                  <li>• Extended column life</li>
                  <li>• Reduced maintenance</li>
                  <li>• Better peak shape</li>
                  <li>• Improved reproducibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};