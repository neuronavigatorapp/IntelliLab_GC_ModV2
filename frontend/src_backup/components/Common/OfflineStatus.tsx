import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon
} from '@mui/icons-material';

interface OfflineStatusProps {
  isOnline: boolean;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ isOnline }) => {
  const [expanded, setExpanded] = useState(false);

  const availableFeatures = [
    'View saved calculations',
    'Access cached data',
    'Review method configurations',
    'Browse calculation history'
  ];

  const unavailableFeatures = [
    'New calculations (Detection Limits, Oven Ramps)',
    'AI troubleshooting assistance',
    'Real-time data updates',
    'Method optimization'
  ];

  if (isOnline) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      icon={<OfflineIcon />}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <AlertTitle>You're offline</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Some features require an internet connection. Here's what you can still do:
      </Typography>

      <Box sx={{ mb: 1 }}>
        <Chip
          icon={<AvailableIcon />}
          label="Available Features"
          color="success"
          size="small"
          sx={{ mr: 1 }}
        />
        <Chip
          icon={<UnavailableIcon />}
          label="Unavailable Features"
          color="error"
          size="small"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          <strong>Available:</strong> {availableFeatures.length} features
        </Typography>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ ml: 1 }}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Features:
          </Typography>
          <List dense sx={{ py: 0 }}>
            {availableFeatures.map((feature, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <AvailableIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Unavailable Features:
          </Typography>
          <List dense sx={{ py: 0 }}>
            {unavailableFeatures.map((feature, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <UnavailableIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>

      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
        Your data is safe and will sync when you're back online.
      </Typography>
    </Alert>
  );
};

export default OfflineStatus; 