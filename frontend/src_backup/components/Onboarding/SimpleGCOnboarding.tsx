import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import { useNavigate } from 'react-router-dom';

export const SimpleGCOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Welcome to IntelliLab GC",
      description: "Professional gas chromatography platform for method development and analysis",
      action: "Get Started"
    },
    {
      title: "Add Your First Instrument", 
      description: "Configure your GC with built-in method optimization and performance predictions",
      action: "Add Instrument"
    },
    {
      title: "Ready to Analyze",
      description: "Your GC platform is configured and ready for professional analysis",
      action: "Start Using Platform"
    }
  ];

  const handleNext = () => {
    if (step === 2) {
      navigate('/instruments');
    } else if (step === 3) {
      navigate('/demo/chromatogram');
    } else {
      setStep(step + 1);
    }
  };

  const progress = (step / steps.length) * 100;

  return (
    <Box maxWidth="md" mx="auto" py={6}>
      <Box textAlign="center" mb={4}>
        <IntelliLabLogo size="large" />
        <Typography variant="h3" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
          Welcome to Professional GC Analysis
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4, maxWidth: 400, mx: 'auto' }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Step {step} of {steps.length}
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            {steps[step - 1].title}
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            {steps[step - 1].description}
          </Typography>

          {step === 1 && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Chip label="🔬 Method Development" color="primary" sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip label="📊 Real-time Analysis" color="secondary" sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip label="🎯 Performance Optimization" color="success" sx={{ mb: 1 }} />
              </Grid>
            </Grid>
          )}

          {step === 2 && (
            <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>Smart Instrument Setup:</strong>
              </Typography>
              <Typography variant="body2">
                • Automatic performance predictions<br/>
                • Built-in method optimization<br/>
                • Real-time efficiency calculations<br/>
                • Predictive maintenance alerts
              </Typography>
            </Alert>
          )}

          {step === 3 && (
            <Box sx={{ mb: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Setup Complete!
              </Typography>
              <Typography color="text.secondary">
                Your professional GC platform is ready for analysis
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleNext}
            sx={{ px: 4, py: 2, fontSize: '1.1rem' }}
          >
            {steps[step - 1].action}
          </Button>

          {step > 1 && (
            <Button
              sx={{ ml: 2 }}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleGCOnboarding;
