import React from 'react';
import { TipCard } from '../components/TipCard';
import { ScientificChart, RealTimeDataDisplay, ScientificProgress } from '../components/ScientificVisualization';
import { EnterpriseSystemStatus, SystemResourceMonitor } from '../components/EnterpriseStatusSystem';
import { 
  BarChart3, 
  Microscope, 
  Wrench, 
  Play,
  ArrowRight,
  TrendingUp,
  Activity,
  Thermometer,
  Gauge
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const featureCards = [
    {
      title: "Interactive Chromatograms",
      description: "Real-time elution visualization with temperature programs and peak analysis tools.",
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      color: "from-blue-50 to-blue-100"
    },
    {
      title: "Virtual GC Builder",
      description: "Configure instruments with columns, detectors, and inlets for method development.",
      icon: <Microscope className="h-8 w-8 text-green-600" />,
      color: "from-green-50 to-green-100"
    },
    {
      title: "Professional Tools",
      description: "Detection limit calculators, troubleshooting assistants, and optimization tools.",
      icon: <Wrench className="h-8 w-8 text-purple-600" />,
      color: "from-purple-50 to-purple-100"
    }
  ];



  // Sample chromatogram data
  const sampleData = Array.from({ length: 100 }, (_, i) => ({
    x: i * 0.2,
    y: Math.random() * 1000 + Math.sin(i * 0.1) * 500 + 200
  }));

  return (
    <div className="space-y-10" data-testid="dashboard">
      {/* Ultra-Premium Hero Section */}
      <div className="relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 rounded-3xl" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gradient-to-br from-indigo-400/5 to-cyan-400/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center space-y-10 py-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="enterprise-h1 leading-tight">
                IntelliLab GC Enterprise
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto shadow-lg" />
            </div>
            <p className="enterprise-body-lg max-w-5xl mx-auto leading-relaxed text-gray-600">
              Advanced gas chromatography simulation, optimization, and troubleshooting platform designed for analytical professionals and research laboratories worldwide. Experience enterprise-grade analytical precision with AI-powered insights.
            </p>
          </div>

          {/* Ultra-Premium Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              className="enterprise-btn enterprise-btn-primary px-8 py-4 text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              onClick={() => onNavigate('/demo')}
            >
              <Play className="h-5 w-5 mr-3" />
              Launch Chromatogram Analysis
            </button>
            <button
              className="enterprise-btn enterprise-btn-secondary px-8 py-4 text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              onClick={() => onNavigate('/instruments')}
            >
              Configure Virtual Instrument
              <ArrowRight className="h-5 w-5 ml-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise System Status - Premium Design */}
      <div className="enterprise-glass-card p-8">
        <EnterpriseSystemStatus
          isOnline={true}
          lastUpdated={new Date()}
          systemHealth="excellent"
          temperature={25.4}
          pressure={14.7}
          flowRate={1.2}
        />
      </div>

      {/* Real-time Data Dashboard - Professional Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="enterprise-h3">Real-Time Analytics</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="enterprise-mono">Live Data Stream</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <RealTimeDataDisplay
            title="Column Temperature"
            value={150.5}
            unit="°C"
            trend="stable"
            status="normal"
          />
          <RealTimeDataDisplay
            title="Injection Volume"
            value={1.0}
            unit="μL"
            trend="stable"
            status="normal"
          />
          <RealTimeDataDisplay
            title="Carrier Flow Rate"
            value={1.2}
            unit="mL/min"
            trend="up"
            status="normal"
          />
          <RealTimeDataDisplay
            title="Detector Response"
            value={98.7}
            unit="%"
            trend="stable"
            status="normal"
          />
        </div>
      </div>

      {/* Advanced Scientific Visualization */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="enterprise-h3">Scientific Data Visualization</h2>
          <div className="flex items-center gap-4">
            <button className="enterprise-btn enterprise-btn-secondary px-4 py-2 text-sm">
              <Thermometer className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <button className="enterprise-btn enterprise-btn-secondary px-4 py-2 text-sm">
              <Gauge className="h-4 w-4 mr-2" />
              Full Screen
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="scientific-chart-container">
            <ScientificChart
              title="Real-time Chromatogram"
              data={sampleData}
              xLabel="Retention Time (min)"
              yLabel="Detector Response (mV)"
              showGrid={true}
              showPeaks={true}
              color="#3b82f6"
            />
          </div>
          
          <div className="space-y-6">
            <div className="enterprise-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="enterprise-h4">Method Progress</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span className="enterprise-mono">Real-time</span>
                </div>
              </div>
              <div className="space-y-6">
                <ScientificProgress
                  label="Sample Injection"
                  current={100}
                  total={100}
                  unit="%"
                  color="#10b981"
                />
                <ScientificProgress
                  label="Separation Analysis"
                  current={73.2}
                  total={100}
                  unit="%"
                  color="#3b82f6"
                />
                <ScientificProgress
                  label="Detection & Integration"
                  current={45.8}
                  total={100}
                  unit="%"
                  color="#f59e0b"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Resources Monitor - Professional Layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="enterprise-h3">System Resources</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="enterprise-mono">Monitoring Active</span>
          </div>
        </div>
        <div className="enterprise-glass-card p-6">
          <SystemResourceMonitor />
        </div>
      </div>

      {/* Ultra-Premium Feature Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="enterprise-h3">Platform Features</h2>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featureCards.map((card, index) => (
            <div key={card.title} className="group cursor-pointer">
              <div className="enterprise-glass-card p-8 hover:scale-105 transition-all duration-300 animate-enterprise-fade-in">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br shadow-lg ${
                      index === 0 ? 'from-blue-500 to-blue-600 shadow-blue-500/25' :
                      index === 1 ? 'from-green-500 to-green-600 shadow-green-500/25' :
                      'from-purple-500 to-purple-600 shadow-purple-500/25'
                    } group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="enterprise-h4 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="enterprise-body text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-blue-600 font-medium">
                      <span>Learn more</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Card */}
      <div>
        <div className="max-w-md">
          <TipCard title="Pro Tip">
            Use Detection Limit Calculator first, then Oven Ramp Visualizer for optimal results.
          </TipCard>
        </div>
      </div>
    </div>
  );
};
