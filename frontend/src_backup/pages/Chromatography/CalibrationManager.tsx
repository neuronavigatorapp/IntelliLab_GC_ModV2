import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, CardHeader, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Grid, Alert, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, Divider, Switch, FormControlLabel, Tooltip, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, PlayArrow as PlayIcon,
  CheckCircle as CheckCircleIcon, Warning as WarningIcon, ExpandMore as ExpandMoreIcon,
  GetApp as ExportIcon, Visibility as ViewIcon, Assessment as AssessmentIcon,
  Timeline as TimelineIcon, ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

import { calibrationAPI, esignAPI } from '../../services/apiService';
import RequireRole from '../../components/Common/RequireRole';

interface CalibrationLevel {
  level_id?: string;
  target_name: string;
  amount: number;
  unit: string;
  peak_name?: string;
  area?: number;
  is_area?: number;  // Internal standard area
  rt?: number;
  included?: boolean;
  outlier_reason?: string;
}

interface InternalStandard {
  peak_name: string;
  amount: number;
  unit: string;
}

interface CalibrationModel {
  id?: string;
  version_id?: string;
  method_id: number;
  instrument_id?: number;
  target_name: string;
  model_type: string;
  mode: 'external' | 'internal_standard';
  internal_standard?: InternalStandard;
  outlier_policy: 'none' | 'grubbs' | 'iqr';
  levels: CalibrationLevel[];
  slope?: number;
  intercept?: number;
  r2?: number;
  residuals?: number[];
  excluded_points?: number[];
  lod?: number;
  loq?: number;
  lod_method?: string;
  notes?: string;
  active: boolean;
  created_at?: string;
}

interface CalibrationManagerProps {
  methodId?: number;
  instrumentId?: number;
}

const CalibrationManager: React.FC<CalibrationManagerProps> = ({ methodId = 1, instrumentId }) => {
  const [calibrations, setCalibrations] = useState<CalibrationModel[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeCalibration, setActiveCalibration] = useState<CalibrationModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(methodId);
  const [selectedInstrument, setSelectedInstrument] = useState(instrumentId);
  
  // Enhanced calibration building state
  const [targetName, setTargetName] = useState('');
  const [calibrationMode, setCalibrationMode] = useState<'external' | 'internal_standard'>('external');
  const [modelType, setModelType] = useState<'linear' | 'linear_through_zero' | 'weighted_1/x' | 'weighted_1/x2'>('linear');
  const [outlierPolicy, setOutlierPolicy] = useState<'none' | 'grubbs' | 'iqr'>('none');
  const [internalStandard, setInternalStandard] = useState<InternalStandard>({
    peak_name: '',
    amount: 10.0,
    unit: 'ppm'
  });
  const [levels, setLevels] = useState<CalibrationLevel[]>([]);
  const [notes, setNotes] = useState('');
  
  // Dialog states
  const [showFitDialog, setShowFitDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [fitResult, setFitResult] = useState<CalibrationModel | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [residualsData, setResidualsData] = useState<any>(null);

  useEffect(() => {
    loadCalibrations();
    loadVersions();
  }, [selectedMethod, selectedInstrument]);

  const loadCalibrations = async () => {
    try {
      setLoading(true);
      const response = await calibrationAPI.listCalibrations(selectedMethod, selectedInstrument);
      setCalibrations(response.data.calibrations);
      
      if (response.data.active_calibration_id) {
        const active = response.data.calibrations.find((c: any) => c.id === response.data.active_calibration_id);
        setActiveCalibration(active || null);
      }
    } catch (error) {
      console.error('Failed to load calibrations:', error);
      toast.error('Failed to load calibrations');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await calibrationAPI.listVersions(selectedMethod, selectedInstrument);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const addLevel = () => {
    const newLevel: CalibrationLevel = {
      level_id: `level_${levels.length + 1}`,
      target_name: targetName,
      amount: 0,
      unit: 'ppm',
      peak_name: '',
      area: 0,
      is_area: calibrationMode === 'internal_standard' ? 5000 : undefined,
      rt: 0,
      included: true
    };
    setLevels([...levels, newLevel]);
  };

  const updateLevel = (index: number, field: keyof CalibrationLevel, value: any) => {
    const updatedLevels = [...levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setLevels(updatedLevels);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const fitCalibration = async () => {
    if (levels.length < 2) {
      toast.error('Need at least 2 calibration levels');
      return;
    }

    if (!targetName) {
      toast.error('Please enter a target name');
      return;
    }

    if (calibrationMode === 'internal_standard' && !internalStandard.peak_name) {
      toast.error('Please configure internal standard');
      return;
    }

    try {
      setLoading(true);
      const request = {
        method_id: selectedMethod,
        instrument_id: selectedInstrument,
        target_name: targetName,
        model_type: modelType,
        mode: calibrationMode,
        internal_standard: calibrationMode === 'internal_standard' ? internalStandard : undefined,
        outlier_policy: outlierPolicy,
        levels: levels.map(level => ({
          ...level,
          target_name: targetName
        }))
      };

      const response = await calibrationAPI.fitCalibration(request);
      setFitResult(response.data);
      
      // Load residuals data
      if (response.data.id) {
        try {
          const residualsResponse = await calibrationAPI.getResiduals(response.data.id);
          setResidualsData(residualsResponse.data);
        } catch (error) {
          console.error('Failed to load residuals:', error);
        }
      }
      
      setShowFitDialog(true);
      toast.success('Calibration fitted successfully');
    } catch (error) {
      console.error('Calibration fitting failed:', error);
      toast.error('Calibration fitting failed');
    } finally {
      setLoading(false);
    }
  };

  const validateCalibration = async (calibrationId: string) => {
    try {
      const response = await calibrationAPI.validateCalibration(calibrationId);
      setValidationResult(response.data);
      setShowValidationDialog(true);
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    }
  };

  const activateCalibration = async (calibrationId: string) => {
    try {
      await calibrationAPI.activateCalibration(calibrationId);
      await loadCalibrations();
      toast.success('Calibration activated');
    } catch (error) {
      console.error('Failed to activate calibration:', error);
      toast.error('Failed to activate calibration');
    }
  };

  const exportCalibration = async (calibrationId: string, format: 'csv' | 'pdf' | 'xlsx' = 'csv') => {
    try {
      const response = await calibrationAPI.exportCalibration(calibrationId, format);
      const data = response.data;
      
      // Create download link
      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mime_type });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Calibration exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const signCalibration = async (calibration: CalibrationModel) => {
    if (!calibration.id) return;
    try {
      await esignAPI.create({
        objectType: 'calibration',
        objectId: calibration.id,
        reason: `Approve calibration ${calibration.target_name}`,
        objectData: calibration,
      });
      toast.success('Calibration signed');
    } catch (err) {
      toast.error('Failed to sign calibration');
    }
  };

  const getCalibrationChartData = (calibration: CalibrationModel) => {
    if (calibration.mode === 'internal_standard') {
      return calibration.levels
        .filter(level => level.included)
        .map(level => ({
          x: level.amount,
          y: level.area && level.is_area ? level.area / level.is_area : 0,
          name: `${level.amount} ${level.unit}`
        }));
    }
    
    return calibration.levels
      .filter(level => level.included)
      .map(level => ({
        x: level.amount,
        y: level.area || 0,
        name: `${level.amount} ${level.unit}`
      }));
  };

  const getResidualsChartData = (calibration: CalibrationModel) => {
    if (!calibration.residuals) return [];
    
    return calibration.residuals.map((residual, index) => ({
      x: calibration.levels[index]?.amount || index + 1,
      y: residual,
      name: `Level ${index + 1}`,
      excluded: calibration.excluded_points?.includes(index)
    }));
  };

  const resetForm = () => {
    setTargetName('');
    setLevels([]);
    setNotes('');
    setCalibrationMode('external');
    setModelType('linear');
    setOutlierPolicy('none');
    setInternalStandard({ peak_name: '', amount: 10.0, unit: 'ppm' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Calibration Manager
      </Typography>

      {/* Method/Instrument Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Method ID"
                type="number"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Instrument ID (Optional)"
                type="number"
                value={selectedInstrument || ''}
                onChange={(e) => setSelectedInstrument(e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Active Calibration Display */}
      {activeCalibration && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Active Calibration"
            action={
              <Chip
                icon={<CheckCircleIcon />}
                label={`Active (${activeCalibration.mode})`}
                color="success"
                size="small"
              />
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Target:</strong> {activeCalibration.target_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Model:</strong> {activeCalibration.model_type}
                </Typography>
                <Typography variant="body2">
                  <strong>Mode:</strong> {activeCalibration.mode}
                </Typography>
                <Typography variant="body2">
                  <strong>R²:</strong> {activeCalibration.r2?.toFixed(4)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Slope:</strong> {activeCalibration.slope?.toFixed(4)}
                </Typography>
                <Typography variant="body2">
                  <strong>Intercept:</strong> {activeCalibration.intercept?.toFixed(4)}
                </Typography>
                <Typography variant="body2">
                  <strong>LOD:</strong> {activeCalibration.lod?.toFixed(2)} {activeCalibration.levels[0]?.unit}
                </Typography>
                <Typography variant="body2">
                  <strong>LOQ:</strong> {activeCalibration.loq?.toFixed(2)} {activeCalibration.levels[0]?.unit}
                </Typography>
              </Grid>
            </Grid>
            
            {activeCalibration.internal_standard && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Internal Standard: {activeCalibration.internal_standard.peak_name} 
                ({activeCalibration.internal_standard.amount} {activeCalibration.internal_standard.unit})
              </Alert>
            )}

            {/* Calibration Curve Chart */}
            <Box sx={{ mt: 2, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={getCalibrationChartData(activeCalibration)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name="Concentration" />
                  <YAxis dataKey="y" name={activeCalibration.mode === 'internal_standard' ? 'Response Factor' : 'Peak Area'} />
                  <RechartsTooltip />
                  <Scatter dataKey="y" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={() => validateCalibration(activeCalibration.id!)}
              >
                Validate
              </Button>
              <Button
                size="small"
                startIcon={<ExportIcon />}
                onClick={() => exportCalibration(activeCalibration.id!, 'csv')}
              >
                Export CSV
              </Button>
              <Button
                size="small"
                startIcon={<ExportIcon />}
                onClick={() => exportCalibration(activeCalibration.id!, 'pdf')}
              >
                Export PDF
              </Button>
              <RequireRole role={['admin','qc','analyst']} userRole={'analyst'}>
                <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => signCalibration(activeCalibration)}>
                  Sign
                </Button>
              </RequireRole>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Build New Calibration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Build New Calibration" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Target Name"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g., Benzene"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Calibration Mode</InputLabel>
                <Select
                  value={calibrationMode}
                  onChange={(e) => setCalibrationMode(e.target.value as any)}
                  label="Calibration Mode"
                >
                  <MenuItem value="external">External Standard</MenuItem>
                  <MenuItem value="internal_standard">Internal Standard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Outlier Policy</InputLabel>
                <Select
                  value={outlierPolicy}
                  onChange={(e) => setOutlierPolicy(e.target.value as any)}
                  label="Outlier Policy"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="grubbs">Grubbs Test</MenuItem>
                  <MenuItem value="iqr">IQR Method</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as any)}
                  label="Model Type"
                >
                  <MenuItem value="linear">Linear</MenuItem>
                  <MenuItem value="linear_through_zero">Linear Through Zero</MenuItem>
                  <MenuItem value="weighted_1/x">Weighted 1/x</MenuItem>
                  <MenuItem value="weighted_1/x2">Weighted 1/x²</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional calibration notes"
              />
            </Grid>
          </Grid>

          {/* Internal Standard Configuration */}
          {calibrationMode === 'internal_standard' && (
            <Card sx={{ mt: 2, bgcolor: 'background.default' }}>
              <CardHeader title="Internal Standard Configuration" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="IS Peak Name"
                      value={internalStandard.peak_name}
                      onChange={(e) => setInternalStandard({...internalStandard, peak_name: e.target.value})}
                      placeholder="e.g., Toluene-d8"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="IS Amount"
                      type="number"
                      value={internalStandard.amount}
                      onChange={(e) => setInternalStandard({...internalStandard, amount: Number(e.target.value)})}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>IS Unit</InputLabel>
                      <Select
                        value={internalStandard.unit}
                        onChange={(e) => setInternalStandard({...internalStandard, unit: e.target.value})}
                        label="IS Unit"
                      >
                        <MenuItem value="ppm">ppm</MenuItem>
                        <MenuItem value="ppb">ppb</MenuItem>
                        <MenuItem value="mg/L">mg/L</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Calibration Levels Table */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Calibration Levels</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addLevel}
                variant="outlined"
                size="small"
              >
                Add Level
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Level</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Peak Name</TableCell>
                    <TableCell>Area</TableCell>
                    {calibrationMode === 'internal_standard' && <TableCell>IS Area</TableCell>}
                    <TableCell>RT (min)</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {levels.map((level, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={level.amount}
                          onChange={(e) => updateLevel(index, 'amount', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={level.unit}
                          onChange={(e) => updateLevel(index, 'unit', e.target.value)}
                        >
                          <MenuItem value="ppm">ppm</MenuItem>
                          <MenuItem value="ppb">ppb</MenuItem>
                          <MenuItem value="mg/L">mg/L</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={level.peak_name || ''}
                          onChange={(e) => updateLevel(index, 'peak_name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={level.area || ''}
                          onChange={(e) => updateLevel(index, 'area', Number(e.target.value))}
                        />
                      </TableCell>
                      {calibrationMode === 'internal_standard' && (
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={level.is_area || ''}
                            onChange={(e) => updateLevel(index, 'is_area', Number(e.target.value))}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={level.rt || ''}
                          onChange={(e) => updateLevel(index, 'rt', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeLevel(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={fitCalibration}
              disabled={loading || levels.length < 2}
            >
              Fit Calibration
            </Button>
            <Button
              onClick={resetForm}
              disabled={loading}
            >
              Reset Form
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Calibration Versions */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Calibration Versions ({versions.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {versions.map((version) => (
              <ListItem key={version.id}>
                <ListItemText
                  primary={`${version.model.target_name} - ${version.model.mode}`}
                  secondary={`Created: ${new Date(version.created_at).toLocaleString()} | R²: ${version.model.r2?.toFixed(4)}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => activateCalibration(version.model.id)}
                    disabled={version.model.active}
                  >
                    {version.model.active ? 'Active' : 'Activate'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Existing Calibrations */}
      <Card>
        <CardHeader 
          title="Existing Calibrations" 
          action={
            <Button startIcon={<TimelineIcon />} onClick={() => setShowVersionDialog(true)}>
              View All Versions
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : calibrations.length === 0 ? (
            <Alert severity="info">No calibrations found for this method</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Target</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Model Type</TableCell>
                    <TableCell>Levels</TableCell>
                    <TableCell>R²</TableCell>
                    <TableCell>Outliers</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calibrations.map((calibration) => (
                    <TableRow key={calibration.id}>
                      <TableCell>{calibration.target_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={calibration.mode} 
                          color={calibration.mode === 'internal_standard' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{calibration.model_type}</TableCell>
                      <TableCell>
                        {calibration.levels.filter(l => l.included).length}/{calibration.levels.length}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {calibration.r2?.toFixed(4) || 'N/A'}
                          {calibration.r2 && calibration.r2 < 0.99 && (
                            <Tooltip title="R² below 0.99">
                              <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {calibration.excluded_points?.length || 0}
                        {calibration.outlier_policy !== 'none' && (
                          <Chip label={calibration.outlier_policy} size="small" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {calibration.active ? (
                          <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />
                        ) : (
                          <Chip icon={<WarningIcon />} label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!calibration.active && (
                            <Button
                              size="small"
                              onClick={() => activateCalibration(calibration.id!)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            size="small"
                            startIcon={<AssessmentIcon />}
                            onClick={() => validateCalibration(calibration.id!)}
                          >
                            Validate
                          </Button>
                          <Button
                            size="small"
                            startIcon={<ExportIcon />}
                            onClick={() => exportCalibration(calibration.id!, 'csv')}
                          >
                            Export
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Fit Results Dialog */}
      <Dialog open={showFitDialog} onClose={() => setShowFitDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Calibration Fit Results</DialogTitle>
        <DialogContent>
          {fitResult && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6">Fit Parameters</Typography>
                  <Typography><strong>Mode:</strong> {fitResult.mode}</Typography>
                  <Typography><strong>Slope:</strong> {fitResult.slope?.toFixed(4)}</Typography>
                  <Typography><strong>Intercept:</strong> {fitResult.intercept?.toFixed(4)}</Typography>
                  <Typography><strong>R²:</strong> {fitResult.r2?.toFixed(4)}</Typography>
                  <Typography><strong>LOD:</strong> {fitResult.lod?.toFixed(2)} {fitResult.levels[0]?.unit}</Typography>
                  <Typography><strong>LOQ:</strong> {fitResult.loq?.toFixed(2)} {fitResult.levels[0]?.unit}</Typography>
                  <Typography><strong>LOD Method:</strong> {fitResult.lod_method}</Typography>
                  
                  {fitResult.excluded_points && fitResult.excluded_points.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Outliers detected and excluded: {fitResult.excluded_points.length} points
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Calibration Curve</Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={getCalibrationChartData(fitResult)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="Concentration" />
                        <YAxis dataKey="y" name={fitResult.mode === 'internal_standard' ? 'Response Factor' : 'Peak Area'} />
                        <RechartsTooltip />
                        <Scatter dataKey="y" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
              
              {fitResult.residuals && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Residuals Plot</Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={getResidualsChartData(fitResult)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="Concentration" />
                        <YAxis dataKey="y" name="Residual" />
                        <RechartsTooltip />
                        <Scatter dataKey="y" fill="#ff7300" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFitDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => {
              if (fitResult) {
                activateCalibration(fitResult.id!);
                setShowFitDialog(false);
                resetForm();
              }
            }}
          >
            Activate Calibration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Results Dialog */}
      <Dialog open={showValidationDialog} onClose={() => setShowValidationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Calibration Validation Results</DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box>
              <Alert severity={
                validationResult.overall_status === 'pass' ? 'success' :
                validationResult.overall_status === 'warning' ? 'warning' : 'error'
              }>
                Overall Status: {validationResult.overall_status.toUpperCase()}
              </Alert>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Quality Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>R²: {validationResult.r2?.toFixed(4)} 
                    {validationResult.r2_acceptable ? ' ✓' : ' ✗'}
                  </Typography>
                  <Typography>Point Count: {validationResult.point_count} 
                    {validationResult.point_count_acceptable ? ' ✓' : ' ✗'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>Excluded Points: {validationResult.excluded_points}</Typography>
                  <Typography>Outlier Policy: {validationResult.outlier_policy}</Typography>
                </Grid>
              </Grid>

              {validationResult.warnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Warnings</Typography>
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                      {warning}
                    </Alert>
                  ))}
                </Box>
              )}

              {validationResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Errors</Typography>
                  {validationResult.errors.map((error: string, index: number) => (
                    <Alert key={index} severity="error" sx={{ mt: 1 }}>
                      {error}
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalibrationManager;