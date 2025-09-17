import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Science,
  ExpandMore,
  CheckCircle,
  Lightbulb,
  Analytics,
  AutoAwesome
} from '@mui/icons-material';

interface AIMethodOptimizationProps {
  className?: string;
}

interface OptimizationRequest {
  compound_name: string;
  method_type: string;
  current_parameters: {
    temperature?: number;
    flow_rate?: number;
    injection_volume?: number;
  };
  target_analytes: string[];
  optimization_goals: string[];
}

interface AIAnalysisResult {
  analysis_type: string;
  confidence_score: number;
  recommendations: {
    temperature?: any;
    flow_rate?: any;
    injection?: any;
  };
  predicted_improvements: {
    resolution?: number;
    runtime?: number;
    sensitivity?: number;
  };
  implementation_steps: string[];
}

const AIMethodOptimization: React.FC<AIMethodOptimizationProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [compoundName, setCompoundName] = useState('');
  const [methodType, setMethodType] = useState('GC-FID');
  const [temperature, setTemperature] = useState(150);
  const [flowRate, setFlowRate] = useState(2.0);
  const [injectionVolume, setInjectionVolume] = useState(1.0);
  const [targetAnalytes, setTargetAnalytes] = useState<string[]>([]);
  const [newAnalyte, setNewAnalyte] = useState('');
  const [optimizationGoals, setOptimizationGoals] = useState<string[]>(['resolution', 'sensitivity']);

  const handleAddAnalyte = () => {
    if (newAnalyte.trim() && !targetAnalytes.includes(newAnalyte.trim())) {
      setTargetAnalytes([...targetAnalytes, newAnalyte.trim()]);
      setNewAnalyte('');
    }
  };

  const handleRemoveAnalyte = (analyte: string) => {
    setTargetAnalytes(targetAnalytes.filter(a => a !== analyte));
  };

  const runAIOptimization = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: OptimizationRequest = {
        compound_name: compoundName,
        method_type: methodType,
        current_parameters: {
          temperature,
          flow_rate: flowRate,
          injection_volume: injectionVolume
        },
        target_analytes: targetAnalytes,
        optimization_goals: optimizationGoals
      };

      const response = await fetch('http://localhost:8000/ai/method-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysisResult: AIAnalysisResult = await response.json();
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getImprovementColor = (value: number) => {
    if (value > 0.15) return 'success';
    if (value > 0.05) return 'warning';
    return 'info';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Box className={className} sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Psychology sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Method Optimization
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Intelligent GC method parameter optimization powered by machine learning
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Science sx={{ mr: 1 }} />
                Method Configuration
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Compound Name"
                  value={compoundName}
                  onChange={(e) => setCompoundName(e.target.value)}
                  placeholder="e.g., Benzene, Toluene"
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Method Type</InputLabel>
                  <Select
                    value={methodType}
                    label="Method Type"
                    onChange={(e) => setMethodType(e.target.value)}
                  >
                    <MenuItem value="GC-FID">GC-FID</MenuItem>
                    <MenuItem value="GC-MS">GC-MS</MenuItem>
                    <MenuItem value="GC-ECD">GC-ECD</MenuItem>
                    <MenuItem value="GC-TCD">GC-TCD</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Temperature (°C)"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Flow Rate (mL/min)"
                      value={flowRate}
                      onChange={(e) => setFlowRate(Number(e.target.value))}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Injection Vol (μL)"
                      value={injectionVolume}
                      onChange={(e) => setInjectionVolume(Number(e.target.value))}
                      inputProps={{ step: 0.1 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Target Analytes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Add analyte..."
                  value={newAnalyte}
                  onChange={(e) => setNewAnalyte(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAnalyte()}
                />
                <Button variant="outlined" onClick={handleAddAnalyte}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {targetAnalytes.map((analyte) => (
                  <Chip
                    key={analyte}
                    label={analyte}
                    onDelete={() => handleRemoveAnalyte(analyte)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Optimization Goals</InputLabel>
                <Select
                  multiple
                  value={optimizationGoals}
                  label="Optimization Goals"
                  onChange={(e) => setOptimizationGoals(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="resolution">Resolution</MenuItem>
                  <MenuItem value="runtime">Runtime</MenuItem>
                  <MenuItem value="sensitivity">Sensitivity</MenuItem>
                  <MenuItem value="reproducibility">Reproducibility</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={runAIOptimization}
                disabled={loading || !compoundName}
                sx={{ mb: 2 }}
              >
                {loading ? 'Analyzing...' : 'Run AI Optimization'}
              </Button>

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    AI is analyzing your method parameters...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box>
              {/* Confidence Score */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AutoAwesome sx={{ mr: 1 }} />
                    AI Analysis Confidence
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={result.confidence_score * 100}
                      color={getConfidenceColor(result.confidence_score)}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="h6" color={`${getConfidenceColor(result.confidence_score)}.main`}>
                      {formatPercentage(result.confidence_score)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Predicted Improvements */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Predicted Improvements
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(result.predicted_improvements).map(([metric, value]) => (
                      <Grid item xs={4} key={metric}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                            {metric}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={`${getImprovementColor(Math.abs(value))}.main`}
                          >
                            {value > 0 ? '+' : ''}{formatPercentage(value)}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 1 }} />
                    AI Recommendations
                  </Typography>

                  {Object.entries(result.recommendations).map(([category, recommendation]) => (
                    <Accordion key={category} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1" textTransform="capitalize">
                          {category} Optimization
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {Object.entries(recommendation).map(([key, value]) => (
                            <Box key={key} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                                {key.replace('_', ' ')}:
                              </Typography>
                              <Typography variant="body1">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>

              {/* Implementation Steps */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Lightbulb sx={{ mr: 1 }} />
                    Implementation Steps
                  </Typography>
                  <List>
                    {result.implementation_steps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {!result && !loading && !error && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Psychology sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  AI Method Optimization Ready
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your method parameters and click "Run AI Optimization" to get intelligent recommendations for improving your GC method performance.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIMethodOptimization;