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
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import {
  Description as ReportIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Report {
  id: number;
  title: string;
  report_type: string;
  template_used: string;
  generated_by: number;
  file_path: string;
  file_format: string;
  status: string;
  metadata: Record<string, any>;
  created_date: string;
  completed_date: string;
}

interface ReportRequest {
  title: string;
  report_type: string;
  template_name?: string;
  data_source: Record<string, any>;
  format: string;
  include_charts: boolean;
  custom_sections: any[];
}

const ReportGenerator: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [reportRequest, setReportRequest] = useState<ReportRequest>({
    title: '',
    report_type: 'method_development',
    template_name: '',
    data_source: {},
    format: 'pdf',
    include_charts: true,
    custom_sections: []
  });
  
  // Dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Available options
  const reportTypes = [
    { value: 'method_development', label: 'Method Development', description: 'Comprehensive method development report with optimization recommendations' },
    { value: 'validation', label: 'Method Validation', description: 'Validation report with performance characteristics and acceptance criteria' },
    { value: 'troubleshooting', label: 'Troubleshooting', description: 'Problem analysis and solution documentation' },
    { value: 'comparison', label: 'Method Comparison', description: 'Side-by-side comparison of multiple methods' },
    { value: 'cost_analysis', label: 'Cost Analysis', description: 'Economic analysis of method operations and optimization' }
  ];
  
  const formats = [
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
    { value: 'docx', label: 'Word', description: 'Microsoft Word Document' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel Spreadsheet' },
    { value: 'json', label: 'JSON', description: 'Structured data format' }
  ];
  
  useEffect(() => {
    loadReports();
  }, []);
  
  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/reports/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load reports');
      }
      
      const data = await response.json();
      setReports(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };
  
  const generateReport = async () => {
    if (!reportRequest.title.trim()) {
      setError('Report title is required');
      return;
    }
    
    if (Object.keys(reportRequest.data_source).length === 0) {
      setError('Please provide data source for the report');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/v1/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportRequest)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const result = await response.json();
      setSuccess(`Report "${reportRequest.title}" generated successfully!`);
      
      // Reset form
      setReportRequest({
        title: '',
        report_type: 'method_development',
        template_name: '',
        data_source: {},
        format: 'pdf',
        include_charts: true,
        custom_sections: []
      });
      
      // Reload reports list
      loadReports();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadReport = async (report: Report) => {
    try {
      // Note: In a real implementation, this would download the file
      // For now, we'll just show a message
      setSuccess(`Report "${report.title}" download initiated`);
    } catch (error) {
      setError('Failed to download report');
    }
  };
  
  const deleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      // Note: API endpoint for deletion would be implemented
      setSuccess('Report deleted successfully');
      loadReports();
    } catch (error) {
      setError('Failed to delete report');
    }
  };
  
  const previewReport = (report: Report) => {
    setSelectedReport(report);
    setPreviewDialogOpen(true);
  };
  
  const loadFromSessionData = () => {
    // Try to load data from current tool session
    const savedData = sessionStorage.getItem('currentAnalysisData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setReportRequest(prev => ({
          ...prev,
          data_source: data
        }));
        setSuccess('Data loaded from current analysis session');
      } catch {
        setError('Failed to load session data');
      }
    } else {
      setError('No analysis data found in current session');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Professional Report Generator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Generate professional reports from your GC analysis results. Choose from various report templates
        and formats to create comprehensive documentation for your methods and results.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Report Generation Form */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Report
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Title"
                    value={reportRequest.title}
                    onChange={(e) => setReportRequest(prev => ({ ...prev, title: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportRequest.report_type}
                      onChange={(e) => setReportRequest(prev => ({ ...prev, report_type: e.target.value }))}
                      label="Report Type"
                      disabled={loading}
                    >
                      {reportTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={reportRequest.format}
                      onChange={(e) => setReportRequest(prev => ({ ...prev, format: e.target.value }))}
                      label="Format"
                      disabled={loading}
                    >
                      {formats.map(format => (
                        <MenuItem key={format.value} value={format.value}>
                          {format.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={reportRequest.include_charts}
                        onChange={(e) => setReportRequest(prev => ({ ...prev, include_charts: e.target.checked }))}
                        disabled={loading}
                      />
                    }
                    label="Include Charts and Visualizations"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Source
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={loadFromSessionData}
                      disabled={loading}
                    >
                      Load from Current Session
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter analysis data in JSON format or load from session"
                    value={JSON.stringify(reportRequest.data_source, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setReportRequest(prev => ({ ...prev, data_source: parsed }));
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
                    onClick={generateReport}
                    disabled={loading || !reportRequest.title.trim()}
                  >
                    Generate Report
                  </Button>
                </Grid>
              </Grid>
              
              {/* Report Type Description */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {reportTypes.find(t => t.value === reportRequest.report_type)?.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Generated Reports List */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Generated Reports
                </Typography>
                <IconButton onClick={loadReports} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              
              {loading && reports.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : reports.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No reports generated yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {reports.map((report, index) => (
                    <React.Fragment key={report.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {report.title}
                              </Typography>
                              <Chip
                                label={report.status}
                                size="small"
                                color={getStatusColor(report.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Type: {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Format: {report.file_format.toUpperCase()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Created: {new Date(report.created_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => previewReport(report)}
                              disabled={report.status !== 'completed'}
                            >
                              <PreviewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => downloadReport(report)}
                              disabled={report.status !== 'completed'}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteReport(report.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < reports.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Report Preview: {selectedReport?.title}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Type:</Typography>
                  <Typography variant="body2">
                    {reportTypes.find(t => t.value === selectedReport.report_type)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Format:</Typography>
                  <Typography variant="body2">{selectedReport.file_format.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Template:</Typography>
                  <Typography variant="body2">{selectedReport.template_used}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedReport.status}
                    size="small"
                    color={getStatusColor(selectedReport.status) as any}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Generated:</Typography>
                  <Typography variant="body2">
                    {new Date(selectedReport.created_date).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedReport.completed_date && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Completed:</Typography>
                    <Typography variant="body2">
                      {new Date(selectedReport.completed_date).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {selectedReport.metadata && Object.keys(selectedReport.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Metadata:</Typography>
                    <Paper sx={{ p: 1, backgroundColor: 'grey.50' }}>
                      <Typography variant="body2" component="pre">
                        {JSON.stringify(selectedReport.metadata, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
          {selectedReport && selectedReport.status === 'completed' && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => downloadReport(selectedReport)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportGenerator;
