import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Fade,
} from '@mui/material';

interface ProfessionalTabContentProps {
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  children: React.ReactNode;
  isActive?: boolean;
}

export const ProfessionalTabContent: React.FC<ProfessionalTabContentProps> = ({
  title,
  subtitle,
  icon,
  children,
  isActive = true,
}) => {
  return (
    <Fade in={isActive} timeout={300}>
      <Paper 
        sx={{ 
          backgroundColor: 'white',
          borderRadius: '0 0 12px 12px',
          padding: '2rem',
          minHeight: '500px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Section Header */}
        <Box sx={{ marginBottom: '2rem' }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box sx={{ fontSize: '1.5rem', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
            {title}
          </Typography>
          
          <Typography 
            variant="body1"
            sx={{ 
              color: '#666',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
        
        {/* Tab Content */}
        <Box>
          {children}
        </Box>
      </Paper>
    </Fade>
  );
};

export default ProfessionalTabContent;
