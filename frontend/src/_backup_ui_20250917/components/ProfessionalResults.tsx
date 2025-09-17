import React from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Alert,
  Fade,
} from '@mui/material';
import { 
  Lightbulb,
  TipsAndUpdates,
  AutoFixHigh,
  Info,
} from '@mui/icons-material';

interface ResultItem {
  id: string;
  value: string | number;
  label: string;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

interface ProfessionalResultsProps {
  title: string;
  results: ResultItem[];
  recommendation?: {
    text: string;
    type: 'success' | 'warning' | 'info' | 'error';
    icon?: 'lightbulb' | 'tips' | 'fix' | 'info';
  };
  isVisible?: boolean;
}

const getRecommendationIcon = (iconType?: string) => {
  switch (iconType) {
    case 'lightbulb':
      return <Lightbulb />;
    case 'tips':
      return <TipsAndUpdates />;
    case 'fix':
      return <AutoFixHigh />;
    default:
      return <Info />;
  }
};

const getResultColor = (color?: string) => {
  switch (color) {
    case 'success':
      return '#4caf50';
    case 'warning':
      return '#ff9800';
    case 'error':
      return '#f44336';
    default:
      return '#1976d2';
  }
};

export const ProfessionalResults: React.FC<ProfessionalResultsProps> = ({
  title,
  results,
  recommendation,
  isVisible = true,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Fade in={isVisible} timeout={500}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
          border: '1px solid #e3f2fd',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
        }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            color: '#333',
          }}
        >
          {title}
        </Typography>

        <Grid 
          container 
          spacing={2} 
          sx={{ 
            marginBottom: recommendation ? '1.5rem' : 0,
          }}
        >
          {results.map((result) => (
            <Grid item xs={12} sm={6} md={3} key={result.id}>
              <Box
                sx={{
                  backgroundColor: '#ffffff',
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: getResultColor(result.color),
                    marginBottom: '0.5rem',
                    lineHeight: 1.2,
                  }}
                >
                  {typeof result.value === 'number' 
                    ? result.value.toLocaleString() 
                    : result.value}
                  {result.unit && (
                    <Typography 
                      component="span" 
                      sx={{ 
                        fontSize: '1rem',
                        fontWeight: 400,
                        color: '#666',
                        ml: 0.5,
                      }}
                    >
                      {result.unit}
                    </Typography>
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 500,
                  }}
                >
                  {result.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {recommendation && (
          <Alert
            severity={recommendation.type}
            icon={getRecommendationIcon(recommendation.icon)}
            sx={{
              borderRadius: '8px',
              padding: '1rem',
              alignItems: 'center',
              '& .MuiAlert-icon': {
                fontSize: '1.2rem',
              },
              '& .MuiAlert-message': {
                fontSize: '0.95rem',
                lineHeight: 1.5,
              },
            }}
          >
            {recommendation.text}
          </Alert>
        )}
      </Box>
    </Fade>
  );
};

export default ProfessionalResults;

