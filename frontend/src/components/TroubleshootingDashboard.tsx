import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, Tabs, Tab, LinearProgress, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Paper, CircularProgress
} from '@mui/material';
import {
  Build, Warning, Timeline, BugReport,
  History, TrendingUp, Assessment,
  Science, LocalFireDepartment
} from '@mui/icons-material';
import { troubleshootingAPI } from '../services/api';

interface TroubleshootingSession {
  id: number;
  component: string;
  issue_type: string;
  root_cause: string;
  confidence_percent: number;
  timestamp: string;
  calculated_diagnostics: any;
  solution_applied?: string;
  resolution_confirmed?: boolean;
}

interface DetectorTrend {
  test_date: string;
  baseline_noise: number;
  sensitivity: number;
  test_response: number;
  detector_specific: {
    fid_flame_voltage?: number;
    ms_em_voltage?: number;
    ecd_standing_current?: number;
  };
}

interface DiagnosticResult {
  severity?: string;
  root_cause?: string;
  solution?: string;
  confidence_percent?: number;
  [key: string]: any;
}

export const TroubleshootingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<TroubleshootingSession[]>([]);
  const [selectedGC, setSelectedGC] = useState('1');
  const [loading, setLoading] = useState(false);
  const [detectorTrends, setDetectorTrends] = useState<DetectorTrend[]>([]);
  
  // Component-specific states
  const [inletTest, setInletTest] = useState<DiagnosticResult | null>(null);
  const [columnTest, setColumnTest] = useState<DiagnosticResult | null>(null);
  const [detectorTest, setDetectorTest] = useState<DiagnosticResult | null>(null);
  const [selectedDetector, setSelectedDetector] = useState('FID');

  // Form states for inlet discrimination test
  const [inletForm, setInletForm] = useState({
    c10_area: 100000,
    c20_area: 85000,
    c30_area: 65000,
    c10_expected: 100000,
    c20_expected: 95000,
    c30_expected: 90000,
    inlet_temp: 280,
    inlet_pressure: 25,
    liner_type: "split",
    last_liner_change_days: 45
  });

  // Form states for flashback test
  const [flashbackForm, setFlashbackForm] = useState({
    peak_fronting_factor: 0.85,
    first_peak_width_ratio: 1.8,
    solvent_expansion_volume_ul: 200,
    liner_volume_ul: 900,
    injection_volume_ul: 1,
    inlet_pressure_psi: 25,
    purge_time_s: 60
  });

  // Form states for column activity test
  const [columnForm, setColumnForm] = useState({
    toluene_rt: 8.5,
    octanol_rt: 15.2,
    toluene_tailing: 1.05,
    octanol_tailing: 1.85,
    octanol_toluene_ratio: 1.78,
    expected_ratio: 1.50,
    column_age_months: 18,
    total_injections: 2500
  });

  // Form states for FID sensitivity test
  const [fidForm, setFidForm] = useState({
    octane_amount_ng: 10,
    octane_peak_area: 50000,
    baseline_noise_pa: 0.5,
    hydrogen_flow_ml_min: 30,
    air_flow_ml_min: 300,
    makeup_flow_ml_min: 25,
    detector_temp_c: 300,
    jet_cleaning_days_ago: 90
  });

  useEffect(() => {
    if (selectedGC) {
      loadHistory();
      loadDetectorTrends();
    }
  }, [selectedGC]);

  const loadHistory = async () => {
    try {
      const data = await troubleshootingAPI.getTroubleshootingHistory(parseInt(selectedGC));
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadDetectorTrends = async () => {
    try {
      const data = await troubleshootingAPI.getDetectorTrends(parseInt(selectedGC), selectedDetector);
      setDetectorTrends(data);
    } catch (error) {
      console.error('Failed to load detector trends:', error);
    }
  };

  const runInletDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await troubleshootingAPI.diagnoseInletDiscrimination({
        ...inletForm,
        instrument_id: parseInt(selectedGC)
      });
      
      setInletTest(result);
      loadHistory(); // Refresh history
      
      // Save to local history for immediate display
      const session = {
        component: 'inlet',
        issue: 'discrimination',
        result: result,
        timestamp: new Date().toISOString()
      };
      setHistory([session as any, ...history]);
    } catch (error) {
      console.error('Inlet diagnostics failed:', error);
      setInletTest({
        severity: 'Error',
        root_cause: 'Test failed',
        solution: 'Check input values and try again'
      });
    }
    setLoading(false);
  };

  const runFlashbackTest = async () => {
    setLoading(true);
    try {
      const result = await troubleshootingAPI.detectInletFlashback({
        ...flashbackForm,
        instrument_id: parseInt(selectedGC)
      });
      
      setInletTest(result);
      loadHistory();
      
      // Save to local history for immediate display
      const session = {
        component: 'inlet',
        issue: 'flashback',
        result: result,
        timestamp: new Date().toISOString()
      };
      setHistory([session as any, ...history]);
    } catch (error) {
      console.error('Flashback test failed:', error);
      setInletTest({
        severity: 'Error',
        root_cause: 'Test failed',
        solution: 'Check input values and try again'
      });
    }
    setLoading(false);
  };

  const runColumnActivityTest = async () => {
    setLoading(true);
    try {
      const result = await troubleshootingAPI.testColumnActivity({
        ...columnForm,
        instrument_id: parseInt(selectedGC)
      });
      
      setColumnTest(result);
      loadHistory();
      
      // Save to local history for immediate display
      const session = {
        component: 'column',
        issue: 'activity_test',
        result: result,
        timestamp: new Date().toISOString()
      };
      setHistory([session as any, ...history]);
    } catch (error) {
      console.error('Column activity test failed:', error);
      setColumnTest({
        severity: 'Error',
        root_cause: 'Test failed',
        solution: 'Check input values and try again'
      });
    }
    setLoading(false);
  };

  const runFIDSensitivityCheck = async () => {
    setLoading(true);
    try {
      const result = await troubleshootingAPI.checkFIDSensitivity({
        ...fidForm,
        instrument_id: parseInt(selectedGC)
      });
      
      setDetectorTest(result);
      loadHistory();
      
      // Save to local history for immediate display
      const session = {
        component: 'detector',
        issue: 'FID sensitivity',
        result: result,
        timestamp: new Date().toISOString()
      };
      setHistory([session as any, ...history]);
    } catch (error) {
      console.error('FID sensitivity check failed:', error);
      setDetectorTest({
        severity: 'Error',
        root_cause: 'Test failed',
        solution: 'Check input values and try again'
      });
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'severe':
      case 'critical':
      case 'fail':
        return 'error';
      case 'moderate':
      case 'marginal':
        return 'warning';
      case 'acceptable':
      case 'pass':
        return 'success';
      default:
        return 'info';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Build color="primary" />
        GC Troubleshooting Center
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Select GC</InputLabel>
        <Select
          value={selectedGC}
          onChange={(e) => setSelectedGC(e.target.value)}
          label="Select GC"
        >
          <MenuItem value="1">GC-001 - Lab A</MenuItem>
          <MenuItem value="2">GC-002 - Lab B</MenuItem>
          <MenuItem value="3">GC-003 - QC Lab</MenuItem>
        </Select>
      </FormControl>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Inlet" icon={<Build />} />
        <Tab label="Column" icon={<Timeline />} />
        <Tab label="Detector" icon={<BugReport />} />
        <Tab label="History" icon={<History />} />
        <Tab label="Trends" icon={<TrendingUp />} />
      </Tabs>

      {/* INLET TAB */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Science />
                  Inlet Discrimination Test
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Analyze mass discrimination using n-alkane standards (C10, C20, C30)
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="C10 Area"
                      type="number"
                      value={inletForm.c10_area}
                      onChange={(e) => setInletForm({...inletForm, c10_area: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="C20 Area"
                      type="number"
                      value={inletForm.c20_area}
                      onChange={(e) => setInletForm({...inletForm, c20_area: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="C30 Area"
                      type="number"
                      value={inletForm.c30_area}
                      onChange={(e) => setInletForm({...inletForm, c30_area: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Inlet Temp (°C)"
                      type="number"
                      value={inletForm.inlet_temp}
                      onChange={(e) => setInletForm({...inletForm, inlet_temp: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Days Since Liner Change"
                      type="number"
                      value={inletForm.last_liner_change_days}
                      onChange={(e) => setInletForm({...inletForm, last_liner_change_days: parseInt(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={runInletDiagnostics}
                  disabled={loading}
                  sx={{ mt: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                >
                  {loading ? 'Analyzing...' : 'Run Discrimination Test'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  Flashback Detection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Detect solvent expansion issues causing peak fronting
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Injection Volume (µL)"
                      type="number"
                      value={flashbackForm.injection_volume_ul}
                      onChange={(e) => setFlashbackForm({...flashbackForm, injection_volume_ul: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Liner Volume (µL)"
                      type="number"
                      value={flashbackForm.liner_volume_ul}
                      onChange={(e) => setFlashbackForm({...flashbackForm, liner_volume_ul: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Peak Fronting Factor"
                      type="number"
                      value={flashbackForm.peak_fronting_factor}
                      onChange={(e) => setFlashbackForm({...flashbackForm, peak_fronting_factor: parseFloat(e.target.value)})}
                      size="small"
                      helperText="< 1.0 indicates fronting"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Peak Width Ratio"
                      type="number"
                      value={flashbackForm.first_peak_width_ratio}
                      onChange={(e) => setFlashbackForm({...flashbackForm, first_peak_width_ratio: parseFloat(e.target.value)})}
                      size="small"
                      helperText="vs expected width"
                    />
                  </Grid>
                </Grid>
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={runFlashbackTest}
                  disabled={loading}
                  sx={{ mt: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <Warning />}
                >
                  {loading ? 'Checking...' : 'Check for Flashback'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Results for Inlet */}
          {inletTest && (
            <Grid item xs={12}>
              <Alert severity={getSeverityColor(inletTest.severity || '')} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  {inletTest.severity} - {inletTest.root_cause}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Solution: {inletTest.solution}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {inletTest.discrimination_rate && (
                    <Chip size="small" label={`Discrimination: ${inletTest.discrimination_rate}%/carbon`} />
                  )}
                  {inletTest.flashback_probability_percent && (
                    <Chip 
                      size="small" 
                      label={`Flashback Risk: ${inletTest.flashback_probability_percent}%`}
                      color={inletTest.flashback_probability_percent > 60 ? 'error' : 'default'}
                    />
                  )}
                  {inletTest.linearity_r2 && (
                    <Chip size="small" label={`R²: ${inletTest.linearity_r2}`} />
                  )}
                </Box>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* COLUMN TAB */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline />
                  Column Activity Test (Grob Test)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Detect acidic sites and adsorption using toluene and octanol
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Toluene RT (min)"
                      type="number"
                      value={columnForm.toluene_rt}
                      onChange={(e) => setColumnForm({...columnForm, toluene_rt: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Octanol RT (min)"
                      type="number"
                      value={columnForm.octanol_rt}
                      onChange={(e) => setColumnForm({...columnForm, octanol_rt: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Toluene Tailing Factor"
                      type="number"
                      value={columnForm.toluene_tailing}
                      onChange={(e) => setColumnForm({...columnForm, toluene_tailing: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Octanol Tailing Factor"
                      type="number"
                      value={columnForm.octanol_tailing}
                      onChange={(e) => setColumnForm({...columnForm, octanol_tailing: parseFloat(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Column Age (months)"
                      type="number"
                      value={columnForm.column_age_months}
                      onChange={(e) => setColumnForm({...columnForm, column_age_months: parseInt(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Total Injections"
                      type="number"
                      value={columnForm.total_injections}
                      onChange={(e) => setColumnForm({...columnForm, total_injections: parseInt(e.target.value)})}
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={runColumnActivityTest}
                  disabled={loading}
                  sx={{ mt: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <Timeline />}
                >
                  {loading ? 'Testing...' : 'Run Activity Test'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {columnTest && (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Test Results</Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Activity Score</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(columnTest.activity_score || 0, 100)} 
                      color={columnTest.activity_score > 60 ? 'error' : columnTest.activity_score > 30 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption">{columnTest.activity_score}/100</Typography>
                  </Box>

                  <Alert severity={getSeverityColor(columnTest.severity || '')}>
                    <Typography variant="body2">
                      {columnTest.root_cause}
                    </Typography>
                    {columnTest.solution && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        {columnTest.solution}
                      </Typography>
                    )}
                  </Alert>

                  {columnTest.issues && columnTest.issues.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Issues Detected:</Typography>
                      {columnTest.issues.map((issue: string, idx: number) => (
                        <Chip key={idx} label={issue} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* DETECTOR TAB */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl sx={{ minWidth: 150, mb: 2 }}>
              <InputLabel>Detector Type</InputLabel>
              <Select
                value={selectedDetector}
                onChange={(e) => setSelectedDetector(e.target.value)}
                label="Detector Type"
              >
                <MenuItem value="FID">FID</MenuItem>
                <MenuItem value="MS">MS</MenuItem>
                <MenuItem value="ECD">ECD</MenuItem>
                <MenuItem value="TCD">TCD</MenuItem>
                <MenuItem value="SCD">SCD</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {selectedDetector === 'FID' && (
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFireDepartment />
                    FID Sensitivity Check
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Calculate sensitivity and diagnose flame issues using octane standard
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Octane Amount (ng)"
                        type="number"
                        value={fidForm.octane_amount_ng}
                        onChange={(e) => setFidForm({...fidForm, octane_amount_ng: parseFloat(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Peak Area"
                        type="number"
                        value={fidForm.octane_peak_area}
                        onChange={(e) => setFidForm({...fidForm, octane_peak_area: parseFloat(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="H₂ Flow (mL/min)"
                        type="number"
                        value={fidForm.hydrogen_flow_ml_min}
                        onChange={(e) => setFidForm({...fidForm, hydrogen_flow_ml_min: parseFloat(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Air Flow (mL/min)"
                        type="number"
                        value={fidForm.air_flow_ml_min}
                        onChange={(e) => setFidForm({...fidForm, air_flow_ml_min: parseFloat(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Baseline Noise (pA)"
                        type="number"
                        value={fidForm.baseline_noise_pa}
                        onChange={(e) => setFidForm({...fidForm, baseline_noise_pa: parseFloat(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Days Since Jet Cleaning"
                        type="number"
                        value={fidForm.jet_cleaning_days_ago}
                        onChange={(e) => setFidForm({...fidForm, jet_cleaning_days_ago: parseInt(e.target.value)})}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={runFIDSensitivityCheck}
                    disabled={loading}
                    sx={{ mt: 2 }}
                    startIcon={loading ? <CircularProgress size={20} /> : <LocalFireDepartment />}
                  >
                    {loading ? 'Checking...' : 'Check FID Sensitivity'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {detectorTest && (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Detector Results</Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Alert severity={getSeverityColor(detectorTest.severity || '')}>
                    <Typography variant="body2">
                      {detectorTest.root_cause}
                    </Typography>
                    {detectorTest.solution && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        {detectorTest.solution}
                      </Typography>
                    )}
                  </Alert>

                  <Box sx={{ mt: 2 }}>
                    {detectorTest.sensitivity_pa_ng && (
                      <Typography variant="body2">
                        Sensitivity: {detectorTest.sensitivity_pa_ng} pA/ng
                      </Typography>
                    )}
                    {detectorTest.signal_to_noise && (
                      <Typography variant="body2">
                        S/N Ratio: {detectorTest.signal_to_noise}
                        <Chip 
                          size="small" 
                          label={detectorTest.meets_spec ? "PASS" : "FAIL"} 
                          color={detectorTest.meets_spec ? "success" : "error"}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    )}
                    {detectorTest.mdq_pg && (
                      <Typography variant="body2">
                        MDQ: {detectorTest.mdq_pg} pg
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* HISTORY TAB */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History />
              Troubleshooting History
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Component</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Root Cause</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((session, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(session.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={session.component} 
                          variant="outlined"
                          icon={session.component === 'inlet' ? <Build /> : 
                                session.component === 'column' ? <Timeline /> : <BugReport />}
                        />
                      </TableCell>
                      <TableCell>{session.issue_type}</TableCell>
                      <TableCell>{session.root_cause}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${session.confidence_percent || 0}%`}
                          size="small"
                          color={getConfidenceColor(session.confidence_percent || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={session.resolution_confirmed ? "Resolved" : "Pending"}
                          color={session.resolution_confirmed ? "success" : "warning"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TRENDS TAB */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  Detector Performance Trends
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track detector performance over time to predict maintenance needs
                </Typography>
                
                <FormControl sx={{ mt: 2, minWidth: 150 }}>
                  <InputLabel>Detector</InputLabel>
                  <Select
                    value={selectedDetector}
                    onChange={(e) => {
                      setSelectedDetector(e.target.value);
                      loadDetectorTrends();
                    }}
                    label="Detector"
                  >
                    <MenuItem value="FID">FID</MenuItem>
                    <MenuItem value="MS">MS</MenuItem>
                    <MenuItem value="ECD">ECD</MenuItem>
                  </Select>
                </FormControl>

                {detectorTrends.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2">Recent Performance Data:</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Baseline Noise</TableCell>
                            <TableCell>Sensitivity</TableCell>
                            <TableCell>Response</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detectorTrends.slice(-5).map((trend, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{new Date(trend.test_date).toLocaleDateString()}</TableCell>
                              <TableCell>{trend.baseline_noise?.toFixed(3)}</TableCell>
                              <TableCell>{trend.sensitivity?.toFixed(1)}</TableCell>
                              <TableCell>{trend.test_response?.toFixed(0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TroubleshootingDashboard;
