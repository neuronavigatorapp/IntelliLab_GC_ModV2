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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Fab,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Science,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  LibraryBooks,
  SaveAs,
  Save,
  Upload,
  Download,
  AutoFixHigh,
  Timeline,
  Add,
  Delete,
  DragIndicator,
  Visibility,
  VisibilityOff,
  Compare,
  Settings,
  Assessment,
  FlashOn as Speed,
  Thermostat,
  ShowChart,
  TableChart,
  BarChart,
  PieChart,
  Timeline as TimelineIcon,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  GetApp,
  Share,
  Print,
  ContentCopy,
  Edit,
  Check,
  Close,
  Info,
  Help,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../store';
import { OvenRampRequest, OvenRampResponse, TemperaturePoint } from '../../../types';
import { calculationsAPI } from '../../../services/apiService';
import { toast } from 'react-hot-toast';
import Plot from 'react-plotly.js';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TemplateSelector from '../../Templates/TemplateSelector';
import TemplateSaveDialog from '../../Templates/TemplateSaveDialog';

// Enhanced validation schema
const schema = yup.object().shape({
  initial_temp: yup.number().min(30).max(100).required(),
  initial_hold: yup.number().min(0).max(60).required(),
  ramp_rate_1: yup.number().min(0.1).max(50).required(),
  final_temp_1: yup.number().min(50).max(350).required(),
  hold_time_1: yup.number().min(0).max(60).required(),
  ramp_rate_2: yup.number().min(0.1).max(50).required(),
  final_temp_2: yup.number().min(50).max(350).required(),
  hold_time_2: yup.number().min(0).max(60).required(),
  ramp_rate_3: yup.number().min(0.1).max(50).required(),
  final_temp_3: yup.number().min(50).max(350).required(),
  hold_time_3: yup.number().min(0).max(60).required(),
  equilibration_time: yup.number().min(0).max(10).required(),
  post_run_temp: yup.number().min(30).max(100).required(),
  post_run_time: yup.number().min(0).max(30).required(),
  total_time: yup.number().min(1).max(120).required(),
  flow_rate: yup.number().min(0.1).max(10).required(),
  pressure: yup.number().min(1).max(50).required(),
  split_ratio: yup.number().min(1).max(1000).required(),
  injector_temp: yup.number().min(50).max(400).required(),
  detector_temp: yup.number().min(50).max(400).required(),
  final_hold: yup.number().min(0).max(60).required(),
  instrument_age: yup.number().min(0).max(50).required(),
  maintenance_level: yup.string().required(),
  oven_calibration: yup.string().required(),
  column_condition: yup.string().required(),
  heating_rate_limit: yup.number().min(1).max(50).required(),
  compound_class: yup.string().required(),
  volatility_range: yup.string().required(),
  sample_complexity: yup.string().required(),
  column_type: yup.string().required(),
  analysis_type: yup.string().required(),
});

// Temperature segment interface
interface TemperatureSegment {
  id: string;
  type: 'hold' | 'ramp';
  start_temp: number;
  end_temp: number;
  rate: number;
  duration: number;
  time_start: number;
  time_end: number;
}

// Step configuration
const steps = [
  'Column & Sample Setup',
  'Temperature Program',
  'Instrument Conditions',
  'Optimization & Results',
];

const OvenRampVisualizer: React.FC = () => {
  const dispatch = useAppDispatch();
  const [result, setResult] = useState<OvenRampResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [savedMethods, setSavedMethods] = useState<any[]>([]);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [templateSaveDialogOpen, setTemplateSaveDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isValid },
  } = useForm<OvenRampRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      initial_temp: 50.0,
      initial_hold: 2.0,
      ramp_rate_1: 10.0,
      final_temp_1: 150.0,
      hold_time_1: 0.0,
      ramp_rate_2: 5.0,
      final_temp_2: 280.0,
      hold_time_2: 5.0,
      ramp_rate_3: 20.0,
      final_temp_3: 300.0,
      hold_time_3: 2.0,
      equilibration_time: 1.0,
      post_run_temp: 50.0,
      post_run_time: 5.0,
      total_time: 35.0,
      flow_rate: 1.5,
      pressure: 12.0,
      split_ratio: 20.0,
      injector_temp: 250.0,
      detector_temp: 280.0,
      final_hold: 5.0,
      instrument_age: 5.0,
      maintenance_level: 'Good',
      oven_calibration: 'Good',
      column_condition: 'Good',
      heating_rate_limit: 20.0,
      compound_class: 'Hydrocarbons',
      volatility_range: 'C8-C20',
      sample_complexity: 'Medium',
      column_type: 'DB-5ms (30m x 0.25mm x 0.25um)',
      analysis_type: 'Routine',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Temperature segments state
  const [temperatureSegments, setTemperatureSegments] = useState<TemperatureSegment[]>([
    {
      id: '1',
      type: 'hold',
      start_temp: 50,
      end_temp: 50,
      rate: 0,
      duration: 2,
      time_start: 0,
      time_end: 2,
    },
    {
      id: '2',
      type: 'ramp',
      start_temp: 50,
      end_temp: 150,
      rate: 10,
      duration: 10,
      time_start: 2,
      time_end: 12,
    },
    {
      id: '3',
      type: 'hold',
      start_temp: 150,
      end_temp: 150,
      rate: 0,
      duration: 0,
      time_start: 12,
      time_end: 12,
    },
    {
      id: '4',
      type: 'ramp',
      start_temp: 150,
      end_temp: 280,
      rate: 5,
      duration: 26,
      time_start: 12,
      time_end: 38,
    },
    {
      id: '5',
      type: 'hold',
      start_temp: 280,
      end_temp: 280,
      rate: 0,
      duration: 5,
      time_start: 38,
      time_end: 43,
    },
  ]);

  // Update form values when segments change
  useEffect(() => {
    if (temperatureSegments.length >= 5) {
      setValue('initial_temp', temperatureSegments[0].start_temp);
      setValue('initial_hold', temperatureSegments[0].duration);
      setValue('ramp_rate_1', temperatureSegments[1].rate);
      setValue('final_temp_1', temperatureSegments[1].end_temp);
      setValue('hold_time_1', temperatureSegments[2].duration);
      setValue('ramp_rate_2', temperatureSegments[3].rate);
      setValue('final_temp_2', temperatureSegments[3].end_temp);
      setValue('final_hold', temperatureSegments[4].duration);
    }
  }, [temperatureSegments, setValue]);

  const onSubmit = async (data: OvenRampRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to backend
      const response = await fetch('/api/v1/calculations/oven-ramp', {
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
      toast.success('Temperature program optimization completed successfully!');
      setActiveStep(3); // Go to results step
      
    } catch (error) {
      console.error('Optimization error:', error);
      setError('Failed to optimize temperature program. Please check your inputs and try again.');
      toast.error('Optimization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4caf50';
    if (score >= 6) return '#ff9800';
    return '#f44336';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle />;
    if (score >= 6) return <Warning />;
    return <Error />;
  };

  const autoOptimize = async () => {
    setLoading(true);
    try {
      const compoundClass = watchedValues.compound_class;
      const volatilityRange = watchedValues.volatility_range;
      
      // Apply optimized parameters based on compound class
      if (compoundClass === 'Hydrocarbons') {
        if (volatilityRange === 'C8-C20') {
          setValue('initial_temp', 60.0);
          setValue('initial_hold', 2.0);
          setValue('ramp_rate_1', 8.0);
          setValue('final_temp_1', 180.0);
          setValue('hold_time_1', 1.0);
          setValue('ramp_rate_2', 4.0);
          setValue('final_temp_2', 280.0);
          setValue('final_hold', 5.0);
        } else if (volatilityRange === 'C10-C30') {
          setValue('initial_temp', 70.0);
          setValue('initial_hold', 2.0);
          setValue('ramp_rate_1', 6.0);
          setValue('final_temp_1', 220.0);
          setValue('hold_time_1', 1.0);
          setValue('ramp_rate_2', 3.0);
          setValue('final_temp_2', 320.0);
          setValue('final_hold', 8.0);
        }
      }
      
      // Update temperature segments
      updateTemperatureSegments();
      
      const optimizedData = {
        ...watchedValues,
        initial_temp: watchedValues.initial_temp,
        initial_hold: watchedValues.initial_hold,
        ramp_rate_1: watchedValues.ramp_rate_1,
        final_temp_1: watchedValues.final_temp_1,
        hold_time_1: watchedValues.hold_time_1,
        ramp_rate_2: watchedValues.ramp_rate_2,
        final_temp_2: watchedValues.final_temp_2,
        final_hold: watchedValues.final_hold,
      };
      
      const response = await calculationsAPI.ovenRamp(optimizedData);
      setResult(response.data);
      toast.success('Temperature program automatically optimized!');
    } catch (error) {
      toast.error('Failed to auto-optimize temperature program');
      console.error('Auto-optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTemperatureSegments = useCallback(() => {
    const newSegments = [
      {
        id: '1',
        type: 'hold' as const,
        start_temp: watchedValues.initial_temp,
        end_temp: watchedValues.initial_temp,
        rate: 0,
        duration: watchedValues.initial_hold,
        time_start: 0,
        time_end: watchedValues.initial_hold,
      },
      {
        id: '2',
        type: 'ramp' as const,
        start_temp: watchedValues.initial_temp,
        end_temp: watchedValues.final_temp_1,
        rate: watchedValues.ramp_rate_1,
        duration: (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1,
        time_start: watchedValues.initial_hold,
        time_end: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1,
      },
      {
        id: '3',
        type: 'hold' as const,
        start_temp: watchedValues.final_temp_1,
        end_temp: watchedValues.final_temp_1,
        rate: 0,
        duration: watchedValues.hold_time_1,
        time_start: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1,
        time_end: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1 + watchedValues.hold_time_1,
      },
      {
        id: '4',
        type: 'ramp' as const,
        start_temp: watchedValues.final_temp_1,
        end_temp: watchedValues.final_temp_2,
        rate: watchedValues.ramp_rate_2,
        duration: (watchedValues.final_temp_2 - watchedValues.final_temp_1) / watchedValues.ramp_rate_2,
        time_start: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1 + watchedValues.hold_time_1,
        time_end: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1 + watchedValues.hold_time_1 + (watchedValues.final_temp_2 - watchedValues.final_temp_1) / watchedValues.ramp_rate_2,
      },
      {
        id: '5',
        type: 'hold' as const,
        start_temp: watchedValues.final_temp_2,
        end_temp: watchedValues.final_temp_2,
        rate: 0,
        duration: watchedValues.final_hold,
        time_start: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1 + watchedValues.hold_time_1 + (watchedValues.final_temp_2 - watchedValues.final_temp_1) / watchedValues.ramp_rate_2,
        time_end: watchedValues.initial_hold + (watchedValues.final_temp_1 - watchedValues.initial_temp) / watchedValues.ramp_rate_1 + watchedValues.hold_time_1 + (watchedValues.final_temp_2 - watchedValues.final_temp_1) / watchedValues.ramp_rate_2 + watchedValues.final_hold,
      },
    ];
    setTemperatureSegments(newSegments);
  }, [watchedValues]);

  // Update segments when form values change
  useEffect(() => {
    updateTemperatureSegments();
  }, [updateTemperatureSegments]);

  const temperatureChartData = result ? [
    {
      x: result.temperature_profile.map(p => p.time),
      y: result.temperature_profile.map(p => p.temperature),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Temperature Profile',
      line: { color: '#1976d2', width: 3 },
      marker: { size: 8 },
    },
  ] : [];

  const temperatureChartLayout = {
    title: 'Temperature Program Profile',
    xaxis: { title: 'Time (minutes)' },
    yaxis: { title: 'Temperature (°C)' },
    height: 400,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: false,
  };

  const efficiencyChartData = result ? [
    {
      x: ['Resolution', 'Efficiency', 'Optimization'],
      y: [result.resolution_score, result.efficiency_score, result.optimization_score],
      type: 'bar',
      marker: {
        color: [
          getScoreColor(result.resolution_score),
          getScoreColor(result.efficiency_score),
          getScoreColor(result.optimization_score)
        ]
      },
      name: 'Performance Scores',
    },
  ] : [];

  const efficiencyChartLayout = {
    title: 'Performance Metrics',
    xaxis: { title: 'Metrics' },
    yaxis: { title: 'Score (0-10)', range: [0, 10] },
    height: 300,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: false,
  };

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Column & Sample Configuration
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Controller
            name="column_type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.column_type}>
                <InputLabel>Column Type</InputLabel>
                <Select {...field} label="Column Type">
                  <MenuItem value="DB-5ms (30m x 0.25mm x 0.25um)">DB-5ms (30m x 0.25mm x 0.25um)</MenuItem>
                  <MenuItem value="DB-5ms (60m x 0.25mm x 0.25um)">DB-5ms (60m x 0.25mm x 0.25um)</MenuItem>
                  <MenuItem value="DB-1ms (30m x 0.25mm x 0.25um)">DB-1ms (30m x 0.25mm x 0.25um)</MenuItem>
                  <MenuItem value="DB-17ms (30m x 0.25mm x 0.25um)">DB-17ms (30m x 0.25mm x 0.25um)</MenuItem>
                  <MenuItem value="DB-WAX (30m x 0.25mm x 0.25um)">DB-WAX (30m x 0.25mm x 0.25um)</MenuItem>
                  <MenuItem value="DB-624 (30m x 0.25mm x 1.4um)">DB-624 (30m x 0.25mm x 1.4um)</MenuItem>
                  <MenuItem value="DB-1301 (30m x 0.25mm x 1.0um)">DB-1301 (30m x 0.25mm x 1.0um)</MenuItem>
                  <MenuItem value="PLOT Al2O3 (30m x 0.32mm)">PLOT Al2O3 (30m x 0.32mm)</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="compound_class"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.compound_class}>
                <InputLabel>Compound Class</InputLabel>
                <Select {...field} label="Compound Class">
                  <MenuItem value="Hydrocarbons">Hydrocarbons</MenuItem>
                  <MenuItem value="Alcohols">Alcohols</MenuItem>
                  <MenuItem value="Esters">Esters</MenuItem>
                  <MenuItem value="Ketones">Ketones</MenuItem>
                  <MenuItem value="Aldehydes">Aldehydes</MenuItem>
                  <MenuItem value="Aromatics">Aromatics</MenuItem>
                  <MenuItem value="Halogenated">Halogenated</MenuItem>
                  <MenuItem value="Terpenes">Terpenes</MenuItem>
                  <MenuItem value="Pesticides">Pesticides</MenuItem>
                  <MenuItem value="Pharmaceuticals">Pharmaceuticals</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="volatility_range"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.volatility_range}>
                <InputLabel>Volatility Range</InputLabel>
                <Select {...field} label="Volatility Range">
                  <MenuItem value="C5-C10">C5-C10</MenuItem>
                  <MenuItem value="C8-C20">C8-C20</MenuItem>
                  <MenuItem value="C10-C30">C10-C30</MenuItem>
                  <MenuItem value="C15-C40">C15-C40</MenuItem>
                  <MenuItem value="C20-C50">C20-C50</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="sample_complexity"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.sample_complexity}>
                <InputLabel>Sample Complexity</InputLabel>
                <Select {...field} label="Sample Complexity">
                  <MenuItem value="Simple">Simple</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Complex">Complex</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="analysis_type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.analysis_type}>
                <InputLabel>Analysis Type</InputLabel>
                <Select {...field} label="Analysis Type">
                  <MenuItem value="Routine">Routine Analysis</MenuItem>
                  <MenuItem value="Research">Research & Development</MenuItem>
                  <MenuItem value="Screening">Fast Screening</MenuItem>
                  <MenuItem value="Validation">Method Validation</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Temperature Program Configuration
      </Typography>
      
      {/* Interactive Temperature Profile */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Interactive Temperature Profile
          </Typography>
          <Box sx={{ height: 300, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Temperature Profile Visualization
            </Typography>
            {/* Placeholder for interactive temperature profile */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Temperature Segments */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Initial Conditions
          </Typography>
          
          <Typography gutterBottom>Initial Temperature (°C)</Typography>
          <Controller
            name="initial_temp"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={30}
                max={100}
                step={5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 30, label: '30°C' },
                  { value: 50, label: '50°C' },
                  { value: 100, label: '100°C' },
                ]}
              />
            )}
          />

          <Typography gutterBottom>Initial Hold Time (min)</Typography>
          <Controller
            name="initial_hold"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0}
                max={10}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0 min' },
                  { value: 2, label: '2 min' },
                  { value: 10, label: '10 min' },
                ]}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            First Ramp
          </Typography>

          <Typography gutterBottom>Ramp Rate 1 (°C/min)</Typography>
          <Controller
            name="ramp_rate_1"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={1}
                max={30}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1°C/min' },
                  { value: 10, label: '10°C/min' },
                  { value: 30, label: '30°C/min' },
                ]}
              />
            )}
          />

          <Typography gutterBottom>Final Temperature 1 (°C)</Typography>
          <Controller
            name="final_temp_1"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={100}
                max={250}
                step={5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 100, label: '100°C' },
                  { value: 150, label: '150°C' },
                  { value: 250, label: '250°C' },
                ]}
              />
            )}
          />

          <Typography gutterBottom>Hold Time 1 (min)</Typography>
          <Controller
            name="hold_time_1"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0}
                max={10}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0 min' },
                  { value: 1, label: '1 min' },
                  { value: 10, label: '10 min' },
                ]}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Second Ramp
          </Typography>

          <Typography gutterBottom>Ramp Rate 2 (°C/min)</Typography>
          <Controller
            name="ramp_rate_2"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={1}
                max={20}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1°C/min' },
                  { value: 5, label: '5°C/min' },
                  { value: 20, label: '20°C/min' },
                ]}
              />
            )}
          />

          <Typography gutterBottom>Final Temperature 2 (°C)</Typography>
          <Controller
            name="final_temp_2"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={200}
                max={350}
                step={5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 200, label: '200°C' },
                  { value: 280, label: '280°C' },
                  { value: 350, label: '350°C' },
                ]}
              />
            )}
          />

          <Typography gutterBottom>Final Hold Time (min)</Typography>
          <Controller
            name="final_hold"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0}
                max={15}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0 min' },
                  { value: 5, label: '5 min' },
                  { value: 15, label: '15 min' },
                ]}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep3 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Instrument Conditions
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Instrument Age (years)</Typography>
          <Controller
            name="instrument_age"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0}
                max={15}
                step={0.5}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: '0 years' },
                  { value: 5, label: '5 years' },
                  { value: 15, label: '15 years' },
                ]}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Max Heating Rate (°C/min)</Typography>
          <Controller
            name="heating_rate_limit"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={5}
                max={30}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 5, label: '5°C/min' },
                  { value: 20, label: '20°C/min' },
                  { value: 30, label: '30°C/min' },
                ]}
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
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Controller
            name="oven_calibration"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.oven_calibration}>
                <InputLabel>Oven Calibration</InputLabel>
                <Select {...field} label="Oven Calibration">
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="column_condition"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.column_condition}>
                <InputLabel>Column Condition</InputLabel>
                <Select {...field} label="Column Condition">
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderStep4 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Optimization Results
      </Typography>
      
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Optimizing temperature program parameters...
          </Typography>
        </Box>
      )}

      {result && (
        <Grid container spacing={3}>
          {/* Performance Scores */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: getScoreColor(result.resolution_score) }}>
                        {result.resolution_score.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Resolution Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: getScoreColor(result.efficiency_score) }}>
                        {result.efficiency_score.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Efficiency Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: getScoreColor(result.optimization_score) }}>
                        {result.optimization_score.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Overall Score
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Runtime */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Runtime Analysis
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {result.total_runtime.toFixed(1)} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Runtime
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Recommendations
                </Typography>
                {result.recommendations && result.recommendations.length > 0 ? (
                  result.recommendations.map((rec, index) => (
                    <Alert key={index} severity="info" sx={{ mb: 1 }}>
                      {rec}
                    </Alert>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific recommendations at this time.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                  <Tab label="Temperature Profile" />
                  <Tab label="Performance Metrics" />
                </Tabs>
                
                <Box sx={{ mt: 2 }}>
                  {selectedTab === 0 && (
                    <Plot
                      data={temperatureChartData}
                      layout={temperatureChartLayout}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  )}
                  {selectedTab === 1 && (
                    <Plot
                      data={efficiencyChartData}
                      layout={efficiencyChartLayout}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%', height: '300px' }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {!result && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Timeline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Results Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your temperature program and optimize to see results
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🌡️ Oven Ramp Visualizer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Professional temperature program optimization with advanced algorithms
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading Display */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Optimizing temperature program...</Typography>
        </Box>
      )}

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
        {activeStep === 2 && renderStep3()}
        {activeStep === 3 && renderStep4()}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            onClick={autoOptimize}
            disabled={loading}
            startIcon={<AutoFixHigh />}
            sx={{ mr: 1 }}
          >
            🤖 Auto-Optimize
          </Button>
        </Box>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={loading || !isValid}
              startIcon={<Science />}
            >
              {loading ? 'Optimizing...' : 'Run Optimization'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isValid}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Tooltip title="Load Template">
          <Fab size="small" color="warning" onClick={() => setTemplateSelectorOpen(true)}>
            <LibraryBooks />
          </Fab>
        </Tooltip>
        <Tooltip title="Save as Template">
          <Fab size="small" color="warning" onClick={() => setTemplateSaveDialogOpen(true)}>
            <SaveAs />
          </Fab>
        </Tooltip>
        <Tooltip title="Save Method">
          <Fab size="small" color="primary" onClick={() => setShowMethodDialog(true)}>
            <Save />
          </Fab>
        </Tooltip>
        <Tooltip title="Compare Methods">
          <Fab size="small" color="secondary" onClick={() => setShowComparisonDialog(true)}>
            <Compare />
          </Fab>
        </Tooltip>
        <Tooltip title="Export Results">
          <Fab size="small" color="success">
            <Download />
          </Fab>
        </Tooltip>
      </Box>

      {/* Method Save Dialog */}
      <Dialog open={showMethodDialog} onClose={() => setShowMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Method Configuration</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Method Name"
            variant="outlined"
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMethodDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowMethodDialog(false)}>
            Save Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* Method Comparison Dialog */}
      <Dialog open={showComparisonDialog} onClose={() => setShowComparisonDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Method Comparison</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Compare different method configurations and their performance metrics.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComparisonDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialogs */}
      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
        toolType="oven_ramp"
        title="Select Oven Ramp Template"
      />
      
      <TemplateSaveDialog
        open={templateSaveDialogOpen}
        onClose={() => setTemplateSaveDialogOpen(false)}
        onSave={handleTemplateSave}
        toolType="oven_ramp"
        parameters={getCurrentParameters()}
        currentMethodName={`Oven Ramp Method ${new Date().toLocaleDateString()}`}
      />
    </Box>
  );

  // Template handling functions
  function handleTemplateSelect(template: any) {
    try {
      const params = template.parameters;
      
      reset({
        initial_temp: params.initial_temp || 50.0,
        initial_hold: params.initial_hold || 2.0,
        ramp_rate_1: params.ramp_rate_1 || 10.0,
        final_temp_1: params.final_temp_1 || 150.0,
        hold_time_1: params.hold_time_1 || 0.0,
        ramp_rate_2: params.ramp_rate_2 || 15.0,
        final_temp_2: params.final_temp_2 || 250.0,
        hold_time_2: params.hold_time_2 || 5.0,
        ramp_rate_3: params.ramp_rate_3 || 20.0,
        final_temp_3: params.final_temp_3 || 300.0,
        hold_time_3: params.hold_time_3 || 2.0,
        equilibration_time: params.equilibration_time || 1.0,
        post_run_temp: params.post_run_temp || 50.0,
        post_run_time: params.post_run_time || 5.0,
        total_time: params.total_time || 35.0,
        flow_rate: params.flow_rate || 1.5,
        pressure: params.pressure || 12.0,
        split_ratio: params.split_ratio || 20.0,
        injector_temp: params.injector_temp || 250.0,
        detector_temp: params.detector_temp || 280.0
      });
      
      sessionStorage.setItem('currentAnalysisData', JSON.stringify({
        tool_type: 'oven_ramp',
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
      initial_temp: currentValues.initial_temp,
      initial_hold: currentValues.initial_hold,
      ramp_rate_1: currentValues.ramp_rate_1,
      final_temp_1: currentValues.final_temp_1,
      hold_time_1: currentValues.hold_time_1,
      ramp_rate_2: currentValues.ramp_rate_2,
      final_temp_2: currentValues.final_temp_2,
      hold_time_2: currentValues.hold_time_2,
      ramp_rate_3: currentValues.ramp_rate_3,
      final_temp_3: currentValues.final_temp_3,
      hold_time_3: currentValues.hold_time_3,
      equilibration_time: currentValues.equilibration_time,
      post_run_temp: currentValues.post_run_temp,
      post_run_time: currentValues.post_run_time,
      total_time: currentValues.total_time,
      flow_rate: currentValues.flow_rate,
      pressure: currentValues.pressure,
      split_ratio: currentValues.split_ratio,
      injector_temp: currentValues.injector_temp,
      detector_temp: currentValues.detector_temp
    };
  }
};

export default OvenRampVisualizer; 