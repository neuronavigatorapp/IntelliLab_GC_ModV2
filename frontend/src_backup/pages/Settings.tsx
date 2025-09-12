import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  Folder as FolderIcon,
  Storage as DatabaseIcon,
  MonitorHeart as HealthIcon,
  CloudDownload as DownloadIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { systemAPI } from '../services/apiService';
import { toast } from 'react-hot-toast';

interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  size_mb: number;
  created: string;
  backup_time?: string;
}

interface DataLocationInfo {
  data_directory: string;
  database_path: string;
  backup_directory: string;
  database_exists: boolean;
  backup_dir_exists: boolean;
  database_size?: number;
  database_size_mb?: number;
  last_modified?: string;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  database: {
    path: string;
    exists: boolean;
    accessible: boolean;
    size: number;
    size_mb?: number;
  };
  directories: {
    data_dir: string;
    backup_dir: string;
    [key: string]: any;
  };
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dataLocation, setDataLocation] = useState<DataLocationInfo | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [backupsRes, locationRes, healthRes] = await Promise.all([
        systemAPI.listBackups(),
        systemAPI.getDataLocation(),
        systemAPI.getHealth(),
      ]);

      setBackups(backupsRes.data.backups || []);
      setDataLocation(locationRes.data.location);
      setSystemHealth(healthRes.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load system information');
      toast.error('Failed to load system information');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const response = await systemAPI.createBackup();
      toast.success(response.data.message || 'Backup created successfully');
      loadSystemInfo(); // Refresh the backup list
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to create backup';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'unhealthy': return <ErrorIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your IntelliLab GC local storage, backups, and system configuration.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <HealthIcon sx={{ mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={loadSystemInfo} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {systemHealth ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getHealthIcon(systemHealth.status)}
                    <Chip 
                      label={systemHealth.status.toUpperCase()} 
                      color={getHealthColor(systemHealth.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <DatabaseIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Database"
                        secondary={`${systemHealth.database.size_mb?.toFixed(2) || 0} MB`}
                      />
                      <ListItemSecondaryAction>
                        {systemHealth.database.accessible ? 
                          <CheckIcon color="success" /> : 
                          <ErrorIcon color="error" />
                        }
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <StorageIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Data Directory"
                        secondary={systemHealth.directories.data_dir}
                      />
                    </ListItem>
                  </List>
                </Box>
              ) : loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {/* Data Location */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <FolderIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Data Location</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton onClick={() => setInfoDialogOpen(true)}>
                    <InfoIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {dataLocation ? (
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Database"
                      secondary={dataLocation.database_path}
                    />
                    <ListItemSecondaryAction>
                      {dataLocation.database_exists ? 
                        <CheckIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Backup Directory"
                      secondary={dataLocation.backup_directory}
                    />
                    <ListItemSecondaryAction>
                      {dataLocation.backup_dir_exists ? 
                        <CheckIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {dataLocation.database_size_mb && (
                    <ListItem>
                      <ListItemText 
                        primary="Database Size"
                        secondary={`${dataLocation.database_size_mb.toFixed(2)} MB`}
                      />
                    </ListItem>
                  )}
                </List>
              ) : loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <BackupIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Backup Management</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  onClick={createBackup}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Create Backup'}
                </Button>
              </Box>

              {backups.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Filename</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backups.map((backup, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {backup.filename}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {backup.size_mb.toFixed(2)} MB
                          </TableCell>
                          <TableCell>
                            {formatDate(backup.created)}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Download backup file">
                              <IconButton size="small">
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No backups found. Create your first backup to get started.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Data Storage Information</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            IntelliLab GC stores all your data locally in a persistent SQLite database. This ensures:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Full Offline Operation"
                secondary="No internet connection required for core functionality"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Data Persistence"
                secondary="All compounds, methods, and run history are saved between sessions"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Easy Backup & Restore"
                secondary="Create timestamped backups that can be restored or transferred"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Platform Consistency"
                secondary="Same storage structure on Windows, macOS, and Linux"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>Storage Locations</Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Windows"
                secondary="C:\IntelliLab_GC\Data\"
                sx={{ fontFamily: 'monospace' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="macOS/Linux"
                secondary="~/IntelliLab_GC/Data/"
                sx={{ fontFamily: 'monospace' }}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
