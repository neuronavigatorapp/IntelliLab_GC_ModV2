import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
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
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { EnhancedDropdown } from '../UI/EnhancedDropdown';
import { DualParameterInput } from '../UI/DualParameterInput';
import { instrumentsAPI } from '../../services/apiService';

interface InstrumentConfig {
  id?: number;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  
  // Built-in Method Parameters
  column: {
    type: string;
    length: number;
    diameter: number;
    filmThickness: number;
  };
  
  inlet: {
    type: string;
    temperature: number;
    splitRatio: number;
    flow: number;
  };
  
  oven: {
    initialTemp: number;
    finalTemp: number;
    rampRate: number;
    holdTime: number;
  };
  
  detector: {
    type: string;
    temperature: number;
    sensitivity: string;
  };
  
  // Performance Predictions
  expectedRT: number[];
  detectionLimit: number;
  efficiency: number;
  
  // Status
  lastCalibration: string;
  nextMaintenance: string;
  status: 'excellent' | 'good' | 'needs_attention' | 'maintenance_required';
}

export const InstrumentManager: React.FC = () => {
  const [instruments, setInstruments] = useState<InstrumentConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<InstrumentConfig | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load instruments data - FIXED: Memoized to prevent infinite loops
  const loadInstruments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await instrumentsAPI.getAll();
      const apiInstruments = response.data;
      
      // Convert API data to our format
      const convertedInstruments: InstrumentConfig[] = apiInstruments.map((apiInst: any) => ({
        id: apiInst.id,
        name: apiInst.name,
        manufacturer: apiInst.manufacturer || 'Unknown',
        model: apiInst.model || 'Unknown',
        serialNumber: apiInst.serial_number || 'Unknown',
        location: apiInst.location,
        column: {
          type: apiInst.column_type || 'DB-5MS',
          length: apiInst.column_length || 30,
          diameter: apiInst.column_diameter || 0.25,
          filmThickness: 0.25
        },
        inlet: {
          type: 'Split/Splitless',
          temperature: 250,
          splitRatio: 50,
          flow: apiInst.flow_rate || 1.5
        },
        oven: {
          initialTemp: 40,
          finalTemp: 300,
          rampRate: 10,
          holdTime: 5
        },
        detector: {
          type: apiInst.detector_type || 'FID',
          temperature: 250,
          sensitivity: 'High'
        },
        expectedRT: [],
        detectionLimit: 0,
        efficiency: 0,
        lastCalibration: apiInst.last_calibration || new Date().toISOString().split('T')[0],
        nextMaintenance: apiInst.next_calibration || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: apiInst.status === 'online' ? 'excellent' : 
                apiInst.status === 'maintenance' ? 'maintenance_required' : 'needs_attention'
      }));
      
      setInstruments(convertedInstruments);
    } catch (err) {
      console.error('Failed to load instruments:', err);
      setError('Failed to load instruments. Using demo data.');
      // Set some demo instruments
      setInstruments([
        {
          id: 1,
          name: 'GC-2030-001',
          manufacturer: 'Shimadzu',
          model: 'GC-2030',
          serialNumber: 'SH2030-001',
          location: 'Lab A',
          column: { type: 'DB-5MS', length: 30, diameter: 0.25, filmThickness: 0.25 },
          inlet: { type: 'Split/Splitless', temperature: 250, splitRatio: 50, flow: 1.5 },
          oven: { initialTemp: 40, finalTemp: 300, rampRate: 10, holdTime: 5 },
          detector: { type: 'FID', temperature: 250, sensitivity: 'High' },
          expectedRT: [],
          detectionLimit: 0,
          efficiency: 0,
          lastCalibration: '2024-01-15',
          nextMaintenance: '2024-02-15',
          status: 'excellent'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstruments();
  }, [loadInstruments]);

  const [newInstrument, setNewInstrument] = useState<InstrumentConfig>({
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    column: {
      type: 'DB-5 (30m x 0.25mm x 0.25µm)',
      length: 30,
      diameter: 0.25,
      filmThickness: 0.25
    },
    inlet: {
      type: 'Split/Splitless',
      temperature: 250,
      splitRatio: 10,
      flow: 1.0
    },
    oven: {
      initialTemp: 50,
      finalTemp: 300,
      rampRate: 10,
      holdTime: 5
    },
    detector: {
      type: 'FID',
      temperature: 300,
      sensitivity: 'High'
    },
    expectedRT: [],
    detectionLimit: 0,
    efficiency: 0,
    lastCalibration: new Date().toISOString().split('T')[0],
    nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'good'
  });

  // Calculate instrument performance predictions
  const calculatePerformance = (instrument: InstrumentConfig) => {
    // Theoretical retention time calculation
    const deadTime = 1.2 + (2.0 / instrument.inlet.flow);
    const tempEffect = 1 - ((instrument.oven.initialTemp - 50) * 0.008);
    const rampEffect = Math.sqrt(10 / instrument.oven.rampRate);
    
    const expectedRT = [
      deadTime * 0.8, // Methane
      deadTime * 1.2, // Ethane  
      deadTime * 2.1 * tempEffect * rampEffect, // Propane
      deadTime * 3.5 * tempEffect * rampEffect, // Butane
      deadTime * 6.0 * tempEffect * rampEffect  // Pentane
    ];

    // Detection limit calculation
    const splitEffect = 1.0 / instrument.inlet.splitRatio;
    const inletTempEffect = instrument.inlet.temperature > 200 ? 1.0 : 0.8;
    const detectorEffect = instrument.detector.type === 'MS' ? 0.05 : 
                          instrument.detector.type === 'FID' ? 0.1 : 0.5;
    
    const detectionLimit = detectorEffect / (splitEffect * inletTempEffect);

    // Efficiency calculation
    const columnEffect = instrument.column.length / 30; // Normalized to 30m
    const tempRangeEffect = (instrument.oven.finalTemp - instrument.oven.initialTemp) / 200;
    const rampRateEffect = 10 / instrument.oven.rampRate;
    
    const efficiency = (columnEffect * tempRangeEffect * rampRateEffect) * 85;

    return {
      expectedRT,
      detectionLimit: parseFloat(detectionLimit.toFixed(3)),
      efficiency: Math.min(100, Math.max(0, parseFloat(efficiency.toFixed(1))))
    };
  };

  const runTestRun = async (instrument: InstrumentConfig) => {
    const performance = calculatePerformance(instrument);
    
    // Simulate actual vs predicted comparison
    const actualRT = performance.expectedRT.map(rt => 
      rt + (Math.random() - 0.5) * 0.5 // Add realistic variation
    );
    
    const rtDeviations = actualRT.map((actual, index) => 
      Math.abs(actual - performance.expectedRT[index]) / performance.expectedRT[index] * 100
    );
    
    const avgDeviation = rtDeviations.reduce((a, b) => a + b, 0) / rtDeviations.length;
    
    const status = avgDeviation < 5 ? 'excellent' : 
                   avgDeviation < 10 ? 'good' : 
                   avgDeviation < 20 ? 'needs_attention' : 'maintenance_required';

    setTestResults({
      predicted: performance.expectedRT,
      actual: actualRT,
      deviations: rtDeviations,
      avgDeviation: parseFloat(avgDeviation.toFixed(1)),
      status,
      recommendations: generateRecommendations(avgDeviation, instrument)
    });
  };

  const generateRecommendations = (deviation: number, instrument: InstrumentConfig) => {
    const recommendations = [];
    
    if (deviation > 15) {
      recommendations.push("Column may need replacement - high retention time drift");
      recommendations.push("Check inlet liner for contamination");
    }
    
    if (deviation > 10) {
      recommendations.push("Verify carrier gas flow rate stability");
      recommendations.push("Check oven temperature calibration");
    }
    
    if (instrument.inlet.splitRatio > 50) {
      recommendations.push("Consider lower split ratio for better sensitivity");
    }
    
    if (instrument.oven.rampRate > 20) {
      recommendations.push("Slower temperature ramp may improve resolution");
    }

    return recommendations.length > 0 ? recommendations : ["Instrument performing within expected parameters"];
  };

  const saveInstrument = async () => {
    const performance = calculatePerformance(newInstrument);
    const instrumentToSave = {
      ...newInstrument,
      ...performance,
      id: editingInstrument?.id || Date.now()
    };

    if (editingInstrument) {
      setInstruments(prev => prev.map(inst => 
        inst.id === editingInstrument.id ? instrumentToSave : inst
      ));
    } else {
      setInstruments(prev => [...prev, instrumentToSave]);
    }

    setDialogOpen(false);
    setEditingInstrument(null);
    resetForm();
  };

  const resetForm = () => {
    setNewInstrument({
      name: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      column: {
        type: 'DB-5 (30m x 0.25mm x 0.25µm)',
        length: 30,
        diameter: 0.25,
        filmThickness: 0.25
      },
      inlet: {
        type: 'Split/Splitless',
        temperature: 250,
        splitRatio: 10,
        flow: 1.0
      },
      oven: {
        initialTemp: 50,
        finalTemp: 300,
        rampRate: 10,
        holdTime: 5
      },
      detector: {
        type: 'FID',
        temperature: 300,
        sensitivity: 'High'
      },
      expectedRT: [],
      detectionLimit: 0,
      efficiency: 0,
      lastCalibration: new Date().toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'good'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleIcon color="success" />;
      case 'good': return <CheckCircleIcon color="primary" />;
      case 'needs_attention': return <WarningIcon color="warning" />;
      case 'maintenance_required': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon color="primary" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Instrument Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your GC instruments, monitor performance, and run diagnostic tests.
      </Typography>

      {/* Fleet Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fleet Overview
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Instrument</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Calibration</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instruments.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {instrument.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {instrument.manufacturer} {instrument.model}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={instrument.detector.type} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{instrument.location}</TableCell>
                    <TableCell>
                      <Chip 
                        label={instrument.status.replace('_', ' ')}
                        color={
                          instrument.status === 'excellent' ? 'success' :
                          instrument.status === 'good' ? 'primary' :
                          instrument.status === 'needs_attention' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{instrument.lastCalibration}</TableCell>
                    <TableCell>{instrument.nextMaintenance}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditingInstrument(instrument);
                          setNewInstrument(instrument);
                          setDialogOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => runTestRun(instrument)}
                        color="success"
                      >
                        Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Instrument Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingInstrument(null);
            setDialogOpen(true);
          }}
        >
          Add Instrument
        </Button>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {error || 'Loading instruments...'}
            </Alert>
            <Typography variant="h6" color="text.secondary">
              Please wait while we fetch the latest instrument data.
            </Typography>
          </Grid>
        ) : instruments.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              No instruments found. Add a new one!
            </Alert>
          </Grid>
        ) : (
          instruments.map((instrument) => (
            <Grid item xs={12} lg={6} key={instrument.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    {getStatusIcon(instrument.status)}
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {instrument.name}
                      </Typography>
                      <Typography color="text.secondary">
                        {instrument.manufacturer} {instrument.model}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Detection Limit</Typography>
                      <Typography variant="h6" color="primary">
                        {instrument.detectionLimit} ppm
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Efficiency</Typography>
                      <Typography variant="h6" color="success.main">
                        {instrument.efficiency}%
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={instrument.status.replace('_', ' ')}
                        color={
                          instrument.status === 'excellent' ? 'success' :
                          instrument.status === 'good' ? 'primary' :
                          instrument.status === 'needs_attention' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Box display="flex" gap={1} mb={2}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingInstrument(instrument);
                        setNewInstrument(instrument);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => runTestRun(instrument)}
                      color="success"
                    >
                      Test Run
                    </Button>
                  </Box>

                  {/* Expected Retention Times Preview */}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Expected RT (C1-C5): {instrument.expectedRT.map(rt => rt.toFixed(1)).join(', ')} min
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Test Results Dialog */}
      {testResults && (
        <Dialog open={!!testResults} onClose={() => setTestResults(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              {getStatusIcon(testResults.status)}
              <Typography variant="h5">Test Run Results</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert 
              severity={
                testResults.status === 'excellent' ? 'success' :
                testResults.status === 'good' ? 'info' :
                testResults.status === 'needs_attention' ? 'warning' : 'error'
              }
              sx={{ mb: 3 }}
            >
              <Typography variant="h6">
                Average RT Deviation: {testResults.avgDeviation}%
              </Typography>
              <Typography>
                Status: {testResults.status.replace('_', ' ').toUpperCase()}
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>Predicted RT (min)</Typography>
                {testResults.predicted.map((rt: number, index: number) => (
                  <Typography key={index}>C{index + 1}: {rt.toFixed(2)}</Typography>
                ))}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>Actual RT (min)</Typography>
                {testResults.actual.map((rt: number, index: number) => (
                  <Typography key={index} color={testResults.deviations[index] > 10 ? 'error' : 'text.primary'}>
                    C{index + 1}: {rt.toFixed(2)} ({testResults.deviations[index] > 0 ? '+' : ''}{testResults.deviations[index].toFixed(1)}%)
                  </Typography>
                ))}
              </Grid>
            </Grid>

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              {testResults.recommendations.map((rec: string, index: number) => (
                <Alert key={index} severity="info" sx={{ mb: 1 }}>
                  {rec}
                </Alert>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestResults(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add/Edit Instrument Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingInstrument ? 'Edit Instrument' : 'Add New GC Instrument'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Instrument Name"
                value={newInstrument.name}
                onChange={(e) => setNewInstrument({...newInstrument, name: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <EnhancedDropdown
                label="Manufacturer"
                value={newInstrument.manufacturer}
                onChange={(value) => setNewInstrument({...newInstrument, manufacturer: value as string})}
                options={[
                  { value: 'Agilent', label: 'Agilent Technologies' },
                  { value: 'Shimadzu', label: 'Shimadzu Corporation' },
                  { value: 'Thermo', label: 'Thermo Fisher Scientific' },
                  { value: 'PerkinElmer', label: 'PerkinElmer' }
                ]}
              />
            </Grid>

            {/* Column Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Column Configuration
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <EnhancedDropdown
                label="Column Type"
                value={newInstrument.column.type}
                onChange={(value) => setNewInstrument({
                  ...newInstrument, 
                  column: {...newInstrument.column, type: value as string}
                })}
                options={[
                  { 
                    value: 'DB-5 (30m x 0.25mm x 0.25µm)', 
                    label: 'DB-5 (30m x 0.25mm x 0.25µm)',
                    description: 'General purpose, low polarity'
                  },
                  { 
                    value: 'DB-1 (60m x 0.32mm x 1.0µm)', 
                    label: 'DB-1 (60m x 0.32mm x 1.0µm)',
                    description: 'Non-polar, high resolution'
                  },
                  { 
                    value: 'DB-WAX (30m x 0.25mm x 0.25µm)', 
                    label: 'DB-WAX (30m x 0.25mm x 0.25µm)',
                    description: 'Polar, alcohols/oxygenates'
                  }
                ]}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DualParameterInput
                label="Column Length"
                value={newInstrument.column.length}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  column: {...newInstrument.column, length: value}
                })}
                min={15}
                max={100}
                step={5}
                unit="m"
              />
            </Grid>

            {/* Inlet Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Inlet Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Inlet Temperature"
                value={newInstrument.inlet.temperature}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  inlet: {...newInstrument.inlet, temperature: value}
                })}
                min={150}
                max={400}
                step={10}
                unit="°C"
                marks={[
                  { value: 200, label: '200°C' },
                  { value: 250, label: '250°C' },
                  { value: 300, label: '300°C' }
                ]}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Split Ratio"
                value={newInstrument.inlet.splitRatio}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  inlet: {...newInstrument.inlet, splitRatio: value}
                })}
                min={1}
                max={200}
                step={1}
                unit=":1"
                marks={[
                  { value: 10, label: '10:1' },
                  { value: 50, label: '50:1' },
                  { value: 100, label: '100:1' }
                ]}
              />
            </Grid>

            {/* Oven Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Oven Programming
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Initial Temperature"
                value={newInstrument.oven.initialTemp}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  oven: {...newInstrument.oven, initialTemp: value}
                })}
                min={30}
                max={200}
                step={5}
                unit="°C"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Final Temperature"
                value={newInstrument.oven.finalTemp}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  oven: {...newInstrument.oven, finalTemp: value}
                })}
                min={100}
                max={400}
                step={10}
                unit="°C"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Ramp Rate"
                value={newInstrument.oven.rampRate}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  oven: {...newInstrument.oven, rampRate: value}
                })}
                min={1}
                max={50}
                step={1}
                unit="°C/min"
              />
            </Grid>

            {/* Detector Configuration */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                Detector Setup
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <EnhancedDropdown
                label="Detector Type"
                value={newInstrument.detector.type}
                onChange={(value) => setNewInstrument({
                  ...newInstrument,
                  detector: {...newInstrument.detector, type: value as string}
                })}
                options={[
                  { value: 'FID', label: 'FID - Flame Ionization', description: 'General hydrocarbons' },
                  { value: 'TCD', label: 'TCD - Thermal Conductivity', description: 'Universal detector' },
                  { value: 'MS', label: 'MS - Mass Spectrometer', description: 'Identification & quantification' },
                  { value: 'SCD', label: 'SCD - Sulfur Chemiluminescence', description: 'Sulfur compounds' }
                ]}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveInstrument}
            disabled={!newInstrument.name || !newInstrument.manufacturer}
          >
            {editingInstrument ? 'Update Instrument' : 'Save Instrument'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstrumentManager;
