// This file has been removed as it is no longer used in routing.
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { LineChart } from '../components/LineChart';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowLeft,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface LiveChromatogramDemoProps {
  onNavigate: (path: string) => void;
}

export const LiveChromatogramDemo: React.FC<LiveChromatogramDemoProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMixture, setSelectedMixture] = useState<string>('');
  const [useCurrentRamp, setUseCurrentRamp] = useState(false);
  const [chromatogramData, setChromatogramData] = useState<Array<{x: number, y: number}>>([]);

  const steps: DemoStep[] = [
    {
      id: 'mixture',
      title: 'Select Sample Mixture',
      description: 'Choose a simple mixture (e.g., methane/ethane)',
      completed: selectedMixture !== ''
    },
    {
      id: 'ramp',
      title: 'Choose Oven Ramp',
      description: 'Select default ramp or use current from Oven Ramp',
      completed: true
    },
    {
      id: 'simulate',
      title: 'Animated Chart',
      description: 'Watch the left-to-right trace animation',
      completed: isPlaying
    }
  ];

  const mixtures = [
    { id: 'methane-ethane', name: 'Methane/Ethane', description: 'Simple 2-component mixture' },
    { id: 'btx', name: 'BTX Mix', description: 'Benzene, Toluene, Xylene' },
    { id: 'pesticides', name: 'Pesticide Mix', description: 'Common pesticide standards' },
    { id: 'volatiles', name: 'VOC Mix', description: 'Volatile organic compounds' }
  ];

  const generateChromatogramData = (mixture: string) => {
    const data: Array<{x: number, y: number}> = [];
    let time = 0;
    const maxTime = 20; // minutes
    const timeStep = 0.1;

    // Generate baseline
    while (time <= maxTime) {
      data.push({ x: time, y: 0.1 + Math.random() * 0.05 }); // Baseline noise
      time += timeStep;
    }

    // Add peaks based on mixture
    const peakConfigs = {
      'methane-ethane': [
        { time: 2.5, height: 0.8, width: 0.3 },
        { time: 4.2, height: 0.6, width: 0.4 }
      ],
      'btx': [
        { time: 3.1, height: 0.9, width: 0.2 },
        { time: 5.8, height: 0.7, width: 0.3 },
        { time: 8.5, height: 0.5, width: 0.4 }
      ],
      'pesticides': [
        { time: 4.2, height: 0.6, width: 0.3 },
        { time: 7.1, height: 0.8, width: 0.2 },
        { time: 10.3, height: 0.4, width: 0.4 },
        { time: 13.7, height: 0.7, width: 0.3 }
      ],
      'volatiles': [
        { time: 2.8, height: 0.5, width: 0.2 },
        { time: 4.5, height: 0.7, width: 0.3 },
        { time: 6.9, height: 0.6, width: 0.2 },
        { time: 9.2, height: 0.4, width: 0.4 },
        { time: 12.1, height: 0.8, width: 0.3 }
      ]
    };

    const peaks = peakConfigs[mixture as keyof typeof peakConfigs] || [];
    
    peaks.forEach(peak => {
      const startTime = Math.max(0, peak.time - peak.width);
      const endTime = Math.min(maxTime, peak.time + peak.width);
      let t = startTime;
      
      while (t <= endTime) {
        const distance = Math.abs(t - peak.time);
        const intensity = peak.height * Math.exp(-Math.pow(distance / (peak.width / 2), 2));
        
        const dataIndex = data.findIndex(d => Math.abs(d.x - t) < timeStep / 2);
        if (dataIndex >= 0) {
          data[dataIndex].y += intensity;
        }
        
        t += timeStep;
      }
    });

    return data;
  };

  useEffect(() => {
    if (selectedMixture) {
      const data = generateChromatogramData(selectedMixture);
      setChromatogramData(data);
    }
  }, [selectedMixture]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentStep(2);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSelectedMixture('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Select a Simple Mixture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mixtures.slice(0, 2).map((mixture) => (
                <Card
                  key={mixture.id}
                  className={`cursor-pointer transition-all ${
                    selectedMixture === mixture.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedMixture(mixture.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{mixture.name}</h4>
                        <p className="text-sm text-gray-600">{mixture.description}</p>
                      </div>
                      {selectedMixture === mixture.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(1)}
                disabled={!selectedMixture}
              >
                Next Step
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Choose Default Oven Ramp or Use Current</h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="default-ramp"
                      name="ramp"
                      checked={!useCurrentRamp}
                      onChange={() => setUseCurrentRamp(false)}
                    />
                    <label htmlFor="default-ramp" className="text-sm">
                      Use default oven ramp
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="current-ramp"
                      name="ramp"
                      checked={useCurrentRamp}
                      onChange={() => setUseCurrentRamp(true)}
                    />
                    <label htmlFor="current-ramp" className="text-sm">
                      Use current from Oven Ramp
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button
                onClick={() => setCurrentStep(0)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handlePlay}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Step 3: Animated Chart</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={isPlaying ? handlePause : handlePlay}
                  size="sm"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <LineChart
                  data={chromatogramData}
                  width={600}
                  height={300}
                  animated={isPlaying}
                />
              </CardContent>
            </Card>

            {/* Legend chips */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Peak 1: 2.5 min</Badge>
              <Badge variant="outline" className="text-xs">Peak 2: 4.2 min</Badge>
              <Badge variant="outline" className="text-xs">Baseline: 0.1 mV</Badge>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={() => onNavigate('/detection-limit')}
              >
                Try Detection Limit Calculator
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => onNavigate('/')}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Chromatogram Demo</h1>
          <p className="text-gray-600">Interactive GC simulation and analysis</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.completed
                ? 'bg-green-500 border-green-500 text-white'
                : index === currentStep
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 text-gray-500'
            }`}>
              {step.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 h-0.5 bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Demo Features</h4>
              <p className="text-sm text-blue-800 mt-1">
                This interactive demo showcases real-time chromatogram simulation with configurable 
                sample mixtures and temperature programs. Use this to understand how different 
                parameters affect peak separation and retention times.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
