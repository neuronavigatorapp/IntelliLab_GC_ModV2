import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as UseIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface MethodTemplate {
  id: number;
  name: string;
  category: string;
  tool_type: string;
  description: string;
  parameters: Record<string, any>;
  created_by: number;
  is_public: boolean;
  usage_count: number;
  tags: string[];
  created_date: string;
  modified_date: string;
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: MethodTemplate) => void;
  toolType: string;
  title?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  open,
  onClose,
  onSelect,
  toolType,
  title = 'Select Template'
}) => {
  const [templates, setTemplates] = useState<MethodTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
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
  
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, searchTerm, categoryFilter, toolType]);
  
  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('tool_type', toolType);
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('limit', '50');
      
      const response = await fetch(`/api/v1/templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectTemplate = async (template: MethodTemplate) => {
    try {
      // Mark template as used
      await fetch(`/api/v1/templates/${template.id}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      onSelect(template);
      onClose();
    } catch (error) {
      console.error('Failed to mark template as used:', error);
      // Still proceed with selection even if usage tracking fails
      onSelect(template);
      onClose();
    }
  };
  
  const handleClose = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setError(null);
    onClose();
  };
  
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
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group templates by category for better organization
  const groupedTemplates = filteredTemplates.reduce((groups, template) => {
    const category = template.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {} as Record<string, MethodTemplate[]>);
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {title} - {getToolTypeLabel(toolType)}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Search and Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {/* Templates List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No templates found for {getToolTypeLabel(toolType)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create templates in the Method Template Manager to see them here
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  {category}
                </Typography>
                
                <List dense>
                  {categoryTemplates.map((template) => (
                    <ListItem
                      key={template.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {template.name}
                            </Typography>
                            {template.is_public && (
                              <Chip label="Public" size="small" color="primary" />
                            )}
                            {template.usage_count > 10 && (
                              <Chip label="Popular" size="small" color="success" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {template.description || 'No description available'}
                            </Typography>
                            
                            {template.tags.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {template.tags.map((tag, index) => (
                                  <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                            
                            <Typography variant="caption" color="text.secondary">
                              Used {template.usage_count} times • {new Date(template.created_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<UseIcon />}
                          onClick={() => handleSelectTemplate(template)}
                        >
                          Use
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelector;
