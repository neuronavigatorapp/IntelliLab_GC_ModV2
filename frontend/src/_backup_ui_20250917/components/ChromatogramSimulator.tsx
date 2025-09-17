import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import { Whatshot, Speed, Thermostat, Timeline } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { simulateChromatogram, ChromatogramOutput } from '../services/api';

export const ChromatogramSimulator: React.FC = () => {
  const [columnTemp, setColumnTemp] = useState<number>(40);
  const [rampRate, setRampRate] = useState<number>(10);
  const [flowRate, setFlowRate] = useState<number>(1.0);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [results, setResults] = useState<ChromatogramOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const simulate = async () => {
      setLoading(true);
      
      try {
        const result = await simulateChromatogram({
          column_temp: columnTemp,
          ramp_rate: rampRate,
          flow_rate: flowRate,
          split_ratio: splitRatio,
          column_length: 30,
          column_diameter: 0.25,
        });
        setResults(result);
        
        // Trigger animation
        setAnimating(true);
        setTimeout(() => setAnimating(false), 2000);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(simulate, 500);
    return () => clearTimeout(debounceTimer);
  }, [columnTemp, rampRate, flowRate, splitRatio]);

  const getCompoundColor = (compound: string) => {
    const colors: { [key: string]: string } = {
      'C1': '#FF6B6B',
      'C2': '#4ECDC4',
      'C3': '#45B7D1',
      'C4': '#96CEB4',
      'C5': '#FFEAA7',
      'C6': '#DDA0DD',
    };
    const match = compound.match(/C(\d)/);
    return match ? colors[`C${match[1]}`] : '#888';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Timeline /> C1-C6 Paraffins Chromatogram Simulator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Simulate the separation of light hydrocarbons (C1-C6 paraffins) with real-time visualization.
        Adjust temperature and flow parameters to optimize separation.
      </Typography>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                GC Parameters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Thermostat fontSize="small" /> Column Temperature: {columnTemp}°C
                </Typography>
                <Slider
                  value={columnTemp}
                  onChange={(_, value) => setColumnTemp(value as number)}
                  min={30}
                  max={150}
                  marks={[
                    { value: 30, label: '30°C' },
                    { value: 90, label: '90°C' },
                    { value: 150, label: '150°C' },
                  ]}
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Whatshot fontSize="small" /> Ramp Rate: {rampRate}°C/min
                </Typography>
                <Slider
                  value={rampRate}
                  onChange={(_, value) => setRampRate(value as number)}
                  min={5}
                  max={30}
                  marks={[
                    { value: 5, label: '5' },
                    { value: 15, label: '15' },
                    { value: 30, label: '30' },
                  ]}
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed fontSize="small" /> Flow Rate: {flowRate.toFixed(1)} mL/min
                </Typography>
                <Slider
                  value={flowRate}
                  onChange={(_, value) => setFlowRate(value as number)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1.5, label: '1.5' },
                    { value: 3, label: '3.0' },
                  ]}
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography gutterBottom variant="body2">
                  Split Ratio: 1:{splitRatio}
                </Typography>
                <Slider
                  value={splitRatio}
                  onChange={(_, value) => setSplitRatio(value as number)}
                  min={10}
                  max={200}
                  step={10}
                  marks={[
                    { value: 10, label: '1:10' },
                    { value: 100, label: '1:100' },
                    { value: 200, label: '1:200' },
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chromatogram */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Chromatogram
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading && <LinearProgress />}
              
              {results && (
                <Box sx={{ 
                  animation: animating ? 'fadeIn 0.5s' : 'none',
                  '@keyframes fadeIn': {
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                  },
                }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={results.data_points}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Signal (pA)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="signal" 
                        stroke="#2196f3" 
                        strokeWidth={2}
                        dot={false}
                        animationDuration={2000}
                      />
                      {results.peaks.map((peak) => (
                        <ReferenceLine
                          key={peak.compound}
                          x={peak.retention_time}
                          stroke={getCompoundColor(peak.compound)}
                          strokeDasharray="5 5"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {results.peaks.map((peak) => (
                      <Chip
                        key={peak.compound}
                        label={`${peak.compound}: ${peak.retention_time} min`}
                        size="small"
                        sx={{ 
                          bgcolor: getCompoundColor(peak.compound),
                          color: 'white',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Table */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Peak Analysis
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {results && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Compound</TableCell>
                        <TableCell align="right">RT (min)</TableCell>
                        <TableCell align="right">Height (pA)</TableCell>
                        <TableCell align="right">Area</TableCell>
                        <TableCell align="right">Width (min)</TableCell>
                        <TableCell align="right">BP (°C)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.peaks.map((peak) => (
                        <TableRow key={peak.compound}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: getCompoundColor(peak.compound),
                                }}
                              />
                              {peak.compound}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{peak.retention_time}</TableCell>
                          <TableCell align="right">{peak.peak_height.toFixed(0)}</TableCell>
                          <TableCell align="right">{peak.peak_area.toFixed(0)}</TableCell>
                          <TableCell align="right">{peak.peak_width}</TableCell>
                          <TableCell align="right">{peak.boiling_point}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          This simulation models the separation of light alkanes (C1-C6) using temperature programming. 
          Lower temperatures provide better separation but longer analysis times. 
          Adjust parameters to find the optimal balance for your analysis.
        </Alert>
      </Box>
    </Box>
  );
};
