import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AppLayout } from './layouts/AppLayout';
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
      <AppLayout
        currentPath="/"
        currentSection="Dashboard"
        onNavigate={(path) => console.log('Navigate to:', path)}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">IntelliLab GC</h1>
          <p className="text-muted-foreground">Professional Gas Chromatography Platform</p>
        </div>
      </AppLayout>
    </ErrorBoundary>
  </React.StrictMode>
);

