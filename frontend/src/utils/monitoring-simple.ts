// Simple monitoring utilities without JSX dependencies

interface ErrorContext {
  [key: string]: any;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  context?: ErrorContext;
}

interface User {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
}

// Sentry SDK (optional dependency)
let Sentry: any = null;

try {
  const sentryModule = require('@sentry/react');
  Sentry = sentryModule;
} catch (error) {
  console.warn('Sentry SDK not available. Error tracking will use console logging only.');
}

export function initializeMonitoring() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (Sentry && sentryDsn && import.meta.env.MODE === 'production') {
    try {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.1, // 10% of transactions
        environment: import.meta.env.MODE,
        beforeSend(event: any, hint: any) {
          // Filter out non-critical errors
          if (event.exception) {
            const error = hint.originalException;
            
            // Don't send network errors in development
            if (error?.message?.includes('Network') && import.meta.env.MODE === 'development') {
              return null;
            }
            
            // Don't send validation errors
            if (error?.name === 'ValidationError') {
              return null;
            }
            
            // Don't send 404 errors
            if (error?.message?.includes('404')) {
              return null;
            }
          }
          return event;
        },
      });
      
      console.log('Sentry monitoring initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  } else {
    console.log('Sentry monitoring disabled (development mode or no DSN provided)');
  }
}

export function logError(error: Error, context?: ErrorContext) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context: context || {},
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log locally
  console.error('Application error:', errorInfo);

  // Send to Sentry if available and in production
  if (Sentry && import.meta.env.MODE === 'production') {
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }
}

export function logPerformanceMetric(metric: PerformanceMetric) {
  const metricInfo = {
    ...metric,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  // Log locally
  console.info('Performance metric:', metricInfo);

  // Send to Sentry if available
  if (Sentry) {
    Sentry.withScope((scope: any) => {
      scope.setTag('operation', metric.operation);
      if (metric.context) {
        Object.entries(metric.context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
    });
  }
}

export function logUserAction(action: string, details?: ErrorContext) {
  const actionInfo = {
    action,
    details: details || {},
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  // Log locally
  console.info('User action:', actionInfo);

  // Add breadcrumb to Sentry if available
  if (Sentry) {
    Sentry.addBreadcrumb({
      message: action,
      category: 'user_action',
      data: actionInfo,
      level: 'info',
    });
  }
}

export function setUserContext(user: Partial<User>) {
  if (Sentry) {
    Sentry.setUser({
      id: user.id?.toString(),
      email: user.email,
      username: user.full_name,
      role: user.role,
    });
  }
}

export function clearUserContext() {
  if (Sentry) {
    Sentry.setUser(null);
  }
}
