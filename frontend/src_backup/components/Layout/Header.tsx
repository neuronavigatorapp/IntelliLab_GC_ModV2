import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { IntelliLabLogo } from '../Logo/IntelliLabLogo';
import { useContext } from 'react';
import { DemoContext } from '../../App';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: 64,
  [theme.breakpoints.down('md')]: {
    minHeight: 56,
  },
}));

const LeftSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

const RightSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, sidebarOpen }) => {
  const theme = useTheme();
  const { demoMode } = useContext(DemoContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <StyledAppBar position="fixed">
      <StyledToolbar>
        <LeftSection>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={onSidebarToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <IntelliLabLogo size="small" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, ml: 2 }}>
            IntelliLab GC Professional
          </Typography>
          
          <Chip 
            label={demoMode ? "Demo Mode" : "Professional"} 
            color={demoMode ? "default" : "success"}
            size="small"
            sx={{ ml: 2, color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }}
          />
        </LeftSection>

        <RightSection>
          <IconButton color="inherit" size="large">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </RightSection>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header; 