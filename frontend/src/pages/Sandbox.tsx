import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge, Button, Input } from '../components/ui';
import { TestTube, Thermometer, Gauge, Activity, Play, Pause, RotateCcw, Database, Download, FileImage } from 'lucide-react';
import { SandboxPreset, AVAILABLE_PRESETS, DEMO_PRESETS, ChromatogramGenerator, PresetId } from '../lib/presets';
import { RTCalibrator, DEFAULT_CALIBRATION } from '../lib/calibration';

export const Sandbox: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<SandboxPreset | null>(null);
  const [chromatogramData, setChromatogramData] = useState<{
    time: number[];
    signal: number[];
    peaks: Array<{name: string, rt: number, area: number, height: number, snr: number, tailing: number}>;
  } | null>(null);
  const [crosshairPosition, setCrosshairPosition] = useState<{x: number, y: number} | null>(null);
  const [calibrator, setCalibrator] = useState<RTCalibrator>(new RTCalibrator(DEFAULT_CALIBRATION));
  const [showCalibration, setShowCalibration] = useState(false);

  const loadPreset = (presetId: PresetId) => {
    const preset = DEMO_PRESETS[presetId];
    setCurrentPreset(preset);
    
    // Generate chromatogram data
    const data = ChromatogramGenerator.generateTrace(preset);
    setChromatogramData(data);
  };

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentPreset(null);
    setChromatogramData(null);
    setCrosshairPosition(null);
  };

  const exportPNG = () => {
    // In a real implementation, this would generate and download a PNG
    alert('PNG export functionality would be implemented here');
  };

  const exportCSV = () => {
    if (!chromatogramData) return;
    
    const csvContent = [
      ['Time (min)', 'Signal', 'Peak Info'],
      ...chromatogramData.time.map((t, i) => [
        t.toFixed(3),
        chromatogramData.signal[i].toFixed(6),
        ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chromatogram_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">GC Instrument Sandbox</h1>
          <p className="text-text-secondary mt-2">
            Interactive simulation environment for gas chromatography analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={currentPreset ? "success" : "outline"}>
            {currentPreset ? "Data Loaded" : "No Data"}
          </Badge>
          {chromatogramData && (
            <>
              <Button onClick={exportPNG} variant="outline" size="sm">
                <FileImage size={16} className="mr-2" />
                PNG
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                CSV
              </Button>
            </>
          )}
          <Button onClick={resetSimulation} variant="outline" className="px-4">
            <RotateCcw size={18} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Load Demo Dataset */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="text-accent-500" size={20} />
            <CardTitle>Load Demo Dataset</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  currentPreset && preset.id === 'lpg_clean' && preset.name === 'LPG Clean' ? 
                  'border-accent-500 bg-accent-50' : 
                  'border-border hover:border-accent-300 bg-surface hover:bg-surface-hover'
                }`}
              >
                <h3 className="font-semibold text-text-primary mb-2">{preset.name}</h3>
                <p className="text-sm text-text-secondary mb-2">{preset.description}</p>
                <Badge variant="outline" size="sm">{preset.category}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chromatogram Display */}
      {chromatogramData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="text-accent-500" size={20} />
                    <CardTitle>Synthetic Chromatogram</CardTitle>
                  </div>
                  {crosshairPosition && (
                    <Badge variant="info" className="text-xs">
                      RT: {crosshairPosition.x.toFixed(2)} min | Signal: {crosshairPosition.y.toFixed(0)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 bg-surface rounded-lg relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Generate simplified trace */}
                    <path
                      d={chromatogramData.time.map((t, i) => {
                        const x = (t / Math.max(...chromatogramData.time)) * 380 + 10;
                        const y = 190 - (chromatogramData.signal[i] / Math.max(...chromatogramData.signal)) * 170;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    
                    {/* Peak markers */}
                    {chromatogramData.peaks.map((peak, index) => (
                      <g key={index}>
                        <circle
                          cx={(peak.rt / Math.max(...chromatogramData.time)) * 380 + 10}
                          cy={190 - (peak.height / Math.max(...chromatogramData.signal)) * 170}
                          r="4"
                          fill="#ef4444"
                        />
                        <text
                          x={(peak.rt / Math.max(...chromatogramData.time)) * 380 + 10}
                          y={190 - (peak.height / Math.max(...chromatogramData.signal)) * 170 - 10}
                          textAnchor="middle"
                          className="text-xs fill-text-primary"
                        >
                          {peak.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Analysis Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Peak Analysis</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCalibration(!showCalibration)}
                  >
                    {showCalibration ? 'Hide Cal' : 'Show Cal'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {chromatogramData.peaks.map((peak, index) => (
                    <div key={index} className="p-3 bg-surface rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-text-primary">{peak.name}</h4>
                        <Badge variant="outline" size="sm">
                          Peak {index + 1}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">RT (obs):</span>
                          <span className="text-text-primary">{peak.rt.toFixed(2)} min</span>
                        </div>
                        {showCalibration && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">RT (cal):</span>
                            <span className="text-text-primary">{calibrator.applyCalibration(peak.rt).toFixed(2)} min</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Area:</span>
                          <span className="text-text-primary">{peak.area.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Height:</span>
                          <span className="text-text-primary">{peak.height.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">SNR:</span>
                          <span className="text-text-primary">{peak.snr.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Tailing:</span>
                          <span className="text-text-primary">{peak.tailing.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Current Preset Info */}
      {currentPreset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Current Dataset Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-info-600">{currentPreset.method.oven_steps[0]?.temp || 'N/A'}°C</div>
                    <div className="text-sm text-text-secondary">Initial Temp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">{currentPreset.inlet.pressure_kpa} kPa</div>
                    <div className="text-sm text-text-secondary">Inlet Pressure</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">{currentPreset.inlet.split}:1</div>
                    <div className="text-sm text-text-secondary">Split Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-600">{currentPreset.column.gas}</div>
                    <div className="text-sm text-text-secondary">Carrier Gas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calibration Status */}
          <div>
            <Card variant="glass">
              <CardHeader>
                <CardTitle>RT Calibration</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {calibrator.getConfig().anchors.map((anchor, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-surface rounded">
                      <span className="font-medium text-text-primary">{anchor.name}</span>
                      <div className="text-sm">
                        <div className="text-text-secondary">
                          {anchor.observed_rt.toFixed(2)} → {anchor.target_rt.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Δ{(anchor.target_rt - anchor.observed_rt).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <div className="text-xs text-text-secondary">
                      Dead time: {calibrator.getConfig().dead_time_min.toFixed(2)} min
                    </div>
                    <Badge variant="info" size="sm" className="mt-1">
                      {calibrator.getCalibrationMetrics().anchor_count} anchors
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};