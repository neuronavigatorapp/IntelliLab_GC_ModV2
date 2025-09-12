import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Chip,
  Container,
} from '@mui/material';
import { 
  Science, 
  CheckCircle,
  Warning,
} from '@mui/icons-material';

interface ProfessionalHeaderProps {
  backendStatus?: {
    connected: boolean;
    message: string;
  } | null;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ 
  backendStatus 
}) => {
  const formatTimestamp = () => {
    return new Date().toLocaleTimeString();
  };

  return (
    <AppBar 
      position="static" 
      sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="xl">
        <Toolbar 
          sx={{ 
            position: 'relative',
            zIndex: 2,
            padding: '2rem 0 !important',
            minHeight: 'auto !important',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          {/* Main Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Science sx={{ fontSize: '2.5rem', color: 'white' }} />
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: '2.5rem',
                fontWeight: 600,
                color: 'white',
                lineHeight: 1.2,
              }}
            >
              IntelliLab GC Platform
            </Typography>
          </Box>
          
          {/* Subtitle */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 1,
              lineHeight: 1.5,
            }}
          >
            Professional Gas Chromatography Instrumentation Toolkit
          </Typography>
          
          {/* Status Bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            {/* System Status Chip */}
            <Chip
              icon={
                backendStatus?.connected ? (
                  <CheckCircle sx={{ fontSize: '1.2em !important' }} />
                ) : (
                  <Warning sx={{ fontSize: '1.2em !important' }} />
                )
              }
              label={backendStatus?.connected ? 'System Online' : 'Backend Offline'}
              sx={{
                backgroundColor: backendStatus?.connected 
                  ? 'rgba(76, 175, 80, 0.2)' 
                  : 'rgba(255, 152, 0, 0.2)',
                color: backendStatus?.connected ? '#4caf50' : '#ff9800',
                border: backendStatus?.connected 
                  ? '1px solid rgba(76, 175, 80, 0.3)' 
                  : '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '16px',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                '& .MuiChip-icon': {
                  fontSize: '1.2em',
                },
              }}
            />
            
            {/* Last Updated */}
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8, 
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.8)',
                ml: 'auto',
              }}
            >
              Last updated: {formatTimestamp()}
            </Typography>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default ProfessionalHeader;

