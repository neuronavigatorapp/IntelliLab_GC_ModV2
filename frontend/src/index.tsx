import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeMonitoring } from './utils/monitoring-simple';

// Initialize monitoring before app starts
initializeMonitoring();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log critical errors to console in development
        console.error('Root ErrorBoundary caught error:', error, errorInfo);
        
        // In production, you might want to send this to an error tracking service
        if (process.env.NODE_ENV === 'production') {
          // Example: errorTrackingService.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

