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
} from '@mui/material';
import { 
  Speed, 
  Timer, 
  Warning, 
  CheckCircle, 
  TrendingUp, 
  Science,
  Straighten
} from '@mui/icons-material';
import { calculateColumnParameters, ColumnParametersInput, ColumnParametersOutput } from '../services/api';

export const ColumnCalculator: React.FC = () => {
  // Input states
  const [length, setLength] = useState<number>(30);
  const [diameter, setDiameter] = useState<number>(0.25);
  const [flow, setFlow] = useState<number>(1.2);
  const [temperature, setTemperature] = useState<number>(100);
  const [carrier, setCarrier] = useState<'Helium' | 'Hydrogen' | 'Nitrogen'>('Helium');
  
  // Results and UI states
  const [results, setResults] = useState<ColumnParametersOutput | null>(null);
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
        const input: ColumnParametersInput = {
          length_m: length,
          id_mm: diameter,
          flow_ml_min: flow,
          temperature_c: temperature,
          carrier_gas: carrier
        };

        const response = await calculateColumnParameters(input);
        setResults(response);
      } catch (err) {
        console.error('Column calculation error:', err);
        setError(err instanceof Error ? err.message : 'Calculation failed');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(calculate, 500);
    return () => clearTimeout(timer);
  }, [length, diameter, flow, temperature, carrier]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 70) return 'warning';
    return 'error';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 90) return <CheckCircle />;
    if (efficiency >= 70) return <Warning />;
    return <Warning />;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Science /> Column Performance Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate real column parameters using van Deemter optimization. 
        Get linear velocity, void time, theoretical plates, and optimization recommendations.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Controls */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Straighten /> Column Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
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
                <TrendingUp /> Real-Time Results
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
                  {/* Key Metrics */}
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Speed />
                      <Typography variant="caption" display="block">Linear Velocity</Typography>
                      <Typography variant="h6">{results.linear_velocity_cm_s} cm/s</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Timer />
                      <Typography variant="caption" display="block">Void Time</Typography>
                      <Typography variant="h6">{results.void_time_min} min</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                      <Science />
                      <Typography variant="caption" display="block">Theoretical Plates</Typography>
                      <Typography variant="h6">{results.current_plates.toLocaleString()}</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      bgcolor: `${getEfficiencyColor(results.efficiency_percent)}.light`, 
                      color: 'white' 
                    }}>
                      {getEfficiencyIcon(results.efficiency_percent)}
                      <Typography variant="caption" display="block">Efficiency</Typography>
                      <Typography variant="h6">{results.efficiency_percent}%</Typography>
                    </Paper>
                  </Grid>
                  
                  {/* Detailed Results */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Optimization Analysis
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Void Volume: <strong>{results.void_volume_ml} mL</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Optimal Flow: <strong>{results.optimal_flow_ml_min} mL/min</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Max Plates: <strong>{results.optimal_plates.toLocaleString()}</strong>
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Recommendation */}
                  <Grid item xs={12}>
                    {results.recommendation !== "Optimal" ? (
                      <Alert 
                        severity="warning" 
                        sx={{ mt: 2 }}
                        icon={<TrendingUp />}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Optimization Recommendation
                        </Typography>
                        <Typography variant="body2">
                          {results.recommendation}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert 
                        severity="success" 
                        sx={{ mt: 2 }}
                        icon={<CheckCircle />}
                      >
                        <Typography variant="subtitle2">
                          Your column is operating at optimal conditions!
                        </Typography>
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              )}
              
              {!results && !loading && !error && (
                <Alert severity="info">
                  Adjust column parameters above to see real-time calculations
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Educational Information */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Typography variant="h6" gutterBottom>
            Understanding Column Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Linear Velocity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The speed at which the mobile phase travels through the column. 
                Optimal velocity balances resolution and analysis time.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Theoretical Plates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A measure of column efficiency. More plates = better separation.
                Calculated using van Deemter equation principles.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary">
                Void Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time for an unretained compound to travel through the column.
                Essential for calculating retention factors.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};
