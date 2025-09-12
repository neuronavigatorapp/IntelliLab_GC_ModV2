import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';

interface InstrumentOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const InstrumentOnboarding: React.FC<InstrumentOnboardingProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [instrumentData, setInstrumentData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    detector: '',
    column: ''
  });

  const steps = [
    {
      label: 'Welcome',
      description: 'Let\'s set up your GC instrument'
    },
    {
      label: 'Instrument Details',
      description: 'Enter your GC instrument information'
    },
    {
      label: 'Detector Configuration',
      description: 'Configure your detector settings'
    },
    {
      label: 'Column Information',
      description: 'Set up your column details'
    },
    {
      label: 'Complete',
      description: 'Your instrument is ready to use'
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <IntelliLabLogo size="large" />
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
              Let's Set Up Your GC! 🧪
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              This will take about 2 minutes. We'll save your progress automatically.
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleNext}
              sx={{ minWidth: 200, py: 2 }}
            >
              Get Started
            </Button>
            <Box mt={2}>
              <Button onClick={handleSkip}>Skip Setup For Now</Button>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box py={2}>
            <Typography variant="h6" gutterBottom>
              Instrument Information
            </Typography>
            <TextField
              fullWidth
              label="Instrument Name"
              value={instrumentData.name}
              onChange={(e) => setInstrumentData({...instrumentData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Model"
              value={instrumentData.model}
              onChange={(e) => setInstrumentData({...instrumentData, model: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Manufacturer</InputLabel>
              <Select
                value={instrumentData.manufacturer}
                label="Manufacturer"
                onChange={(e) => setInstrumentData({...instrumentData, manufacturer: e.target.value})}
              >
                <MenuItem value="agilent">Agilent</MenuItem>
                <MenuItem value="shimadzu">Shimadzu</MenuItem>
                <MenuItem value="perkinelmer">PerkinElmer</MenuItem>
                <MenuItem value="thermo">Thermo Scientific</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      
      case 2:
        return (
          <Box py={2}>
            <Typography variant="h6" gutterBottom>
              Detector Configuration
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Detector Type</InputLabel>
              <Select
                value={instrumentData.detector}
                label="Detector Type"
                onChange={(e) => setInstrumentData({...instrumentData, detector: e.target.value})}
              >
                <MenuItem value="fid">Flame Ionization Detector (FID)</MenuItem>
                <MenuItem value="ecd">Electron Capture Detector (ECD)</MenuItem>
                <MenuItem value="tcd">Thermal Conductivity Detector (TCD)</MenuItem>
                <MenuItem value="ms">Mass Spectrometer (MS)</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mb: 2 }}>
              The detector type will be used to optimize your method calculations.
            </Alert>
          </Box>
        );
      
      case 3:
        return (
          <Box py={2}>
            <Typography variant="h6" gutterBottom>
              Column Information
            </Typography>
            <TextField
              fullWidth
              label="Column Type"
              value={instrumentData.column}
              onChange={(e) => setInstrumentData({...instrumentData, column: e.target.value})}
              sx={{ mb: 2 }}
              placeholder="e.g., DB-5, HP-5, etc."
            />
            <Alert severity="success" sx={{ mb: 2 }}>
              Column information helps optimize temperature programs and method parameters.
            </Alert>
          </Box>
        );
      
      case 4:
        return (
          <Box textAlign="center" py={4}>
            <IntelliLabLogo size="large" />
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
              Setup Complete! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Your GC instrument is now configured and ready for use.
            </Typography>
            <Card sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Instrument Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Name:</strong> {instrumentData.name}<br />
                  <strong>Model:</strong> {instrumentData.model}<br />
                  <strong>Manufacturer:</strong> {instrumentData.manufacturer}<br />
                  <strong>Detector:</strong> {instrumentData.detector}<br />
                  <strong>Column:</strong> {instrumentData.column}
                </Typography>
              </CardContent>
            </Card>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleComplete}
              sx={{ minWidth: 200, py: 2 }}
            >
              Start Using Your GC
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              {renderStepContent(index)}
              <Box sx={{ mb: 2, mt: 2 }}>
                {index !== 0 && (
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                )}
                {index !== steps.length - 1 && index !== 0 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                  >
                    Continue
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default InstrumentOnboarding;
