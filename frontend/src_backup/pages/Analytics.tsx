import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Science as ScienceIcon,
  Tune as TuneIcon,
  Build as BuildIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import DiagnosticsPanel from '../components/Analytics/DiagnosticsPanel';
import MethodOptimizer from '../components/Analytics/MethodOptimizer';
import MaintenancePredictor from '../components/Analytics/MaintenancePredictor';
import CostOptimizer from '../components/Analytics/CostOptimizer';
import { useGlobalData } from '../store/globalDataStore';
import { hasAnalyticsFeatures, isAnalyticsEnabled } from '../config/featureFlags';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

export const Analytics: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { analyticsSummary } = useGlobalData();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!isAnalyticsEnabled()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Analytics features are currently disabled. Please contact your administrator to enable analytics functionality.
        </Alert>
      </Box>
    );
  }

  if (!hasAnalyticsFeatures()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No analytics features are currently available. Check back later for updates.
        </Alert>
      </Box>
    );
  }

  const handleRecommendationClick = (recommendation: any) => {
    console.log('Recommendation clicked:', recommendation);
    // TODO: Implement recommendation application logic
  };

  const handleOptimizationApply = (optimization: any) => {
    console.log('Optimization applied:', optimization);
    // TODO: Implement optimization application logic
  };

  const handleAlertCreate = (prediction: any) => {
    console.log('Alert created:', prediction);
    // TODO: Implement alert creation logic
  };

  const handleCostOptimizationApply = (optimization: any) => {
    console.log('Cost optimization applied:', optimization);
    // TODO: Implement cost optimization application logic
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AnalyticsIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
                Analytics & AI Tools
              </Typography>
              <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ opacity: 0.9 }}>
                Advanced diagnostics, optimization, and predictive maintenance
              </Typography>
            </Box>
          </Box>
          
          {analyticsSummary && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <strong>{analyticsSummary.total_runs_analyzed}</strong> runs analyzed
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <strong>{analyticsSummary.total_recommendations}</strong> recommendations
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <strong>{analyticsSummary.critical_alerts}</strong> critical alerts
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                <strong>${analyticsSummary.cost_savings_potential.toFixed(2)}</strong> potential savings
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Analytics tabs"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          <Tab
            icon={<ScienceIcon />}
            label={isMobile ? "Diagnostics" : "Run Diagnostics"}
            {...a11yProps(0)}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<TuneIcon />}
            label={isMobile ? "Optimizer" : "Method Optimizer"}
            {...a11yProps(1)}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<BuildIcon />}
            label={isMobile ? "Maintenance" : "Predictive Maintenance"}
            {...a11yProps(2)}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<TrendingDownIcon />}
            label={isMobile ? "Cost" : "Cost Optimizer"}
            {...a11yProps(3)}
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <DiagnosticsPanel onRecommendationClick={handleRecommendationClick} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MethodOptimizer onOptimizationApply={handleOptimizationApply} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <MaintenancePredictor onAlertCreate={handleAlertCreate} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <CostOptimizer onOptimizationApply={handleCostOptimizationApply} />
      </TabPanel>

      {/* Quick Actions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Common analytics tasks and shortcuts
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => setTabValue(0)}
            >
              • Run comprehensive diagnostics
            </Typography>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => setTabValue(1)}
            >
              • Optimize method parameters
            </Typography>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => setTabValue(2)}
            >
              • Check maintenance predictions
            </Typography>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => setTabValue(3)}
            >
              • Analyze cost optimization
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
