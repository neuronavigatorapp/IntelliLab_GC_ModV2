import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme
} from '@mui/material';
import {
  Help as HelpIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Tune as TuneIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  status: 'info' | 'warning' | 'success';
}

interface ContextHelpProps {
  module?: string;
  showTooltip?: boolean;
}

export const ContextHelp: React.FC<ContextHelpProps> = ({ 
  module = 'general',
  showTooltip = true 
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const helpSections: Record<string, HelpSection[]> = {
    general: [
      {
        id: 'navigation',
        title: 'Navigation',
        description: 'How to navigate between modules',
        icon: <InfoIcon />,
        tips: [
          'Use the top navigation tabs to switch between modules',
          'The dashboard shows KPIs and quick access to tools',
          'Each module has its own specialized interface'
        ],
        status: 'info'
      },
      {
        id: 'data-sync',
        title: 'Data Synchronization',
        description: 'Understanding data updates',
        icon: <CheckIcon />,
        tips: [
          'Data automatically refreshes every 60 seconds',
          'Manual refresh available via the refresh button',
          'Status bar shows last sync time and system status'
        ],
        status: 'success'
      }
    ],
    simulation: [
      {
        id: 'detection-limit',
        title: 'Detection Limit Calculator',
        description: 'Calculate method sensitivity',
        icon: <ScienceIcon />,
        tips: [
          'Enter instrument parameters accurately for best results',
          'Use ASTM-compliant calculations for regulatory compliance',
          'Review optimization suggestions for method improvement'
        ],
        status: 'info'
      },
      {
        id: 'oven-ramp',
        title: 'Oven Ramp Visualizer',
        description: 'Design temperature programs',
        icon: <TuneIcon />,
        tips: [
          'Start with initial temperature and hold time',
          'Add multiple ramp steps for complex separations',
          'Monitor resolution and efficiency scores'
        ],
        status: 'info'
      },
      {
        id: 'inlet-simulator',
        title: 'Inlet Simulator',
        description: 'Simulate inlet performance',
        icon: <StorageIcon />,
        tips: [
          'Adjust split ratio for different sample types',
          'Monitor transfer efficiency and discrimination',
          'Consider liner type and condition for accuracy'
        ],
        status: 'info'
      }
    ],
    fleet: [
      {
        id: 'instrument-management',
        title: 'Instrument Management',
        description: 'Track fleet status and maintenance',
        icon: <StorageIcon />,
        tips: [
          'Add new instruments with complete specifications',
          'Monitor maintenance schedules and alerts',
          'Track performance history and calibration data'
        ],
        status: 'success'
      },
      {
        id: 'maintenance-alerts',
        title: 'Maintenance Alerts',
        description: 'Stay on top of instrument health',
        icon: <WarningIcon />,
        tips: [
          'Set up maintenance reminders and schedules',
          'Monitor vacuum integrity and component condition',
          'Address alerts promptly to prevent downtime'
        ],
        status: 'warning'
      }
    ],
    inventory: [
      {
        id: 'stock-management',
        title: 'Stock Management',
        description: 'Track consumable inventory',
        icon: <InventoryIcon />,
        tips: [
          'Set reorder thresholds for each item',
          'Monitor usage patterns and predictions',
          'Track costs and optimize purchasing'
        ],
        status: 'success'
      },
      {
        id: 'low-stock-alerts',
        title: 'Low Stock Alerts',
        description: 'Prevent stockouts',
        icon: <WarningIcon />,
        tips: [
          'Configure critical thresholds for essential items',
          'Enable auto-reorder for high-usage items',
          'Review usage predictions for planning'
        ],
        status: 'warning'
      }
    ],
    reports: [
      {
        id: 'report-generation',
        title: 'Report Generation',
        description: 'Create comprehensive reports',
        icon: <AssessmentIcon />,
        tips: [
          'Use quick reports for common scenarios',
          'Customize reports with specific parameters',
          'Export in PDF, CSV, or Excel formats'
        ],
        status: 'info'
      },
      {
        id: 'data-export',
        title: 'Data Export',
        description: 'Export data for external analysis',
        icon: <AssessmentIcon />,
        tips: [
          'Choose appropriate format for your needs',
          'Include charts and visualizations in reports',
          'Save reports for future reference'
        ],
        status: 'info'
      }
    ]
  };

  const currentSections = helpSections[module] || helpSections.general;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const helpContent = (
    <Box>
      <Typography variant="h6" gutterBottom>
        {module === 'general' ? 'General Help' : `${module.charAt(0).toUpperCase() + module.slice(1)} Help`}
      </Typography>
      
      <List>
        {currentSections.map((section) => (
          <ListItem key={section.id} sx={{ mb: 2 }}>
            <ListItemIcon sx={{ color: getStatusColor(section.status) }}>
              {section.icon}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {section.title}
                  <Chip
                    label={section.status}
                    size="small"
                    color={section.status as any}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {section.description}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {section.tips.map((tip, index) => (
                      <Typography
                        key={index}
                        component="li"
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {tip}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (!showTooltip) {
    return (
      <>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ color: 'text.secondary' }}
        >
          <HelpIcon />
        </IconButton>
        
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Contextual Help
            <Button
              onClick={handleClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              ×
            </Button>
          </DialogTitle>
          <DialogContent>
            {helpContent}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Tooltip
      title="Click for help"
      placement="top"
    >
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{ color: 'text.secondary' }}
      >
        <HelpIcon />
      </IconButton>
    </Tooltip>
  );
};

export default ContextHelp;
