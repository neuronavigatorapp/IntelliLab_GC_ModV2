import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
// Timeline components replaced with simpler layout
import {
  Engineering,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Assessment,
  Build,
  Notifications,
  Refresh,
  Settings,
  HealthAndSafety,
  Psychology,
} from '@mui/icons-material';

interface PredictiveMaintenanceProps {
  className?: string;
}

interface MaintenancePrediction {
  component_type: string;
  current_condition: string;
  predicted_failure_date?: string;
  confidence_level: number;
  recommended_actions: string[];
  estimated_cost: number;
}

interface MaintenanceRequest {
  instrument_id: number;
  component_types: string[];
  analysis_period_days: number;
}

const PredictiveMaintenance: React.FC<PredictiveMaintenanceProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedInstrument, setSelectedInstrument] = useState(1);
  const [analysisPeriod, setAnalysisPeriod] = useState(30);
  const [selectedComponents, setSelectedComponents] = useState<string[]>(['column', 'detector', 'inlet', 'pump']);

  const availableInstruments = [
    { id: 1, name: 'GC-FID #1 - Lab A', model: 'Agilent 7890A' },
    { id: 2, name: 'GC-MS #1 - Lab B', model: 'Agilent 5977B' },
    { id: 3, name: 'GC-ECD #1 - Lab C', model: 'Shimadzu GC-2030' }
  ];

  const componentTypes = [
    { id: 'column', name: 'Column', icon: '📊', color: 'primary' },
    { id: 'detector', name: 'Detector', icon: '🔍', color: 'secondary' },
    { id: 'inlet', name: 'Inlet', icon: '🔧', color: 'success' },
    { id: 'pump', name: 'Pump', icon: '⚙️', color: 'warning' }
  ];

  const runMaintenanceAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: MaintenanceRequest = {
        instrument_id: selectedInstrument,
        component_types: selectedComponents,
        analysis_period_days: analysisPeriod
      };

      const response = await fetch('http://localhost:8000/ai/maintenance-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new globalThis.Error(`HTTP error! status: ${response.status}`);
      }

      const predictionResults: MaintenancePrediction[] = await response.json();
      setPredictions(predictionResults);
    } catch (err: unknown) {
      const errorMessage = err instanceof globalThis.Error ? err.message : 'Predictive maintenance analysis failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-load predictions on component mount
    runMaintenanceAnalysis();
  }, [runMaintenanceAnalysis]);

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return <CheckCircle color="success" />;
      case 'good': return <CheckCircle color="primary" />;
      case 'fair': return <Warning color="warning" />;
      case 'poor': return <Error color="error" />;
      default: return <HealthAndSafety />;
    }
  };

  const getPriorityLevel = (prediction: MaintenancePrediction) => {
    if (!prediction.predicted_failure_date) return 'Low';
    
    const failureDate = new Date(prediction.predicted_failure_date);
    const now = new Date();
    const daysUntilFailure = Math.ceil((failureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilFailure <= 7) return 'Critical';
    if (daysUntilFailure <= 30) return 'High';
    if (daysUntilFailure <= 60) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilFailure = (dateString?: string) => {
    if (!dateString) return null;
    
    const failureDate = new Date(dateString);
    const now = new Date();
    return Math.ceil((failureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalMaintenanceCost = predictions.reduce((sum, pred) => sum + pred.estimated_cost, 0);
  const criticalComponents = predictions.filter(pred => getPriorityLevel(pred) === 'Critical').length;
  const averageConfidence = predictions.length > 0 
    ? predictions.reduce((sum, pred) => sum + pred.confidence_level, 0) / predictions.length 
    : 0;

  return (
    <Box className={className} sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Engineering sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Predictive Maintenance AI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            AI-powered component health monitoring and maintenance forecasting
          </Typography>
        </Box>
      </Box>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Settings sx={{ mr: 1 }} />
            Analysis Configuration
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Instrument</InputLabel>
                <Select
                  value={selectedInstrument}
                  label="Instrument"
                  onChange={(e) => setSelectedInstrument(Number(e.target.value))}
                >
                  {availableInstruments.map(instrument => (
                    <MenuItem key={instrument.id} value={instrument.id}>
                      {instrument.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Analysis Period</InputLabel>
                <Select
                  value={analysisPeriod}
                  label="Analysis Period"
                  onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                >
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                  <MenuItem value={90}>90 days</MenuItem>
                  <MenuItem value={365}>1 year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Components</InputLabel>
                <Select
                  multiple
                  value={selectedComponents}
                  label="Components"
                  onChange={(e) => setSelectedComponents(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {componentTypes.map(component => (
                    <MenuItem key={component.id} value={component.id}>
                      {component.icon} {component.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={runMaintenanceAnalysis}
                disabled={loading}
                startIcon={loading ? <Psychology /> : <Refresh />}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {criticalComponents}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical Components
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              ${totalMaintenanceCost.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estimated Costs
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {(averageConfidence * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Confidence
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {predictions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Components Analyzed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              AI is analyzing component health and predicting maintenance needs...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Predictions Results */}
      {predictions.length > 0 && (
        <Grid container spacing={3}>
          {/* Component Health Overview */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1 }} />
                  Component Health Status
                </Typography>

                <List>
                  {predictions.map((prediction, index) => (
                    <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${getConditionColor(prediction.current_condition)}.light` }}>
                          {componentTypes.find(c => c.id === prediction.component_type)?.icon || '🔧'}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" textTransform="capitalize">
                              {prediction.component_type}
                            </Typography>
                            <Chip 
                              label={prediction.current_condition}
                              color={getConditionColor(prediction.current_condition)}
                              size="small"
                            />
                            <Chip 
                              label={getPriorityLevel(prediction)}
                              color={getPriorityColor(getPriorityLevel(prediction))}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Confidence: {(prediction.confidence_level * 100).toFixed(0)}% • 
                              Cost: ${prediction.estimated_cost}
                              {prediction.predicted_failure_date && (
                                <> • Failure in {getDaysUntilFailure(prediction.predicted_failure_date)} days</>
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Maintenance Schedule */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1 }} />
                  Maintenance Schedule
                </Typography>

                <List>
                  {predictions
                    .filter(pred => pred.predicted_failure_date)
                    .sort((a, b) => new Date(a.predicted_failure_date!).getTime() - new Date(b.predicted_failure_date!).getTime())
                    .map((prediction, index) => (
                      <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <ListItemIcon>
                          {getConditionIcon(prediction.current_condition)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" textTransform="capitalize">
                                {prediction.component_type} Maintenance
                              </Typography>
                              <Chip 
                                label={getPriorityLevel(prediction)}
                                color={getPriorityColor(getPriorityLevel(prediction))}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Scheduled: {formatDate(prediction.predicted_failure_date!)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getDaysUntilFailure(prediction.predicted_failure_date)} days remaining
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommended Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Build sx={{ mr: 1 }} />
                  AI Recommended Actions
                </Typography>

                <Grid container spacing={2}>
                  {predictions.map((prediction, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" gutterBottom textTransform="capitalize" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={prediction.component_type}
                            color={getConditionColor(prediction.current_condition)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Maintenance Plan
                        </Typography>
                        
                        <List dense>
                          {prediction.recommended_actions.map((action, actionIndex) => (
                            <ListItem key={actionIndex}>
                              <ListItemIcon>
                                <CheckCircle color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={action}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Estimated Cost: <strong>${prediction.estimated_cost}</strong>
                          </Typography>
                          <Tooltip title="Schedule Maintenance">
                            <IconButton size="small" color="primary">
                              <Notifications />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {!predictions.length && !loading && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Engineering sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Predictive Maintenance AI Ready
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your instrument and analysis parameters, then click "Analyze" to get AI-powered maintenance predictions and component health insights.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PredictiveMaintenance;