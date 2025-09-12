import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { chromatographyAPI } from '../../../services/apiService';
import { ChromatogramViewer } from '../../Chromatography/ChromatogramViewer';

interface ChromatogramData {
  time: number[];
  signal: number[];
  peaks: Array<{
    id: string;
    rt: number;
    area: number;
    height: number;
    width: number;
    name?: string;
    snr?: number;
  }>;
  parameters: {
    injection_volume: number;
    split_ratio: number;
    oven_temp: number;
    detector_temp: number;
    carrier_flow: number;
  };
  analysis_results: {
    total_peaks: number;
    resolution: number;
    efficiency: number;
    noise_level: number;
    signal_to_noise: number;
  };
}

const ChromatogramAnalysis: React.FC = () => {
  const [instrumentId, setInstrumentId] = useState<number>(1);
  const [methodId, setMethodId] = useState<number>(1);
  const [injectionVolume, setInjectionVolume] = useState<number>(1.0);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [ovenTemp, setOvenTemp] = useState<number>(40);
  const [detectorTemp, setDetectorTemp] = useState<number>(250);
  const [carrierFlow, setCarrierFlow] = useState<number>(1.5);
  const [run, setRun] = useState<ChromatogramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock instruments and methods for dropdown
  const instruments = [
    { id: 1, name: 'GC-2030-001 (FID)', type: 'GC-FID' },
    { id: 2, name: 'GC-2030-002 (ECD)', type: 'GC-ECD' },
    { id: 3, name: 'GC-2010-001 (MS)', type: 'GC-MS' },
    { id: 4, name: 'GC-7890-001 (FID)', type: 'GC-FID' },
    { id: 5, name: 'GC-7890-002 (ECD)', type: 'GC-ECD' }
  ];

  const methods = [
    { id: 1, name: 'BTEX-2024-01', description: 'Benzene, Toluene, Ethylbenzene, Xylene analysis' },
    { id: 2, name: 'VOC-Analysis', description: 'Volatile Organic Compounds analysis' },
    { id: 3, name: 'Pesticides-Screening', description: 'Pesticide residue screening method' },
    { id: 4, name: 'Fatty-Acids-Profile', description: 'Fatty acid methyl ester analysis' },
    { id: 5, name: 'Alcohols-Analysis', description: 'Alcohol content analysis' }
  ];

  const generateMockChromatogram = (): ChromatogramData => {
    // Generate realistic chromatogram data based on parameters
    const timePoints = 1000;
    const time = Array.from({ length: timePoints }, (_, i) => i * 0.1);
    
    // Base signal with noise
    const baseSignal = time.map(t => Math.exp(-t / 10) * 0.1);
    const noise = time.map(() => (Math.random() - 0.5) * 0.02);
    
    // Add peaks based on method
    let signal = [...baseSignal];
    const peaks: Array<{
      id: string;
      rt: number;
      area: number;
      height: number;
      width: number;
      name?: string;
      snr?: number;
    }> = [];
    
    if (methodId === 1) { // BTEX method
      const btexPeaks = [
        { rt: 3.2, compound: 'Benzene', area: 1500 * injectionVolume / splitRatio },
        { rt: 4.8, compound: 'Toluene', area: 2200 * injectionVolume / splitRatio },
        { rt: 6.5, compound: 'Ethylbenzene', area: 1800 * injectionVolume / splitRatio },
        { rt: 7.2, compound: 'Xylene', area: 2000 * injectionVolume / splitRatio }
      ];
      
      btexPeaks.forEach(peak => {
        const peakIndex = Math.round(peak.rt * 10);
        const peakWidth = 0.3;
        const peakHeight = peak.area / 100;
        
        for (let i = 0; i < timePoints; i++) {
          const distance = Math.abs(time[i] - peak.rt);
          if (distance < peakWidth) {
            const gaussian = Math.exp(-(distance * distance) / (2 * peakWidth * peakWidth));
            signal[i] += gaussian * peakHeight;
          }
        }
        
        peaks.push({
          id: `peak-${Math.random().toString(36).substring(7)}`,
          rt: peak.rt,
          area: peak.area,
          height: peakHeight,
          width: peakWidth,
          name: peak.compound
        });
      });
    } else if (methodId === 2) { // VOC method
      const vocPeaks = [
        { rt: 1.8, compound: 'Methanol', area: 800 * injectionVolume / splitRatio },
        { rt: 2.3, compound: 'Ethanol', area: 1200 * injectionVolume / splitRatio },
        { rt: 3.8, compound: 'Acetone', area: 900 * injectionVolume / splitRatio }
      ];
      
      vocPeaks.forEach(peak => {
        const peakIndex = Math.round(peak.rt * 10);
        const peakWidth = 0.25;
        const peakHeight = peak.area / 80;
        
        for (let i = 0; i < timePoints; i++) {
          const distance = Math.abs(time[i] - peak.rt);
          if (distance < peakWidth) {
            const gaussian = Math.exp(-(distance * distance) / (2 * peakWidth * peakWidth));
            signal[i] += gaussian * peakHeight;
          }
        }
        
        peaks.push({
          id: `peak-${Math.random().toString(36).substring(7)}`,
          rt: peak.rt,
          area: peak.area,
          height: peakHeight,
          width: peakWidth,
          name: peak.compound
        });
      });
    }
    
    // Add noise
    signal = signal.map((s, i) => s + noise[i]);
    
    // Calculate analysis results
    const maxSignal = Math.max(...signal);
    const minSignal = Math.min(...signal);
    const noiseLevel = Math.sqrt(noise.reduce((sum, n) => sum + n * n, 0) / noise.length);
    const signalToNoise = maxSignal / noiseLevel;
    
    return {
      time,
      signal,
      peaks,
      parameters: {
        injection_volume: injectionVolume,
        split_ratio: splitRatio,
        oven_temp: ovenTemp,
        detector_temp: detectorTemp,
        carrier_flow: carrierFlow
      },
      analysis_results: {
        total_peaks: peaks.length,
        resolution: peaks.length > 1 ? 1.5 : 0,
        efficiency: 15000 + Math.random() * 5000,
        noise_level: noiseLevel,
        signal_to_noise: signalToNoise
      }
    };
  };

  const doQuickRun = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate realistic chromatogram data
      const chromatogramData = generateMockChromatogram();
      setRun(chromatogramData);
    } catch (err) {
      setError('Failed to generate chromatogram. Please check your parameters.');
      console.error('Chromatogram generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = () => {
    // Clear previous results when parameters change
    setRun(null);
  };

  useEffect(() => {
    handleParameterChange();
  }, [instrumentId, methodId, injectionVolume, splitRatio, ovenTemp, detectorTemp, carrierFlow]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Chromatogram Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Simulate and analyze gas chromatography runs with realistic parameters and results.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Run Parameters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Instrument</InputLabel>
                <Select
                  value={instrumentId}
                  label="Instrument"
                  onChange={(e) => setInstrumentId(e.target.value as number)}
                >
                  {instruments.map((instrument) => (
                    <MenuItem key={instrument.id} value={instrument.id}>
                      {instrument.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Method</InputLabel>
                <Select
                  value={methodId}
                  label="Method"
                  onChange={(e) => setMethodId(e.target.value as number)}
                >
                  {methods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {method.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Injection Volume (μL)</Typography>
              <Slider
                value={injectionVolume}
                onChange={(_, value) => setInjectionVolume(value as number)}
                min={0.1}
                max={10}
                step={0.1}
                marks={[
                  { value: 0.1, label: '0.1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
                valueLabelDisplay="auto"
              />
              <TextField
                value={injectionVolume}
                onChange={(e) => setInjectionVolume(parseFloat(e.target.value) || 0)}
                type="number"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Split Ratio</Typography>
              <Slider
                value={splitRatio}
                onChange={(_, value) => setSplitRatio(value as number)}
                min={1}
                max={200}
                step={1}
                marks={[
                  { value: 1, label: '1:1' },
                  { value: 50, label: '50:1' },
                  { value: 200, label: '200:1' }
                ]}
                valueLabelDisplay="auto"
              />
              <TextField
                value={splitRatio}
                onChange={(e) => setSplitRatio(parseInt(e.target.value) || 1)}
                type="number"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Oven Temperature (°C)</Typography>
              <Slider
                value={ovenTemp}
                onChange={(_, value) => setOvenTemp(value as number)}
                min={40}
                max={400}
                step={5}
                marks={[
                  { value: 40, label: '40' },
                  { value: 200, label: '200' },
                  { value: 400, label: '400' }
                ]}
                valueLabelDisplay="auto"
              />
              <TextField
                value={ovenTemp}
                onChange={(e) => setOvenTemp(parseInt(e.target.value) || 40)}
                type="number"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Detector Temperature (°C)</Typography>
              <Slider
                value={detectorTemp}
                onChange={(_, value) => setDetectorTemp(value as number)}
                min={200}
                max={350}
                step={5}
                marks={[
                  { value: 200, label: '200' },
                  { value: 250, label: '250' },
                  { value: 350, label: '350' }
                ]}
                valueLabelDisplay="auto"
              />
              <TextField
                value={detectorTemp}
                onChange={(e) => setDetectorTemp(parseInt(e.target.value) || 200)}
                type="number"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Carrier Flow (mL/min)</Typography>
              <Slider
                value={carrierFlow}
                onChange={(_, value) => setCarrierFlow(value as number)}
                min={0.5}
                max={5}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5' },
                  { value: 2, label: '2' },
                  { value: 5, label: '5' }
                ]}
                valueLabelDisplay="auto"
              />
              <TextField
                value={carrierFlow}
                onChange={(e) => setCarrierFlow(parseFloat(e.target.value) || 0.5)}
                type="number"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={doQuickRun} 
                disabled={loading}
                size="large"
                sx={{ mt: 2 }}
              >
                {loading ? 'Generating Chromatogram...' : 'Generate Chromatogram'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {run && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total Peaks</Typography>
                  <Typography variant="h6">{run.analysis_results.total_peaks}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Resolution</Typography>
                  <Typography variant="h6">{run.analysis_results.resolution.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Efficiency</Typography>
                  <Typography variant="h6">{Math.round(run.analysis_results.efficiency).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">S/N Ratio</Typography>
                  <Typography variant="h6">{run.analysis_results.signal_to_noise.toFixed(1)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detected Peaks
              </Typography>
              <Grid container spacing={1}>
                {run.peaks.map((peak, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Chip
                      label={`${peak.name || `Peak ${index + 1}`}: ${peak.rt.toFixed(1)} min`}
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Chromatogram
          </Typography>
          <ChromatogramViewer 
            time={run.time} 
            signal={run.signal} 
            peaks={run.peaks} 
          />
        </Box>
      )}
    </Box>
  );
};

export default ChromatogramAnalysis; 