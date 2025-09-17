import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Import new greenfield pages
import { Home } from './pages/Home';
import { Sandbox } from './pages/Sandbox';
import { Troubleshooter } from './pages/Troubleshooter';
import { Simulators } from './pages/Simulators';
import { OCR } from './pages/OCR';
import { Validity } from './pages/Validity';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentSection = () => {
    switch (location.pathname) {
      case '/':
        return 'Home';
      case '/sandbox':
        return 'GC Sandbox';
      case '/troubleshooter':
        return 'AI Troubleshooter';
      case '/simulators':
      case '/detection-limit':
      case '/oven-ramp':
      case '/inlet-simulator':
        return 'Simulators';
      case '/ocr':
        return 'OCR Vision';
      case '/validity':
        return 'System Validity';
      default:
        return 'IntelliLab GC';
    }
  };

  return (
    <Layout
      currentPath={location.pathname}
      currentSection={getCurrentSection()}
      onNavigate={navigate}
    >
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/troubleshooter" element={<Troubleshooter />} />
        
        {/* Simulators */}
        <Route path="/simulators" element={<Simulators />} />
        <Route path="/detection-limit" element={<Simulators />} />
        <Route path="/oven-ramp" element={<Simulators />} />
        <Route path="/inlet-simulator" element={<Simulators />} />
        
        {/* Analysis */}
        <Route path="/ocr" element={<OCR />} />
        
        {/* System */}
        <Route path="/validity" element={<Validity />} />
        
        {/* Default Route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
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

