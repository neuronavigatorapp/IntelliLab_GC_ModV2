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
  useMediaQuery
} from '@mui/material';
import {
  Science as ScienceIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useGlobalData } from '../../store/globalDataStore';
import { AIRecommendation } from '../../store/globalDataStore';
import { isDiagnosticsEnabled } from '../../config/featureFlags';

interface DiagnosticsFilters {
  instrument_id?: number;
  method_id?: number;
  include_ghost_peaks: boolean;
  include_sensitivity_analysis: boolean;
  include_drift_analysis: boolean;
}

interface DiagnosticsPanelProps {
  onRecommendationClick?: (recommendation: AIRecommendation) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ 
  onRecommendationClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchDiagnostics } = useGlobalData();
  
  const [filters, setFilters] = useState<DiagnosticsFilters>({
    include_ghost_peaks: true,
    include_sensitivity_analysis: true,
    include_drift_analysis: true
  });
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Mock instruments and methods for demo
  const mockInstruments = [
    { id: 1, name: 'GC-2030', model: 'Shimadzu GC-2030' },
    { id: 2, name: 'GC-2010', model: 'Shimadzu GC-2010' },
    { id: 3, name: 'GC-2025', model: 'Shimadzu GC-2025' }
  ];

  const mockMethods = [
    { id: 1, name: 'BTEX-2024-01', type: 'Environmental' },
    { id: 2, name: 'VOC-Analysis', type: 'Environmental' },
    { id: 3, name: 'Hydrocarbons', type: 'Petrochemical' }
  ];

  const runDiagnostics = async () => {
    if (!isDiagnosticsEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await fetchDiagnostics(filters);
      setRecommendations(results);
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diagnostic':
        return <ScienceIcon />;
      case 'method':
        return <TrendingUpIcon />;
      case 'maintenance':
        return <WarningIcon />;
      case 'cost':
        return <TrendingDownIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getTrendIcon = (title: string) => {
    if (title.includes('increasing')) return <TrendingUpIcon />;
    if (title.includes('decreasing')) return <TrendingDownIcon />;
    return <RemoveIcon />;
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ScienceIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Run Diagnostics
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                Analyze instrument performance and detect issues
              </Typography>
            </Box>
          </Box>
          
          {lastRun && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Last run: {lastRun.toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Filters
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Instrument</InputLabel>
                  <Select
                    value={filters.instrument_id || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      instrument_id: e.target.value as number 
                    }))}
                    label="Instrument"
                  >
                    <MenuItem value="">
                      <em>All Instruments</em>
                    </MenuItem>
                    {mockInstruments.map((instrument) => (
                      <MenuItem key={instrument.id} value={instrument.id}>
                        {instrument.name} - {instrument.model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Method</InputLabel>
                  <Select
                    value={filters.method_id || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      method_id: e.target.value as number 
                    }))}
                    label="Method"
                  >
                    <MenuItem value="">
                      <em>All Methods</em>
                    </MenuItem>
                    {mockMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name} ({method.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Analysis Types
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControl component="fieldset">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="checkbox"
                          checked={filters.include_drift_analysis}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            include_drift_analysis: e.target.checked 
                          }))}
                        />
                        <Typography variant="body2">Retention Drift Analysis</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="checkbox"
                          checked={filters.include_ghost_peaks}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            include_ghost_peaks: e.target.checked 
                          }))}
                        />
                        <Typography variant="body2">Ghost Peak Detection</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="checkbox"
                          checked={filters.include_sensitivity_analysis}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            include_sensitivity_analysis: e.target.checked 
                          }))}
                        />
                        <Typography variant="body2">Sensitivity Analysis</Typography>
                      </Box>
                    </Box>
                  </FormControl>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<ScienceIcon />}
                onClick={runDiagnostics}
                disabled={isLoading || !isDiagnosticsEnabled()}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'Running Analysis...' : 'Run Diagnostics'}
              </Button>

              {isLoading && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Analyzing instrument performance...
                  </Typography>
                </Box>
              )}

              {!isDiagnosticsEnabled() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Diagnostics feature is currently disabled
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Analysis Results
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={`${recommendations.length} Recommendations`}
                    color="primary"
                    size="small"
                  />
                  {recommendations.length > 0 && (
                    <Tooltip title="Refresh Analysis">
                      <IconButton size="small" onClick={runDiagnostics}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {recommendations.length === 0 && !isLoading ? (
                <Alert severity="info">
                  No diagnostics have been run yet. Configure filters and click "Run Diagnostics" to start analysis.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recommendations.map((recommendation, index) => (
                    <Accordion key={recommendation.id} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          {getSeverityIcon(recommendation.severity)}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {recommendation.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                icon={getCategoryIcon(recommendation.category)}
                                label={recommendation.category}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`${(recommendation.confidence * 100).toFixed(0)}% confidence`}
                                size="small"
                                color={getConfidenceColor(recommendation.confidence) as any}
                              />
                              {recommendation.title.includes('Drift') && getTrendIcon(recommendation.title)}
                            </Box>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {recommendation.details}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={recommendation.severity}
                              size="small"
                              color={recommendation.severity as any}
                              variant="outlined"
                            />
                            {recommendation.actionable && (
                              <Chip
                                label="Actionable"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(recommendation.created_at).toLocaleString()}
                            </Typography>
                          </Box>

                          {recommendation.actionable && onRecommendationClick && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => onRecommendationClick(recommendation)}
                              sx={{ alignSelf: 'flex-start' }}
                            >
                              Apply Recommendation
                            </Button>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiagnosticsPanel;
