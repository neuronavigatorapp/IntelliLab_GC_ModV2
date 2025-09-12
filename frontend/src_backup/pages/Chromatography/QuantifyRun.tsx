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
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { quantAPI, calibrationAPI, runsAPI } from '../../services/apiService';
import { QuantRequest, QuantResult, CalibrationModel, RunRecord } from '../../types/chromatography';
import { ChromatogramViewer } from '../../components/Chromatography/ChromatogramViewer';

interface QuantifyRunProps {
  runId?: number;
}

const QuantifyRun: React.FC<QuantifyRunProps> = ({ runId }) => {
  const [selectedRunId, setSelectedRunId] = useState<number | ''>(runId || '');
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationModel[]>([]);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [quantResult, setQuantResult] = useState<QuantResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);

  // Load runs and calibrations on mount
  useEffect(() => {
    loadRuns();
    loadCalibrations();
  }, []);

  const loadRuns = async () => {
    try {
      const response = await runsAPI.listRuns();
      setRuns(response.data);
    } catch (error) {
      console.error('Failed to load runs:', error);
      toast.error('Failed to load runs');
    }
  };

  const loadCalibrations = async () => {
    try {
      const response = await calibrationAPI.listCalibrations();
      setCalibrations(response.data.calibrations);
      
      // Auto-select active calibration if available
      if (response.data.active_calibration_id) {
        setSelectedCalibrationId(response.data.active_calibration_id);
      }
    } catch (error) {
      console.error('Failed to load calibrations:', error);
      toast.error('Failed to load calibrations');
    }
  };

  const quantitateRun = async () => {
    if (!selectedRunId) {
      toast.error('Please select a run');
      return;
    }

    if (!selectedCalibrationId) {
      toast.error('Please select a calibration');
      return;
    }

    try {
      setLoading(true);
      const request: QuantRequest = {
        run_id: selectedRunId,
        calibration_id: selectedCalibrationId
      };

      const response = await quantAPI.quantitateRun(request);
      setQuantResult(response.data);
      setShowResults(true);
      toast.success('Quantitation completed');
    } catch (error) {
      console.error('Quantitation failed:', error);
      toast.error('Quantitation failed');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!quantResult) return;

    const data = {
      quantitation_results: quantResult,
      exportDate: new Date().toISOString(),
      runId: selectedRunId,
      calibrationId: selectedCalibrationId
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantitation_${quantResult.sample_name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFlagColor = (flags: string[]) => {
    if (flags.includes('<LOD')) return 'error';
    if (flags.includes('<LOQ')) return 'warning';
    if (flags.includes('OOR')) return 'error';
    if (flags.includes('NoPeak')) return 'error';
    if (flags.includes('NoISPeak')) return 'error';
    return 'success';
  };

  const getFlagIcon = (flags: string[]) => {
    if (flags.includes('<LOD') || flags.includes('OOR') || flags.includes('NoPeak') || flags.includes('NoISPeak')) {
      return <ErrorIcon />;
    }
    if (flags.includes('<LOQ')) {
      return <WarningIcon />;
    }
    return <CheckCircleIcon />;
  };

  const handleRunSelect = (runId: number) => {
    setSelectedRunId(runId);
    const run = runs.find(r => r.id === runId);
    setSelectedRun(run || null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quantify Run
      </Typography>

      {/* Run and Calibration Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Select Run and Calibration" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Select Run</InputLabel>
                <Select
                  value={selectedRunId}
                  onChange={(e) => handleRunSelect(e.target.value as number)}
                  label="Select Run"
                >
                  {runs.map((run) => (
                    <MenuItem key={run.id} value={run.id}>
                      {run.sample_name} (ID: {run.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Select Calibration</InputLabel>
                <Select
                  value={selectedCalibrationId}
                  onChange={(e) => setSelectedCalibrationId(e.target.value)}
                  label="Select Calibration"
                >
                  {calibrations.map((calibration) => (
                    <MenuItem key={calibration.id} value={calibration.id}>
                      {calibration.target_name} ({calibration.model_type})
                      {calibration.active && ' - Active'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={quantitateRun}
              disabled={loading || !selectedRunId || !selectedCalibrationId}
            >
              Quantitate Run
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Selected Run Chromatogram */}
      {selectedRun && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Selected Run Chromatogram" />
          <CardContent>
            <Box sx={{ height: 400 }}>
              <ChromatogramViewer
                time={selectedRun.time}
                signal={selectedRun.signal}
                peaks={selectedRun.peaks as any}
                baseline={selectedRun.baseline}
                sampleName={selectedRun.sample_name}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quantitation Results */}
      {quantResult && (
        <Card>
          <CardHeader 
            title="Quantitation Results" 
            action={
              <Button
                startIcon={<DownloadIcon />}
                onClick={exportResults}
                variant="outlined"
              >
                Export Results
              </Button>
            }
          />
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sample: {quantResult.sample_name}
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Target</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>RT (min)</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>IS Area</TableCell>
                    <TableCell>Response/RF</TableCell>
                    <TableCell>Concentration</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>SNR</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quantResult.results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.targetName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={(result as any).mode === 'internal_standard' ? 'IS' : 'Ext'} 
                          color={(result as any).mode === 'internal_standard' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{result.rt?.toFixed(3) || 'N/A'}</TableCell>
                      <TableCell>{result.area?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        {(result as any).mode === 'internal_standard' ? 
                          ((result as any).is_area?.toFixed(2) || 'N/A') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {(result as any).mode === 'internal_standard' ? 
                          ((result as any).response_factor?.toFixed(6) || 'N/A') :
                          (result.response?.toFixed(2) || 'N/A')
                        }
                      </TableCell>
                      <TableCell>{result.concentration?.toFixed(4) || 'N/A'}</TableCell>
                      <TableCell>{result.unit}</TableCell>
                      <TableCell>{result.snr?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        {result.flags && result.flags.length > 0 ? (
                          <Chip
                            icon={getFlagIcon(result.flags)}
                            label={result.flags.join(', ')}
                            color={getFlagColor(result.flags) as any}
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircleIcon />}
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

            {/* Summary Statistics */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Total Targets:</strong> {quantResult.results.length}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Detected:</strong> {quantResult.results.filter(r => !r.flags?.includes('NoPeak')).length}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Below LOD:</strong> {quantResult.results.filter(r => r.flags?.includes('<LOD')).length}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Below LOQ:</strong> {quantResult.results.filter(r => r.flags?.includes('<LOQ')).length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Results Dialog */}
      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Quantitation Results</DialogTitle>
        <DialogContent>
          {quantResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Results for {quantResult.sample_name}
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Target</TableCell>
                      <TableCell>Concentration</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Flags</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quantResult.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.targetName}</TableCell>
                        <TableCell>{result.concentration.toFixed(4)}</TableCell>
                        <TableCell>{result.unit}</TableCell>
                        <TableCell>
                          {result.flags && result.flags.length > 0 ? (
                            <Chip
                              icon={getFlagIcon(result.flags)}
                              label={result.flags.join(', ')}
                              color={getFlagColor(result.flags) as any}
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon />}
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportResults}
          >
            Export Results
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuantifyRun;

