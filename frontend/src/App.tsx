import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/AppShell/Layout';

// Import new Blue Lab pages
import { Home } from './pages/Home';
import { Sandbox } from './pages/Sandbox';
import { Troubleshooter } from './pages/Troubleshooter';
import { Simulators } from './pages/Simulators';
import { OCR } from './pages/OCR';
import { OCRVision } from './pages/analysis/OCRVision';
import { Validity } from './pages/Validity';
import { SplitRatioCalculator } from './pages/SplitRatioCalculator';
import DetectionLimit from './pages/simulators/DetectionLimit';
import ChromatogramSimulator from './pages/tools/ChromatogramSimulator';
import { VoidVolume } from './pages/tools/VoidVolume';
import { PeakCapacity } from './pages/tools/PeakCapacity';
import { BackflushTiming } from './pages/tools/BackflushTiming';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();



  return (
    <Layout
      currentPath={location.pathname}
      onNavigate={navigate}
    >
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/troubleshooter" element={<Troubleshooter />} />
        
        {/* Simulators */}
        <Route path="/simulators/detection-limit" element={<DetectionLimit />} />
        <Route path="/simulators/oven-ramp" element={<Simulators />} />
        <Route path="/simulators/inlet" element={<Simulators />} />
        
        {/* Core Calculation Tools */}
        <Route path="/tools/split-ratio" element={<SplitRatioCalculator />} />
        <Route path="/tools/chromatogram" element={<ChromatogramSimulator />} />
        
        {/* Advanced Analysis */}
        <Route path="/analysis/vision" element={<OCR />} />
        <Route path="/analysis/ocr" element={<OCRVision />} />
        <Route path="/analysis/gc-sandbox" element={<Sandbox />} />
        
        {/* Professional Suite */}
        <Route path="/tools/void-volume" element={<VoidVolume />} />
        <Route path="/tools/peak-capacity" element={<PeakCapacity />} />
        <Route path="/tools/backflush-timing" element={<BackflushTiming />} />
        
        {/* Troubleshooting Tools */}
        <Route path="/troubleshoot/inlet-discrimination" element={<Troubleshooter />} />
        <Route path="/troubleshoot/flashback" element={<Troubleshooter />} />
        <Route path="/troubleshoot/column-activity" element={<Troubleshooter />} />
        <Route path="/troubleshoot/fid-sensitivity" element={<Troubleshooter />} />
        <Route path="/troubleshoot/ms-tune" element={<Troubleshooter />} />
        <Route path="/troubleshoot/ecd-standing" element={<Troubleshooter />} />
        
        {/* Data & System */}
        <Route path="/instruments" element={<Validity />} />
        <Route path="/runs" element={<Validity />} />
        <Route path="/analytics" element={<Validity />} />
        <Route path="/ocr" element={<OCR />} />
        <Route path="/validity" element={<Validity />} />
        <Route path="/settings" element={<Validity />} />
        
        {/* Legacy compatibility */}
        <Route path="/simulators" element={<Simulators />} />
        <Route path="/detection-limit" element={<Simulators />} />
        
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

