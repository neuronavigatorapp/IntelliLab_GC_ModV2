import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  ScatterPlot,
  Download,
  Upload,
  FilterList,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  id: number;
  date: string;
  instrument: string;
  method: string;
  peak_count: number;
  resolution: number;
  efficiency: number;
  retention_time: number;
  area: number;
  height: number;
  width: number;
}

const Analytics: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    // Mock data for demonstration
    const mockData: AnalyticsData[] = [
      {
        id: 1,
        date: '2024-01-15',
        instrument: 'GC-2010 Plus',
        method: 'Standard Hydrocarbon Analysis',
        peak_count: 12,
        resolution: 1.8,
        efficiency: 95.2,
        retention_time: 2.5,
        area: 1250.5,
        height: 450.2,
        width: 0.15,
      },
      {
        id: 2,
        date: '2024-01-16',
        instrument: 'GC-2010 Plus',
        method: 'Custom Pesticide Analysis',
        peak_count: 8,
        resolution: 2.1,
        efficiency: 92.8,
        retention_time: 3.2,
        area: 890.3,
        height: 320.1,
        width: 0.18,
      },
      {
        id: 3,
        date: '2024-01-17',
        instrument: 'GC-2010 Plus',
        method: 'Standard Hydrocarbon Analysis',
        peak_count: 15,
        resolution: 1.9,
        efficiency: 94.5,
        retention_time: 2.8,
        area: 1450.7,
        height: 520.8,
        width: 0.14,
      },
      {
        id: 4,
        date: '2024-01-18',
        instrument: 'GC-2010 Plus',
        method: 'Custom Pesticide Analysis',
        peak_count: 6,
        resolution: 2.3,
        efficiency: 93.1,
        retention_time: 3.5,
        area: 720.9,
        height: 280.4,
        width: 0.19,
      },
    ];
    setAnalyticsData(mockData);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getFilteredData = () => {
    return analyticsData.filter(item => {
      const instrumentMatch = selectedInstrument === 'all' || item.instrument === selectedInstrument;
      const methodMatch = selectedMethod === 'all' || item.method === selectedMethod;
      const dateMatch = !dateRange.start || !dateRange.end || 
        (item.date >= dateRange.start && item.date <= dateRange.end);
      
      return instrumentMatch && methodMatch && dateMatch;
    });
  };

  const getChartData = () => {
    const filteredData = getFilteredData();
    return filteredData.map(item => ({
      date: item.date,
      efficiency: item.efficiency,
      resolution: item.resolution,
      peakCount: item.peak_count,
    }));
  };

  const getPieChartData = () => {
    const filteredData = getFilteredData();
    const methodCounts = filteredData.reduce((acc, item) => {
      acc[item.method] = (acc[item.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method,
      value: count,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderPerformanceMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Efficiency
            </Typography>
            <Typography variant="h4" component="div">
              {getFilteredData().reduce((sum, item) => sum + item.efficiency, 0) / getFilteredData().length || 0}%
            </Typography>
            <TrendingUp color="primary" />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Resolution
            </Typography>
            <Typography variant="h4" component="div">
              {(getFilteredData().reduce((sum, item) => sum + item.resolution, 0) / getFilteredData().length || 0).toFixed(2)}
            </Typography>
            <Assessment color="primary" />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Peaks
            </Typography>
            <Typography variant="h4" component="div">
              {getFilteredData().reduce((sum, item) => sum + item.peak_count, 0)}
            </Typography>
            <BarChart color="primary" />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Analysis Count
            </Typography>
            <Typography variant="h4" component="div">
              {getFilteredData().length}
            </Typography>
            <Timeline color="primary" />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEfficiencyChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Efficiency Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="efficiency" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderResolutionChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Resolution vs Peak Count
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="resolution" fill="#82ca9d" />
            <Bar dataKey="peakCount" fill="#8884d8" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderMethodDistribution = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Method Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={getPieChartData()}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {getPieChartData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderDataTable = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Detailed Analysis Data
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Instrument</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Peak Count</TableCell>
                <TableCell>Resolution</TableCell>
                <TableCell>Efficiency (%)</TableCell>
                <TableCell>Retention Time</TableCell>
                <TableCell>Area</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredData().map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.instrument}</TableCell>
                  <TableCell>{row.method}</TableCell>
                  <TableCell>{row.peak_count}</TableCell>
                  <TableCell>{row.resolution.toFixed(2)}</TableCell>
                  <TableCell>{row.efficiency.toFixed(1)}</TableCell>
                  <TableCell>{row.retention_time.toFixed(1)}</TableCell>
                  <TableCell>{row.area.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Instrument</InputLabel>
                <Select
                  value={selectedInstrument}
                  onChange={(e) => setSelectedInstrument(e.target.value)}
                  label="Instrument"
                >
                  <MenuItem value="all">All Instruments</MenuItem>
                  <MenuItem value="GC-2010 Plus">GC-2010 Plus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  label="Method"
                >
                  <MenuItem value="all">All Methods</MenuItem>
                  <MenuItem value="Standard Hydrocarbon Analysis">Standard Hydrocarbon Analysis</MenuItem>
                  <MenuItem value="Custom Pesticide Analysis">Custom Pesticide Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSelectedInstrument('all');
                  setSelectedMethod('all');
                  setDateRange({ start: '', end: '' });
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {renderPerformanceMetrics()}

      {/* Tabs for different views */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Charts" />
          <Tab label="Data Table" />
        </Tabs>

        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {renderEfficiencyChart()}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderResolutionChart()}
            </Grid>
            <Grid item xs={12} md={12}>
              {renderMethodDistribution()}
            </Grid>
          </Grid>
        )}

        {selectedTab === 1 && (
          <Box>
            {renderDataTable()}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Analytics; 