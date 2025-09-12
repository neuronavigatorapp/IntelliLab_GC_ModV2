import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Science as ScienceIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGlobalData, useWorkflowData } from '../Data/GlobalDataStore';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'method_design' | 'simulation' | 'deployment' | 'analysis' | 'maintenance' | 'calibration';
  status: 'pending' | 'active' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number; // minutes
  actualTime?: number;
  dueDate?: Date;
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
}

interface Reminder {
  id: string;
  message: string;
  time: Date;
  type: 'notification' | 'email' | 'popup';
  acknowledged: boolean;
}

interface FocusSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  breaks: number;
  completed: boolean;
}

export const WorkflowAutomation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { addWorkflow, updateWorkflow } = useWorkflowData();
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'BTEX Method Optimization',
      description: 'Optimize BTEX analysis method for better resolution',
      type: 'method_design',
      status: 'active',
      priority: 'high',
      estimatedTime: 45,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
      reminders: [
        {
          id: '1',
          message: 'BTEX method optimization due in 30 minutes',
          time: new Date(Date.now() + 1000 * 60 * 30),
          type: 'notification',
          acknowledged: false
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'GC-2030 Calibration',
      description: 'Perform routine calibration on GC-2030',
      type: 'maintenance',
      status: 'pending',
      priority: 'critical',
      estimatedTime: 60,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentSession) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentSession]);

  // Check for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        task.reminders.forEach(reminder => {
          if (reminder.time <= now && !reminder.acknowledged) {
            showNotification(reminder.message);
            reminder.acknowledged = true;
          }
        });
      });
    };

    const interval = setInterval(checkReminders, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('IntelliLab GC', { body: message });
    } else {
      alert(message); // Fallback
    }
  };

  const startFocusSession = (task: Task) => {
    const session: FocusSession = {
      id: Date.now().toString(),
      taskId: task.id,
      startTime: new Date(),
      duration: task.estimatedTime,
      breaks: 0,
      completed: false
    };
    setCurrentSession(session);
    setCurrentTask(task);
    setFocusMode(true);
    setTimer(0);
    setIsTimerRunning(true);
  };

  const pauseFocusSession = () => {
    setIsTimerRunning(false);
  };

  const resumeFocusSession = () => {
    setIsTimerRunning(true);
  };

  const endFocusSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        completed: true
      };
      // Update task with actual time
      const updatedTasks = tasks.map(task => 
        task.id === currentTask?.id 
          ? { ...task, actualTime: Math.floor(timer / 60), status: 'completed' as const }
          : task
      );
      setTasks(updatedTasks);
    }
    setCurrentSession(null);
    setCurrentTask(null);
    setFocusMode(false);
    setTimer(0);
    setIsTimerRunning(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'pending': return 'default';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'method_design': return <ScienceIcon />;
      case 'simulation': return <PlayIcon />;
      case 'deployment': return <StorageIcon />;
      case 'analysis': return <AnalyticsIcon />;
      case 'maintenance': return <BuildIcon />;
      case 'calibration': return <SettingsIcon />;
      default: return <ScienceIcon />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || '',
        description: taskData.description || '',
        type: taskData.type || 'method_design',
        status: 'pending',
        priority: taskData.priority || 'medium',
        estimatedTime: taskData.estimatedTime || 30,
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setTasks(prev => [...prev, newTask]);
    }
    setShowTaskDialog(false);
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Card sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', 
        color: 'white' 
      }}>
        <CardContent sx={{ p: isMobile ? 3 : 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TimerIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant={isMobile ? "h4" : "h3"} fontWeight={600}>
                Workflow Automation
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ opacity: 0.9 }}>
                ADHD-Optimized Task Management & Focus Tools
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Chip 
              label={focusMode ? 'Focus Mode Active' : 'Ready'} 
              color={focusMode ? 'warning' : 'success'} 
              size={isMobile ? "small" : "medium"}
            />
            {focusMode && currentTask && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Working on: {currentTask.title}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Focus Mode Panel */}
        {focusMode && currentSession && (
          <Grid item xs={12}>
            <Card sx={{ 
              border: '2px solid #f59e0b',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  🎯 Focus Session Active
                </Typography>
                
                <Box display="flex" alignItems="center" gap={3} mb={3}>
                  <Typography variant="h3" fontWeight={600} color="primary">
                    {formatTime(timer)}
                  </Typography>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {currentTask?.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated: {currentTask?.estimatedTime} min
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={isTimerRunning ? <PauseIcon /> : <PlayIcon />}
                    onClick={isTimerRunning ? pauseFocusSession : resumeFocusSession}
                    color="primary"
                    size="large"
                  >
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<StopIcon />}
                    onClick={endFocusSession}
                    color="error"
                    size="large"
                  >
                    End Session
                  </Button>
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={(timer / (currentTask?.estimatedTime || 1) / 60) * 100}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Task List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Active Tasks
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTask}
                  size={isMobile ? "medium" : "small"}
                >
                  Add Task
                </Button>
              </Box>

              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id} sx={{ mb: 2, p: 0 }}>
                    <Card sx={{ width: '100%', border: '1px solid #e2e8f0' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: getPriorityColor(task.priority) + '.main' }}>
                              {getTypeIcon(task.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={600}>
                                {task.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {task.description}
                              </Typography>
                            </Box>
                          </Box>
                          <Box display="flex" gap={1}>
                            <Chip 
                              label={task.priority} 
                              color={getPriorityColor(task.priority) as any}
                              size="small"
                            />
                            <Chip 
                              label={task.status} 
                              color={getStatusColor(task.status) as any}
                              size="small"
                            />
                          </Box>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Est: {task.estimatedTime} min
                            {task.actualTime && ` | Actual: ${task.actualTime} min`}
                          </Typography>
                          
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditTask(task)}
                            >
                              <EditIcon />
                            </IconButton>
                            {task.status === 'pending' && (
                              <Button
                                variant="contained"
                                startIcon={<PlayIcon />}
                                onClick={() => startFocusSession(task)}
                                size="small"
                                disabled={focusMode}
                              >
                                Start Focus
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ScienceIcon />}
                  onClick={() => navigate('/methods')}
                  sx={{ mb: 2 }}
                >
                  Design New Method
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PlayIcon />}
                  onClick={() => navigate('/demo/chromatogram')}
                  sx={{ mb: 2 }}
                >
                  Run Simulation
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<StorageIcon />}
                  onClick={() => navigate('/instruments')}
                  sx={{ mb: 2 }}
                >
                  Check Instruments
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom fontWeight={600}>
                Today's Stats
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tasks Completed
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {tasks.filter(t => t.status === 'completed').length}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Focus Time
                </Typography>
                <Typography variant="h4" fontWeight={600} color="primary.main">
                  {formatTime(timer)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Tasks
                </Typography>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {tasks.filter(t => t.status === 'pending').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task Dialog */}
      <Dialog 
        open={showTaskDialog} 
        onClose={() => setShowTaskDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Add New Task'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Task Title"
              defaultValue={editingTask?.title}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              defaultValue={editingTask?.description}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select defaultValue={editingTask?.type || 'method_design'}>
                    <MenuItem value="method_design">Method Design</MenuItem>
                    <MenuItem value="simulation">Simulation</MenuItem>
                    <MenuItem value="deployment">Deployment</MenuItem>
                    <MenuItem value="analysis">Analysis</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="calibration">Calibration</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select defaultValue={editingTask?.priority || 'medium'}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Estimated Time (minutes)"
              type="number"
              defaultValue={editingTask?.estimatedTime || 30}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaskDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => handleSaveTask({})}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowAutomation;
