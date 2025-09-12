import React from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Paper,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fab,
  Zoom,
  useScrollTrigger
} from '@mui/material';
import {
  Menu as MenuIcon,
  KeyboardArrowUp as ScrollTopIcon,
  Dashboard as DashboardIcon,
  Calculate as CalculateIcon,
  Science as ScienceIcon,
  Psychology as AIIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showScrollTop?: boolean;
}

const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  title,
  showScrollTop = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Scroll to top functionality
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Detection Limits', icon: <CalculateIcon />, path: '/tools/detection-limit' },
    { text: 'Oven Ramp', icon: <ScienceIcon />, path: '/tools/oven-ramp' },
    { text: 'AI Troubleshooting', icon: <AIIcon />, path: '/ai/troubleshooting' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Mobile Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          borderRadius: 0,
          px: 2,
          py: 1
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
            {title || 'IntelliLab GC'}
          </Typography>
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            sx={{ color: theme.palette.primary.main }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {navigationItems.map((item, index) => (
              <ListItem
                key={index}
                button
                onClick={() => {
                  // Handle navigation here
                  setMobileMenuOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          p: 2,
          pb: showScrollTop ? 8 : 2, // Extra padding for FAB
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {children}
      </Box>

      {/* Scroll to Top FAB */}
      {showScrollTop && (
        <Zoom in={trigger}>
          <Fab
            color="primary"
            size="medium"
            onClick={handleScrollToTop}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.fab
            }}
          >
            <ScrollTopIcon />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default MobileOptimizedLayout; 