import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DetectionLimitCalculator } from './components/DetectionLimitCalculator';
import { OvenRampCalculator } from './components/OvenRampCalculator';
import { InletSimulator as InletSimulatorTool } from './components/InletSimulator';
import { SplitRatioCalculator } from './components/SplitRatioCalculator';
import { SplitlessTimingCalculator } from './components/SplitlessTimingCalculator';
import { PressureDropCalculator } from './components/PressureDropCalculator';
import { ColumnCalculator } from './components/ColumnCalculator';
import { ChromatogramSimulator } from './components/ChromatogramSimulator';
import GCInstrumentSandbox from './components/GCInstrumentSandbox';
import ChromatogramAnalyzer from './components/ChromatogramAnalyzer';
import BatchChromaVisionAnalyzer from './components/BatchChromaVisionAnalyzer';
import ChromatogramComparisonTool from './components/ChromatogramComparisonTool';
import MethodDevelopmentTracker from './components/MethodDevelopmentTracker';
import FieldReportGenerator from './components/FieldReportGenerator';
import AIDashboard from './components/AIDashboard';
import AIMethodOptimization from './components/AIMethodOptimization';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import CostOptimization from './components/CostOptimization';
import PersonalPortfolio from './components/PersonalPortfolio';
import SwissArmyKnife from './components/SwissArmyKnife';
import { MDLCalculatorPro } from './components/MDLCalculatorPro';
import { VeteranTools } from './components/VeteranTools';
import { GCFleetManager } from './components/GCFleetManager';
import { Dashboard } from './components/pages/Dashboard';
import { AIAssistant } from './pages/AIAssistant';
import PersistenceDemo from './components/pages/PersistenceDemo';
// Import new core system pages
import { Instruments } from './pages/InstrumentsNew';
import { Methods } from './pages/Methods';
import { Runs } from './pages/Runs';
import { QCCalibration } from './pages/QCCalibration';
import { Inventory } from './pages/Inventory';
// Removed non-existent components
import { routes } from './lib/routes';
// Duplicate imports removed above

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentSection = () => {
    switch (location.pathname) {
      case routes.dashboard:
        return 'Dashboard';
      
      // Core System
      case routes.instruments:
        return 'Instruments';
      case routes.methods:
        return 'Methods';
      case routes.runs:
        return 'Runs';
      case routes.qcCalibration:
        return 'QC & Calibration';
      case routes.inventory:
        return 'Inventory';
      
      // AI Assistant
      case routes.aiAssistant:
        return 'AI Assistant';
      case routes.aiDashboard:
        return 'AI Dashboard';
      case routes.aiMethodOptimization:
        return 'AI Method Optimization';
      case routes.predictiveMaintenance:
        return 'Predictive Maintenance';
      case routes.costOptimization:
        return 'Cost Optimization';
      
      // Analysis Tools
      case routes.chromatogramAnalyzer:
        return 'ChromaVision AI';
      case routes.batchAnalyzer:
        return 'Batch Analyzer';
      case routes.comparisonTool:
        return 'Comparison Tool';
      
      // Calculators
      case routes.detectionLimit:
        return 'Detection Limit';
      case routes.ovenRamp:
        return 'Oven Ramp';
      case routes.inletSimulator:
        return 'Inlet Simulator';
      case routes.splitRatio:
        return 'Split Ratio';
      case routes.splitlessTiming:
        return 'Splitless Timing';
      case routes.pressureDrop:
        return 'Pressure Drop';
      case routes.columnCalculator:
        return 'Column Calculator';
      case routes.mdlCalculator:
        return 'MDL Calculator';
      
      // Simulation
      case routes.chromatogramSimulator:
        return 'Chromatogram Simulator';
      case routes.gcSandbox:
        return 'GC Instrument Sandbox';
      
      // Management
      case routes.methodDevelopment:
        return 'Method Development';
      case routes.fieldReports:
        return 'Field Reports';
      case routes.fleetManager:
        return 'Fleet Manager';
      
      // Utilities
      case routes.personalPortfolio:
        return 'Portfolio';
      case routes.swissArmyKnife:
        return 'Swiss Army Knife';
      case routes.veteranTools:
        return 'Veteran Tools';
      
      // Demo
      case routes.demo:
        return 'Live Demo';
      case routes.persistenceDemo:
        return 'Persistence Demo';
      
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
    <Route path={routes.dashboard} element={<Dashboard />} />
    
    {/* Core System Pages */}
    <Route path={routes.instruments} element={<Instruments />} />
    <Route path={routes.methods} element={<Methods />} />
    <Route path={routes.runs} element={<Runs />} />
    <Route path={routes.qcCalibration} element={<QCCalibration />} />
    <Route path={routes.inventory} element={<Inventory />} />
    
    {/* AI Assistant Pages */}
    <Route path={routes.aiAssistant} element={<AIAssistant onNavigate={navigate} />} />
    <Route path={routes.aiDashboard} element={<AIDashboard />} />
    <Route path={routes.aiMethodOptimization} element={<AIMethodOptimization />} />
    <Route path={routes.predictiveMaintenance} element={<PredictiveMaintenance />} />
    <Route path={routes.costOptimization} element={<CostOptimization />} />
    
    {/* Analysis Tools */}
    <Route path={routes.chromatogramAnalyzer} element={<ChromatogramAnalyzer />} />
    <Route path={routes.batchAnalyzer} element={<BatchChromaVisionAnalyzer />} />
    <Route path={routes.comparisonTool} element={<ChromatogramComparisonTool />} />
    
    {/* Calculators */}
    <Route path={routes.detectionLimit} element={<DetectionLimitCalculator />} />
    <Route path={routes.ovenRamp} element={<OvenRampCalculator />} />
    <Route path={routes.inletSimulator} element={<InletSimulatorTool />} />
    <Route path={routes.splitRatio} element={<SplitRatioCalculator />} />
    <Route path={routes.splitlessTiming} element={<SplitlessTimingCalculator />} />
    <Route path={routes.pressureDrop} element={<PressureDropCalculator />} />
    <Route path={routes.columnCalculator} element={<ColumnCalculator />} />
    <Route path={routes.mdlCalculator} element={<MDLCalculatorPro />} />
    
    {/* Simulation */}
    <Route path={routes.chromatogramSimulator} element={<ChromatogramSimulator />} />
    <Route path={routes.gcSandbox} element={<GCInstrumentSandbox />} />
    
    {/* Management */}
    <Route path={routes.methodDevelopment} element={<MethodDevelopmentTracker />} />
    <Route path={routes.fieldReports} element={<FieldReportGenerator />} />
    <Route path={routes.fleetManager} element={<GCFleetManager />} />
    
    {/* Utilities */}
    <Route path={routes.personalPortfolio} element={<PersonalPortfolio />} />
    <Route path={routes.swissArmyKnife} element={<SwissArmyKnife />} />
    <Route path={routes.veteranTools} element={<VeteranTools />} />
    
    {/* Demo */}
    <Route path={routes.demo} element={<PersistenceDemo />} />
    <Route path={routes.persistenceDemo} element={<PersistenceDemo />} />
    
    {/* Default Route */}
    <Route path="*" element={<Dashboard />} />
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

