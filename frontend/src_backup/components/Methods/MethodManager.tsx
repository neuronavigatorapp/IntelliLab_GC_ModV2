import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { DualParameterInput } from '../UI/DualParameterInput';
import { EnhancedDropdown } from '../UI/EnhancedDropdown';
import { methodsAPI } from '../../services/apiService';

interface GCMethod {
  id?: number;
  name: string;
  description: string;
  instrumentId?: number;
  analysisType: string;
  status?: string;
  
  // Method Parameters
  oven: {
    initialTemp: number;
    finalTemp: number;
    rampRate: number;
    holdTime: number;
  };
  
  inlet: {
    temperature: number;
    splitRatio: number;
    flow: number;
    mode: string;
  };
  
  detector: {
    temperature: number;
    sensitivity: string;
  };
  
  // Predicted Performance
  expectedRT: number[];
  detectionLimit: number;
  analysisTime: number;
  efficiency: number;
  
  // Metadata
  createdDate: string;
  lastUsed: string;
  useCount: number;
  tags: string[];
}

export const MethodManager: React.FC = () => {
  const [methods, setMethods] = useState<GCMethod[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<GCMethod | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMethod, setSelectedMethod] = useState<GCMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMethod, setNewMethod] = useState<GCMethod>({
    name: '',
    description: '',
    analysisType: 'detection_limit',
    oven: {
      initialTemp: 50,
      finalTemp: 300,
      rampRate: 10,
      holdTime: 5
    },
    inlet: {
      temperature: 250,
      splitRatio: 10,
      flow: 1.0,
      mode: 'Split'
    },
    detector: {
      temperature: 300,
      sensitivity: 'High'
    },
    expectedRT: [],
    detectionLimit: 0,
    analysisTime: 0,
    efficiency: 0,
    createdDate: '',
    lastUsed: '',
    useCount: 0,
    tags: []
  });

  // Load methods data
  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await methodsAPI.list();
      const apiMethods = response.data;
      
      // Convert API data to our format
      const convertedMethods: GCMethod[] = apiMethods.map((apiMethod: any) => ({
        id: apiMethod.id,
        name: apiMethod.name,
        description: apiMethod.description,
        instrumentId: apiMethod.instrument_id,
        analysisType: apiMethod.type || 'detection_limit',
        oven: {
          initialTemp: apiMethod.parameters?.oven_temp || 40,
          finalTemp: 300,
          rampRate: 10,
          holdTime: 5
        },
        inlet: {
          temperature: apiMethod.parameters?.detector_temp || 250,
          splitRatio: apiMethod.parameters?.split_ratio || 50,
          flow: apiMethod.parameters?.carrier_flow || 1.5,
          mode: 'Split'
        },
        detector: {
          temperature: apiMethod.parameters?.detector_temp || 250,
          sensitivity: 'High'
        },
        expectedRT: [],
        detectionLimit: 0.001,
        analysisTime: 20,
        efficiency: 85,
        createdDate: apiMethod.created_date || new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        useCount: Math.floor(Math.random() * 50) + 1,
        tags: [apiMethod.type || 'detection_limit']
      }));
      
      setMethods(convertedMethods);
    } catch (err) {
      console.error('Failed to load methods:', err);
      setError('Failed to load methods. Using demo data.');
      // Set some demo methods
      setMethods([
        {
          id: 1,
          name: 'BTEX-2024-01',
          description: 'Benzene, Toluene, Ethylbenzene, Xylene analysis using FID detection',
          analysisType: 'detection_limit',
          oven: { initialTemp: 40, finalTemp: 300, rampRate: 10, holdTime: 5 },
          inlet: { temperature: 250, splitRatio: 50, flow: 1.5, mode: 'Split' },
          detector: { temperature: 250, sensitivity: 'High' },
          expectedRT: [3.2, 4.8, 6.5, 7.2],
          detectionLimit: 0.001,
          analysisTime: 20,
          efficiency: 85,
          createdDate: '2024-01-15T10:00:00Z',
          lastUsed: new Date().toISOString(),
          useCount: 25,
          tags: ['BTEX', 'FID', 'detection_limit']
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const getSampleMethods = (): GCMethod[] => [
    {
      id: 1,
      name: 'Light Hydrocarbons (C1-C5)',
      description: 'Standard method for analyzing light hydrocarbons in natural gas',
      analysisType: 'hydrocarbons',
      oven: { initialTemp: 35, finalTemp: 180, rampRate: 8, holdTime: 10 },
      inlet: { temperature: 200, splitRatio: 20, flow: 1.2, mode: 'Split' },
      detector: { temperature: 250, sensitivity: 'High' },
      expectedRT: [1.2, 1.8, 2.5, 4.2, 7.1],
      detectionLimit: 0.05,
      analysisTime: 28.5,
      efficiency: 92,
      createdDate: '2024-01-15',
      lastUsed: '2024-08-06',
      useCount: 47,
      tags: ['Natural Gas', 'Refinery', 'QC']
    },
    {
      id: 2,
      name: 'BTEX Analysis',
      description: 'EPA Method for benzene, toluene, ethylbenzene, and xylenes',
      analysisType: 'aromatics',
      oven: { initialTemp: 40, finalTemp: 200, rampRate: 5, holdTime: 8 },
      inlet: { temperature: 220, splitRatio: 50, flow: 1.0, mode: 'Split' },
      detector: { temperature: 280, sensitivity: 'Medium' },
      expectedRT: [8.5, 12.3, 16.8, 18.2],
      detectionLimit: 0.02,
      analysisTime: 40.0,
      efficiency: 88,
      createdDate: '2024-02-20',
      lastUsed: '2024-08-05',
      useCount: 23,
      tags: ['Environmental', 'EPA', 'VOCs']
    },
    {
      id: 3,
      name: 'Gasoline Oxygenates',
      description: 'Analysis of MTBE, ETBE, and alcohol oxygenates in gasoline',
      analysisType: 'oxygenates',
      oven: { initialTemp: 45, finalTemp: 120, rampRate: 6, holdTime: 5 },
      inlet: { temperature: 180, splitRatio: 10, flow: 0.8, mode: 'Splitless' },
      detector: { temperature: 250, sensitivity: 'High' },
      expectedRT: [4.2, 6.8, 9.1, 11.5],
      detectionLimit: 0.08,
      analysisTime: 22.5,
      efficiency: 85,
      createdDate: '2024-03-10',
      lastUsed: '2024-08-04',
      useCount: 12,
      tags: ['Gasoline', 'Oxygenates', 'Refinery']
    }
  ];

  const calculateMethodPerformance = (method: Partial<GCMethod>): Partial<GCMethod> => {
    if (!method.oven || !method.inlet || !method.detector) return method;

    // Calculate analysis time
    const rampTime = (method.oven.finalTemp - method.oven.initialTemp) / method.oven.rampRate;
    const analysisTime = rampTime + method.oven.holdTime + 5; // +5 for equilibration

    // Calculate expected retention times based on analysis type
    const baseRT = [1.5, 2.8, 4.5, 7.2, 12.0]; // Base retention times
    const tempEffect = 1 - ((method.oven.initialTemp - 50) * 0.01);
    const rampEffect = Math.sqrt(10 / method.oven.rampRate);
    const expectedRT = baseRT.map(rt => rt * tempEffect * rampEffect);

    // Calculate detection limit
    const splitEffect = 1.0 / method.inlet.splitRatio;
    const inletTempEffect = method.inlet.temperature > 200 ? 1.0 : 0.8;
    const detectionLimit = 0.1 / (splitEffect * inletTempEffect);

    // Calculate efficiency
    const tempRangeEffect = (method.oven.finalTemp - method.oven.initialTemp) / 200;
    const rampRateEffect = 10 / method.oven.rampRate;
    const efficiency = Math.min(100, tempRangeEffect * rampRateEffect * 85);

    return {
      ...method,
      expectedRT: expectedRT.slice(0, method.analysisType === 'hydrocarbons' ? 5 : 4),
      detectionLimit: parseFloat(detectionLimit.toFixed(3)),
      analysisTime: parseFloat(analysisTime.toFixed(1)),
      efficiency: parseFloat(efficiency.toFixed(1))
    };
  };

  const saveMethod = () => {
    const performance = calculateMethodPerformance(newMethod);
    const methodToSave = {
      ...performance,
      id: editingMethod?.id || Date.now(),
      createdDate: editingMethod?.createdDate || new Date().toISOString().split('T')[0],
      lastUsed: new Date().toISOString().split('T')[0],
      useCount: editingMethod?.useCount || 0
    } as GCMethod;

    let updatedMethods;
    if (editingMethod) {
      updatedMethods = methods.map(method => 
        method.id === editingMethod.id ? methodToSave : method
      );
    } else {
      updatedMethods = [...methods, methodToSave];
    }

    setMethods(updatedMethods);
    localStorage.setItem('gc_methods', JSON.stringify(updatedMethods));
    
    setDialogOpen(false);
    setEditingMethod(null);
    resetForm();
  };

  const resetForm = () => {
    setNewMethod({
      name: '',
      description: '',
      analysisType: 'hydrocarbons',
      oven: { initialTemp: 50, finalTemp: 300, rampRate: 10, holdTime: 5 },
      inlet: { temperature: 250, splitRatio: 10, flow: 1.0, mode: 'Split' },
      detector: { temperature: 300, sensitivity: 'High' },
      expectedRT: [],
      detectionLimit: 0,
      analysisTime: 0,
      efficiency: 0,
      createdDate: '',
      lastUsed: '',
      useCount: 0,
      tags: []
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, method: GCMethod) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMethod(method);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMethod(null);
  };

  const duplicateMethod = () => {
    if (selectedMethod) {
      const duplicate = {
        ...selectedMethod,
        id: Date.now(),
        name: `${selectedMethod.name} (Copy)`,
        createdDate: new Date().toISOString().split('T')[0],
        useCount: 0
      };
      const updatedMethods = [...methods, duplicate];
      setMethods(updatedMethods);
      localStorage.setItem('gc_methods', JSON.stringify(updatedMethods));
    }
    handleMenuClose();
  };

  const deleteMethod = () => {
    if (selectedMethod) {
      const updatedMethods = methods.filter(method => method.id !== selectedMethod.id);
      setMethods(updatedMethods);
      localStorage.setItem('gc_methods', JSON.stringify(updatedMethods));
    }
    handleMenuClose();
  };

  const runMethod = (method: GCMethod) => {
    // Increment use count
    const updatedMethods = methods.map(m => 
      m.id === method.id ? { ...m, useCount: m.useCount + 1, lastUsed: new Date().toISOString().split('T')[0] } : m
    );
    setMethods(updatedMethods);
    localStorage.setItem('gc_methods', JSON.stringify(updatedMethods));

    // Navigate to chromatogram simulator with method parameters
    // This would be implemented to pass method parameters to the simulator
    console.log('Running method:', method.name);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Method Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create, manage, and optimize your GC analysis methods with performance predictions.
      </Typography>

      {/* Methods Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Methods Overview
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Method Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Uses</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {method.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={method.analysisType} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {method.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={method.status || 'Active'}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{method.useCount}</TableCell>
                    <TableCell>
                      {new Date(method.lastUsed).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => runMethod(method)}
                        sx={{ mr: 1 }}
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditingMethod(method);
                          setNewMethod(method);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Method Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingMethod(null);
            setDialogOpen(true);
          }}
        >
          Add Method
        </Button>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={duplicateMethod}>
          <ContentCopyIcon sx={{ mr: 1 }} fontSize="small" />
          Duplicate Method
        </MenuItem>
        <MenuItem onClick={deleteMethod} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Method
        </MenuItem>
      </Menu>

      {/* Add/Edit Method Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingMethod ? 'Edit Method' : 'Create New GC Method'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Method Name"
                value={newMethod.name}
                onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                sx={{ mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <EnhancedDropdown
                label="Analysis Type"
                value={newMethod.analysisType}
                onChange={(value) => setNewMethod({...newMethod, analysisType: value as string})}
                options={[
                  { value: 'hydrocarbons', label: 'Light Hydrocarbons', description: 'C1-C12 analysis' },
                  { value: 'aromatics', label: 'BTEX Aromatics', description: 'Benzene, toluene, xylenes' },
                  { value: 'oxygenates', label: 'Gasoline Oxygenates', description: 'MTBE, alcohols' }
                ]}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newMethod.description}
                onChange={(e) => setNewMethod({...newMethod, description: e.target.value})}
                sx={{ mb: 3 }}
              />
            </Grid>

            {/* Oven Parameters */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Oven Programming
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Initial Temperature"
                value={newMethod.oven.initialTemp}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  oven: {...newMethod.oven, initialTemp: value}
                })}
                min={30}
                max={200}
                step={5}
                unit="°C"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Final Temperature"
                value={newMethod.oven.finalTemp}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  oven: {...newMethod.oven, finalTemp: value}
                })}
                min={100}
                max={400}
                step={10}
                unit="°C"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Ramp Rate"
                value={newMethod.oven.rampRate}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  oven: {...newMethod.oven, rampRate: value}
                })}
                min={1}
                max={50}
                step={1}
                unit="°C/min"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DualParameterInput
                label="Hold Time"
                value={newMethod.oven.holdTime}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  oven: {...newMethod.oven, holdTime: value}
                })}
                min={0}
                max={30}
                step={1}
                unit="min"
              />
            </Grid>

            {/* Inlet Parameters */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                Inlet Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <DualParameterInput
                label="Inlet Temperature"
                value={newMethod.inlet.temperature}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  inlet: {...newMethod.inlet, temperature: value}
                })}
                min={150}
                max={400}
                step={10}
                unit="°C"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DualParameterInput
                label="Split Ratio"
                value={newMethod.inlet.splitRatio}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  inlet: {...newMethod.inlet, splitRatio: value}
                })}
                min={1}
                max={200}
                step={1}
                unit=":1"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DualParameterInput
                label="Carrier Flow"
                value={newMethod.inlet.flow}
                onChange={(value) => setNewMethod({
                  ...newMethod,
                  inlet: {...newMethod.inlet, flow: value}
                })}
                min={0.1}
                max={5.0}
                step={0.1}
                unit="mL/min"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveMethod}
            disabled={!newMethod.name}
            startIcon={<SaveIcon />}
          >
            {editingMethod ? 'Update Method' : 'Save Method'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MethodManager;
