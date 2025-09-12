import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';

interface SystemStatus {
  instruments: 'online' | 'offline' | 'maintenance';
  methods: 'ready' | 'optimizing' | 'error';
  analytics: 'active' | 'processing' | 'idle';
  reports: 'available' | 'generating' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'method_created' | 'analysis_completed' | 'instrument_connected' | 'report_generated';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export const MainDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    instruments: 'online',
    methods: 'ready',
    analytics: 'active',
    reports: 'available'
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'analysis_completed',
      title: 'BTEX Analysis Completed',
      description: 'Method BTEX-2024-01 completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'success'
    },
    {
      id: '2',
      type: 'method_created',
      title: 'New Method Created',
      description: 'Light Hydrocarbons method optimized',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'success'
    },
    {
      id: '3',
      type: 'instrument_connected',
      title: 'GC-2030 Connected',
      description: 'Instrument GC-2030-001 online',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'success'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Simulate system status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        analytics: prev.analytics === 'active' ? 'processing' : 'active'
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'ready':
      case 'active':
      case 'available':
      case 'success':
        return 'success';
      case 'maintenance':
      case 'optimizing':
      case 'processing':
      case 'generating':
      case 'warning':
        return 'warning';
      case 'offline':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'ready':
      case 'active':
      case 'available':
      case 'success':
        return <CheckIcon />;
      case 'maintenance':
      case 'optimizing':
      case 'processing':
      case 'generating':
      case 'warning':
        return <WarningIcon />;
      case 'offline':
      case 'error':
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const quickAccessCards = [
    {
      title: 'GC Simulation Suite',
      description: 'Real-time chromatogram simulation with scientific accuracy',
      icon: <PlayIcon sx={{ fontSize: 40 }} />,
      color: '#14b8a6',
      path: '/demo/chromatogram',
      status: 'active'
    },
    {
      title: 'Fleet Management',
      description: 'Monitor and manage your GC instrument fleet',
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      path: '/instruments',
      status: 'online'
    },
    {
      title: 'Method Library',
      description: 'Optimize and store analytical methods',
      icon: <ScienceIcon sx={{ fontSize: 40 }} />,
      color: '#8b5cf6',
      path: '/methods',
      status: 'ready'
    },
    {
      title: 'Performance Analytics',
      description: 'Advanced analytics and trend analysis',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      color: '#3b82f6',
      path: '/analytics',
      status: 'active'
    }
  ];

  const handleQuickAccess = (path: string) => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 300);
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Card sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: isMobile ? 3 : 4, position: 'relative', zIndex: 2 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <IntelliLabLogo size={isMobile ? "medium" : "large"} variant="full" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant={isMobile ? "h4" : "h3"} fontWeight={600} gutterBottom>
                IntelliLab GC Platform
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ opacity: 0.9 }}>
                Professional Gas Chromatography Instrumentation Toolkit
              </Typography>
            </Box>
          </Box>
          
          {/* System Status Bar */}
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Chip 
              label="System Online" 
              color="success" 
              size={isMobile ? "small" : "medium"}
              icon={<CheckIcon />}
            />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </CardContent>
        
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          zIndex: 1
        }} />
      </Card>

      {/* Quick Access Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        {quickAccessCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  border: `2px solid ${card.color}`
                },
                border: `2px solid transparent`
              }}
              onClick={() => handleQuickAccess(card.path)}
            >
              <CardContent sx={{ 
                p: isMobile ? 2 : 3, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Box sx={{ 
                    color: card.color, 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {card.description}
                  </Typography>
                </Box>
                
                <Box>
                  <Chip 
                    label={card.status === 'active' ? 'Ready' : 
                           card.status === 'online' ? 'Online' : 
                           card.status === 'ready' ? 'Available' : 'Active'}
                    color={getStatusColor(card.status) as any}
                    size="small"
                    icon={getStatusIcon(card.status) as React.ReactElement}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Status & Recent Activity */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                {Object.entries(systemStatus).map(([key, status]) => (
                  <Box key={key} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={key.charAt(0).toUpperCase() + key.slice(1)} 
                      color={getStatusColor(status) as any}
                      size="small"
                      icon={getStatusIcon(status) as React.ReactElement}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {status === 'online' ? 'All instruments connected' :
                       status === 'ready' ? 'Methods optimized' :
                       status === 'active' ? 'Analytics running' :
                       status === 'available' ? 'Reports ready' : status}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>System Health:</strong> All systems operating normally
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                fullWidth={isMobile}
              >
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {recentActivity.map((activity) => (
                  <Box key={activity.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Avatar sx={{ 
                        bgcolor: getStatusColor(activity.status) === 'success' ? 'success.main' :
                                 getStatusColor(activity.status) === 'warning' ? 'warning.main' : 'error.main',
                        width: 32,
                        height: 32
                      }}>
                        {getStatusIcon(activity.status)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {activity.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Button
                variant="text"
                onClick={() => navigate('/analytics')}
                fullWidth={isMobile}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Overlay */}
      {isLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Loading...
            </Typography>
            <LinearProgress />
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default MainDashboard;
