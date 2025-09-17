import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Brain,
  Microscope,
  Eye,
  Calculator,
  Play,
  Pause,
  Settings,
  ArrowRight,
  Command
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CommandPalette } from '../components/CommandPalette';
import { InstrumentMap } from '../components/InstrumentMap';

interface StatusTile {
  id: string;
  title: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'error' | 'running' | 'idle';
  change?: string;
  icon: React.ReactNode;
  description: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  category: 'analysis' | 'simulation' | 'ai' | 'tools';
}

export const Home: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'online' | 'maintenance' | 'degraded'>('online');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const statusTiles: StatusTile[] = [
    {
      id: 'instruments',
      title: 'Active Instruments',
      value: 3,
      status: 'healthy',
      change: '+2 this week',
      icon: <Microscope className="h-5 w-5" />,
      description: 'GC-MS systems online and operational'
    },
    {
      id: 'samples',
      title: 'Samples Analyzed',
      value: '1,247',
      status: 'healthy',
      change: '+15.3% vs last month',
      icon: <Target className="h-5 w-5" />,
      description: 'Total samples processed this month'
    },
    {
      id: 'ai-engine',
      title: 'AI Engine Status',
      value: 'Active',
      status: 'running',
      icon: <Brain className="h-5 w-5" />,
      description: 'Intelligent analysis and troubleshooting ready'
    },
    {
      id: 'queue',
      title: 'Analysis Queue',
      value: 12,
      status: 'running',
      change: 'Processing...',
      icon: <Clock className="h-5 w-5" />,
      description: 'Samples waiting for analysis'
    },
    {
      id: 'uptime',
      title: 'System Uptime',
      value: '99.8%',
      status: 'healthy',
      change: '30 days',
      icon: <Activity className="h-5 w-5" />,
      description: 'System reliability this month'
    },
    {
      id: 'alerts',
      title: 'Active Alerts',
      value: 2,
      status: 'warning',
      change: 'Requires attention',
      icon: <AlertTriangle className="h-5 w-5" />,
      description: 'System notifications and warnings'
    }
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      title: 'Start Analysis',
      description: 'Upload and analyze chromatogram data',
      icon: <Eye className="h-5 w-5" />,
      path: '/analysis',
      category: 'analysis'
    },
    {
      id: 'troubleshoot',
      title: 'AI Troubleshooter',
      description: 'Get intelligent system diagnostics',
      icon: <Brain className="h-5 w-5" />,
      path: '/ai-troubleshooter',
      category: 'ai' 
    },
    {
      id: 'simulate',
      title: 'Run Simulation',
      description: 'Test conditions and optimize methods',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/simulation',
      category: 'simulation'
    },
    {
      id: 'calculator',
      title: 'Calculations',
      description: 'Analytical calculations and conversions',
      icon: <Calculator className="h-5 w-5" />,
      path: '/calculators',
      category: 'tools'
    }
  ];

  const getStatusColor = (status: StatusTile['status']) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'running': return 'text-theme-primary-400';
      case 'warning': return 'text-theme-accent-orange';
      case 'error': return 'text-red-400';
      case 'idle': return 'text-theme-text-muted';
      default: return 'text-theme-text-muted';
    }
  };

  const getStatusBadgeColor = (status: StatusTile['status']) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'running': return 'bg-theme-primary-500/10 text-theme-primary-400 border-theme-primary-500/30';
      case 'warning': return 'bg-theme-accent-orange/10 text-theme-accent-orange border-theme-accent-orange/30';
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'idle': return 'bg-theme-surface/10 text-theme-text-muted border-theme-border';
      default: return 'bg-theme-surface/10 text-theme-text-muted border-theme-border';
    }
  };

  const getCategoryColor = (category: QuickAction['category']) => {
    switch (category) {
      case 'analysis': return 'from-theme-primary-500/20 to-theme-accent-mint/20';
      case 'simulation': return 'from-theme-accent-orange/20 to-theme-primary-500/20';
      case 'ai': return 'from-theme-accent-mint/20 to-theme-primary-500/20';
      case 'tools': return 'from-theme-primary-500/20 to-theme-surface/20';
      default: return 'from-theme-surface/20 to-theme-border/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 mb-12"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-theme-text">
          Welcome to <span className="text-transparent bg-gradient-to-r from-theme-primary-400 to-theme-accent-mint bg-clip-text">IntelliLab GC</span>
        </h1>
        <p className="text-xl text-theme-text-muted max-w-2xl mx-auto">
          Advanced gas chromatography analysis platform with intelligent automation and professional-grade insights
        </p>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-theme-text-muted">
            <span>System Status:</span>
            <Badge className={getStatusBadgeColor('healthy')}>
              <CheckCircle className="h-3 w-3 mr-1" />
              All Systems Operational
            </Badge>
            <span>•</span>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          
          {/* Primary CTA */}
          <div className="flex items-center space-x-4 mt-6">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-theme-primary-500 to-theme-accent-mint hover:from-theme-primary-600 hover:to-theme-accent-mint/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Brain className="h-5 w-5 mr-2" />
              Open Troubleshooter
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-theme-primary-500/30 text-theme-primary-400 hover:bg-theme-primary-500/10 px-8 py-3 text-lg"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Command className="h-5 w-5 mr-2" />
              Quick Actions
              <Badge variant="outline" className="ml-3 text-xs">⌘K</Badge>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Instrument Flow Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-semibold text-theme-text mb-6 flex items-center">
          <Microscope className="h-6 w-6 mr-3 text-theme-primary-500" />
          Instrument Flow
        </h2>
        
        <Card className="glass-card p-6">
          <InstrumentMap className="h-48 w-full" animated={true} />
        </Card>
      </motion.div>

      {/* Status Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-theme-text mb-6 flex items-center">
          <Activity className="h-6 w-6 mr-3 text-theme-primary-500" />
          System Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statusTiles.map((tile, index) => (
            <motion.div
              key={tile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="glass-card hover:bg-theme-surface/60 transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor('analysis')} ${getStatusColor(tile.status)}`}>
                      {tile.icon}
                    </div>
                    <Badge className={getStatusBadgeColor(tile.status)}>
                      {tile.status === 'running' && <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1" />}
                      {tile.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-theme-text group-hover:text-theme-primary-400 transition-colors">
                    {tile.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-theme-text">
                      {tile.value}
                    </div>
                    {tile.change && (
                      <div className="text-sm text-theme-text-muted">
                        {tile.change}
                      </div>
                    )}
                    <p className="text-sm text-theme-text-muted">
                      {tile.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-theme-text mb-6 flex items-center">
          <Zap className="h-6 w-6 mr-3 text-theme-accent-orange" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="glass-card hover:bg-theme-surface/60 transition-all duration-300 cursor-pointer group h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(action.category)} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-theme-primary-400">
                      {action.icon}
                    </div>
                  </div>
                  <CardTitle className="text-theme-text group-hover:text-theme-primary-400 transition-colors text-lg">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-theme-text-muted">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full text-theme-primary-400 hover:bg-theme-primary-500/10 hover:text-theme-primary-300 group-hover:bg-theme-primary-500/20 transition-all duration-300"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2 className="text-2xl font-semibold text-theme-text mb-6 flex items-center">
          <TrendingUp className="h-6 w-6 mr-3 text-theme-accent-mint" />
          Recent Activity
        </h2>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { time: '14:32', event: 'Analysis completed', sample: 'Sample-GC-2024-089', status: 'success' },
                { time: '13:45', event: 'AI optimization suggested', sample: 'Method development', status: 'info' },
                { time: '12:18', event: 'Quality check passed', sample: 'Sample-GC-2024-088', status: 'success' },
                { time: '11:52', event: 'Calibration reminder', sample: 'System maintenance', status: 'warning' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-theme-surface/30 transition-colors duration-200">
                  <div className="text-sm text-theme-text-muted font-mono">
                    {activity.time}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-emerald-400' :
                    activity.status === 'warning' ? 'bg-theme-accent-orange' :
                    'bg-theme-primary-400'
                  }`} />
                  <div className="flex-1">
                    <div className="text-theme-text font-medium">
                      {activity.event}
                    </div>
                    <div className="text-sm text-theme-text-muted">
                      {activity.sample}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-theme-border">
              <Button variant="ghost" className="w-full text-theme-primary-400 hover:bg-theme-primary-500/10">
                View All Activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};