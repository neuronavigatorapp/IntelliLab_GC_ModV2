import React, { useState } from 'react';
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
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ScienceIcon from '@mui/icons-material/Science';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import { useNavigate } from 'react-router-dom';

interface CleanLayoutProps {
  children: React.ReactNode;
}

export const CleanLayout: React.FC<CleanLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const navigationItems = [
    {
      title: 'Live Demo',
      icon: <PlayArrowIcon />,
      path: '/demo/chromatogram',
      color: '#14b8a6'
    },
    {
      title: 'My Instruments',
      icon: <StorageIcon />,
      path: '/instruments',
      color: '#f59e0b'
    },
    {
      title: 'GC Methods',
      icon: <ScienceIcon />,
      path: '/methods',
      color: '#8b5cf6'
    },
    {
      title: 'GC Tools',
      icon: <TuneIcon />,
      color: '#3b82f6',
      submenu: [
        { title: 'Detection Limits', path: '/tools/detection-limit' },
        { title: 'Oven Optimization', path: '/tools/oven-ramp' },
        { title: 'Inlet Analysis', path: '/tools/inlet-simulator' }
      ]
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      color: '#64748b'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      <Box sx={{ px: 3, pb: 2 }}>
        <IntelliLabLogo size="small" />
      </Box>
      <Divider />
      
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => (
          <Box key={item.title}>
            <ListItemButton
              onClick={() => {
                if (item.submenu) {
                  setToolsOpen(!toolsOpen);
                } else {
                  handleNavigation(item.path!);
                }
              }}
              sx={{ 
                mx: 1, 
                borderRadius: 2,
                mb: 1,
                '&:hover': { bgcolor: `${item.color}15` }
              }}
            >
              <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              {item.submenu && (toolsOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            
            {item.submenu && (
              <Collapse in={toolsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.title}
                      sx={{ pl: 6, mx: 1, borderRadius: 2 }}
                      onClick={() => handleNavigation(subItem.path)}
                    >
                      <ListItemText 
                        primary={subItem.title}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
          
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Professional GC Platform
          </Typography>
        </Toolbar>
      </AppBar>

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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: isMobile ? 0 : drawerOpen ? '280px' : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default CleanLayout;
