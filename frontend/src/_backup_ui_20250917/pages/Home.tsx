import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Brain,
  Microscope,
  Eye,
  Calculator,
  ArrowRight,
  Server,
  Timer,
  PlayCircle
} from 'lucide-react';

export const Home: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');
  const [lastAnalysis, setLastAnalysis] = useState('2 hours ago');
  const [queueSize, setQueueSize] = useState(3);
  const [demoMode, setDemoMode] = useState(true);

  // KPI data
  const kpiData = [
    {
      title: 'API Status',
      value: apiStatus === 'online' ? 'Online' : 'Offline',
      icon: <Server className="w-5 h-5" />,
      status: apiStatus === 'online' ? 'success' : 'error'
    },
    {
      title: 'Last Analysis',
      value: lastAnalysis,
      icon: <Timer className="w-5 h-5" />,
      status: 'info'
    },
    {
      title: 'Queue Size',
      value: queueSize.toString(),
      icon: <Clock className="w-5 h-5" />,
      status: queueSize > 5 ? 'warning' : 'success'
    },
    {
      title: 'Demo Mode',
      value: demoMode ? 'Active' : 'Inactive',
      icon: <PlayCircle className="w-5 h-5" />,
      status: 'info'
    }
  ];

  // Feature grid
  const features = [
    {
      title: 'Studio',
      description: 'Overlay traces, crosshair readout, export PNG/CSV',
      icon: <Eye className="w-6 h-6" />,
      path: '/chromatogram-analyzer'
    },
    {
      title: 'Troubleshooter',
      description: 'Left step log → center step → right insights',
      icon: <Brain className="w-6 h-6" />,
      path: '/ai-assistant'
    },
    {
      title: 'Simulators',
      description: 'Detection-Limit, Oven Ramp, Inlet tabs',
      icon: <Calculator className="w-6 h-6" />,
      path: '/detection-limit'
    },
    {
      title: 'OCR',
      description: 'Dropzone/camera → parsed fields → Accept/Correct',
      icon: <Target className="w-6 h-6" />,
      path: '/batch-analyzer'
    },
    {
      title: 'Knowledge',
      description: 'Search + snippet cards (neutral, no vendor names)',
      icon: <BarChart3 className="w-6 h-6" />,
      path: '/ai-dashboard'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warn';
      case 'error': return 'text-danger';
      case 'info': return 'text-info';
      default: return 'text-theme-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success-bg border-success-border';
      case 'warning': return 'bg-warn-bg border-warn-border';
      case 'error': return 'bg-danger-bg border-danger-border';
      case 'info': return 'bg-info-bg border-info-border';
      default: return 'bg-theme-surface-2 border-theme-border';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-theme-text mb-4">
          Professional Gas Chromatography Analysis
        </h1>
        <p className="text-lg text-theme-muted max-w-2xl mx-auto mb-8">
          Trusted analytical platform with intelligent automation and professional-grade insights
        </p>
        
        {/* Primary CTA */}
        <div className="flex justify-center">
          <button className="app-button-primary text-lg px-8 py-4">
            <Brain className="w-5 h-5 mr-2" />
            Open Troubleshooter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="app-card p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className={getStatusColor(kpi.status)}>
                {kpi.icon}
              </div>
              <h3 className="font-medium text-theme-text text-sm">{kpi.title}</h3>
            </div>
            <div className={`text-lg font-semibold ${getStatusColor(kpi.status)}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Instrument Map */}
      <div className="app-card p-6">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <Microscope className="w-5 h-5 mr-2" />
          Instrument Map
        </h2>
        
        {/* Simple instrument flow visualization */}
        <div className="flex items-center justify-between py-8 px-4 bg-theme-surface-2 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-theme-primary-500 rounded-full flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-theme-text">Inlet</div>
          </div>
          
          <div className="flex-1 h-px bg-theme-border mx-4 relative">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-theme-primary-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-theme-primary-500 rounded-full flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-theme-text">Column</div>
          </div>
          
          <div className="flex-1 h-px bg-theme-border mx-4 relative">
            <div className="absolute top-0 left-2/3 w-2 h-2 bg-theme-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-theme-primary-500 rounded-full flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-theme-text">Oven</div>
          </div>
          
          <div className="flex-1 h-px bg-theme-border mx-4 relative">
            <div className="absolute top-0 left-1/3 w-2 h-2 bg-theme-primary-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-theme-primary-500 rounded-full flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-theme-text">Detector</div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-xl font-semibold text-theme-text mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="app-card p-6 hover:bg-theme-surface-2 transition-colors duration-200 cursor-pointer group">
              <div className="flex items-start space-x-4">
                <div className="text-theme-primary-500 group-hover:text-theme-primary-700 transition-colors">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-theme-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-theme-muted mb-4">{feature.description}</p>
                  <div className="flex items-center text-theme-primary-500 text-sm font-medium group-hover:text-theme-primary-700 transition-colors">
                    Learn more
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="app-card p-6">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Recent Activity
        </h2>
        
        <div className="space-y-3">
          {[
            { time: '14:32', event: 'Analysis completed', sample: 'Sample-GC-2024-089', status: 'success' },
            { time: '13:45', event: 'AI optimization suggested', sample: 'Method development', status: 'info' },
            { time: '12:18', event: 'Quality check passed', sample: 'Sample-GC-2024-088', status: 'success' },
            { time: '11:52', event: 'Calibration reminder', sample: 'System maintenance', status: 'warning' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-theme-surface-2 transition-colors">
              <div className="text-sm text-theme-muted font-mono w-12">
                {activity.time}
              </div>
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-success' :
                activity.status === 'warning' ? 'bg-warn' :
                'bg-info'
              }`} />
              <div className="flex-1">
                <div className="text-theme-text font-medium text-sm">
                  {activity.event}
                </div>
                <div className="text-xs text-theme-muted">
                  {activity.sample}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};