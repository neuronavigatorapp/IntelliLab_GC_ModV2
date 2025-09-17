import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  TrendingUp,
  Speed,
} from '@mui/icons-material';

// Enterprise-grade status card matching Agilent/Thermo instrument panels
const StatusCard = styled(Card)(() => ({
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    borderColor: '#d1d5db',
  },
}));

const StatusHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #f3f4f6',
}));

const MetricValue = styled(Typography)(() => ({
  fontSize: '2rem',
  fontWeight: 600,
  fontFamily: 'Monaco, "Lucida Console", monospace',
  lineHeight: 1,
  marginBottom: '4px',
}));

const MetricLabel = styled(Typography)(() => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
}));

interface StatusMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  trend?: 'up' | 'down' | 'stable';
  progress?: number;
  subtitle?: string;
}

interface EnterpriseStatusPanelProps {
  title: string;
  metrics: StatusMetric[];
  systemStatus: 'online' | 'offline' | 'maintenance';
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle sx={{ color: '#10b981' }} />;
    case 'good': return <CheckCircle sx={{ color: '#3b82f6' }} />;
    case 'warning': return <Warning sx={{ color: '#f59e0b' }} />;
    case 'critical': return <Error sx={{ color: '#ef4444' }} />;
    case 'offline': return <Info sx={{ color: '#6b7280' }} />;
    default: return <Info sx={{ color: '#6b7280' }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return '#10b981';
    case 'good': return '#3b82f6';
    case 'warning': return '#f59e0b';
    case 'critical': return '#ef4444';
    case 'offline': return '#6b7280';
    default: return '#6b7280';
  }
};

const getTrendIcon = (trend?: string) => {
  switch (trend) {
    case 'up': return <TrendingUp sx={{ fontSize: '1rem', color: '#10b981' }} />;
    case 'down': return <TrendingUp sx={{ fontSize: '1rem', color: '#ef4444', transform: 'rotate(180deg)' }} />;
    case 'stable': return <Speed sx={{ fontSize: '1rem', color: '#64748b' }} />;
    default: return null;
  }
};

const getSystemStatusChip = (status: string) => {
  const configs = {
    online: { label: 'SYSTEM ONLINE', color: '#10b981' },
    offline: { label: 'SYSTEM OFFLINE', color: '#ef4444' },
    maintenance: { label: 'MAINTENANCE', color: '#f59e0b' },
  };
  
  const config = configs[status as keyof typeof configs] || configs.offline;
  
  return (
    <Chip
      label={config.label}
      sx={{
        backgroundColor: config.color,
        color: 'white',
        fontWeight: 600,
        fontSize: '0.6875rem',
        letterSpacing: '0.05em',
        height: '28px',
      }}
    />
  );
};

export const EnterpriseStatusPanel: React.FC<EnterpriseStatusPanelProps> = ({
  title,
  metrics,
  systemStatus,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* System Status Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#1a365d',
            fontWeight: 600,
            fontSize: '1.25rem',
          }}
        >
          {title}
        </Typography>
        {getSystemStatusChip(systemStatus)}
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.id}>
            <StatusCard>
              <CardContent sx={{ p: 3 }}>
                <StatusHeader>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(metric.status)}
                    <MetricLabel>{metric.label}</MetricLabel>
                  </Box>
                  {getTrendIcon(metric.trend)}
                </StatusHeader>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <MetricValue sx={{ color: getStatusColor(metric.status) }}>
                    {typeof metric.value === 'number' 
                      ? metric.value.toLocaleString() 
                      : metric.value
                    }
                  </MetricValue>
                  {metric.unit && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {metric.unit}
                    </Typography>
                  )}
                </Box>

                {metric.subtitle && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#64748b',
                      fontSize: '0.75rem',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    {metric.subtitle}
                  </Typography>
                )}

                {metric.progress !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={metric.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getStatusColor(metric.status),
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#64748b',
                        fontSize: '0.6875rem',
                        mt: 0.5,
                        display: 'block',
                        textAlign: 'right',
                      }}
                    >
                      {metric.progress.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </StatusCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EnterpriseStatusPanel;




