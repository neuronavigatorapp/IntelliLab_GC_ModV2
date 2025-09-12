import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  TrendingUp as OptimizeIcon,
  Download as ExportIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';

interface CostCalculationResult {
  total_cost: number;
  cost_per_analysis: number;
  breakdown: Record<string, number>;
  consumables_cost: number;
  labor_cost: number;
  instrument_time_cost: number;
  overhead_cost: number;
  analysis_count: number;
  calculation_details: Record<string, any>;
}

interface CostItem {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  unit_cost: number;
  unit: string;
  supplier: string;
  part_number: string;
  description: string;
  is_active: boolean;
}

const CostCalculator: React.FC = () => {
  const [methodParameters, setMethodParameters] = useState<Record<string, any>>({
    injection_temperature: 250,
    split_ratio: 10,
    injection_volume: 1.0,
    carrier_flow: 1.5,
    total_time: 20,
    uses_solvent: false,
    requires_prep: false,
    detector_type: 'FID'
  });
  
  const [analysisCount, setAnalysisCount] = useState(10);
  const [includeOverhead, setIncludeOverhead] = useState(true);
  const [overheadPercentage, setOverheadPercentage] = useState(20);
  
  const [costResult, setCostResult] = useState<CostCalculationResult | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  useEffect(() => {
    loadCostItems();
  }, []);
  
  const loadCostItems = async () => {
    try {
      const response = await fetch('/api/v1/costs/items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCostItems(data);
      }
    } catch (error) {
      console.error('Failed to load cost items:', error);
    }
  };
  
  const calculateCost = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/v1/costs/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method_parameters: methodParameters,
          analysis_count: analysisCount,
          include_overhead: includeOverhead,
          overhead_percentage: overheadPercentage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate cost');
      }
      
      const result = await response.json();
      setCostResult(result);
      
      // Get optimization suggestions
      const optimizeResponse = await fetch('/api/v1/costs/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method_parameters: methodParameters,
          analysis_count: analysisCount,
          include_overhead: includeOverhead,
          overhead_percentage: overheadPercentage
        })
      });
      
      if (optimizeResponse.ok) {
        const optimizeData = await optimizeResponse.json();
        setOptimizationSuggestions(optimizeData.optimization_suggestions || []);
      }
      
      setSuccess('Cost calculation completed successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Cost calculation failed');
    } finally {
      setLoading(false);
    }
  };
  
  const updateParameter = (key: string, value: any) => {
    setMethodParameters(prev => ({ ...prev, [key]: value }));
  };
  
  const loadFromCurrentSession = () => {
    // Try to load parameters from current tool session
    const savedData = sessionStorage.getItem('currentAnalysisData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setMethodParameters(prev => ({ ...prev, ...data.parameters }));
        setSuccess('Parameters loaded from current session');
      } catch {
        setError('Failed to load session data');
      }
    } else {
      setError('No analysis data found in current session');
    }
  };
  
  const exportResults = () => {
    if (!costResult) return;
    
    const exportData = {
      calculation_summary: {
        total_cost: costResult.total_cost,
        cost_per_analysis: costResult.cost_per_analysis,
        analysis_count: costResult.analysis_count
      },
      breakdown: costResult.breakdown,
      method_parameters: methodParameters,
      optimization_suggestions: optimizationSuggestions,
      calculation_date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const generateCostChart = () => {
    if (!costResult) return {
      data: [],
      layout: { title: 'Cost Breakdown' }
    };
    
    const categories = Object.keys(costResult.breakdown).filter(key => key !== 'subtotal');
    const values = categories.map(key => costResult.breakdown[key]);
    const colors = ['#1976d2', '#ff9800', '#4caf50', '#f44336', '#9c27b0'];
    
    return {
      data: [{
        values: values,
        labels: categories.map(key => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
        type: 'pie',
        marker: { colors: colors },
        textinfo: 'label+percent',
        textposition: 'outside'
      }],
      layout: {
        title: 'Cost Breakdown',
        showlegend: true,
        margin: { t: 40, b: 40, l: 40, r: 40 }
      }
    };
  };
  
  const generateTrendChart = () => {
    if (!costResult) return {
      data: [],
      layout: { title: 'Cost Trend' }
    };
    
    // Generate cost trend for different analysis counts
    const counts = [5, 10, 20, 50, 100, 200];
    const costsPerAnalysis = counts.map(count => {
      // Simplified calculation for trend
      const fixedCosts = costResult.labor_cost + costResult.overhead_cost;
      const variableCosts = costResult.consumables_cost + costResult.instrument_time_cost;
      return (fixedCosts + variableCosts * (count / analysisCount)) / count;
    });
    
    return {
      data: [{
        x: counts,
        y: costsPerAnalysis,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Cost per Analysis',
        line: { color: '#1976d2' },
        marker: { size: 8 }
      }],
      layout: {
        title: 'Cost per Analysis vs. Batch Size',
        xaxis: { title: 'Number of Analyses' },
        yaxis: { title: 'Cost per Analysis ($)' },
        showlegend: false,
        margin: { t: 40, b: 60, l: 60, r: 40 }
      }
    };
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cost Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate comprehensive method costs including consumables, labor, instrument time, and overhead.
        Optimize your analytical workflows for maximum cost efficiency.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Input Parameters */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Method Parameters
              </Typography>
              
              <Button
                variant="outlined"
                onClick={loadFromCurrentSession}
                sx={{ mb: 2 }}
                size="small"
              >
                Load from Current Session
              </Button>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Analysis Count"
                    type="number"
                    value={analysisCount}
                    onChange={(e) => setAnalysisCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Time (min)"
                    type="number"
                    value={methodParameters.total_time}
                    onChange={(e) => updateParameter('total_time', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Injection Temperature (°C)"
                    type="number"
                    value={methodParameters.injection_temperature}
                    onChange={(e) => updateParameter('injection_temperature', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Split Ratio"
                    type="number"
                    value={methodParameters.split_ratio}
                    onChange={(e) => updateParameter('split_ratio', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Injection Volume (μL)"
                    type="number"
                    value={methodParameters.injection_volume}
                    onChange={(e) => updateParameter('injection_volume', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Carrier Flow (mL/min)"
                    type="number"
                    value={methodParameters.carrier_flow}
                    onChange={(e) => updateParameter('carrier_flow', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Detector Type</InputLabel>
                    <Select
                      value={methodParameters.detector_type}
                      onChange={(e) => updateParameter('detector_type', e.target.value)}
                      label="Detector Type"
                    >
                      <MenuItem value="FID">FID</MenuItem>
                      <MenuItem value="MS">MS</MenuItem>
                      <MenuItem value="MS/MS">MS/MS</MenuItem>
                      <MenuItem value="ECD">ECD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Overhead Percentage"
                    type="number"
                    value={overheadPercentage}
                    onChange={(e) => setOverheadPercentage(parseFloat(e.target.value) || 0)}
                    disabled={!includeOverhead}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={methodParameters.uses_solvent}
                        onChange={(e) => updateParameter('uses_solvent', e.target.checked)}
                      />
                    }
                    label="Uses Solvents"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={methodParameters.requires_prep}
                        onChange={(e) => updateParameter('requires_prep', e.target.checked)}
                      />
                    }
                    label="Requires Sample Preparation"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeOverhead}
                        onChange={(e) => setIncludeOverhead(e.target.checked)}
                      />
                    }
                    label="Include Overhead Costs"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                    onClick={calculateCost}
                    disabled={loading || analysisCount < 1}
                  >
                    Calculate Cost
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Results */}
        <Grid item xs={12} lg={6}>
          {costResult ? (
            <Box>
              {/* Cost Summary */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Summary
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                        <Typography variant="h4">
                          ${costResult.total_cost.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Total Cost
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                        <Typography variant="h4">
                          ${costResult.cost_per_analysis.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Cost per Analysis
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<InfoIcon />}
                      onClick={() => setDetailsDialogOpen(true)}
                      size="small"
                    >
                      Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ExportIcon />}
                      onClick={exportResults}
                      size="small"
                    >
                      Export
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Cost Breakdown */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Breakdown
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(costResult.breakdown)
                          .filter(([key]) => key !== 'subtotal')
                          .map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>
                              {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                            <TableCell align="right">
                              ${value.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {((value / costResult.total_cost) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
              
              {/* Charts */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Visualization
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Plot
                      {...generateCostChart()}
                      style={{ width: '100%', height: '300px' }}
                      config={{ responsive: true }}
                    />
                  </Box>
                  
                  <Box>
                    <Plot
                      {...generateTrendChart()}
                      style={{ width: '100%', height: '300px' }}
                      config={{ responsive: true }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Enter method parameters and click Calculate Cost
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Get detailed cost analysis including consumables, labor, and overhead
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      
      {/* Optimization Suggestions */}
      {optimizationSuggestions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <OptimizeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Cost Optimization Suggestions
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {optimizationSuggestions.map((suggestion, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {suggestion}
                  </Alert>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
      
      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Cost Calculation Details</DialogTitle>
        <DialogContent>
          {costResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Calculation Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Cost:</Typography>
                  <Typography variant="h5" color="primary">
                    ${costResult.total_cost.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Cost per Analysis:</Typography>
                  <Typography variant="h5" color="secondary">
                    ${costResult.cost_per_analysis.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Analysis Count:</Typography>
                  <Typography variant="body1">{costResult.analysis_count}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Method Parameters Used
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" component="pre">
                  {JSON.stringify(methodParameters, null, 2)}
                </Typography>
              </Paper>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Calculation Assumptions
              </Typography>
              {costResult.calculation_details?.assumptions && (
                <Box>
                  {Object.entries(costResult.calculation_details.assumptions).map(([key, value]) => (
                    <Typography key={key} variant="body2">
                      <strong>{key.replace('_', ' ')}:</strong> {String(value)}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={exportResults}>
            Export Results
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostCalculator;
