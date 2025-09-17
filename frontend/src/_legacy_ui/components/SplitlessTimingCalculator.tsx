import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Divider,
  LinearProgress,
  Chip,
} from '@mui/material';
import { 
  Timer, 
  Science,
  Thermostat,
  CheckCircle,
  Warning,
  TrendingUp,
  Opacity
} from '@mui/icons-material';
import { calculateSplitlessTiming, SplitlessTimingInput, SplitlessTimingOutput } from '../services/api';

type SolventType = 'Methanol' | 'Acetonitrile' | 'Hexane' | 'Dichloromethane' | 'Ethyl Acetate' | 'Acetone';

export const SplitlessTimingCalculator: React.FC = () => {
  // Input states
  const [solvent, setSolvent] = useState<SolventType>('Hexane');
  const [columnTemp, setColumnTemp] = useState<number>(50);
  const [inletTemp, setInletTemp] = useState<number>(250);
  const [linerVolume, setLinerVolume] = useState<number>(900);
  const [columnFlow, setColumnFlow] = useState<number>(1.2);
  
  // Results and UI states
  const [results, setResults] = useState<SplitlessTimingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solvent properties for display
  const solventProperties = {
    'Methanol': { bp: 64.7, color: '#FF6B6B', volatility: 'High' },
    'Acetonitrile': { bp: 82.0, color: '#4ECDC4', volatility: 'Medium' },
    'Hexane': { bp: 69.0, color: '#45B7D1', volatility: 'High' },
    'Dichloromethane': { bp: 39.6, color: '#96CEB4', volatility: 'Very High' },
    'Ethyl Acetate': { bp: 77.1, color: '#FFEAA7', volatility: 'Medium' },
    'Acetone': { bp: 56.0, color: '#DDA0DD', volatility: 'High' }
  };

  // Real-time calculation with debounce
  useEffect(() => {
    const calculate = async () => {
      if (columnTemp <= 0 || inletTemp <= 0 || linerVolume <= 0 || columnFlow <= 0) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const input: SplitlessTimingInput = {
          solvent,
          column_temp_c: columnTemp,
          inlet_temp_c: inletTemp,
          liner_volume_ul: linerVolume,
          column_flow_ml_min: columnFlow
        };

        const response = await calculateSplitlessTiming(input);
        setResults(response);
      } catch (err) {
        console.error('Splitless timing calculation error:', err);
        setError(err instanceof Error ? err.message : 'Calculation failed');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(calculate, 500);
    return () => clearTimeout(timer);
  }, [solvent, columnTemp, inletTemp, linerVolume, columnFlow]);

  const getFocusingColor = (focusing: boolean) => {
    return focusing ? 'success' : 'warning';
  };

  const getFocusingIcon = (focusing: boolean) => {
    return focusing ? <CheckCircle /> : <Warning />;
  };

  const getTimingRecommendation = (time: number) => {
    if (time < 30) return { level: 'Very Fast', color: 'error', note: 'May be too short for complete solvent removal' };
    if (time < 60) return { level: 'Fast', color: 'warning', note: 'Good for volatile compounds' };
    if (time < 120) return { level: 'Optimal', color: 'success', note: 'Balanced for most applications' };
    if (time < 180) return { level: 'Slow', color: 'warning', note: 'Good for trace analysis' };
    return { level: 'Very Slow', color: 'error', note: 'May cause peak broadening' };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Timer /> Splitless Injection Timing Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate optimal splitless time for trace analysis. Critical for achieving maximum sensitivity 
        while ensuring complete solvent removal and proper analyte focusing.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Controls */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Science /> Injection Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Solvent</InputLabel>
                    <Select
                      value={solvent}
                      onChange={(e) => setSolvent(e.target.value as SolventType)}
                      label="Solvent"
                    >
                      {Object.entries(solventProperties).map(([name, props]) => (
                        <MenuItem key={name} value={name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                bgcolor: props.color 
                              }} 
                            />
                            {name} (BP: {props.bp}°C)
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Volatility: {solventProperties[solvent].volatility}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Initial Column Temperature (°C)"
                    type="number"
                    value={columnTemp}
                    onChange={(e) => setColumnTemp(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 30, max: 400, step: 5 }}
                    helperText="30-400°C (initial oven temp)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Inlet Temperature (°C)"
                    type="number"
                    value={inletTemp}
                    onChange={(e) => setInletTemp(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 150, max: 450, step: 5 }}
                    helperText="150-450°C (injector temp)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Liner Volume (μL)"
                    type="number"
                    value={linerVolume}
                    onChange={(e) => setLinerVolume(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 200, max: 2000, step: 50 }}
                    helperText="200-2000 μL"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Column Flow Rate (mL/min)"
                    type="number"
                    value={columnFlow}
                    onChange={(e) => setColumnFlow(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 0.1, max: 10.0, step: 0.1 }}
                    helperText="0.1-10.0 mL/min"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Display */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Splitless Time Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {results && (
                <Grid container spacing={2}>
                  {/* Main Timing Result */}
                  <Grid item xs={12}>
                    {(() => {
                      const timing = getTimingRecommendation(results.recommended_splitless_time_s);
                      return (
                        <Paper sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          bgcolor: `${timing.color}.light`, 
                          color: 'white',
                          mb: 2
                        }}>
                          <Timer sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h3" gutterBottom>
                            {results.recommended_splitless_time_s}s
                          </Typography>
                          <Typography variant="h6" gutterBottom>
                            Recommended Splitless Time
                          </Typography>
                          <Chip 
                            label={timing.level} 
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        </Paper>
                      );
                    })()}
                  </Grid>

                  {/* Solvent Focusing Assessment */}
                  <Grid item xs={12}>
                    <Alert 
                      severity={getFocusingColor(results.solvent_focusing)} 
                      icon={getFocusingIcon(results.solvent_focusing)}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Solvent Focusing Assessment
                      </Typography>
                      <Typography variant="body2">
                        {results.focusing_assessment}
                      </Typography>
                    </Alert>
                  </Grid>

                  {/* Technical Details */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                        <Opacity />
                        <Typography variant="caption" display="block">Vapor Volume</Typography>
                        <Typography variant="h6">{results.vapor_volume_ml_per_ul} mL/μL</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                        <Science />
                        <Typography variant="caption" display="block">Sweep Volume</Typography>
                        <Typography variant="h6">{results.total_sweep_volume_ml} mL</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                        <Thermostat />
                        <Typography variant="caption" display="block">Solvent BP</Typography>
                        <Typography variant="h6">{solventProperties[solvent].bp}°C</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                        <Timer />
                        <Typography variant="caption" display="block">Temp Difference</Typography>
                        <Typography variant="h6">{inletTemp - columnTemp}°C</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  {/* Optimization Tips */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Optimization Tips
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Recommended Range:</strong> {results.optimization_tip}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>For Better Focusing:</strong><br />
                            • Increase inlet temperature<br />
                            • Decrease initial oven temp<br />
                            • Use lower volatility solvent
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>For Faster Analysis:</strong><br />
                            • Increase column flow<br />
                            • Use smaller liner volume<br />
                            • Optimize temperature program
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>For Trace Analysis:</strong><br />
                            • Extend splitless time<br />
                            • Ensure complete focusing<br />
                            • Use large injection volumes
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {!results && !loading && !error && (
                <Alert severity="info">
                  Adjust injection parameters to calculate optimal splitless timing
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Theory and Best Practices */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Typography variant="h6" gutterBottom>
            Splitless Injection Theory
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Solvent Focusing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analytes concentrate at the column head when solvent condenses. 
                Requires column temperature below solvent boiling point.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Splitless Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time needed to sweep 2-3 liner volumes through the column. 
                Too short = incomplete transfer; too long = peak broadening.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Critical Factors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Liner volume, column flow, solvent properties, and temperature 
                difference between inlet and column.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};
