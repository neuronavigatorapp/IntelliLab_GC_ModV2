import React, { useState } from 'react';
import { Calculator, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/demoApiClient';
import { SplitRatioInput, SplitRatioOutput } from '../lib/api.types';

export const SplitRatioCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<SplitRatioInput>({
    split_ratio: 50,
    column_flow_rate: 1.0,
    inlet_temperature: 250,
    carrier_gas: 'Helium'
  });
  
  const [results, setResults] = useState<SplitRatioOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof SplitRatioInput, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.calculateSplitRatio(inputs);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warn';
    return 'text-danger';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text mb-4">Split Ratio Calculator</h1>
        <p className="text-muted max-w-2xl mx-auto">
          Calculate GC inlet split ratio parameters with comprehensive validation 
          and expert analysis. Professional-grade calculations with uncertainty estimation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Parameters */}
        <div className="card">
          <div className="card-h">
            <div className="flex items-center space-x-2">
              <Calculator className="text-brand-600" size={20} />
              <h2 className="text-lg font-semibold text-text">Input Parameters</h2>
            </div>
          </div>
          <div className="card-content space-y-6">
            {/* Split Ratio */}
            <div className="form-group">
              <label className="form-label">
                Split Ratio (1:X)
                <span className="text-xs text-muted ml-2">Range: 1-500</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={inputs.split_ratio}
                onChange={(e) => handleInputChange('split_ratio', parseFloat(e.target.value))}
                className="form-input"
                placeholder="50"
                data-testid="split-ratio-input"
              />
              <p className="text-xs text-muted mt-1">
                Higher values reduce sensitivity but improve linearity
              </p>
            </div>

            {/* Column Flow Rate */}
            <div className="form-group">
              <label className="form-label">
                Column Flow Rate (mL/min)
                <span className="text-xs text-muted ml-2">Range: 0.1-10</span>
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={inputs.column_flow_rate}
                onChange={(e) => handleInputChange('column_flow_rate', parseFloat(e.target.value))}
                className="form-input"
                placeholder="1.0"
                data-testid="column-flow-input"
              />
              <p className="text-xs text-muted mt-1">
                Optimal range: 0.5-3.0 mL/min for most columns
              </p>
            </div>

            {/* Inlet Temperature */}
            <div className="form-group">
              <label className="form-label">
                Inlet Temperature (°C)
                <span className="text-xs text-muted ml-2">Range: 50-450</span>
              </label>
              <input
                type="number"
                min="50"
                max="450"
                value={inputs.inlet_temperature}
                onChange={(e) => handleInputChange('inlet_temperature', parseFloat(e.target.value))}
                className="form-input"
                placeholder="250"
              />
            </div>

            {/* Carrier Gas */}
            <div className="form-group">
              <label htmlFor="carrier-gas" className="form-label">Carrier Gas</label>
              <select
                id="carrier-gas"
                value={inputs.carrier_gas}
                onChange={(e) => handleInputChange('carrier_gas', e.target.value as 'Helium' | 'Hydrogen' | 'Nitrogen')}
                className="form-input"
              >
                <option value="Helium">Helium (recommended)</option>
                <option value="Hydrogen">Hydrogen (fast analysis)</option>
                <option value="Nitrogen">Nitrogen (economical)</option>
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="btn btn-primary w-full"
              data-testid="calculate-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" data-testid="loading-spinner" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator size={20} />
                  Calculate Split Ratio
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger">
                <AlertTriangle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="card" data-testid="calculation-results">
          <div className="card-h">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Calculation Results</h2>
              {results && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-success" size={16} />
                  <span className="text-sm text-success">Validated</span>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            {!results ? (
              <div className="text-center py-12 text-muted">
                <Calculator size={48} className="mx-auto mb-4 opacity-30" />
                <p>Enter parameters and click calculate to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Results */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-surface-2 rounded-lg">
                    <p className="text-sm text-muted">Total Inlet Flow</p>
                    <p className="text-xl font-bold text-text">{results.total_inlet_flow.toFixed(2)}</p>
                    <p className="text-xs text-muted">mL/min</p>
                  </div>
                  <div className="text-center p-4 bg-surface-2 rounded-lg">
                    <p className="text-sm text-muted">Split Vent Flow</p>
                    <p className="text-xl font-bold text-text">{results.split_vent_flow.toFixed(2)}</p>
                    <p className="text-xs text-muted">mL/min</p>
                  </div>
                  <div className="text-center p-4 bg-surface-2 rounded-lg">
                    <p className="text-sm text-muted">Septum Purge</p>
                    <p className="text-xl font-bold text-text">{results.septum_purge_flow.toFixed(2)}</p>
                    <p className="text-xs text-muted">mL/min</p>
                  </div>
                  <div className="text-center p-4 bg-surface-2 rounded-lg">
                    <p className="text-sm text-muted">Efficiency Score</p>
                    <p className={`text-xl font-bold ${getEfficiencyColor(results.efficiency_score)}`}>
                      {results.efficiency_score.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted">Actual Split Ratio:</span>
                    <span className="font-medium text-text">{results.actual_split_ratio}</span>
                  </div>
                  {results.uncertainty && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted">Uncertainty (±):</span>
                      <span className="font-medium text-text">{results.uncertainty.toFixed(3)} mL/min</span>
                    </div>
                  )}
                  {results.confidence_level && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted">Confidence Level:</span>
                      <span className="font-medium text-text">{results.confidence_level.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Expert Explanation */}
                {results.explanation && (
                  <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="text-info flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="font-medium text-text mb-1">Expert Analysis</h4>
                        <p className="text-sm text-muted">{results.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="card">
        <div className="card-h">
          <h3 className="text-lg font-semibold text-text">Understanding Split Ratio Calculations</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-text mb-2">Split Ratio Impact</h4>
              <p className="text-sm text-muted">
                Higher split ratios reduce sample amount entering the column, 
                decreasing sensitivity but improving peak shape and preventing overload.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text mb-2">Flow Optimization</h4>
              <p className="text-sm text-muted">
                Column flow rate affects separation efficiency. Too high reduces resolution, 
                too low causes peak broadening and increased analysis time.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text mb-2">Temperature Effects</h4>
              <p className="text-sm text-muted">
                Inlet temperature must ensure complete sample vaporization while 
                avoiding thermal decomposition of analytes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};