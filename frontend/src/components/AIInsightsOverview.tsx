import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Psychology,
  Engineering,
  TrendingDown,
  Launch,
  Analytics,
  Lightbulb,
  Timeline,
  Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { routes } from '../lib/routes';
import { useAIShared } from '../contexts/AISharedContext';

interface AIInsightsOverviewProps {
  className?: string;
}

interface QuickInsight {
  id: string;
  engine: 'method' | 'maintenance' | 'cost' | 'correlation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  value?: string;
  action?: string;
  route?: string;
}

const AIInsightsOverview: React.FC<AIInsightsOverviewProps> = ({ className }) => {
  const navigate = useNavigate();
  const { state, getTotalPotentialSavings, getHighestRiskComponents } = useAIShared();
  const [insights, setInsights] = useState<QuickInsight[]>([]);
  const [loading] = useState(false);

  const generateQuickInsights = useCallback(() => {
    const quickInsights: QuickInsight[] = [];

    // Method optimization insights
    if (state.methodData.length > 0) {
      const highConfidenceMethod = state.methodData.find(m => m.confidence > 85);
      if (highConfidenceMethod) {
        quickInsights.push({
          id: 'method-1',
          engine: 'method',
          title: 'High-Confidence Optimization Available',
          description: `Method optimization with ${highConfidenceMethod.confidence}% confidence could improve efficiency`,
          impact: 'high',
          value: `$${highConfidenceMethod.estimatedSavings}/month`,
          action: 'Optimize Method',
          route: routes.aiMethodOptimization
        });
      }
    }

    // Maintenance insights
    const riskComponents = getHighestRiskComponents();
    if (riskComponents.length > 0) {
      const criticalComponent = riskComponents[0];
      quickInsights.push({
        id: 'maintenance-1',
        engine: 'maintenance',
        title: 'Critical Component Maintenance Required',
        description: `${criticalComponent.component} health at ${criticalComponent.healthScore}% - immediate attention needed`,
        impact: 'high',
        value: `${criticalComponent.downtimeHours}h downtime risk`,
        action: 'Schedule Maintenance',
        route: routes.predictiveMaintenance
      });
    }

    // Cost optimization insights
    if (state.costData.length > 0) {
      const highSavingsCost = state.costData.find(c => c.potentialSavings > 500);
      if (highSavingsCost) {
        quickInsights.push({
          id: 'cost-1',
          engine: 'cost',
          title: 'Significant Cost Reduction Opportunity',
          description: `${highSavingsCost.category} optimization could yield substantial monthly savings`,
          impact: 'high',
          value: `$${highSavingsCost.potentialSavings}/month`,
          action: 'Analyze Costs',
          route: routes.costOptimization
        });
      }
    }

    // Cross-feature correlations
    const highPriorityCorrelations = state.correlations.filter(c => c.priority === 'high');
    if (highPriorityCorrelations.length > 0) {
      const topCorrelation = highPriorityCorrelations[0];
      quickInsights.push({
        id: 'correlation-1',
        engine: 'correlation',
        title: 'Cross-System Optimization Detected',
        description: topCorrelation.description,
        impact: topCorrelation.priority,
        value: topCorrelation.combinedSavings ? `$${topCorrelation.combinedSavings}/month` : undefined,
        action: 'View Details',
        route: routes.aiDashboard
      });
    }

    // Add some sample insights if no real data
    if (quickInsights.length === 0) {
      quickInsights.push(
        {
          id: 'sample-1',
          engine: 'method',
          title: 'Temperature Optimization Available',
          description: 'Column temperature reduction could improve separation efficiency by 15%',
          impact: 'high',
          value: '$320/month',
          action: 'Optimize Method',
          route: routes.aiMethodOptimization
        },
        {
          id: 'sample-2',
          engine: 'maintenance',
          title: 'Injector Maintenance Due',
          description: 'Predictive analysis indicates injector service needed within 2 weeks',
          impact: 'medium',
          value: '12h downtime risk',
          action: 'Schedule Maintenance',
          route: routes.predictiveMaintenance
        },
        {
          id: 'sample-3',
          engine: 'cost',
          title: 'Carrier Gas Optimization',
          description: 'Flow rate optimization could reduce gas consumption by 22%',
          impact: 'high',
          value: '$450/month',
          action: 'Analyze Costs',
          route: routes.costOptimization
        }
      );
    }

    setInsights(quickInsights);
  }, [state, getHighestRiskComponents]);

  useEffect(() => {
    generateQuickInsights();
  }, [generateQuickInsights]);

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'method': return <Psychology />;
      case 'maintenance': return <Engineering />;
      case 'cost': return <TrendingDown />;
      case 'correlation': return <Timeline />;
      default: return <Analytics />;
    }
  };

  const getEngineColor = (engine: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    switch (engine) {
      case 'method': return 'primary';
      case 'maintenance': return 'warning';
      case 'cost': return 'success';
      case 'correlation': return 'info';
      default: return 'primary';
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

  const totalSavings = getTotalPotentialSavings();
  const totalCorrelations = state.correlations.length;
  const activeEngines = [
    state.methodData.length > 0,
    state.maintenanceData.length > 0,
    state.costData.length > 0
  ].filter(Boolean).length;

  return (
    <Card className={className} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Lightbulb sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" component="h2">
                AI Intelligence Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Key insights and recommendations from all AI engines
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={() => navigate(routes.aiDashboard)}
          >
            Full Dashboard
          </Button>
        </Box>

        {/* Summary Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
              <Typography variant="h5" fontWeight="bold">
                {activeEngines}/3
              </Typography>
              <Typography variant="body2">
                AI Engines Active
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
              <Typography variant="h5" fontWeight="bold">
                ${totalSavings.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Potential Savings
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'info.contrastText' }}>
              <Typography variant="h5" fontWeight="bold">
                {totalCorrelations}
              </Typography>
              <Typography variant="body2">
                Cross-Feature Insights
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.contrastText' }}>
              <Typography variant="h5" fontWeight="bold">
                {insights.filter(i => i.impact === 'high').length}
              </Typography>
              <Typography variant="body2">
                High Priority Items
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Key Insights */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          Priority Recommendations
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <List>
          {insights.slice(0, 6).map((insight) => (
            <ListItem
              key={insight.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                mb: 2,
                bgcolor: 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => insight.route && navigate(insight.route)}
            >
              <ListItemIcon>
                <Avatar sx={{ bgcolor: `${getEngineColor(insight.engine)}.light` }}>
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
                    {insight.value && (
                      <Chip
                        label={insight.value}
                        color={getEngineColor(insight.engine)}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                    {insight.action && (
                      <Button
                        size="small"
                        variant="text"
                        sx={{ mt: 1, p: 0, minWidth: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          insight.route && navigate(insight.route);
                        }}
                      >
                        {insight.action}
                      </Button>
                    )}
                  </Box>
                }
              />

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  insight.route && navigate(insight.route);
                }}
              >
                <Launch />
              </IconButton>
            </ListItem>
          ))}
        </List>

        {insights.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              No active AI insights available. Run analyses in the AI engines to generate intelligent recommendations.
            </Typography>
          </Alert>
        )}

        {/* Quick Actions */}
        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" gutterBottom>
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Psychology />}
              onClick={() => navigate(routes.aiMethodOptimization)}
              sx={{ justifyContent: 'flex-start' }}
            >
              Optimize Methods
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Engineering />}
              onClick={() => navigate(routes.predictiveMaintenance)}
              sx={{ justifyContent: 'flex-start' }}
            >
              Check Maintenance
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingDown />}
              onClick={() => navigate(routes.costOptimization)}
              sx={{ justifyContent: 'flex-start' }}
            >
              Analyze Costs
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AIInsightsOverview;