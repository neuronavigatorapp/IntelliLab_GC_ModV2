import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { sequencesAPI } from '../../services/apiService';
import { SequenceTemplate, SequenceItem } from '../../types/chromatography';

interface SequenceBuilderProps {
  templateId?: string;
}

const SequenceBuilder: React.FC<SequenceBuilderProps> = ({ templateId }) => {
  const [templates, setTemplates] = useState<SequenceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SequenceTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Template building state
  const [templateName, setTemplateName] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | ''>('');
  const [items, setItems] = useState<SequenceItem[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await sequencesAPI.listTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const response = await sequencesAPI.getTemplate(id);
      const template = response.data;
      setSelectedTemplate(template);
      setTemplateName(template.name);
      setTemplateNotes(template.notes || '');
      setSelectedInstrumentId(template.instrument_id || '');
      setItems(template.items);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const addItem = () => {
    const newItem: SequenceItem = {
      id: `item_${Date.now()}`,
      order: items.length + 1,
      type: 'Sample',
      sample_name: '',
      method_id: 1,
      expected_level: undefined
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof SequenceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Update order if type changed
    if (field === 'type') {
      updatedItems[index].order = index + 1;
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updatedItems = [...items];
      [updatedItems[index], updatedItems[index - 1]] = [updatedItems[index - 1], updatedItems[index]];
      updatedItems[index].order = index + 1;
      updatedItems[index - 1].order = index;
      setItems(updatedItems);
    } else if (direction === 'down' && index < items.length - 1) {
      const updatedItems = [...items];
      [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]];
      updatedItems[index].order = index + 1;
      updatedItems[index + 1].order = index + 2;
      setItems(updatedItems);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one sequence item');
      return;
    }

    try {
      setLoading(true);
      const template: SequenceTemplate = {
        name: templateName,
        instrument_id: selectedInstrumentId ? Number(selectedInstrumentId) : undefined,
        items: items,
        notes: templateNotes,
        created_at: new Date().toISOString()
      };

      if (selectedTemplate) {
        // Update existing template
        await sequencesAPI.updateTemplate(selectedTemplate.id!, template);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        await sequencesAPI.createTemplate(template);
        toast.success('Template created successfully');
      }

      await loadTemplates();
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await sequencesAPI.deleteTemplate(templateId);
      await loadTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const exportTemplate = (template: SequenceTemplate) => {
    const data = {
      template,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence_template_${template.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'Blank': return 'default';
      case 'Std': return 'primary';
      case 'Sample': return 'success';
      case 'QC': return 'warning';
      default: return 'default';
    }
  };

  const clearForm = () => {
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateNotes('');
    setSelectedInstrumentId('');
    setItems([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sequence Builder
      </Typography>

      {/* Template Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Template Management" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <FormControl fullWidth>
                <InputLabel>Load Existing Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) {
                      loadTemplate(template.id!);
                    } else {
                      clearForm();
                    }
                  }}
                  label="Load Existing Template"
                >
                  <MenuItem value="">
                    <em>Create New Template</em>
                  </MenuItem>
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.items.length} items)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearForm}
              >
                New Template
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Template Builder */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Build Sequence Template" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Benzene Calibration Sequence"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Instrument ID (Optional)"
                type="number"
                value={selectedInstrumentId}
                onChange={(e) => setSelectedInstrumentId(e.target.value ? Number(e.target.value) : '')}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={templateNotes}
            onChange={(e) => setTemplateNotes(e.target.value)}
            sx={{ mt: 2 }}
          />

          {/* Sequence Items */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sequence Items</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                size="small"
              >
                Add Item
              </Button>
            </Box>

            {items.length === 0 ? (
              <Alert severity="info">No sequence items added yet. Click "Add Item" to start building your sequence.</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>Order</TableCell>
                      <TableCell width={100}>Type</TableCell>
                      <TableCell>Sample Name</TableCell>
                      <TableCell width={100}>Method ID</TableCell>
                      <TableCell width={120}>Expected Level</TableCell>
                      <TableCell width={100}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DragIcon fontSize="small" />
                            {index + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={item.type}
                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                          >
                            <MenuItem value="Blank">Blank</MenuItem>
                            <MenuItem value="Std">Standard</MenuItem>
                            <MenuItem value="Sample">Sample</MenuItem>
                            <MenuItem value="QC">QC</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={item.sample_name}
                            onChange={(e) => updateItem(index, 'sample_name', e.target.value)}
                            placeholder="e.g., Sample_001"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.method_id}
                            onChange={(e) => updateItem(index, 'method_id', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          {item.type === 'Std' && (
                            <TextField
                              size="small"
                              type="number"
                              value={item.expected_level || ''}
                              onChange={(e) => updateItem(index, 'expected_level', Number(e.target.value))}
                              placeholder="ppm"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUpIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === items.length - 1}
                            >
                              <ArrowDownIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeItem(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => setShowSaveDialog(true)}
              disabled={loading || items.length === 0 || !templateName.trim()}
            >
              {selectedTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Existing Templates */}
      <Card>
        <CardHeader title="Existing Templates" />
        <CardContent>
          {loading ? (
            <Alert severity="info">Loading templates...</Alert>
          ) : templates.length === 0 ? (
            <Alert severity="info">No templates found</Alert>
          ) : (
            <List>
              {templates.map((template) => (
                <React.Fragment key={template.id}>
                  <ListItem>
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {template.items.length} items • Created: {new Date(template.created_at).toLocaleDateString()}
                          </Typography>
                          {template.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {template.notes}
                            </Typography>
                          )}
                          <Box sx={{ mt: 1 }}>
                            {template.items.map((item, index) => (
                              <Chip
                                key={index}
                                label={`${index + 1}. ${item.type}: ${item.sample_name}`}
                                color={getItemTypeColor(item.type) as any}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => loadTemplate(template.id!)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          onClick={() => exportTemplate(template)}
                        >
                          Export
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => deleteTemplate(template.id!)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>
          {selectedTemplate ? 'Update Template' : 'Save Template'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {selectedTemplate ? 'update' : 'save'} the template "{templateName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will {selectedTemplate ? 'update' : 'create'} a sequence template with {items.length} items.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveTemplate}
            disabled={loading}
          >
            {selectedTemplate ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SequenceBuilder;

