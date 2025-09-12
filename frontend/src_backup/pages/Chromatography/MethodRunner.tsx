import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Save,
  Upload,
  Download,
  Science,
  Assessment
} from '@mui/icons-material';
import { ChromatogramViewer } from '../../components/Chromatography/ChromatogramViewer';
import { PeakTable } from '../../components/Chromatography/PeakTable';
import { chromatographyAPI, runsAPI } from '../../services/apiService';
import { parseChromatogramCSV, validateChromatogramCSV, downloadCSV } from '../../utils/csv';
import { parseJCAMP, validateJCAMP } from '../../utils/jcamp';
import { useMobile } from '../../hooks/useMobile';

interface Peak {
  id: string;
  rt: number;
  area: number;
  height: number;
  width: number;
  name?: string;
  snr?: number;
}

interface RunRecord {
  id?: number;
  sample_name: string;
  time: number[];
  signal: number[];
  peaks: Peak[];
  baseline?: number[];
  notes?: string;
  metadata?: any;
}

export const MethodRunner: React.FC = () => {
  const { isMobile } = useMobile();
  
  // State
  const [currentRun, setCurrentRun] = useState<RunRecord | null>(null);
  const [selectedPeakId, setSelectedPeakId] = useState<string | undefined>();
  const [showBaseline, setShowBaseline] = useState(false);
  const [showPeaks, setShowPeaks] = useState(true);
  const [showSNR, setShowSNR] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Method simulation state
  const [sampleName, setSampleName] = useState('Sample_001');
  const [methodId, setMethodId] = useState<number | undefined>();
  const [instrumentId, setInstrumentId] = useState<number | undefined>();
  const [includeNoise, setIncludeNoise] = useState(true);
  const [includeDrift, setIncludeDrift] = useState(false);
  
  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileType, setImportFileType] = useState<'csv' | 'jcamp'>('csv');
  
  // Recent runs
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);

  // Load recent runs on mount
  useEffect(() => {
    loadRecentRuns();
  }, []);

  const loadRecentRuns = async () => {
    try {
      const response = await runsAPI.listRuns({ limit: 10 });
      setRecentRuns(response.data);
    } catch (error) {
      console.error('Failed to load recent runs:', error);
    }
  };

  // Simulate chromatogram
  const handleSimulate = async () => {
    if (!sampleName.trim()) {
      setError('Please enter a sample name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await chromatographyAPI.simulateChromatogram({
        sample_name: sampleName,
        method_id: methodId,
        instrument_id: instrumentId,
        include_noise: includeNoise,
        include_drift: includeDrift,
        seed: Math.floor(Math.random() * 10000) // Random seed for variety
      });

      setCurrentRun(response.data.run_record);
      setSelectedPeakId(undefined);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to simulate chromatogram');
    } finally {
      setIsLoading(false);
    }
  };

  // Detect peaks
  const handleDetectPeaks = async () => {
    if (!currentRun) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await chromatographyAPI.detectPeaks({
        time: currentRun.time,
        signal: currentRun.signal,
        prominence_threshold: 3.0,
        min_distance: 0.1,
        noise_window: 50,
        baseline_method: 'rolling_min'
      });

      setCurrentRun(prev => prev ? {
        ...prev,
        peaks: response.data.peaks,
        baseline: response.data.baseline
      } : null);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to detect peaks');
    } finally {
      setIsLoading(false);
    }
  };

  // Save run
  const handleSaveRun = async () => {
    if (!currentRun) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await runsAPI.createRun({
        sample_name: currentRun.sample_name,
        time: currentRun.time,
        signal: currentRun.signal,
        peaks: currentRun.peaks,
        baseline: currentRun.baseline,
        notes: currentRun.notes,
        metadata: currentRun.metadata
      });

      setCurrentRun(prev => prev ? { ...prev, id: response.data.id } : null);
      await loadRecentRuns(); // Refresh recent runs
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save run');
    } finally {
      setIsLoading(false);
    }
  };

  // Load run
  const handleLoadRun = async (runId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await runsAPI.getRun(runId);
      setCurrentRun(response.data);
      setSelectedPeakId(undefined);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load run');
    } finally {
      setIsLoading(false);
    }
  };

  // Import file
  const handleImportFile = async () => {
    if (!importFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileContent = await importFile.text();
      let time: number[], signal: number[];

      if (importFileType === 'csv') {
        const validation = validateChromatogramCSV(fileContent);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        const data = parseChromatogramCSV(fileContent);
        time = data.time;
        signal = data.signal;
      } else {
        const validation = validateJCAMP(fileContent);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        const data = parseJCAMP(fileContent);
        time = data.time;
        signal = data.signal;
      }

      const runRecord: RunRecord = {
        sample_name: importFile.name.replace(/\.[^/.]+$/, ''),
        time,
        signal,
        peaks: [],
        metadata: {
          import_source: importFileType,
          original_filename: importFile.name
        }
      };

      setCurrentRun(runRecord);
      setSelectedPeakId(undefined);
      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      setError(error.message || 'Failed to import file');
    } finally {
      setIsLoading(false);
    }
  };

  // Export data
  const handleExport = useCallback((format: 'csv' | 'png') => {
    if (!currentRun) return;

    if (format === 'csv') {
      const csvContent = downloadCSV(
        currentRun.time.map((t, i) => `${t},${currentRun.signal[i]}`).join('\n'),
        `${currentRun.sample_name}.csv`
      );
    } else if (format === 'png') {
      // PNG export would be handled by the plot component
      console.log('PNG export requested');
    }
  }, [currentRun]);

  // Update peak
  const handlePeakUpdate = useCallback((peakId: string, updates: Partial<Peak>) => {
    if (!currentRun) return;

    setCurrentRun(prev => prev ? {
      ...prev,
      peaks: prev.peaks.map(p => 
        p.id === peakId ? { ...p, ...updates } : p
      )
    } : null);
  }, [currentRun]);

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Method Runner
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Simulate chromatograms, detect peaks, and manage run records
      </Typography>

      <Grid container spacing={3}>
        {/* Controls Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Method Controls
              </Typography>

              {/* Sample Name */}
              <TextField
                fullWidth
                label="Sample Name"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                margin="normal"
                size="small"
              />

              {/* Method ID */}
              <TextField
                fullWidth
                label="Method ID (optional)"
                type="number"
                value={methodId || ''}
                onChange={(e) => setMethodId(e.target.value ? parseInt(e.target.value) : undefined)}
                margin="normal"
                size="small"
              />

              {/* Instrument ID */}
              <TextField
                fullWidth
                label="Instrument ID (optional)"
                type="number"
                value={instrumentId || ''}
                onChange={(e) => setInstrumentId(e.target.value ? parseInt(e.target.value) : undefined)}
                margin="normal"
                size="small"
              />

              {/* Simulation Options */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Simulation Options
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleSimulate}
                    disabled={isLoading || !sampleName.trim()}
                    fullWidth
                  >
                    {isLoading ? <CircularProgress size={20} /> : 'Run Simulation'}
                  </Button>
                  
                  {currentRun && (
                    <Button
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={handleDetectPeaks}
                      disabled={isLoading}
                      fullWidth
                    >
                      Detect Peaks
                    </Button>
                  )}
                  
                  {currentRun && (
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      onClick={handleSaveRun}
                      disabled={isLoading}
                      fullWidth
                    >
                      Save Run
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Import/Export */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Data Management
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => setImportDialogOpen(true)}
                    size="small"
                    fullWidth
                  >
                    Import
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('csv')}
                    disabled={!currentRun}
                    size="small"
                    fullWidth
                  >
                    Export
                  </Button>
                </Box>
              </Box>

              {/* Recent Runs */}
              {recentRuns.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Runs
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {recentRuns.slice(0, 5).map((run) => (
                      <Button
                        key={run.id}
                        variant="text"
                        size="small"
                        onClick={() => handleLoadRun(run.id!)}
                        disabled={isLoading}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {run.sample_name} ({run.peaks.length} peaks)
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chromatogram Viewer */}
        <Grid item xs={12} md={8}>
          {currentRun ? (
            <ChromatogramViewer
              time={currentRun.time}
              signal={currentRun.signal}
              peaks={currentRun.peaks}
              baseline={currentRun.baseline}
              sampleName={currentRun.sample_name}
              selectedPeakId={selectedPeakId}
              onPeakSelect={(peak) => setSelectedPeakId(peak.id)}
              showBaseline={showBaseline}
              showPeaks={showPeaks}
              onBaselineToggle={setShowBaseline}
              onPeaksToggle={setShowPeaks}
              onExport={handleExport}
            />
          ) : (
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <Science sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Chromatogram Loaded
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Run a simulation or import data to get started
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Peak Table */}
        {currentRun && currentRun.peaks.length > 0 && (
          <Grid item xs={12}>
            <PeakTable
              peaks={currentRun.peaks}
              selectedPeakId={selectedPeakId}
              onPeakSelect={(peak) => setSelectedPeakId(peak.id)}
              onPeakUpdate={handlePeakUpdate}
              showSNR={showSNR}
              onSNRToggle={setShowSNR}
            />
          </Grid>
        )}
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Chromatogram</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ minWidth: 400 }}>
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={importFileType}
                onChange={(e) => setImportFileType(e.target.value as 'csv' | 'jcamp')}
                label="File Type"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="jcamp">JCAMP-DX</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Choose File
              <input
                type="file"
                hidden
                accept={importFileType === 'csv' ? '.csv' : '.jdx,.dx'}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </Button>
            
            {importFile && (
              <Typography variant="body2" color="text.secondary">
                Selected: {importFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleImportFile}
            disabled={!importFile || isLoading}
            variant="contained"
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
