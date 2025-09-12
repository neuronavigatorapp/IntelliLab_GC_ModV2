import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ResultCard } from '../components/ResultCard';
import { Badge } from '../components/Badge';
import { Zap, Calculator, Settings } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface InletSimulatorProps {
  onNavigate: (path: string) => void;
}

export const InletSimulator: React.FC<InletSimulatorProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    pressure: '15',
    splitRatio: '50',
    temperature: '250',
    linerType: 'splitless',
    flowModel: 'constant'
  });
  const [results, setResults] = useState<{
    totalFlow: number;
    splitFlow: number;
    columnFlow: number;
  } | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateFlows = () => {
    const pressure = parseFloat(formData.pressure);
    const splitRatio = parseFloat(formData.splitRatio);
    const temperature = parseFloat(formData.temperature);

    // Simplified flow calculations (professional approximations)
    const baseFlow = 1.0; // mL/min base flow
    const pressureFactor = pressure / 15; // Normalize to 15 psi
    const tempFactor = Math.sqrt((temperature + 273.15) / 298.15); // Temperature correction

    const totalFlow = baseFlow * pressureFactor * tempFactor;
    const splitFlow = totalFlow * (splitRatio / 100);
    const columnFlow = totalFlow - splitFlow;

    setResults({
      totalFlow: Math.round(totalFlow * 1000) / 1000,
      splitFlow: Math.round(splitFlow * 1000) / 1000,
      columnFlow: Math.round(columnFlow * 1000) / 1000
    });

    toast({
      title: "Flow Calculation Complete",
      description: `Total flow: ${totalFlow.toFixed(3)} mL/min`,
      variant: "success"
    });
  };

  const pageTabs = [
    { id: 'detection-limit', label: 'Detection Limit' },
    { id: 'oven-ramp', label: 'Oven Ramp' },
    { id: 'inlet-simulator', label: 'Inlet Simulator' },
    { id: 'ai-troubleshooting', label: 'AI Troubleshooting' },
    { id: 'fleet-manager', label: 'Fleet Manager' },
    { id: 'split-ratio', label: 'Split Ratio' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with Tabs */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue="inlet-simulator" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {pageTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                onClick={() => {
                  if (tab.id === 'detection-limit') onNavigate('/detection-limit');
                  else if (tab.id === 'oven-ramp') onNavigate('/oven-ramp');
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Inlet Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pressure">Inlet Pressure (psi)</Label>
                      <Input
                        id="pressure"
                        type="number"
                        value={formData.pressure}
                        onChange={(e) => handleInputChange('pressure', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="split-ratio">Split Ratio (%)</Label>
                      <Input
                        id="split-ratio"
                        type="number"
                        value={formData.splitRatio}
                        onChange={(e) => handleInputChange('splitRatio', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Inlet Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liner-type">Liner Type</Label>
                      <select
                        id="liner-type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.linerType}
                        onChange={(e) => handleInputChange('linerType', e.target.value)}
                      >
                        <option value="splitless">Splitless</option>
                        <option value="split">Split</option>
                        <option value="direct">Direct</option>
                        <option value="purge-trap">Purge & Trap</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flow-model">Flow Model</Label>
                      <select
                        id="flow-model"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formData.flowModel}
                        onChange={(e) => handleInputChange('flowModel', e.target.value)}
                      >
                        <option value="constant">Constant Flow</option>
                        <option value="constant-pressure">Constant Pressure</option>
                        <option value="programmed">Programmed</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={calculateFlows}
                className="w-full"
                size="lg"
                variant="brand"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Flow Rates
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results and Schematic */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="space-y-6">
          {/* Flow Results */}
          {results && (
            <div className="space-y-4">
              <ResultCard
                title="Total Flow"
                value={results.totalFlow}
                unit="mL/min"
                description="Total carrier gas flow through the inlet"
                status="success"
              />
              
              <ResultCard
                title="Split Flow"
                value={results.splitFlow}
                unit="mL/min"
                description="Flow diverted to split vent"
                status="info"
              />
              
              <ResultCard
                title="Column Flow"
                value={results.columnFlow}
                unit="mL/min"
                description="Flow entering the analytical column"
                status="success"
              />
            </div>
          )}

          {/* Simple Schematic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Inlet Schematic</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <div className="text-sm text-gray-600 mb-4">Simplified Inlet Flow Diagram</div>
                  
                  {/* Inlet */}
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mx-auto max-w-xs">
                    <div className="text-sm font-semibold text-blue-800">Inlet</div>
                    <div className="text-xs text-blue-600">
                      {formData.temperature}°C, {formData.pressure} psi
                    </div>
                  </div>
                  
                  {/* Flow arrows */}
                  <div className="flex justify-center space-x-8">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Split Flow</div>
                      <div className="text-sm font-semibold text-red-600">
                        {results ? `${results.splitFlow} mL/min` : '--'}
                      </div>
                      <div className="text-xs text-gray-500">→ Vent</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Column Flow</div>
                      <div className="text-sm font-semibold text-green-600">
                        {results ? `${results.columnFlow} mL/min` : '--'}
                      </div>
                      <div className="text-xs text-gray-500">→ Column</div>
                    </div>
                  </div>
                  
                  {/* Column */}
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mx-auto max-w-xs">
                    <div className="text-sm font-semibold text-green-800">Analytical Column</div>
                    <div className="text-xs text-green-600">30m × 0.25mm × 0.25μm</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
