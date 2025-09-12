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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { useGlobalData } from '../../store/globalDataStore';
import { CostOptimizationResult, OptimizationSuggestion } from '../../store/globalDataStore';
import { isCostOptimizationEnabled } from '../../config/featureFlags';

interface CostOptimizerProps {
  onOptimizationApply?: (optimization: CostOptimizationResult) => void;
}

export const CostOptimizer: React.FC<CostOptimizerProps> = ({ 
  onOptimizationApply 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchCostOptimizer } = useGlobalData();
  
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null);
  const [optimization, setOptimization] = useState<CostOptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Mock data for demo
  const mockMethods = [
    { id: 1, name: 'BTEX-2024-01', type: 'Environmental', currentCost: 5.20 },
    { id: 2, name: 'VOC-Analysis', type: 'Environmental', currentCost: 4.80 },
    { id: 3, name: 'Hydrocarbons', type: 'Petrochemical', currentCost: 6.50 }
  ];

  const mockInstruments = [
    { id: 1, name: 'GC-2030', model: 'Shimadzu GC-2030' },
    { id: 2, name: 'GC-2010', model: 'Shimadzu GC-2010' },
    { id: 3, name: 'GC-2025', model: 'Shimadzu GC-2025' }
  ];

  const runOptimization = async () => {
    if (!isCostOptimizationEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        method_id: selectedMethodId,
        instrument_id: selectedInstrumentId,
        target_savings_percentage: 15.0
      };
      
      const result = await fetchCostOptimizer(payload);
      setOptimization(result);
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run cost optimization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getSavingsColor = (savings: number) => {
    if (savings >= 20) return 'success';
    if (savings >= 10) return 'warning';
    return 'info';
  };

  const exportToCSV = () => {
    if (!optimization) return;
    
    const csvContent = [
      'Item,Current Cost,Proposed Cost,Savings',
      `Total per analysis,${optimization.current_cost_per_analysis},${optimization.proposed_cost_per_analysis},${optimization.savings_percentage}%`,
      ...optimization.line_items.map(item => 
        `${item.name},${item.value},${item.value * 0.85},${((item.value - item.value * 0.85) / item.value * 100).toFixed(1)}%`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost_optimization_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TrendingDownIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Cost Optimizer
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                Reduce per-analysis costs through consumable and method optimization
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
        {/* Configuration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Settings
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
                            {method.type} • {formatCurrency(method.currentCost)} per analysis
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Instrument</InputLabel>
                  <Select
                    value={selectedInstrumentId || ''}
                    onChange={(e) => setSelectedInstrumentId(e.target.value as number)}
                    label="Instrument"
                  >
                    <MenuItem value="">
                      <em>Select an instrument</em>
                    </MenuItem>
                    {mockInstruments.map((instrument) => (
                      <MenuItem key={instrument.id} value={instrument.id}>
                        {instrument.name} - {instrument.model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedMethodId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Current Cost:</strong> {formatCurrency(mockMethods.find(m => m.id === selectedMethodId)?.currentCost || 0)} per analysis
                    </Typography>
                    <Typography variant="body2">
                      <strong>Target Savings:</strong> 15% reduction
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<TrendingDownIcon />}
                onClick={runOptimization}
                disabled={!selectedMethodId || isLoading || !isCostOptimizationEnabled()}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'Optimizing...' : 'Run Cost Analysis'}
              </Button>

              {isLoading && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Analyzing cost optimization opportunities...
                  </Typography>
                </Box>
              )}

              {!isCostOptimizationEnabled() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Cost optimization feature is currently disabled
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
                  Cost Optimization Results
                </Typography>
                {optimization && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Export to CSV">
                      <IconButton size="small" onClick={exportToCSV}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh Analysis">
                      <IconButton size="small" onClick={runOptimization}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {!optimization && !isLoading ? (
                <Alert severity="info">
                  Select a method and click "Run Cost Analysis" to identify cost optimization opportunities.
                </Alert>
              ) : (
                optimization && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Summary */}
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <MoneyIcon color="success" />
                          <Box>
                            <Typography variant="h6">
                              Cost Optimization Summary
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Potential savings identified
                            </Typography>
                          </Box>
                          <Chip
                            label={`${optimization.savings_percentage.toFixed(1)}% savings`}
                            color={getSavingsColor(optimization.savings_percentage) as any}
                            size="small"
                          />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Current Cost
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {formatCurrency(optimization.current_cost_per_analysis)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Proposed Cost
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(optimization.proposed_cost_per_analysis)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Savings
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(optimization.current_cost_per_analysis - optimization.proposed_cost_per_analysis)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">
                              Payback Period
                            </Typography>
                            <Typography variant="body2">
                              {optimization.payback_period_days ? `${optimization.payback_period_days} days` : 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Cost Breakdown */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <ChartIcon />
                          <Typography variant="h6">
                            Cost Breakdown
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell align="right">Current Cost</TableCell>
                                <TableCell align="right">Proposed Cost</TableCell>
                                <TableCell align="right">Savings</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {optimization.line_items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.value * 0.85)}</TableCell>
                                  <TableCell align="right" sx={{ color: 'success.main' }}>
                                    {formatCurrency(item.value * 0.15)}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                <TableCell><strong>Total per Analysis</strong></TableCell>
                                <TableCell align="right"><strong>{formatCurrency(optimization.current_cost_per_analysis)}</strong></TableCell>
                                <TableCell align="right"><strong>{formatCurrency(optimization.proposed_cost_per_analysis)}</strong></TableCell>
                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                  <strong>{formatCurrency(optimization.current_cost_per_analysis - optimization.proposed_cost_per_analysis)}</strong>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>

                    {/* Suggestions */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <SavingsIcon />
                          <Typography variant="h6">
                            Optimization Suggestions
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {optimization.suggestions.map((suggestion, index) => (
                            <Card key={index} variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <CheckIcon color="success" />
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {suggestion.target.charAt(0).toUpperCase() + suggestion.target.slice(1)} Optimization
                                  </Typography>
                                  <Chip
                                    label={`${(suggestion.confidence * 100).toFixed(0)}% confidence`}
                                    size="small"
                                    color="success"
                                  />
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {Object.entries(suggestion.expected_effects).map(([key, effect]) => (
                                    <Box key={key} sx={{ mb: 1 }}>
                                      <strong>{key.replace(/_/g, ' ')}:</strong> {effect}
                                    </Box>
                                  ))}
                                </Typography>
                                
                                {suggestion.cost_savings && (
                                  <Chip
                                    label={`Save ${formatCurrency(suggestion.cost_savings)} per analysis`}
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                  />
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
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
                        Apply Optimizations
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ScheduleIcon />}
                      >
                        Schedule Implementation
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={exportToCSV}
                      >
                        Export Report
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

export default CostOptimizer;
