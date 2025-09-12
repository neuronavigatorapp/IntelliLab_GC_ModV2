import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Science,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Save,
  Upload,
  Download,
  LibraryBooks,
  SaveAs,
} from '@mui/icons-material';
import TemplateSelector from '../../Templates/TemplateSelector';
import TemplateSaveDialog from '../../Templates/TemplateSaveDialog';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../store';
import { InletSimulationRequest, InletSimulationResponse } from '../../../types';
import { calculationsAPI } from '../../../services/apiService';
import { toast } from 'react-hot-toast';
import Plot from 'react-plotly.js';

// Validation schema
const schema = yup.object().shape({
  inlet_temp: yup.number().min(50).max(400).required(),
  split_ratio: yup.number().min(1).max(1000).required(),
  injection_volume: yup.number().min(0.1).max(10).required(),
  liner_type: yup.string().required(),
  injection_mode: yup.string().required(),
  carrier_gas: yup.string().required(),
  carrier_flow_rate: yup.number().min(0.1).max(10).required(),
  septum_purge: yup.number().min(0).max(10).required(),
  instrument_age: yup.number().min(0).max(50).required(),
  maintenance_level: yup.string().required(),
  vacuum_integrity: yup.number().min(0).max(100).required(),
  septum_condition: yup.string().required(),
  liner_condition: yup.string().required(),
});

const InletSimulator: React.FC = () => {
  const dispatch = useAppDispatch();
  const [result, setResult] = useState<InletSimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [templateSaveDialogOpen, setTemplateSaveDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<InletSimulationRequest>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      inlet_temp: 250,
      split_ratio: 50,
      injection_volume: 1.0,
      liner_type: 'Split Liner',
      injection_mode: 'Split',
      carrier_gas: 'Helium',
      carrier_flow_rate: 1.0,
      septum_purge: 3.0,
      instrument_age: 5,
      maintenance_level: 'Good',
      vacuum_integrity: 95,
      septum_condition: 'Good',
      liner_condition: 'Clean',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await calculationsAPI.inletSimulation(data);
      setResult(response.data);
      toast.success('Simulation completed successfully');
    } catch (error) {
      toast.error('Failed to run simulation');
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle />;
    if (score >= 0.6) return <Warning />;
    return <Error />;
  };

  const mockChartData = [
    {
      x: [0, 1, 2, 3, 4, 5],
      y: [0, 85, 92, 88, 95, 90],
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Transfer Efficiency',
      line: { color: '#1976d2', width: 3 },
      marker: { size: 8 },
    },
  ];

  const mockChartLayout = {
    title: 'Inlet Performance Profile',
    xaxis: { title: 'Time (min)' },
    yaxis: { title: 'Efficiency (%)' },
    height: 300,
    margin: { l: 50, r: 50, t: 50, b: 50 },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Inlet Simulator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Optimize your GC inlet parameters for maximum performance and efficiency
      </Typography>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inlet Parameters
              </Typography>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  {/* Temperature */}
                  <Grid item xs={12}>
                    <Typography gutterBottom>Inlet Temperature (°C)</Typography>
                    <Controller
                      name="inlet_temp"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          {...field}
                          min={50}
                          max={400}
                          step={5}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: 50, label: '50°C' },
                            { value: 200, label: '200°C' },
                            { value: 400, label: '400°C' },
                          ]}
                        />
                      )}
                    />
                    <Typography variant="caption" color="error">
                      {errors.inlet_temp?.message}
                    </Typography>
                  </Grid>

                  {/* Split Ratio */}
                  <Grid item xs={12}>
                    <Typography gutterBottom>Split Ratio</Typography>
                    <Controller
                      name="split_ratio"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          {...field}
                          min={1}
                          max={1000}
                          step={1}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: 1, label: '1:1' },
                            { value: 100, label: '100:1' },
                            { value: 1000, label: '1000:1' },
                          ]}
                        />
                      )}
                    />
                    <Typography variant="caption" color="error">
                      {errors.split_ratio?.message}
                    </Typography>
                  </Grid>

                  {/* Injection Volume */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="injection_volume"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Injection Volume (μL)"
                          type="number"
                          fullWidth
                          error={!!errors.injection_volume}
                          helperText={errors.injection_volume?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Liner Type */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="liner_type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.liner_type}>
                          <InputLabel>Liner Type</InputLabel>
                          <Select {...field} label="Liner Type">
                            <MenuItem value="Split Liner">Split Liner</MenuItem>
                            <MenuItem value="Splitless Liner">Splitless Liner</MenuItem>
                            <MenuItem value="Direct Liner">Direct Liner</MenuItem>
                            <MenuItem value="Purged Packed Liner">Purged Packed Liner</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Injection Mode */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="injection_mode"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.injection_mode}>
                          <InputLabel>Injection Mode</InputLabel>
                          <Select {...field} label="Injection Mode">
                            <MenuItem value="Split">Split</MenuItem>
                            <MenuItem value="Splitless">Splitless</MenuItem>
                            <MenuItem value="Direct">Direct</MenuItem>
                            <MenuItem value="On-Column">On-Column</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Carrier Gas */}
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="carrier_gas"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.carrier_gas}>
                          <InputLabel>Carrier Gas</InputLabel>
                          <Select {...field} label="Carrier Gas">
                            <MenuItem value="Helium">Helium</MenuItem>
                            <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                            <MenuItem value="Nitrogen">Nitrogen</MenuItem>
                            <MenuItem value="Argon">Argon</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Advanced Settings */}
                  <Grid item xs={12}>
                    <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>Advanced Settings</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="carrier_flow_rate"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Carrier Flow Rate (mL/min)"
                                  type="number"
                                  fullWidth
                                  error={!!errors.carrier_flow_rate}
                                  helperText={errors.carrier_flow_rate?.message}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="septum_purge"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Septum Purge (mL/min)"
                                  type="number"
                                  fullWidth
                                  error={!!errors.septum_purge}
                                  helperText={errors.septum_purge?.message}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="instrument_age"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Instrument Age (years)"
                                  type="number"
                                  fullWidth
                                  error={!!errors.instrument_age}
                                  helperText={errors.instrument_age?.message}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name="vacuum_integrity"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Vacuum Integrity (%)"
                                  type="number"
                                  fullWidth
                                  error={!!errors.vacuum_integrity}
                                  helperText={errors.vacuum_integrity?.message}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                      startIcon={<Science />}
                    >
                      {loading ? 'Running Simulation...' : 'Run Simulation'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Simulation Results
              </Typography>

              {loading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Calculating optimization parameters...
                  </Typography>
                </Box>
              )}

              {result && (
                <Box>
                  {/* Score */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ color: getScoreColor(result.optimization_score) }}>
                      {(result.optimization_score * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Optimization Score
                    </Typography>
                  </Box>

                  {/* Metrics */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {result.transfer_efficiency.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Transfer Efficiency
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {result.discrimination_factor.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Discrimination Factor
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {result.peak_shape_index.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Peak Shape Index
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Recommendations
                      </Typography>
                      {result.recommendations.map((rec, index) => (
                        <Alert key={index} severity="info" sx={{ mb: 1 }}>
                          {rec}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<LibraryBooks />}
                      onClick={() => setTemplateSelectorOpen(true)}
                      sx={{ flex: 1, minWidth: 150 }}
                    >
                      Load Template
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SaveAs />}
                      onClick={() => setTemplateSaveDialogOpen(true)}
                      sx={{ flex: 1, minWidth: 150 }}
                    >
                      Save as Template
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      sx={{ flex: 1, minWidth: 120 }}
                    >
                      Save Method
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                      sx={{ flex: 1, minWidth: 100 }}
                    >
                      Export
                    </Button>
                  </Box>
                </Box>
              )}

              {!result && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Science sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Results Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure your parameters and run a simulation to see results
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Profile
              </Typography>
              <Plot
                data={mockChartData}
                layout={mockChartLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Template Dialogs */}
      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
        toolType="inlet_simulator"
        title="Select Inlet Simulator Template"
      />
      
      <TemplateSaveDialog
        open={templateSaveDialogOpen}
        onClose={() => setTemplateSaveDialogOpen(false)}
        onSave={handleTemplateSave}
        toolType="inlet_simulator"
        parameters={getCurrentParameters()}
        currentMethodName={`Inlet Method ${new Date().toLocaleDateString()}`}
      />
    </Box>
  );
  
  // Template handling functions
  function handleTemplateSelect(template: any) {
    try {
      // Load template parameters into the form
      const params = template.parameters;
      
      // Reset form with template values
      reset({
        inlet_temp: params.injection_temperature || 250,
        split_ratio: params.split_ratio || 10,
        injection_volume: params.injection_volume || 1.0,
        liner_type: params.liner_type || 'split',
        injection_mode: params.injection_mode || 'manual',
        carrier_gas: params.carrier_gas || 'helium',
        carrier_flow: params.carrier_flow || 1.5,
        inlet_pressure: params.inlet_pressure || 10,
        purge_flow: params.purge_flow || 50,
        total_flow: params.total_flow || 60,
        oven_temperature: params.oven_temperature || 50,
        septum_condition: params.septum_condition || 'good',
        liner_condition: params.liner_condition || 'clean'
      });
      
      // Store current analysis data for potential report generation
      sessionStorage.setItem('currentAnalysisData', JSON.stringify({
        tool_type: 'inlet_simulator',
        template_name: template.name,
        parameters: params
      }));
      
      toast.success(`Template "${template.name}" loaded successfully`);
    } catch (error) {
      toast.error('Failed to load template');
    }
  }
  
  function handleTemplateSave() {
    toast.success('Template saved successfully');
  }
  
  function getCurrentParameters() {
    const currentValues = getValues();
    return {
      injection_temperature: currentValues.inlet_temp,
      split_ratio: currentValues.split_ratio,
      injection_volume: currentValues.injection_volume,
      liner_type: currentValues.liner_type,
      injection_mode: currentValues.injection_mode,
      carrier_gas: currentValues.carrier_gas,
      carrier_flow: currentValues.carrier_flow,
      inlet_pressure: currentValues.inlet_pressure,
      purge_flow: currentValues.purge_flow,
      total_flow: currentValues.total_flow,
      oven_temperature: currentValues.oven_temperature,
      septum_condition: currentValues.septum_condition,
      liner_condition: currentValues.liner_condition
    };
  }
};

export default InletSimulator; 