import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Badge,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useGlobalData } from '../../store/globalDataStore';
import { ConnectivityBadge } from '../Offline/ConnectivityBadge';
import { SyncStatus } from '../Offline/SyncStatus';

interface SystemStatus {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export const StatusBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { kpis, lastSyncTime, isLoading, refreshData } = useGlobalData();
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    {
      type: 'success',
      message: 'All systems operational',
      timestamp: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    // Update system status based on KPIs
    const newStatus: SystemStatus[] = [];
    
    if (kpis?.openAlerts && kpis.openAlerts > 0) {
      newStatus.push({
        type: 'warning',
        message: `${kpis.openAlerts} open alerts require attention`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (kpis?.lowStockCount && kpis.lowStockCount > 0) {
      newStatus.push({
        type: 'warning',
        message: `${kpis.lowStockCount} items are low on stock`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (newStatus.length === 0) {
      newStatus.push({
        type: 'success',
        message: 'All systems operational',
        timestamp: new Date().toISOString()
      });
    }
    
    setSystemStatus(newStatus);
  }, [kpis]);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const formatLastSync = (timestamp: string) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleAlertClick = (alert: SystemStatus) => {
    setCurrentAlert(alert);
    setShowAlert(true);
  };

  const handleAlertClose = () => {
    setShowAlert(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getOverallStatus = () => {
    const hasWarnings = systemStatus.some(status => status.type === 'warning');
    const hasErrors = systemStatus.some(status => status.type === 'error');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
        px: 2,
        py: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Left side - System status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={getStatusIcon(getOverallStatus())}
            label={systemStatus[0]?.message || 'System Status'}
            color={getStatusColor(getOverallStatus())}
            size="small"
            onClick={() => systemStatus[0] && handleAlertClick(systemStatus[0])}
            sx={{ cursor: 'pointer' }}
          />
          
          {/* Connectivity Status */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <ConnectivityBadge />
          </Box>
          
          {/* Sync Status */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <SyncStatus showDetails={false} />
          </Box>
        </Box>

        {/* Center - Last sync time */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Last sync: {formatLastSync(lastSyncTime || '')}
            </Typography>
          </Box>
        )}

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              <RefreshIcon sx={{ 
                fontSize: 16,
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton size="small">
              <Badge badgeContent={kpis?.openAlerts || 0} color="warning">
                <NotificationsIcon sx={{ fontSize: 16 }} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alert Snackbar */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={currentAlert?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {currentAlert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatusBar;
