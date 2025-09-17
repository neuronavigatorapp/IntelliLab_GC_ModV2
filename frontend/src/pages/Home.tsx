import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge } from '../components/ui';
import { TestTube, Bot, Calculator, Eye, Microscope, TrendingUp } from 'lucide-react';

export const Home: React.FC = () => {
  const quickActions = [
    {
      title: 'GC Sandbox',
      description: 'Interactive GC instrument simulator with real-time parameter adjustment',
      icon: TestTube,
      path: '/sandbox',
      badge: 'Popular'
    },
    {
      title: 'AI Troubleshooter',
      description: 'Intelligent diagnostic assistant for GC method optimization',
      icon: Bot,
      path: '/troubleshooter',
      badge: 'New'
    },
    {
      title: 'Detection Limit Calculator',
      description: 'Calculate method detection limits with statistical validation',
      icon: Calculator,
      path: '/detection-limit',
      badge: null
    },
    {
      title: 'OCR Vision',
      description: 'Extract data from chromatogram images using AI vision',
      icon: Eye,
      path: '/ocr',
      badge: 'Beta'
    }
  ];

  const recentActivities = [
    { id: 1, title: 'Method validation completed', timestamp: '2 hours ago', type: 'success' },
    { id: 2, title: 'New chromatogram analyzed', timestamp: '4 hours ago', type: 'info' },
    { id: 3, title: 'System calibration due', timestamp: '1 day ago', type: 'warning' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Welcome to IntelliLab GC</h1>
          <p className="text-text-secondary mt-2">
            Professional gas chromatography toolkit with AI-powered analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">System Online</Badge>
          <Badge variant="info">Pro Edition</Badge>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} variant="glass" className="cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-accent-100 rounded-lg">
                      <Icon size={24} className="text-accent-600" />
                    </div>
                    {action.badge && (
                      <Badge size="sm" variant={action.badge === 'New' ? 'info' : action.badge === 'Beta' ? 'warning' : 'default'}>
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{action.title}</h3>
                  <p className="text-sm text-text-secondary">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Active Methods</p>
                <p className="text-2xl font-bold text-text-primary">12</p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg">
                <TestTube className="text-success-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Analyses Today</p>
                <p className="text-2xl font-bold text-text-primary">47</p>
              </div>
              <div className="p-3 bg-info-50 rounded-lg">
                <TrendingUp className="text-info-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">System Health</p>
                <p className="text-2xl font-bold text-success-600">98%</p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg">
                <Microscope className="text-success-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-success-500' :
                    activity.type === 'warning' ? 'bg-warning-500' :
                    'bg-info-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">{activity.title}</p>
                    <p className="text-sm text-text-secondary">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};