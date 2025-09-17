import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  TrendingDown,
  Assessment,
  Savings,
  LocalGasStation,
  Build,
  Inventory,
  TrendingUp,
  Psychology,
  Analytics,
  Calculate,
  PieChart,
  Lightbulb,
  Speed
} from '@mui/icons-material';

interface CostOptimizationProps {
  className?: string;
}

interface CostOptimizationRequest {
  analysis_period_days: number;
  cost_categories: string[];
  optimization_targets: string[];
}

interface OptimizationOpportunity {
  category: string;
  opportunity: string;
  current_cost: number;
  potential_savings: number;
  implementation_effort: string;
  payback_period_months?: number;
}

interface CostOptimizationResult {
  current_cost: number;
  optimization_opportunities: OptimizationOpportunity[];
  potential_annual_savings: number;
  implementation_priority: string[];
}

const CostOptimization: React.FC<CostOptimizationProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CostOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [analysisPeriod, setAnalysisPeriod] = useState(90);
  const [costCategories, setCostCategories] = useState<string[]>(['consumables', 'maintenance', 'utilities']);
  const [optimizationTargets, setOptimizationTargets] = useState<string[]>(['reduce_waste', 'bulk_purchasing', 'energy_efficiency']);

  const categoryOptions = [
    { id: 'consumables', name: 'Consumables', icon: <Inventory />, color: 'primary' },
    { id: 'maintenance', name: 'Maintenance', icon: <Build />, color: 'secondary' },
    { id: 'utilities', name: 'Utilities', icon: <LocalGasStation />, color: 'success' },
    { id: 'labor', name: 'Labor', icon: <Assessment />, color: 'warning' },
    { id: 'equipment', name: 'Equipment', icon: <Psychology />, color: 'info' }
  ];

  const targetOptions = [
    { id: 'reduce_waste', name: 'Reduce Waste', icon: <TrendingDown />, color: 'success' },
    { id: 'bulk_purchasing', name: 'Bulk Purchasing', icon: <Savings />, color: 'primary' },
    { id: 'energy_efficiency', name: 'Energy Efficiency', icon: <LocalGasStation />, color: 'secondary' },
    { id: 'preventive_maintenance', name: 'Preventive Maintenance', icon: <Build />, color: 'warning' },
    { id: 'automation', name: 'Automation', icon: <Speed />, color: 'info' }
  ];

  useEffect(() => {
    // Auto-run analysis on component mount
    runCostAnalysis();
  }, []);

  const runCostAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CostOptimizationRequest = {
        analysis_period_days: analysisPeriod,
        cost_categories: costCategories,
        optimization_targets: optimizationTargets
      };

      const response = await fetch('http://localhost:8000/ai/cost-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysisResult: CostOptimizationResult = await response.json();
      setResult(analysisResult);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Cost optimization analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getEffortColor = (effort: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (effort.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryOption = categoryOptions.find(opt => opt.id === category);
    return categoryOption ? categoryOption.icon : <Assessment />;
  };

  const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default' => {
    const categoryOption = categoryOptions.find(opt => opt.id === category);
    return categoryOption ? categoryOption.color as 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default' : 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateROI = (savings: number, cost: number) => {
    if (cost === 0) return 0;
    return ((savings * 12 - cost) / cost * 100);
  };

  const getTotalPotentialSavings = () => {
    if (!result) return 0;
    return result.optimization_opportunities.reduce((sum, opp) => sum + opp.potential_savings, 0);
  };

  const getImplementationCosts = () => {
    if (!result) return 0;
    // Estimate implementation costs based on effort level
    return result.optimization_opportunities.reduce((sum, opp) => {
      const effortMultiplier = opp.implementation_effort === 'low' ? 0.1 : 
                              opp.implementation_effort === 'medium' ? 0.3 : 0.5;
      return sum + (opp.potential_savings * effortMultiplier);
    }, 0);
  };

  return (
    <Box className={className} sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingDown sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Cost Optimization Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            AI-powered cost analysis and savings opportunity identification
          </Typography>
        </Box>
      </Box>

      {/* Configuration Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Analytics sx={{ mr: 1 }} />
            Analysis Configuration
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Analysis Period</InputLabel>
                <Select
                  value={analysisPeriod}
                  label="Analysis Period"
                  onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                >
                  <MenuItem value={30}>30 days</MenuItem>
                  <MenuItem value={90}>90 days</MenuItem>
                  <MenuItem value={180}>6 months</MenuItem>
                  <MenuItem value={365}>1 year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Cost Categories</InputLabel>
                <Select
                  multiple
                  value={costCategories}
                  label="Cost Categories"
                  onChange={(e) => setCostCategories(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categoryOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Optimization Targets</InputLabel>
                <Select
                  multiple
                  value={optimizationTargets}
                  label="Optimization Targets"
                  onChange={(e) => setOptimizationTargets(e.target.value as string[])}
                  renderValue={(selected) => selected.length + ' targets'}
                >
                  {targetOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={runCostAnalysis}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Calculate />}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      {result && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {formatCurrency(result.current_cost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Monthly Cost
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {formatCurrency(getTotalPotentialSavings())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monthly Savings Potential
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {formatCurrency(result.potential_annual_savings)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Annual Savings Potential
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {result.optimization_opportunities.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optimization Opportunities
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

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
              AI is analyzing cost patterns and identifying optimization opportunities...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Grid container spacing={3}>
          {/* Optimization Opportunities */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Lightbulb sx={{ mr: 1 }} />
                  Optimization Opportunities
                </Typography>

                <List>
                  {result.optimization_opportunities.map((opportunity, index) => (
                    <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${getCategoryColor(opportunity.category)}.light` }}>
                          {getCategoryIcon(opportunity.category)}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                              {opportunity.opportunity}
                            </Typography>
                            <Chip 
                              label={opportunity.category}
                              color={getCategoryColor(opportunity.category)}
                              size="small"
                            />
                            <Chip 
                              label={`${opportunity.implementation_effort} effort`}
                              color={getEffortColor(opportunity.implementation_effort)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Current Cost
                                </Typography>
                                <Typography variant="h6" color="primary.main">
                                  {formatCurrency(opportunity.current_cost)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Monthly Savings
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                  {formatCurrency(opportunity.potential_savings)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Annual Impact
                                </Typography>
                                <Typography variant="h6" color="info.main">
                                  {formatCurrency(opportunity.potential_savings * 12)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="body2" color="text.secondary">
                                  {opportunity.payback_period_months ? 'Payback Period' : 'ROI'}
                                </Typography>
                                <Typography variant="h6" color="warning.main">
                                  {opportunity.payback_period_months 
                                    ? `${opportunity.payback_period_months} mo`
                                    : `${calculateROI(opportunity.potential_savings, opportunity.current_cost * 0.1).toFixed(0)}%`
                                  }
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Implementation Priority & Summary */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              {/* Implementation Priority */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1 }} />
                      Implementation Priority
                    </Typography>

                    <List dense>
                      {result.implementation_priority.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Chip 
                              label={index + 1}
                              color="primary"
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={item}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cost Breakdown */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PieChart sx={{ mr: 1 }} />
                      Cost Analysis Summary
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Monthly Spend
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(result.current_cost)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Potential Monthly Savings
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          -{formatCurrency(getTotalPotentialSavings())}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Est. Implementation Cost
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="warning.main">
                          {formatCurrency(getImplementationCosts())}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          Optimized Monthly Cost
                        </Typography>
                        <Typography variant="subtitle2" color="primary.main">
                          {formatCurrency(result.current_cost - getTotalPotentialSavings())}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          Annual Savings
                        </Typography>
                        <Typography variant="subtitle2" color="success.main">
                          {formatCurrency(result.potential_annual_savings)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {!result && !loading && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <TrendingDown sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Cost Optimization Analytics Ready
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your analysis parameters and click "Analyze" to discover AI-powered cost optimization opportunities and potential savings.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CostOptimization;