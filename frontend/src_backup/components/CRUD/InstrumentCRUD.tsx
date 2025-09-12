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
  Box
} from '@mui/material';
import { instrumentsAPI } from '../../services/apiService';

interface Instrument {
  id?: number;
  name: string;
  model: string;
  serial_number: string;
  install_date?: string;
  location?: string;
  age_years?: number;
  maintenance_level?: string;
  notes?: string;
}

interface InstrumentCRUDProps {
  open: boolean;
  instrument: Instrument | null;
  onClose: () => void;
  onSave: () => void;
}

const MANUFACTURERS = [
  'Agilent Technologies',
  'Shimadzu',
  'Thermo Fisher Scientific',
  'PerkinElmer',
  'Waters',
  'Bruker',
  'LECO'
];

const MAINTENANCE_LEVELS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Neglected'
];

export const InstrumentCRUD: React.FC<InstrumentCRUDProps> = ({
  open,
  instrument,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Instrument>({
    name: '',
    model: '',
    serial_number: '',
    install_date: '',
    location: '',
    age_years: 0,
    maintenance_level: 'Good',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (instrument) {
      setFormData(instrument);
    } else {
      setFormData({
        name: '',
        model: '',
        serial_number: '',
        install_date: '',
        location: '',
        age_years: 0,
        maintenance_level: 'Good',
        notes: ''
      });
    }
  }, [instrument, open]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.model.trim() || !formData.serial_number.trim()) {
      alert('Name, model, and serial number are required');
      return;
    }

    setLoading(true);
    try {
      if (instrument?.id) {
        await instrumentsAPI.update(instrument.id, formData);
      } else {
        await instrumentsAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving instrument:', error);
      alert('Failed to save instrument');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Instrument, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {instrument ? 'Edit Instrument' : 'Add New Instrument'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Instrument Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serial_number}
                onChange={(e) => handleChange('serial_number', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Install Date"
                type="date"
                value={formData.install_date || ''}
                onChange={(e) => handleChange('install_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Age (years)"
                type="number"
                value={formData.age_years || ''}
                onChange={(e) => handleChange('age_years', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 50, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Maintenance Level</InputLabel>
                <Select
                  value={formData.maintenance_level || 'Good'}
                  onChange={(e) => handleChange('maintenance_level', e.target.value)}
                >
                  {MAINTENANCE_LEVELS.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
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

export default InstrumentCRUD;
