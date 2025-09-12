import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceIcon from '@mui/icons-material/Science';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export const LinkedInLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box py={6}>
        {/* Hero Section */}
        <Box textAlign="center" mb={6}>
          <IntelliLabLogo size="large" />
          <Typography variant="h2" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            Professional GC Analysis Platform
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Advanced gas chromatography simulation, optimization, and troubleshooting toolkit for analytical professionals
          </Typography>
          
          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mb={4}>
            <Chip label="✅ Method Development" color="success" />
            <Chip label="✅ Virtual Instruments" color="success" />
            <Chip label="✅ Real-time Simulation" color="success" />
            <Chip label="✅ Professional Tools" color="success" />
          </Box>

          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            <strong>LinkedIn Demo Access:</strong> Full functionality for core GC calculation and simulation tools. 
            Experience professional-grade analytical software designed by instrumentation specialists.
          </Alert>

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate('/demo/chromatogram')}
              sx={{ px: 4, py: 1.5 }}
            >
              Try Live Chromatogram Demo
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ScienceIcon />}
              onClick={() => navigate('/sandbox')}
              sx={{ px: 4, py: 1.5 }}
            >
              Build Virtual GC
            </Button>
          </Box>
        </Box>

        {/* Feature Showcase */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/demo/chromatogram')}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Interactive Chromatograms
                </Typography>
                <Typography color="text.secondary">
                  Real-time simulation showing how temperature programming affects compound separation.
                  See methane and ethane elution change with oven ramp rates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/sandbox')}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Virtual GC Builder
                </Typography>
                <Typography color="text.secondary">
                  Configure any GC instrument setup - columns, detectors, inlets. 
                  Perfect for method development and training without hardware.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ fontSize: 48, color: 'success.main', mb: 2 }}>🏭</Box>
                <Typography variant="h5" gutterBottom>
                  Professional Tools
                </Typography>
                <Typography color="text.secondary">
                  Detection limit calculators, troubleshooting assistants, and optimization tools 
                  designed for real analytical laboratory workflows.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Professional Credentials */}
        <Box textAlign="center" mt={6} pt={4} borderTop="1px solid #e2e8f0">
          <Typography variant="h6" gutterBottom>
            Built by GC Instrumentation Specialists
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            IntelliLab GC is developed by analytical chemistry professionals with decades of hands-on 
            experience in gas chromatography method development, troubleshooting, and optimization 
            across pharmaceutical, petrochemical, and environmental laboratories.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LinkedInLanding;
