import React, { useState } from 'react';
import { Alert } from '@mui/material';
import { Thermostat, Timeline } from '@mui/icons-material';
import { ProfessionalTabContent } from './ProfessionalTabContent';
import { ProfessionalForm } from './ProfessionalForm';
import { ProfessionalResults } from './ProfessionalResults';

export const OvenRampCalculator: React.FC = () => {
  // Form state matching the HTML design
  const [initialTemp, setInitialTemp] = useState<number>(50);
  const [finalTemp, setFinalTemp] = useState<number>(300);
  const [rampRate, setRampRate] = useState<number>(10);
  const [holdTime, setHoldTime] = useState<number>(5);
  const [results, setResults] = useState<{
    totalTime: number;
    efficiency: number;
    energyCost: number;
    recommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateOvenRamp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (finalTemp <= initialTemp) {
        throw new Error('Final temperature must be greater than initial temperature');
      }
      if (rampRate <= 0) {
        throw new Error('Ramp rate must be positive');
      }
      if (holdTime < 0) {
        throw new Error('Hold time cannot be negative');
      }

      // Professional calculations
      const rampTime = (finalTemp - initialTemp) / rampRate;
      const totalTime = rampTime + holdTime;
      
      // Efficiency calculation based on separation theory
      // Optimal programs balance speed vs resolution
      const tempRange = finalTemp - initialTemp;
      const timeEfficiency = Math.max(0, 100 - (totalTime - 20) * 1.5);
      const rampEfficiency = rampRate > 5 && rampRate < 20 ? 100 : Math.max(60, 100 - Math.abs(rampRate - 12) * 3);
      const rangeEfficiency = tempRange > 200 && tempRange < 300 ? 100 : Math.max(70, 100 - Math.abs(tempRange - 250) * 0.2);
      
      const efficiency = Math.min(95, (timeEfficiency + rampEfficiency + rangeEfficiency) / 3);
      
      // Energy cost estimation (based on typical GC power consumption)
      const basePower = 2.5; // kW base consumption
      const heatingPower = tempRange * 0.01; // Additional power for heating
      const energyCost = (basePower + heatingPower) * (totalTime / 60) * 0.15; // $/kWh
      
      // Professional recommendations
      let recommendation = '';
      if (efficiency > 85) {
        recommendation = 'Excellent program efficiency. Well optimized for speed and separation. This method meets industrial standards for high-throughput analysis.';
      } else if (efficiency > 70) {
        recommendation = 'Good program efficiency. Consider minor adjustments: optimize ramp rate (8-15°C/min) or reduce hold time for better throughput.';
      } else if (totalTime > 40) {
        recommendation = 'Program efficiency needs improvement. Consider faster ramp rates (10-20°C/min) or shorter hold times to improve throughput without compromising separation.';
      } else if (rampRate > 25) {
        recommendation = 'Very fast ramp rate may compromise separation. Consider reducing to 15-20°C/min for better peak resolution and reproducibility.';
      } else {
        recommendation = 'Program needs optimization. Review temperature range, ramp rate, and hold time settings. Consider method development studies for optimal conditions.';
      }
      
      setResults({
        totalTime: Math.round(totalTime * 10) / 10,
        efficiency: Math.round(efficiency * 10) / 10,
        energyCost: Math.round(energyCost * 100) / 100,
        recommendation,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      id: 'initial_temp',
      label: 'Initial Temperature',
      type: 'number' as const,
      value: initialTemp,
      step: '1',
      unit: '°C',
    },
    {
      id: 'final_temp',
      label: 'Final Temperature',
      type: 'number' as const,
      value: finalTemp,
      step: '1',
      unit: '°C',
    },
    {
      id: 'ramp_rate',
      label: 'Ramp Rate',
      type: 'number' as const,
      value: rampRate,
      step: '0.1',
      unit: '°C/min',
    },
    {
      id: 'hold_time',
      label: 'Hold Time',
      type: 'number' as const,
      value: holdTime,
      step: '0.1',
      unit: 'min',
    },
  ];

  const handleFieldChange = (id: string, value: string | number) => {
    switch (id) {
      case 'initial_temp':
        setInitialTemp(Number(value));
        break;
      case 'final_temp':
        setFinalTemp(Number(value));
        break;
      case 'ramp_rate':
        setRampRate(Number(value));
        break;
      case 'hold_time':
        setHoldTime(Number(value));
        break;
    }
  };

  const resultItems = results ? [
    {
      id: 'total-time',
      value: results.totalTime.toString(),
      label: 'Total Time',
      unit: 'min',
    },
    {
      id: 'efficiency',
      value: results.efficiency.toString(),
      label: 'Efficiency Score',
      unit: '%',
      color: (results.efficiency > 85 ? 'success' : results.efficiency > 70 ? 'primary' : 'warning') as 'primary' | 'success' | 'warning' | 'error',
    },
    {
      id: 'energy-cost',
      value: results.energyCost.toFixed(2),
      label: 'Energy Cost',
      unit: '$',
    },
  ] : [];

  return (
    <ProfessionalTabContent
      title="Oven Ramp Visualizer"
      subtitle="Design and optimize temperature programs for maximum separation efficiency and analysis speed."
      icon={<Thermostat />}
    >
      <ProfessionalForm
        fields={formFields}
        onFieldChange={handleFieldChange}
        onSubmit={calculateOvenRamp}
        submitLabel="Calculate Program"
        submitIcon={<Timeline />}
        isLoading={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <ProfessionalResults
        title="Program Analysis"
        results={resultItems}
        recommendation={results ? {
          text: results.recommendation,
          type: results.efficiency > 85 ? 'success' : results.efficiency > 70 ? 'info' : 'warning',
          icon: 'tips',
        } : undefined}
        isVisible={!!results}
      />
    </ProfessionalTabContent>
  );
};

export default OvenRampCalculator;
