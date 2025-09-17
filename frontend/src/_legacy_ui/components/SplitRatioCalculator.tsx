import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Slider,
  TextField,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Science, Speed, TrendingUp, Info as InfoIcon } from '@mui/icons-material';
import { calculateSplitRatio, SplitRatioOutput } from '../services/api';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useBulletproofLogger, withBulletproofLogging } from '../utils/bulletproofLogger';

interface SplitRatioCalculatorProps {
  teachingMode?: boolean;
}

const SplitRatioCalculatorComponent: React.FC<SplitRatioCalculatorProps> = ({ teachingMode = false }) => {
  // =================== BULLETPROOF LOGGING ===================
  const logger = useBulletproofLogger('SplitRatioCalculator');
  
  const { values, updateField, clearSaved } = useFormPersistence({
    splitRatio: 50,
    columnFlow: 1.0,
    carrierGas: 'Helium',
    inletTemp: 250,
    inletPressure: 25
  }, {
    storageKey: 'split-ratio-calc',
    debounceMs: 500
  });

  const [results, setResults] = useState<SplitRatioOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =================== BULLETPROOF INITIALIZATION ===================
  useEffect(() => {
    logger.info('Component initialized', { 
      teachingMode, 
      initialValues: values 
    });
  }, []);

  // =================== BULLETPROOF CALCULATION ===================
  const calculate = useCallback(async () => {
    if (values.columnFlow <= 0) {
      logger.warn('Skipping calculation - invalid column flow', { columnFlow: values.columnFlow });
      return;
    }
    
    const timerId = logger.startTimer();
    logger.info('Starting split ratio calculation', { values });
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateSplitRatio({
        split_ratio: values.splitRatio,
        column_flow_rate: values.columnFlow,
        carrier_gas: values.carrierGas as "Helium" | "Hydrogen" | "Nitrogen",
      }, teachingMode);
      
      setResults(result);
      logger.info('Calculation completed successfully', { result });
      logger.trackCacheHit(); // API call succeeded
      
    } catch (err: any) {
      const errorMsg = 'Unable to connect to calculation service. Please ensure the backend is running.';
      setError(errorMsg);
      logger.error('Calculation failed', { 
        error: errorMsg, 
        values, 
        teachingMode,
        stack: err instanceof Error ? err.stack : String(err)
      });
      logger.trackCacheMiss(); // API call failed
      
    } finally {
      setLoading(false);
      logger.endTimer(timerId, 'calculation');
    }
  }, [values.splitRatio, values.columnFlow, values.carrierGas, teachingMode, logger]);

  useEffect(() => {
    const debounceTimer = setTimeout(calculate, 300);
    return () => clearTimeout(debounceTimer);
  }, [calculate]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Science /> Split Ratio Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate optimal GC inlet split parameters for your analytical method. 
        Adjust the split ratio and column flow rate to determine total inlet flow requirements.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Controls */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Method Parameters
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom variant="body2" color="text.secondary">
                  Split Ratio
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  1:{values.splitRatio}
                </Typography>
                <Slider
                  value={values.splitRatio}
                  onChange={(_, value) => updateField('splitRatio', value as number)}
                  min={10}
                  max={500}
                  step={10}
                  marks={[
                    { value: 10, label: '1:10' },
                    { value: 100, label: '1:100' },
                    { value: 250, label: '1:250' },
                    { value: 500, label: '1:500' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `1:${value}`}
                  sx={{ mt: 2 }}
                />
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  label="Column Flow Rate (mL/min)"
                  type="number"
                  value={values.columnFlow}
                  onChange={(e) => updateField('columnFlow', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                  helperText="Typical range: 0.5 - 2.0 mL/min"
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Carrier Gas</InputLabel>
                  <Select
                    value={values.carrierGas}
                    onChange={(e) => updateField('carrierGas', e.target.value)}
                    label="Carrier Gas"
                  >
                    <MenuItem value="Helium">Helium</MenuItem>
                    <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                    <MenuItem value="Nitrogen">Nitrogen</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Button onClick={clearSaved} size="small" variant="outlined">
                  Clear Form
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Results Display */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Calculated Flow Rates
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {loading && <LinearProgress />}
              
              {results && !loading && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                        <Typography variant="overline" sx={{ opacity: 0.9 }}>
                          Configuration
                        </Typography>
                        <Typography variant="h4">
                          {results.actual_split_ratio}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }} variant="outlined">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Speed color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Total Inlet Flow
                            </Typography>
                            <Typography variant="h6">
                              {results.total_inlet_flow} ± {results.uncertainty || 0.5} mL/min
                              {results.uncertainty && (
                                <Tooltip title="95% confidence interval, k=2">
                                  <InfoIcon fontSize="small" sx={{ ml: 0.5 }} />
                                </Tooltip>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }} variant="outlined">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp color="primary" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Split Vent Flow
                            </Typography>
                            <Typography variant="h6">
                              {results.split_vent_flow} mL/min
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }} variant="outlined">
                        <Typography variant="body2" color="text.secondary">
                          Septum Purge Flow
                        </Typography>
                        <Typography variant="h6">
                          {results.septum_purge_flow} mL/min
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.paper' }} variant="outlined">
                        <Typography variant="body2" color="text.secondary">
                          Column Flow
                        </Typography>
                        <Typography variant="h6">
                          {results.column_flow_rate} mL/min
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Method Efficiency
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={results.efficiency_score}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'grey.300',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getEfficiencyColor(results.efficiency_score),
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {results.efficiency_score}% - 
                      {results.efficiency_score >= 90 ? ' Optimal for most analyses' : 
                       results.efficiency_score >= 80 ? ' Good for trace analysis' : ' Consider optimization'}
                    </Typography>
                  </Box>
                  
                  {/* Expert Explanation Section */}
                  {teachingMode && results?.explanation && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Expert Analysis
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }} variant="outlined">
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                          {results.explanation}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }} variant="outlined">
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> These calculations follow standard GC inlet design principles. 
            The septum purge flow is maintained at 3.0 mL/min per manufacturer specifications. 
            Optimal split ratios typically range from 1:20 to 1:100 for most analytical applications.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

// =================== BULLETPROOF EXPORT ===================
export const SplitRatioCalculator = withBulletproofLogging(
  SplitRatioCalculatorComponent,
  'SplitRatioCalculator'
);
