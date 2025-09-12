import React from 'react';
import { Box, Typography, Button, Chip, Alert } from '@mui/material';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';

interface DemoModeProps {
  children: React.ReactNode;
}

export const LinkedInDemo: React.FC = () => {
  return (
    <Box textAlign="center" py={4}>
      <IntelliLabLogo size="large" />
      
      <Typography variant="h3" gutterBottom sx={{ mt: 2 }}>
        🧪 GC Analysis Sandbox
      </Typography>
      
      <Typography variant="h6" color="text.secondary" mb={4}>
        Professional Gas Chromatography Calculation Platform
      </Typography>

      {/* Feature Status */}
      <Box mb={4}>
        <Chip label="✅ Detection Limit Calculator" color="success" sx={{ m: 0.5 }} />
        <Chip label="✅ Oven Ramp Visualizer" color="success" sx={{ m: 0.5 }} />
        <Chip label="✅ Inlet Simulator" color="success" sx={{ m: 0.5 }} />
        <Chip label="🔒 Advanced Workflows" color="default" sx={{ m: 0.5 }} />
      </Box>

      <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <strong>LinkedIn Special:</strong> Full access to core GC calculation tools! 
        Try them out with your own method parameters.
      </Alert>

      <Box>
        <Button 
          variant="contained" 
          size="large" 
          sx={{ mr: 2, mb: 1 }}
        >
          Start Calculating
        </Button>
        
        <Button 
          variant="outlined" 
          size="large"
          sx={{ mb: 1 }}
        >
          Contact for Full Platform
        </Button>
      </Box>
    </Box>
  );
};

export const DemoMode: React.FC<DemoModeProps> = ({ children }) => {
  return (
    <Box>
      <Alert 
        severity="info" 
        sx={{ mb: 3, borderRadius: 2 }}
        icon={<IntelliLabLogo size="small" variant="icon-only" />}
        action={
          <Button color="inherit" size="small">
            Contact for Full Access
          </Button>
        }
      >
        <strong>🧪 GC Sandbox Demo</strong> - Core calculation tools fully functional! 
        Advanced workflow features available in full version.
      </Alert>
      {children}
    </Box>
  );
};

export default DemoMode;
