import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Badge,
  Chip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Tune as TuneIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalData } from '../../store/globalDataStore';
import { useBranding } from './BrandingProvider';
import { useImageWithFallbackHandler } from '../../utils/useImageWithFallback';

interface TabItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const TopNav: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { kpis } = useGlobalData();
  const { logoPathPng, logoPathJpg } = useBranding();
  const { src: logoSrc, onError: logoErrorHandler } = useImageWithFallbackHandler(logoPathPng, logoPathJpg);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<null | HTMLElement>(null);

  const tabItems: TabItem[] = [
    {
      label: 'Dashboard',
      path: '/app',
      icon: <DashboardIcon />,
      badge: kpis?.openAlerts || 0
    },
    {
      label: 'Simulation',
      path: '/tools/detection-limit',
      icon: <ScienceIcon />
    },
    {
      label: 'Fleet',
      path: '/instruments',
      icon: <StorageIcon />,
      badge: kpis?.instrumentsCount || 0
    },
    {
      label: 'Methods',
      path: '/methods',
      icon: <TuneIcon />
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: <InventoryIcon />,
      badge: kpis?.lowStockCount || 0
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <AssessmentIcon />
    }
  ];

  const getCurrentTabIndex = () => {
    const currentPath = location.pathname;
    const tabIndex = tabItems.findIndex(tab => 
      currentPath === tab.path || currentPath.startsWith(tab.path + '/')
    );
    return tabIndex >= 0 ? tabIndex : 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const selectedTab = tabItems[newValue];
    if (selectedTab) {
      navigate(selectedTab.path);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleHelpMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleHelpMenuClose = () => {
    setHelpAnchorEl(null);
  };

  const handleMenuAction = (action: string) => {
    handleProfileMenuClose();
    handleHelpMenuClose();
    
    switch (action) {
      case 'profile':
        navigate('/settings');
        break;
      case 'help':
        // TODO: Open help panel
        break;
      case 'onboarding':
        // TODO: Start onboarding
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
      <Toolbar>
        {/* Logo/Brand */}
        <Box sx={{ flexGrow: 0, mr: 3, display: 'flex', alignItems: 'center' }}>
          <img 
            src={logoSrc} 
            alt="IntelliLab GC Logo" 
            className="brand-logo nav-size"
            style={{
              maxHeight: 40,
              width: 'auto',
              objectFit: 'contain',
              height: 'auto'
            }}
            onError={logoErrorHandler}
          />
        </Box>

        {/* Navigation Tabs */}
        {!isMobile && (
          <Tabs
            value={getCurrentTabIndex()}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              flexGrow: 1,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: '8px 8px 0 0',
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: 'primary.main'
              }
            }}
          >
            {tabItems.map((tab, index) => (
              <Tab
                key={tab.path}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      {tab.label}
                      {tab.badge && tab.badge > 0 && (
                        <Chip
                          label={tab.badge}
                          size="small"
                          color="error"
                          sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                }
                sx={{
                  minWidth: 'auto',
                  px: 2
                }}
              />
            ))}
          </Tabs>
        )}

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            color="inherit"
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={kpis?.openAlerts || 0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Help */}
          <IconButton
            color="inherit"
            onClick={handleHelpMenuOpen}
            sx={{ color: 'text.secondary' }}
          >
            <HelpIcon />
          </IconButton>

          {/* Profile */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ color: 'text.secondary' }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleMenuAction('profile')}>
            <AccountIcon sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('settings')}>
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>
        </Menu>

        {/* Help Menu */}
        <Menu
          anchorEl={helpAnchorEl}
          open={Boolean(helpAnchorEl)}
          onClose={handleHelpMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleMenuAction('help')}>
            <HelpIcon sx={{ mr: 1 }} />
            Help & Documentation
          </MenuItem>
          <MenuItem onClick={() => handleMenuAction('onboarding')}>
            <SettingsIcon sx={{ mr: 1 }} />
            Run Onboarding
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;
