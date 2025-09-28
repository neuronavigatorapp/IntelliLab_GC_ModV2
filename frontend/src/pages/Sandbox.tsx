import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge, Button, Input } from '../components/ui';
import { TestTube, Thermometer, Gauge, Activity, Play, Pause, RotateCcw, Database, Download, FileImage, Info, FlaskConical } from 'lucide-react';
import { SandboxPreset, AVAILABLE_PRESETS, DEMO_PRESETS, ChromatogramGenerator, PresetId } from '../lib/presets';
import { RTCalibrator, DEFAULT_CALIBRATION } from '../lib/calibration';

export const Sandbox: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [ocrData, setOcrData] = useState<{peaks: any[], hints: any} | null>(null);
  const [troubleshooterData, setTroubleshooterData] = useState<{
    recommendation?: string;
    rule?: string;
    suggestion?: string;
    description?: string;
    category?: string;
    priority?: string;
    context?: any;
    data?: any;
  } | null>(null);

  // Handle OCR data and Troubleshooter data from URL parameters
  useEffect(() => {
    const peaksParam = searchParams.get('peaks');
    const hintsParam = searchParams.get('hints');
    const recommendationParam = searchParams.get('recommendation');
    const suggestionParam = searchParams.get('suggestion');
    const dataParam = searchParams.get('data');
    
    // Handle OCR data (legacy)
    if (peaksParam && hintsParam) {
      try {
        const peaks = JSON.parse(decodeURIComponent(peaksParam));
        const hints = JSON.parse(decodeURIComponent(hintsParam));
        
        setOcrData({ peaks, hints });
        
        // Generate overlay trace from OCR peaks
        const ocrTrace = generateOCRTrace(peaks, hints);
        setChromatogramData(ocrTrace);
        
        // Clear URL params after loading
        setSearchParams({});
      } catch (error) {
        console.error('Failed to parse OCR data from URL:', error);
      }
    }
    
    // Handle Troubleshooter data
    if (recommendationParam || suggestionParam || dataParam) {
      try {
        const troubleshooterParams: any = {};
        
        if (recommendationParam) {
          troubleshooterParams.recommendation = decodeURIComponent(recommendationParam);
        }
        if (suggestionParam) {
          troubleshooterParams.suggestion = decodeURIComponent(suggestionParam);
        }
        if (searchParams.get('rule')) {
          troubleshooterParams.rule = decodeURIComponent(searchParams.get('rule')!);
        }
        if (searchParams.get('description')) {
          troubleshooterParams.description = decodeURIComponent(searchParams.get('description')!);
        }
        if (searchParams.get('category')) {
          troubleshooterParams.category = decodeURIComponent(searchParams.get('category')!);
        }
        if (searchParams.get('priority')) {
          troubleshooterParams.priority = decodeURIComponent(searchParams.get('priority')!);
        }
        if (searchParams.get('context')) {
          troubleshooterParams.context = JSON.parse(decodeURIComponent(searchParams.get('context')!));
        }
        if (dataParam) {
          troubleshooterParams.data = JSON.parse(decodeURIComponent(dataParam));
          
          // Generate chromatogram from troubleshooter data
          if (troubleshooterParams.data.peaks) {
            const troubleshooterTrace = generateTroubleshooterTrace(troubleshooterParams.data);
            setChromatogramData(troubleshooterTrace);
          }
        }
        
        setTroubleshooterData(troubleshooterParams);
        
        // Clear URL params after loading
        setSearchParams({});
      } catch (error) {
        console.error('Failed to parse troubleshooter data from URL:', error);
      }
    }
  }, [searchParams, setSearchParams]);

  // Generate chromatogram trace from OCR peaks
  const generateOCRTrace = (peaks: any[], hints: any) => {
    const maxTime = hints.max_rt * 1.2; // Add some padding
    const timePoints = Array.from({ length: 1000 }, (_, i) => (i * maxTime) / 999);
    const signal = new Array(1000).fill(0);
    
    // Add baseline noise
    const noiseLevel = Math.max(100 - hints.baseline_quality, 10);
    for (let i = 0; i < signal.length; i++) {
      signal[i] = noiseLevel * (0.5 - Math.random());
    }
    
    // Add peaks
    const processedPeaks = peaks.map(peak => ({
      name: `Peak RT ${peak.rt.toFixed(2)}`,
      rt: peak.rt,
      area: peak.area,
      height: peak.height,
      snr: peak.snr,
      tailing: 1.2 // Default tailing
    }));
    
    // Generate Gaussian peaks
    processedPeaks.forEach(peak => {
      const peakCenter = (peak.rt / maxTime) * 999;
      const peakWidth = 5; // Standard width
      
      for (let i = 0; i < signal.length; i++) {
        const distance = Math.abs(i - peakCenter);
        if (distance < peakWidth * 3) {
          const gaussian = peak.height * Math.exp(-0.5 * Math.pow(distance / peakWidth, 2));
          signal[i] += gaussian;
        }
      }
    });
    
    return {
      time: timePoints,
      signal,
      peaks: processedPeaks
    };
  };

  // Generate chromatogram trace from troubleshooter data
  const generateTroubleshooterTrace = (data: any) => {
    const maxTime = 15; // Default run time
    const timePoints = Array.from({ length: 1000 }, (_, i) => (i * maxTime) / 999);
    const signal = new Array(1000).fill(0);
    
    // Add baseline noise based on quality
    const noiseLevel = Math.max(100 - (data.baseline_quality || 80), 15);
    for (let i = 0; i < signal.length; i++) {
      signal[i] = noiseLevel * (0.5 - Math.random());
    }
    
    // Add peaks from mock data
    const processedPeaks = data.peaks?.map((peak: any, index: number) => ({
      name: peak.name || `Peak ${index + 1}`,
      rt: peak.rt || (index + 1) * 2,
      area: peak.area || 1000 + Math.random() * 5000,
      height: peak.height || 100 + Math.random() * 500,
      snr: peak.snr || 10 + Math.random() * 20,
      tailing: peak.tailing || 1.1 + Math.random() * 0.5
    })) || [
      { name: 'Component A', rt: 3.2, area: 2500, height: 180, snr: 15.2, tailing: 1.3 },
      { name: 'Component B', rt: 6.8, area: 4200, height: 320, snr: 22.1, tailing: 1.1 },
      { name: 'Component C', rt: 9.5, area: 1800, height: 140, snr: 8.9, tailing: 1.8 }
    ];
    
    // Generate Gaussian peaks
    processedPeaks.forEach((peak: any) => {
      const peakCenter = (peak.rt / maxTime) * 999;
      const peakWidth = 6; // Slightly wider peaks for troubleshooting scenarios
      
      for (let i = 0; i < signal.length; i++) {
        const distance = Math.abs(i - peakCenter);
        if (distance < peakWidth * 3) {
          const gaussian = peak.height * Math.exp(-0.5 * Math.pow(distance / peakWidth, 2));
          signal[i] += gaussian;
        }
      }
    });
    
    return {
      time: timePoints,
      signal,
      peaks: processedPeaks
    };
  };

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
    setOcrData(null);
    setTroubleshooterData(null);
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
          <Badge variant={currentPreset || chromatogramData ? "success" : "outline"}>
            {currentPreset || chromatogramData ? "Data Loaded" : "No Data"}
          </Badge>
          {chromatogramData && (
            <>
              <Button onClick={exportPNG} variant="outline" size="sm" data-testid="export-png-btn">
                <FileImage size={16} className="mr-2" />
                PNG
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm" data-testid="export-csv-btn">
                <Download size={16} className="mr-2" />
                CSV
              </Button>
            </>
          )}
          <Button onClick={resetSimulation} variant="outline" className="px-4" data-testid="reset-btn">
            <RotateCcw size={18} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* OCR Data Info Banner */}
      {ocrData && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <Info className="text-blue-600" size={20} />
              <div>
                <h3 className="font-medium text-blue-900">Loaded from OCR Analysis</h3>
                <p className="text-sm text-blue-700">
                  Displaying {ocrData.peaks.length} peaks from chromatogram image analysis.
                  Average S/N: {ocrData.hints.avg_snr.toFixed(1)}, 
                  Baseline quality: {ocrData.hints.baseline_quality}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooter Data Info Banner */}
      {troubleshooterData && (
        <div className="card bg-orange-50 border-orange-200" data-testid="troubleshooter-banner">
          <div className="card-content">
            <div className="flex items-center gap-3">
              <FlaskConical className="text-orange-600" size={20} />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">Applied from AI Troubleshooter</h3>
                <div className="text-sm text-orange-700 space-y-1">
                  {troubleshooterData.recommendation && (
                    <p><strong>Recommendation:</strong> {troubleshooterData.recommendation}</p>
                  )}
                  {troubleshooterData.suggestion && (
                    <p><strong>Suggestion:</strong> {troubleshooterData.suggestion}</p>
                  )}
                  {troubleshooterData.description && (
                    <p><strong>Issue:</strong> {troubleshooterData.description}</p>
                  )}
                  {troubleshooterData.rule && (
                    <p><strong>Rule:</strong> {troubleshooterData.rule.replace(/_/g, ' ').toUpperCase()}</p>
                  )}
                  {troubleshooterData.category && troubleshooterData.priority && (
                    <p>
                      <strong>Category:</strong> {troubleshooterData.category} | 
                      <strong> Priority:</strong> {troubleshooterData.priority.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="warning" className="text-xs">
                Troubleshooter
              </Badge>
            </div>
          </div>
        </div>
      )}

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