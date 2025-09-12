import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab,
  Badge,
  Tooltip,
  Menu,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignIcon,
  Science as AnalysisIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

interface Sample {
  id: number;
  sample_id: string;
  name: string;
  matrix: string;
  prep_date: string;
  analyst_id: number;
  status: string;
  priority: string;
  notes: string;
  metadata: Record<string, any>;
  chain_of_custody: Record<string, any>;
  analysis_results: Record<string, any>;
  created_date: string;
  modified_date: string;
}

interface SampleFormData {
  sample_id: string;
  name: string;
  matrix: string;
  prep_date: string;
  analyst_id: number | '';
  status: string;
  priority: string;
  notes: string;
  metadata: Record<string, any>;
}

const SampleTracker: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SampleFormData>({
    sample_id: '',
    name: '',
    matrix: '',
    prep_date: '',
    analyst_id: '',
    status: 'received',
    priority: 'normal',
    notes: '',
    metadata: {}
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    matrix: '',
    analyst_id: ''
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Available options
  const statusOptions = [
    { value: 'received', label: 'Received', color: 'info' },
    { value: 'prep', label: 'In Preparation', color: 'warning' },
    { value: 'analysis', label: 'In Analysis', color: 'primary' },
    { value: 'complete', label: 'Complete', color: 'success' },
    { value: 'on_hold', label: 'On Hold', color: 'error' }
  ];
  
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'default' },
    { value: 'normal', label: 'Normal', color: 'primary' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'urgent', label: 'Urgent', color: 'error' }
  ];
  
  const matrixTypes = [
    'Water',
    'Soil',
    'Air',
    'Food',
    'Pharmaceutical',
    'Environmental',
    'Biological',
    'Chemical',
    'Other'
  ];
  
  useEffect(() => {
    loadSamples();
  }, [page, filters]);
  
  const loadSamples = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.matrix) params.append('matrix', filters.matrix);
      if (filters.analyst_id) params.append('analyst_id', filters.analyst_id);
      params.append('skip', ((page - 1) * 20).toString());
      params.append('limit', '20');
      
      const response = await fetch(`/api/v1/samples?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load samples');
      }
      
      const data = await response.json();
      setSamples(data);
      setTotalPages(Math.ceil(data.length / 20) || 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load samples');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateSample = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/samples/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sample');
      }
      
      setSuccess('Sample created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadSamples();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create sample');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateSample = async () => {
    if (!selectedSample) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/samples/${selectedSample.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sample');
      }
      
      setSuccess('Sample updated successfully');
      setEditDialogOpen(false);
      setSelectedSample(null);
      resetForm();
      loadSamples();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update sample');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSample = async (sampleId: number) => {
    if (!window.confirm('Are you sure you want to delete this sample?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/samples/${sampleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sample');
      }
      
      setSuccess('Sample deleted successfully');
      loadSamples();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete sample');
    } finally {
      setLoading(false);
    }
  };
  
  const openEditDialog = (sample: Sample) => {
    setSelectedSample(sample);
    setFormData({
      sample_id: sample.sample_id,
      name: sample.name,
      matrix: sample.matrix,
      prep_date: sample.prep_date ? sample.prep_date.split('T')[0] : '',
      analyst_id: sample.analyst_id || '',
      status: sample.status,
      priority: sample.priority,
      notes: sample.notes,
      metadata: sample.metadata
    });
    setEditDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      sample_id: '',
      name: '',
      matrix: '',
      prep_date: '',
      analyst_id: '',
      status: 'received',
      priority: 'normal',
      notes: '',
      metadata: {}
    });
  };
  
  const getStatusChip = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Chip
        label={statusOption?.label || status}
        color={statusOption?.color as any || 'default'}
        size="small"
      />
    );
  };
  
  const getPriorityChip = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return (
      <Chip
        label={priorityOption?.label || priority}
        color={priorityOption?.color as any || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };
  
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      matrix: '',
      analyst_id: ''
    });
    setPage(1);
  };
  
  // Count samples by status for dashboard
  const statusCounts = samples.reduce((counts, sample) => {
    counts[sample.status] = (counts[sample.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const urgentCount = samples.filter(s => s.priority === 'urgent').length;
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sample Tracker
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Track samples through their lifecycle with chain of custody and real-time status updates.
        Manage sample assignments, priorities, and analysis workflows.
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
      
      {/* Dashboard Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statusOptions.map((statusOption) => (
          <Grid item xs={6} md={2.4} key={statusOption.value}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color={`${statusOption.color}.main`}>
                  {statusCounts[statusOption.value] || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statusOption.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search samples..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="">All Priorities</MenuItem>
                {priorityOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Matrix</InputLabel>
              <Select
                value={filters.matrix}
                onChange={(e) => setFilters(prev => ({ ...prev, matrix: e.target.value }))}
                label="Matrix"
              >
                <MenuItem value="">All Matrices</MenuItem>
                {matrixTypes.map(matrix => (
                  <MenuItem key={matrix} value={matrix}>
                    {matrix}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                size="small"
              >
                Clear
              </Button>
              {urgentCount > 0 && (
                <Badge badgeContent={urgentCount} color="error">
                  <Button
                    variant="outlined"
                    startIcon={<WarningIcon />}
                    onClick={() => setFilters(prev => ({ ...prev, priority: 'urgent' }))}
                    size="small"
                  >
                    Urgent
                  </Button>
                </Badge>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Samples Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sample ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Matrix</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Analyst</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : samples.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No samples found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              samples.map((sample) => (
                <TableRow key={sample.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {sample.sample_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{sample.name}</TableCell>
                  <TableCell>{sample.matrix}</TableCell>
                  <TableCell>{getStatusChip(sample.status)}</TableCell>
                  <TableCell>{getPriorityChip(sample.priority)}</TableCell>
                  <TableCell>Analyst {sample.analyst_id}</TableCell>
                  <TableCell>
                    {new Date(sample.created_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit Sample">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(sample)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Timeline">
                        <IconButton size="small">
                          <TimelineIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Analysis">
                        <IconButton size="small">
                          <AnalysisIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => setMenuAnchor(e.currentTarget)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
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
      
      {/* Create Sample FAB */}
      <Fab
        color="primary"
        aria-label="create sample"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
      
      {/* Create Sample Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Sample</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sample ID"
                value={formData.sample_id}
                onChange={(e) => setFormData(prev => ({ ...prev, sample_id: e.target.value }))}
                required
                helperText="Leave blank for auto-generation"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sample Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Matrix</InputLabel>
                <Select
                  value={formData.matrix}
                  onChange={(e) => setFormData(prev => ({ ...prev, matrix: e.target.value }))}
                  label="Matrix"
                >
                  {matrixTypes.map(matrix => (
                    <MenuItem key={matrix} value={matrix}>
                      {matrix}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preparation Date"
                type="date"
                value={formData.prep_date}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Analyst ID"
                type="number"
                value={formData.analyst_id}
                onChange={(e) => setFormData(prev => ({ ...prev, analyst_id: parseInt(e.target.value) || '' }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSample}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Sample Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Sample</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sample ID"
                value={formData.sample_id}
                onChange={(e) => setFormData(prev => ({ ...prev, sample_id: e.target.value }))}
                disabled
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sample Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
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
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateSample}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <AssignIcon sx={{ mr: 1 }} />
          Transfer Sample
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <AnalysisIcon sx={{ mr: 1 }} />
          Add Results
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Sample
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SampleTracker;
