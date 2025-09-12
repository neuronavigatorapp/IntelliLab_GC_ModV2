import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { DetectionLimit } from './pages/DetectionLimit';
import { OvenRamp } from './pages/OvenRamp';
import { InletSimulator } from './pages/InletSimulator';
import { Instruments } from './pages/Instruments';
import { LiveChromatogramDemo } from './pages/LiveChromatogramDemo';
import { routes } from './lib/routes';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentSection = () => {
    switch (location.pathname) {
      case routes.dashboard:
        return 'Dashboard';
      case routes.detectionLimit:
        return 'Detection Limit';
      case routes.ovenRamp:
        return 'Oven Ramp';
      case routes.inletSimulator:
        return 'Inlet Simulator';
      case routes.instruments:
        return 'Instruments';
      case routes.demo:
        return 'Live Demo';
      default:
        return 'Dashboard';
    }
  };

  return (
    <AppLayout
      currentPath={location.pathname}
      currentSection={getCurrentSection()}
      onNavigate={navigate}
    >
      <Routes>
        <Route path={routes.dashboard} element={<Dashboard onNavigate={navigate} />} />
        <Route path={routes.detectionLimit} element={<DetectionLimit onNavigate={navigate} />} />
        <Route path={routes.ovenRamp} element={<OvenRamp onNavigate={navigate} />} />
        <Route path={routes.inletSimulator} element={<InletSimulator onNavigate={navigate} />} />
        <Route path={routes.instruments} element={<Instruments onNavigate={navigate} />} />
        <Route path={routes.demo} element={<LiveChromatogramDemo onNavigate={navigate} />} />
        <Route path="*" element={<Dashboard onNavigate={navigate} />} />
      </Routes>
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

