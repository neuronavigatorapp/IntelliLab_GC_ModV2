import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import TuneIcon from '@mui/icons-material/Tune';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LoadingButton from '@mui/lab/LoadingButton';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import { ChromatogramViewer } from '../Chromatography/ChromatogramViewer';
import { PeakTable } from '../Chromatography/PeakTable';
import { 
  instrumentsAPI, 
  methodsAPI, 
  compoundsAPI, 
  chromatographyAPI, 
  runsAPI, 
  sandboxAPI 
} from '../../services/apiService';
import CompoundCRUD from '../CRUD/CompoundCRUD';
import MethodCRUD from '../CRUD/MethodCRUD';
import InstrumentCRUD from '../CRUD/InstrumentCRUD';

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
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Instrument {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  location?: string;
}

interface Method {
  id: number;
  name: string;
  description?: string;
  method_type: string;
  parameters: any;
}

interface Compound {
  id: number;
  name: string;
  category?: string;
  retention_time: number;
  molecular_weight?: number;
  default_intensity: number;
  default_width: number;
}

interface Peak {
  id: string;
  rt: number;
  area: number;
  height: number;
  width: number;
  name?: string;
  snr?: number;
}

interface RunRecord {
  id?: number;
  sample_name: string;
  instrument_id?: number;
  method_id?: number;
  time: number[];
  signal: number[];
  peaks: Peak[];
  baseline?: number[];
  notes?: string;
  metadata?: any;
}

export const GCSandbox: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  
  // Data states
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [savedRuns, setSavedRuns] = useState<RunRecord[]>([]);
  
  // Selected values
  const [selectedInstrument, setSelectedInstrument] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [selectedCompounds, setSelectedCompounds] = useState<number[]>([]);
  const [sampleName, setSampleName] = useState('Sandbox Sample');
  
  // Current run
  const [currentRun, setCurrentRun] = useState<RunRecord | null>(null);
  
  // CRUD dialogs
  const [methodDialog, setMethodDialog] = useState({ open: false, editing: null as Method | null });
  const [compoundDialog, setCompoundDialog] = useState({ open: false, editing: null as Compound | null });
  const [instrumentDialog, setInstrumentDialog] = useState({ open: false, editing: null as Instrument | null });
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instrumentsRes, methodsRes, compoundsRes, runsRes] = await Promise.allSettled([
        instrumentsAPI.getAll(),
        methodsAPI.list(),
        compoundsAPI.list(),
        runsAPI.listRuns()
      ]);

      if (instrumentsRes.status === 'fulfilled') {
        setInstruments(instrumentsRes.value.data || []);
      }
      if (methodsRes.status === 'fulfilled') {
        setMethods(methodsRes.value.data || []);
      }
      if (compoundsRes.status === 'fulfilled') {
        setCompounds(compoundsRes.value.data || []);
      }
      if (runsRes.status === 'fulfilled') {
        setSavedRuns(runsRes.value.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRun = async () => {
    if (!selectedInstrument || !selectedMethod) {
      alert('Please select both instrument and method');
      return;
    }

    setRunLoading(true);
    try {
      const selectedCompoundData = selectedCompounds.map(id => 
        compounds.find(c => c.id === id)
      ).filter(Boolean);

      const response = await chromatographyAPI.quickRun({
        instrument_id: selectedInstrument,
        method_id: selectedMethod,
        sample_name: sampleName,
        compounds: selectedCompoundData
      });

      // Ensure peaks have ids
      const runWithPeakIds = {
        ...response.data,
        peaks: response.data.peaks?.map((peak: any, index: number) => ({
          ...peak,
          id: peak.id || `peak_${index}`
        })) || []
      };
      setCurrentRun(runWithPeakIds);
      setTabValue(2); // Switch to Results tab
    } catch (error) {
      console.error('Quick run failed:', error);
      alert('Quick run failed. Please try again.');
    } finally {
      setRunLoading(false);
    }
  };

  const handleSaveRun = async () => {
    if (!currentRun) return;

    try {
      const response = await runsAPI.createRun(currentRun);
      setSavedRuns(prev => [response.data, ...prev]);
      alert('Run saved successfully!');
    } catch (error) {
      console.error('Error saving run:', error);
      alert('Failed to save run');
    }
  };

  const handleLoadRun = (run: RunRecord) => {
    // Ensure peaks have ids when loading
    const runWithPeakIds = {
      ...run,
      peaks: run.peaks?.map((peak: any, index: number) => ({
        ...peak,
        id: peak.id || `peak_${index}`
      })) || []
    };
    setCurrentRun(runWithPeakIds);
    setTabValue(2);
    if (run.instrument_id) setSelectedInstrument(run.instrument_id);
    if (run.method_id) setSelectedMethod(run.method_id);
    setSampleName(run.sample_name);
  };

  const renderSetupTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScienceIcon sx={{ mr: 1 }} />
              Instrument Selection
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Instrument</InputLabel>
              <Select
                value={selectedInstrument || ''}
                onChange={(e) => setSelectedInstrument(Number(e.target.value))}
                data-cy="instrument-select"
              >
                {instruments.map((instrument) => (
                  <MenuItem key={instrument.id} value={instrument.id} data-cy="instrument-option">
                    {instrument.name} ({instrument.model})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={selectedMethod || ''}
                onChange={(e) => setSelectedMethod(Number(e.target.value))}
                data-cy="method-select"
              >
                {methods.map((method) => (
                  <MenuItem key={method.id} value={method.id} data-cy="method-option">
                    {method.name} ({method.method_type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Sample Name"
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              sx={{ mb: 2 }}
              data-cy="sample-name-input"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Compound Selection
            </Typography>
            
            <Autocomplete
              multiple
              options={compounds}
              value={compounds.filter(c => selectedCompounds.includes(c.id))}
              onChange={(_, newValue) => {
                setSelectedCompounds(newValue.map(c => c.id));
              }}
              getOptionLabel={(option) => `${option.name} (${option.retention_time} min)`}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select compounds for simulation"
                  helperText={`${selectedCompounds.length} compounds selected`}
                  data-cy="compounds-autocomplete"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} data-cy="compound-option" key={option.id}>
                  {option.name} ({option.retention_time} min)
                </li>
              )}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TuneIcon sx={{ mr: 1 }} />
              Quick Actions
            </Typography>

            <LoadingButton
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              loading={runLoading}
              onClick={handleQuickRun}
              disabled={!selectedInstrument || !selectedMethod}
              sx={{ mb: 2 }}
              data-cy="run-simulation-button"
            >
              Run Simulation
            </LoadingButton>

            {currentRun && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveRun}
                sx={{ mb: 2 }}
                data-cy="save-run-button"
              >
                Save Current Run
              </Button>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Quick Configuration Summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} data-cy="config-summary">
              {selectedInstrument && (
                <Chip 
                  label={instruments.find(i => i.id === selectedInstrument)?.name || 'Unknown'} 
                  size="small" 
                  color="primary"
                />
              )}
              {selectedMethod && (
                <Chip 
                  label={methods.find(m => m.id === selectedMethod)?.name || 'Unknown'} 
                  size="small" 
                  color="secondary"
                />
              )}
              <Chip 
                label={`${selectedCompounds.length} compounds`} 
                size="small" 
                variant="outlined"
                data-cy="compound-count-chip"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCRUDTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
      </Grid>

      {/* Instruments Section */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Instruments</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setInstrumentDialog({ open: true, editing: null })}
              >
                Add
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {instruments.slice(0, 5).map((instrument) => (
                    <TableRow key={instrument.id}>
                      <TableCell>{instrument.name}</TableCell>
                      <TableCell>{instrument.model}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setInstrumentDialog({ open: true, editing: instrument })}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Methods Section */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Methods</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setMethodDialog({ open: true, editing: null })}
              >
                Add
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {methods.slice(0, 5).map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>{method.name}</TableCell>
                      <TableCell>{method.method_type}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setMethodDialog({ open: true, editing: method })}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Compounds Section */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Compounds</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setCompoundDialog({ open: true, editing: null })}
              >
                Add
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>RT (min)</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compounds.slice(0, 5).map((compound) => (
                    <TableRow key={compound.id}>
                      <TableCell>{compound.name}</TableCell>
                      <TableCell>{compound.retention_time.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setCompoundDialog({ open: true, editing: compound })}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Saved Runs Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FolderOpenIcon sx={{ mr: 1 }} />
              Saved Runs
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sample Name</TableCell>
                    <TableCell>Instrument</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Peaks</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedRuns.slice(0, 10).map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{run.sample_name}</TableCell>
                      <TableCell>
                        {instruments.find(i => i.id === run.instrument_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {methods.find(m => m.id === run.method_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{run.peaks?.length || 0}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleLoadRun(run)}
                        >
                          Load
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderResultsTab = () => {
    if (!currentRun) {
      return (
        <Box textAlign="center" py={4}>
          <ScienceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No simulation results yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run a simulation from the Setup tab to see chromatogram results
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Chromatogram Results: {currentRun.sample_name}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveRun}
                >
                  Save Run
                </Button>
              </Box>
              
              {currentRun.time && currentRun.signal && (
                <ChromatogramViewer
                  time={currentRun.time}
                  signal={currentRun.signal}
                  peaks={currentRun.peaks || []}
                  baseline={currentRun.baseline}
                  sampleName={`${currentRun.sample_name} Chromatogram`}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Peak Table
              </Typography>
              {currentRun.peaks && currentRun.peaks.length > 0 ? (
                <PeakTable 
                  peaks={currentRun.peaks}
                  onPeakUpdate={(peakId, updates) => {
                    setCurrentRun(prev => prev ? {
                      ...prev,
                      peaks: prev.peaks.map(peak => 
                        peak.id === peakId ? { ...peak, ...updates } : peak
                      )
                    } : null);
                  }}
                />
              ) : (
                <Alert severity="info">
                  No peaks detected in this chromatogram
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading GC Sandbox...
        </Typography>
      </Box>
    );
  }

  return (
    <Box data-cy="gc-sandbox-container">
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <IntelliLabLogo size="medium" variant="icon-only" />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                GC Virtual Instrument Sandbox
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Complete simulation and data management platform
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Setup & Run" data-cy="tab-setup" />
            <Tab label="Data Management" data-cy="tab-data-management" />
            <Tab label="Results" data-cy="tab-results" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderSetupTab()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderCRUDTab()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderResultsTab()}
        </TabPanel>
      </Card>

      {/* CRUD Dialogs */}
      <CompoundCRUD
        open={compoundDialog.open}
        compound={compoundDialog.editing}
        onClose={() => setCompoundDialog({ open: false, editing: null })}
        onSave={loadData}
      />

      <MethodCRUD
        open={methodDialog.open}
        method={methodDialog.editing}
        onClose={() => setMethodDialog({ open: false, editing: null })}
        onSave={loadData}
      />

      <InstrumentCRUD
        open={instrumentDialog.open}
        instrument={instrumentDialog.editing}
        onClose={() => setInstrumentDialog({ open: false, editing: null })}
        onSave={loadData}
      />
    </Box>
  );
};

export default GCSandbox;