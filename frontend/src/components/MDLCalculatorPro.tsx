import React, { useState } from 'react';
import {
  Box, Card, Grid, TextField, Select, MenuItem,
  Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Alert, Tabs, Tab, Chip, LinearProgress,
  FormControl, InputLabel, Tooltip
} from '@mui/material';
import { Science, CheckCircle, Warning, GetApp } from '@mui/icons-material';
import { Line } from 'recharts';

interface MDLResult {
  mdl_stats: number;
  lod_sn: number;
  loq_sn: number;
  mean: number;
  std_dev: number;
  rsd_percent: number;
  confidence_interval_95: [number, number];
  outliers: number[];
  warnings: string[];
  meets_criteria: boolean;
}

export const MDLCalculatorPro: React.FC = () => {
  const [replicates, setReplicates] = useState<string[]>(new Array(7).fill(''));
  const [concentration, setConcentration] = useState('1.0');
  const [baselineNoise, setBaselineNoise] = useState('0.5');
  const [detectorType, setDetectorType] = useState('FID');
  const [result, setResult] = useState<MDLResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    
    const values = replicates
      .filter(r => r)
      .map(r => parseFloat(r));
    
    const response = await fetch('/api/detection-limits/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replicate_areas: values,
        concentration: parseFloat(concentration),
        baseline_noise: parseFloat(baselineNoise),
        detector_type: detectorType
      })
    });
    
    const data = await response.json();
    setResult(data);
    setCalculating(false);
  };

  const exportReport = () => {
    // Generate PDF report - disabled for now
    console.log('PDF export feature coming soon');
    // window.open(`/api/detection-limits/report/`, '_blank');
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Professional MDL Calculator
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          EPA Method | ICH Guidelines | Agilent Optimized
        </Typography>
      </Grid>

      {/* Input Section */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Replicate Measurements
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Detector Type</InputLabel>
            <Select
              value={detectorType}
              onChange={(e) => setDetectorType(e.target.value)}
              label="Detector Type"
            >
              <MenuItem value="FID">FID - Flame Ionization</MenuItem>
              <MenuItem value="SCD">SCD - Sulfur Chemiluminescence</MenuItem>
              <MenuItem value="NCD">NCD - Nitrogen Chemiluminescence</MenuItem>
              <MenuItem value="FPD">FPD - Flame Photometric</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            {replicates.map((value, idx) => (
              <Grid item xs={6} key={idx}>
                <TextField
                  label={`Replicate ${idx + 1}`}
                  value={value}
                  onChange={(e) => {
                    const newReps = [...replicates];
                    newReps[idx] = e.target.value;
                    setReplicates(newReps);
                  }}
                  type="number"
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <Typography variant="caption">area</Typography>
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <TextField
            label="Analyte Concentration"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value)}
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: <Typography variant="caption">ppm</Typography>
            }}
          />

          <TextField
            label="Baseline Noise (ChemStation)"
            value={baselineNoise}
            onChange={(e) => setBaselineNoise(e.target.value)}
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: <Typography variant="caption">pA</Typography>
            }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={calculate}
            disabled={calculating || replicates.filter(r => r).length < 3}
            sx={{ mt: 3 }}
          >
            {calculating ? <LinearProgress /> : 'Calculate Detection Limits'}
          </Button>
        </Card>
      </Grid>

      {/* Results Section */}
      {result && (
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Results
              </Typography>
              <Chip 
                label={result.meets_criteria ? "VALID" : "REVIEW"}
                color={result.meets_criteria ? "success" : "warning"}
                icon={result.meets_criteria ? <CheckCircle /> : <Warning />}
              />
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>MDL (EPA)</strong></TableCell>
                    <TableCell align="right">{result.mdl_stats.toFixed(4)} ppm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>LOD (3σ)</strong></TableCell>
                    <TableCell align="right">{result.lod_sn.toFixed(4)} ppm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>LOQ (10σ)</strong></TableCell>
                    <TableCell align="right">{result.loq_sn.toFixed(4)} ppm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Mean Response</strong></TableCell>
                    <TableCell align="right">{result.mean.toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Std Dev</strong></TableCell>
                    <TableCell align="right">{result.std_dev.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>RSD%</strong></TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${result.rsd_percent.toFixed(1)}%`}
                        size="small"
                        color={result.rsd_percent < 20 ? "success" : "warning"}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>95% CI</strong></TableCell>
                    <TableCell align="right">
                      [{result.confidence_interval_95[0].toFixed(1)}, {result.confidence_interval_95[1].toFixed(1)}]
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {result.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Warnings:</Typography>
                {result.warnings.map((w, idx) => (
                  <Typography key={idx} variant="body2">• {w}</Typography>
                ))}
              </Alert>
            )}

            {result.outliers.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Outliers detected in replicates: {result.outliers.map(i => i+1).join(', ')}
              </Alert>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GetApp />}
              onClick={exportReport}
              sx={{ mt: 2 }}
            >
              Export Professional Report
            </Button>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

