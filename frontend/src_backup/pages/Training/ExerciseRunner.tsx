import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Grid,
  Slider,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  Lightbulb as HintIcon,
  CheckCircle as SubmitIcon,
  Refresh as ResetIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingAPI } from '../../services/apiService';
import { ChromatogramSimulator } from '../../components/Demo/ChromatogramSimulator';

interface Exercise {
  id: number;
  lesson_id: number;
  type: 'method_setup' | 'fault_diagnosis' | 'chromatogram_qc' | 'quiz';
  difficulty: string;
  prompt: string;
  initial_state: any;
  expected_outcome: any;
  scoring_rubric: any;
  time_limit_sec?: number;
  hints: string[];
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
      id={`exercise-tabpanel-${index}`}
      aria-labelledby={`exercise-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ExerciseRunner: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const response = await trainingAPI.getExercise(parseInt(exerciseId!));
        setExercise(response.data);
        
        // Start attempt
        const attemptResponse = await trainingAPI.startAttempt(parseInt(exerciseId!), 1);
        setAttemptId(attemptResponse.data.attempt_id);
        setAnswers(attemptResponse.data.initial_state);
        
        // Set timer if time limit exists
        if (response.data.time_limit_sec) {
          setTimeRemaining(response.data.time_limit_sec);
          setIsRunning(true);
        }
        
      } catch (error) {
        console.error('Error fetching exercise:', error);
        setError('Failed to load exercise');
      } finally {
        setLoading(false);
      }
    };

    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId || !exercise) return;

    try {
      const submission = {
        exercise_id: exercise.id,
        answers,
        time_taken_sec: exercise.time_limit_sec ? exercise.time_limit_sec - timeRemaining : 0
      };

      const result = await trainingAPI.submitAttempt(submission);
      
      // Navigate to results page
      navigate(`/training/results/${result.data.attempt_id}`);
      
    } catch (error) {
      console.error('Error submitting attempt:', error);
      setError('Failed to submit attempt');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMethodSetupWorkspace = () => {
    if (!exercise) return null;

    const { oven, inlet, detector } = answers;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Oven Settings</Typography>
              
              <TextField
                fullWidth
                label="Initial Temperature (°C)"
                type="number"
                value={oven?.initial_temp || ''}
                onChange={(e) => handleAnswerChange('oven', {
                  ...oven,
                  initial_temp: parseFloat(e.target.value)
                })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Final Temperature (°C)"
                type="number"
                value={oven?.final_temp || ''}
                onChange={(e) => handleAnswerChange('oven', {
                  ...oven,
                  final_temp: parseFloat(e.target.value)
                })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Ramp Rate (°C/min)"
                type="number"
                value={oven?.ramp_rate || ''}
                onChange={(e) => handleAnswerChange('oven', {
                  ...oven,
                  ramp_rate: parseFloat(e.target.value)
                })}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Inlet Settings</Typography>
              
              <TextField
                fullWidth
                label="Temperature (°C)"
                type="number"
                value={inlet?.temperature || ''}
                onChange={(e) => handleAnswerChange('inlet', {
                  ...inlet,
                  temperature: parseFloat(e.target.value)
                })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Split Ratio"
                type="number"
                value={inlet?.split_ratio || ''}
                onChange={(e) => handleAnswerChange('inlet', {
                  ...inlet,
                  split_ratio: parseFloat(e.target.value)
                })}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Detector Settings</Typography>
              
              <TextField
                fullWidth
                label="Temperature (°C)"
                type="number"
                value={detector?.temperature || ''}
                onChange={(e) => handleAnswerChange('detector', {
                  ...detector,
                  temperature: parseFloat(e.target.value)
                })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Flow Rate (mL/min)"
                type="number"
                value={detector?.flow || ''}
                onChange={(e) => handleAnswerChange('detector', {
                  ...detector,
                  flow: parseFloat(e.target.value)
                })}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFaultDiagnosisWorkspace = () => {
    if (!exercise) return null;

    const causes = [
      'contaminated_inlet',
      'dirty_column',
      'degraded_septum',
      'leaking_fittings',
      'poor_sample_preparation',
      'incorrect_method_parameters'
    ];

    const solutions = [
      'replace_septum',
      'clean_inlet',
      'condition_column',
      'check_fittings',
      'improve_sample_prep',
      'optimize_method'
    ];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Likely Causes</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Select all that apply:
              </Typography>
              
              {causes.map((cause) => (
                <FormControlLabel
                  key={cause}
                  control={
                    <Checkbox
                      checked={answers.causes?.includes(cause) || false}
                      onChange={(e) => {
                        const currentCauses = answers.causes || [];
                        const newCauses = e.target.checked
                          ? [...currentCauses, cause]
                          : currentCauses.filter((c: string) => c !== cause);
                        handleAnswerChange('causes', newCauses);
                      }}
                    />
                  }
                  label={cause.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recommended Solutions</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Select all that apply:
              </Typography>
              
              {solutions.map((solution) => (
                <FormControlLabel
                  key={solution}
                  control={
                    <Checkbox
                      checked={answers.solutions?.includes(solution) || false}
                      onChange={(e) => {
                        const currentSolutions = answers.solutions || [];
                        const newSolutions = e.target.checked
                          ? [...currentSolutions, solution]
                          : currentSolutions.filter((s: string) => s !== solution);
                        handleAnswerChange('solutions', newSolutions);
                      }}
                    />
                  }
                  label={solution.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderChromatogramQCWorkspace = () => {
    if (!exercise) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Chromatogram Analysis</Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Interactive Chromatogram Simulator
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Use the simulator below to analyze the chromatogram and answer the questions.
            </Typography>
            
            <ChromatogramSimulator />
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Retention Time Measurements</Typography>
                
                <TextField
                  fullWidth
                  label="Benzene RT (min)"
                  type="number"
                  value={answers.retention_times?.benzene || ''}
                  onChange={(e) => handleAnswerChange('retention_times', {
                    ...answers.retention_times,
                    benzene: parseFloat(e.target.value)
                  })}
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Toluene RT (min)"
                  type="number"
                  value={answers.retention_times?.toluene || ''}
                  onChange={(e) => handleAnswerChange('retention_times', {
                    ...answers.retention_times,
                    toluene: parseFloat(e.target.value)
                  })}
                  margin="normal"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Peak Analysis</Typography>
                
                <FormControl component="fieldset" fullWidth>
                  <Typography variant="subtitle2" gutterBottom>
                    Peak Identification
                  </Typography>
                  {['benzene', 'toluene', 'ethylbenzene', 'xylene'].map((peak) => (
                    <FormControlLabel
                      key={peak}
                      control={
                        <Checkbox
                          checked={answers.peak_identification?.includes(peak) || false}
                          onChange={(e) => {
                            const currentPeaks = answers.peak_identification || [];
                            const newPeaks = e.target.checked
                              ? [...currentPeaks, peak]
                              : currentPeaks.filter((p: string) => p !== peak);
                            handleAnswerChange('peak_identification', newPeaks);
                          }}
                        />
                      }
                      label={peak.charAt(0).toUpperCase() + peak.slice(1)}
                    />
                  ))}
                </FormControl>

                <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Baseline Drift Detected?
                  </Typography>
                  <RadioGroup
                    value={answers.drift_detected || ''}
                    onChange={(e) => handleAnswerChange('drift_detected', e.target.value === 'true')}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="Yes" />
                    <FormControlLabel value="false" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderQuizWorkspace = () => {
    if (!exercise) return null;

    // Sample quiz questions (in real implementation, these would come from the exercise)
    const questions = [
      {
        id: 'q1',
        question: 'What is the primary function of the split ratio in GC?',
        type: 'text'
      },
      {
        id: 'q2',
        question: 'Which of the following affects retention time?',
        type: 'multiple_choice',
        options: ['Column temperature', 'Split ratio', 'Detector type', 'Sample volume']
      },
      {
        id: 'q3',
        question: 'What causes peak tailing?',
        type: 'multiple_choice',
        options: ['High temperature', 'Contaminated inlet', 'Low flow rate', 'All of the above']
      }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Quiz Questions</Typography>
        
        {questions.map((q, index) => (
          <Card key={q.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Question {index + 1}: {q.question}
              </Typography>
              
              {q.type === 'text' ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              ) : (
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  >
                    {q.options?.map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderWorkspace = () => {
    if (!exercise) return null;

    switch (exercise.type) {
      case 'method_setup':
        return renderMethodSetupWorkspace();
      case 'fault_diagnosis':
        return renderFaultDiagnosisWorkspace();
      case 'chromatogram_qc':
        return renderChromatogramQCWorkspace();
      case 'quiz':
        return renderQuizWorkspace();
      default:
        return <Typography>Unknown exercise type</Typography>;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading exercise...</Typography>
      </Box>
    );
  }

  if (error || !exercise) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Exercise not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {exercise.prompt}
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            <Chip label={exercise.difficulty} color="primary" size="small" />
            <Chip label={exercise.type.replace(/_/g, ' ')} variant="outlined" size="small" />
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          {exercise.hints.length > 0 && (
            <Tooltip title="Show Hints">
              <IconButton onClick={() => setShowHints(!showHints)}>
                <HintIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={() => setAnswers(exercise.initial_state)}
          >
            Reset
          </Button>
          
          <Button
            variant="contained"
            startIcon={<SubmitIcon />}
            onClick={() => setShowSubmitDialog(true)}
          >
            Submit
          </Button>
        </Box>
      </Box>

      {/* Timer */}
      {exercise.time_limit_sec && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <TimerIcon color="warning" />
              <Typography variant="h6">
                Time Remaining: {formatTime(timeRemaining)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(timeRemaining / exercise.time_limit_sec) * 100}
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Hints */}
      {showHints && exercise.hints.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Hints:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {exercise.hints.map((hint, index) => (
              <li key={index}>
                <Typography variant="body2">{hint}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Exercise Tabs */}
      <Card>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Prompt" />
          <Tab label="Workspace" />
          <Tab label="Review" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {exercise.prompt}
          </Typography>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {renderWorkspace()}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>Review Your Answers</Typography>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(answers, null, 2)}
          </pre>
        </TabPanel>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Exercise</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your answers? You cannot change them after submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExerciseRunner;
