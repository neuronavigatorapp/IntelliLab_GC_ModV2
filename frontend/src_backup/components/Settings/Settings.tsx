import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore,
  Save,
  Refresh,
  Notifications,
  Security,
  Storage,
  Palette,
  Language,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { toast } from 'react-hot-toast';

interface SettingsState {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
  language: string;
  timezone: string;
  apiUrl: string;
  websocketUrl: string;
  debugMode: boolean;
  dataRetention: number;
  maxFileSize: number;
}

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  
  const [settings, setSettings] = useState<SettingsState>({
    theme: theme,
    notifications: true,
    autoSave: true,
    language: 'en',
    timezone: 'UTC',
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
    websocketUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws',
    debugMode: process.env.NODE_ENV === 'development',
    dataRetention: 30,
    maxFileSize: 10,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('intellilab-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('intellilab-settings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save settings error:', error);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: SettingsState = {
      theme: 'light' as const,
      notifications: true,
      autoSave: true,
      language: 'en',
      timezone: 'UTC',
      apiUrl: 'http://localhost:8000/api/v1',
      websocketUrl: 'ws://localhost:8000/ws',
      debugMode: process.env.NODE_ENV === 'development',
      dataRetention: 30,
      maxFileSize: 10,
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const renderGeneralSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.debugMode}
                  onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                />
              }
              label="Debug Mode"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              }
              label="Auto-save Changes"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAPISettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="API URL"
              value={settings.apiUrl}
              onChange={(e) => handleSettingChange('apiUrl', e.target.value)}
              helperText="Backend API endpoint"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="WebSocket URL"
              value={settings.websocketUrl}
              onChange={(e) => handleSettingChange('websocketUrl', e.target.value)}
              helperText="Real-time communication endpoint"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDataSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Data Retention (days)"
              value={settings.dataRetention}
              onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Max File Size (MB)"
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSystemInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Version: 1.0.0
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Environment: {process.env.NODE_ENV}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Build Date: {new Date().toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              User Agent: {navigator.userAgent}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetSettings}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderGeneralSettings()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderNotificationSettings()}
        </Grid>
        <Grid item xs={12}>
          {renderAPISettings()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderDataSettings()}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSystemInfo()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
