import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  WifiOff as OfflineIcon,
  FlashOn as SpeedIcon,
  Shield as SecurityIcon
} from '@mui/icons-material';

interface PWAInstallPromptProps {
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  open,
  onClose,
  onInstall
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        onInstall();
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    }
    onClose();
  };

  const features = [
    {
      icon: <OfflineIcon color="primary" />,
      title: 'Offline Access',
      description: 'Use key features even without internet connection'
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Fast Performance',
      description: 'App-like speed with instant loading'
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Secure & Private',
      description: 'Your data stays on your device'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Install IntelliLab GC
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
          Get the full app experience with offline capabilities
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Why install?
          </Typography>
          <List dense>
            {features.map((feature, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={feature.title}
                  secondary={feature.description}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                  secondaryTypographyProps={{ sx: { opacity: 0.8 } }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Box sx={{ textAlign: 'center' }}>
          <Chip
            icon={<CheckIcon />}
            label="Professional GC Toolkit"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              mb: 2
            }}
          />
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Access detection limit calculations, oven ramp visualizer, and AI troubleshooting
            with full offline capabilities.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          startIcon={<InstallIcon />}
          sx={{
            backgroundColor: 'white',
            color: '#1976d2',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          Install App
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt; 