/**
 * Bulletproof Performance Monitor Dashboard
 * Displays real-time performance metrics and health status for React components
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Speed,
  Error as ErrorIcon,
  CheckCircle,
  Warning,
  Memory,
  Timeline,
} from '@mui/icons-material';
import { bulletproofLogger } from '../utils/bulletproofLogger';

export const BulletproofPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState(new Map());
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(bulletproofLogger.getAllMetrics());
      setHealthStatus(bulletproofLogger.getHealthStatus());
      setLogs(bulletproofLogger.getLogs('ERROR').slice(-10));
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'degraded': return <Warning color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <Speed />;
    }
  };

  const formatNumber = (num: number) => {
    if (num < 1) return num.toFixed(3);
    if (num < 10) return num.toFixed(2);
    return num.toFixed(1);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed color="primary" />
            Bulletproof Performance Monitor
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {healthStatus && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 1 }}>
                      {getHealthIcon(healthStatus.status)}
                    </Box>
                    <Typography variant="h6">
                      <Chip 
                        label={healthStatus.status.toUpperCase()} 
                        color={getHealthColor(healthStatus.status)}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Status
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {formatNumber(healthStatus.averageRenderTime)}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Render Time
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(healthStatus.averageRenderTime, 100)} 
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color={healthStatus.errorRate > 0.1 ? "error" : "success"}>
                      {(healthStatus.errorRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={healthStatus.errorRate * 100} 
                      color={healthStatus.errorRate > 0.1 ? "error" : "success"}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="secondary">
                      {healthStatus.totalErrors}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Errors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {/* Component Metrics Table */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Component Performance Metrics
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Renders</TableCell>
                    <TableCell align="right">Avg Time (ms)</TableCell>
                    <TableCell align="right">Errors</TableCell>
                    <TableCell align="right">Cache Hit Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(metrics.entries()).map(([component, data]: [string, any]) => {
                    const cacheTotal = data.cacheHits + data.cacheMisses;
                    const hitRate = cacheTotal > 0 ? (data.cacheHits / cacheTotal * 100) : 0;
                    
                    return (
                      <TableRow key={component}>
                        <TableCell component="th" scope="row">
                          {component}
                        </TableCell>
                        <TableCell align="right">{data.renderCount}</TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            color={data.averageRenderTime > 50 ? 'error' : 'inherit'}
                          >
                            {formatNumber(data.averageRenderTime)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            color={data.errorCount > 0 ? 'error' : 'success'}
                          >
                            {data.errorCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            color={hitRate > 80 ? 'success' : hitRate > 60 ? 'warning' : 'error'}
                          >
                            {hitRate.toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {metrics.size === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No performance data available yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Recent Errors */}
            {logs.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Recent Errors
                </Typography>
                {logs.map((log, index) => (
                  <Alert key={index} severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{log.component}:</strong> {log.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Chip 
                icon={<Memory />}
                label="Clear Metrics" 
                onClick={() => bulletproofLogger.clearMetrics()}
                clickable
                variant="outlined"
              />
              <Chip 
                icon={<Timeline />}
                label="Clear Logs" 
                onClick={() => bulletproofLogger.clearLogs()}
                clickable
                variant="outlined"
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};