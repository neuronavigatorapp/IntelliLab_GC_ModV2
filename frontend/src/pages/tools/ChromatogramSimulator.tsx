import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Image, 
  Info,
  Settings,
  TrendingUp,
  Zap,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '../../lib/demoApiClient';
import { ChromatogramSimulationInput, ChromatogramSimulationOutput } from '../../lib/api.types';
import PlotlyChart from '../../components/charts/PlotlyChart';

// Theme-based UI components
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
    default: 'bg-brand-500 text-white hover:bg-brand-600',
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
      style={{
        backgroundColor: variant === 'default' ? 'var(--brand-500)' : variant === 'outline' ? 'var(--surface)' : undefined,
        borderColor: variant === 'outline' ? 'var(--border)' : undefined,
        color: variant === 'default' ? 'white' : 'var(--text)'
      }}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  id?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
  'aria-label'?: string;
}> = ({ className = '', ...props }) => (
  <input
    className={`app-input w-full text-sm ${className}`}
    {...props}
  />
);

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`} style={{ color: 'var(--text)' }}>
    {children}
  </label>
);

const Select: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ value, onChange, children, className = '', id }) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    className={`app-input w-full text-sm ${className}`}
  >
    {children}
  </select>
);

const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
      {content}
    </div>
  </div>
);

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;
  playbackSpeed: number;
}

interface CrosshairData {
  time: number;
  response: number;
  visible: boolean;
}

const COMPOUND_PROFILES = {
  'Light HC C1-C6': {
    name: 'Light Hydrocarbons C1-C6',
    compounds: ['Methane', 'Ethane', 'Propane', 'Butane', 'Pentane', 'Hexane'],
    description: 'Natural gas and light petroleum fraction analysis'
  },
  'BTEX': {
    name: 'BTEX Aromatics',
    compounds: ['Benzene', 'Toluene', 'Ethylbenzene', 'Xylenes'],
    description: 'Environmental monitoring of aromatic hydrocarbons'
  },
  'Fatty Acids': {
    name: 'Fatty Acid Methyl Esters',
    compounds: ['C12:0', 'C14:0', 'C16:0', 'C18:0', 'C18:1', 'C18:2'],
    description: 'Biodiesel and food analysis'
  }
};

export default function ChromatogramSimulator() {
  // Simulation parameters
  const [parameters, setParameters] = useState<ChromatogramSimulationInput>({
    start_temp: 50,
    end_temp: 280,
    ramp_rate: 10,
    carrier_flow: 1.0,
    split_ratio: 50,
    inlet_temp: 250,
    profile: 'Light HC C1-C6',
    hold_time: 2
  });

  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    playbackSpeed: 1
  });

  // Results and chart data
  const [results, setResults] = useState<ChromatogramSimulationOutput | null>(null);
  const [lastRun, setLastRun] = useState<ChromatogramSimulationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crosshair, setCrosshair] = useState<CrosshairData>({ time: 0, response: 0, visible: false });
  const [showOverlay, setShowOverlay] = useState(false);

  // Animation refs
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Update parameter
  const updateParameter = useCallback((field: keyof ChromatogramSimulationInput, value: string | number) => {
    setParameters(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  // Calculate total runtime
  const estimatedRuntime = useMemo(() => {
    const tempRise = parameters.end_temp - parameters.start_temp;
    const rampTime = tempRise / parameters.ramp_rate;
    return (parameters.hold_time || 2) + rampTime + 2; // 2 min cooling
  }, [parameters]);

  // Run simulation
  const runSimulation = useCallback(async () => {
    if (simulationState.isRunning) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<ChromatogramSimulationInput, ChromatogramSimulationOutput>('/api/chromatogram/simulate', parameters);
      setResults(response);
      setSimulationState(prev => ({ ...prev, isRunning: true, isPaused: false, currentTime: 0 }));
      startTimeRef.current = Date.now();
      
      // Start animation
      const animate = () => {
        if (!startTimeRef.current) return;
        
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
        const simulatedTime = elapsed * simulationState.playbackSpeed;
        
        setSimulationState(prev => {
          if (simulatedTime >= estimatedRuntime * 60) { // convert to seconds
            return { ...prev, isRunning: false, currentTime: estimatedRuntime * 60 };
          }
          return { ...prev, currentTime: simulatedTime };
        });

        if (simulationState.isRunning && !simulationState.isPaused) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  }, [parameters, simulationState.isRunning, simulationState.isPaused, simulationState.playbackSpeed, estimatedRuntime]);

  // Control functions
  const pauseSimulation = useCallback(() => {
    setSimulationState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (!simulationState.isPaused && simulationState.isRunning) {
      // Resume animation
      startTimeRef.current = Date.now() - (simulationState.currentTime / simulationState.playbackSpeed * 1000);
      const animate = () => {
        if (!startTimeRef.current) return;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const simulatedTime = elapsed * simulationState.playbackSpeed;
        
        setSimulationState(prev => {
          if (simulatedTime >= estimatedRuntime * 60) {
            return { ...prev, isRunning: false, currentTime: estimatedRuntime * 60 };
          }
          return { ...prev, currentTime: simulatedTime };
        });

        if (simulationState.isRunning && !simulationState.isPaused) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }, [simulationState.isPaused, simulationState.isRunning, simulationState.currentTime, simulationState.playbackSpeed, estimatedRuntime]);

  const stopSimulation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setLastRun(results);
    setSimulationState({
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      playbackSpeed: 1
    });
    startTimeRef.current = undefined;
  }, [results]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    setSimulationState(prev => ({ ...prev, playbackSpeed: speed }));
    if (simulationState.isRunning && !simulationState.isPaused && startTimeRef.current) {
      // Adjust start time to maintain current position
      const currentRealTime = Date.now();
      const elapsedSimTime = simulationState.currentTime;
      startTimeRef.current = currentRealTime - (elapsedSimTime / speed * 1000);
    }
  }, [simulationState.isRunning, simulationState.isPaused, simulationState.currentTime]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!results) return null;

    const currentTimeMinutes = simulationState.currentTime / 60;
    const visibleTimePoints = results.time_points.filter(t => t <= currentTimeMinutes);
    const visibleSignalPoints = results.signal_points.slice(0, visibleTimePoints.length);

    const traces: any[] = [
      {
        x: visibleTimePoints,
        y: visibleSignalPoints,
        type: 'scatter',
        mode: 'lines',
        name: 'Current Run',
        line: { color: '#3b82f6', width: 2 }
      }
    ];

    // Add overlay of last run if enabled
    if (showOverlay && lastRun) {
      traces.push({
        x: lastRun.time_points,
        y: lastRun.signal_points,
        type: 'scatter',
        mode: 'lines',
        name: 'Previous Run',
        line: { color: '#6b7280', width: 1, dash: 'dash' },
        opacity: 0.7
      });
    }

    // Add peak markers
    if (results.peaks && currentTimeMinutes >= Math.max(...results.peaks.map(p => p.retention_time))) {
      const peakTrace = {
        x: results.peaks.map(p => p.retention_time),
        y: results.peaks.map(p => p.peak_height),
        type: 'scatter',
        mode: 'markers+text',
        name: 'Peaks',
        text: results.peaks.map(p => p.compound),
        textposition: 'top center',
        marker: { 
          color: '#10b981', 
          size: 8,
          symbol: 'triangle-up'
        },
        showlegend: false
      };
      traces.push(peakTrace);
    }

    // Add crosshair
    if (crosshair.visible) {
      traces.push({
        x: [crosshair.time, crosshair.time],
        y: [0, Math.max(...visibleSignalPoints) * 1.1],
        type: 'scatter',
        mode: 'lines',
        name: 'Crosshair',
        line: { color: '#ef4444', width: 1, dash: 'dot' },
        showlegend: false
      });
    }

    return {
      data: traces,
      layout: {
        title: `Live Chromatogram - ${parameters.profile}`,
        xaxis: { 
          title: 'Retention Time (min)',
          range: [0, estimatedRuntime]
        },
        yaxis: { 
          title: 'Detector Response',
          showgrid: true
        },
        hovermode: 'x unified'
      }
    };
  }, [results, simulationState.currentTime, showOverlay, lastRun, crosshair, parameters.profile, estimatedRuntime]);

  // Chart event handlers
  const handleChartHover = useCallback((data: any) => {
    if (data.points && data.points.length > 0) {
      const point = data.points[0];
      setCrosshair({
        time: point.x,
        response: point.y,
        visible: true
      });
    }
  }, []);

  const handleChartUnhover = useCallback(() => {
    setCrosshair(prev => ({ ...prev, visible: false }));
  }, []);

  // Export functions
  const exportCSV = useCallback(() => {
    if (!results) return;
    
    const csv = [
      'Time (min),Signal,Peak,Compound,Retention Time,Peak Height,Peak Area',
      ...results.time_points.map((time, i) => {
        const signal = results.signal_points[i];
        const peak = results.peaks.find(p => Math.abs(p.retention_time - time) < 0.1);
        return `${time},${signal},${peak ? 'Yes' : 'No'},${peak?.compound || ''},${peak?.retention_time || ''},${peak?.peak_height || ''},${peak?.peak_area || ''}`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromatogram_${parameters.profile.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, parameters.profile]);

  const exportPNG = useCallback(() => {
    const plotElement = document.querySelector('.plotly-chart-container .js-plotly-plot') as any;
    if (plotElement && (window as any).Plotly) {
      (window as any).Plotly.downloadImage(plotElement, {
        format: 'png',
        width: 1200,
        height: 600,
        filename: `chromatogram_${parameters.profile.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
      });
    }
  }, [parameters.profile]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-500/10 rounded-lg flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chromatogram Simulator</h1>
          <p className="text-gray-600">Real-time GC simulation with interactive parameter control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Parameters */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Method Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Program */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Temperature Program</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Tooltip content="Initial oven temperature in Celsius">
                    <Label htmlFor="start-temp" className="text-sm">Start Temp (°C)</Label>
                  </Tooltip>
                  <Input
                    id="start-temp"
                    type="number"
                    value={parameters.start_temp}
                    onChange={(e) => updateParameter('start_temp', parseFloat(e.target.value) || 0)}
                    min="30"
                    max="400"
                    step="5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Tooltip content="Final oven temperature in Celsius">
                    <Label htmlFor="end-temp" className="text-sm">End Temp (°C)</Label>
                  </Tooltip>
                  <Input
                    id="end-temp"
                    type="number"
                    value={parameters.end_temp}
                    onChange={(e) => updateParameter('end_temp', parseFloat(e.target.value) || 0)}
                    min="50"
                    max="450"
                    step="5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Tooltip content="Temperature ramp rate in degrees per minute">
                    <Label htmlFor="ramp-rate" className="text-sm">Ramp Rate (°C/min)</Label>
                  </Tooltip>
                  <Input
                    id="ramp-rate"
                    type="number"
                    value={parameters.ramp_rate}
                    onChange={(e) => updateParameter('ramp_rate', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="50"
                    step="0.5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Tooltip content="Initial hold time at start temperature">
                    <Label htmlFor="hold-time" className="text-sm">Hold Time (min)</Label>
                  </Tooltip>
                  <Input
                    id="hold-time"
                    type="number"
                    value={parameters.hold_time}
                    onChange={(e) => updateParameter('hold_time', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="30"
                    step="0.5"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Chromatographic Conditions */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Chromatographic Conditions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Tooltip content="Carrier gas flow rate in mL per minute">
                    <Label htmlFor="carrier-flow" className="text-sm">Carrier Flow (mL/min)</Label>
                  </Tooltip>
                  <Input
                    id="carrier-flow"
                    type="number"
                    value={parameters.carrier_flow}
                    onChange={(e) => updateParameter('carrier_flow', parseFloat(e.target.value) || 0)}
                    min="0.1"
                    max="10"
                    step="0.1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Tooltip content="Split ratio (e.g., 50 = 50:1 split)">
                    <Label htmlFor="split-ratio" className="text-sm">Split Ratio</Label>
                  </Tooltip>
                  <Input
                    id="split-ratio"
                    type="number"
                    value={parameters.split_ratio}
                    onChange={(e) => updateParameter('split_ratio', parseFloat(e.target.value) || 0)}
                    min="1"
                    max="500"
                    step="1"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Tooltip content="Injection port temperature in Celsius">
                    <Label htmlFor="inlet-temp" className="text-sm">Inlet Temp (°C)</Label>
                  </Tooltip>
                  <Input
                    id="inlet-temp"
                    type="number"
                    value={parameters.inlet_temp}
                    onChange={(e) => updateParameter('inlet_temp', parseFloat(e.target.value) || 0)}
                    min="50"
                    max="450"
                    step="5"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Sample Profile */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Sample Profile</h4>
              <div>
                <Label htmlFor="profile" className="text-sm">Compound Mix</Label>
                <Select
                  id="profile"
                  value={parameters.profile}
                  onChange={(value) => updateParameter('profile', value)}
                >
                  {Object.entries(COMPOUND_PROFILES).map(([key, profile]) => (
                    <option key={key} value={key}>{profile.name}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {COMPOUND_PROFILES[parameters.profile as keyof typeof COMPOUND_PROFILES]?.description}
                </p>
              </div>
            </div>

            {/* Runtime Estimate */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Estimated Runtime</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{estimatedRuntime.toFixed(1)} minutes</p>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Simulation Controls</h4>
              <div className="flex gap-2">
                <Button
                  onClick={runSimulation}
                  disabled={simulationState.isRunning || isLoading}
                  className="flex-1"
                  data-testid="run-simulation-btn"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Starting...' : 'Run'}
                </Button>
                <Button
                  onClick={pauseSimulation}
                  disabled={!simulationState.isRunning}
                  variant="outline"
                >
                  {simulationState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={stopSimulation}
                  disabled={!simulationState.isRunning && simulationState.currentTime === 0}
                  variant="outline"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Playback Speed */}
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Speed:</Label>
                <div className="flex gap-1">
                  {[1, 1.5, 2, 5, 10].map(speed => (
                    <Button
                      key={speed}
                      size="sm"
                      variant={simulationState.playbackSpeed === speed ? 'default' : 'outline'}
                      onClick={() => changePlaybackSpeed(speed)}
                      className="text-xs"
                    >
                      {speed}×
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Live Chromatogram */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Live Chromatogram
              {simulationState.isRunning && (
                <span className="text-sm font-normal text-blue-600">
                  ({(simulationState.currentTime / 60).toFixed(1)}/{estimatedRuntime.toFixed(1)} min)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chart Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowOverlay(!showOverlay)}
                  disabled={!lastRun}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Overlay Last Run
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCSV}
                  disabled={!results}
                >
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportPNG}
                  disabled={!results}
                >
                  <Image className="h-3 w-3 mr-1" />
                  PNG
                </Button>
              </div>
            </div>

            {/* Crosshair Info */}
            {crosshair.visible && (
              <div className="p-2 bg-gray-50 rounded text-sm">
                <span className="font-medium">RT:</span> {crosshair.time.toFixed(2)} min | 
                <span className="font-medium"> Response:</span> {crosshair.response.toFixed(0)}
              </div>
            )}

            {/* Chart */}
            <div className="h-96 card-content" data-testid="chrom-chart">
              {chartData ? (
                <PlotlyChart
                  data={chartData.data}
                  layout={chartData.layout}
                  onHover={handleChartHover}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Click "Run" to start chromatogram simulation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Peak Summary */}
            {results && results.peaks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detected Peaks</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {results.peaks.map((peak, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded flex justify-between">
                      <span className="font-medium">{peak.compound}</span>
                      <span>{peak.retention_time.toFixed(2)} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Summary */}
            {results && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-bold text-blue-900">{results.analysis_summary.total_peaks}</div>
                  <div className="text-blue-600">Peaks</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-bold text-green-900">{results.analysis_summary.best_resolution.toFixed(1)}</div>
                  <div className="text-green-600">Best Rs</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-bold text-purple-900">{(results.analysis_summary.analysis_efficiency * 100).toFixed(0)}%</div>
                  <div className="text-purple-600">Efficiency</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}