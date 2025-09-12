import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  GetApp as InstallIcon,
  CheckCircle as InstalledIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Storage as StorageIcon,
  FlashOn as SpeedIcon,
  Shield as SecurityIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { usePWA } from '../../hooks/usePWA';

const PWAStatusCard: React.FC = () => {
  const {
    isOnline,
    isInstalled,
    canInstall,
    isUpdateAvailable,
    installApp,
    checkForUpdates
  } = usePWA();

  const getStorageUsage = () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => ({
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      }));
    }
    return Promise.resolve({ used: 0, quota: 0 });
  };

  const [storageInfo, setStorageInfo] = React.useState({ used: 0, quota: 0 });

  React.useEffect(() => {
    getStorageUsage().then(setStorageInfo);
  }, []);

  const storagePercentage = storageInfo.quota > 0 
    ? (storageInfo.used / storageInfo.quota) * 100 
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const features = [
    {
      icon: <OfflineIcon color="primary" />,
      title: 'Offline Access',
      available: true,
      description: 'Core features work without internet'
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Fast Loading',
      available: true,
      description: 'Cached resources for instant access'
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Secure',
      available: true,
      description: 'HTTPS and local data storage'
    },
    {
      icon: <StorageIcon color="primary" />,
      title: 'Local Storage',
      available: true,
      description: `${formatBytes(storageInfo.used)} used`
    }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="App Status"
        subheader="Progressive Web App Information"
        action={
          <Box display="flex" gap={1}>
            <Chip
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'warning'}
              size="small"
            />
            {isInstalled && (
              <Chip
                icon={<InstalledIcon />}
                label="Installed"
                color="success"
                size="small"
              />
            )}
          </Box>
        }
      />
      
      <CardContent>
        {/* Installation Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Installation Status
          </Typography>
          {isInstalled ? (
            <Box display="flex" alignItems="center" gap={1}>
              <InstalledIcon color="success" />
              <Typography variant="body2" color="success.main">
                App is installed and ready to use
              </Typography>
            </Box>
          ) : canInstall ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Install the app for better experience
              </Typography>
              <Button
                variant="contained"
                startIcon={<InstallIcon />}
                onClick={installApp}
                size="small"
                sx={{ mt: 1 }}
              >
                Install App
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              App installation not available
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Features List */}
        <Typography variant="h6" gutterBottom>
          Available Features
        </Typography>
        <List dense>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {feature.icon}
              </ListItemIcon>
              <ListItemText
                primary={feature.title}
                secondary={feature.description}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Storage Usage */}
        <Typography variant="h6" gutterBottom>
          Storage Usage
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Used: {formatBytes(storageInfo.used)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storagePercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(storagePercentage, 100)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Update Status */}
        {isUpdateAvailable && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="warning.main" gutterBottom>
              <UpdateIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Update available
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={checkForUpdates}
              startIcon={<UpdateIcon />}
            >
              Check for Updates
            </Button>
          </Box>
        )}

        {/* App Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Version: 1.0.0 • Platform: Web App
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PWAStatusCard; 