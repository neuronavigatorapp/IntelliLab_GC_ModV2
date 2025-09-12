import React, { useState, useEffect, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  LibraryBooks,
  SaveAs,
  Download,
  AutoFixHigh,
  Visibility,
  Settings,
  Assessment,
  Timeline,
  Compare,
  FileDownload,
  Refresh,
  Info,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../store';
import { DetectionLimitRequest, DetectionLimitResponse } from '../../../types';
import { calculationsAPI } from '../../../services/apiService';
import { toast } from 'react-hot-toast';
import Plot from 'react-plotly.js';
import TemplateSelector from '../../Templates/TemplateSelector';
import TemplateSaveDialog from '../../Templates/TemplateSaveDialog';

// Validation schema
const schema = yup.object().shape({
  detector_type: yup.string().required(),
  carrier_gas: yup.string().required(),
  column_type: yup.string().required(),
  injector_temp: yup.number().min(50).max(400).required(),
  detector_temp: yup.number().min(50).max(400).required(),
  oven_temp: yup.number().min(30).max(350).required(),
  flow_rate: yup.number().min(0.1).max(10).required(),
  split_ratio: yup.number().min(1).max(1000).required(),
  injection_volume: yup.number().min(0.1).max(10).required(),
  sample_concentration: yup.number().min(0.1).max(10000).required(),
  h2_flow: yup.number().min(0).max(100).required(),
  air_flow: yup.number().min(0).max(1000).required(),
  makeup_flow: yup.number().min(0).max(100).required(),
  target_compound: yup.string().required(),
  instrument_age: yup.number().min(0).max(50).required(),
  maintenance_level: yup.string().required(),
  detector_calibration: yup.string().required(),
  column_condition: yup.string().required(),
  noise_level: yup.string().required(),
  sample_matrix: yup.string().required(),
  analysis_type: yup.string().required(),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detection-limit-tabpanel-${index}`}
      aria-labelledby={`detection-limit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DetectionLimitCalculator: React.FC = () => {
  const dispatch = useAppDispatch();
  const [result, setResult] = useState<DetectionLimitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
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
  } = useForm<DetectionLimitRequest>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      detector_type: 'FID',
      carrier_gas: 'Helium',
      column_type: 'PLOT Q',
      injector_temp: 250,
      detector_temp: 280,
      oven_temp: 40,
      flow_rate: 2.0,
      split_ratio: 20.0,
      injection_volume: 1.0,
      sample_concentration: 100.0,
      h2_flow: 40.0,
      air_flow: 400.0,
      makeup_flow: 25.0,
      target_compound: 'Methane',
      instrument_age: 5.0,
      maintenance_level: 'Good',
      detector_calibration: 'Good',
      column_condition: 'Good',
      noise_level: 'Low',
      sample_matrix: 'Light Hydrocarbon',
      analysis_type: 'Routine',
    },
  });

  const watchedValues = watch();

  const onSubmit = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to backend
      const response = await fetch('/api/v1/calculations/detection-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new globalThis.Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setResult(result);
      
      // Show success message
      toast.success('Detection limit calculated successfully!');
      
    } catch (error) {
      console.error('Calculation error:', error);
      setError('Failed to calculate detection limit. Please check your inputs and try again.');
      toast.error('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time calculation effect
  useEffect(() => {
    if (realTimeUpdates && Object.keys(watchedValues).length > 0) {
      const timeoutId = setTimeout(() => {
        handleSubmit(onSubmit)();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, realTimeUpdates, handleSubmit, onSubmit]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle />;
    if (score >= 0.6) return <Warning />;
    return <Error />;
  };

  const autoOptimize = useCallback(async () => {
    setLoading(true);
    try {
      // Apply optimized parameters
      setValue('carrier_gas', 'Hydrogen');
      setValue('split_ratio', 10.0);
      setValue('detector_temp', 280.0);
      setValue('flow_rate', 2.0);
      setValue('h2_flow', 40.0);
      setValue('air_flow', 400.0);
      setValue('injection_volume', 2.0);
      
      // Submit with optimized parameters
      const optimizedData = {
        ...watchedValues,
        carrier_gas: 'Hydrogen',
        split_ratio: 10.0,
        detector_temp: 280.0,
        flow_rate: 2.0,
        h2_flow: 40.0,
        air_flow: 400.0,
        injection_volume: 2.0,
      };
      
      const response = await calculationsAPI.detectionLimit(optimizedData);
      setResult(response.data);
      toast.success('Parameters automatically optimized for maximum sensitivity!');
    } catch (error) {
      toast.error('Failed to auto-optimize parameters');
      console.error('Auto-optimization error:', error);
    } finally {
      setLoading(false);
    }
  }, [watchedValues, setValue]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Chart data for visualization
  const getCalibrationCurveData = () => {
    if (!result?.calibration_curve) return [];
    
    return [
      {
        x: result.calibration_curve.concentrations,
        y: result.calibration_curve.responses,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Calibration Curve',
        line: { color: '#2196f3' },
        marker: { size: 8 }
      },
      {
        x: [result.calibration_curve.detection_limit_point],
        y: [result.calibration_curve.responses[0] * 0.3],
        type: 'scatter',
        mode: 'markers' as any, // TODO: Fix TypeScript mode prop type issue
        name: 'Detection Limit',
        marker: { 
          size: 12, 
          color: '#f44336',
          symbol: 'diamond'
        }
      }
    ];
  };

  const getOptimizationChartData = () => {
    if (!result?.optimization_potential) return [];
    
    const { current_dl, optimized_dl } = result.optimization_potential;
    
    return [
      {
        x: ['Current', 'Optimized'],
        y: [current_dl, optimized_dl],
        type: 'bar',
        marker: {
          color: ['#f44336', '#4caf50']
        },
        name: 'Detection Limit (ppm)',
      },
    ];
  };

  const steps = [
    {
      label: 'Detector Configuration',
      description: 'Select detector type and carrier gas',
    },
    {
      label: 'Temperature Settings',
      description: 'Configure injector, detector, and oven temperatures',
    },
    {
      label: 'Flow Parameters',
      description: 'Set carrier flow, split ratio, and detector flows',
    },
    {
      label: 'Sample Parameters',
      description: 'Define injection volume, concentration, and target compound',
    },
    {
      label: 'Instrument Condition',
      description: 'Specify instrument age, maintenance, and calibration status',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🎯 Detection Limit Calculator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Push beyond ASTM limits for maximum sensitivity and competitive advantage
      </Typography>

      <Grid container spacing={3}>
        {/* Multi-step Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🔧 Optimization Parameters
                </Typography>
                <Box>
                  <Tooltip title="Real-time updates">
                    <IconButton
                      onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                      color={realTimeUpdates ? 'primary' : 'default'}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Auto-optimize">
                    <IconButton onClick={autoOptimize} color="primary">
                      <AutoFixHigh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      }
                      onClick={() => handleStepClick(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <form onSubmit={handleSubmit(onSubmit)}>
                        {error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                          </Alert>
                        )}
                        {index === 0 && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="detector_type"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.detector_type}>
                                    <InputLabel>Detector Type</InputLabel>
                                    <Select {...field} label="Detector Type">
                                      <MenuItem value="FID">FID</MenuItem>
                                      <MenuItem value="TCD">TCD</MenuItem>
                                      <MenuItem value="SCD">SCD</MenuItem>
                                      <MenuItem value="MS">MS</MenuItem>
                                      <MenuItem value="PID">PID</MenuItem>
                                      <MenuItem value="ECD">ECD</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
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
                            <Grid item xs={12}>
                              <Controller
                                name="column_type"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Column Type"
                                    fullWidth
                                    error={!!errors.column_type}
                                    helperText={errors.column_type?.message}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}

                        {index === 1 && (
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography gutterBottom>Injector Temperature (°C)</Typography>
                              <Controller
                                name="injector_temp"
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
                                      { value: 250, label: '250°C' },
                                      { value: 400, label: '400°C' },
                                    ]}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Typography gutterBottom>Detector Temperature (°C)</Typography>
                              <Controller
                                name="detector_temp"
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
                                      { value: 280, label: '280°C' },
                                      { value: 400, label: '400°C' },
                                    ]}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Typography gutterBottom>Oven Temperature (°C)</Typography>
                              <Controller
                                name="oven_temp"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={30}
                                    max={350}
                                    step={5}
                                    valueLabelDisplay="auto"
                                    marks={[
                                      { value: 30, label: '30°C' },
                                      { value: 40, label: '40°C' },
                                      { value: 350, label: '350°C' },
                                    ]}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}

                        {index === 2 && (
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography gutterBottom>Carrier Flow Rate (mL/min)</Typography>
                              <Controller
                                name="flow_rate"
                                control={control}
                                render={({ field }) => (
                                  <Slider
                                    {...field}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    valueLabelDisplay="auto"
                                    marks={[
                                      { value: 0.1, label: '0.1' },
                                      { value: 2.0, label: '2.0' },
                                      { value: 10, label: '10' },
                                    ]}
                                  />
                                )}
                              />
                            </Grid>
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
                                      { value: 20, label: '20:1' },
                                      { value: 1000, label: '1000:1' },
                                    ]}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="h2_flow"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="H2 Flow (mL/min)"
                                    type="number"
                                    fullWidth
                                    error={!!errors.h2_flow}
                                    helperText={errors.h2_flow?.message}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="air_flow"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Air Flow (mL/min)"
                                    type="number"
                                    fullWidth
                                    error={!!errors.air_flow}
                                    helperText={errors.air_flow?.message}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Controller
                                name="makeup_flow"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Makeup Flow (mL/min)"
                                    type="number"
                                    fullWidth
                                    error={!!errors.makeup_flow}
                                    helperText={errors.makeup_flow?.message}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}

                        {index === 3 && (
                          <Grid container spacing={2}>
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
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="sample_concentration"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label="Sample Concentration (ppm)"
                                    type="number"
                                    fullWidth
                                    error={!!errors.sample_concentration}
                                    helperText={errors.sample_concentration?.message}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Controller
                                name="target_compound"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.target_compound}>
                                    <InputLabel>Target Compound</InputLabel>
                                    <Select {...field} label="Target Compound">
                                      <MenuItem value="Methane">Methane</MenuItem>
                                      <MenuItem value="Ethane">Ethane</MenuItem>
                                      <MenuItem value="Propane">Propane</MenuItem>
                                      <MenuItem value="Propylene">Propylene</MenuItem>
                                      <MenuItem value="Isobutane">Isobutane</MenuItem>
                                      <MenuItem value="n-Butane">n-Butane</MenuItem>
                                      <MenuItem value="H2S">H2S</MenuItem>
                                      <MenuItem value="Ethyl Mercaptan">Ethyl Mercaptan</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}

                        {index === 4 && (
                          <Grid container spacing={2}>
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
                                name="maintenance_level"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.maintenance_level}>
                                    <InputLabel>Maintenance Level</InputLabel>
                                    <Select {...field} label="Maintenance Level">
                                      <MenuItem value="Excellent">Excellent</MenuItem>
                                      <MenuItem value="Good">Good</MenuItem>
                                      <MenuItem value="Fair">Fair</MenuItem>
                                      <MenuItem value="Poor">Poor</MenuItem>
                                      <MenuItem value="Neglected">Neglected</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="detector_calibration"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.detector_calibration}>
                                    <InputLabel>Detector Calibration</InputLabel>
                                    <Select {...field} label="Detector Calibration">
                                      <MenuItem value="New">New</MenuItem>
                                      <MenuItem value="Good">Good</MenuItem>
                                      <MenuItem value="Worn">Worn</MenuItem>
                                      <MenuItem value="Leaking">Leaking</MenuItem>
                                      <MenuItem value="Badly Damaged">Badly Damaged</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name="column_condition"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.column_condition}>
                                    <InputLabel>Column Condition</InputLabel>
                                    <Select {...field} label="Column Condition">
                                      <MenuItem value="Clean">Clean</MenuItem>
                                      <MenuItem value="Good">Good</MenuItem>
                                      <MenuItem value="Lightly Contaminated">Lightly Contaminated</MenuItem>
                                      <MenuItem value="Contaminated">Contaminated</MenuItem>
                                      <MenuItem value="Heavily Contaminated">Heavily Contaminated</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Controller
                                name="noise_level"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.noise_level}>
                                    <InputLabel>Noise Level</InputLabel>
                                    <Select {...field} label="Noise Level">
                                      <MenuItem value="Low">Low</MenuItem>
                                      <MenuItem value="Medium">Medium</MenuItem>
                                      <MenuItem value="High">High</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Controller
                                name="sample_matrix"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.sample_matrix}>
                                    <InputLabel>Sample Matrix</InputLabel>
                                    <Select {...field} label="Sample Matrix">
                                      <MenuItem value="Light Hydrocarbon">Light Hydrocarbon</MenuItem>
                                      <MenuItem value="Heavy Hydrocarbon">Heavy Hydrocarbon</MenuItem>
                                      <MenuItem value="Oxygenated">Oxygenated</MenuItem>
                                      <MenuItem value="Aqueous">Aqueous</MenuItem>
                                      <MenuItem value="Complex Matrix">Complex Matrix</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Controller
                                name="analysis_type"
                                control={control}
                                render={({ field }) => (
                                  <FormControl fullWidth error={!!errors.analysis_type}>
                                    <InputLabel>Analysis Type</InputLabel>
                                    <Select {...field} label="Analysis Type">
                                      <MenuItem value="Routine">Routine</MenuItem>
                                      <MenuItem value="Research">Research</MenuItem>
                                      <MenuItem value="Method Development">Method Development</MenuItem>
                                      <MenuItem value="Validation">Validation</MenuItem>
                                    </Select>
                                  </FormControl>
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}

                        <Box sx={{ mb: 2, mt: 2 }}>
                          <div>
                            <Button
                              variant="contained"
                              onClick={index === steps.length - 1 ? handleSubmit(onSubmit) : handleNext}
                              sx={{ mt: 1, mr: 1 }}
                              disabled={loading}
                            >
                              {index === steps.length - 1 ? 'Calculate Detection Limit' : 'Continue'}
                            </Button>
                            <Button
                              disabled={index === 0}
                              onClick={handleBack}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              Back
                            </Button>
                          </div>
                        </Box>
                      </form>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Template Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Template Actions
              </Typography>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Results Display */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Results & Analysis
              </Typography>

              {loading && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Calculating detection limits...
                  </Typography>
                </Box>
              )}

              {result && (
                <Box>
                  <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="Overview" />
                    <Tab label="ASTM Comparison" />
                    <Tab label="Optimization" />
                    <Tab label="Statistics" />
                    <Tab label="Charts" />
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Detection Limit: <strong>{result.detection_limit.toFixed(3)} ppm</strong>
                          </Typography>
                          <Typography variant="body2">
                            Signal-to-Noise: <strong>{result.signal_to_noise.toFixed(0)}</strong>
                          </Typography>
                          <Typography variant="body2">
                            Confidence Level: <strong>{(result.confidence_level * 100).toFixed(1)}%</strong>
                          </Typography>
                        </Alert>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Performance Factors:
                        </Typography>
                        <Grid container spacing={1}>
                          {Object.entries(result.instrument_factors).map(([key, value]) => (
                            <Grid item xs={6} key={key}>
                              <Chip
                                label={`${key.replace(/_/g, ' ').toUpperCase()}: ${(value as number * 100).toFixed(0)}%`}
                                color={getScoreColor(value as number)}
                                size="small"
                                icon={getScoreIcon(value as number)}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    {result.astm_comparison && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          ASTM Method Compliance:
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Method</TableCell>
                                <TableCell>ASTM DL</TableCell>
                                <TableCell>Your DL</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Performance</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {result.astm_comparison.applicable_methods?.map((method: any) => (
                                <TableRow key={method.method_id}>
                                  <TableCell>{method.method_name}</TableCell>
                                  <TableCell>{method.astm_dl} ppm</TableCell>
                                  <TableCell>{result.detection_limit.toFixed(3)} ppm</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={method.compliance_status}
                                      color={method.compliance_status === 'Compliant' ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={`${method.performance_ratio.toFixed(1)}x`}
                                      color="primary"
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        <Alert severity={result.astm_comparison.astm_compliance ? 'success' : 'warning'}>
                          Overall Compliance: {(result.astm_comparison.compliance_rate * 100).toFixed(0)}%
                        </Alert>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel value={tabValue} index={2}>
                    {result.optimization_potential && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Optimization Potential:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Alert severity="info">
                              <Typography variant="body2">
                                Current DL: <strong>{result.optimization_potential.current_dl.toFixed(3)} ppm</strong>
                              </Typography>
                              <Typography variant="body2">
                                Optimized DL: <strong>{result.optimization_potential.optimized_dl.toFixed(3)} ppm</strong>
                              </Typography>
                              <Typography variant="body2">
                                Improvement Factor: <strong>{result.optimization_potential.improvement_factor.toFixed(1)}x</strong>
                              </Typography>
                            </Alert>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Optimization Recommendations:
                            </Typography>
                            {result.recommendations.map((rec, index) => (
                              <Chip
                                key={index}
                                label={rec}
                                color="primary"
                                variant="outlined"
                                sx={{ m: 0.5 }}
                              />
                            ))}
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel value={tabValue} index={3}>
                    {result.statistical_analysis && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Statistical Analysis:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              R²: <strong>{result.statistical_analysis.r_squared.toFixed(3)}</strong>
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              LOD: <strong>{result.statistical_analysis.lod.toFixed(3)} ppm</strong>
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              LOQ: <strong>{result.statistical_analysis.loq.toFixed(3)} ppm</strong>
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Precision: <strong>{(result.statistical_analysis.precision * 100).toFixed(1)}%</strong>
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel value={tabValue} index={4}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Calibration Curve:
                      </Typography>
                      <Plot
                        data={getCalibrationCurveData()}
                        layout={{
                          title: 'Calibration Curve',
                          xaxis: { title: 'Concentration (ppm)' },
                          yaxis: { title: 'Response' },
                          height: 300,
                          margin: { l: 50, r: 50, t: 50, b: 50 },
                        }}
                        style={{ width: '100%' }}
                      />
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Optimization Potential:
                      </Typography>
                      <Plot
                        data={getOptimizationChartData()}
                        layout={{
                          title: 'Detection Limit Optimization',
                          xaxis: { title: 'Configuration' },
                          yaxis: { title: 'Detection Limit (ppm)' },
                          height: 300,
                          margin: { l: 50, r: 50, t: 50, b: 50 },
                        }}
                        style={{ width: '100%' }}
                      />
                    </Box>
                  </TabPanel>
                </Box>
              )}

              {!result && !loading && (
                <Alert severity="info">
                  Complete the parameter setup and click "Calculate Detection Limit" to see results.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Optimization Dialog */}
      <Dialog
        open={showOptimizationDialog}
        onClose={() => setShowOptimizationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            🚀 Advanced Optimization Options
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select optimization strategies to apply:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={autoOptimize}
                startIcon={<AutoFixHigh />}
              >
                Auto-Optimize All Parameters
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOptimizationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialogs */}
      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
        toolType="detection_limit"
        title="Select Detection Limit Template"
      />
      
      <TemplateSaveDialog
        open={templateSaveDialogOpen}
        onClose={() => setTemplateSaveDialogOpen(false)}
        onSave={handleTemplateSave}
        toolType="detection_limit"
        parameters={getCurrentParameters()}
        currentMethodName={`Detection Limit Method ${new Date().toLocaleDateString()}`}
      />
    </Box>
  );

  // Template handling functions
  function handleTemplateSelect(template: any) {
    try {
      const params = template.parameters;
      
      reset({
        detector_type: params.detector_type || 'FID',
        carrier_gas: params.carrier_gas || 'Helium',
        column_type: params.column_type || 'PLOT Q',
        injector_temp: params.injector_temp || 250,
        detector_temp: params.detector_temp || 280,
        oven_temp: params.oven_temp || 40,
        flow_rate: params.flow_rate || 2.0,
        split_ratio: params.split_ratio || 20.0,
        injection_volume: params.injection_volume || 1.0,
        sample_concentration: params.sample_concentration || 100.0,
        signal_to_noise: params.signal_to_noise || 3.0,
        noise_level: params.noise_level || 0.5,
        peak_height: params.peak_height || 10.0,
        concentration_factor: params.concentration_factor || 1.0,
        optimization_target: params.optimization_target || 'sensitivity',
        h2_flow: params.h2_flow || 30,
        air_flow: params.air_flow || 300,
        makeup_flow: params.makeup_flow || 25
      });
      
      sessionStorage.setItem('currentAnalysisData', JSON.stringify({
        tool_type: 'detection_limit',
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
      detector_type: currentValues.detector_type,
      carrier_gas: currentValues.carrier_gas,
      column_type: currentValues.column_type,
      injector_temp: currentValues.injector_temp,
      detector_temp: currentValues.detector_temp,
      oven_temp: currentValues.oven_temp,
      flow_rate: currentValues.flow_rate,
      split_ratio: currentValues.split_ratio,
      injection_volume: currentValues.injection_volume,
      sample_concentration: currentValues.sample_concentration,
      signal_to_noise: currentValues.signal_to_noise,
      noise_level: currentValues.noise_level,
      peak_height: currentValues.peak_height,
      concentration_factor: currentValues.concentration_factor,
      optimization_target: currentValues.optimization_target,
      h2_flow: currentValues.h2_flow,
      air_flow: currentValues.air_flow,
      makeup_flow: currentValues.makeup_flow
    };
  }
};

export default DetectionLimitCalculator; 