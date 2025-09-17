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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { 
  Warning, 
  CheckCircle, 
  Speed,
  Thermostat,
  Security,
  Info
} from '@mui/icons-material';
import { calculatePressureDrop, PressureDropInput, PressureDropOutput } from '../services/api';

export const PressureDropCalculator: React.FC = () => {
  // Input states
  const [length, setLength] = useState<number>(30);
  const [diameter, setDiameter] = useState<number>(0.25);
  const [flow, setFlow] = useState<number>(1.2);
  const [temperature, setTemperature] = useState<number>(100);
  const [carrier, setCarrier] = useState<'Helium' | 'Hydrogen' | 'Nitrogen'>('Helium');
  const [isPackedColumn, setIsPackedColumn] = useState<boolean>(false);
  const [particleSize, setParticleSize] = useState<number>(100);
  
  // Results and UI states
  const [results, setResults] = useState<PressureDropOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time calculation with debounce
  useEffect(() => {
    const calculate = async () => {
      if (length <= 0 || diameter <= 0 || flow <= 0 || temperature <= 0) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const input: PressureDropInput = {
          length_m: length,
          id_mm: diameter,
          flow_ml_min: flow,
          temperature_c: temperature,
          carrier_gas: carrier,
          particle_size_um: isPackedColumn ? particleSize : undefined
        };

        const response = await calculatePressureDrop(input);
        setResults(response);
      } catch (err) {
        console.error('Pressure drop calculation error:', err);
        setError(err instanceof Error ? err.message : 'Calculation failed');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(calculate, 500);
    return () => clearTimeout(timer);
  }, [length, diameter, flow, temperature, carrier, isPackedColumn, particleSize]);

  const getSafetyColor = (safe: boolean) => {
    return safe ? 'success' : 'error';
  };

  const getSafetyIcon = (safe: boolean) => {
    return safe ? <CheckCircle /> : <Warning />;
  };

  const getPressureLevel = (pressure: number, maxPressure: number) => {
    const percentage = (pressure / maxPressure) * 100;
    if (percentage < 60) return { level: 'Low', color: 'success' };
    if (percentage < 85) return { level: 'Medium', color: 'warning' };
    return { level: 'High', color: 'error' };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Security /> Pressure Drop Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate pressure drop across GC columns using Hagen-Poiseuille equation (capillary) or 
        Darcy's law (packed). Critical for method safety and instrument protection.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Controls */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed /> Column & Method Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPackedColumn}
                        onChange={(e) => setIsPackedColumn(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Packed Column"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {isPackedColumn ? 'Using Darcy\'s law' : 'Using Hagen-Poiseuille equation'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Length (m)"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 1, max: 100, step: 0.5 }}
                    helperText="1-100 meters"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Inner Diameter (mm)"
                    type="number"
                    value={diameter}
                    onChange={(e) => setDiameter(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 0.1, max: 5.0, step: 0.05 }}
                    helperText="0.1-5.0 mm"
                  />
                </Grid>
                
                {isPackedColumn && (
                  <Grid item xs={12}>
                    <TextField
                      label="Particle Size (μm)"
                      type="number"
                      value={particleSize}
                      onChange={(e) => setParticleSize(parseFloat(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ min: 1, max: 500, step: 1 }}
                      helperText="1-500 μm"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    label="Flow Rate (mL/min)"
                    type="number"
                    value={flow}
                    onChange={(e) => setFlow(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 0.1, max: 20.0, step: 0.1 }}
                    helperText="0.1-20.0 mL/min"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Temperature (°C)"
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ min: 30, max: 400, step: 5 }}
                    helperText="30-400°C"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Carrier Gas</InputLabel>
                    <Select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value as 'Helium' | 'Hydrogen' | 'Nitrogen')}
                      label="Carrier Gas"
                    >
                      <MenuItem value="Helium">Helium</MenuItem>
                      <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                      <MenuItem value="Nitrogen">Nitrogen</MenuItem>
                    </Select>
                  </FormControl>
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
                <Security /> Pressure Analysis & Safety Check
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
                  {/* Safety Status */}
                  <Grid item xs={12}>
                    <Alert 
                      severity={getSafetyColor(results.safe)} 
                      icon={getSafetyIcon(results.safe)}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2">
                        {results.safe ? 'SAFE OPERATING CONDITIONS' : 'UNSAFE PRESSURE DETECTED'}
                      </Typography>
                      <Typography variant="body2">
                        {results.safe 
                          ? 'Column pressure is within safe operating limits' 
                          : results.warning || 'Pressure exceeds column specifications'
                        }
                      </Typography>
                    </Alert>
                  </Grid>

                  {/* Key Pressure Metrics */}
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Speed />
                      <Typography variant="caption" display="block">Pressure Drop</Typography>
                      <Typography variant="h6">{results.pressure_drop_psi} psi</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      bgcolor: `${getSafetyColor(results.safe)}.light`, 
                      color: 'white' 
                    }}>
                      <Security />
                      <Typography variant="caption" display="block">Inlet Pressure</Typography>
                      <Typography variant="h6">{results.inlet_pressure_required_psi} psi</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Thermostat />
                      <Typography variant="caption" display="block">Gas Viscosity</Typography>
                      <Typography variant="h6">{results.viscosity_micropoise} μP</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                      <Warning />
                      <Typography variant="caption" display="block">Max Safe</Typography>
                      <Typography variant="h6">{results.max_recommended_psi} psi</Typography>
                    </Paper>
                  </Grid>
                  
                  {/* Pressure Level Indicator */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Pressure Level Analysis
                      </Typography>
                      
                      {(() => {
                        const pressureLevel = getPressureLevel(results.inlet_pressure_required_psi, results.max_recommended_psi);
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Operating Level:
                            </Typography>
                            <Alert severity={pressureLevel.color as any} variant="outlined" sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle2">
                                {pressureLevel.level} ({Math.round((results.inlet_pressure_required_psi / results.max_recommended_psi) * 100)}% of maximum)
                              </Typography>
                            </Alert>
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Grid>
                  
                  {/* Technical Details */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Technical Details
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Calculation Method:</strong><br />
                            {isPackedColumn ? 'Darcy\'s Law (Packed Column)' : 'Hagen-Poiseuille (Capillary)'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Column Type:</strong><br />
                            {diameter <= 0.53 ? 'Capillary' : 'Wide-bore'} ({diameter}mm ID)
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Pressure Safety Factor:</strong><br />
                            {((results.max_recommended_psi - results.inlet_pressure_required_psi) / results.max_recommended_psi * 100).toFixed(1)}% margin
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {!results && !loading && !error && (
                <Alert severity="info" icon={<Info />}>
                  Adjust column parameters to calculate pressure drop and safety limits
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Safety Guidelines */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Typography variant="h6" gutterBottom color="error">
            ⚠️ Safety Guidelines
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Capillary Columns (≤0.53mm)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum: 100 psi. Higher pressures can cause column bleed, 
                stationary phase stripping, or permanent damage.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Wide-Bore Columns (&gt;0.53mm)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum: 60 psi. Lower pressure tolerance due to larger diameter 
                and different construction materials.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Pressure Reduction Tips
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Reduce flow rate • Increase temperature • Use shorter column • 
                Switch to lower-viscosity carrier gas (H2 &lt; He &lt; N2)
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};
