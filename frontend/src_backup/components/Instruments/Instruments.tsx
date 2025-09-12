import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Fab,
  Divider,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { instrumentsAPI } from '../../services/apiService';
import { WebSocketService } from '../../services/apiService';
import { LogoLoader } from '../Loading/LogoLoader';

interface Instrument {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  install_date?: string;
  location?: string;
  age_years: number;
  maintenance_level: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Neglected';
  vacuum_integrity: number;
  septum_condition: string;
  liner_condition: string;
  oven_calibration: string;
  column_condition: string;
  last_maintenance?: string;
  notes?: string;
  parameters?: any;
  calibration_data?: any;
  performance_history?: any;
  created_date: string;
  modified_date: string;
}

const Instruments: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [wsService] = useState(() => new WebSocketService());

  // Load instruments from API
  const loadInstruments = async () => {
    try {
      setLoading(true);
      const response = await instrumentsAPI.getAll();
      setInstruments(response.data);
    } catch (error) {
      console.error('Error loading instruments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load instruments. Using sample data.',
        severity: 'error'
      });
      // Fallback to sample data for field testing
      setInstruments(getSampleInstruments());
    } finally {
      setLoading(false);
    }
  };

  // Sample data for field testing
  const getSampleInstruments = (): Instrument[] => [
    {
      id: 1,
      name: 'PDH-GC001',
      model: 'Agilent 7890A',
      serial_number: 'AG7890A-2024-001',
      install_date: '2024-01-15',
      location: 'Lab A - Bench 1',
      age_years: 1.0,
      maintenance_level: 'Excellent',
      vacuum_integrity: 98.5,
      septum_condition: 'New',
      liner_condition: 'Clean',
      oven_calibration: 'Good',
      column_condition: 'Good',
      last_maintenance: '2024-12-15',
      notes: 'Primary PDH feed analysis GC',
      created_date: '2024-01-15T00:00:00',
      modified_date: '2024-12-17T00:00:00'
    },
    {
      id: 2,
      name: 'PDH-GC002',
      model: 'Agilent 7890B',
      serial_number: 'AG7890B-2024-002',
      install_date: '2024-02-01',
      location: 'Lab A - Bench 2',
      age_years: 0.9,
      maintenance_level: 'Good',
      vacuum_integrity: 95.2,
      septum_condition: 'Good',
      liner_condition: 'Clean',
      oven_calibration: 'Good',
      column_condition: 'Good',
      last_maintenance: '2024-12-10',
      notes: 'PDH product quality analysis',
      created_date: '2024-02-01T00:00:00',
      modified_date: '2024-12-17T00:00:00'
    },
    {
      id: 3,
      name: 'IBDH-GC001',
      model: 'Shimadzu 2030',
      serial_number: 'SH2030-2024-001',
      install_date: '2024-03-15',
      location: 'Lab B - Bench 1',
      age_years: 0.8,
      maintenance_level: 'Excellent',
      vacuum_integrity: 97.8,
      septum_condition: 'New',
      liner_condition: 'Clean',
      oven_calibration: 'Good',
      column_condition: 'Good',
      last_maintenance: '2024-12-12',
      notes: 'IBDH feed and product analysis',
      created_date: '2024-03-15T00:00:00',
      modified_date: '2024-12-17T00:00:00'
    }
  ];

  useEffect(() => {
    loadInstruments();
    
    // Setup WebSocket for real-time updates
    wsService.connect();
    wsService.on('instrument_update', handleInstrumentUpdate);
    
    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleInstrumentUpdate = (data: any) => {
    console.log('Instrument update received:', data);
    // Reload instruments when updates are received
    loadInstruments();
  };

  const getStatusColor = (maintenanceLevel: string) => {
    switch (maintenanceLevel) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'success';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      case 'Neglected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (maintenanceLevel: string) => {
    switch (maintenanceLevel) {
      case 'Excellent':
      case 'Good':
        return <CheckCircleIcon />;
      case 'Fair':
        return <WarningIcon />;
      case 'Poor':
      case 'Neglected':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const filteredInstruments = instruments.filter(instrument => {
    const matchesSearch = instrument.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instrument.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instrument.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || instrument.maintenance_level === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddInstrument = () => {
    setEditingInstrument(null);
    setDialogOpen(true);
  };

  const handleEditInstrument = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setDialogOpen(true);
  };

  const handleDeleteInstrument = async (id: number) => {
    try {
      await instrumentsAPI.delete(id);
      setInstruments(instruments.filter(instrument => instrument.id !== id));
      setSnackbar({
        open: true,
        message: 'Instrument deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting instrument:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete instrument',
        severity: 'error'
      });
    }
  };

  const handleSaveInstrument = async (instrumentData: Partial<Instrument>) => {
    try {
      setSaving(true);
      let savedInstrument: Instrument;

      if (editingInstrument) {
        const response = await instrumentsAPI.update(editingInstrument.id, instrumentData);
        savedInstrument = response.data;
        setInstruments(instruments.map(inst => inst.id === editingInstrument.id ? savedInstrument : inst));
      } else {
        const response = await instrumentsAPI.create(instrumentData);
        savedInstrument = response.data;
        setInstruments([...instruments, savedInstrument]);
      }

      setDialogOpen(false);
      setEditingInstrument(null);
      setSnackbar({
        open: true,
        message: `Instrument ${editingInstrument ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving instrument:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save instrument',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getMaintenanceStatus = (lastMaintenance?: string) => {
    if (!lastMaintenance) return { status: 'unknown', color: 'default' };
    
    const daysSinceMaintenance = Math.ceil((new Date().getTime() - new Date(lastMaintenance).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceMaintenance > 90) return { status: 'overdue', color: 'error' };
    if (daysSinceMaintenance > 60) return { status: 'due', color: 'warning' };
    return { status: 'ok', color: 'success' };
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🧪 Instruments Management
        </Typography>
        <Box>
          <Tooltip title="Refresh Instruments">
            <IconButton onClick={loadInstruments} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Fab
            color="primary"
            aria-label="add instrument"
            onClick={handleAddInstrument}
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
          >
            <AddIcon />
          </Fab>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{instruments.length}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Total Instruments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {instruments.filter(inst => ['Excellent', 'Good'].includes(inst.maintenance_level)).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Good Condition</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BuildIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {instruments.filter(inst => ['Fair', 'Poor', 'Neglected'].includes(inst.maintenance_level)).length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Needs Attention</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {instruments.filter(inst => getMaintenanceStatus(inst.last_maintenance).status === 'overdue').length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Maintenance Overdue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Instruments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, model, or serial number..."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Maintenance Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Maintenance Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Conditions</MenuItem>
                <MenuItem value="Excellent">Excellent</MenuItem>
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Fair">Fair</MenuItem>
                <MenuItem value="Poor">Poor</MenuItem>
                <MenuItem value="Neglected">Neglected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Instruments Grid */}
      <Grid container spacing={3}>
        {filteredInstruments.map((instrument) => {
          const maintenanceStatus = getMaintenanceStatus(instrument.last_maintenance);
          return (
            <Grid item xs={12} md={6} lg={4} key={instrument.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {instrument.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {instrument.model} - {instrument.serial_number}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusIcon(instrument.maintenance_level)}
                      label={instrument.maintenance_level}
                      color={getStatusColor(instrument.maintenance_level) as any}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Location:</strong> {instrument.location || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Age:</strong> {instrument.age_years} years
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Vacuum Integrity:</strong> {instrument.vacuum_integrity}%
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Septum:</strong> {instrument.septum_condition}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Liner:</strong> {instrument.liner_condition}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Oven Calibration:</strong> {instrument.oven_calibration}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Column:</strong> {instrument.column_condition}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Install Date:</strong> {instrument.install_date || 'Not specified'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        <strong>Last Maintenance:</strong>
                      </Typography>
                      <Chip
                        label={instrument.last_maintenance || 'Not recorded'}
                        color={maintenanceStatus.color as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {instrument.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {instrument.notes}
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Instrument">
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditInstrument(instrument)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Instrument Settings">
                    <IconButton size="small">
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Instrument">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteInstrument(instrument.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredInstruments.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No instruments found matching your search criteria.
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}
        </DialogTitle>
        <DialogContent>
          <InstrumentForm
            instrument={editingInstrument}
            onSave={handleSaveInstrument}
            onCancel={() => setDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Instrument Form Component
interface InstrumentFormProps {
  instrument?: Instrument | null;
  onSave: (instrument: Partial<Instrument>) => void;
  onCancel: () => void;
  saving: boolean;
}

const InstrumentForm: React.FC<InstrumentFormProps> = ({ instrument, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState<Partial<Instrument>>(
    instrument || {
      name: '',
      model: '',
      serial_number: '',
      location: '',
      maintenance_level: 'Good',
      vacuum_integrity: 95.0,
      septum_condition: 'Good',
      liner_condition: 'Clean',
      oven_calibration: 'Good',
      column_condition: 'Good',
      age_years: 1.0,
      notes: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.model && formData.serial_number) {
      onSave(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Instrument Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Serial Number"
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Maintenance Level</InputLabel>
            <Select
              value={formData.maintenance_level}
              label="Maintenance Level"
              onChange={(e) => setFormData({ ...formData, maintenance_level: e.target.value as any })}
            >
              <MenuItem value="Excellent">Excellent</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
              <MenuItem value="Neglected">Neglected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Age (years)"
            type="number"
            value={formData.age_years}
            onChange={(e) => setFormData({ ...formData, age_years: parseFloat(e.target.value) })}
            inputProps={{ min: 0, max: 50, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Vacuum Integrity (%)"
            type="number"
            value={formData.vacuum_integrity}
            onChange={(e) => setFormData({ ...formData, vacuum_integrity: parseFloat(e.target.value) })}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Septum Condition</InputLabel>
            <Select
              value={formData.septum_condition}
              label="Septum Condition"
              onChange={(e) => setFormData({ ...formData, septum_condition: e.target.value })}
            >
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Worn">Worn</MenuItem>
              <MenuItem value="Leaking">Leaking</MenuItem>
              <MenuItem value="Badly Damaged">Badly Damaged</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Liner Condition</InputLabel>
            <Select
              value={formData.liner_condition}
              label="Liner Condition"
              onChange={(e) => setFormData({ ...formData, liner_condition: e.target.value })}
            >
              <MenuItem value="Clean">Clean</MenuItem>
              <MenuItem value="Lightly Contaminated">Lightly Contaminated</MenuItem>
              <MenuItem value="Contaminated">Contaminated</MenuItem>
              <MenuItem value="Heavily Contaminated">Heavily Contaminated</MenuItem>
              <MenuItem value="Needs Replacement">Needs Replacement</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Oven Calibration</InputLabel>
            <Select
              value={formData.oven_calibration}
              label="Oven Calibration"
              onChange={(e) => setFormData({ ...formData, oven_calibration: e.target.value })}
            >
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
              <MenuItem value="Needs Calibration">Needs Calibration</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Column Condition</InputLabel>
            <Select
              value={formData.column_condition}
              label="Column Condition"
              onChange={(e) => setFormData({ ...formData, column_condition: e.target.value })}
            >
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
              <MenuItem value="Needs Replacement">Needs Replacement</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>

      <DialogActions sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? 'Saving...' : (instrument ? 'Update' : 'Add')} Instrument
        </Button>
      </DialogActions>
    </Box>
  );
};

export default Instruments; 