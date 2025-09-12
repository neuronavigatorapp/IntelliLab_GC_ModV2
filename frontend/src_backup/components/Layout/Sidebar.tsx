import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Science,
  TrendingUp,
  Timeline,
  Settings,
  Assessment,
  Storage,
  Build,
  Lightbulb,
  Psychology,
  Analytics,
  LibraryBooks,
  Compare,
  Description,
  Assignment,
  AttachMoney,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useBranding } from '../Shell/BrandingProvider';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
}));

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'persistent' | 'temporary';
}

const navigationItems = [
  {
    title: '🧪 GC Sandbox',
    path: '/sandbox',
    icon: <Science />,
    description: 'Virtual GC instrument builder',
  },
  {
    title: '📊 Live Demo',
    path: '/demo/chromatogram', 
    icon: <TrendingUp />,
    description: 'Interactive chromatogram simulation',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
    description: 'Overview and analytics',
  },
  {
    title: 'Instruments',
    path: '/instruments',
    icon: <Build />,
    description: 'Instrument management',
  },
  {
    title: 'Methods',
    path: '/methods',
    icon: <Storage />,
    description: 'Method management',
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: <Assessment />,
    description: 'Data analysis',
  },
];

const toolItems = [
  {
    title: 'Inlet Simulator',
    path: '/tools/inlet-simulator',
    icon: <Science />,
    description: 'Inlet optimization',
  },
  {
    title: 'Detection Limit Calculator',
    path: '/tools/detection-limit',
    icon: <TrendingUp />,
    description: 'Statistical analysis',
  },
  {
    title: 'Oven Ramp Visualizer',
    path: '/tools/oven-ramp',
    icon: <Timeline />,
    description: 'Temperature optimization',
  },
];

const aiItems = [
  {
    title: 'AI Troubleshooting',
    path: '/ai/troubleshooting',
    icon: <Lightbulb />,
    description: 'ChatGPT-like assistance',
    badge: 'AI',
  },
  {
    title: 'Predictive Maintenance',
    path: '/ai/predictive-maintenance',
    icon: <Psychology />,
    description: 'ML-powered predictions',
    badge: 'AI',
  },
  {
    title: 'Chromatogram Analysis',
    path: '/ai/chromatogram-analysis',
    icon: <Analytics />,
    description: 'AI peak diagnostics',
    badge: 'AI',
  },
];

const workflowItems = [
  {
    title: 'Method Templates',
    path: '/workflow/templates',
    icon: <LibraryBooks />,
    description: 'Reusable method templates',
    badge: 'New',
  },
  {
    title: 'Method Comparison',
    path: '/workflow/comparison',
    icon: <Compare />,
    description: 'Side-by-side analysis',
    badge: 'New',
  },
  {
    title: 'Report Generator',
    path: '/workflow/reports',
    icon: <Description />,
    description: 'Professional reports',
    badge: 'New',
  },
  {
    title: 'Sample Tracker',
    path: '/workflow/samples',
    icon: <Assignment />,
    description: 'Chain of custody',
    badge: 'New',
  },
  {
    title: 'Cost Calculator',
    path: '/workflow/costs',
    icon: <AttachMoney />,
    description: 'Method cost analysis',
    badge: 'New',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { logoPath } = useBranding();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StyledDrawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
    >
      <DrawerHeader>
        <Logo>
          <img 
            src={logoPath} 
            alt="IntelliLab GC Logo" 
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain'
            }}
            onError={(event) => {
              const img = event.currentTarget;
              if (img.src.endsWith('.png')) {
                img.src = img.src.replace('.png', '.jpg');
              }
            }}
          />
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              IntelliLab GC
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Scientific Calculator
            </Typography>
          </Box>
        </Logo>
      </DrawerHeader>

      <Box sx={{ overflow: 'auto' }}>
        {/* Main Navigation */}
        <List>
          <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Navigation
          </Typography>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Scientific Tools */}
        <List>
          <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Scientific Tools
          </Typography>
          {toolItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.secondary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'secondary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* AI-Powered Features */}
        <List>
          <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            AI Features
          </Typography>
          {aiItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.success.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.success.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'success.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.title}
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="success"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Workflow Features */}
        <List>
          <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Advanced Workflows
          </Typography>
          {workflowItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.warning.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.warning.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'warning.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.title}
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="warning"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Settings */}
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigation('/settings')}
              selected={isActive('/settings')}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.grey[200],
                },
              }}
            >
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                secondary="Application configuration"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive('/settings') ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </StyledDrawer>
  );
};

export default Sidebar; 