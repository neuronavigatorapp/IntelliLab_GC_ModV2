import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  Engineering,
  TrendingDown,
  Dashboard,
  Analytics,
  Lightbulb,
  Launch,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../lib/routes';

interface AIDashboardProps {
  className?: string;
}

interface AIEngineStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  lastUpdate: string;
  insights: number;
  recommendations: number;
}

interface AIInsight {
  id: string;
  engine: 'method_optimization' | 'predictive_maintenance' | 'cost_optimization';
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  value?: number;
  unit?: string;
  timestamp: string;
}

interface DashboardMetrics {
  totalAnalyses: number;
  activePredictions: number;
  potentialSavings: number;
  systemHealth: number;
  optimizationScore: number;
  maintenanceAlerts: number;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ className }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engines, setEngines] = useState<AIEngineStatus[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Mock data for demo purposes - in production this would come from APIs
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API calls to all AI engines
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock engine status data
      setEngines([
        {
          id: 'method_optimization',
          name: 'Method Optimization AI',
          status: 'active',
          lastUpdate: new Date().toLocaleTimeString(),
          insights: 12,
          recommendations: 8
        },
        {
          id: 'predictive_maintenance',
          name: 'Predictive Maintenance AI',
          status: 'active',
          lastUpdate: new Date().toLocaleTimeString(),
          insights: 7,
          recommendations: 4
        },
        {
          id: 'cost_optimization',
          name: 'Cost Optimization AI',
          status: 'active',
          lastUpdate: new Date().toLocaleTimeString(),
          insights: 15,
          recommendations: 11
        }
      ]);

      // Mock insights data
      setInsights([
        {
          id: '1',
          engine: 'method_optimization',
          title: 'Column Temperature Optimization',
          summary: 'Reducing column temperature by 15°C can improve separation efficiency by 23%',
          impact: 'high',
          category: 'Performance',
          value: 23,
          unit: '%',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          engine: 'predictive_maintenance',
          title: 'Injector Maintenance Due',
          summary: 'Injector shows wear patterns indicating maintenance needed within 2 weeks',
          impact: 'medium',
          category: 'Maintenance',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          engine: 'cost_optimization',
          title: 'Carrier Gas Optimization',
          summary: 'Switching to optimized flow rates could save $450/month in carrier gas costs',
          impact: 'high',
          category: 'Savings',
          value: 450,
          unit: '$/month',
          timestamp: new Date().toISOString()
        },
        {
          id: '4',
          engine: 'method_optimization',
          title: 'Sample Volume Adjustment',
          summary: 'Reducing injection volume by 20% maintains peak quality while extending column life',
          impact: 'medium',
          category: 'Efficiency',
          value: 20,
          unit: '%',
          timestamp: new Date().toISOString()
        },
        {
          id: '5',
          engine: 'cost_optimization',
          title: 'Bulk Solvent Purchasing',
          summary: 'Annual solvent contracts could reduce costs by 18% vs current purchasing',
          impact: 'high',
          category: 'Procurement',
          value: 18,
          unit: '%',
          timestamp: new Date().toISOString()
        }
      ]);

      // Mock metrics data
      setMetrics({
        totalAnalyses: 1247,
        activePredictions: 34,
        potentialSavings: 12450,
        systemHealth: 87,
        optimizationScore: 92,
        maintenanceAlerts: 3
      });

    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getEngineIcon = (engineId: string) => {
    switch (engineId) {
      case 'method_optimization': return <Psychology />;
      case 'predictive_maintenance': return <Engineering />;
      case 'cost_optimization': return <TrendingDown />;
      default: return <Analytics />;
    }
  };

  const getEngineColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active': return 'success';
      case 'processing': return 'info';
      case 'idle': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getImpactColor = (impact: string): 'error' | 'warning' | 'success' => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'success';
    }
  };

  const getEngineRoute = (engineId: string) => {
    switch (engineId) {
      case 'method_optimization': return routes.aiMethodOptimization;
      case 'predictive_maintenance': return routes.predictiveMaintenance;
      case 'cost_optimization': return routes.costOptimization;
      default: return routes.dashboard;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box className={className} sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Dashboard sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              AI Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Unified intelligence across method optimization, predictive maintenance, and cost analysis
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={refreshDashboard}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Loading AI analytics data...
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          {metrics && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {metrics.totalAnalyses.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Analyses
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {metrics.optimizationScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optimization Score
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {formatCurrency(metrics.potentialSavings)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Potential Savings
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {metrics.systemHealth}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Health
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {metrics.activePredictions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Predictions
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {metrics.maintenanceAlerts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintenance Alerts
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          <Grid container spacing={3}>
            {/* AI Engine Status */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 1 }} />
                    AI Engine Status
                  </Typography>

                  <List>
                    {engines.map((engine) => (
                      <ListItem 
                        key={engine.id}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1, 
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => navigate(getEngineRoute(engine.id))}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: `${getEngineColor(engine.status)}.light` }}>
                            {getEngineIcon(engine.id)}
                          </Avatar>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                                {engine.name}
                              </Typography>
                              <Chip 
                                label={engine.status}
                                color={getEngineColor(engine.status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {engine.insights} insights • {engine.recommendations} recommendations
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Updated: {engine.lastUpdate}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(getEngineRoute(engine.id)); }}>
                          <Launch />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent AI Insights */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Lightbulb sx={{ mr: 1 }} />
                    Latest AI Insights
                  </Typography>

                  <List>
                    {insights.map((insight) => (
                      <ListItem 
                        key={insight.id}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1, 
                          mb: 1 
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: `${getEngineColor('active')}.light` }}>
                            {getEngineIcon(insight.engine)}
                          </Avatar>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                                {insight.title}
                              </Typography>
                              <Chip 
                                label={insight.impact}
                                color={getImpactColor(insight.impact)}
                                size="small"
                              />
                              <Chip 
                                label={insight.category}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {insight.summary}
                              </Typography>
                              {insight.value && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h6" color="primary.main">
                                    {insight.value}{insight.unit}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    • {new Date(insight.timestamp).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Psychology />}
                      onClick={() => navigate(routes.aiMethodOptimization)}
                    >
                      Method Optimization
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<Engineering />}
                      onClick={() => navigate(routes.predictiveMaintenance)}
                    >
                      Predictive Maintenance
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<TrendingDown />}
                      onClick={() => navigate(routes.costOptimization)}
                    >
                      Cost Optimization
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AIDashboard;