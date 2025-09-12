import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Science as ScienceIcon,
  Storage as StorageIcon,
  Tune as TuneIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  PhoneAndroid as MobileIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Calculate as CalculateIcon,
  PlaylistAdd as PlaylistAddIcon,
  PlaylistPlay as PlaylistPlayIcon
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isTrainingEnabled } from '../../config/featureFlags';
import { useBranding } from './BrandingProvider';
import { useImageWithFallbackHandler } from '../../utils/useImageWithFallback';

interface KPICard {
  id: string;
  title: string;
  icon: React.ReactNode;
  value: string | number;
  subtitle: string;
  status: 'success' | 'warning' | 'error' | 'info';
  path: string;
  color: string;
  loading?: boolean;
}

interface RecentRun {
  id: number;
  method_name: string;
  timestamp: string;
  status: string;
}

export const MasterLauncher: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { logoPathPng, logoPathJpg } = useBranding();
  const { src: logoSrc, onError: logoErrorHandler } = useImageWithFallbackHandler(logoPathPng, logoPathJpg);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockKPIs = {
    instrumentsCount: 12,
    openAlerts: 3,
    lowStockCount: 5,
    recentRunsCount: 24,
    recentMethodsCount: 8
  };

  const mockRecents = {
    runs: [
      { id: 1001, method_name: 'EPA 8260B', timestamp: '2024-01-15T10:30:00Z', status: 'completed' },
      { id: 1002, method_name: 'ASTM D1946', timestamp: '2024-01-15T09:15:00Z', status: 'completed' },
      { id: 1003, method_name: 'Custom Method', timestamp: '2024-01-15T08:45:00Z', status: 'processing' }
    ],
    methods: [],
    alerts: []
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const kpiCards: KPICard[] = [
    {
      id: 'sandbox',
      title: 'GC Sandbox',
      icon: <ScienceIcon />,
      value: 'Virtual Runs',
      subtitle: 'Simulate chromatograms & faults',
      status: 'success',
      path: '/sandbox',
      color: '#0ea5e9'
    },
    {
      id: 'chromatography',
      title: 'Chromatography',
      icon: <TimelineIcon />,
      value: 'Method Runner',
      subtitle: 'Peak Detection & Analysis',
      status: 'success',
      path: '/chromatography/runner',
      color: '#059669'
    },
    {
      id: 'calibration',
      title: 'Calibration',
      icon: <ShowChartIcon />,
      value: 'Curve Fitting',
      subtitle: 'Standards & Calibration',
      status: 'success',
      path: '/chromatography/calibration',
      color: '#7c3aed'
    },
    {
      id: 'quantitation',
      title: 'Quantitation',
      icon: <CalculateIcon />,
      value: 'Concentration',
      subtitle: 'Peak Area to Concentration',
      status: 'success',
      path: '/chromatography/quantify',
      color: '#0891b2'
    },
    {
      id: 'sequence-builder',
      title: 'Sequence Builder',
      icon: <PlaylistAddIcon />,
      value: 'Template Design',
      subtitle: 'Build Run Sequences',
      status: 'success',
      path: '/chromatography/sequence/builder',
      color: '#d97706'
    },
    {
      id: 'sequence-runner',
      title: 'Sequence Runner',
      icon: <PlaylistPlayIcon />,
      value: 'Batch Processing',
      subtitle: 'Execute Sequences',
      status: 'success',
      path: '/chromatography/sequence/runner',
      color: '#dc2626'
    },
    {
      id: 'simulation',
      title: 'Simulation Suite',
      icon: <ScienceIcon />,
      value: mockKPIs.instrumentsCount,
      subtitle: 'Active Instruments',
      status: 'success',
      path: '/tools/detection-limit',
      color: '#1d4ed8'
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      icon: <StorageIcon />,
      value: mockKPIs.openAlerts,
      subtitle: 'Open Alerts',
      status: 'warning',
      path: '/instruments',
      color: '#dc2626'
    },
    {
      id: 'methods',
      title: 'Method Development',
      icon: <TuneIcon />,
      value: mockKPIs.recentMethodsCount,
      subtitle: 'Recent Methods',
      status: 'info',
      path: '/methods',
      color: '#059669'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: <InventoryIcon />,
      value: mockKPIs.lowStockCount,
      subtitle: 'Low Stock Items',
      status: 'warning',
      path: '/inventory',
      color: '#d97706'
    },
    {
      id: 'analytics',
      title: 'Analytics & AI',
      icon: <AnalyticsIcon />,
      value: mockKPIs.recentRunsCount,
      subtitle: 'Recent Runs',
      status: 'success',
      path: '/analytics',
      color: '#7c3aed'
    },
    {
      id: 'training',
      title: 'Training Center',
      icon: <SchoolIcon />,
      value: '75%', // This would come from training stats
      subtitle: 'Course Completion',
      status: 'success',
      path: '/training',
      color: '#0891b2',
      loading: false
    }
  ];

  // Filter cards based on feature flags
  const filteredCards = kpiCards.filter(card => {
    if (card.id === 'training' && !isTrainingEnabled()) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <TrendingIcon />;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header with Logo */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <img 
            src={logoSrc} 
            alt="IntelliLab GC Logo" 
            className="brand-logo launcher-size"
            style={{
              maxHeight: 80,
              width: 'auto',
              objectFit: 'contain',
              height: 'auto'
            }}
            onError={logoErrorHandler}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              IntelliLab GC Platform
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Unified GC instrumentation toolkit for field and laboratory use
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
            <Tooltip 
              title={`Click to open ${card.title}`}
              placement="top"
              arrow
            >
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: theme.shadows[12],
                    borderLeft: `4px solid ${card.color}`,
                    '& .MuiCardContent-root': {
                      backgroundColor: 'action.hover'
                    }
                  }
                }}
                onClick={() => handleCardClick(card.path)}
              >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                  <Chip
                    icon={getStatusIcon(card.status)}
                    label={card.status}
                    size="small"
                    color={card.status as any}
                    variant="outlined"
                  />
                </Box>
                
                {isLoading ? (
                  <Skeleton variant="text" width="60%" height={32} />
                ) : (
                  <Typography variant="h4" component="div" gutterBottom>
                    {card.value}
                  </Typography>
                )}
                
                <Typography variant="h6" component="div" gutterBottom>
                  {card.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      {mockRecents.runs.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          <Grid container spacing={2}>
            {mockRecents.runs.slice(0, 3).map((run: RecentRun, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlayIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2">
                        Run #{run.id}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {run.method_name || 'Unknown Method'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Quick Actions */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ScienceIcon />}
              onClick={() => navigate('/tools/detection-limit')}
              sx={{ py: 2 }}
            >
              Detection Limit Calculator
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<TuneIcon />}
              onClick={() => navigate('/tools/oven-ramp')}
              sx={{ py: 2 }}
            >
              Oven Ramp Visualizer
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SecurityIcon />}
              onClick={() => navigate('/chromatography/qc')}
              sx={{ py: 2 }}
            >
              QC Dashboard
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<TuneIcon />}
              onClick={() => navigate('/chromatography/qc/targets')}
              sx={{ py: 2 }}
            >
              QC Targets
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<StorageIcon />}
              onClick={() => navigate('/tools/inlet-simulator')}
              sx={{ py: 2 }}
            >
              Inlet Simulator
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/reports')}
              sx={{ py: 2 }}
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
        
        {/* Development Tools */}
        {process.env.NODE_ENV !== 'production' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Development Tools
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/brand-preview')}
                  sx={{ py: 2 }}
                >
                  Brand Preview
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MasterLauncher;
