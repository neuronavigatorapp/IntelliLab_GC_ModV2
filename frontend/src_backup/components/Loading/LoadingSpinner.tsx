import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoadingSpinnerProps {
  variant?: 'spinner' | 'skeleton' | 'card';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'spinner',
  message = 'Loading...',
  size = 'medium',
  fullHeight = false
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 32;
    }
  };

  const getSkeletonHeight = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 32;
    }
  };

  if (variant === 'skeleton') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullHeight ? '100vh' : 'auto',
        p: 2
      }}>
        <Skeleton 
          variant="circular" 
          width={getSize()} 
          height={getSize()} 
          sx={{ mb: 1 }}
        />
        <Skeleton 
          variant="text" 
          width={120} 
          height={getSkeletonHeight()}
        />
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Card sx={{ 
        minHeight: fullHeight ? '100vh' : 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={getSize()} 
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: fullHeight ? '100vh' : 'auto',
      p: 2
    }}>
      <CircularProgress 
        size={getSize()} 
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
