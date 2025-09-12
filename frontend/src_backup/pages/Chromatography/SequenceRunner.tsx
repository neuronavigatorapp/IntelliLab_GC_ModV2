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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { sequencesAPI, qcAPI, esignAPI } from '../../services/apiService';
import RequireRole from '../../components/Common/RequireRole';
import { SequenceTemplate, SequenceRun, SequenceRunRequest } from '../../types/chromatography';
import { QCRecord, QC_STATUS_COLORS, WESTGARD_RULES } from '../../types/qc';
import { ChromatogramViewer } from '../../components/Chromatography/ChromatogramViewer';

interface SequenceRunnerProps {
  templateId?: string;
}

const SequenceRunner: React.FC<SequenceRunnerProps> = ({ templateId }) => {
  const [templates, setTemplates] = useState<SequenceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SequenceTemplate | null>(null);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | ''>('');
  const [simulate, setSimulate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<SequenceRun | null>(null);
  const [sequenceRuns, setSequenceRuns] = useState<SequenceRun[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);

  // Load templates and runs on mount
  useEffect(() => {
    loadTemplates();
    loadSequenceRuns();
    loadQcRecords();
  }, []);

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplates = async () => {
    try {
      const response = await sequencesAPI.listTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const response = await sequencesAPI.getTemplate(id);
      const template = response.data;
      setSelectedTemplate(template);
      setSelectedInstrumentId(template.instrument_id || '');
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const loadSequenceRuns = async () => {
    try {
      const response = await sequencesAPI.listSequenceRuns();
      setSequenceRuns(response.data.runs);
    } catch (error) {
      console.error('Failed to load sequence runs:', error);
      toast.error('Failed to load sequence runs');
    }
  };

  const loadQcRecords = async () => {
    try {
      const response = await qcAPI.getRecords({ limit: 100 });
      setQcRecords(response.data);
    } catch (error) {
      console.error('Failed to load QC records:', error);
    }
  };

  const getQcStatusForItem = (item: any, runId?: number): { status: string; ruleHits: string[] } => {
    if (item.type !== 'QC' || !runId) {
      return { status: 'N/A', ruleHits: [] };
    }

    // Find QC record for this run
    const qcRecord = qcRecords.find(record => 
      record.runId === runId.toString() && 
      record.results.some(result => 
        result.analyte.toLowerCase().includes(item.sample_name.toLowerCase()) ||
        item.sample_name.toLowerCase().includes(result.analyte.toLowerCase())
      )
    );

    if (!qcRecord) {
      return { status: 'PENDING', ruleHits: [] };
    }

    const ruleHits = qcRecord.ruleHits.map(hit => hit.rule);
    return { 
      status: qcRecord.overallStatus, 
      ruleHits: Array.from(new Set(ruleHits)) // Remove duplicates
    };
  };

  const runSequence = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    if (!selectedInstrumentId) {
      toast.error('Please select an instrument');
      return;
    }

    try {
      setLoading(true);
      setRunning(true);
      
      const request: SequenceRunRequest = {
        template_id: selectedTemplate.id,
        instrument_id: Number(selectedInstrumentId),
        simulate: simulate
      };

      const response = await sequencesAPI.runSequence(request);
      const sequenceRun = response.data;
      setCurrentRun(sequenceRun);
      setShowResults(true);
      
      // Reload sequence runs
      await loadSequenceRuns();
      
      toast.success('Sequence completed successfully');
    } catch (error) {
      console.error('Sequence run failed:', error);
      toast.error('Sequence run failed');
    } finally {
      setLoading(false);
      setRunning(false);
    }
  };

  const exportResults = (sequenceRun: SequenceRun) => {
    const data = {
      sequence_run: sequenceRun,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence_run_${sequenceRun.id}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signSequenceRun = async (sequenceRun: SequenceRun) => {
    if (!sequenceRun.id) return;
    try {
      await esignAPI.create({
        objectType: 'sequence',
        objectId: sequenceRun.id,
        reason: 'Approve sequence run',
        objectData: sequenceRun,
      });
      toast.success('Sequence run signed');
    } catch (e) {
      toast.error('Failed to sign sequence run');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'error': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'running': return <PauseIcon />;
      case 'error': return <ErrorIcon />;
      case 'draft': return <RefreshIcon />;
      default: return <RefreshIcon />;
    }
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sequence Runner
      </Typography>

      {/* Template and Instrument Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Sequence Configuration" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) {
                      loadTemplate(template.id!);
                    } else {
                      setSelectedTemplate(null);
                    }
                  }}
                  label="Select Template"
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.items.length} items)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Instrument ID"
                type="number"
                value={selectedInstrumentId}
                onChange={(e) => setSelectedInstrumentId(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select
                  value={simulate.toString()}
                  onChange={(e) => setSimulate(e.target.value === 'true')}
                  label="Mode"
                >
                  <MenuItem value="true">Simulate</MenuItem>
                  <MenuItem value="false">Import</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {selectedTemplate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Template: {selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedTemplate.notes}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {selectedTemplate.items.map((item, index) => (
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
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={runSequence}
              disabled={loading || !selectedTemplate || !selectedInstrumentId}
            >
              {running ? 'Running...' : 'Run Sequence'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Current Run Progress */}
      {running && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Sequence Progress" />
          <CardContent>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Running sequence with {selectedTemplate?.items.length} items...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Sequence Runs History */}
      <Card>
        <CardHeader title="Sequence Runs History" />
        <CardContent>
          {sequenceRuns.length === 0 ? (
            <Alert severity="info">No sequence runs found</Alert>
          ) : (
            <List>
              {sequenceRuns.map((sequenceRun) => (
                <React.Fragment key={sequenceRun.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip
                        icon={getStatusIcon(sequenceRun.status)}
                        label={sequenceRun.status}
                        color={getStatusColor(sequenceRun.status) as any}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Sequence Run ${sequenceRun.id}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Created: {new Date(sequenceRun.created_at).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Items: {sequenceRun.items.length} • Runs: {sequenceRun.runs.length} • Quant: {sequenceRun.quant.length}
                          </Typography>
                          {sequenceRun.notes && (
                            <Typography variant="body2" color="text.secondary">
                              {sequenceRun.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => {
                          setCurrentRun(sequenceRun);
                          setShowResults(true);
                        }}
                      >
                        View Results
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => exportResults(sequenceRun)}
                      >
                        Export
                      </Button>
                      <RequireRole role={['admin','qc','analyst']} userRole={'analyst'}>
                        <Button size="small" onClick={() => signSequenceRun(sequenceRun)}>
                          Sign
                        </Button>
                      </RequireRole>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Sequence Results
          {currentRun && (
            <Typography variant="body2" color="text.secondary">
              Run ID: {currentRun.id} • Status: {currentRun.status}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {currentRun && (
            <Box>
              {/* Sequence Summary */}
              <Card sx={{ mb: 2 }}>
                <CardHeader title="Sequence Summary" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        <strong>Total Items:</strong> {currentRun.items.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        <strong>Completed Runs:</strong> {currentRun.runs.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        <strong>Quantitated:</strong> {currentRun.quant.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        <strong>Status:</strong> {currentRun.status}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Individual Runs */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Individual Runs ({currentRun.runs.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Sample Name</TableCell>
                          <TableCell>Method ID</TableCell>
                          <TableCell>Expected Level</TableCell>
                          <TableCell>Run ID</TableCell>
                          <TableCell>QC Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentRun.items.map((item, index) => {
                          const run = currentRun.runs[index];
                          return (
                            <TableRow key={index}>
                              <TableCell>{item.order}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.type}
                                  color={getItemTypeColor(item.type) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{item.sample_name}</TableCell>
                              <TableCell>{item.method_id}</TableCell>
                              <TableCell>{item.expected_level || 'N/A'}</TableCell>
                              <TableCell>
                                {run ? (
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Run ${run.id}`}
                                    color="success"
                                    size="small"
                                  />
                                ) : (
                                  <Chip
                                    icon={<ErrorIcon />}
                                    label="Failed"
                                    color="error"
                                    size="small"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const qcStatus = getQcStatusForItem(item, run?.id);
                                  if (qcStatus.status === 'N/A') {
                                    return <span style={{ color: '#666' }}>N/A</span>;
                                  }
                                  
                                  const statusColor = qcStatus.status === 'PASS' ? 'success' : 
                                                     qcStatus.status === 'WARN' ? 'warning' : 
                                                     qcStatus.status === 'FAIL' ? 'error' : 'default';
                                  
                                  return (
                                    <Box>
                                      <Chip
                                        label={qcStatus.status}
                                        color={statusColor as any}
                                        size="small"
                                        sx={{ mb: qcStatus.ruleHits.length > 0 ? 0.5 : 0 }}
                                      />
                                      {qcStatus.ruleHits.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {qcStatus.ruleHits.map(rule => {
                                            const ruleInfo = WESTGARD_RULES.find(r => r.id === rule);
                                            return (
                                              <Chip
                                                key={rule}
                                                label={rule}
                                                size="small"
                                                sx={{ 
                                                  fontSize: '0.65rem',
                                                  height: 18,
                                                  backgroundColor: ruleInfo?.color + '20',
                                                  color: ruleInfo?.color,
                                                  border: `1px solid ${ruleInfo?.color}50`
                                                }}
                                              />
                                            );
                                          })}
                                        </Box>
                                      )}
                                    </Box>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Quantitation Results */}
              {currentRun.quant.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Quantitation Results ({currentRun.quant.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {currentRun.quant.map((quantResult, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardHeader title={`Sample: ${quantResult.sample_name}`} />
                        <CardContent>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Target</TableCell>
                                  <TableCell>RT (min)</TableCell>
                                  <TableCell>Area</TableCell>
                                  <TableCell>Concentration</TableCell>
                                  <TableCell>Unit</TableCell>
                                  <TableCell>Flags</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {quantResult.results.map((result, resultIndex) => (
                                  <TableRow key={resultIndex}>
                                    <TableCell>{result.targetName}</TableCell>
                                    <TableCell>{result.rt?.toFixed(3) || 'N/A'}</TableCell>
                                    <TableCell>{result.area.toFixed(2)}</TableCell>
                                    <TableCell>{result.concentration.toFixed(4)}</TableCell>
                                    <TableCell>{result.unit}</TableCell>
                                    <TableCell>
                                      {result.flags && result.flags.length > 0 ? (
                                        <Chip
                                          label={result.flags.join(', ')}
                                          color="warning"
                                          size="small"
                                        />
                                      ) : (
                                        <Chip
                                          label="OK"
                                          color="success"
                                          size="small"
                                        />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Chromatogram Viewer */}
              {currentRun.runs.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Chromatograms</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {currentRun.runs.map((run, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardHeader title={`${currentRun.items[index]?.sample_name} (Run ${run.id})`} />
                        <CardContent>
                          <Box sx={{ height: 300 }}>
                            <ChromatogramViewer
                              time={run.time}
                              signal={run.signal}
                              peaks={run.peaks as any}
                              baseline={run.baseline}
                              sampleName={run.sample_name}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          {currentRun && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportResults(currentRun)}
            >
              Export Results
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SequenceRunner;

