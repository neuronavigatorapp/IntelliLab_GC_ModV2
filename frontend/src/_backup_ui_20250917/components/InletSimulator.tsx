import React, { useState } from 'react';
import { Alert } from '@mui/material';
import { Input, Speed } from '@mui/icons-material';
import { ProfessionalTabContent } from './ProfessionalTabContent';
import { ProfessionalForm } from './ProfessionalForm';
import { ProfessionalResults } from './ProfessionalResults';

export const InletSimulator: React.FC = () => {
  // Form state matching the HTML design
  const [inletPressure, setInletPressure] = useState<number>(15);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [columnFlow, setColumnFlow] = useState<number>(1.2);
  const [carrierGas, setCarrierGas] = useState<string>('Helium');
  const [results, setResults] = useState<{
    linearVelocity: number;
    residenceTime: number;
    efficiencyScore: number;
    recommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateInletSim = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (inletPressure <= 0) {
        throw new Error('Inlet pressure must be positive');
      }
      if (splitRatio < 1) {
        throw new Error('Split ratio must be at least 1:1');
      }
      if (columnFlow <= 0) {
        throw new Error('Column flow must be positive');
      }

      // Professional inlet calculations
      // Linear velocity calculation (simplified for demonstration)
      // Real calculation would use column dimensions and gas properties
      const gasVelocityFactors = {
        'Helium': 0.8,
        'Hydrogen': 1.2,
        'Nitrogen': 0.6,
      };
      
      const velocityFactor = gasVelocityFactors[carrierGas as keyof typeof gasVelocityFactors] || 0.8;
      const linearVelocity = columnFlow * velocityFactor * (inletPressure / 15);
      
      // Residence time calculation (typical 30m x 0.32mm column)
      const columnLength = 30; // meters
      const residenceTime = (columnLength * 100) / (linearVelocity * 60); // seconds
      
      // Efficiency scoring based on optimal conditions
      let efficiencyScore = 90; // Base score
      
      // Optimal linear velocity for different gases (cm/s)
      const optimalVelocities = {
        'Helium': 25,
        'Hydrogen': 35,
        'Nitrogen': 15,
      };
      
      const optimalVel = optimalVelocities[carrierGas as keyof typeof optimalVelocities] || 25;
      const velocityDeviation = Math.abs(linearVelocity - optimalVel);
      efficiencyScore -= velocityDeviation * 1.5;
      
      // Split ratio effects
      if (splitRatio < 10) {
        efficiencyScore -= 10; // Too low, may overload column
      } else if (splitRatio > 200) {
        efficiencyScore -= 15; // Too high, sensitivity loss
      }
      
      // Pressure effects
      if (inletPressure < 8) {
        efficiencyScore -= 15; // Too low pressure
      } else if (inletPressure > 30) {
        efficiencyScore -= 10; // Excessive pressure
      }
      
      efficiencyScore = Math.max(60, Math.min(95, efficiencyScore));
      
      // Professional recommendations
      let recommendation = '';
      if (efficiencyScore > 85) {
        recommendation = 'Optimal inlet conditions achieved. Excellent transfer efficiency expected with minimal discrimination. System is well-suited for quantitative analysis.';
      } else if (efficiencyScore > 75) {
        recommendation = 'Good inlet conditions. Minor adjustments to pressure or split ratio may improve performance. Consider optimizing for your specific analytes.';
      } else if (linearVelocity < 15) {
        recommendation = 'Linear velocity too low. Increase inlet pressure or reduce split ratio to improve efficiency and reduce analysis time.';
      } else if (linearVelocity > 40) {
        recommendation = 'Linear velocity too high. Reduce inlet pressure or increase split ratio to optimize separation efficiency.';
      } else if (splitRatio > 150) {
        recommendation = 'High split ratio may reduce sensitivity. Consider lowering split ratio or using splitless injection for trace analysis.';
      } else {
        recommendation = 'Inlet conditions need optimization. Consider adjusting pressure (10-20 psi) and split ratio (20-100:1) for better performance.';
      }
      
      setResults({
        linearVelocity: Math.round(linearVelocity * 10) / 10,
        residenceTime: Math.round(residenceTime * 100) / 100,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
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
      id: 'inlet_pressure',
      label: 'Inlet Pressure',
      type: 'number' as const,
      value: inletPressure,
      step: '0.1',
      unit: 'psi',
    },
    {
      id: 'split_ratio',
      label: 'Split Ratio',
      type: 'number' as const,
      value: splitRatio,
      step: '1',
    },
    {
      id: 'column_flow',
      label: 'Column Flow',
      type: 'number' as const,
      value: columnFlow,
      step: '0.1',
      unit: 'mL/min',
    },
    {
      id: 'carrier_gas',
      label: 'Carrier Gas',
      type: 'select' as const,
      value: carrierGas,
      options: [
        { value: 'Helium', label: 'Helium' },
        { value: 'Hydrogen', label: 'Hydrogen' },
        { value: 'Nitrogen', label: 'Nitrogen' },
      ],
    },
  ];

  const handleFieldChange = (id: string, value: string | number) => {
    switch (id) {
      case 'inlet_pressure':
        setInletPressure(Number(value));
        break;
      case 'split_ratio':
        setSplitRatio(Number(value));
        break;
      case 'column_flow':
        setColumnFlow(Number(value));
        break;
      case 'carrier_gas':
        setCarrierGas(String(value));
        break;
    }
  };

  const resultItems = results ? [
    {
      id: 'linear-velocity',
      value: results.linearVelocity.toString(),
      label: 'Linear Velocity',
      unit: 'cm/s',
    },
    {
      id: 'residence-time',
      value: results.residenceTime.toString(),
      label: 'Residence Time',
      unit: 's',
    },
    {
      id: 'efficiency-score',
      value: results.efficiencyScore.toString(),
      label: 'Efficiency Score',
      unit: '%',
      color: (results.efficiencyScore > 85 ? 'success' : results.efficiencyScore > 75 ? 'primary' : 'warning') as 'primary' | 'success' | 'warning' | 'error',
    },
  ] : [];

  return (
    <ProfessionalTabContent
      title="Inlet Simulator"
      subtitle="Optimize injection parameters for maximum transfer efficiency and peak shape quality."
      icon={<Input />}
    >
      <ProfessionalForm
        fields={formFields}
        onFieldChange={handleFieldChange}
        onSubmit={calculateInletSim}
        submitLabel="Run Simulation"
        submitIcon={<Speed />}
        isLoading={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <ProfessionalResults
        title="Simulation Results"
        results={resultItems}
        recommendation={results ? {
          text: results.recommendation,
          type: results.efficiencyScore > 85 ? 'success' : results.efficiencyScore > 75 ? 'info' : 'warning',
          icon: 'fix',
        } : undefined}
        isVisible={!!results}
      />
    </ProfessionalTabContent>
  );
};

export default InletSimulator;
