import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Fab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  Thermostat as ThermostatIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  LibraryBooks as LibraryBooksIcon,
  Compare as CompareIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Apps as AppsIcon,
  Widgets as WidgetsIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewComfy as ViewComfyIcon,
  ViewCompact as ViewCompactIcon,
  ViewStream as ViewStreamIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewCarousel as ViewCarouselIcon,
  ViewQuilt as ViewQuiltIcon,
  ViewArray as ViewArrayIcon,
  ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { instrumentsAPI } from '../../services/apiService';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import { LogoLoader } from '../Loading/LogoLoader';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentCalculations, setRecentCalculations] = useState<any[]>([]);

  // Load instruments on mount
  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      setLoading(true);
      const response = await instrumentsAPI.getAll();
      setInstruments(response.data || []);
    } catch (error) {
      console.error('Error loading instruments:', error);
      // Use sample data for field testing
      setInstruments([
        { id: 1, name: 'PDH-GC001', model: 'Agilent 7890A', maintenance_level: 'Excellent' },
        { id: 2, name: 'PDH-GC002', model: 'Agilent 7890B', maintenance_level: 'Good' },
        { id: 3, name: 'IBDH-GC001', model: 'Shimadzu 2030', maintenance_level: 'Excellent' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Core tool cards with large, clear buttons
  const coreTools = [
    {
      id: 'detection-limit',
      title: 'Detection Limit Calculator',
      description: 'Calculate detection limits for your GC method',
      icon: <ScienceIcon sx={{ fontSize: 48 }} />,
      color: '#2196F3',
      path: '/tools/detection-limit'
    },
    {
      id: 'oven-ramp',
      title: 'Oven Ramp Visualizer',
      description: 'Design and optimize temperature programs',
      icon: <ThermostatIcon sx={{ fontSize: 48 }} />,
      color: '#FF9800',
      path: '/tools/oven-ramp'
    },
    {
      id: 'inlet-simulator',
      title: 'Inlet Simulator',
      description: 'Simulate inlet performance and transfer efficiency',
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      color: '#4CAF50',
      path: '/tools/inlet-simulator'
    },
    {
      id: 'instruments',
      title: 'Instrument Management',
      description: 'Manage your GC instruments and maintenance',
      icon: <BuildIcon sx={{ fontSize: 48 }} />,
      color: '#9C27B0',
      path: '/instruments'
    }
  ];

  // Phase 6 Advanced Workflow features
  const workflowFeatures = [
    {
      id: 'templates',
      title: 'Method Templates',
      description: 'Save and reuse method configurations',
      icon: <LibraryBooksIcon sx={{ fontSize: 40 }} />,
      color: '#FF5722',
      path: '/workflow/templates',
      badge: 'New'
    },
    {
      id: 'comparison',
      title: 'Method Comparison',
      description: 'Compare methods side-by-side',
      icon: <CompareIcon sx={{ fontSize: 40 }} />,
      color: '#607D8B',
      path: '/workflow/comparison',
      badge: 'New'
    },
    {
      id: 'reports',
      title: 'Report Generator',
      description: 'Generate professional reports',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: '#3F51B5',
      path: '/workflow/reports',
      badge: 'New'
    },
    {
      id: 'samples',
      title: 'Sample Tracker',
      description: 'Track samples and chain of custody',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#009688',
      path: '/workflow/samples',
      badge: 'New'
    },
    {
      id: 'costs',
      title: 'Cost Calculator',
      description: 'Calculate method costs and optimize',
      icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
      color: '#795548',
      path: '/workflow/costs',
      badge: 'New'
    }
  ];

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'success';
      case 'Good': return 'success';
      case 'Fair': return 'warning';
      case 'Poor': return 'error';
      case 'Neglected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'Excellent':
      case 'Good':
        return <CheckCircleIcon />;
      case 'Fair':
        return <WarningIcon />;
      case 'Poor':
      case 'Neglected':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <IntelliLabLogo size="large" />
        <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
          Welcome to Your GC Laboratory
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Professional Gas Chromatography Analysis Platform
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your field-ready GC calculation and optimization tools
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <ScienceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              {instruments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Instruments
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              {instruments.filter(inst => ['Excellent', 'Good'].includes(inst.maintenance_level)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Good Condition
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <BuildIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              {instruments.filter(inst => ['Fair', 'Poor', 'Neglected'].includes(inst.maintenance_level)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need Attention
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <AssessmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              4
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tools Available
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Core Tools - Large, Clear Cards */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        🛠️ Core Tools
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {coreTools.map((tool) => (
          <Grid item xs={12} sm={6} md={3} key={tool.id}>
            <Card 
              sx={{ 
                height: 200, 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  border: `2px solid ${tool.color}`
                }
              }}
              onClick={() => navigate(tool.path)}
            >
              <CardContent sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                p: 3
              }}>
                <Box sx={{ color: tool.color, mb: 2 }}>
                  {tool.icon}
                </Box>
                <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {tool.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tool.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Advanced Workflow Features */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        🚀 Advanced Workflows
        <Chip label="Phase 6" size="small" color="warning" sx={{ ml: 2 }} />
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {workflowFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={feature.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  bgcolor: feature.color + '10'
                }
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ textAlign: 'center', flexGrow: 1, p: 3 }}>
                <Box sx={{ color: feature.color, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {feature.title}
                  {feature.badge && (
                    <Chip 
                      label={feature.badge} 
                      size="small" 
                      color="warning" 
                      sx={{ ml: 1, fontSize: '0.7rem' }} 
                    />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {feature.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    borderColor: feature.color,
                    color: feature.color,
                    '&:hover': {
                      backgroundColor: feature.color + '20',
                      borderColor: feature.color
                    }
                  }}
                >
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Instruments Overview */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        🧪 Your Instruments
      </Typography>
      <Grid container spacing={3}>
        {instruments.map((instrument) => (
          <Grid item xs={12} sm={6} md={4} key={instrument.id}>
            <Card sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => navigate('/instruments')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {instrument.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {instrument.model}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(instrument.maintenance_level)}
                    label={instrument.maintenance_level}
                    color={getStatusColor(instrument.maintenance_level) as any}
                    size="small"
                  />
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/instruments');
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          ⚡ Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ScienceIcon />}
              onClick={() => navigate('/tools/detection-limit')}
              sx={{ py: 2 }}
            >
              Calculate Detection Limit
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ThermostatIcon />}
              onClick={() => navigate('/tools/oven-ramp')}
              sx={{ py: 2 }}
            >
              Design Oven Program
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SpeedIcon />}
              onClick={() => navigate('/tools/inlet-simulator')}
              sx={{ py: 2 }}
            >
              Simulate Inlet
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<BuildIcon />}
              onClick={() => navigate('/instruments')}
              sx={{ py: 2 }}
            >
              Manage Instruments
            </Button>
          </Grid>
        </Grid>
        
        {/* Phase 6 Quick Actions */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
          🚀 Advanced Workflow Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LibraryBooksIcon />}
              onClick={() => navigate('/workflow/templates')}
              sx={{ py: 2, borderColor: '#FF5722', color: '#FF5722' }}
            >
              Browse Templates
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/workflow/reports')}
              sx={{ py: 2, borderColor: '#3F51B5', color: '#3F51B5' }}
            >
              Generate Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/workflow/samples')}
              sx={{ py: 2, borderColor: '#009688', color: '#009688' }}
            >
              Track Samples
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AttachMoneyIcon />}
              onClick={() => navigate('/workflow/costs')}
              sx={{ py: 2, borderColor: '#795548', color: '#795548' }}
            >
              Calculate Costs
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Activity & Summary */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                📋 Recent Templates
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <LibraryBooksIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Standard EPA Method 8260D"
                    secondary="VOCs analysis - Last used 2 days ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LibraryBooksIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Petrochemical BTEX Analysis"
                    secondary="Aromatics detection - Last used 5 days ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LibraryBooksIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Environmental Monitoring"
                    secondary="General screening - Last used 1 week ago"
                  />
                </ListItem>
              </List>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/workflow/templates')}
              >
                View All Templates →
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                💰 Cost Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average cost per analysis
                </Typography>
                <Typography variant="h4" color="primary">
                  $12.45
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly budget utilization
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={65} 
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2">
                  65% used ($3,250 / $5,000)
                </Typography>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/workflow/costs')}
              >
                Optimize Costs →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phase 6 Help Section */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>🚀 Phase 6 Advanced Workflows:</strong> The new workflow features enable you to save time and improve consistency:
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • <strong>Templates:</strong> Save successful method configurations and reuse them across projects
        </Typography>
        <Typography variant="body2">
          • <strong>Cost Calculator:</strong> Track and optimize your analysis costs for better budget management
        </Typography>
        <Typography variant="body2">
          • <strong>Sample Tracker:</strong> Maintain chain of custody and track sample progress in real-time
        </Typography>
        <Typography variant="body2">
          • <strong>Report Generator:</strong> Create professional reports with one click for regulatory compliance
        </Typography>
      </Alert>

      {/* Tips Section */}
      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>💡 Quick Start:</strong> Start with the Detection Limit Calculator to optimize your GC method sensitivity, 
          then use the Oven Ramp Visualizer to design efficient temperature programs. Save your successful configurations as templates for future use!
        </Typography>
      </Alert>
    </Box>
  );
};

export default Dashboard; 