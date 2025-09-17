import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Add, Delete, Calculate, Analytics, DataArray, Science, Assessment } from '@mui/icons-material';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ProfessionalTabContent } from './ProfessionalTabContent';
import { ProfessionalResults } from './ProfessionalResults';
import { EnterpriseDataTable } from './EnterpriseDataTable';
import { EnterpriseStatusPanel } from './EnterpriseStatusPanel';

interface StandardReplicate {
  id: string;
  concentration: number;
  peakArea: number;
  injectionTime?: string;
}

interface StandardLevel {
  id: string;
  concentration: number;
  replicates: StandardReplicate[];
  mean?: number;
  stdev?: number;
  rsd?: number;
}

interface ValidationResults {
  lod: number;
  loq: number;
  rSquared: number;
  slope: number;
  intercept: number;
  slopeUncertainty: number;
  interceptUncertainty: number;
  snRatio: number;
  confidence: number;
  recommendation: string;
  validationStatus: 'pass' | 'warning' | 'fail';
  blankMean?: number;
  blankStdev?: number;
}

export const DetectionLimitCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [methodType, setMethodType] = useState<'3sigma' | 'blank_based' | 'calibration_curve'>('calibration_curve');
  const [replicatesPerLevel, setReplicatesPerLevel] = useState(7);
  const [blankReplicates, setBlankReplicates] = useState<StandardReplicate[]>([]);
  const [standardLevels, setStandardLevels] = useState<StandardLevel[]>([
    {
      id: '1',
      concentration: 0.1,
      replicates: Array.from({ length: 7 }, (_, i) => ({
        id: `1-${i + 1}`,
        concentration: 0.1,
        peakArea: 0,
      })),
    },
    {
      id: '2',
      concentration: 0.5,
      replicates: Array.from({ length: 7 }, (_, i) => ({
        id: `2-${i + 1}`,
        concentration: 0.5,
        peakArea: 0,
      })),
    },
    {
      id: '3',
      concentration: 1.0,
      replicates: Array.from({ length: 7 }, (_, i) => ({
        id: `3-${i + 1}`,
        concentration: 1.0,
        peakArea: 0,
      })),
    },
  ]);
  const [results, setResults] = useState<ValidationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStatistics = (values: number[]) => {
    if (values.length === 0) return { mean: 0, stdev: 0, rsd: 0 };
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const stdev = Math.sqrt(variance);
    const rsd = (stdev / mean) * 100;
    
    return { mean, stdev, rsd };
  };

  const performLinearRegression = (xValues: number[], yValues: number[]) => {
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const rSquared = Math.pow(
      (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)),
      2
    );
    
    // Calculate uncertainties
    const residualSumSquares = yValues.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * xValues[i] + intercept), 2),
      0
    );
    const standardError = Math.sqrt(residualSumSquares / (n - 2));
    const meanX = sumX / n;
    const sxx = sumXX - (sumX * sumX) / n;
    
    const slopeUncertainty = standardError / Math.sqrt(sxx);
    const interceptUncertainty = standardError * Math.sqrt((1 / n) + (meanX * meanX) / sxx);
    
    return { slope, intercept, rSquared, slopeUncertainty, interceptUncertainty };
  };

  const calculateDetectionLimits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update statistics for each standard level
      const updatedLevels = standardLevels.map(level => {
        const peakAreas = level.replicates.map(rep => rep.peakArea).filter(area => area > 0);
        if (peakAreas.length > 0) {
          const stats = calculateStatistics(peakAreas);
          return { ...level, ...stats };
        }
        return level;
      });
      
      // Prepare data for calibration curve
      const validLevels = updatedLevels.filter(level => level.mean && level.mean > 0);
      
      if (validLevels.length < 3) {
        throw new Error('At least 3 concentration levels with valid data are required');
      }
      
      const concentrations = validLevels.map(level => level.concentration);
      const meanAreas = validLevels.map(level => level.mean!);
      
      // Perform linear regression
      const regression = performLinearRegression(concentrations, meanAreas);
      
      // Calculate blank statistics if available
      let blankStats = { mean: 0, stdev: 0 };
      if (blankReplicates.length > 0) {
        const blankAreas = blankReplicates.map(rep => rep.peakArea).filter(area => area >= 0);
        if (blankAreas.length > 0) {
          blankStats = calculateStatistics(blankAreas);
        }
      }
      
      // Calculate LOD and LOQ based on method
      let lod: number, loq: number;
      
      if (methodType === 'blank_based' && blankStats.stdev > 0) {
        // LOD = blank mean + 3 * blank stdev
        // LOQ = blank mean + 10 * blank stdev
        const lodSignal = blankStats.mean + 3 * blankStats.stdev;
        const loqSignal = blankStats.mean + 10 * blankStats.stdev;
        lod = (lodSignal - regression.intercept) / regression.slope;
        loq = (loqSignal - regression.intercept) / regression.slope;
      } else if (methodType === 'calibration_curve') {
        // LOD = 3.3 * sy/x / slope
        // LOQ = 10 * sy/x / slope
        const residualSumSquares = validLevels.reduce(
          (sum, level, _i) => sum + Math.pow(level.mean! - (regression.slope * level.concentration + regression.intercept), 2),
          0
        );
        const syX = Math.sqrt(residualSumSquares / (validLevels.length - 2));
        lod = (3.3 * syX) / regression.slope;
        loq = (10 * syX) / regression.slope;
      } else {
        // 3-sigma method fallback
        const lowestLevel = validLevels[0];
        const noise = lowestLevel.stdev || 0.1;
        lod = (3 * noise * lowestLevel.concentration) / lowestLevel.mean!;
        loq = (10 * noise * lowestLevel.concentration) / lowestLevel.mean!;
      }
      
      // Calculate S/N ratio for lowest standard
      const lowestLevel = validLevels[0];
      const snRatio = lowestLevel.mean! / (lowestLevel.stdev || 1);
      
      // Determine confidence and validation status
      let confidence = 95;
      let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';
      
      if (regression.rSquared < 0.995) {
        confidence = 85;
        validationStatus = 'warning';
      }
      if (regression.rSquared < 0.99 || snRatio < 3) {
        confidence = 70;
        validationStatus = 'fail';
      }
      
      // Generate recommendation
      let recommendation = '';
      if (validationStatus === 'pass' && regression.rSquared >= 0.999) {
        recommendation = 'Excellent method validation. All criteria meet or exceed regulatory requirements. Method is suitable for quantitative analysis.';
      } else if (validationStatus === 'pass') {
        recommendation = 'Good method validation. Meets regulatory requirements with minor optimization potential for enhanced performance.';
      } else if (validationStatus === 'warning') {
        recommendation = 'Method validation shows acceptable performance but requires optimization. Consider increasing replicates or improving sample preparation.';
      } else {
        recommendation = 'Method validation failed. Significant optimization required. Check instrument performance, sample preparation, and analytical conditions.';
      }
      
      const validationResults: ValidationResults = {
        lod: Math.abs(lod),
        loq: Math.abs(loq),
        rSquared: regression.rSquared,
        slope: regression.slope,
        intercept: regression.intercept,
        slopeUncertainty: regression.slopeUncertainty,
        interceptUncertainty: regression.interceptUncertainty,
        snRatio,
        confidence,
        recommendation,
        validationStatus,
        blankMean: blankStats.mean,
        blankStdev: blankStats.stdev,
      };
      
      setResults(validationResults);
      setStandardLevels(updatedLevels);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate detection limits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addStandardLevel = () => {
    const newId = (standardLevels.length + 1).toString();
    const newLevel: StandardLevel = {
      id: newId,
      concentration: 0,
      replicates: Array.from({ length: replicatesPerLevel }, (_, i) => ({
        id: `${newId}-${i + 1}`,
        concentration: 0,
        peakArea: 0,
      })),
    };
    setStandardLevels([...standardLevels, newLevel]);
  };

  const removeStandardLevel = (id: string) => {
    setStandardLevels(standardLevels.filter(level => level.id !== id));
  };

  const updateStandardConcentration = (levelId: string, concentration: number) => {
    setStandardLevels(levels => 
      levels.map(level => 
        level.id === levelId 
          ? {
              ...level,
              concentration,
              replicates: level.replicates.map(rep => ({ ...rep, concentration }))
            }
          : level
      )
    );
  };

  const updateReplicatePeakArea = (levelId: string, replicateId: string, peakArea: number) => {
    setStandardLevels(levels =>
      levels.map(level =>
        level.id === levelId
          ? {
              ...level,
              replicates: level.replicates.map(rep =>
                rep.id === replicateId ? { ...rep, peakArea } : rep
              )
            }
          : level
      )
    );
  };

  const addBlankReplicate = () => {
    const newReplicate: StandardReplicate = {
      id: `blank-${blankReplicates.length + 1}`,
      concentration: 0,
      peakArea: 0,
    };
    setBlankReplicates([...blankReplicates, newReplicate]);
  };

  const updateBlankPeakArea = (replicateId: string, peakArea: number) => {
    setBlankReplicates(replicates =>
      replicates.map(rep => rep.id === replicateId ? { ...rep, peakArea } : rep)
    );
  };

  const generateCalibrationData = () => {
    if (!results) return [];
    
    const validLevels = standardLevels.filter(level => level.mean && level.mean > 0);
    return validLevels.map(level => ({
      concentration: level.concentration,
      peakArea: level.mean!,
      stdev: level.stdev || 0,
    }));
  };

  return (
    <ProfessionalTabContent
      title="Method Detection Limit Calculator"
      subtitle="Professional multi-step standard validation with replicant analysis for regulatory compliance and method development."
      icon={<Analytics />}
    >
      {/* Method Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science /> Method Configuration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Detection Method</InputLabel>
                <Select
                  value={methodType}
                  onChange={(e) => setMethodType(e.target.value as typeof methodType)}
                  label="Detection Method"
                >
                  <MenuItem value="calibration_curve">Calibration Curve (ICH Q2)</MenuItem>
                  <MenuItem value="blank_based">Blank-Based (EPA 40 CFR)</MenuItem>
                  <MenuItem value="3sigma">3-Sigma Method</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Replicates per Level"
                value={replicatesPerLevel}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 3;
                  setReplicatesPerLevel(Math.max(3, Math.min(20, count)));
                }}
                inputProps={{ min: 3, max: 20 }}
                helperText="3-20 replicates recommended"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                <Button
                  variant="contained"
                  onClick={calculateDetectionLimits}
                  disabled={loading}
                  startIcon={<Calculate />}
                  sx={{ minHeight: '56px' }}
                >
                  {loading ? 'Calculating...' : 'Calculate LOD/LOQ'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Standard Levels" icon={<DataArray />} />
        <Tab label="Blank Analysis" icon={<Science />} />
        <Tab label="Results" icon={<Assessment />} disabled={!results} />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Multi-Step Standards</Typography>
              <Button 
                startIcon={<Add />} 
                onClick={addStandardLevel}
                variant="outlined"
                size="small"
              >
                Add Level
              </Button>
            </Box>
            
            {standardLevels.map((level, levelIndex) => (
              <Card key={level.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Standard Level {levelIndex + 1}
                      {level.mean && (
                        <Chip 
                          label={`Mean: ${level.mean.toFixed(0)} ± ${(level.stdev || 0).toFixed(1)} (${(level.rsd || 0).toFixed(1)}% RSD)`}
                          size="small" 
                          sx={{ ml: 2 }} 
                        />
                      )}
                    </Typography>
                    <IconButton 
                      onClick={() => removeStandardLevel(level.id)}
                      size="small"
                      color="error"
                      disabled={standardLevels.length <= 3}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Concentration"
                        value={level.concentration}
                        onChange={(e) => updateStandardConcentration(level.id, parseFloat(e.target.value) || 0)}
                        inputProps={{ step: 0.01, min: 0 }}
                        InputProps={{ endAdornment: 'mg/L' }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={9}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Peak Areas (Replicates)</Typography>
                      <Grid container spacing={1}>
                        {level.replicates.map((replicate, repIndex) => (
                          <Grid item xs={6} sm={4} md={2} key={replicate.id}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label={`Rep ${repIndex + 1}`}
                              value={replicate.peakArea}
                              onChange={(e) => updateReplicatePeakArea(level.id, replicate.id, parseFloat(e.target.value) || 0)}
                              inputProps={{ step: 1, min: 0 }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Blank Analysis</Typography>
              <Button 
                startIcon={<Add />} 
                onClick={addBlankReplicate}
                variant="outlined"
                size="small"
              >
                Add Blank
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {blankReplicates.map((blank, index) => (
                <Grid item xs={6} sm={4} md={3} key={blank.id}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Blank ${index + 1}`}
                    value={blank.peakArea}
                    onChange={(e) => updateBlankPeakArea(blank.id, parseFloat(e.target.value) || 0)}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
            
            {blankReplicates.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Blank analysis is optional but recommended for blank-based LOD/LOQ calculation
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && results && (
        <>
          {/* Validation Status Panel */}
          <EnterpriseStatusPanel
            title="Method Validation Results"
            systemStatus={results.validationStatus === 'pass' ? 'online' : 'offline'}
            metrics={[
              {
                id: 'lod',
                label: 'Limit of Detection',
                value: results.lod.toFixed(4),
                unit: 'mg/L',
                status: results.lod < 0.1 ? 'excellent' : results.lod < 1.0 ? 'good' : 'warning',
                trend: 'stable',
                subtitle: 'LOD (3.3σ method)',
              },
              {
                id: 'loq',
                label: 'Limit of Quantification',
                value: results.loq.toFixed(4),
                unit: 'mg/L',
                status: results.loq < 0.5 ? 'excellent' : results.loq < 2.0 ? 'good' : 'warning',
                trend: 'stable',
                subtitle: 'LOQ (10σ method)',
              },
              {
                id: 'r-squared',
                label: 'Linearity (R²)',
                value: results.rSquared.toFixed(5),
                unit: '',
                status: results.rSquared > 0.999 ? 'excellent' : results.rSquared > 0.995 ? 'good' : 'warning',
                trend: 'stable',
                progress: results.rSquared * 100,
              },
            ]}
          />

          {/* Calibration Curve Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Calibration Curve</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={generateCalibrationData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="concentration" 
                    label={{ value: 'Concentration (mg/L)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Peak Area', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(2) : value, 
                      name
                    ]}
                  />
                  <Scatter dataKey="peakArea" fill="#1976d2" />
                </ScatterChart>
              </ResponsiveContainer>
              
              <Typography variant="body2" sx={{ mt: 1 }}>
                Equation: y = {results.slope.toFixed(2)}x + {results.intercept.toFixed(2)} (R² = {results.rSquared.toFixed(5)})
              </Typography>
            </CardContent>
          </Card>

          {/* Detailed Results Table */}
          <EnterpriseDataTable
            title="Validation Parameters"
            subtitle="Complete method validation with statistical analysis"
            showStatus={true}
            showUncertainty={true}
            data={[
              {
                id: 'lod',
                parameter: 'Limit of Detection (LOD)',
                value: results.lod.toFixed(4),
                unit: 'mg/L',
                status: results.validationStatus === 'pass' ? 'pass' : 'warning',
                uncertainty: `±${(results.lod * 0.05).toFixed(4)}`,
                method: methodType === 'calibration_curve' ? 'ICH Q2(R1)' : 'EPA 40 CFR 136',
              },
              {
                id: 'loq',
                parameter: 'Limit of Quantification (LOQ)',
                value: results.loq.toFixed(4),
                unit: 'mg/L',
                status: results.validationStatus === 'pass' ? 'pass' : 'warning',
                uncertainty: `±${(results.loq * 0.05).toFixed(4)}`,
                method: methodType === 'calibration_curve' ? 'ICH Q2(R1)' : 'EPA 40 CFR 136',
              },
              {
                id: 'slope',
                parameter: 'Calibration Slope',
                value: results.slope.toFixed(2),
                unit: 'AU·L/mg',
                status: 'pass',
                uncertainty: `±${results.slopeUncertainty.toFixed(3)}`,
                method: 'Linear Regression',
              },
              {
                id: 'intercept',
                parameter: 'Calibration Intercept',
                value: results.intercept.toFixed(2),
                unit: 'AU',
                status: Math.abs(results.intercept) < results.slope * 0.1 ? 'pass' : 'warning',
                uncertainty: `±${results.interceptUncertainty.toFixed(2)}`,
                method: 'Linear Regression',
              },
            ]}
          />

          {/* Method Recommendation */}
          <ProfessionalResults
            title="Method Validation Assessment"
            results={[
              {
                id: 'validation-status',
                value: results.validationStatus.toUpperCase(),
                label: 'Validation Status',
              },
              {
                id: 'confidence',
                value: results.confidence.toFixed(0),
                label: 'Confidence Level',
                unit: '%',
              },
              {
                id: 'sn-ratio',
                value: results.snRatio.toFixed(1),
                label: 'S/N Ratio (Lowest Standard)',
              },
            ]}
            recommendation={{
              text: results.recommendation,
              type: results.validationStatus === 'pass' ? 'success' : results.validationStatus === 'warning' ? 'info' : 'warning',
              icon: 'info',
            }}
            isVisible={true}
          />
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </ProfessionalTabContent>
  );
};
