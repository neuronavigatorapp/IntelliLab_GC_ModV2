import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Pagination,
  Alert,
  CircularProgress,
  Fab,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  GetApp as DownloadIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  TrendingUp as TrendingIcon
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

interface TemplateFormData {
  name: string;
  category: string;
  tool_type: string;
  description: string;
  parameters: Record<string, any>;
  is_public: boolean;
  tags: string[];
}

const MethodTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<MethodTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MethodTemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: 'Custom',
    tool_type: 'inlet_simulator',
    description: '',
    parameters: {},
    is_public: false,
    tags: []
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toolTypeFilter, setToolTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Available options
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
  
  const toolTypes = [
    { value: 'inlet_simulator', label: 'Inlet Simulator' },
    { value: 'detection_limit', label: 'Detection Limit Calculator' },
    { value: 'oven_ramp', label: 'Oven Ramp Visualizer' },
    { value: 'chromatogram_analysis', label: 'Chromatogram Analysis' },
    { value: 'predictive_maintenance', label: 'Predictive Maintenance' }
  ];
  
  useEffect(() => {
    loadTemplates();
  }, [page, searchTerm, categoryFilter, toolTypeFilter]);
  
  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (toolTypeFilter) params.append('tool_type', toolTypeFilter);
      params.append('skip', ((page - 1) * 20).toString());
      params.append('limit', '20');
      
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
      
      // Calculate total pages (assuming backend returns all matching for now)
      setTotalPages(Math.ceil(data.length / 20) || 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTemplate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/templates/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create template');
      }
      
      setSuccess('Template created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update template');
      }
      
      setSuccess('Template updated successfully');
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      setSuccess('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUseTemplate = async (template: MethodTemplate) => {
    try {
      // Mark template as used
      await fetch(`/api/v1/templates/${template.id}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Navigate to appropriate tool with template parameters
      const toolRoutes = {
        'inlet_simulator': '/tools/inlet-simulator',
        'detection_limit': '/tools/detection-limit',
        'oven_ramp': '/tools/oven-ramp',
        'chromatogram_analysis': '/ai/chromatogram-analysis',
        'predictive_maintenance': '/ai/predictive-maintenance'
      };
      
      const route = toolRoutes[template.tool_type as keyof typeof toolRoutes];
      if (route) {
        // Store template parameters in sessionStorage for the tool to pick up
        sessionStorage.setItem('templateParameters', JSON.stringify(template.parameters));
        sessionStorage.setItem('templateName', template.name);
        window.location.href = route;
      }
    } catch (error) {
      setError('Failed to use template');
    }
  };
  
  const openEditDialog = (template: MethodTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      tool_type: template.tool_type,
      description: template.description,
      parameters: template.parameters,
      is_public: template.is_public,
      tags: template.tags
    });
    setEditDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Custom',
      tool_type: 'inlet_simulator',
      description: '',
      parameters: {},
      is_public: false,
      tags: []
    });
  };
  
  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };
  
  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Method Template Manager
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Create, manage, and share reusable method templates for all GC analysis tools.
        Templates help standardize methods and speed up analysis setup.
      </Typography>
      
      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
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
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
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
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tool Type</InputLabel>
              <Select
                value={toolTypeFilter}
                onChange={(e) => setToolTypeFilter(e.target.value)}
                label="Tool Type"
              >
                <MenuItem value="">All Tools</MenuItem>
                {toolTypes.map(tool => (
                  <MenuItem key={tool.value} value={tool.value}>
                    {tool.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setToolTypeFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Templates List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {template.is_public ? (
                          <Tooltip title="Public Template">
                            <PublicIcon color="primary" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Private Template">
                            <PrivateIcon color="disabled" fontSize="small" />
                          </Tooltip>
                        )}
                        {template.usage_count > 10 && (
                          <Tooltip title={`Popular (${template.usage_count} uses)`}>
                            <TrendingIcon color="success" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.description || 'No description available'}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={template.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={toolTypes.find(t => t.value === template.tool_type)?.label || template.tool_type}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                    
                    {template.tags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {template.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Used {template.usage_count} times • {new Date(template.created_date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleUseTemplate(template)}
                      sx={{ mb: 1 }}
                    >
                      Use Template
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(template)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {templates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No templates found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first template to get started
              </Typography>
            </Box>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
      
      {/* Create Template FAB */}
      <Fab
        color="primary"
        aria-label="create template"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
      
      {/* Create Template Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tool Type</InputLabel>
                <Select
                  value={formData.tool_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, tool_type: e.target.value }))}
                  label="Tool Type"
                >
                  {toolTypes.map(tool => (
                    <MenuItem key={tool.value} value={tool.value}>
                      {tool.label}
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Parameters (JSON format)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={JSON.stringify(formData.parameters, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, parameters: parsed }));
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"parameter": "value"}'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tool Type</InputLabel>
                <Select
                  value={formData.tool_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, tool_type: e.target.value }))}
                  label="Tool Type"
                  disabled // Don't allow changing tool type for existing templates
                >
                  {toolTypes.map(tool => (
                    <MenuItem key={tool.value} value={tool.value}>
                      {tool.label}
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Parameters (JSON format)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={JSON.stringify(formData.parameters, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, parameters: parsed }));
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTemplate}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MethodTemplateManager;
