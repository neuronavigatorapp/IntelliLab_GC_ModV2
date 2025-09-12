import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';

export const LogoLoader: React.FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
      }}
    >
      <Box mb={3}>
        <IntelliLabLogo size="large" />
      </Box>
      
      <CircularProgress 
        sx={{ 
          color: '#f39c12',
          mb: 2
        }} 
      />
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'white',
          opacity: 0.8
        }}
      >
        Loading your GC workspace...
      </Typography>
    </Box>
  );
};

export default LogoLoader;
