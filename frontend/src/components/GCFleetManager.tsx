import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tabs, Tab, Alert, Chip, Paper, Select, MenuItem, FormControl,
  InputLabel, LinearProgress, Divider
} from '@mui/material';
import {
  Add, Delete, TrendingUp, Warning, CheckCircle,
  Science, History, Build, Assessment
} from '@mui/icons-material';

interface PeakEntry {
  compound_name: string;
  elution_order: number;
  retention_time_min: number;
  peak_height: number;
  peak_area: number;
  peak_width_min: number;
  peak_width_half_height?: number;
  concentration_ppm?: number;
  tailing_factor?: number;
}

interface GCInstrument {
  id: number;
  serial_number: string;
  manufacturer: string;
  model: string;
  location: string;
  status: string;
  total_runs: number;
  runtime_hours: number;
  last_run: string | null;
  recent_runs_30d: number;
  days_since_pm: number | null;
}

export const GCFleetManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [instruments, setInstruments] = useState<GCInstrument[]>([]);
  const [selectedGC, setSelectedGC] = useState<string>('');
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [peaks, setPeaks] = useState<PeakEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Registration fields
  const [newSerial, setNewSerial] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  // Run parameters
  const [sequenceName, setSequenceName] = useState('');
  const [methodName, setMethodName] = useState('');
  const [operator, setOperator] = useState('');
  const [sampleType, setSampleType] = useState('Sample');
  const [columnType, setColumnType] = useState('DB-5MS');
  const [columnLength, setColumnLength] = useState(30);
  const [columnID, setColumnID] = useState(0.25);
  const [carrierGas, setCarrierGas] = useState('Helium');
  const [flowRate, setFlowRate] = useState(1.2);
  const [inletTemp, setInletTemp] = useState(250);
  const [inletPressure, setInletPressure] = useState(25);
  const [ovenInitial, setOvenInitial] = useState(40);
  const [ovenFinal, setOvenFinal] = useState(300);
  const [rampRate, setRampRate] = useState(10);
  const [detectorType, setDetectorType] = useState('FID');
  const [detectorTemp, setDetectorTemp] = useState(300);
  const [baselineNoise, setBaselineNoise] = useState(20);
  const [baselineDrift, setBaselineDrift] = useState(5);

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/instruments/list');
      const data = await response.json();
      setInstruments(data);
    } catch (error) {
      console.error('Failed to load instruments:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerGC = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/instruments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: newSerial,
          manufacturer: newManufacturer,
          model: newModel,
          location: newLocation,
          purchase_date: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setRegisterDialogOpen(false);
        loadInstruments();
        // Clear fields
        setNewSerial('');
        setNewManufacturer('');
        setNewModel('');
        setNewLocation('');
      }
    } catch (error) {
      console.error('Failed to register GC:', error);
    }
  };

  const addPeak = () => {
    setPeaks([...peaks, {
      compound_name: '',
      elution_order: peaks.length + 1,
      retention_time_min: 0,
      peak_height: 0,
      peak_area: 0,
      peak_width_min: 0
    }]);
  };

  const updatePeak = (index: number, field: keyof PeakEntry, value: any) => {
    const updated = [...peaks];
    updated[index] = { ...updated[index], [field]: value };
    setPeaks(updated);
  };

  const removePeak = (index: number) => {
    const updated = peaks.filter((_, i) => i !== index);
    // Update elution order
    updated.forEach((peak, i) => {
      peak.elution_order = i + 1;
    });
    setPeaks(updated);
  };

  const submitRun = async () => {
    if (!selectedGC || peaks.length === 0) {
      alert('Please select a GC and add at least one peak');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/runs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument_serial: selectedGC,
          sequence_name: sequenceName,
          method_name: methodName,
          operator: operator,
          sample_type: sampleType,
          column_type: columnType,
          column_length_m: columnLength,
          column_id_mm: columnID,
          carrier_gas: carrierGas,
          flow_rate_ml_min: flowRate,
          inlet_temp_c: inletTemp,
          inlet_pressure_psi: inletPressure,
          oven_initial_temp_c: ovenInitial,
          oven_final_temp_c: ovenFinal,
          ramp_rate_c_min: rampRate,
          detector_type: detectorType,
          detector_temp_c: detectorTemp,
          baseline_noise_pa: baselineNoise,
          baseline_drift_pa_hr: baselineDrift,
          peaks: peaks
        })
      });

      if (response.ok) {
        setRunDialogOpen(false);
        setPeaks([]);
        loadInstruments();
        alert('Run data saved successfully');
      }
    } catch (error) {
      console.error('Failed to save run:', error);
      alert('Failed to save run data');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Maintenance': return 'warning';
      case 'Retired': return 'error';
      default: return 'default';
    }
  };

  const getPMStatus = (days: number | null) => {
    if (!days) return { color: 'info', text: 'No PM recorded' };
    if (days > 180) return { color: 'error', text: `${days} days overdue` };
    if (days > 150) return { color: 'warning', text: `PM due soon (${180-days} days)` };
    return { color: 'success', text: `${180-days} days until PM` };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        GC Fleet Manager
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Fleet Overview" icon={<Science />} />
        <Tab label="Add Run Data" icon={<Add />} />
        <Tab label="Performance Analysis" icon={<Assessment />} />
      </Tabs>

      {loading && <LinearProgress />}

      {activeTab === 0 && (
        <>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setRegisterDialogOpen(true)}
            sx={{ mb: 2 }}
          >
            Register New GC
          </Button>
          
          <Grid container spacing={3}>
            {instruments.map((gc) => (
              <Grid item xs={12} md={6} lg={4} key={gc.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{gc.serial_number}</Typography>
                      <Chip label={gc.status} color={getStatusColor(gc.status)} size="small" />
                    </Box>
                    
                    <Typography color="text.secondary">
                      {gc.manufacturer} {gc.model}
                    </Typography>
                    <Typography variant="body2">📍 {gc.location}</Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Total Runs</Typography>
                        <Typography variant="h6">{gc.total_runs}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Runtime</Typography>
                        <Typography variant="h6">{gc.runtime_hours}h</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last 30 days</Typography>
                        <Typography variant="h6">{gc.recent_runs_30d} runs</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last Run</Typography>
                        <Typography variant="body2">
                          {gc.last_run ? new Date(gc.last_run).toLocaleDateString() : 'Never'}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {gc.days_since_pm !== null && (
                      <Alert severity={getPMStatus(gc.days_since_pm).color as "error" | "success" | "info" | "warning"} sx={{ mt: 2 }}>
                        {getPMStatus(gc.days_since_pm).text}
                      </Alert>
                    )}
                    
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setSelectedGC(gc.serial_number);
                        setRunDialogOpen(true);
                      }}
                    >
                      Add Run Data
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quick Entry</Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select GC</InputLabel>
              <Select
                value={selectedGC}
                onChange={(e) => setSelectedGC(e.target.value)}
                label="Select GC"
              >
                {instruments.map((gc) => (
                  <MenuItem key={gc.id} value={gc.serial_number}>
                    {gc.serial_number} - {gc.manufacturer} {gc.model} ({gc.location})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedGC && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRunDialogOpen(true)}
                size="large"
              >
                Enter Run Data for {selectedGC}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Performance Analysis</Typography>
            <Typography color="text.secondary">
              Select a GC instrument and compound to analyze performance trends over time.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Performance analysis features will be available once you have run data in the system.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Register GC Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
        <DialogTitle>Register New GC Instrument</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Serial Number"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={registerGC}>Register</Button>
        </DialogActions>
      </Dialog>

      {/* Run Data Entry Dialog */}
      <Dialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Add GC Run Data - {selectedGC}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Sequence Name"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Method Name"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sample Type</InputLabel>
                <Select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  label="Sample Type"
                >
                  <MenuItem value="Sample">Sample</MenuItem>
                  <MenuItem value="QC">QC</MenuItem>
                  <MenuItem value="Blank">Blank</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Column Parameters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Column Type"
                value={columnType}
                onChange={(e) => setColumnType(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Length (m)"
                type="number"
                value={columnLength}
                onChange={(e) => setColumnLength(parseFloat(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="ID (mm)"
                type="number"
                value={columnID}
                onChange={(e) => setColumnID(parseFloat(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                label="Flow (mL/min)"
                type="number"
                value={flowRate}
                onChange={(e) => setFlowRate(parseFloat(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Carrier Gas</InputLabel>
                <Select
                  value={carrierGas}
                  onChange={(e) => setCarrierGas(e.target.value)}
                  label="Carrier Gas"
                >
                  <MenuItem value="Helium">Helium</MenuItem>
                  <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                  <MenuItem value="Nitrogen">Nitrogen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Peak Data</Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Compound</TableCell>
                  <TableCell>RT (min)</TableCell>
                  <TableCell>Height</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Width (min)</TableCell>
                  <TableCell>W½ (min)</TableCell>
                  <TableCell>Conc (ppm)</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {peaks.map((peak, index) => (
                  <TableRow key={index}>
                    <TableCell>{peak.elution_order}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={peak.compound_name}
                        onChange={(e) => updatePeak(index, 'compound_name', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.retention_time_min}
                        onChange={(e) => updatePeak(index, 'retention_time_min', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.peak_height}
                        onChange={(e) => updatePeak(index, 'peak_height', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.peak_area}
                        onChange={(e) => updatePeak(index, 'peak_area', parseFloat(e.target.value))}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.peak_width_min}
                        onChange={(e) => updatePeak(index, 'peak_width_min', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.peak_width_half_height || ''}
                        onChange={(e) => updatePeak(index, 'peak_width_half_height', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={peak.concentration_ppm || ''}
                        onChange={(e) => updatePeak(index, 'concentration_ppm', parseFloat(e.target.value))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removePeak(index)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button startIcon={<Add />} onClick={addPeak} sx={{ mt: 2 }}>
            Add Peak
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRun} disabled={peaks.length === 0}>
            Save Run Data ({peaks.length} peaks)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
