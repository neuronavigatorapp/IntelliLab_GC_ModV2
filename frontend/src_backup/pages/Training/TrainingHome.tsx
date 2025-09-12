import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { trainingAPI } from '../../services/apiService';
import { isTrainingEnabled } from '../../config/featureFlags';

interface Course {
  id: number;
  title: string;
  description: string;
  author: string;
  est_total_hours: number;
  difficulty: string;
  tags: string[];
  published: boolean;
  created_date: string;
}

interface UserProgress {
  course_id: number;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  avg_score: number;
  time_spent_minutes: number;
  last_activity_at?: string;
}

const TrainingHome: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTrainingEnabled()) {
      setError('Training module is not enabled');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available courses
        const coursesResponse = await trainingAPI.getLessons({ published_only: true });
        setCourses(coursesResponse.data);

        // Fetch user progress (simplified - would need actual user ID)
        const progressData: UserProgress[] = [];
        for (const course of coursesResponse.data) {
          try {
            const progressResponse = await trainingAPI.getCourseProgress(course.id, 1);
            progressData.push(progressResponse.data);
          } catch (error) {
            // Course not enrolled yet
            progressData.push({
              course_id: course.id,
              progress_percentage: 0,
              completed_lessons: 0,
              total_lessons: 0,
              avg_score: 0,
              time_spent_minutes: 0
            });
          }
        }
        setUserProgress(progressData);
        
      } catch (error) {
        console.error('Error fetching training data:', error);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProgressForCourse = (courseId: number) => {
    return userProgress.find(p => p.course_id === courseId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      case 'expert': return 'secondary';
      default: return 'default';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!isTrainingEnabled()) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Training module is not enabled. Contact your administrator to enable training features.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Training Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enhance your GC skills with interactive lessons and exercises
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AssignmentIcon color="primary" />
                <Box>
                  <Typography variant="h6">{courses.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckIcon color="success" />
                <Box>
                  <Typography variant="h6">
                    {userProgress.filter(p => p.progress_percentage === 100).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingIcon color="info" />
                <Box>
                  <Typography variant="h6">
                    {Math.round(userProgress.reduce((sum, p) => sum + p.avg_score, 0) / Math.max(userProgress.length, 1))}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="warning" />
                <Box>
                  <Typography variant="h6">
                    {formatTime(userProgress.reduce((sum, p) => sum + p.time_spent_minutes, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Course Grid */}
      <Typography variant="h5" mb={3}>Available Courses</Typography>
      
      <Grid container spacing={3}>
        {courses.map((course) => {
          const progress = getProgressForCourse(course.id);
          const isEnrolled = progress && progress.progress_percentage > 0;
          const isCompleted = progress && progress.progress_percentage === 100;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/training/course/${course.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {course.description}
                      </Typography>
                    </Box>
                    
                    {isCompleted && (
                      <Tooltip title="Completed">
                        <CheckIcon color="success" />
                      </Tooltip>
                    )}
                  </Box>

                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    <Chip 
                      label={course.difficulty} 
                      color={getDifficultyColor(course.difficulty) as any}
                      size="small"
                    />
                    {course.tags.slice(0, 2).map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" size="small" />
                    ))}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {course.author}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {course.est_total_hours} hours
                    </Typography>
                  </Box>

                  {isEnrolled && progress && (
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round(progress.progress_percentage)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress.progress_percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}

                  <Button
                    variant={isEnrolled ? "outlined" : "contained"}
                    startIcon={isEnrolled ? <PlayIcon /> : <SchoolIcon />}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/training/course/${course.id}`);
                    }}
                  >
                    {isEnrolled ? 'Continue' : 'Start Course'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {courses.length === 0 && (
        <Box textAlign="center" py={8}>
          <SchoolIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No courses available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for new training content
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TrainingHome;
