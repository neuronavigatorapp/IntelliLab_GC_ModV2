import React from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper,
} from '@mui/material';
import { 
  Analytics,
  Thermostat,
  Input,
  Build,
  Storage,
  Science,
  Timeline,
  Straighten,
  Security,
  Timer,
  BugReport,
} from '@mui/icons-material';

export type ViewType = 
  | 'dashboard'
  | 'detection' 
  | 'oven' 
  | 'inlet' 
  | 'troubleshooting' 
  | 'fleet'
  | 'split'
  | 'chromatogram' 
  | 'column'
  | 'pressure'
  | 'splitless'
  | 'veteran';

interface ProfessionalNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface TabConfig {
  id: ViewType;
  label: string;
  icon: React.ReactElement;
  primary?: boolean;
}

const tabConfigs: TabConfig[] = [
  {
    id: 'detection',
    label: 'Detection Limit',
    icon: <Analytics />,
    primary: true,
  },
  {
    id: 'oven',
    label: 'Oven Ramp',
    icon: <Thermostat />,
    primary: true,
  },
  {
    id: 'inlet',
    label: 'Inlet Simulator',
    icon: <Input />,
    primary: true,
  },
  {
    id: 'troubleshooting',
    label: 'AI Troubleshooting',
    icon: <Build />,
    primary: true,
  },
  {
    id: 'fleet',
    label: 'Fleet Manager',
    icon: <Storage />,
    primary: true,
  },
  {
    id: 'split',
    label: 'Split Ratio',
    icon: <Science />,
  },
  {
    id: 'chromatogram',
    label: 'Chromatogram',
    icon: <Timeline />,
  },
  {
    id: 'column',
    label: 'Column',
    icon: <Straighten />,
  },
  {
    id: 'pressure',
    label: 'Pressure',
    icon: <Security />,
  },
  {
    id: 'splitless',
    label: 'Splitless',
    icon: <Timer />,
  },
  {
    id: 'veteran',
    label: 'Veteran Tools',
    icon: <BugReport />,
  },
];

export const ProfessionalNavigation: React.FC<ProfessionalNavigationProps> = ({
  currentView,
  onViewChange,
}) => {
  const handleTabChange = (event: React.SyntheticEvent, newValue: ViewType) => {
    onViewChange(newValue);
  };

  return (
    <Paper 
      sx={{ 
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <Tabs
        value={currentView}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          backgroundColor: 'white',
          borderRadius: '12px 12px 0 0',
          '& .MuiTabs-indicator': {
            height: '3px',
            backgroundColor: '#1976d2',
          },
          '& .MuiTabs-scrollButtons': {
            color: '#1976d2',
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        {tabConfigs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                </Box>
                {tab.label}
              </Box>
            }
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              color: '#666666',
              padding: '1rem 1.5rem',
              minHeight: 'auto',
              minWidth: 'auto',
              flexDirection: 'row',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#1976d2',
              },
              '&.Mui-selected': {
                color: '#1976d2',
                backgroundColor: '#f8f9ff',
                fontWeight: 600,
              },
              // Highlight primary tabs
              ...(tab.primary && {
                borderTop: '2px solid transparent',
                '&.Mui-selected': {
                  borderTop: '2px solid #1976d2',
                },
              }),
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );
};

export default ProfessionalNavigation;
