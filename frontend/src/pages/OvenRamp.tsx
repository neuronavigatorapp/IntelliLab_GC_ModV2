import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RampEditor } from '../components/RampEditor';
import { LineChart } from '../components/LineChart';
import { Thermometer, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

interface RampSegment {
  id: string;
  startTemp: number;
  rate: number;
  hold: number;
}

interface OvenRampProps {
  onNavigate: (path: string) => void;
}

export const OvenRamp: React.FC<OvenRampProps> = ({ onNavigate }) => {
  const [segments, setSegments] = useState<RampSegment[]>([
    { id: '1', startTemp: 50, rate: 10, hold: 2 },
    { id: '2', startTemp: 100, rate: 5, hold: 1 },
    { id: '3', startTemp: 150, rate: 20, hold: 0 }
  ]);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateTemperatureData = (): Array<{x: number, y: number}> => {
    const data: Array<{x: number, y: number}> = [];
    let currentTime = 0;
    let currentTemp = 50; // Initial temperature

    segments.forEach((segment) => {
      // Hold at start temperature
      if (currentTime > 0) {
        data.push({ x: currentTime, y: currentTemp });
      }

      // Ramp phase
      const rampTime = Math.abs(segment.startTemp - currentTemp) / segment.rate;
      const timeSteps = Math.ceil(rampTime * 2); // 0.5 minute steps

      for (let i = 0; i <= timeSteps; i++) {
        const timeStep = (i / timeSteps) * rampTime;
        const tempStep = currentTemp + (segment.startTemp - currentTemp) * (i / timeSteps);
        
        data.push({ x: currentTime + timeStep, y: tempStep });
      }

      currentTime += rampTime;
      currentTemp = segment.startTemp;

      // Hold phase
      if (segment.hold > 0) {
        for (let i = 0; i <= segment.hold * 2; i++) {
          data.push({ x: currentTime + (i / 2), y: currentTemp });
        }
        currentTime += segment.hold;
      }
    });

    return data;
  };

  const pageTabs = [
    { id: 'detection-limit', label: 'Detection Limit' },
    { id: 'oven-ramp', label: 'Oven Ramp' },
    { id: 'inlet-simulator', label: 'Inlet Simulator' },
    { id: 'ai-troubleshooting', label: 'AI Troubleshooting' },
    { id: 'fleet-manager', label: 'Fleet Manager' },
    { id: 'split-ratio', label: 'Split Ratio' },
  ];

  const temperatureData = generateTemperatureData();

  return (
    <div className="space-y-6">
      {/* Page Header with Tabs */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue="oven-ramp" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {pageTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                onClick={() => {
                  if (tab.id === 'detection-limit') onNavigate('/detection-limit');
                  else if (tab.id === 'inlet-simulator') onNavigate('/inlet-simulator');
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ramp Editor */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RampEditor
            segments={segments}
            onSegmentsChange={setSegments}
          />
        </motion.div>

        {/* Temperature Plot */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5" />
                  <span>Temperature Profile</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPlaying(false)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <LineChart
                  data={temperatureData}
                  width={400}
                  height={300}
                  animated={isPlaying}
                />
                
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p><strong>Elution timing shifts with ramp rate;</strong> use with demo chromatogram to visualize peak separation effects.</p>
                </div>

                {/* Legend */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Temperature (°C)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Time (min)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {segments.length}
              </div>
              <div className="text-sm text-gray-600">Ramp Segments</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...segments.map(s => s.startTemp))}°C
              </div>
              <div className="text-sm text-gray-600">Max Temperature</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {segments.reduce((total, segment) => {
                  const rampTime = Math.abs(segment.startTemp - 50) / segment.rate;
                  return total + rampTime + segment.hold;
                }, 0).toFixed(1)} min
              </div>
              <div className="text-sm text-gray-600">Total Runtime</div>
            </div>
          </CardContent>
        </Card>
        </div>
      </motion.div>
    </div>
  );
};
