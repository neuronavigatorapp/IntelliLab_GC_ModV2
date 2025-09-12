import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  content: React.ReactNode;
  completed: boolean;
}

interface OnboardingGuideProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'launcher',
      title: 'Master Launcher',
      description: 'Navigate the unified platform dashboard',
      icon: <DashboardIcon />,
      path: '/app',
      completed: false,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Welcome to IntelliLab GC! This is your unified dashboard where you can access all platform features.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Features:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  KPI cards show real-time system status
                </Typography>
                <Typography component="li" variant="body2">
                  Quick access to all calculation tools
                </Typography>
                <Typography component="li" variant="body2">
                  Recent activity and alerts
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography variant="body2" color="text.secondary">
            Click the cards to navigate to different modules, or use the top navigation tabs.
          </Typography>
        </Box>
      )
    },
    {
      id: 'navigation',
      title: 'Global Navigation',
      description: 'Learn the navigation system',
      icon: <DashboardIcon />,
      path: '/app',
      completed: false,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            The top navigation provides quick access to all platform modules.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Navigation Features:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScienceIcon color="primary" />
                  <Typography variant="body2">Simulation - Calculation tools</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon color="primary" />
                  <Typography variant="body2">Fleet - Instrument management</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TuneIcon color="primary" />
                  <Typography variant="body2">Methods - Templates and analysis</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="body2">Inventory - Consumable tracking</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="body2">Reports - Analytics and exports</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Typography variant="body2" color="text.secondary">
            Badges on tabs indicate active alerts or items requiring attention.
          </Typography>
        </Box>
      )
    },
    {
      id: 'data-store',
      title: 'Data Integration',
      description: 'Understand the shared data store',
      icon: <DashboardIcon />,
      path: '/app',
      completed: false,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            The platform uses a unified data store that automatically syncs across all modules.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Features:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  Real-time KPI updates from all modules
                </Typography>
                <Typography component="li" variant="body2">
                  Automatic data refresh every 60 seconds
                </Typography>
                <Typography component="li" variant="body2">
                  Manual refresh available via status bar
                </Typography>
                <Typography component="li" variant="body2">
                  Cross-module data consistency
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography variant="body2" color="text.secondary">
            The status bar shows sync status and system alerts. Click the refresh button to manually update data.
          </Typography>
        </Box>
      )
    },
    {
      id: 'reports',
      title: 'Reporting Engine',
      description: 'Generate comprehensive reports',
      icon: <AssessmentIcon />,
      path: '/reports',
      completed: false,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            The reporting system allows you to generate comprehensive reports in multiple formats.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Types:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label="PDF" color="primary" variant="outlined" />
                <Chip label="CSV" color="secondary" variant="outlined" />
                <Chip label="Excel" color="success" variant="outlined" />
              </Box>
              <Typography variant="body2" paragraph>
                Quick reports are available for common scenarios:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  Low stock inventory alerts
                </Typography>
                <Typography component="li" variant="body2">
                  Fleet maintenance summaries
                </Typography>
                <Typography component="li" variant="body2">
                  Method performance analysis
                </Typography>
                <Typography component="li" variant="body2">
                  Cost analysis reports
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography variant="body2" color="text.secondary">
            Custom reports can be generated with specific parameters and filters.
          </Typography>
        </Box>
      )
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      description: 'Set up inventory thresholds',
      icon: <InventoryIcon />,
      path: '/inventory',
      completed: false,
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            The inventory system helps you track consumables and prevent stockouts.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Features:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  Set reorder thresholds for each item
                </Typography>
                <Typography component="li" variant="body2">
                  Predictive usage modeling
                </Typography>
                <Typography component="li" variant="body2">
                  Low stock alerts and notifications
                </Typography>
                <Typography component="li" variant="body2">
                  Cost tracking and optimization
                </Typography>
                <Typography component="li" variant="body2">
                  Usage pattern analysis
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Typography variant="body2" color="text.secondary">
            Configure thresholds based on your usage patterns and supplier lead times.
          </Typography>
        </Box>
      )
    }
  ];

  const handleNext = () => {
    const currentStep = steps[activeStep];
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep.id)));
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      // Navigate to the step's path
      navigate(steps[activeStep + 1].path);
    } else {
      // Complete onboarding
      localStorage.setItem('intellilab-onboarding-completed', 'true');
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      navigate(steps[activeStep - 1].path);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('intellilab-onboarding-completed', 'true');
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open) {
      // Navigate to the first step's path
      navigate(steps[0].path);
    }
  }, [open, navigate]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            Welcome to IntelliLab GC
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Let's get you started with the platform
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Stepper */}
          <Box sx={{ width: 300, flexShrink: 0 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.id}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: completedSteps.has(step.id) ? 'success.main' : 'rgba(255,255,255,0.2)',
                        color: 'white'
                      }}>
                        {completedSteps.has(step.id) ? <CheckIcon /> : step.icon}
                      </Box>
                    )}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {step.content}
                      </Typography>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, pl: 2 }}>
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              borderRadius: 2, 
              p: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {steps[activeStep].content}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button onClick={handleSkip} sx={{ color: 'white' }}>
            Skip Tour
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ color: 'white' }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowIcon />}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingGuide;
