import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Science,
  Analytics,
  Speed,
  Security,
  TrendingUp,
  Assessment,
  Biotech,
  Engineering,
  PlayArrow,
  Settings,
  Refresh,
  Launch,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Premium animations
const dataFlow = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const metricPulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Styled components
const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: '2rem',
  minHeight: 'calc(100vh - 90px)',
  background: 'transparent',
  position: 'relative',
  overflow: 'auto',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  cursor: 'pointer',
  '&:hover': {
    '& .metric-icon': {
      animation: `${metricPulse} 1s ease-in-out`,
    },
    '& .data-flow': {
      opacity: 1,
    },
  },
  '& .data-flow': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, #4A90E2 50%, transparent 100%)',
    opacity: 0,
    animation: `${dataFlow} 2s ease-in-out infinite`,
  },
}));

const MetricIcon = styled(Avatar)(({ theme }) => ({
  width: '60px',
  height: '60px',
  background: 'linear-gradient(135deg, #4A90E2 0%, #63B3ED 100%)',
  boxShadow: '0 4px 20px rgba(74, 144, 226, 0.4)',
  marginBottom: '1rem',
  '& .MuiSvgIcon-root': {
    fontSize: '1.8rem',
  },
}));

const QuickActionButton = styled(Button)(({ theme }) => ({
  height: '120px',
  flexDirection: 'column',
  gap: '0.75rem',
  background: `
    linear-gradient(135deg, 
      rgba(26, 32, 44, 0.8) 0%, 
      rgba(45, 55, 72, 0.9) 100%
    )
  `,
  border: '1px solid rgba(74, 144, 226, 0.3)',
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    background: `
      linear-gradient(135deg, 
        rgba(74, 144, 226, 0.2) 0%, 
        rgba(45, 55, 72, 0.9) 100%
      )
    `,
    borderColor: '#4A90E2',
    boxShadow: '0 8px 32px rgba(74, 144, 226, 0.3)',
  },
}));

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ElementType;
  description: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

const dashboardMetrics: DashboardMetric[] = [
  {
    id: 'system-health',
    title: 'System Health',
    value: 98.7,
    unit: '%',
    change: +2.3,
    status: 'excellent',
    icon: Security,
    description: 'All systems operational',
  },
  {
    id: 'active-instruments',
    title: 'Active Instruments',
    value: 12,
    unit: 'units',
    change: +1,
    status: 'good',
    icon: Science,
    description: 'Currently online',
  },
  {
    id: 'detection-accuracy',
    title: 'Detection Accuracy',
    value: 99.94,
    unit: '%',
    change: +0.12,
    status: 'excellent',
    icon: Engineering,
    description: 'Average across all methods',
  },
  {
    id: 'throughput',
    title: 'Analysis Throughput',
    value: 847,
    unit: '/hour',
    change: +15.7,
    status: 'good',
    icon: Speed,
    description: 'Samples processed',
  },
];

const quickActions: QuickAction[] = [
  {
    id: 'detection-limit',
    title: 'Detection Limit Calculator',
    description: 'ASTM-compliant sensitivity analysis',
    icon: Analytics,
    color: '#4A90E2',
    onClick: () => console.log('Detection Limit'),
  },
  {
    id: 'method-optimizer',
    title: 'Method Optimizer',
    description: 'AI-powered parameter optimization',
    icon: TrendingUp,
    color: '#48BB78',
    onClick: () => console.log('Method Optimizer'),
  },
  {
    id: 'fleet-manager',
    title: 'Fleet Manager',
    description: 'Instrument monitoring & control',
    icon: Assessment,
    color: '#FF8C42',
    onClick: () => console.log('Fleet Manager'),
  },
  {
    id: 'troubleshooting',
    title: 'AI Troubleshooting',
    description: 'Intelligent problem diagnosis',
    icon: Biotech,
    color: '#ED8936',
    onClick: () => console.log('Troubleshooting'),
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#48BB78';
    case 'good': return '#4A90E2';
    case 'warning': return '#ED8936';
    case 'critical': return '#F56565';
    default: return '#A0AEC0';
  }
};

interface PremiumDashboardProps {
  onActionClick?: (actionId: string) => void;
}

export const PremiumDashboard: React.FC<PremiumDashboardProps> = ({
  onActionClick
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleActionClick = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    }
  };

  return (
    <DashboardContainer>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Mission Control
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            Real-time analytics and instrument management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ 
                background: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.2)',
              }}
            >
              <Refresh sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="System Settings">
            <IconButton sx={{ 
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
            }}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardMetrics.map((metric) => (
          <Grid item xs={12} sm={6} lg={3} key={metric.id}>
            <MetricCard>
              <div className="data-flow" />
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <MetricIcon className="metric-icon" sx={{ 
                  background: `linear-gradient(135deg, ${getStatusColor(metric.status)} 0%, ${getStatusColor(metric.status)}80 100%)`,
                }}>
                  <metric.icon />
                </MetricIcon>
                
                <Typography variant="h6" sx={{ mb: 1, color: 'white' }}>
                  {metric.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 1 }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: getStatusColor(metric.status),
                      lineHeight: 1,
                    }}
                  >
                    {metric.value}
                  </Typography>
                  {metric.unit && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5, 
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500,
                      }}
                    >
                      {metric.unit}
                    </Typography>
                  )}
                </Box>

                {metric.change && (
                  <Chip
                    label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                    size="small"
                    sx={{
                      background: metric.change > 0 
                        ? 'rgba(72, 187, 120, 0.2)' 
                        : 'rgba(245, 101, 101, 0.2)',
                      color: metric.change > 0 ? '#48BB78' : '#F56565',
                      border: `1px solid ${metric.change > 0 ? 'rgba(72, 187, 120, 0.3)' : 'rgba(245, 101, 101, 0.3)'}`,
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                )}

                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {metric.description}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4, background: 'rgba(74, 144, 226, 0.2)' }} />

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 3 }}>
          Launch professional analysis tools with one click
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <QuickActionButton
              fullWidth
              onClick={() => handleActionClick(action.id)}
            >
              <Avatar sx={{ 
                background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}CC 100%)`,
                width: 48,
                height: 48,
                boxShadow: `0 4px 20px ${action.color}40`,
              }}>
                <action.icon />
              </Avatar>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {action.title}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {action.description}
              </Typography>
              <IconButton 
                size="small" 
                sx={{ 
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    color: action.color,
                  },
                }}
              >
                <Launch fontSize="small" />
              </IconButton>
            </QuickActionButton>
          </Grid>
        ))}
      </Grid>

      {/* System Status Bar */}
      <Card sx={{ mt: 4, background: 'rgba(26, 32, 44, 0.6)', backdropFilter: 'blur(10px)' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              System Status: All instruments online • Last updated: {new Date().toLocaleTimeString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={98.7} 
                sx={{ 
                  width: 100,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #4A90E2 0%, #48BB78 100%)',
                    borderRadius: 3,
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: '#48BB78', fontWeight: 600 }}>
                98.7%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </DashboardContainer>
  );
};

export default PremiumDashboard;
