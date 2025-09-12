import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import Plot from 'react-plotly.js';

interface MethodStats {
  totalMethods: number;
  averageEfficiency: number;
  mostUsedAnalysisType: string;
  totalRuns: number;
  methodsByType: Array<{
    type: string;
    count: number;
    avgEfficiency: number;
  }>;
  efficiencyTrend: Array<{
    date: string;
    efficiency: number;
  }>;
}

interface MethodPerformanceDashboardProps {
  stats: MethodStats;
}

export const MethodPerformanceDashboard: React.FC<MethodPerformanceDashboardProps> = ({
  stats
}) => {
  const efficiencyColor = stats.averageEfficiency > 85 ? 'success' : 
                          stats.averageEfficiency > 70 ? 'warning' : 'error';

  const pieData = [{
    values: stats.methodsByType.map(m => m.count),
    labels: stats.methodsByType.map(m => m.type),
    type: 'pie' as const,
    hole: 0.4,
    marker: {
      colors: ['#1d4ed8', '#14b8a6', '#f59e0b', '#ef4444']
    }
  }];

  const trendData = [{
    x: stats.efficiencyTrend.map(d => d.date),
    y: stats.efficiencyTrend.map(d => d.efficiency),
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    line: { color: '#1d4ed8', width: 3 },
    marker: { size: 8 }
  }];

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {stats.totalMethods}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Methods
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight={600}>
                {stats.averageEfficiency}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Efficiency
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.averageEfficiency}
                color={efficiencyColor}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" fontWeight={600}>
                {stats.totalRuns}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Runs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Chip 
                label={stats.mostUsedAnalysisType}
                color="primary"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Most Used Type
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Methods by Analysis Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <Plot
                  data={pieData}
                  layout={{
                    showlegend: true,
                    margin: { l: 0, r: 0, t: 0, b: 0 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent'
                  }}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Method Efficiency Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Plot
                  data={trendData}
                  layout={{
                    xaxis: { title: 'Date', gridcolor: '#e2e8f0' },
                    yaxis: { title: 'Efficiency (%)', gridcolor: '#e2e8f0', range: [60, 100] },
                    plot_bgcolor: 'white',
                    paper_bgcolor: 'white',
                    margin: { l: 60, r: 40, t: 20, b: 60 }
                  }}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MethodPerformanceDashboard;
