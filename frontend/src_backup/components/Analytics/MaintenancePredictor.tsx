import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useGlobalData } from '../../store/globalDataStore';
import { MaintenancePrediction } from '../../store/globalDataStore';
import { isPredictiveMaintenanceEnabled } from '../../config/featureFlags';

interface MaintenancePredictorProps {
  onAlertCreate?: (prediction: MaintenancePrediction) => void;
}

export const MaintenancePredictor: React.FC<MaintenancePredictorProps> = ({ 
  onAlertCreate 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchMaintenance } = useGlobalData();
  
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadPredictions = async () => {
    if (!isPredictiveMaintenanceEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await fetchMaintenance();
      setPredictions(results);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load maintenance predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const getHealthColor = (healthScore: number) => {
    if (healthScore >= 0.8) return 'success';
    if (healthScore >= 0.6) return 'warning';
    if (healthScore >= 0.4) return 'error';
    return 'error';
  };

  const getHealthIcon = (healthScore: number) => {
    if (healthScore >= 0.8) return <CheckIcon color="success" />;
    if (healthScore >= 0.6) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 7) return 'error';
    if (daysRemaining <= 30) return 'warning';
    return 'success';
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'column':
        return <BuildIcon />;
      case 'liner':
        return <BuildIcon />;
      case 'septa':
        return <BuildIcon />;
      default:
        return <BuildIcon />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return 'Overdue';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };

  const getPriorityLevel = (prediction: MaintenancePrediction) => {
    if (prediction.days_remaining <= 7) return 'Critical';
    if (prediction.days_remaining <= 30) return 'High';
    if (prediction.health_score < 0.6) return 'Medium';
    return 'Low';
  };

  const criticalPredictions = predictions.filter(p => p.days_remaining <= 7);
  const highPriorityPredictions = predictions.filter(p => p.days_remaining <= 30 && p.days_remaining > 7);
  const normalPredictions = predictions.filter(p => p.days_remaining > 30);

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <BuildIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Predictive Maintenance
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                Monitor consumable health and predict replacement needs
              </Typography>
            </Box>
          </Box>
          
          {lastUpdate && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Last update: {lastUpdate.toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {criticalPredictions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {highPriorityPredictions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {normalPredictions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Normal Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {predictions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Assets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Maintenance Predictions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPredictions}
            disabled={isLoading || !isPredictiveMaintenanceEnabled()}
          >
            Refresh
          </Button>
          {criticalPredictions.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<NotificationsIcon />}
              onClick={() => onAlertCreate?.(criticalPredictions[0])}
            >
              Create Alert
            </Button>
          )}
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !isPredictiveMaintenanceEnabled() ? (
        <Alert severity="warning">
          Predictive maintenance feature is currently disabled
        </Alert>
      ) : predictions.length === 0 ? (
        <Alert severity="info">
          No maintenance predictions available. Check back later for updates.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Critical Alerts */}
          {criticalPredictions.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ border: `2px solid ${theme.palette.error.main}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6" color="error">
                      Critical Maintenance Required
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {criticalPredictions.map((prediction) => (
                      <Grid item xs={12} sm={6} md={4} key={prediction.id}>
                        <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              {getAssetIcon(prediction.asset_type)}
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {prediction.asset_type.charAt(0).toUpperCase() + prediction.asset_type.slice(1)} #{prediction.asset_id}
                                </Typography>
                                <Typography variant="body2" color="error">
                                  OVERDUE - {formatDaysRemaining(prediction.days_remaining)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CircularProgress
                                variant="determinate"
                                value={prediction.health_score * 100}
                                color="error"
                                size={40}
                              />
                              <Typography variant="body2">
                                Health: {(prediction.health_score * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {prediction.rationale}
                            </Typography>
                            
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              fullWidth
                              startIcon={<ScheduleIcon />}
                            >
                              Schedule Replacement
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* High Priority */}
          {highPriorityPredictions.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ border: `1px solid ${theme.palette.warning.main}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6" color="warning.main">
                      High Priority Maintenance
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {highPriorityPredictions.map((prediction) => (
                      <Grid item xs={12} sm={6} md={4} key={prediction.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              {getAssetIcon(prediction.asset_type)}
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {prediction.asset_type.charAt(0).toUpperCase() + prediction.asset_type.slice(1)} #{prediction.asset_id}
                                </Typography>
                                <Typography variant="body2" color="warning.main">
                                  Due in {formatDaysRemaining(prediction.days_remaining)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CircularProgress
                                variant="determinate"
                                value={prediction.health_score * 100}
                                color="warning"
                                size={40}
                              />
                              <Typography variant="body2">
                                Health: {(prediction.health_score * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {prediction.rationale}
                            </Typography>
                            
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              fullWidth
                              startIcon={<ScheduleIcon />}
                            >
                              Plan Replacement
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Normal Status */}
          {normalPredictions.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CheckIcon color="success" />
                    <Typography variant="h6" color="success.main">
                      Normal Status
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {normalPredictions.map((prediction) => (
                      <Grid item xs={12} sm={6} md={4} key={prediction.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              {getAssetIcon(prediction.asset_type)}
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {prediction.asset_type.charAt(0).toUpperCase() + prediction.asset_type.slice(1)} #{prediction.asset_id}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                  Good for {formatDaysRemaining(prediction.days_remaining)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CircularProgress
                                variant="determinate"
                                value={prediction.health_score * 100}
                                color="success"
                                size={40}
                              />
                              <Typography variant="body2">
                                Health: {(prediction.health_score * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {prediction.rationale}
                            </Typography>
                            
                            <Chip
                              label="Monitor"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default MaintenancePredictor;
