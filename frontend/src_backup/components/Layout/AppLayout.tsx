import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Badge,
  Chip,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Science as ScienceIcon,
  Thermostat as ThermostatIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Apps as AppsIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';

const drawerWidth = 280;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Core navigation items - simplified for ADHD
  const navigationItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      description: 'Overview of your GC tools'
    },
    {
      path: '/tools/detection-limit',
      label: 'Detection Limit',
      icon: <ScienceIcon />,
      description: 'Calculate method sensitivity'
    },
    {
      path: '/tools/oven-ramp',
      label: 'Oven Ramp',
      icon: <ThermostatIcon />,
      description: 'Design temperature programs'
    },
    {
      path: '/tools/inlet-simulator',
      label: 'Inlet Simulator',
      icon: <SpeedIcon />,
      description: 'Simulate inlet performance'
    },
    {
      path: '/instruments',
      label: 'Instruments',
      icon: <BuildIcon />,
      description: 'Manage your GC instruments'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        textAlign: 'center', 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <Box sx={{ mb: 2 }}>
          <IntelliLabLogo size="medium" />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Field GC Toolkit
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? 'primary.main' : 'transparent',
                  color: isActive(item.path) ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive(item.path) ? 'primary.dark' : 'action.hover',
                  },
                  py: 2,
                  px: 3,
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive(item.path) ? 'primary.contrastText' : 'primary.main',
                  minWidth: 40 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    fontSize: '1.1rem'
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: '0.85rem',
                    color: isActive(item.path) ? 'primary.contrastText' : 'text.secondary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontSize="0.8rem">
            <strong>💡 Tip:</strong> Use Detection Limit Calculator first, then Oven Ramp Visualizer for optimal results.
          </Typography>
        </Alert>
        <Chip 
          label="Field Ready" 
          color="success" 
          size="small" 
          sx={{ width: '100%' }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <IntelliLabLogo size="small" />
            <Typography variant="h6" noWrap component="div" sx={{ ml: 2 }}>
              {navigationItems.find(item => isActive(item.path))?.label || 'IntelliLab GC'}
            </Typography>
          </Box>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: 2
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>

      {/* Mobile FAB for quick access */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="menu"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <MenuIcon />
        </Fab>
      )}
    </Box>
  );
};

export default AppLayout; 