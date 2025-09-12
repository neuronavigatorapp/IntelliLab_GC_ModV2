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
import { compoundsAPI } from '../../services/apiService';

interface Compound {
  id?: number;
  name: string;
  category?: string;
  retention_time: number;
  molecular_weight?: number;
  default_intensity: number;
  default_width: number;
}

interface CompoundCRUDProps {
  open: boolean;
  compound: Compound | null;
  onClose: () => void;
  onSave: () => void;
}

const COMPOUND_CATEGORIES = [
  'Hydrocarbon',
  'Aromatic',
  'Oxygenate',
  'Alcohol',
  'Ketone',
  'Ester',
  'Acid',
  'Other'
];

export const CompoundCRUD: React.FC<CompoundCRUDProps> = ({
  open,
  compound,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Compound>({
    name: '',
    category: '',
    retention_time: 1.0,
    molecular_weight: 0,
    default_intensity: 100.0,
    default_width: 0.1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (compound) {
      setFormData(compound);
    } else {
      setFormData({
        name: '',
        category: '',
        retention_time: 1.0,
        molecular_weight: 0,
        default_intensity: 100.0,
        default_width: 0.1
      });
    }
  }, [compound, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setLoading(true);
    try {
      if (compound?.id) {
        await compoundsAPI.update(compound.id, formData);
      } else {
        await compoundsAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving compound:', error);
      alert('Failed to save compound');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Compound, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {compound ? 'Edit Compound' : 'Add New Compound'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Compound Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {COMPOUND_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Retention Time (min)"
                type="number"
                value={formData.retention_time}
                onChange={(e) => handleChange('retention_time', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Molecular Weight (g/mol)"
                type="number"
                value={formData.molecular_weight || ''}
                onChange={(e) => handleChange('molecular_weight', parseFloat(e.target.value) || undefined)}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Intensity"
                type="number"
                value={formData.default_intensity}
                onChange={(e) => handleChange('default_intensity', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 1, max: 10000, step: 1 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Width (min)"
                type="number"
                value={formData.default_width}
                onChange={(e) => handleChange('default_width', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.01, max: 5, step: 0.01 }}
                required
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

export default CompoundCRUD;
