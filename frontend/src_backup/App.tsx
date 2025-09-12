import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Alert, Button, Box, Typography } from '@mui/material';
import { store } from './store';
import { Provider } from 'react-redux';
import { theme } from './theme/theme';
import ProfessionalLayout from './components/Layout/ProfessionalLayout';
import MainDashboard from './components/Dashboard/MainDashboard';
import InstrumentManager from './components/Instruments/InstrumentManager';
import ChromatogramSimulator from './components/Demo/ChromatogramSimulator';
import SimpleGCOnboarding from './components/Onboarding/SimpleGCOnboarding';
import LinkedInLanding from './components/Demo/LinkedInLanding';
import MethodManager from './components/Methods/MethodManager';
import WorkflowAutomation from './components/Workflow/WorkflowAutomation';
import { GlobalDataProvider } from './store/globalDataStore';
import MasterLauncher from './components/Shell/MasterLauncher';
import Reports from './pages/Reports';
import QCCompliance from './pages/QCCompliance';
import BrandPreview from './pages/BrandPreview';
import { BrandingProvider } from './components/Shell/BrandingProvider';

// Import existing calculation tools
import DetectionLimitCalculator from './components/Tools/DetectionLimitCalculator/DetectionLimitCalculator';
import OvenRampVisualizer from './components/Tools/OvenRampVisualizer/OvenRampVisualizer';
import InletSimulator from './components/Tools/InletSimulator/InletSimulator';
import Settings from './components/Settings/Settings';

// Import Phase 6 mobile components
import { MobileHome } from './pages/Mobile/MobileHome';
import { QuickQC } from './pages/Mobile/QuickQC';
import { QuickInventory } from './pages/Mobile/QuickInventory';

// Import Phase 7 training components
import TrainingHome from './pages/Training/TrainingHome';
import ExerciseRunner from './pages/Training/ExerciseRunner';

// Import chromatography components
import { MethodRunner } from './pages/Chromatography/MethodRunner';
import CalibrationManager from './pages/Chromatography/CalibrationManager';
import QuantifyRun from './pages/Chromatography/QuantifyRun';
import SequenceBuilder from './pages/Chromatography/SequenceBuilder';
import SequenceRunner from './pages/Chromatography/SequenceRunner';
import QCDashboard from './pages/Chromatography/QCDashboard';
import QCTargetEditor from './pages/Chromatography/QCTargetEditor';
import GCSandbox from './components/Sandbox/GCSandbox';

// Import Phase 6 services
import { swRegistrar } from './sw/registrar';
import { offlineDB } from './offline/storage/db';
import { syncClient } from './offline/sync/syncClient';
import { isOfflineEnabled, isMobileCompanionEnabled, isTrainingEnabled } from './config/featureFlags';

// Create demo context
export const DemoContext = createContext({
  demoMode: false,
  toggleDemoMode: () => {}
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Error Boundary Component
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Application Error
          </Typography>
          <Typography variant="body2" gutterBottom>
            {error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Application
          </Button>
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

// Debug component to identify infinite loops
const DebugComponent: React.FC = () => {
  console.log('DebugComponent rendered at:', new Date().toISOString());
  
  useEffect(() => {
    console.log('DebugComponent mounted');
    return () => console.log('DebugComponent unmounted');
  }, []);
  
  return <div>Debug: Component Working</div>;
};

// Safe Component Wrapper
const SafeComponent: React.FC<{ 
  component: React.ComponentType<any>;
  fallback?: React.ReactNode;
  props?: any;
}> = ({ component: Component, fallback, props }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return fallback || (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="body2">
            This component is temporarily unavailable
          </Typography>
        </Alert>
      </Box>
    );
  }

  try {
    return <Component {...props} />;
  } catch (error) {
    console.error('Component error:', error);
    setHasError(true);
    return fallback || (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="body2">
            This component is temporarily unavailable
          </Typography>
        </Alert>
      </Box>
    );
  }
};

const AppContent: React.FC = () => {
  const [demoMode, setDemoMode] = useState(true); // Start in demo mode
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const toggleDemoMode = useCallback(() => {
    setDemoMode(!demoMode);
  }, [demoMode]);

  // FIXED: Memoize the initialization function to prevent infinite loops
  const initializePhase6 = useCallback(async () => {
    try {
      // Simplified initialization to prevent loops
      console.log('Initializing app...');
      
      // Initialize offline database
      if (isOfflineEnabled()) {
        try {
          await offlineDB.init();
          console.log('Offline database initialized');
        } catch (error) {
          console.warn('Offline database init failed:', error);
        }
      }

      // Initialize service worker
      if (isOfflineEnabled()) {
        try {
          await swRegistrar.register();
          console.log('Service worker registered');
        } catch (error) {
          console.warn('Service worker registration failed:', error);
        }
      }

      // Setup network monitoring
      if (isOfflineEnabled()) {
        try {
          syncClient.setupNetworkMonitoring();
          console.log('Network monitoring setup');
        } catch (error) {
          console.warn('Network monitoring setup failed:', error);
        }
      }

      setIsInitialized(true);
      console.log('App initialization complete');
    } catch (error) {
      console.error('Phase 6 initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'Initialization failed');
      setIsInitialized(true); // Continue anyway
    }
  }, []);

  useEffect(() => {
    console.log('AppContent useEffect triggered');
    initializePhase6();
  }, [initializePhase6]);

  useEffect(() => {
    console.log('AppContent mounted - Router setup complete');
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing IntelliLab GC...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Initialization Warning
          </Typography>
          <Typography variant="body2" gutterBottom>
            Some features may not be available: {initError}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <DemoContext.Provider value={{ demoMode, toggleDemoMode }}>
      <Router>
        <Routes>
          {/* Emergency fallback route for testing */}
          <Route path="/test" element={<DebugComponent />} />
          
          {/* Main Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<SafeComponent component={MainDashboard} />} />
          <Route path="/launcher" element={<SafeComponent component={MasterLauncher} />} />
          <Route path="/instruments" element={<SafeComponent component={InstrumentManager} />} />
          <Route path="/methods" element={<SafeComponent component={MethodManager} />} />
          <Route path="/reports" element={<SafeComponent component={Reports} />} />
          <Route path="/qc-compliance" element={<SafeComponent component={QCCompliance} />} />
          <Route path="/settings" element={<SafeComponent component={Settings} />} />
          
          {/* Brand Preview Route (Development Only) */}
          {process.env.NODE_ENV !== 'production' && (
            <Route path="/brand-preview" element={<SafeComponent component={BrandPreview} />} />
          )}
          
          {/* Tools Routes */}
          <Route path="/tools/detection-limit" element={<SafeComponent component={DetectionLimitCalculator} />} />
          <Route path="/tools/oven-ramp" element={<SafeComponent component={OvenRampVisualizer} />} />
          <Route path="/tools/inlet-simulator" element={<SafeComponent component={InletSimulator} />} />
          <Route path="/tools/chromatogram-simulator" element={<SafeComponent component={ChromatogramSimulator} />} />
          <Route path="/sandbox" element={<SafeComponent component={GCSandbox} />} />
          
          {/* Chromatography Routes */}
          <Route path="/chromatography/runner" element={<SafeComponent component={MethodRunner} />} />
          <Route path="/chromatography/calibration" element={<SafeComponent component={CalibrationManager} />} />
          <Route path="/chromatography/quantify" element={<SafeComponent component={QuantifyRun} />} />
          <Route path="/chromatography/sequence/builder" element={<SafeComponent component={SequenceBuilder} />} />
          <Route path="/chromatography/sequence/runner" element={<SafeComponent component={SequenceRunner} />} />
          <Route path="/chromatography/qc" element={<SafeComponent component={QCDashboard} />} />
          <Route path="/chromatography/qc/targets" element={<SafeComponent component={QCTargetEditor} />} />
          
          {/* Workflow Routes */}
          <Route path="/workflow" element={<SafeComponent component={WorkflowAutomation} />} />
          
          {/* Onboarding Routes */}
          <Route path="/onboarding" element={<SafeComponent component={SimpleGCOnboarding} />} />
          
          {/* Demo Routes */}
          <Route path="/demo" element={<SafeComponent component={LinkedInLanding} />} />
          
          {/* Phase 6 Mobile Routes */}
          {isMobileCompanionEnabled() && (
            <>
              <Route path="/m" element={<SafeComponent component={MobileHome} />} />
              <Route path="/m/qc" element={<SafeComponent component={QuickQC} />} />
              <Route path="/m/inventory" element={<SafeComponent component={QuickInventory} />} />
            </>
          )}
          
          {/* Phase 7 Training Routes */}
          {isTrainingEnabled() && (
            <>
              <Route path="/training" element={<SafeComponent component={TrainingHome} />} />
              <Route path="/training/exercise/:exerciseId" element={<SafeComponent component={ExerciseRunner} />} />
              <Route path="/training/course/:courseId" element={<SafeComponent component={TrainingHome} />} />
              <Route path="/training/lesson/:lessonId" element={<SafeComponent component={TrainingHome} />} />
            </>
          )}
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </DemoContext.Provider>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    console.log('IntelliLab GC App mounted');
    console.log('Available routes: /, /dashboard, /instruments, /methods, /analytics, /settings, /tools/*, /ai/*, /workflow/*');
    console.log('Mobile routes: /m, /m/qc, /m/inventory');
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <BrandingProvider>
              <GlobalDataProvider>
                <AppContent />
              </GlobalDataProvider>
            </BrandingProvider>
          </QueryClientProvider>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App; 