import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Alert, 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Stack,
  Chip,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon, 
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { ValidationError, ScientificValidationError } from '../utils/validation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      showDetails: false 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
    
    // Force a re-render of the entire component tree
    window.location.reload();
  };

  private handleSoftReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private getErrorType = (error: Error): { type: string; color: 'error' | 'warning' | 'info'; icon: ReactNode } => {
    if (error instanceof ScientificValidationError) {
      return {
        type: 'Scientific Validation Error',
        color: 'warning',
        icon: <ScienceIcon />
      };
    }
    
    if (error instanceof ValidationError) {
      return {
        type: 'Validation Error',
        color: 'warning',
        icon: <ErrorIcon />
      };
    }
    
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return {
        type: 'Resource Loading Error',
        color: 'info',
        icon: <RefreshIcon />
      };
    }
    
    return {
      type: 'Application Error',
      color: 'error',
      icon: <BugReportIcon />
    };
  };

  private getErrorSuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];
    
    if (error instanceof ScientificValidationError) {
      suggestions.push('Check that your input values are within typical GC operating ranges');
      suggestions.push('Refer to your instrument manual for recommended parameters');
      suggestions.push('Consider the scientific rationale: ' + error.scientificReason);
    } else if (error instanceof ValidationError) {
      suggestions.push('Verify all input fields contain valid numeric values');
      suggestions.push('Ensure required fields are not empty');
      suggestions.push('Check that array inputs have matching lengths');
    } else if (error.message.includes('network') || error.message.includes('backend')) {
      suggestions.push('Ensure the backend server is running (python backend/main.py)');
      suggestions.push('Check that the server is accessible at http://localhost:8000');
      suggestions.push('Verify no firewall is blocking the connection');
    } else if (error.name === 'ChunkLoadError') {
      suggestions.push('Clear your browser cache and reload the page');
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Check the browser console for additional details');
      suggestions.push('If the problem persists, contact technical support');
    }
    
    return suggestions;
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      const errorType = this.getErrorType(error);
      const suggestions = this.getErrorSuggestions(error);

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Error Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {errorType.icon}
                <Typography variant="h5" color={errorType.color}>
                  {errorType.type}
                </Typography>
                <Chip 
                  label={error.name} 
                  size="small" 
                  color={errorType.color}
                  variant="outlined"
                />
              </Box>

              {/* Error Message */}
              <Alert severity={errorType.color} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {error.message || 'An unexpected error occurred'}
                </Typography>
                
                {error instanceof ScientificValidationError && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    Scientific context: {error.scientificReason}
                  </Typography>
                )}
              </Alert>

              {/* Suggestions */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Suggested Solutions:
                </Typography>
                <Stack spacing={1}>
                  {suggestions.map((suggestion, index) => (
                    <Typography key={index} variant="body2" sx={{ pl: 2 }}>
                      • {suggestion}
                    </Typography>
                  ))}
                </Stack>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleSoftReset}
                  color="primary"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  color="secondary"
                >
                  Reload Application
                </Button>
              </Stack>

              {/* Technical Details (Collapsible) */}
              <Divider />
              <Box>
                <Button
                  startIcon={<ExpandMoreIcon />}
                  onClick={this.toggleDetails}
                  sx={{ 
                    transform: this.state.showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                  size="small"
                  color="inherit"
                >
                  Technical Details
                </Button>
                
                <Collapse in={this.state.showDetails}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Error Stack:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        fontSize: '0.75rem', 
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {error.stack || 'No stack trace available'}
                    </Typography>
                    
                    {this.state.errorInfo && (
                      <>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Component Stack:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          component="pre" 
                          sx={{ 
                            fontSize: '0.75rem', 
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>

              {/* Help Text */}
              <Typography variant="caption" color="text.secondary" textAlign="center">
                IntelliLab GC v1.0.0 • If this error persists, please contact technical support
              </Typography>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component wrapper for ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Lightweight error boundary for individual components
 */
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
}

export const SimpleErrorBoundary: React.FC<SimpleErrorBoundaryProps> = ({ 
  children, 
  componentName = 'Component' 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="body2">
            {componentName} failed to render. Please refresh the page.
          </Typography>
          <Button 
            size="small" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 1 }}
          >
            Refresh
          </Button>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
