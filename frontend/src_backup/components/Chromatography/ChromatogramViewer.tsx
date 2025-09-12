import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Chip
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Download,
  Visibility,
  VisibilityOff,
  Refresh
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { useMobile } from '../../hooks/useMobile';

interface Peak {
  id: string;
  rt: number;
  area: number;
  height: number;
  width: number;
  name?: string;
  snr?: number;
}

interface ChromatogramViewerProps {
  time: number[];
  signal: number[];
  peaks?: Peak[];
  baseline?: number[];
  sampleName?: string;
  onPeakSelect?: (peak: Peak) => void;
  selectedPeakId?: string;
  showBaseline?: boolean;
  showPeaks?: boolean;
  onBaselineToggle?: (show: boolean) => void;
  onPeaksToggle?: (show: boolean) => void;
  onExport?: (format: 'csv' | 'png') => void;
}

export const ChromatogramViewer: React.FC<ChromatogramViewerProps> = ({
  time,
  signal,
  peaks = [],
  baseline = [],
  sampleName = 'Chromatogram',
  onPeakSelect,
  selectedPeakId,
  showBaseline = false,
  showPeaks = true,
  onBaselineToggle,
  onPeaksToggle,
  onExport
}) => {
  const { isMobile } = useMobile();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSNR, setShowSNR] = useState(false);

  // Calculate plot data
  const plotData = useMemo(() => {
    const traces: any[] = [];

    // Main chromatogram trace
    traces.push({
      x: time,
      y: signal,
      type: 'scatter',
      mode: 'lines',
      name: 'Signal',
      line: { color: '#1d4ed8', width: 2 },
      fill: 'tonexty',
      fillcolor: 'rgba(29, 78, 216, 0.1)'
    });

    // Baseline trace
    if (showBaseline && baseline.length > 0) {
      traces.push({
        x: time,
        y: baseline,
        type: 'scatter',
        mode: 'lines',
        name: 'Baseline',
        line: { color: '#dc2626', width: 1, dash: 'dash' },
        opacity: 0.7
      });
    }

    // Peak markers
    if (showPeaks && peaks.length > 0) {
      const peakX = peaks.map(p => p.rt);
      const peakY = peaks.map(p => p.height);
      const peakText = peaks.map(p => 
        `${p.name || 'Unknown'}<br>RT: ${p.rt.toFixed(2)} min<br>Area: ${p.area.toFixed(0)}<br>Height: ${p.height.toFixed(1)}${p.snr ? `<br>SNR: ${p.snr.toFixed(1)}` : ''}`
      );
      const peakColors = peaks.map(p => 
        p.id === selectedPeakId ? '#f59e0b' : '#10b981'
      );

      traces.push({
        x: peakX,
        y: peakY,
        type: 'scatter',
        mode: 'markers' as any, // TODO: Fix TypeScript mode prop type issue
        name: 'Peaks',
        marker: {
          size: 8,
          color: peakColors,
          line: { color: '#ffffff', width: 1 }
        },
        text: peakText,
        hoverinfo: 'text',
        hovertemplate: '%{text}<extra></extra>'
      });
    }

    return traces;
  }, [time, signal, baseline, peaks, showBaseline, showPeaks, selectedPeakId]);

  // Plot layout
  const layout = useMemo(() => ({
    title: {
      text: sampleName,
      font: { size: isMobile ? 16 : 18 }
    },
    xaxis: {
      title: 'Retention Time (minutes)',
      gridcolor: '#e2e8f0',
      zeroline: false,
      showgrid: true
    },
    yaxis: {
      title: 'Signal Intensity',
      gridcolor: '#e2e8f0',
      zeroline: false,
      showgrid: true
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: '#e2e8f0',
      borderwidth: 1
    },
    margin: { 
      l: isMobile ? 50 : 60, 
      r: isMobile ? 30 : 40, 
      t: isMobile ? 40 : 50, 
      b: isMobile ? 50 : 60 
    },
    hovermode: 'closest',
    dragmode: 'pan',
    modebar: {
      orientation: 'v',
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      color: '#374151',
      activecolor: '#1d4ed8'
    }
  }), [sampleName, isMobile]);

  // Plot config
  const config = useMemo(() => ({
    displayModeBar: true,
    responsive: true,
    scrollZoom: true,
    doubleClick: 'reset',
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    modeBarButtonsToAdd: [
      {
        name: 'Toggle Peaks',
        icon: showPeaks ? VisibilityOff : Visibility,
        click: () => onPeaksToggle?.(!showPeaks)
      }
    ]
  }), [showPeaks, onPeaksToggle]);

  // Handle plot click
  const handlePlotClick = useCallback((event: any) => {
    if (event && event.points && event.points.length > 0) {
      const point = event.points[0];
      if (point.data.name === 'Peaks') {
        const peakIndex = peaks.findIndex(p => 
          Math.abs(p.rt - point.x) < 0.1 && Math.abs(p.height - point.y) < 10
        );
        if (peakIndex >= 0) {
          onPeakSelect?.(peaks[peakIndex]);
        }
      }
    }
  }, [peaks, onPeakSelect]);

  // Handle zoom
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newLevel = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.1, Math.min(10, newLevel));
    });
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setZoomLevel(1);
    // The plot will auto-reset due to doubleClick: 'reset' config
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const maxSignal = Math.max(...signal);
    const minSignal = Math.min(...signal);
    const avgSignal = signal.reduce((a, b) => a + b, 0) / signal.length;
    const timeRange = Math.max(...time) - Math.min(...time);
    
    return {
      maxSignal: maxSignal.toFixed(1),
      minSignal: minSignal.toFixed(1),
      avgSignal: avgSignal.toFixed(1),
      timeRange: timeRange.toFixed(1),
      dataPoints: time.length,
      peakCount: peaks.length
    };
  }, [time, signal, peaks]);

  return (
    <Card>
      <CardContent>
        {/* Header with controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Chromatogram Viewer
          </Typography>
          
          <Box display="flex" gap={1} alignItems="center">
            {/* Zoom controls */}
            <ButtonGroup size="small">
              <Tooltip title="Zoom In">
                <IconButton onClick={() => handleZoom('in')}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton onClick={() => handleZoom('out')}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset View">
                <IconButton onClick={handleReset}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            {/* Toggle controls */}
            <Box display="flex" gap={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={showBaseline}
                    onChange={(e) => onBaselineToggle?.(e.target.checked)}
                    size="small"
                  />
                }
                label="Baseline"
                labelPlacement="start"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showPeaks}
                    onChange={(e) => onPeaksToggle?.(e.target.checked)}
                    size="small"
                  />
                }
                label="Peaks"
                labelPlacement="start"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showSNR}
                    onChange={(e) => setShowSNR(e.target.checked)}
                    size="small"
                  />
                }
                label="SNR"
                labelPlacement="start"
              />
            </Box>

            {/* Export controls */}
            <ButtonGroup size="small">
              <Tooltip title="Export CSV">
                <IconButton onClick={() => onExport?.('csv')}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export PNG">
                <IconButton onClick={() => onExport?.('png')}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Statistics */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip label={`Data Points: ${stats.dataPoints}`} size="small" />
          <Chip label={`Time Range: ${stats.timeRange} min`} size="small" />
          <Chip label={`Max Signal: ${stats.maxSignal}`} size="small" />
          <Chip label={`Peaks: ${stats.peakCount}`} size="small" />
          {showSNR && peaks.length > 0 && (
            <Chip 
              label={`Avg SNR: ${(peaks.reduce((sum, p) => sum + (p.snr || 0), 0) / peaks.length).toFixed(1)}`} 
              size="small" 
            />
          )}
        </Box>

        {/* Plot */}
        <Box sx={{ height: isMobile ? 400 : 500, position: 'relative' }}>
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
            onClick={handlePlotClick}
            useResizeHandler={true}
          />
        </Box>

        {/* Peak information */}
        {selectedPeakId && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Peak:
            </Typography>
            {peaks.find(p => p.id === selectedPeakId) && (
              <Box>
                <Typography variant="body2">
                  <strong>Name:</strong> {peaks.find(p => p.id === selectedPeakId)?.name || 'Unknown'}<br/>
                  <strong>Retention Time:</strong> {peaks.find(p => p.id === selectedPeakId)?.rt.toFixed(2)} min<br/>
                  <strong>Area:</strong> {peaks.find(p => p.id === selectedPeakId)?.area.toFixed(0)}<br/>
                  <strong>Height:</strong> {peaks.find(p => p.id === selectedPeakId)?.height.toFixed(1)}<br/>
                  <strong>Width:</strong> {peaks.find(p => p.id === selectedPeakId)?.width.toFixed(3)} min<br/>
                  {peaks.find(p => p.id === selectedPeakId)?.snr && (
                    <><strong>SNR:</strong> {peaks.find(p => p.id === selectedPeakId)?.snr?.toFixed(1)}</>
                  )}
                </Typography>
              </Box>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
