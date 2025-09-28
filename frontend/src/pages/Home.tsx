import React from 'react';
import { TestTube, Bot, Calculator, Eye, Play, ArrowRight, Zap, Award, Users } from 'lucide-react';

export const Home: React.FC = () => {
  const quickActions = [
    {
      title: 'GC Sandbox',
      description: 'Interactive simulation with real-time parameter adjustment',
      icon: TestTube,
      path: '/sandbox',
      gradient: 'from-blue-500 to-blue-600',
      badge: 'Popular'
    },
    {
      title: 'AI Troubleshooter',
      description: 'Intelligent diagnostic assistant for method optimization',
      icon: Bot,
      path: '/troubleshooter',
      gradient: 'from-indigo-500 to-indigo-600',
      badge: 'AI Powered'
    },
    {
      title: 'Split Ratio Calculator',
      description: 'Professional GC inlet calculations with validation',
      icon: Calculator,
      path: '/tools/split-ratio',
      gradient: 'from-purple-500 to-purple-600',
      badge: null
    },
    {
      title: 'Vision AI',
      description: 'Extract data from chromatogram images automatically',
      icon: Eye,
      path: '/analysis/vision',
      gradient: 'from-green-500 to-green-600',
      badge: 'Beta'
    }
  ];

  const stats = [
    { label: 'Available Tools', value: '25+', icon: Zap, color: 'text-brand-600' },
    { label: 'Success Rate', value: '98%', icon: Award, color: 'text-success' },
    { label: 'Lab Users', value: '500+', icon: Users, color: 'text-info' }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12 blue-gradient-banner rounded-2xl">
        <h1 className="text-4xl font-bold mb-4">
          Field GC Toolkit
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Professional gas chromatography analysis with AI-powered diagnostics, 
          interactive simulations, and comprehensive calculation tools
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn btn-secondary bg-white text-brand-700 hover:bg-white/90">
            <Play size={20} />
            Start Simulation
          </button>
          <button className="btn btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20">
            View All Tools
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card text-center">
              <div className="card-content">
                <div className={`inline-flex p-3 rounded-full bg-surface-2 ${stat.color} mb-4`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-3xl font-bold text-text mb-2">{stat.value}</h3>
                <p className="text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text mb-4">Professional GC Tools</h2>
          <p className="text-muted max-w-2xl mx-auto">
            Access our comprehensive suite of gas chromatography analysis tools, 
            from basic calculations to advanced AI-powered diagnostics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.title} className="card hover:shadow-lg cursor-pointer group">
                <div className="card-content relative overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${action.gradient} text-white`}>
                        <Icon size={24} />
                      </div>
                      {action.badge && (
                        <span className="px-2 py-1 text-xs bg-brand-500/10 text-brand-600 rounded-full">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-text mb-2">{action.title}</h3>
                    <p className="text-sm text-muted mb-4">{action.description}</p>
                    
                    <div className="flex items-center text-brand-600 text-sm font-medium group-hover:text-brand-700">
                      Open Tool
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-h">
            <h3 className="text-lg font-semibold text-text">🤖 AI-Powered Analysis</h3>
          </div>
          <div className="card-content">
            <p className="text-muted mb-4">
              Advanced machine learning algorithms analyze your chromatograms, 
              detect issues, and provide expert recommendations automatically.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Automated peak detection and integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Intelligent troubleshooting diagnostics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Method optimization suggestions</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3 className="text-lg font-semibold text-text">🧪 Professional Calculations</h3>
          </div>
          <div className="card-content">
            <p className="text-muted mb-4">
              Industry-standard calculations with comprehensive validation, 
              uncertainty analysis, and expert-level explanations.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full" />
                <span>Statistical detection limit calculations</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full" />
                <span>Split ratio optimization with warnings</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full" />
                <span>Comprehensive instrument simulations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};