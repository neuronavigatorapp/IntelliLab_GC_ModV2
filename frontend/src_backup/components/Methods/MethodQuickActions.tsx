import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TuneIcon from '@mui/icons-material/Tune';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface MethodQuickActionsProps {
  recentMethods: Array<{
    id: number;
    name: string;
    analysisType: string;
    lastUsed: string;
    efficiency: number;
  }>;
  onRunMethod: (methodId: number) => void;
  onEditMethod: (methodId: number) => void;
}

export const MethodQuickActions: React.FC<MethodQuickActionsProps> = ({
  recentMethods,
  onRunMethod,
  onEditMethod
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Methods
        </Typography>
        
        <Grid container spacing={2}>
          {recentMethods.slice(0, 3).map((method) => (
            <Grid item xs={12} md={4} key={method.id}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    cursor: 'pointer'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {method.name}
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    label={method.analysisType} 
                    size="small" 
                    color="primary" 
                  />
                  <Chip 
                    label={`${method.efficiency}% eff`} 
                    size="small" 
                    color="success" 
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last used: {method.lastUsed}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => onRunMethod(method.id)}
                  >
                    Run
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => onEditMethod(method.id)}
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MethodQuickActions;
