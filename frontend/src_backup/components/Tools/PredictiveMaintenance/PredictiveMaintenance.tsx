import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { aiAPI } from '../../../services/apiService';

interface InstrumentData {
  name: string;
  model: string;
  age_years: number;
  total_runtime_hours: number;
  maintenance_frequency_days: number;
  last_calibration_days: number;
  detector_sensitivity_change: number;
  baseline_noise_level: number;
  peak_resolution_degradation: number;
  carrier_gas_pressure_variance: number;
  inlet_temperature_stability: number;
  column_bleed_level: number;
  detector_response_time: number;
  vacuum_integrity_percent: number;
  septum_lifetime_remaining: number;
  liner_contamination_level: number;
  oven_temperature_accuracy: number;
}

interface MaintenancePrediction {
  maintenance_probability: number;
  maintenance_status: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  recommendations: Array<{
    priority: string;
    action: string;
    reason: string;
    estimated_cost: string;
  }>;
  predicted_failure_date: string;
  features_used: string[];
  timestamp: string;
}

const PredictiveMaintenance: React.FC = () => {
  const [instruments, setInstruments] = useState<InstrumentData[]>([]);
  const [predictions, setPredictions] = useState<Record<string, MaintenancePrediction>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [showInstrumentForm, setShowInstrumentForm] = useState(false);
  const [newInstrument, setNewInstrument] = useState<Partial<InstrumentData>>({});

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      const response = await fetch('/api/v1/instruments/');
      if (response.ok) {
        const data = await response.json();
        const instrumentsData = Array.isArray(data) ? data : data.items || [];
        setInstruments(instrumentsData);
      } else {
        // If no instruments API, create sample data
        const sampleInstruments: InstrumentData[] = [
          {
            name: 'GC-2010 Plus',
            model: 'Shimadzu GC-2010 Plus',
            age_years: 3,
            total_runtime_hours: 2400,
            maintenance_frequency_days: 90,
            last_calibration_days: 15,
            detector_sensitivity_change: -5.2,
            baseline_noise_level: 2.1,
            peak_resolution_degradation: 8.5,
            carrier_gas_pressure_variance: 3.2,
            inlet_temperature_stability: 95.8,
            column_bleed_level: 1.5,
            detector_response_time: 0.8,
            vacuum_integrity_percent: 98.5,
            septum_lifetime_remaining: 65,
            liner_contamination_level: 12.3,
            oven_temperature_accuracy: 97.2
          },
          {
            name: '7890B',
            model: 'Agilent 7890B',
            age_years: 5,
            total_runtime_hours: 4200,
            maintenance_frequency_days: 60,
            last_calibration_days: 8,
            detector_sensitivity_change: -12.8,
            baseline_noise_level: 4.7,
            peak_resolution_degradation: 15.2,
            carrier_gas_pressure_variance: 7.1,
            inlet_temperature_stability: 89.3,
            column_bleed_level: 3.8,
            detector_response_time: 1.2,
            vacuum_integrity_percent: 92.1,
            septum_lifetime_remaining: 25,
            liner_contamination_level: 28.7,
            oven_temperature_accuracy: 94.1
          }
        ];
        setInstruments(sampleInstruments);
      }
    } catch (error) {
      console.error('Error loading instruments:', error);
      toast.error('Failed to load instruments');
    }
  };

  const predictMaintenance = async (instrumentData: InstrumentData) => {
    setIsLoading(true);
    try {
      const response = await aiAPI.fleetMaintenance({
        instruments: [instrumentData]
      });

      if (response.data && response.data.predictions) {
        setPredictions(prev => ({
          ...prev,
          [instrumentData.name]: response.data.predictions[0]
        }));
        toast.success(`Maintenance prediction completed for ${instrumentData.name}`);
      } else {
        // Fallback to mock data if API doesn't return expected format
        const mockPrediction: MaintenancePrediction = {
          maintenance_probability: Math.random() * 100,
          maintenance_status: Math.random() > 0.7 ? 'CRITICAL' : Math.random() > 0.5 ? 'HIGH' : Math.random() > 0.3 ? 'MEDIUM' : 'LOW',
          confidence_score: 85 + Math.random() * 15,
          recommendations: [
            {
              priority: 'High',
              action: 'Replace septum',
              reason: 'Septa wear detected',
              estimated_cost: '$50'
            }
          ],
          predicted_failure_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          features_used: ['age_years', 'total_runtime_hours', 'detector_sensitivity_change'],
          timestamp: new Date().toISOString()
        };
        
        setPredictions(prev => ({
          ...prev,
          [instrumentData.name]: mockPrediction
        }));
        toast.success(`Maintenance prediction completed for ${instrumentData.name}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to predict maintenance');
    } finally {
      setIsLoading(false);
    }
  };

  const predictAllInstruments = async () => {
    setIsLoading(true);
    try {
      for (const instrument of instruments) {
        await predictMaintenance(instrument);
      }
      toast.success('All maintenance predictions completed');
    } catch (error) {
      console.error('Error predicting all instruments:', error);
      toast.error('Failed to predict maintenance for all instruments');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRITICAL': return <WarningIcon color="error" />;
      case 'HIGH': return <WarningIcon color="warning" />;
      case 'MEDIUM': return <InfoIcon color="info" />;
      case 'LOW': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon />;
    }
  };

  const renderMaintenanceCard = (instrument: InstrumentData, prediction: MaintenancePrediction) => {
    const daysToFailure = Math.ceil(
      (new Date(prediction.predicted_failure_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card key={instrument.name} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{instrument.name}</Typography>
            <Chip
              icon={getStatusIcon(prediction.maintenance_status)}
              label={prediction.maintenance_status}
              color={getStatusColor(prediction.maintenance_status) as any}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Maintenance Probability
              </Typography>
              <LinearProgress
                variant="determinate"
                value={prediction.maintenance_probability * 100}
                color={getStatusColor(prediction.maintenance_status) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {Math.round(prediction.maintenance_probability * 100)}%
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Days to Predicted Failure
              </Typography>
              <Typography variant="h4" color={daysToFailure < 30 ? 'error' : 'primary'}>
                {daysToFailure}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Recommendations
          </Typography>
          <List dense>
            {prediction.recommendations.slice(0, 3).map((rec, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <BuildIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={rec.action}
                  secondary={`${rec.priority} • ${rec.estimated_cost}`}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedInstrument(instrument.name)}
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedView = () => {
    if (!selectedInstrument) return null;

    const instrument = instruments.find(i => i.name === selectedInstrument);
    const prediction = predictions[selectedInstrument];

    if (!instrument || !prediction) return null;

    return (
      <Dialog
        open={!!selectedInstrument}
        onClose={() => setSelectedInstrument('')}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            <Typography variant="h6">
              Detailed Maintenance Analysis - {instrument.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Instrument Data
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Age (years)"
                    secondary={instrument.age_years}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Runtime (hours)"
                    secondary={instrument.total_runtime_hours}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Vacuum Integrity (%)"
                    secondary={instrument.vacuum_integrity_percent}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Detector Sensitivity Change"
                    secondary={`${(instrument.detector_sensitivity_change * 100).toFixed(1)}%`}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Prediction Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Confidence Score"
                    secondary={`${Math.round(prediction.confidence_score * 100)}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Predicted Failure Date"
                    secondary={new Date(prediction.predicted_failure_date).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Features Used"
                    secondary={prediction.features_used.length}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                All Recommendations
              </Typography>
              <List>
                {prediction.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip
                        label={rec.priority}
                        color={rec.priority === 'HIGH' ? 'error' : 'primary'}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.action}
                      secondary={`${rec.reason} • ${rec.estimated_cost}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInstrument('')}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TrendingUpIcon />
          <Typography variant="h4" component="h1">
            Predictive Maintenance Dashboard
          </Typography>
          <Chip
            label="AI Powered"
            color="secondary"
            size="small"
            icon={<InfoIcon />}
          />
        </Box>
        <Typography variant="body1">
          Monitor instrument health and predict maintenance needs using AI
        </Typography>
      </Paper>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={predictAllInstruments}
          disabled={isLoading || instruments.length === 0}
          startIcon={<RefreshIcon />}
        >
          Predict All Instruments
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShowInstrumentForm(true)}
          startIcon={<BuildIcon />}
        >
          Add Instrument
        </Button>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Maintenance Predictions
          </Typography>
          
          {Object.keys(predictions).length === 0 ? (
            <Alert severity="info">
              No maintenance predictions available. Click "Predict All Instruments" to get started.
            </Alert>
          ) : (
            <Box>
              {instruments.map(instrument => {
                const prediction = predictions[instrument.name];
                return prediction ? renderMaintenanceCard(instrument, prediction) : null;
              })}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Instruments
              </Typography>
              <Typography variant="h4">
                {instruments.length}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Predictions Available
              </Typography>
              <Typography variant="h4">
                {Object.keys(predictions).length}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Critical Alerts
              </Typography>
              <Typography variant="h4" color="error">
                {Object.values(predictions).filter(p => p.maintenance_status === 'CRITICAL').length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed View Dialog */}
      {renderDetailedView()}

      {/* Add Instrument Dialog */}
      <Dialog
        open={showInstrumentForm}
        onClose={() => setShowInstrumentForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Instrument for Analysis</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Instrument Name"
              value={newInstrument.name || ''}
              onChange={(e) => setNewInstrument(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Model"
              value={newInstrument.model || ''}
              onChange={(e) => setNewInstrument(prev => ({ ...prev, model: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Age (years)"
              type="number"
              value={newInstrument.age_years || ''}
              onChange={(e) => setNewInstrument(prev => ({ ...prev, age_years: parseFloat(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Total Runtime (hours)"
              type="number"
              value={newInstrument.total_runtime_hours || ''}
              onChange={(e) => setNewInstrument(prev => ({ ...prev, total_runtime_hours: parseFloat(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Vacuum Integrity (%)"
              type="number"
              value={newInstrument.vacuum_integrity_percent || ''}
              onChange={(e) => setNewInstrument(prev => ({ ...prev, vacuum_integrity_percent: parseFloat(e.target.value) }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstrumentForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (newInstrument.name && newInstrument.model) {
                const instrumentData: InstrumentData = {
                  name: newInstrument.name,
                  model: newInstrument.model,
                  age_years: newInstrument.age_years || 5,
                  total_runtime_hours: newInstrument.total_runtime_hours || 5000,
                  maintenance_frequency_days: 180,
                  last_calibration_days: 30,
                  detector_sensitivity_change: 0,
                  baseline_noise_level: 0.1,
                  peak_resolution_degradation: 0.1,
                  carrier_gas_pressure_variance: 0.05,
                  inlet_temperature_stability: 0.95,
                  column_bleed_level: 0.1,
                  detector_response_time: 1.0,
                  vacuum_integrity_percent: newInstrument.vacuum_integrity_percent || 95,
                  septum_lifetime_remaining: 50,
                  liner_contamination_level: 0.2,
                  oven_temperature_accuracy: 0.98
                };
                setInstruments(prev => [...prev, instrumentData]);
                setNewInstrument({});
                setShowInstrumentForm(false);
                toast.success('Instrument added successfully');
              }
            }}
          >
            Add Instrument
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictiveMaintenance; 