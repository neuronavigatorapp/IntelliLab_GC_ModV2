import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton,
  Badge,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Notifications,
  Settings,
  AccountCircle,
  Science,
  Analytics,
  TrendingUp,
  Security
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Premium animations
const logoGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(74, 144, 226, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(74, 144, 226, 0.8)) drop-shadow(0 0 30px rgba(255, 140, 66, 0.4));
  }
`;

const statusPulse = keyframes`
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
`;

// Styled components for premium look
const PremiumToolbar = styled(Toolbar)(() => ({
  background: 'transparent',
  position: 'relative',
  zIndex: 10,
  padding: '1rem 2.5rem !important',
  minHeight: '90px !important',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const LogoContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const LogoIcon = styled(Box)(() => ({
  width: '50px',
  height: '50px',
  background: `
    linear-gradient(135deg, #4A90E2 0%, #FF8C42 100%),
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)
  `,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `
    0 4px 20px rgba(74, 144, 226, 0.4),
    inset 0 1px 0 rgba(255,255,255,0.3)
  `,
  animation: `${logoGlow} 3s ease-in-out infinite`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      conic-gradient(from 0deg, 
        transparent 0deg, 
        rgba(74, 144, 226, 0.3) 90deg, 
        rgba(255, 140, 66, 0.3) 180deg, 
        transparent 270deg
      )
    `,
    animation: 'spin 4s linear infinite',
    borderRadius: '12px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '2px',
    left: '2px',
    right: '2px',
    bottom: '2px',
    background: 'linear-gradient(135deg, #4A90E2 0%, #FF8C42 100%)',
    borderRadius: '10px',
    zIndex: 1,
  },
  '& .MuiSvgIcon-root': {
    position: 'relative',
    zIndex: 2,
    color: 'white',
    fontSize: '1.8rem',
  },
}));

const BrandText = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}));

const StatusIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  background: 'rgba(72, 187, 120, 0.2)',
  border: '1px solid rgba(72, 187, 120, 0.3)',
  borderRadius: '20px',
  backdropFilter: 'blur(10px)',
}));

const StatusDot = styled(Box)(() => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#48BB78',
  animation: `${statusPulse} 2s ease-in-out infinite`,
  boxShadow: '0 0 10px rgba(72, 187, 120, 0.6)',
}));

const ActionButton = styled(IconButton)(() => ({
  background: 'rgba(74, 144, 226, 0.1)',
  border: '1px solid rgba(74, 144, 226, 0.2)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(74, 144, 226, 0.2)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)',
  },
}));

interface PremiumHeaderProps {
  onLogoClick?: () => void;
  userName?: string;
  notifications?: number;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  onLogoClick,
  userName = "Dr. Analyst",
  notifications = 3
}) => {
  return (
    <AppBar position="static" elevation={0}>
      <PremiumToolbar>
        {/* Logo and Brand */}
        <LogoContainer onClick={onLogoClick}>
          <LogoIcon>
            <Science />
          </LogoIcon>
          <BrandText>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #4A90E2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              IntelliLab GC
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Professional Edition
            </Typography>
          </BrandText>
        </LogoContainer>

        {/* Center Status */}
        <StatusIndicator>
          <StatusDot />
          <Typography variant="body2" sx={{ color: '#48BB78', fontWeight: 600 }}>
            All Systems Online
          </Typography>
          <Analytics sx={{ color: '#48BB78', fontSize: '1.2rem' }} />
        </StatusIndicator>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Tooltip title="System Analytics">
            <ActionButton size="medium">
              <TrendingUp />
            </ActionButton>
          </Tooltip>
          
          <Tooltip title="Security Status">
            <ActionButton size="medium">
              <Security />
            </ActionButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <ActionButton size="medium">
              <Badge badgeContent={notifications} color="secondary">
                <Notifications />
              </Badge>
            </ActionButton>
          </Tooltip>

          <Tooltip title="Settings">
            <ActionButton size="medium">
              <Settings />
            </ActionButton>
          </Tooltip>

          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Senior Analyst
              </Typography>
            </Box>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, #4A90E2 0%, #FF8C42 100%)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <AccountCircle />
            </Avatar>
          </Box>
        </Box>
      </PremiumToolbar>
    </AppBar>
  );
};

export default PremiumHeader;
