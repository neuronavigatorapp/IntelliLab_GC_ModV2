import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { TipCard } from '../components/TipCard';
import { 
  BarChart3, 
  Microscope, 
  Wrench, 
  Play,
  ArrowRight,
  TrendingUp,
  Users,
  Zap
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

  const stats = [
    {
      title: "Active Instruments",
      value: "12",
      description: "Connected GC systems",
      icon: <Microscope className="h-4 w-4" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Methods Optimized",
      value: "47",
      description: "This month",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Users Online",
      value: "23",
      description: "Active sessions",
      icon: <Users className="h-4 w-4" />,
      trend: { value: 5, isPositive: true }
    }
  ];

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Hero Section */}
      <div className="relative">
        <div className="text-center space-y-8 py-16">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Professional GC Analysis Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Advanced gas chromatography simulation, optimization, and troubleshooting toolkit for analytical professionals.
            </p>
          </div>

          {/* Feature Badges */}
          <div>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                Method Development
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm">
                Virtual Instruments
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                Real-time Simulation
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                Professional Tools
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                onClick={() => onNavigate('/demo')}
              >
                <Play className="h-5 w-5 mr-2" />
                Try Live Chromatogram Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all duration-200"
                onClick={() => onNavigate('/instruments')}
              >
                Build Virtual GC
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-blue-800 font-medium">
                  <strong>LinkedIn Demo Access:</strong> Full functionality for core GC calculation and simulation tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={stat.title}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards Row */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featureCards.map((card, index) => (
            <div key={card.title}>
              <Card className="card-hover bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${
                      index === 0 ? 'from-blue-50 to-blue-100' :
                      index === 1 ? 'from-green-50 to-green-100' :
                      'from-purple-50 to-purple-100'
                    } group-hover:scale-110 transition-transform duration-200`}>
                      {card.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {card.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
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
