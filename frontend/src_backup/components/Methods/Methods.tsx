import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Fab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Science as ScienceIcon,
  Thermostat as ThermostatIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ContentCopy as CopyIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LogoLoader } from '../Loading/LogoLoader';

interface Method {
  id: number;
  name: string;
  description: string;
  method_type: string;
  parameters: any;
  created_date: string;
  modified_date: string;
  is_template: boolean;
  category: string;
}

const Methods: React.FC = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);

  // Load methods from API with fallback to sample data
  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      try {
        const { methodsAPI } = await import('../../services/apiService');
        const response = await methodsAPI.list();
        setMethods(response.data || []);
        console.log('Methods loaded from API:', response.data?.length || 0);
        return;
      } catch (apiError) {
        console.warn('API not available, using sample data:', apiError);
      }
      
      // Fallback to sample data for field testing
      const sampleMethods: Method[] = [
        {
          id: 1,
          name: 'PDH Feed Analysis',
          description: 'Standard method for PDH feed hydrocarbon analysis',
          method_type: 'inlet',
          parameters: {
            detector_type: 'FID',
            carrier_gas: 'Helium',
            injector_temp: 250,
            detector_temp: 280,
            oven_temp: 80,
            flow_rate: 1.5,
            split_ratio: 50,
            injection_volume: 1.0
          },
          created_date: '2024-01-15T00:00:00',
          modified_date: '2024-12-17T00:00:00',
          is_template: true,
          category: 'Hydrocarbon Analysis'
        },
        {
          id: 2,
          name: 'Product Quality Check',
          description: 'Method for analyzing PDH product quality',
          method_type: 'oven',
          parameters: {
            initial_temp: 40,
            initial_hold: 2,
            ramp_rate_1: 8,
            final_temp_1: 200,
            hold_time_1: 5,
            ramp_rate_2: 10,
            final_temp_2: 280,
            final_hold: 3
          },
          created_date: '2024-02-01T00:00:00',
          modified_date: '2024-12-17T00:00:00',
          is_template: true,
          category: 'Product Analysis'
        },
        {
          id: 3,
          name: 'Inlet Performance Test',
          description: 'Method for testing inlet transfer efficiency',
          method_type: 'inlet',
          parameters: {
            inlet_temp: 250,
            split_ratio: 50,
            injection_volume: 1.0,
            liner_type: 'Split Liner',
            injection_mode: 'Split',
            carrier_gas: 'Helium',
            carrier_flow_rate: 1.0
          },
          created_date: '2024-03-15T00:00:00',
          modified_date: '2024-12-17T00:00:00',
          is_template: true,
          category: 'Performance Testing'
        }
      ];
      setMethods(sampleMethods);
    } catch (error) {
      console.error('Error loading methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = () => {
    setSelectedMethod(null);
    setDialogOpen(true);
  };

  const handleEditMethod = (method: Method) => {
    setSelectedMethod(method);
    setDialogOpen(true);
  };

  const handleDeleteMethod = (id: number) => {
    setMethods(methods.filter(method => method.id !== id));
  };

  const handleRunMethod = (method: Method) => {
    // Navigate to appropriate tool based on method type
    if (method.method_type === 'inlet') {
      navigate('/tools/inlet-simulator', { state: { method } });
    } else if (method.method_type === 'oven') {
      navigate('/tools/oven-ramp', { state: { method } });
    } else {
      navigate('/tools/detection-limit', { state: { method } });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'inlet':
        return <SpeedIcon />;
      case 'oven':
        return <ThermostatIcon />;
      case 'detection':
        return <ScienceIcon />;
      default:
        return <BuildIcon />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'inlet':
        return 'primary';
      case 'oven':
        return 'secondary';
      case 'detection':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📋 Methods & Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateMethod}
          sx={{ py: 1.5, px: 3 }}
        >
          Create Method
        </Button>
      </Box>

      {/* Quick Templates */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        ⚡ Quick Templates
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            }
          }}
          onClick={() => navigate('/tools/detection-limit')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Detection Limit</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Calculate detection limits for your GC method
              </Typography>
              <Button variant="outlined" fullWidth>
                Start Calculation
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            }
          }}
          onClick={() => navigate('/tools/oven-ramp')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ThermostatIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Oven Program</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Design temperature programs for optimal separation
              </Typography>
              <Button variant="outlined" fullWidth>
                Design Program
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            }
          }}
          onClick={() => navigate('/tools/inlet-simulator')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Inlet Simulator</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Simulate inlet performance and transfer efficiency
              </Typography>
              <Button variant="outlined" fullWidth>
                Run Simulation
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Saved Methods */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        💾 Saved Methods
      </Typography>
      <Grid container spacing={3}>
        {methods.map((method) => (
          <Grid item xs={12} sm={6} md={4} key={method.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {method.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getMethodIcon(method.method_type)}
                    label={method.method_type}
                    color={getMethodColor(method.method_type) as any}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Category:</strong> {method.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(method.created_date).toLocaleDateString()}
                  </Typography>
                </Box>

                {method.is_template && (
                  <Chip 
                    label="Template" 
                    color="info" 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                )}
              </CardContent>
              
              <CardActions>
                <Tooltip title="Run Method">
                  <IconButton 
                    size="small" 
                    onClick={() => handleRunMethod(method)}
                    color="primary"
                  >
                    <RunIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Method">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditMethod(method)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate Method">
                  <IconButton size="small">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Method">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteMethod(method.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {methods.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No methods found. Create your first method or use one of the quick templates above.
        </Alert>
      )}

      {/* Tips Section */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>💡 Tip:</strong> Use the quick templates to get started, then save your optimized methods for future use. 
          Each method can be run directly in the appropriate calculation tool.
        </Typography>
      </Alert>

      {/* Method Creation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMethod ? 'Edit Method' : 'Create New Method'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Method creation is coming soon. For now, use the quick templates above to start your calculations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Methods; 