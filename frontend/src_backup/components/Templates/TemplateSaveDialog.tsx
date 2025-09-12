import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';

interface TemplateSaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  toolType: string;
  parameters: Record<string, any>;
  currentMethodName?: string;
}

const TemplateSaveDialog: React.FC<TemplateSaveDialogProps> = ({
  open,
  onClose,
  onSave,
  toolType,
  parameters,
  currentMethodName = ''
}) => {
  const [formData, setFormData] = useState({
    name: currentMethodName,
    category: 'Custom',
    description: '',
    is_public: false,
    tags: [] as string[]
  });
  
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const categories = [
    'Hydrocarbons',
    'Environmental',
    'Pharmaceutical',
    'Food & Beverage',
    'Petrochemical',
    'Forensic',
    'Research',
    'Quality Control',
    'Custom'
  ];
  
  const getToolTypeLabel = (type: string) => {
    const labels = {
      'inlet_simulator': 'Inlet Simulator',
      'detection_limit': 'Detection Limit Calculator',
      'oven_ramp': 'Oven Ramp Visualizer',
      'chromatogram_analysis': 'Chromatogram Analysis',
      'predictive_maintenance': 'Predictive Maintenance'
    };
    return labels[type as keyof typeof labels] || type;
  };
  
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const templateData = {
        name: formData.name.trim(),
        category: formData.category,
        tool_type: toolType,
        description: formData.description.trim(),
        parameters: parameters,
        is_public: formData.is_public,
        tags: formData.tags
      };
      
      const response = await fetch('/api/v1/templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save template');
      }
      
      setSuccess('Template saved successfully!');
      setTimeout(() => {
        onSave();
        handleClose();
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFormData({
      name: currentMethodName,
      category: 'Custom',
      description: '',
      is_public: false,
      tags: []
    });
    setTagInput('');
    setError(null);
    setSuccess(null);
    onClose();
  };
  
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Generate suggested tags based on parameters
  const getSuggestedTags = () => {
    const suggestions: string[] = [];
    
    // Add tool-specific suggestions
    if (toolType === 'inlet_simulator') {
      if (parameters.split_ratio === 0) suggestions.push('splitless');
      if (parameters.split_ratio > 0) suggestions.push('split');
      if (parameters.injection_temperature > 280) suggestions.push('high-temp');
    }
    
    if (toolType === 'detection_limit') {
      if (parameters.signal_to_noise <= 3) suggestions.push('LOD');
      if (parameters.signal_to_noise >= 10) suggestions.push('LOQ');
      if (parameters.optimization_target) suggestions.push(parameters.optimization_target);
    }
    
    if (toolType === 'oven_ramp') {
      if (parameters.ramp_rate > 20) suggestions.push('fast');
      if (parameters.final_temp > 300) suggestions.push('high-temp');
      if (parameters.total_time && parameters.total_time < 15) suggestions.push('rapid');
    }
    
    // Add category-based suggestions
    if (formData.category === 'Environmental') {
      suggestions.push('EPA', 'environmental');
    }
    if (formData.category === 'Pharmaceutical') {
      suggestions.push('FDA', 'pharmaceutical');
    }
    
    return suggestions.filter(s => !formData.tags.includes(s));
  };
  
  const suggestedTags = getSuggestedTags();
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Save as Template - {getToolTypeLabel(toolType)}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={loading}
              helperText="Give your template a descriptive name"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
                disabled={loading}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              helperText="Describe when and how to use this template"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                disabled={loading}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
              >
                Add
              </Button>
            </Box>
            
            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Suggested tags:
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {suggestedTags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...prev.tags, tag]
                        }));
                      }}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Current Tags */}
            {formData.tags.length > 0 && (
              <Box>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                    disabled={loading}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  disabled={loading}
                />
              }
              label="Make template public (visible to all users)"
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Public templates can be used by any user in your organization
            </Typography>
          </Grid>
        </Grid>
        
        {/* Parameters Preview */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Parameters to Save:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'grey.50',
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 1,
              p: 2,
              maxHeight: 200,
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(parameters, null, 2)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSaveDialog;
