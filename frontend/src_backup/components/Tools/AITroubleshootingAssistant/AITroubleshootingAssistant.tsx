import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { aiAPI } from '../../../services/apiService';

interface TroubleshootingRequest {
  problem_description: string;
  instrument_type?: string;
  detector_type?: string;
  symptoms?: string[];
  recent_changes?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

const AITroubleshootingAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI troubleshooting assistant. I can help you diagnose and solve GC instrument problems. Please describe the issue you\'re experiencing.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [problemForm, setProblemForm] = useState<TroubleshootingRequest>({
    problem_description: '',
    instrument_type: '',
    detector_type: '',
    symptoms: [],
    recent_changes: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const requestData = {
        problem_description: inputValue,
        instrument_type: problemForm.instrument_type,
        detector_type: problemForm.detector_type,
        symptoms: problemForm.symptoms,
        recent_changes: problemForm.recent_changes
      };

      const response = await aiAPI.troubleshooting(requestData);
      const aiResponse = response.data;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.advice,
        timestamp: new Date(),
        metadata: {
          confidence: aiResponse.confidence_score,
          actions: aiResponse.suggested_actions,
          context: aiResponse.problem_context
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or check your connection.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const addSymptom = (symptom: string) => {
    if (symptom && !problemForm.symptoms?.includes(symptom)) {
      setProblemForm(prev => ({
        ...prev,
        symptoms: [...(prev.symptoms || []), symptom]
      }));
    }
  };

  const removeSymptom = (symptom: string) => {
    setProblemForm(prev => ({
      ...prev,
      symptoms: prev.symptoms?.filter(s => s !== symptom) || []
    }));
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2
        }}
      >
        <Paper
          sx={{
            p: 2,
            maxWidth: '70%',
            backgroundColor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {isUser ? <PersonIcon sx={{ mr: 1 }} /> : <AIIcon sx={{ mr: 1 }} />}
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {isUser ? 'You' : 'AI Assistant'}
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          
          {message.metadata && (
            <Box sx={{ mt: 2 }}>
              {message.metadata.confidence && (
                <Chip
                  label={`Confidence: ${Math.round(message.metadata.confidence * 100)}%`}
                  color={message.metadata.confidence > 0.7 ? 'success' : 'warning'}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              
              {message.metadata.actions && message.metadata.actions.length > 0 && (
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Suggested Actions</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {message.metadata.actions.map((action: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemText primary={action} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AIIcon sx={{ mr: 2 }} />
        AI Troubleshooting Assistant
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Get instant help with GC instrument problems. Describe your issue and receive AI-powered troubleshooting advice.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chat Interface
              </Typography>
              
              <Box
                sx={{
                  height: 400,
                  overflowY: 'auto',
                  border: 1,
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  p: 2,
                  mb: 2
                }}
              >
                {messages.map(renderMessage)}
                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 2 }} />
                    <Typography variant="body2">AI is thinking...</Typography>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your GC instrument problem..."
                  disabled={isLoading}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  sx={{ minWidth: 60 }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Problem Details
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Instrument Type</InputLabel>
                <Select
                  value={problemForm.instrument_type}
                  onChange={(e) => setProblemForm(prev => ({ ...prev, instrument_type: e.target.value }))}
                  label="Instrument Type"
                >
                  <MenuItem value="Agilent">Agilent</MenuItem>
                  <MenuItem value="Shimadzu">Shimadzu</MenuItem>
                  <MenuItem value="Thermo Fisher">Thermo Fisher</MenuItem>
                  <MenuItem value="PerkinElmer">PerkinElmer</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Detector Type</InputLabel>
                <Select
                  value={problemForm.detector_type}
                  onChange={(e) => setProblemForm(prev => ({ ...prev, detector_type: e.target.value }))}
                  label="Detector Type"
                >
                  <MenuItem value="FID">FID</MenuItem>
                  <MenuItem value="ECD">ECD</MenuItem>
                  <MenuItem value="MS">MS</MenuItem>
                  <MenuItem value="TCD">TCD</MenuItem>
                  <MenuItem value="NPD">NPD</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Recent Changes"
                value={problemForm.recent_changes}
                onChange={(e) => setProblemForm(prev => ({ ...prev, recent_changes: e.target.value }))}
                placeholder="Describe any recent changes to the instrument..."
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>
                Common Symptoms
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['No peaks', 'Poor resolution', 'High baseline', 'Retention time shift', 'Ghost peaks', 'Split peaks'].map((symptom) => (
                  <Chip
                    key={symptom}
                    label={symptom}
                    onClick={() => addSymptom(symptom)}
                    variant={problemForm.symptoms?.includes(symptom) ? 'filled' : 'outlined'}
                    color={problemForm.symptoms?.includes(symptom) ? 'primary' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
              
              {problemForm.symptoms && problemForm.symptoms.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Symptoms
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {problemForm.symptoms.map((symptom) => (
                      <Chip
                        key={symptom}
                        label={symptom}
                        onDelete={() => removeSymptom(symptom)}
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AITroubleshootingAssistant; 