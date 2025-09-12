import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { methodsAPI } from '../../services/apiService';

interface Method {
  id?: number;
  name: string;
  description?: string;
  method_type: string;
  parameters: any;
}

interface MethodCRUDProps {
  open: boolean;
  method: Method | null;
  onClose: () => void;
  onSave: () => void;
}

const METHOD_TYPES = [
  'inlet_simulation',
  'oven_ramp',
  'detection_limit',
  'general_gc',
  'troubleshooting'
];

const DEFAULT_PARAMETERS = {
  inlet_simulation: {
    inlet_temp: 250,
    split_ratio: 20,
    injection_volume: 1.0,
    liner_type: 'Split/Splitless',
    carrier_gas: 'Helium',
    carrier_flow_rate: 1.2
  },
  oven_ramp: {
    initial_temp: 40,
    initial_hold: 2,
    ramp_rate_1: 10,
    final_temp_1: 200,
    hold_time_1: 5,
    ramp_rate_2: 20,
    final_temp_2: 300,
    final_hold: 2
  },
  detection_limit: {
    detector_type: 'FID',
    carrier_gas: 'Helium',
    column_type: 'DB-5',
    injector_temp: 250,
    detector_temp: 300,
    oven_temp: 150
  },
  general_gc: {
    column_type: 'DB-5',
    column_length: 30,
    column_diameter: 0.25,
    film_thickness: 0.25
  }
};

export const MethodCRUD: React.FC<MethodCRUDProps> = ({
  open,
  method,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Method>({
    name: '',
    description: '',
    method_type: 'general_gc',
    parameters: DEFAULT_PARAMETERS.general_gc
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (method) {
      setFormData(method);
    } else {
      setFormData({
        name: '',
        description: '',
        method_type: 'general_gc',
        parameters: DEFAULT_PARAMETERS.general_gc
      });
    }
  }, [method, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setLoading(true);
    try {
      if (method?.id) {
        await methodsAPI.update(method.id, formData);
      } else {
        await methodsAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving method:', error);
      alert('Failed to save method');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      method_type: newType,
      parameters: DEFAULT_PARAMETERS[newType as keyof typeof DEFAULT_PARAMETERS] || {}
    }));
  };

  const handleParameterChange = (paramKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramKey]: value
      }
    }));
  };

  const renderParameterFields = () => {
    const params = formData.parameters || {};
    
    return Object.entries(params).map(([key, value]) => (
      <Grid item xs={12} md={6} key={key}>
        <TextField
          fullWidth
          label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          value={value || ''}
          onChange={(e) => {
            const newValue = typeof value === 'number' 
              ? parseFloat(e.target.value) || 0 
              : e.target.value;
            handleParameterChange(key, newValue);
          }}
          type={typeof value === 'number' ? 'number' : 'text'}
        />
      </Grid>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {method ? 'Edit Method' : 'Add New Method'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Method Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Method Type</InputLabel>
                <Select
                  value={formData.method_type}
                  onChange={(e) => handleMethodTypeChange(e.target.value)}
                >
                  {METHOD_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Method Parameters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {renderParameterFields()}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MethodCRUD;
