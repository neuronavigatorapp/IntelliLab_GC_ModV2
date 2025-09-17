import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge, Button } from '../components/ui';
import { Calculator, TestTube, Thermometer, Target } from 'lucide-react';

const simulators = [
  {
    id: 'detection-limit',
    title: 'Detection Limit Calculator',
    description: 'Calculate method detection limits with statistical validation',
    icon: Target,
    path: '/detection-limit',
    status: 'available'
  },
  {
    id: 'oven-ramp',
    title: 'Oven Ramp Optimizer', 
    description: 'Design optimal temperature programming for your separations',
    icon: Thermometer,
    path: '/oven-ramp',
    status: 'available'
  },
  {
    id: 'inlet-simulator',
    title: 'Inlet Simulator',
    description: 'Model injection parameters and sample introduction',
    icon: TestTube,
    path: '/inlet-simulator',
    status: 'available'
  }
];

export const Simulators: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">GC Simulators</h1>
          <p className="text-text-secondary mt-2">
            Advanced calculation tools for gas chromatography method development
          </p>
        </div>
        <Badge variant="info">3 Tools Available</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulators.map((simulator) => {
          const Icon = simulator.icon;
          return (
            <Card key={simulator.id} variant="glass" className="cursor-pointer hover:scale-105 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-accent-100 rounded-lg">
                    <Icon size={32} className="text-accent-600" />
                  </div>
                  <Badge variant="success" size="sm">Available</Badge>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{simulator.title}</h3>
                <p className="text-text-secondary text-sm mb-4">{simulator.description}</p>
                <Button variant="primary" className="w-full">
                  Open Simulator
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};