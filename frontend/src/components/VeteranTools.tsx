import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, Alert, Chip, LinearProgress, Divider, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Paper
} from '@mui/material';
import { BugReport, Speed, Calculate, Restore, Science, Timeline } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`veteran-tools-tabpanel-${index}`}
      aria-labelledby={`veteran-tools-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const GhostPeakIdentifier: React.FC = () => {
  const [rt, setRt] = useState(15.5);
  const [area, setArea] = useState(50000);
  const [ovenTemp, setOvenTemp] = useState(280);
  const [inletTemp, setInletTemp] = useState(300);
  const [columnMax, setColumnMax] = useState(325);
  const [detectorType, setDetectorType] = useState('FID');
  const [baselineBefore, setBaselineBefore] = useState(20);
  const [baselineAfter, setBaselineAfter] = useState(35);
  const [runNumber, setRunNumber] = useState(1);
  const [totalRuns, setTotalRuns] = useState(20);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const identify = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analysis/ghost-peak-identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retention_time_min: rt,
          peak_area: area,
          oven_temp_at_elution: ovenTemp,
          inlet_temp: inletTemp,
          column_max_temp: columnMax,
          detector_type: detectorType,
          baseline_before: baselineBefore,
          baseline_after: baselineAfter,
          run_number: runNumber,
          total_runs_today: totalRuns
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error identifying ghost peak:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 80) return 'success';
    if (confidence > 60) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <BugReport sx={{ mr: 1, color: 'error.main' }} /> Ghost Peak Identifier
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Uses real Arrhenius equation and statistical patterns to identify ghost peaks
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Retention Time (min)"
              type="number"
              value={rt}
              onChange={(e) => setRt(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Peak Area"
              type="number"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value))}
              inputProps={{ step: 1000, min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Oven Temp at Elution (°C)"
              type="number"
              value={ovenTemp}
              onChange={(e) => setOvenTemp(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 40, max: 450 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Inlet Temp (°C)"
              type="number"
              value={inletTemp}
              onChange={(e) => setInletTemp(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 150, max: 450 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Column Max Temp (°C)"
              type="number"
              value={columnMax}
              onChange={(e) => setColumnMax(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 200, max: 450 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Detector Type</InputLabel>
              <Select
                value={detectorType}
                label="Detector Type"
                onChange={(e) => setDetectorType(e.target.value)}
              >
                <MenuItem value="FID">FID</MenuItem>
                <MenuItem value="MS">MS</MenuItem>
                <MenuItem value="TCD">TCD</MenuItem>
                <MenuItem value="ECD">ECD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Baseline Before (pA)"
              type="number"
              value={baselineBefore}
              onChange={(e) => setBaselineBefore(parseFloat(e.target.value))}
              inputProps={{ step: 1, min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Baseline After (pA)"
              type="number"
              value={baselineAfter}
              onChange={(e) => setBaselineAfter(parseFloat(e.target.value))}
              inputProps={{ step: 1, min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Run Number Today"
              type="number"
              value={runNumber}
              onChange={(e) => setRunNumber(parseInt(e.target.value))}
              inputProps={{ step: 1, min: 1 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Total Runs Today"
              type="number"
              value={totalRuns}
              onChange={(e) => setTotalRuns(parseInt(e.target.value))}
              inputProps={{ step: 1, min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={identify} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <LinearProgress /> : <Science />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Analyzing Peak Pattern...' : 'Identify Ghost Peak'}
            </Button>
          </Grid>
        </Grid>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert severity={getConfidenceColor(result.confidence_percent)}>
              <Typography variant="h6">
                {result.peak_type} - {result.confidence_percent}% Confidence
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Root Cause:</strong> {result.root_cause}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Solution:</strong> {result.solution}
              </Typography>
            </Alert>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Evidence:</Typography>
              {result.evidence?.map((e: string, i: number) => (
                <Chip 
                  key={i} 
                  label={e} 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }} 
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const VoidVolumeCalculator: React.FC = () => {
  const [columnLength, setColumnLength] = useState(30);
  const [columnId, setColumnId] = useState(0.25);
  const [filmThickness, setFilmThickness] = useState(0.25);
  const [temperature, setTemperature] = useState(100);
  const [outletPressure, setOutletPressure] = useState(14.7);
  const [carrierGas, setCarrierGas] = useState('Helium');
  const [flowRate, setFlowRate] = useState(1.0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/calculations/void-volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_length_m: columnLength,
          column_id_mm: columnId,
          column_df_um: filmThickness,
          temperature_c: temperature,
          outlet_pressure_psi: outletPressure,
          carrier_gas: carrierGas,
          flow_rate_ml_min: flowRate
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error calculating void volume:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <Speed sx={{ mr: 1, color: 'primary.main' }} /> Void Volume Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Exact dead time using James-Martin compressibility factor and gas physics
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column Length (m)"
              type="number"
              value={columnLength}
              onChange={(e) => setColumnLength(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 5, max: 100 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column ID (mm)"
              type="number"
              value={columnId}
              onChange={(e) => setColumnId(parseFloat(e.target.value))}
              inputProps={{ step: 0.05, min: 0.1, max: 1.0 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Film Thickness (μm)"
              type="number"
              value={filmThickness}
              onChange={(e) => setFilmThickness(parseFloat(e.target.value))}
              inputProps={{ step: 0.05, min: 0.1, max: 5.0 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Temperature (°C)"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 40, max: 400 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Outlet Pressure (psi)"
              type="number"
              value={outletPressure}
              onChange={(e) => setOutletPressure(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 10, max: 20 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Carrier Gas</InputLabel>
              <Select
                value={carrierGas}
                label="Carrier Gas"
                onChange={(e) => setCarrierGas(e.target.value)}
              >
                <MenuItem value="Helium">Helium</MenuItem>
                <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                <MenuItem value="Nitrogen">Nitrogen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Flow Rate (mL/min)"
              type="number"
              value={flowRate}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 0.1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Button 
              variant="contained" 
              onClick={calculate} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <LinearProgress /> : <Calculate />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Calculating Dead Time...' : 'Calculate Void Volume'}
            </Button>
          </Grid>
        </Grid>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="h6">Void Time: {result.void_time_min} min</Typography>
                  <Typography variant="body2">Holdup Time: {result.holdup_time_s} seconds</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <Typography variant="h6">Linear Velocity: {result.linear_velocity_cm_s} cm/s</Typography>
                  <Typography variant="body2">Efficiency: {result.current_efficiency_percent}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Available Volume: ${result.available_volume_ml} mL`} />
                  <Chip label={`J Factor: ${result.compressibility_factor_j}`} />
                  <Chip label={`Optimal Flow: ${result.optimal_flow_ml_min} mL/min`} />
                  <Chip label={`Avg Pressure: ${result.average_pressure_psi} psi`} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const PeakCapacityCalculator: React.FC = () => {
  const [columnLength, setColumnLength] = useState(30);
  const [columnId, setColumnId] = useState(0.25);
  const [tempInitial, setTempInitial] = useState(50);
  const [tempFinal, setTempFinal] = useState(300);
  const [rampRate, setRampRate] = useState(10);
  const [flowRate, setFlowRate] = useState(1.0);
  const [carrierGas, setCarrierGas] = useState('Helium');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/calculations/peak-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_length_m: columnLength,
          column_id_mm: columnId,
          temperature_initial_c: tempInitial,
          temperature_final_c: tempFinal,
          ramp_rate_c_min: rampRate,
          flow_rate_ml_min: flowRate,
          carrier_gas: carrierGas
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error calculating peak capacity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <Timeline sx={{ mr: 1, color: 'success.main' }} /> Peak Capacity Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Davis-Giddings statistical model for real separation prediction
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column Length (m)"
              type="number"
              value={columnLength}
              onChange={(e) => setColumnLength(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 5, max: 100 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column ID (mm)"
              type="number"
              value={columnId}
              onChange={(e) => setColumnId(parseFloat(e.target.value))}
              inputProps={{ step: 0.05, min: 0.1, max: 1.0 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Carrier Gas</InputLabel>
              <Select
                value={carrierGas}
                label="Carrier Gas"
                onChange={(e) => setCarrierGas(e.target.value)}
              >
                <MenuItem value="Helium">Helium</MenuItem>
                <MenuItem value="Hydrogen">Hydrogen</MenuItem>
                <MenuItem value="Nitrogen">Nitrogen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Initial Temp (°C)"
              type="number"
              value={tempInitial}
              onChange={(e) => setTempInitial(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 40, max: 200 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Final Temp (°C)"
              type="number"
              value={tempFinal}
              onChange={(e) => setTempFinal(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 100, max: 450 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Ramp Rate (°C/min)"
              type="number"
              value={rampRate}
              onChange={(e) => setRampRate(parseFloat(e.target.value))}
              inputProps={{ step: 1, min: 1, max: 50 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Flow Rate (mL/min)"
              type="number"
              value={flowRate}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 0.1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={calculate} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <LinearProgress /> : <Timeline />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Calculating Peak Capacity...' : 'Calculate Separation Power'}
            </Button>
          </Grid>
        </Grid>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6">Theoretical Capacity: {result.theoretical_peak_capacity}</Typography>
                  <Typography variant="body2">Max compounds (95% separated): {result.max_compounds_95_percent_separated}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="h6">Plate Count: {result.plate_count.toLocaleString()}</Typography>
                  <Typography variant="body2">Plate Height: {result.plate_height_um} μm</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Optimization:</strong> {result.optimization_suggestion}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Rs=1.0: ${result.practical_peak_capacity_Rs_1} peaks`} color="primary" />
                  <Chip label={`Rs=1.5: ${result.practical_peak_capacity_Rs_1_5} peaks`} color="secondary" />
                  <Chip label={`Rs=0.6: ${result.usable_peak_capacity_Rs_0_6} peaks`} color="warning" />
                  <Chip label={`Gradient: ${result.gradient_time_min} min`} />
                  <Chip label={`Peak Width: ${result.average_peak_width_s}s`} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const BackflushCalculator: React.FC = () => {
  const [lastPeakRt, setLastPeakRt] = useState(25.0);
  const [columnLength, setColumnLength] = useState(30);
  const [columnId, setColumnId] = useState(0.25);
  const [flowForward, setFlowForward] = useState(1.0);
  const [flowReverse, setFlowReverse] = useState(2.0);
  const [backflushTemp, setBackflushTemp] = useState(300);
  const [heaviestBp, setHeaviestBp] = useState(450);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/calculations/backflush-timing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_peak_rt_min: lastPeakRt,
          column_length_m: columnLength,
          column_id_mm: columnId,
          flow_rate_forward_ml_min: flowForward,
          flow_rate_reverse_ml_min: flowReverse,
          temperature_at_backflush_c: backflushTemp,
          heaviest_compound_bp_c: heaviestBp
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error calculating backflush timing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <Restore sx={{ mr: 1, color: 'warning.main' }} /> Backflush Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Exact timing using retention physics to prevent column contamination
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Last Peak RT (min)"
              type="number"
              value={lastPeakRt}
              onChange={(e) => setLastPeakRt(parseFloat(e.target.value))}
              inputProps={{ step: 1, min: 5, max: 60 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column Length (m)"
              type="number"
              value={columnLength}
              onChange={(e) => setColumnLength(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 5, max: 100 }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Column ID (mm)"
              type="number"
              value={columnId}
              onChange={(e) => setColumnId(parseFloat(e.target.value))}
              inputProps={{ step: 0.05, min: 0.1, max: 1.0 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Forward Flow (mL/min)"
              type="number"
              value={flowForward}
              onChange={(e) => setFlowForward(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 0.1, max: 10 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Reverse Flow (mL/min)"
              type="number"
              value={flowReverse}
              onChange={(e) => setFlowReverse(parseFloat(e.target.value))}
              inputProps={{ step: 0.1, min: 0.1, max: 10 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Backflush Temp (°C)"
              type="number"
              value={backflushTemp}
              onChange={(e) => setBackflushTemp(parseFloat(e.target.value))}
              inputProps={{ step: 5, min: 200, max: 450 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Heaviest Compound BP (°C)"
              type="number"
              value={heaviestBp}
              onChange={(e) => setHeaviestBp(parseFloat(e.target.value))}
              inputProps={{ step: 10, min: 100, max: 800 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={calculate} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <LinearProgress /> : <Restore />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Calculating Backflush Timing...' : 'Calculate Backflush Strategy'}
            </Button>
          </Grid>
        </Grid>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Typography variant="h6">Start Backflush: {result.post_run_backflush_start_min} min</Typography>
                  <Typography variant="body2">Duration: {result.backflush_duration_min} min</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="h6">Total Post-Run: {result.total_post_run_min} min</Typography>
                  <Typography variant="body2">Time Saved: {result.time_saved_vs_bakeout_min} min vs bakeout</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Alert severity={result.effectiveness === 'High' ? 'success' : 'warning'}>
                  <Typography variant="body2">
                    <strong>Effectiveness:</strong> {result.effectiveness} - 
                    {result.percent_column_contaminated}% of column contaminated
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Contamination Distance: ${result.distance_heavy_compounds_traveled_m}m`} />
                  <Chip label={`Recommended Flow: ${result.recommended_backflush_flow_ml_min} mL/min`} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const VeteranTools: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="veteran tools tabs">
          <Tab 
            label="Ghost Peak ID" 
            icon={<BugReport />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label="Void Volume" 
            icon={<Speed />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label="Peak Capacity" 
            icon={<Timeline />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label="Backflush" 
            icon={<Restore />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>
      
      <TabPanel value={value} index={0}>
        <GhostPeakIdentifier />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <VoidVolumeCalculator />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <PeakCapacityCalculator />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <BackflushCalculator />
      </TabPanel>
    </Box>
  );
};

export default VeteranTools;
