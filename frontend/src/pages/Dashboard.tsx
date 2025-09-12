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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Professional GC Analysis Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced gas chromatography simulation, optimization, and troubleshooting toolkit for analytical professionals.
            </p>
          </div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="brand">Method Development</Badge>
              <Badge variant="accent">Virtual Instruments</Badge>
              <Badge variant="brand">Real-time Simulation</Badge>
              <Badge variant="accent">Professional Tools</Badge>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="brand"
                className="px-8 py-3 text-lg"
                onClick={() => onNavigate('/demo')}
              >
                <Play className="h-5 w-5 mr-2" />
                Try Live Chromatogram Demo
              </Button>
              <Button
                size="lg"
                variant="brandOutline"
                className="px-8 py-3 text-lg"
                onClick={() => onNavigate('/instruments')}
              >
                Build Virtual GC
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                <strong>LinkedIn Demo Access:</strong> Full functionality for core GC calculation and simulation tools.
              </p>
            </div>
          </motion.div>
        </div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featureCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
            >
              <Card className={`card-hover bg-gradient-to-br ${card.color} border-0`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {card.icon}
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tip Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <div className="max-w-md">
          <TipCard>
            Use Detection Limit Calculator first, then Oven Ramp Visualizer for optimal results.
          </TipCard>
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
};
