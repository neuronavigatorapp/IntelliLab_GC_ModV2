import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';

import { ResultCard } from '../components/ResultCard';
import { Calculator, HelpCircle } from 'lucide-react';
import { validatePositive } from '../lib/validators';
import { useToast } from '../hooks/use-toast';

interface DetectionLimitProps {
  onNavigate: (path: string) => void;
}

export const DetectionLimit: React.FC<DetectionLimitProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    signalIntensity: '',
    noiseLevel: '',
    sampleConcentration: '',
    injectionVolume: ''
  });
  const [expertExplanations, setExpertExplanations] = useState(true);
  const [result, setResult] = useState<{
    detectionLimit: number;
    confidence: string;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const validations = [
      { field: 'signalIntensity', value: formData.signalIntensity, validator: validatePositive },
      { field: 'noiseLevel', value: formData.noiseLevel, validator: validatePositive },
      { field: 'sampleConcentration', value: formData.sampleConcentration, validator: validatePositive },
      { field: 'injectionVolume', value: formData.injectionVolume, validator: validatePositive }
    ];

    for (const { field, value, validator } of validations) {
      const validation = validator(value);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: `${field}: ${validation.message}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const calculateDetectionLimit = async () => {
    if (!validateForm()) return;

    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const signal = parseFloat(formData.signalIntensity);
    const noise = parseFloat(formData.noiseLevel);
    const concentration = parseFloat(formData.sampleConcentration);

    // Professional detection limit calculation (3σ method)
    const signalToNoiseRatio = signal / noise;
    const detectionLimit = (3 * concentration) / signalToNoiseRatio;
    
    const confidence = signalToNoiseRatio >= 10 ? 'High' : 
                     signalToNoiseRatio >= 3 ? 'Medium' : 'Low';

    setResult({
      detectionLimit: Math.round(detectionLimit * 1000) / 1000, // Round to 3 decimal places
      confidence
    });

    setIsCalculating(false);

    toast({
      title: "Calculation Complete",
      description: `Detection limit calculated: ${detectionLimit.toFixed(3)} mg/L`,
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {pageTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={tab.id === 'detection-limit' ? 'default' : 'ghost'}
              size="sm"
              className={`text-sm px-4 py-2 rounded-md transition-all ${
                tab.id === 'detection-limit' 
                  ? 'bg-white shadow-sm text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
              onClick={() => {
                if (tab.id === 'oven-ramp') onNavigate('/oven-ramp');
                else if (tab.id === 'inlet-simulator') onNavigate('/inlet-simulator');
                else if (tab.id === 'ai-troubleshooting') onNavigate('/troubleshooting');
                else if (tab.id === 'fleet-manager') onNavigate('/fleet-manager');
                else if (tab.id === 'split-ratio') onNavigate('/split-ratio');
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={expertExplanations}
            onCheckedChange={setExpertExplanations}
            id="expert-explanations"
          />
          <Label htmlFor="expert-explanations" className="text-sm font-medium">
            Expert Explanations
          </Label>
        </div>
      </div>

      {/* Main Card Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Detection Limit Calculator</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="signal-intensity" className="flex items-center space-x-2 text-sm font-medium">
                  <span>Signal Intensity</span>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </Label>
                <div className="relative">
                  <Input
                    id="signal-intensity"
                    type="number"
                    placeholder="Enter signal intensity"
                    value={formData.signalIntensity}
                    onChange={(e) => handleInputChange('signalIntensity', e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    mV
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noise-level" className="text-sm font-medium">Noise Level</Label>
                <div className="relative">
                  <Input
                    id="noise-level"
                    type="number"
                    placeholder="Enter noise level"
                    value={formData.noiseLevel}
                    onChange={(e) => handleInputChange('noiseLevel', e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    mV
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample-concentration" className="text-sm font-medium">Sample Concentration (mg/L)</Label>
                <Input
                  id="sample-concentration"
                  type="number"
                  placeholder="Enter concentration"
                  value={formData.sampleConcentration}
                  onChange={(e) => handleInputChange('sampleConcentration', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="injection-volume" className="text-sm font-medium">Injection Volume (µL)</Label>
                <Input
                  id="injection-volume"
                  type="number"
                  placeholder="Enter injection volume"
                  value={formData.injectionVolume}
                  onChange={(e) => handleInputChange('injectionVolume', e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={calculateDetectionLimit}
              disabled={isCalculating}
              className="w-full"
              size="lg"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Detection Limit
                </>
              )}
            </Button>

            {expertExplanations && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Expert Explanation</h4>
                <p className="text-sm text-blue-800">
                  The detection limit is calculated using the 3σ method: DL = (3 × concentration) / (signal/noise ratio). 
                  This provides a 99.7% confidence level for detection.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Result Area - appears below on calculate */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultCard
            title="Detection Limit Result"
            value={result.detectionLimit}
            unit="mg/L"
            description={`Confidence level: ${result.confidence}. This value represents the minimum concentration that can be reliably detected with 99.7% confidence.`}
            status={result.confidence === 'High' ? 'success' : result.confidence === 'Medium' ? 'warning' : 'info'}
          />
        </motion.div>
      )}
    </div>
  );
};
