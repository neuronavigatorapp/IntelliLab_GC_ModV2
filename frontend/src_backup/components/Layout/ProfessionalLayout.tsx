import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Science as ScienceIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Tune as TuneIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  FileOpen as FileIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import TopNav from '../Shell/TopNav';
import StatusBar from '../Shell/StatusBar';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  status: 'active' | 'idle' | 'error';
  description: string;
}

interface TopMenuItem {
  label: string;
  items: {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }[];
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // System status
  const [systemAlerts, setSystemAlerts] = useState([
    { id: '1', type: 'info', message: 'GC-2030 calibration due in 2 days', time: '2h ago' },
    { id: '2', type: 'warning', message: 'Method BTEX-2024-01 needs optimization', time: '4h ago' }
  ]);

  const modules: Module[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <AnalyticsIcon />,
      path: '/',
      color: '#1d4ed8',
      status: 'active',
      description: 'System overview and quick access'
    },
    {
      id: 'simulation',
      name: 'Simulation',
      icon: <PlayIcon />,
      path: '/demo/chromatogram',
      color: '#14b8a6',
      status: 'active',
      description: 'Real-time GC simulation'
    },
    {
      id: 'fleet',
      name: 'Fleet',
      icon: <StorageIcon />,
      path: '/instruments',
      color: '#f59e0b',
      status: 'active',
      description: 'Instrument management'
    },
    {
      id: 'methods',
      name: 'Methods',
      icon: <ScienceIcon />,
      path: '/methods',
      color: '#8b5cf6',
      status: 'active',
      description: 'Method library and optimization'
    },
    {
      id: 'workflow',
      name: 'Workflow',
      icon: <BuildIcon />,
      path: '/workflow',
      color: '#ef4444',
      status: 'active',
      description: 'ADHD-optimized task management'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: <TrendingIcon />,
      path: '/analytics',
      color: '#3b82f6',
      status: 'idle',
      description: 'Performance analytics'
    }
  ];

  const topMenuItems: TopMenuItem[] = [
    {
      label: 'File',
      items: [
        { label: 'New Method', action: () => navigate('/methods'), icon: <ScienceIcon /> },
        { label: 'Import Data', action: () => console.log('Import'), icon: <FileIcon /> },
        { label: 'Export Report', action: () => console.log('Export'), icon: <AssessmentIcon /> }
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Detection Limits', action: () => navigate('/tools/detection-limit'), icon: <TuneIcon /> },
        { label: 'Oven Optimization', action: () => navigate('/tools/oven-ramp'), icon: <BuildIcon /> },
        { label: 'Inlet Analysis', action: () => navigate('/tools/inlet-simulator'), icon: <TuneIcon /> }
      ]
    },
    {
      label: 'Analysis',
      items: [
        { label: 'Run Simulation', action: () => navigate('/demo/chromatogram'), icon: <PlayIcon /> },
        { label: 'Method Comparison', action: () => navigate('/methods'), icon: <AnalyticsIcon /> },
        { label: 'Performance Review', action: () => navigate('/analytics'), icon: <TrendingIcon /> }
      ]
    },
    {
      label: 'Fleet',
      items: [
        { label: 'Instrument Status', action: () => navigate('/instruments'), icon: <StorageIcon /> },
        { label: 'Maintenance Schedule', action: () => console.log('Maintenance'), icon: <BuildIcon /> },
        { label: 'Calibration Log', action: () => console.log('Calibration'), icon: <CheckIcon /> }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', action: () => console.log('Docs'), icon: <HelpIcon /> },
        { label: 'Tutorials', action: () => console.log('Tutorials'), icon: <HelpIcon /> },
        { label: 'Support', action: () => console.log('Support'), icon: <HelpIcon /> }
      ]
    }
  ];

  // Update active module based on current route
  useEffect(() => {
    const currentModule = modules.find(module => 
      location.pathname === module.path || location.pathname.startsWith(module.path + '/')
    );
    if (currentModule) {
      setActiveModule(currentModule.id);
    }
  }, [location.pathname]);

  const handleModuleChange = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setActiveModule(moduleId);
      navigate(module.path);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'idle': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckIcon />;
      case 'idle': return null;
      case 'error': return <ErrorIcon />;
      default: return null;
    }
  };

  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      {/* Logo Section */}
      <Box sx={{ px: 3, pb: 2 }}>
        <IntelliLabLogo size="small" />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Professional GC Platform
        </Typography>
      </Box>
      <Divider />

      {/* Module Switcher */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Modules
        </Typography>
        <List dense>
          {modules.map((module) => (
            <ListItem key={module.id} disablePadding>
              <ListItemButton
                selected={activeModule === module.id}
                onClick={() => handleModuleChange(module.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: `${module.color}15`,
                    borderLeft: `3px solid ${module.color}`,
                  },
                  '&:hover': {
                    bgcolor: `${module.color}10`,
                  }
                }}
              >
                <ListItemIcon sx={{ color: module.color, minWidth: 40 }}>
                  {module.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={module.name}
                  secondary={module.description}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
                <Chip 
                  label={module.status}
                  color={getStatusColor(module.status) as any}
                  size="small"
                  icon={getStatusIcon(module.status) as React.ReactElement}
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Quick Tools */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Quick Tools
        </Typography>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/tools/detection-limit')}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                <TuneIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Detection Limits"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/tools/oven-ramp')}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: '#f59e0b', minWidth: 40 }}>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Oven Optimization"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/tools/inlet-simulator')}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: '#14b8a6', minWidth: 40 }}>
                <TuneIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Inlet Analysis"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* System Status */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          System Status
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Chip 
            label="All Systems Online" 
            color="success" 
            size="small"
            icon={<CheckIcon />}
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
        
        {systemAlerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="caption">
              {systemAlerts.length} active alerts
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <TopNav />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Top App Bar */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)'
          }}
        >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <IntelliLabLogo size="small" />
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Top Menu Bar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {topMenuItems.map((menuItem) => (
              <Button
                key={menuItem.label}
                color="inherit"
                onClick={handleMenuClick}
                sx={{ 
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {menuItem.label}
              </Button>
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
          
          {/* Status Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" size="small">
              <Badge badgeContent={systemAlerts.length} color="warning">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Chip 
              label="Online" 
              color="success" 
              size="small"
              icon={<CheckIcon />}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Module Tabs */}
      <Paper 
        elevation={1} 
        sx={{ 
          position: 'fixed', 
          top: 64, 
          left: drawerOpen ? 280 : 0,
          right: 0,
          zIndex: theme.zIndex.drawer,
          transition: theme.transitions.create(['left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500,
            }
          }}
        >
          {modules.map((module, index) => (
            <Tab 
              key={module.id}
              label={module.name}
              icon={module.icon as React.ReactElement}
              iconPosition="start"
              sx={{ 
                color: activeModule === module.id ? module.color : 'text.secondary',
                '&.Mui-selected': {
                  color: module.color,
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Side Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 16, // Account for AppBar + Tabs
          ml: isMobile ? 0 : drawerOpen ? '280px' : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {children}
      </Box>
      
      {/* Status Bar */}
      <StatusBar />
    </Box>

      {/* Top Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          }
        }}
      >
        {topMenuItems.map((menuItem) => 
          menuItem.items.map((item, index) => (
            <MenuItem 
              key={`${menuItem.label}-${index}`}
              onClick={() => {
                item.action();
                handleMenuClose();
              }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText primary={item.label} />
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default ProfessionalLayout;
