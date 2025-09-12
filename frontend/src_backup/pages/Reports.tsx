import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  GridOn as ExcelIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

interface ReportRequest {
  type: string;
  format: string;
  filters?: Record<string, any>;
}

interface ReportPreset {
  id: string;
  name: string;
  description: string;
  type: string;
  format: string;
  icon: React.ReactNode;
  color: string;
}

export const Reports: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedType, setSelectedType] = useState('inventory');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const reportTypes = [
    { value: 'inventory', label: 'Consumable Inventory' },
    { value: 'fleet', label: 'Fleet Management' },
    { value: 'methods', label: 'Methods & Templates' },
    { value: 'runs', label: 'Run Records' },
    { value: 'summary', label: 'System Summary' }
  ];

  const reportFormats = [
    { value: 'pdf', label: 'PDF', icon: <PdfIcon /> },
    { value: 'csv', label: 'CSV', icon: <CsvIcon /> },
    { value: 'xlsx', label: 'Excel', icon: <ExcelIcon /> }
  ];

  const reportPresets: ReportPreset[] = [
    {
      id: 'low-stock',
      name: 'Low Stock Inventory',
      description: 'Items below reorder threshold',
      type: 'inventory',
      format: 'pdf',
      icon: <WarningIcon />,
      color: '#dc2626'
    },
    {
      id: 'fleet-summary',
      name: 'Fleet Summary',
      description: 'Instrument status and maintenance',
      type: 'fleet',
      format: 'xlsx',
      icon: <AssessmentIcon />,
      color: '#059669'
    },
    {
      id: 'method-performance',
      name: 'Method Performance',
      description: 'Recent method analysis results',
      type: 'methods',
      format: 'pdf',
      icon: <TrendingIcon />,
      color: '#7c3aed'
    },
    {
      id: 'cost-analysis',
      name: 'Cost Analysis',
      description: 'Consumable and operational costs',
      type: 'summary',
      format: 'xlsx',
      icon: <AssessmentIcon />,
      color: '#ea580c'
    }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError('');
    setGenerationStatus('Preparing report...');

    try {
      const request: ReportRequest = {
        type: selectedType,
        format: selectedFormat,
        filters: {}
      };

      setGenerationStatus('Generating report...');
      
      const response = await apiService.post('/v1/reports/generate', request, {
        responseType: 'blob'
      });

      setGenerationStatus('Downloading...');

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intellilab-${selectedType}-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setGenerationStatus('Report generated successfully!');
      setTimeout(() => setGenerationStatus(''), 3000);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePresetClick = async (preset: ReportPreset) => {
    setSelectedType(preset.type);
    setSelectedFormat(preset.format);
    
    // Auto-generate the preset report
    setIsGenerating(true);
    setError('');
    setGenerationStatus(`Generating ${preset.name}...`);

    try {
      const request: ReportRequest = {
        type: preset.type,
        format: preset.format,
        filters: {}
      };

      const response = await apiService.post('/v1/reports/generate', request, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intellilab-${preset.id}-${new Date().toISOString().split('T')[0]}.${preset.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setGenerationStatus(`${preset.name} generated successfully!`);
      setTimeout(() => setGenerationStatus(''), 3000);
    } catch (error) {
      console.error('Failed to generate preset report:', error);
      setError(`Failed to generate ${preset.name}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate comprehensive reports for inventory, fleet management, and system analytics
        </Typography>
      </Box>

      {/* Status Messages */}
      {generationStatus && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            isGenerating && <CircularProgress size={20} />
          }
        >
          {generationStatus}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Presets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pre-configured reports for common use cases
              </Typography>
              
              <Grid container spacing={2}>
                {reportPresets.map((preset) => (
                  <Grid item xs={12} sm={6} key={preset.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                          borderLeft: `4px solid ${preset.color}`
                        }
                      }}
                      onClick={() => handlePresetClick(preset)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ color: preset.color, mr: 1 }}>
                            {preset.icon}
                          </Box>
                          <Typography variant="subtitle2">
                            {preset.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {preset.description}
                        </Typography>
                        <Chip
                          label={preset.format.toUpperCase()}
                          size="small"
                          sx={{ mt: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Report Generator */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Custom Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate custom reports with specific parameters
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={selectedType}
                      label="Report Type"
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {reportTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={selectedFormat}
                      label="Format"
                      onChange={(e) => setSelectedFormat(e.target.value)}
                    >
                      {reportFormats.map((format) => (
                        <MenuItem key={format.value} value={format.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {format.icon}
                            <Box sx={{ ml: 1 }}>{format.label}</Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    sx={{ py: 1.5 }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Reports */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Low Stock Inventory Report"
                  secondary="Generated 2 hours ago • PDF • 1.2 MB"
                />
                <Chip label="PDF" size="small" color="primary" variant="outlined" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Fleet Summary Report"
                  secondary="Generated 1 day ago • Excel • 856 KB"
                />
                <Chip label="XLSX" size="small" color="success" variant="outlined" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Method Performance Analysis"
                  secondary="Generated 3 days ago • PDF • 2.1 MB"
                />
                <Chip label="PDF" size="small" color="primary" variant="outlined" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Reports;
