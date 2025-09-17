import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
);

const GCInstrumentSandbox = () => {
  // Main state
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [presetDialog, setPresetDialog] = useState({ open: false, mode: 'save', presets: [] });
  
  // Method parameters state
  const [methodParameters, setMethodParameters] = useState({
    inlets: [{
      inlet_id: 'INL1',
      inlet_type: 'split',
      temperature_c: 250,
      split_ratio: 10.0,
      total_flow_ml_min: 50.0,
      carrier_gas: 'helium',
      gas_saver: true,
      gas_saver_flow_ml_min: 20.0,
      gas_saver_delay_min: 2.0,
      pulse_pressure_kpa: 0,
      pulse_duration_min: 0
    }],
    columns: [{
      column_id: 'COL1',
      length_m: 30.0,
      inner_diameter_mm: 0.25,
      film_thickness_um: 0.25,
      stationary_phase: 'DB-1',
      flow_mode: 'constant_flow',
      flow_ml_min: 1.0,
      average_velocity_cm_s: 0,
      backflush_enabled: false,
      backflush_start_min: 0,
      backflush_duration_min: 0
    }],
    detectors: [{
      detector_id: 'FID1',
      detector_type: 'FID',
      temperature_c: 300,
      h2_flow_ml_min: 30,
      air_flow_ml_min: 300,
      makeup_flow_ml_min: 25,
      data_rate_hz: 50,
      attenuation: 0,
      offset: 0
    }],
    oven_program: [{
      step_number: 1,
      temperature_c: 50,
      hold_time_min: 2.0,
      ramp_rate_c_min: 10.0,
      final_temperature_c: 300
    }],
    valve_program: []
  });
  
  // Sample profile state
  const [sampleProfile, setSampleProfile] = useState({
    sample_id: 'TEST_SAMPLE',
    injection_volume_ul: 1.0,
    solvent: 'none',
    matrix: 'gas',
    analytes: [{
      name: 'n-Hexane',
      concentration_ppm: 1000,
      retention_factor: 2.0,
      diffusion_coefficient: 0.05,
      response_factor: 1.0
    }]
  });
  
  // Simulation options state
  const [simulationOptions, setSimulationOptions] = useState({
    include_noise: true,
    include_baseline_drift: true,
    simulation_seed: 12345,
    export_csv: false,
    export_png: false
  });
  
  // Results state
  const [simulationResult, setSimulationResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  
  // Memoized chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'GC Chromatogram',
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return `Time: ${context[0].parsed.x.toFixed(2)} min`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(0)} counts`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time (min)'
        },
        type: 'linear'
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Intensity (counts)'
        },
        beginAtZero: true
      }
    }
  }), []);
  
  // Handle simulation run
  const runSimulation = useCallback(async () => {
    setSimulationRunning(true);
    setResultLoading(true);
    
    try {
      const runId = `RUN_${Date.now()}`;
      const request = {
        run_id: runId,
        method_parameters: methodParameters,
        sample_profile: sampleProfile,
        ...simulationOptions
      };
      
      const response = await fetch('/api/gc-sandbox/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSimulationResult(result);
      
      setSnackbar({
        open: true,
        message: `Simulation completed in ${result.simulation_time_ms}ms`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      setSnackbar({
        open: true,
        message: `Simulation failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSimulationRunning(false);
      setResultLoading(false);
    }
  }, [methodParameters, sampleProfile, simulationOptions]);
  
  // Handle parameter updates
  const updateInletParameter = (index, field, value) => {
    const newInlets = [...methodParameters.inlets];
    newInlets[index] = { ...newInlets[index], [field]: value };
    setMethodParameters({ ...methodParameters, inlets: newInlets });
  };
  
  const updateColumnParameter = (index, field, value) => {
    const newColumns = [...methodParameters.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setMethodParameters({ ...methodParameters, columns: newColumns });
  };
  
  const updateDetectorParameter = (index, field, value) => {
    const newDetectors = [...methodParameters.detectors];
    newDetectors[index] = { ...newDetectors[index], [field]: value };
    setMethodParameters({ ...methodParameters, detectors: newDetectors });
  };
  
  const updateOvenStep = (index, field, value) => {
    const newProgram = [...methodParameters.oven_program];
    newProgram[index] = { ...newProgram[index], [field]: value };
    setMethodParameters({ ...methodParameters, oven_program: newProgram });
  };
  
  const updateAnalyte = (index, field, value) => {
    const newAnalytes = [...sampleProfile.analytes];
    newAnalytes[index] = { ...newAnalytes[index], [field]: value };
    setSampleProfile({ ...sampleProfile, analytes: newAnalytes });
  };
  
  // Add/remove functions
  const addInlet = () => {
    const newInlet = {
      inlet_id: `INL${methodParameters.inlets.length + 1}`,
      inlet_type: 'split',
      temperature_c: 250,
      split_ratio: 10.0,
      total_flow_ml_min: 50.0,
      carrier_gas: 'helium',
      gas_saver: false,
      gas_saver_flow_ml_min: 20.0,
      gas_saver_delay_min: 2.0,
      pulse_pressure_kpa: 0,
      pulse_duration_min: 0
    };
    setMethodParameters({
      ...methodParameters,
      inlets: [...methodParameters.inlets, newInlet]
    });
  };
  
  const addColumn = () => {
    const newColumn = {
      column_id: `COL${methodParameters.columns.length + 1}`,
      length_m: 30.0,
      inner_diameter_mm: 0.25,
      film_thickness_um: 0.25,
      stationary_phase: 'DB-1',
      flow_mode: 'constant_flow',
      flow_ml_min: 1.0,
      average_velocity_cm_s: 0,
      backflush_enabled: false,
      backflush_start_min: 0,
      backflush_duration_min: 0
    };
    setMethodParameters({
      ...methodParameters,
      columns: [...methodParameters.columns, newColumn]
    });
  };
  
  const addDetector = () => {
    const newDetector = {
      detector_id: `FID${methodParameters.detectors.length + 1}`,
      detector_type: 'FID',
      temperature_c: 300,
      h2_flow_ml_min: 30,
      air_flow_ml_min: 300,
      makeup_flow_ml_min: 25,
      data_rate_hz: 50,
      attenuation: 0,
      offset: 0
    };
    setMethodParameters({
      ...methodParameters,
      detectors: [...methodParameters.detectors, newDetector]
    });
  };
  
  const addOvenStep = () => {
    const newStep = {
      step_number: methodParameters.oven_program.length + 1,
      temperature_c: 50,
      hold_time_min: 2.0,
      ramp_rate_c_min: 10.0,
      final_temperature_c: 300
    };
    setMethodParameters({
      ...methodParameters,
      oven_program: [...methodParameters.oven_program, newStep]
    });
  };
  
  const addAnalyte = () => {
    const newAnalyte = {
      name: `Analyte_${sampleProfile.analytes.length + 1}`,
      concentration_ppm: 100,
      retention_factor: 2.0,
      diffusion_coefficient: 0.05,
      response_factor: 1.0
    };
    setSampleProfile({
      ...sampleProfile,
      analytes: [...sampleProfile.analytes, newAnalyte]
    });
  };
  
  // Preset management
  const savePreset = async () => {
    const presetName = prompt('Enter preset name:');
    if (!presetName) return;
    
    try {
      const response = await fetch(`/api/gc-sandbox/presets/save?preset_name=${encodeURIComponent(presetName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(methodParameters)
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Preset saved successfully', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save preset', severity: 'error' });
    }
  };
  
  const loadPresets = async () => {
    try {
      const response = await fetch('/api/gc-sandbox/presets');
      const data = await response.json();
      setPresetDialog({ open: true, mode: 'load', presets: data.presets || [] });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load presets', severity: 'error' });
    }
  };
  
  // Render chromatogram chart
  const renderChromatogram = () => {
    if (!simulationResult?.chromatograms?.length) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <Typography variant="h6" color="textSecondary">
            No chromatogram data available
          </Typography>
        </Box>
      );
    }
    
    const chartData = {
      datasets: simulationResult.chromatograms.map((chrom, index) => ({
        label: `${chrom.detector_id} (${chrom.detector_type})`,
        data: chrom.time_min.map((time, i) => ({
          x: time,
          y: chrom.intensity[i]
        })),
        borderColor: `hsl(${index * 120}, 70%, 50%)`,
        backgroundColor: `hsl(${index * 120}, 70%, 50%, 0.1)`,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2
      }))
    };
    
    return (
      <Box height={400}>
        <Line data={chartData} options={chartOptions} />
      </Box>
    );
  };
  
  // Render method profile charts
  const renderMethodProfile = () => {
    if (!simulationResult) return null;
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Oven Temperature</Typography>
              <Box height={250}>
                {simulationResult.oven_temperature_series && (
                  <Line
                    data={{
                      datasets: [{
                        label: 'Temperature (°C)',
                        data: simulationResult.oven_temperature_series.time_min.map((time, i) => ({
                          x: time,
                          y: simulationResult.oven_temperature_series.values[i]
                        })),
                        borderColor: 'red',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: false } },
                      scales: {
                        x: chartOptions.scales.x,
                        y: { ...chartOptions.scales.y, title: { display: true, text: 'Temperature (°C)' } }
                      }
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Flow Rates</Typography>
              <Box height={250}>
                {simulationResult.flow_series && (
                  <Line
                    data={{
                      datasets: simulationResult.flow_series.map((flow, index) => ({
                        label: flow.series_id.replace('_flow', ''),
                        data: flow.time_min.map((time, i) => ({
                          x: time,
                          y: flow.values[i]
                        })),
                        borderColor: `hsl(${index * 90}, 70%, 50%)`,
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 2
                      }))
                    }}
                    options={{
                      ...chartOptions,
                      plugins: { ...chartOptions.plugins, title: { display: false } },
                      scales: {
                        x: chartOptions.scales.x,
                        y: { ...chartOptions.scales.y, title: { display: true, text: 'Flow Rate (mL/min)' } }
                      }
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        GC Instrument Sandbox
      </Typography>
      
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <Button
          variant="contained"
          color="primary"
          startIcon={simulationRunning ? <CircularProgress size={20} /> : <PlayIcon />}
          onClick={runSimulation}
          disabled={simulationRunning}
          size="large"
        >
          {simulationRunning ? 'Running Simulation...' : 'Run Simulation'}
        </Button>
        
        <Button startIcon={<SaveIcon />} onClick={savePreset}>
          Save Preset
        </Button>
        
        <Button startIcon={<UploadIcon />} onClick={loadPresets}>
          Load Preset
        </Button>
        
        {simulationResult && (
          <>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => window.open(`/api/gc-sandbox/results/${simulationResult.run_id}/export/chromatogram.png`)}
            >
              Export PNG
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => window.open(`/api/gc-sandbox/results/${simulationResult.run_id}/export/kpis.csv`)}
            >
              Export CSV
            </Button>
          </>
        )}
      </Box>
      
      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
        <Tab label="Method Parameters" />
        <Tab label="Sample Profile" />
        <Tab label="Results" />
        <Tab label="Method Profile" />
        <Tab label="Settings" />
      </Tabs>
      
      {/* Method Parameters Tab */}
      {currentTab === 0 && (
        <Box mt={3}>
          <Grid container spacing={3}>
            {/* Inlets Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">Inlets</Typography>
                    <Button size="small" onClick={addInlet}>Add Inlet</Button>
                  </Box>
                  
                  {methodParameters.inlets.map((inlet, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{inlet.inlet_id} - {inlet.inlet_type}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Inlet ID"
                              value={inlet.inlet_id}
                              onChange={(e) => updateInletParameter(index, 'inlet_id', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Inlet Type</InputLabel>
                              <Select
                                value={inlet.inlet_type}
                                onChange={(e) => updateInletParameter(index, 'inlet_type', e.target.value)}
                              >
                                <MenuItem value="split">Split</MenuItem>
                                <MenuItem value="splitless">Splitless</MenuItem>
                                <MenuItem value="direct">Direct</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Temperature (°C)"
                              type="number"
                              value={inlet.temperature_c}
                              onChange={(e) => updateInletParameter(index, 'temperature_c', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Split Ratio"
                              type="number"
                              value={inlet.split_ratio}
                              onChange={(e) => updateInletParameter(index, 'split_ratio', parseFloat(e.target.value))}
                              disabled={inlet.inlet_type !== 'split'}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Total Flow (mL/min)"
                              type="number"
                              value={inlet.total_flow_ml_min}
                              onChange={(e) => updateInletParameter(index, 'total_flow_ml_min', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Carrier Gas</InputLabel>
                              <Select
                                value={inlet.carrier_gas}
                                onChange={(e) => updateInletParameter(index, 'carrier_gas', e.target.value)}
                              >
                                <MenuItem value="helium">Helium</MenuItem>
                                <MenuItem value="hydrogen">Hydrogen</MenuItem>
                                <MenuItem value="nitrogen">Nitrogen</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={inlet.gas_saver}
                                  onChange={(e) => updateInletParameter(index, 'gas_saver', e.target.checked)}
                                />
                              }
                              label="Gas Saver"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Columns Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">Columns</Typography>
                    <Button size="small" onClick={addColumn}>Add Column</Button>
                  </Box>
                  
                  {methodParameters.columns.map((column, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{column.column_id} - {column.stationary_phase}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Column ID"
                              value={column.column_id}
                              onChange={(e) => updateColumnParameter(index, 'column_id', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Length (m)"
                              type="number"
                              value={column.length_m}
                              onChange={(e) => updateColumnParameter(index, 'length_m', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="ID (mm)"
                              type="number"
                              step="0.01"
                              value={column.inner_diameter_mm}
                              onChange={(e) => updateColumnParameter(index, 'inner_diameter_mm', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Film Thickness (μm)"
                              type="number"
                              step="0.01"
                              value={column.film_thickness_um}
                              onChange={(e) => updateColumnParameter(index, 'film_thickness_um', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth>
                              <InputLabel>Stationary Phase</InputLabel>
                              <Select
                                value={column.stationary_phase}
                                onChange={(e) => updateColumnParameter(index, 'stationary_phase', e.target.value)}
                              >
                                <MenuItem value="DB-1">DB-1 (100% dimethylpolysiloxane)</MenuItem>
                                <MenuItem value="DB-5">DB-5 (5% phenyl 95% dimethylpolysiloxane)</MenuItem>
                                <MenuItem value="DB-WAX">DB-WAX (polyethylene glycol)</MenuItem>
                                <MenuItem value="HP-PLOT-Q">HP-PLOT-Q (porous polymer)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <FormControl fullWidth>
                              <InputLabel>Flow Mode</InputLabel>
                              <Select
                                value={column.flow_mode}
                                onChange={(e) => updateColumnParameter(index, 'flow_mode', e.target.value)}
                              >
                                <MenuItem value="constant_flow">Constant Flow</MenuItem>
                                <MenuItem value="constant_pressure">Constant Pressure</MenuItem>
                                <MenuItem value="constant_velocity">Constant Velocity</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <TextField
                              fullWidth
                              label="Flow (mL/min)"
                              type="number"
                              step="0.1"
                              value={column.flow_ml_min}
                              onChange={(e) => updateColumnParameter(index, 'flow_ml_min', parseFloat(e.target.value))}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Detectors Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">Detectors</Typography>
                    <Button size="small" onClick={addDetector}>Add Detector</Button>
                  </Box>
                  
                  {methodParameters.detectors.map((detector, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{detector.detector_id} - {detector.detector_type}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Detector ID"
                              value={detector.detector_id}
                              onChange={(e) => updateDetectorParameter(index, 'detector_id', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControl fullWidth>
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={detector.detector_type}
                                onChange={(e) => updateDetectorParameter(index, 'detector_type', e.target.value)}
                              >
                                <MenuItem value="FID">FID (Flame Ionization)</MenuItem>
                                <MenuItem value="TCD">TCD (Thermal Conductivity)</MenuItem>
                                <MenuItem value="SCD">SCD (Sulfur Chemiluminescence)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Temperature (°C)"
                              type="number"
                              value={detector.temperature_c}
                              onChange={(e) => updateDetectorParameter(index, 'temperature_c', parseFloat(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              fullWidth
                              label="Data Rate (Hz)"
                              type="number"
                              value={detector.data_rate_hz}
                              onChange={(e) => updateDetectorParameter(index, 'data_rate_hz', parseFloat(e.target.value))}
                            />
                          </Grid>
                          
                          {detector.detector_type === 'FID' && (
                            <>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  label="H₂ Flow (mL/min)"
                                  type="number"
                                  value={detector.h2_flow_ml_min || 30}
                                  onChange={(e) => updateDetectorParameter(index, 'h2_flow_ml_min', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  label="Air Flow (mL/min)"
                                  type="number"
                                  value={detector.air_flow_ml_min || 300}
                                  onChange={(e) => updateDetectorParameter(index, 'air_flow_ml_min', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  label="Makeup Flow (mL/min)"
                                  type="number"
                                  value={detector.makeup_flow_ml_min || 25}
                                  onChange={(e) => updateDetectorParameter(index, 'makeup_flow_ml_min', parseFloat(e.target.value))}
                                />
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Oven Program Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">Oven Temperature Program</Typography>
                    <Button size="small" onClick={addOvenStep}>Add Step</Button>
                  </Box>
                  
                  {methodParameters.oven_program.map((step, index) => (
                    <Box key={index} mb={2} p={2} border="1px solid #e0e0e0" borderRadius={1}>
                      <Typography variant="subtitle1" mb={2}>Step {step.step_number}</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            label="Temperature (°C)"
                            type="number"
                            value={step.temperature_c}
                            onChange={(e) => updateOvenStep(index, 'temperature_c', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            label="Hold Time (min)"
                            type="number"
                            step="0.1"
                            value={step.hold_time_min}
                            onChange={(e) => updateOvenStep(index, 'hold_time_min', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            label="Ramp Rate (°C/min)"
                            type="number"
                            step="0.1"
                            value={step.ramp_rate_c_min}
                            onChange={(e) => updateOvenStep(index, 'ramp_rate_c_min', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            label="Final Temp (°C)"
                            type="number"
                            value={step.final_temperature_c}
                            onChange={(e) => updateOvenStep(index, 'final_temperature_c', parseFloat(e.target.value))}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Sample Profile Tab */}
      {currentTab === 1 && (
        <Box mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Sample Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        label="Sample ID"
                        value={sampleProfile.sample_id}
                        onChange={(e) => setSampleProfile({ ...sampleProfile, sample_id: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        label="Injection Volume (μL)"
                        type="number"
                        step="0.1"
                        value={sampleProfile.injection_volume_ul}
                        onChange={(e) => setSampleProfile({ ...sampleProfile, injection_volume_ul: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Solvent</InputLabel>
                        <Select
                          value={sampleProfile.solvent}
                          onChange={(e) => setSampleProfile({ ...sampleProfile, solvent: e.target.value })}
                        >
                          <MenuItem value="none">None</MenuItem>
                          <MenuItem value="methanol">Methanol</MenuItem>
                          <MenuItem value="acetone">Acetone</MenuItem>
                          <MenuItem value="hexane">Hexane</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Matrix</InputLabel>
                        <Select
                          value={sampleProfile.matrix}
                          onChange={(e) => setSampleProfile({ ...sampleProfile, matrix: e.target.value })}
                        >
                          <MenuItem value="gas">Gas</MenuItem>
                          <MenuItem value="liquid">Liquid</MenuItem>
                          <MenuItem value="solid">Solid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">Analytes</Typography>
                    <Button size="small" onClick={addAnalyte}>Add Analyte</Button>
                  </Box>
                  
                  {sampleProfile.analytes.map((analyte, index) => (
                    <Box key={index} mb={2} p={2} border="1px solid #e0e0e0" borderRadius={1}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Analyte Name"
                            value={analyte.name}
                            onChange={(e) => updateAnalyte(index, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            label="Concentration (ppm)"
                            type="number"
                            value={analyte.concentration_ppm}
                            onChange={(e) => updateAnalyte(index, 'concentration_ppm', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            label="Retention Factor"
                            type="number"
                            step="0.1"
                            value={analyte.retention_factor}
                            onChange={(e) => updateAnalyte(index, 'retention_factor', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            label="Diffusion Coeff"
                            type="number"
                            step="0.01"
                            value={analyte.diffusion_coefficient}
                            onChange={(e) => updateAnalyte(index, 'diffusion_coefficient', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            label="Response Factor"
                            type="number"
                            step="0.1"
                            value={analyte.response_factor}
                            onChange={(e) => updateAnalyte(index, 'response_factor', parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            color="error"
                            onClick={() => {
                              const newAnalytes = sampleProfile.analytes.filter((_, i) => i !== index);
                              setSampleProfile({ ...sampleProfile, analytes: newAnalytes });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Results Tab */}
      {currentTab === 2 && (
        <Box mt={3}>
          {resultLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : simulationResult ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Chromatogram</Typography>
                    {renderChromatogram()}
                  </CardContent>
                </Card>
              </Grid>
              
              {simulationResult.kpis && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" mb={2}>Analysis Results</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Chip
                            label={`Total Peaks: ${simulationResult.kpis.total_peaks}`}
                            color="primary"
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Chip
                            label={`Avg Resolution: ${simulationResult.kpis.average_resolution?.toFixed(2)}`}
                            color="secondary"
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Chip
                            label={`Run Time: ${simulationResult.kpis.actual_run_time_min?.toFixed(1)} min`}
                            color="success"
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Chip
                            label={`Simulation: ${simulationResult.simulation_time_ms?.toFixed(1)} ms`}
                            color="info"
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>
                      
                      {simulationResult.kpis.peak_kpis && simulationResult.kpis.peak_kpis.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle1" mb={1}>Peak Details</Typography>
                          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Peak</th>
                                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Analyte</th>
                                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>RT (min)</th>
                                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Area</th>
                                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Area %</th>
                                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>S/N</th>
                                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Resolution</th>
                                </tr>
                              </thead>
                              <tbody>
                                {simulationResult.kpis.peak_kpis.map((peak, index) => (
                                  <tr key={index}>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{peak.peak_number}</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{peak.analyte_name}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{peak.retention_time_min?.toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{peak.peak_area?.toFixed(0)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{peak.area_percent?.toFixed(1)}%</td>
                                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{peak.signal_to_noise_ratio?.toFixed(1)}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>
                                      {peak.resolution_from_previous?.toFixed(2) || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="info">
              No simulation results available. Run a simulation to see results here.
            </Alert>
          )}
        </Box>
      )}
      
      {/* Method Profile Tab */}
      {currentTab === 3 && (
        <Box mt={3}>
          {simulationResult ? (
            renderMethodProfile()
          ) : (
            <Alert severity="info">
              No method profile data available. Run a simulation to see method profile here.
            </Alert>
          )}
        </Box>
      )}
      
      {/* Settings Tab */}
      {currentTab === 4 && (
        <Box mt={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Simulation Options</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={simulationOptions.include_noise}
                        onChange={(e) => setSimulationOptions({
                          ...simulationOptions,
                          include_noise: e.target.checked
                        })}
                      />
                    }
                    label="Include Detector Noise"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={simulationOptions.include_baseline_drift}
                        onChange={(e) => setSimulationOptions({
                          ...simulationOptions,
                          include_baseline_drift: e.target.checked
                        })}
                      />
                    }
                    label="Include Baseline Drift"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Simulation Seed"
                    type="number"
                    value={simulationOptions.simulation_seed}
                    onChange={(e) => setSimulationOptions({
                      ...simulationOptions,
                      simulation_seed: parseInt(e.target.value)
                    })}
                    helperText="For reproducible results"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={simulationOptions.export_csv}
                        onChange={(e) => setSimulationOptions({
                          ...simulationOptions,
                          export_csv: e.target.checked
                        })}
                      />
                    }
                    label="Auto-Export CSV"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={simulationOptions.export_png}
                        onChange={(e) => setSimulationOptions({
                          ...simulationOptions,
                          export_png: e.target.checked
                        })}
                      />
                    }
                    label="Auto-Export PNG"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
      
      {/* Preset Dialog */}
      <Dialog
        open={presetDialog.open}
        onClose={() => setPresetDialog({ ...presetDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {presetDialog.mode === 'save' ? 'Save Preset' : 'Load Preset'}
        </DialogTitle>
        <DialogContent>
          {presetDialog.mode === 'load' && (
            <List>
              {presetDialog.presets.map((preset, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/gc-sandbox/presets/${preset.name}`);
                      const presetData = await response.json();
                      setMethodParameters(presetData);
                      setPresetDialog({ ...presetDialog, open: false });
                      setSnackbar({ open: true, message: 'Preset loaded successfully', severity: 'success' });
                    } catch (error) {
                      setSnackbar({ open: true, message: 'Failed to load preset', severity: 'error' });
                    }
                  }}
                >
                  <ListItemText
                    primary={preset.name}
                    secondary={preset.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPresetDialog({ ...presetDialog, open: false })}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GCInstrumentSandbox;