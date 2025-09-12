import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Tune as TuneIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Science as ScienceIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { useGlobalData } from '../../store/globalDataStore';
import { OptimizationSuggestion } from '../../store/globalDataStore';
import { isMethodOptimizationEnabled } from '../../config/featureFlags';

interface MethodOptimizerProps {
  onOptimizationApply?: (optimization: OptimizationSuggestion) => void;
}

export const MethodOptimizer: React.FC<MethodOptimizerProps> = ({ 
  onOptimizationApply 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchOptimization } = useGlobalData();
  
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [optimization, setOptimization] = useState<OptimizationSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Mock methods for demo
  const mockMethods = [
    { id: 1, name: 'BTEX-2024-01', type: 'Environmental', runtime: 15.5 },
    { id: 2, name: 'VOC-Analysis', type: 'Environmental', runtime: 12.8 },
    { id: 3, name: 'Hydrocarbons', type: 'Petrochemical', runtime: 18.2 }
  ];

  const runOptimization = async () => {
    if (!selectedMethodId || !isMethodOptimizationEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchOptimization(selectedMethodId);
      setOptimization(result);
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run optimization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOptimizationIcon = (target: string) => {
    switch (target) {
      case 'oven':
        return <SpeedIcon />;
      case 'inlet':
        return <ScienceIcon />;
      case 'detector':
        return <ChartIcon />;
      default:
        return <TuneIcon />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatTimeSavings = (savings: number | undefined) => {
    if (!savings) return 'Unknown';
    return `${savings.toFixed(1)} minutes`;
  };

  const formatCostSavings = (savings: number | undefined) => {
    if (!savings) return 'Unknown';
    return `$${savings.toFixed(2)} per analysis`;
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TuneIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Method Optimizer
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                Optimize oven ramps and inlet parameters for better performance
              </Typography>
            </Box>
          </Box>
          
          {lastRun && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Last optimization: {lastRun.toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Method Selection */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Method
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Method</InputLabel>
                  <Select
                    value={selectedMethodId || ''}
                    onChange={(e) => setSelectedMethodId(e.target.value as number)}
                    label="Method"
                  >
                    <MenuItem value="">
                      <em>Select a method</em>
                    </MenuItem>
                    {mockMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {method.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {method.type} • {method.runtime} min runtime
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedMethodId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Current Method:</strong> {mockMethods.find(m => m.id === selectedMethodId)?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Runtime:</strong> {mockMethods.find(m => m.id === selectedMethodId)?.runtime} minutes
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<TuneIcon />}
                onClick={runOptimization}
                disabled={!selectedMethodId || isLoading || !isMethodOptimizationEnabled()}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'Optimizing...' : 'Suggest Optimization'}
              </Button>

              {isLoading && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Analyzing method performance...
                  </Typography>
                </Box>
              )}

              {!isMethodOptimizationEnabled() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Method optimization feature is currently disabled
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Results */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Optimization Results
                </Typography>
                {optimization && (
                  <Tooltip title="Refresh Optimization">
                    <IconButton size="small" onClick={runOptimization}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {!optimization && !isLoading ? (
                <Alert severity="info">
                  Select a method and click "Suggest Optimization" to get recommendations for improving performance.
                </Alert>
              ) : (
                optimization && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Summary */}
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          {getOptimizationIcon(optimization.target)}
                          <Box>
                            <Typography variant="h6">
                              {optimization.target.charAt(0).toUpperCase() + optimization.target.slice(1)} Optimization
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Confidence: {(optimization.confidence * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <Chip
                            label={`${(optimization.confidence * 100).toFixed(0)}% confidence`}
                            color={getConfidenceColor(optimization.confidence) as any}
                            size="small"
                          />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Time Savings
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatTimeSavings(optimization.time_savings)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Cost Savings
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCostSavings(optimization.cost_savings)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Created
                            </Typography>
                            <Typography variant="body2">
                              {new Date(optimization.created_at).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Target
                            </Typography>
                            <Typography variant="body2" textTransform="capitalize">
                              {optimization.target}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Suggested Changes */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TuneIcon />
                          <Typography variant="h6">
                            Suggested Changes
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {Object.entries(optimization.suggested_changes).map(([key, value]) => (
                            <Card key={key} variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {typeof value === 'object' ? (
                                    Object.entries(value).map(([subKey, subValue]) => (
                                      <Box key={subKey} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                          {subKey.replace(/_/g, ' ')}:
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {String(subValue)}
                                        </Typography>
                                      </Box>
                                    ))
                                  ) : (
                                    <Typography variant="body2">
                                      {String(value)}
                                    </Typography>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    {/* Expected Effects */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TrendingUpIcon />
                          <Typography variant="h6">
                            Expected Effects
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {Object.entries(optimization.expected_effects).map(([key, effect]) => (
                            <ListItem key={key}>
                              <ListItemIcon>
                                <CheckIcon color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                secondary={effect}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => onOptimizationApply?.(optimization)}
                        disabled={!onOptimizationApply}
                      >
                        Apply to Draft Method
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<TimerIcon />}
                      >
                        Schedule Optimization
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ChartIcon />}
                      >
                        View Performance History
                      </Button>
                    </Box>
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MethodOptimizer;
