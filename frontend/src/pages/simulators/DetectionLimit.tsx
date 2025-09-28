import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Image, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { apiClient } from '../../lib/demoApiClient';
import { DetectionLimitInput, DetectionLimitOutput } from '../../lib/api.types';
import PlotlyChart from '../../components/charts/PlotlyChart';

// Theme-based UI components using Blue Lab theme tokens
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>
    {children}
  </h3>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`card-content ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '', type = 'button' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    default: 'app-button-primary',
    outline: 'border bg-surface hover:bg-surface-2',
    ghost: 'hover:bg-surface-2'
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-10 py-2 px-4',
    lg: 'h-11 px-8'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  step?: string;
  min?: string;
  'aria-label'?: string;
}> = ({ className = '', ...props }) => (
  <input
    className={`app-input w-full text-sm ${className}`}
    {...props}
  />
);

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'error' | 'warning' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    info: 'bg-gray-100 text-gray-800 border border-gray-200'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

const Switch: React.FC<{
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
}> = ({ id, checked = false, onCheckedChange, 'aria-label': ariaLabel }) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const Separator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px bg-gray-200 ${className}`} />
);

interface DataPoint {
  id: string;
  concentration: number;
  peakArea: number;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

const SAMPLE_DATA: DataPoint[] = [
  { id: '1', concentration: 0.1, peakArea: 1250 },
  { id: '2', concentration: 0.5, peakArea: 6180 },
  { id: '3', concentration: 1.0, peakArea: 12400 },
  { id: '4', concentration: 2.0, peakArea: 24650 },
  { id: '5', concentration: 5.0, peakArea: 61200 },
  { id: '6', concentration: 10.0, peakArea: 122800 }
];

export default function DetectionLimit() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { id: '1', concentration: 0, peakArea: 0 },
    { id: '2', concentration: 0, peakArea: 0 },
    { id: '3', concentration: 0, peakArea: 0 }
  ]);
  const [method, setMethod] = useState<'3sigma' | '10sigma'>('3sigma');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionLimitOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add new data point
  const addDataPoint = useCallback(() => {
    const newId = String(dataPoints.length + 1);
    setDataPoints(prev => [...prev, { id: newId, concentration: 0, peakArea: 0 }]);
  }, [dataPoints.length]);

  // Remove data point
  const removeDataPoint = useCallback((id: string) => {
    if (dataPoints.length > 3) { // Keep minimum 3 points
      setDataPoints(prev => prev.filter(point => point.id !== id));
    }
  }, [dataPoints.length]);

  // Update data point
  const updateDataPoint = useCallback((id: string, field: 'concentration' | 'peakArea', value: number) => {
    setDataPoints(prev => prev.map(point => 
      point.id === id ? { ...point, [field]: value } : point
    ));
  }, []);

  // Load sample data
  const loadSampleData = useCallback(() => {
    setDataPoints(SAMPLE_DATA);
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setDataPoints([
      { id: '1', concentration: 0, peakArea: 0 },
      { id: '2', concentration: 0, peakArea: 0 },
      { id: '3', concentration: 0, peakArea: 0 }
    ]);
    setResults(null);
    setError(null);
  }, []);

  // Validation logic
  const validation = useMemo((): ValidationResult => {
    const validPoints = dataPoints.filter(p => p.concentration > 0 && p.peakArea > 0);
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check minimum points
    if (validPoints.length < 3) {
      errors.push('Minimum 3 valid data points required');
    }

    // Check for duplicates
    const concentrations = validPoints.map(p => p.concentration);
    const hasDuplicates = concentrations.length !== new Set(concentrations).size;
    if (hasDuplicates) {
      warnings.push('Duplicate concentration values detected');
    }

    // Check concentration range (order of magnitude)
    if (validPoints.length >= 2) {
      const sortedConc = concentrations.sort((a, b) => a - b);
      const minConc = sortedConc[0];
      const maxConc = sortedConc[sortedConc.length - 1];
      if (maxConc / minConc < 10) {
        warnings.push('Concentration span < 1 order of magnitude');
      }
    }

    // Check monotonic relationship
    const sortedPoints = validPoints.sort((a, b) => a.concentration - b.concentration);
    let isMonotonic = true;
    for (let i = 1; i < sortedPoints.length; i++) {
      if (sortedPoints[i].peakArea < sortedPoints[i-1].peakArea) {
        isMonotonic = false;
        break;
      }
    }
    if (!isMonotonic) {
      warnings.push('Non-monotonic concentration-response relationship');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }, [dataPoints]);

  // Calculate detection limits
  const calculateLimits = useCallback(async () => {
    if (!validation.isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const validPoints = dataPoints.filter(p => p.concentration > 0 && p.peakArea > 0);
      const input: DetectionLimitInput = {
        concentrations: validPoints.map(p => p.concentration),
        peak_areas: validPoints.map(p => p.peakArea),
        method
      };

      const response = await apiClient.post<DetectionLimitInput, DetectionLimitOutput>('/detection-limits/calculate', input);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  }, [dataPoints, method, validation.isValid]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const validPoints = dataPoints.filter(p => p.concentration > 0 && p.peakArea > 0);
    if (validPoints.length < 2 || !results) return null;

    const sortedPoints = validPoints.sort((a, b) => a.concentration - b.concentration);
    const xData = sortedPoints.map(p => p.concentration);
    const yData = sortedPoints.map(p => p.peakArea);

    // Regression line
    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const regressionX = [minX, maxX];
    const regressionY = regressionX.map(x => 
      results.regression_slope * x + results.regression_intercept
    );

    // LOD and LOQ lines
    const lodLine = {
      x: [results.lod, results.lod],
      y: [0, Math.max(...yData) * 1.1],
      mode: 'lines' as const,
      name: `LOD (${results.lod.toFixed(3)})`,
      line: { color: '#ef4444', dash: 'dash' }
    };

    const loqLine = {
      x: [results.loq, results.loq],
      y: [0, Math.max(...yData) * 1.1],
      mode: 'lines' as const,
      name: `LOQ (${results.loq.toFixed(3)})`,
      line: { color: '#f97316', dash: 'dash' }
    };

    return {
      data: [
        {
          x: xData,
          y: yData,
          mode: 'markers' as const,
          type: 'scatter' as const,
          name: 'Data Points',
          marker: { color: '#3b82f6', size: 8 }
        },
        {
          x: regressionX,
          y: regressionY,
          mode: 'lines' as const,
          type: 'scatter' as const,
          name: `Regression (R² = ${results.r_squared.toFixed(4)})`,
          line: { color: '#10b981', width: 2 }
        },
        lodLine,
        loqLine
      ],
      layout: {
        title: 'Calibration Curve with Detection Limits',
        xaxis: { 
          title: 'Concentration',
          showgrid: true,
          gridcolor: '#e5e7eb'
        },
        yaxis: { 
          title: 'Peak Area',
          showgrid: true,
          gridcolor: '#e5e7eb'
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter, sans-serif' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 }
      }
    };
  }, [dataPoints, results]);

  // Residuals chart data
  const residualsData = useMemo(() => {
    if (!results || !chartData) return null;

    const validPoints = dataPoints.filter(p => p.concentration > 0 && p.peakArea > 0);
    const residuals = validPoints.map(point => {
      const predicted = results.regression_slope * point.concentration + results.regression_intercept;
      return point.peakArea - predicted;
    });
    const concentrations = validPoints.map(p => p.concentration);

    return {
      data: [{
        x: concentrations,
        y: residuals,
        mode: 'markers' as const,
        type: 'scatter' as const,
        name: 'Residuals',
        marker: { color: '#6366f1', size: 6 }
      }, {
        x: [Math.min(...concentrations), Math.max(...concentrations)],
        y: [0, 0],
        mode: 'lines' as const,
        type: 'scatter' as const,
        name: 'Zero Line',
        line: { color: '#6b7280', dash: 'dash' },
        showlegend: false
      }],
      layout: {
        title: 'Residuals Plot',
        xaxis: { 
          title: 'Concentration',
          showgrid: true,
          gridcolor: '#e5e7eb'
        },
        yaxis: { 
          title: 'Residuals',
          showgrid: true,
          gridcolor: '#e5e7eb'
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter, sans-serif', size: 10 },
        height: 200,
        margin: { t: 40, b: 40, l: 50, r: 20 }
      }
    };
  }, [dataPoints, results, chartData]);

  // Export functions
  const exportCSV = useCallback(() => {
    if (!results) return;

    const validPoints = dataPoints.filter(p => p.concentration > 0 && p.peakArea > 0);
    const csv = [
      'Concentration,Peak Area,Predicted Area,Residual',
      ...validPoints.map(point => {
        const predicted = results.regression_slope * point.concentration + results.regression_intercept;
        const residual = point.peakArea - predicted;
        return `${point.concentration},${point.peakArea},${predicted.toFixed(2)},${residual.toFixed(2)}`;
      }),
      '',
      `LOD (${method}),${results.lod}`,
      `LOQ (${method}),${results.loq}`,
      `Slope,${results.regression_slope}`,
      `Intercept,${results.regression_intercept}`,
      `R-squared,${results.r_squared}`,
      `Standard Error,${results.standard_error}`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection_limits_${method}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataPoints, results, method]);

  const exportPNG = useCallback(() => {
    if (!chartData || !results) return;
    
    // Find the Plotly chart element and trigger download
    const plotElement = document.querySelector('.plotly-chart-container .js-plotly-plot') as any;
    if (plotElement && (window as any).Plotly) {
      (window as any).Plotly.downloadImage(plotElement, {
        format: 'png',
        width: 800,
        height: 600,
        filename: `detection_limits_chart_${method}_${new Date().toISOString().split('T')[0]}`
      });
    } else {
      // Fallback: create a simple notification
      alert('PNG export requires the chart to be fully loaded. Please try again in a moment.');
    }
  }, [chartData, results, method]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-500/10 rounded-lg flex-shrink-0">
          <Calculator className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detection Limit Calculator</h1>
          <p className="text-gray-600">Calculate LOD and LOQ using linear regression with confidence intervals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Input & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Detection Method</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Label htmlFor="method-3sigma" className="text-sm">3-Sigma</Label>
                <Switch
                  id="method-switch"
                  checked={method === '10sigma'}
                  onCheckedChange={(checked) => setMethod(checked ? '10sigma' : '3sigma')}
                  aria-label="Toggle between 3-sigma and 10-sigma methods"
                />
                <Label htmlFor="method-10sigma" className="text-sm">10-Sigma</Label>
              </div>
              <p className="text-xs text-gray-500">
                {method === '3sigma' 
                  ? '3σ method: LOD = 3σ/slope, LOQ = 10σ/slope' 
                  : '10σ method: LOD = 10σ/slope, LOQ = 33σ/slope'
                }
              </p>
            </div>

            {/* Validation Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={validation.isValid ? "default" : "error"}>
                  {validation.isValid ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready to Calculate
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {validation.errors[0]}
                    </>
                  )}
                </Badge>
                {validation.warnings.map((warning, idx) => (
                  <Badge key={idx} variant="warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {warning}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Data Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Calibration Data</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadSampleData}
                    className="text-xs"
                  >
                    Load Sample
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearData}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                    <div className="col-span-5">Concentration</div>
                    <div className="col-span-5">Peak Area</div>
                    <div className="col-span-2">Action</div>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {dataPoints.map((point, index) => (
                    <div key={point.id} className="px-3 py-2 border-b last:border-b-0">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Input
                            type="number"
                            value={point.concentration || ''}
                            onChange={(e) => updateDataPoint(point.id, 'concentration', parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                            className="h-8 text-sm"
                            step="any"
                            min="0"
                            aria-label={`Concentration for point ${index + 1}`}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            type="number"
                            value={point.peakArea || ''}
                            onChange={(e) => updateDataPoint(point.id, 'peakArea', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="h-8 text-sm"
                            step="any"
                            min="0"
                            aria-label={`Peak area for point ${index + 1}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDataPoint(point.id)}
                            disabled={dataPoints.length <= 3}
                            className="h-8 w-8 p-0"
                            aria-label={`Remove data point ${index + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDataPoint}
                className="w-full"
                disabled={dataPoints.length >= 20}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Data Point
              </Button>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={calculateLimits}
              disabled={!validation.isValid || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Calculating...' : 'Calculate Detection Limits'}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Results */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Results & Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">LOD</div>
                    <div className="text-lg font-bold text-blue-900">{results.lod.toExponential(3)}</div>
                    <div className="text-xs text-blue-600">Limit of Detection</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide">LOQ</div>
                    <div className="text-lg font-bold text-green-900">{results.loq.toExponential(3)}</div>
                    <div className="text-xs text-green-600">Limit of Quantification</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">R²</div>
                    <div className="text-lg font-bold text-purple-900">{results.r_squared.toFixed(6)}</div>
                    <div className="text-xs text-purple-600">Correlation Coefficient</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Slope</div>
                    <div className="text-lg font-bold text-orange-900">{results.regression_slope.toExponential(3)}</div>
                    <div className="text-xs text-orange-600">Response Factor</div>
                  </div>
                </div>

                <Separator />

                {/* Regression Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Regression Parameters</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Intercept:</span>
                      <span className="ml-2 font-mono">{results.regression_intercept.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Std Error:</span>
                      <span className="ml-2 font-mono">{results.standard_error.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Main Chart */}
                {chartData && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Calibration Curve</h4>
                    <div className="card-content">
                      <PlotlyChart
                        data={chartData.data}
                        layout={chartData.layout}
                        style={{ width: '100%', height: '300px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Residuals Chart */}
                {residualsData && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Residuals Analysis</h4>
                    <div className="card-content">
                      <PlotlyChart
                        data={residualsData.data}
                        layout={residualsData.layout}
                        style={{ width: '100%', height: '200px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPNG}
                    className="flex-1"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Export PNG
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Enter calibration data and click "Calculate Detection Limits" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}