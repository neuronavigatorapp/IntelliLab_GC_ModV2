import React, { useState } from 'react';
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
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Compare as CompareIcon,
  TrendingUp as ImprovementIcon,
  TrendingDown as DeclineIcon,
  Remove as NoChangeIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';

interface ComparisonResult {
  method1_results: Record<string, any>;
  method2_results: Record<string, any>;
  comparison_metrics: Record<string, number>;
  recommendations: string[];
  charts_data?: Record<string, any>;
}

interface MethodParameters {
  [key: string]: any;
}

const MethodComparison: React.FC = () => {
  const [method1, setMethod1] = useState<MethodParameters>({});
  const [method2, setMethod2] = useState<MethodParameters>({});
  const [toolType, setToolType] = useState('inlet_simulator');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'detection_limit',
    'efficiency', 
    'analysis_time'
  ]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available tool types and metrics
  const toolTypes = [
    { value: 'inlet_simulator', label: 'Inlet Simulator' },
    { value: 'detection_limit', label: 'Detection Limit Calculator' },
    { value: 'oven_ramp', label: 'Oven Ramp Visualizer' }
  ];
  
  const availableMetrics = [
    { value: 'detection_limit', label: 'Detection Limit' },
    { value: 'resolution', label: 'Resolution' },
    { value: 'efficiency', label: 'Efficiency' },
    { value: 'analysis_time', label: 'Analysis Time' },
    { value: 'cost', label: 'Cost' }
  ];
  
  // Tool-specific parameter templates
  const getParameterTemplate = (tool: string) => {
    switch (tool) {
      case 'inlet_simulator':
        return {
          injection_temperature: 250,
          split_ratio: 10,
          injection_volume: 1.0,
          liner_type: 'Split',
          carrier_gas: 'Helium',
          carrier_flow: 1.5
        };
      case 'detection_limit':
        return {
          signal_to_noise: 3.0,
          noise_level: 1.0,
          peak_height: 10.0,
          injection_volume: 1.0,
          concentration_factor: 1.0
        };
      case 'oven_ramp':
        return {
          initial_temp: 50,
          initial_time: 2,
          ramp_rate: 10,
          final_temp: 280,
          final_time: 5
        };
      default:
        return {};
    }
  };
  
  // Initialize methods with templates when tool type changes
  React.useEffect(() => {
    const template = getParameterTemplate(toolType);
    setMethod1({ ...template });
    setMethod2({ ...template });
    setComparisonResult(null);
  }, [toolType]);
  
  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/comparison/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method1,
          method2,
          tool_type: toolType,
          metrics: selectedMetrics
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to compare methods');
      }
      
      const result = await response.json();
      setComparisonResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };
  
  const updateMethodParameter = (methodNum: 1 | 2, key: string, value: any) => {
    const setMethod = methodNum === 1 ? setMethod1 : setMethod2;
    setMethod(prev => ({ ...prev, [key]: value }));
  };
  
  const renderParameterInput = (methodNum: 1 | 2, key: string, value: any) => {
    const handleChange = (newValue: any) => {
      updateMethodParameter(methodNum, key, newValue);
    };
    
    // Special handling for certain parameters
    if (key === 'liner_type') {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{key.replace('_', ' ')}</InputLabel>
          <Select
            value={value || 'Split'}
            onChange={(e) => handleChange(e.target.value)}
            label={key.replace('_', ' ')}
          >
            <MenuItem value="Split">Split</MenuItem>
            <MenuItem value="Splitless">Splitless</MenuItem>
            <MenuItem value="Direct">Direct</MenuItem>
          </Select>
        </FormControl>
      );
    }
    
    if (key === 'carrier_gas') {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{key.replace('_', ' ')}</InputLabel>
          <Select
            value={value || 'Helium'}
            onChange={(e) => handleChange(e.target.value)}
            label={key.replace('_', ' ')}
          >
            <MenuItem value="Helium">Helium</MenuItem>
            <MenuItem value="Hydrogen">Hydrogen</MenuItem>
            <MenuItem value="Nitrogen">Nitrogen</MenuItem>
          </Select>
        </FormControl>
      );
    }
    
    // Numeric inputs
    return (
      <TextField
        fullWidth
        size="small"
        label={key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        type="number"
        value={value || ''}
        onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
      />
    );
  };
  
  const getComparisonIcon = (value: number) => {
    if (value > 5) return <ImprovementIcon color="success" />;
    if (value < -5) return <DeclineIcon color="error" />;
    return <NoChangeIcon color="disabled" />;
  };
  
  const formatMetricValue = (metric: string, value: number) => {
    if (metric.includes('time')) return `${value.toFixed(1)} min`;
    if (metric.includes('limit')) return `${value.toFixed(3)}`;
    if (metric.includes('efficiency') || metric.includes('resolution')) return `${value.toFixed(1)}%`;
    if (metric.includes('cost')) return `$${value.toFixed(2)}`;
    return value.toFixed(2);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Method Comparison Tool
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Compare two GC methods side-by-side to identify the optimal approach for your analysis.
        Select parameters for each method and choose comparison metrics to evaluate performance.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Tool Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comparison Setup
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tool Type</InputLabel>
                <Select
                  value={toolType}
                  onChange={(e) => setToolType(e.target.value)}
                  label="Tool Type"
                >
                  {toolTypes.map(tool => (
                    <MenuItem key={tool.value} value={tool.value}>
                      {tool.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Comparison Metrics</InputLabel>
                <Select
                  multiple
                  value={selectedMetrics}
                  onChange={(e) => setSelectedMetrics(e.target.value as string[])}
                  label="Comparison Metrics"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={availableMetrics.find(m => m.value === value)?.label}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {availableMetrics.map(metric => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Method Parameters */}
      <Grid container spacing={3}>
        {/* Method 1 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Method 1
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(method1).map(([key, value]) => (
                  <Grid item xs={12} key={key}>
                    {renderParameterInput(1, key, value)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Method 2 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary">
                Method 2
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(method2).map(([key, value]) => (
                  <Grid item xs={12} key={key}>
                    {renderParameterInput(2, key, value)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Compare Button */}
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CompareIcon />}
          onClick={handleCompare}
          disabled={loading || selectedMetrics.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : 'Compare Methods'}
        </Button>
      </Box>
      
      {/* Comparison Results */}
      {comparisonResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Comparison Results
          </Typography>
          
          {/* Metrics Comparison */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Comparison
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Method 1</TableCell>
                      <TableCell align="center">Method 2</TableCell>
                      <TableCell align="center">Improvement</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(comparisonResult.comparison_metrics).map(([metric, improvement]) => {
                      const method1Value = comparisonResult.method1_results[metric];
                      const method2Value = comparisonResult.method2_results[metric];
                      
                      return (
                        <TableRow key={metric}>
                          <TableCell>
                            {availableMetrics.find(m => m.value === metric)?.label || metric}
                          </TableCell>
                          <TableCell align="center">
                            {method1Value !== undefined ? formatMetricValue(metric, method1Value) : 'N/A'}
                          </TableCell>
                          <TableCell align="center">
                            {method2Value !== undefined ? formatMetricValue(metric, method2Value) : 'N/A'}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {getComparisonIcon(improvement)}
                              <Typography sx={{ ml: 1 }}>
                                {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={improvement > 5 ? 'Better' : improvement < -5 ? 'Worse' : 'Similar'}
                              color={improvement > 5 ? 'success' : improvement < -5 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          
          {/* Recommendations */}
          {comparisonResult.recommendations.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Optimization Recommendations
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {comparisonResult.recommendations.map((recommendation, index) => (
                    <Alert key={index} severity="info" sx={{ mb: 1 }}>
                      {recommendation}
                    </Alert>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
          
          {/* Charts */}
          {comparisonResult.charts_data && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Visual Comparison
              </Typography>
              
              {Object.entries(comparisonResult.charts_data).map(([chartName, chartData]: [string, any]) => (
                <Card key={chartName} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {chartName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    
                    <Plot
                      data={chartData.data.datasets?.map((dataset: any, index: number) => ({
                        x: chartData.data.labels,
                        y: dataset.data,
                        type: chartData.type === 'line' ? 'scatter' : chartData.type,
                        mode: chartData.type === 'line' ? 'lines+markers' : undefined,
                        name: dataset.label,
                        marker: {
                          color: index === 0 ? '#1976d2' : '#ff9800'
                        }
                      })) || []}
                      layout={{
                        title: chartData.title,
                        autosize: true,
                        margin: { t: 40, b: 40, l: 60, r: 40 }
                      }}
                      style={{ width: '100%', height: '400px' }}
                      config={{ responsive: true }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MethodComparison;
