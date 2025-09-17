import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControlLabel,
  Divider,
  Alert,
  AlertTitle,
  Chip,
} from '@mui/material';
import {
  Settings,
  Person,
  Notifications,
  Palette,
  Storage,
  Computer,
  Engineering,
  Download,
  Refresh,
  Check,
  Info,
} from '@mui/icons-material';

interface SettingsData {
  // User Profile
  userName: string;
  userEmail: string;
  labName: string;
  instrumentId: string;
  
  // Notifications
  enableNotifications: boolean;
  emailAlerts: boolean;
  maintenanceReminders: boolean;
  errorNotifications: boolean;
  
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  chartAnimations: boolean;
  dataRefreshInterval: number;
  
  // Data Management  
  autoSaveInterval: number;
  maxDataRetention: number; // days
  exportFormat: 'csv' | 'json' | 'xlsx';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // System
  apiTimeout: number;
  maxRetries: number;
  debugMode: boolean;
  performanceMode: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SettingsData>({
    userName: 'Dr. Sarah Chen',
    userEmail: 'sarah.chen@lab.institute.edu',
    labName: 'Advanced Analytics Laboratory',
    instrumentId: 'GC-MS-001',
    enableNotifications: true,
    emailAlerts: true,
    maintenanceReminders: true,
    errorNotifications: true,
    theme: 'light',
    sidebarCollapsed: false,
    chartAnimations: true,
    dataRefreshInterval: 30,
    autoSaveInterval: 5,
    maxDataRetention: 90,
    exportFormat: 'xlsx',
    backupFrequency: 'weekly',
    apiTimeout: 30000,
    maxRetries: 3,
    debugMode: false,
    performanceMode: false,
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('intellilab-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('intellilab-settings', JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      
      // Apply theme changes immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Close modal after successful save
      setTimeout(() => onClose(), 1000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: SettingsData = {
      userName: '',
      userEmail: '',
      labName: '',
      instrumentId: '',
      enableNotifications: true,
      emailAlerts: true,
      maintenanceReminders: true,
      errorNotifications: true,
      theme: 'light',
      sidebarCollapsed: false,
      chartAnimations: true,
      dataRefreshInterval: 30,
      autoSaveInterval: 5,
      maxDataRetention: 90,
      exportFormat: 'xlsx',
      backupFrequency: 'weekly',
      apiTimeout: 30000,
      maxRetries: 3,
      debugMode: false,
      performanceMode: false,
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'intellilab-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '800px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        System Settings
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ width: '100%', height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ minHeight: 48 }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    <span>Profile</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications fontSize="small" />
                    <span>Alerts</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Palette fontSize="small" />
                    <span>UI</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Storage fontSize="small" />
                    <span>Data</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Computer fontSize="small" />
                    <span>System</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Engineering fontSize="small" />
                    <span>Advanced</span>
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <Card>
              <CardHeader>
                <Typography variant="h6">User Profile</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your personal information and lab details
                </Typography>
              </CardHeader>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={settings.userName}
                      onChange={(e) => updateSetting('userName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={settings.userEmail}
                      onChange={(e) => updateSetting('userEmail', e.target.value)}
                      placeholder="your.email@lab.institute.edu"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Laboratory Name"
                      value={settings.labName}
                      onChange={(e) => updateSetting('labName', e.target.value)}
                      placeholder="Advanced Analytics Laboratory"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Primary Instrument ID"
                      value={settings.instrumentId}
                      onChange={(e) => updateSetting('instrumentId', e.target.value)}
                      placeholder="GC-MS-001"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={activeTab} index={1}>
            <Card>
              <CardHeader>
                <Typography variant="h6">Notification Preferences</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure how and when you receive alerts
                </Typography>
              </CardHeader>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Enable Notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Master switch for all notifications
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Divider />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailAlerts && settings.enableNotifications}
                        onChange={(e) => updateSetting('emailAlerts', e.target.checked)}
                        disabled={!settings.enableNotifications}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Email Alerts</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive notifications via email
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenanceReminders && settings.enableNotifications}
                        onChange={(e) => updateSetting('maintenanceReminders', e.target.checked)}
                        disabled={!settings.enableNotifications}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Maintenance Reminders</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Preventive maintenance scheduling alerts
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.errorNotifications && settings.enableNotifications}
                        onChange={(e) => updateSetting('errorNotifications', e.target.checked)}
                        disabled={!settings.enableNotifications}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Error Notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          System errors and critical issues
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Appearance Tab */}
          <TabPanel value={activeTab} index={2}>
            <Card>
              <CardHeader>
                <Typography variant="h6">User Interface</Typography>
                <Typography variant="body2" color="text.secondary">
                  Customize the look and behavior of the application
                </Typography>
              </CardHeader>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={settings.theme}
                        label="Theme"
                        onChange={(e) => updateSetting('theme', e.target.value)}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">System Default</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Data Refresh Interval (seconds)"
                      value={settings.dataRefreshInterval}
                      onChange={(e) => updateSetting('dataRefreshInterval', parseInt(e.target.value))}
                      inputProps={{ min: 5, max: 300 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.sidebarCollapsed}
                            onChange={(e) => updateSetting('sidebarCollapsed', e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography>Sidebar Collapsed by Default</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Start with a compact sidebar
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.chartAnimations}
                            onChange={(e) => updateSetting('chartAnimations', e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography>Chart Animations</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Animate chart transitions and updates
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Data Management Tab */}
          <TabPanel value={activeTab} index={3}>
            <Card>
              <CardHeader>
                <Typography variant="h6">Data Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure data storage, backups, and export preferences
                </Typography>
              </CardHeader>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Auto-save Interval (minutes)"
                      value={settings.autoSaveInterval}
                      onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 60 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Data Retention (days)"
                      value={settings.maxDataRetention}
                      onChange={(e) => updateSetting('maxDataRetention', parseInt(e.target.value))}
                      inputProps={{ min: 30, max: 365 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Default Export Format</InputLabel>
                      <Select
                        value={settings.exportFormat}
                        label="Default Export Format"
                        onChange={(e) => updateSetting('exportFormat', e.target.value)}
                      >
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Backup Frequency</InputLabel>
                      <Select
                        value={settings.backupFrequency}
                        label="Backup Frequency"
                        onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* System Tab */}
          <TabPanel value={activeTab} index={4}>
            <Card>
              <CardHeader>
                <Typography variant="h6">System Configuration</Typography>
                <Typography variant="body2" color="text.secondary">
                  Network, performance, and connection settings
                </Typography>
              </CardHeader>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="API Timeout (milliseconds)"
                      value={settings.apiTimeout}
                      onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
                      inputProps={{ min: 5000, max: 120000, step: 1000 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Retry Attempts"
                      value={settings.maxRetries}
                      onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.performanceMode}
                          onChange={(e) => updateSetting('performanceMode', e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Typography>Performance Mode</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Optimize for speed over visual effects
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Advanced Tab */}
          <TabPanel value={activeTab} index={5}>
            <Card>
              <CardHeader>
                <Typography variant="h6">Advanced Options</Typography>
                <Typography variant="body2" color="text.secondary">
                  Developer tools and advanced configuration
                </Typography>
              </CardHeader>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.debugMode}
                        onChange={(e) => updateSetting('debugMode', e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Debug Mode</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enable detailed logging and debug information
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Settings Management
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Download />}
                        onClick={exportSettings}
                      >
                        Export Settings
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Refresh />}
                        onClick={resetToDefaults}
                      >
                        Reset to Defaults
                      </Button>
                    </Box>
                  </Box>
                  
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <AlertTitle>Advanced Settings</AlertTitle>
                    These settings can affect system performance and stability. 
                    Only modify if you understand the implications.
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {hasChanges && (
            <Chip 
              icon={<Info />}
              label="Unsaved changes"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={saveSettings}
          disabled={!hasChanges || saving}
          variant="contained"
          startIcon={saving ? null : <Check />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;