import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for shared AI data
export interface AIMethodData {
  id: string;
  parameters: {
    columnTemperature: number;
    injectionVolume: number;
    carrierGasFlow: number;
    splitRatio: number;
  };
  confidence: number;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface AIMaintenanceData {
  id: string;
  component: string;
  healthScore: number;
  predictedFailure: string;
  maintenanceCost: number;
  downtimeHours: number;
  relatedMethods: string[];
  timestamp: string;
}

export interface AICostData {
  id: string;
  category: string;
  currentCost: number;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriod: number;
  relatedComponents: string[];
  relatedMethods: string[];
  timestamp: string;
}

export interface AIInsightCorrelation {
  id: string;
  type: 'method_maintenance' | 'method_cost' | 'maintenance_cost' | 'all_three';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedEngines: ('method' | 'maintenance' | 'cost')[];
  combinedSavings?: number;
  combinedRisk?: number;
  actionItems: string[];
  timestamp: string;
}

export interface AISharedState {
  methodData: AIMethodData[];
  maintenanceData: AIMaintenanceData[];
  costData: AICostData[];
  correlations: AIInsightCorrelation[];
  lastSync: string | null;
}

// Action types for state management
type AISharedAction = 
  | { type: 'ADD_METHOD_DATA'; payload: AIMethodData }
  | { type: 'ADD_MAINTENANCE_DATA'; payload: AIMaintenanceData }
  | { type: 'ADD_COST_DATA'; payload: AICostData }
  | { type: 'ADD_CORRELATION'; payload: AIInsightCorrelation }
  | { type: 'UPDATE_CORRELATIONS'; payload: AIInsightCorrelation[] }
  | { type: 'SYNC_DATA'; payload: Partial<AISharedState> }
  | { type: 'CLEAR_DATA' };

// Initial state
const initialState: AISharedState = {
  methodData: [],
  maintenanceData: [],
  costData: [],
  correlations: [],
  lastSync: null
};

// Reducer for state management
const aiSharedReducer = (state: AISharedState, action: AISharedAction): AISharedState => {
  switch (action.type) {
    case 'ADD_METHOD_DATA':
      return {
        ...state,
        methodData: [...state.methodData, action.payload],
        lastSync: new Date().toISOString()
      };
    
    case 'ADD_MAINTENANCE_DATA':
      return {
        ...state,
        maintenanceData: [...state.maintenanceData, action.payload],
        lastSync: new Date().toISOString()
      };
    
    case 'ADD_COST_DATA':
      return {
        ...state,
        costData: [...state.costData, action.payload],
        lastSync: new Date().toISOString()
      };
    
    case 'ADD_CORRELATION':
      return {
        ...state,
        correlations: [...state.correlations, action.payload],
        lastSync: new Date().toISOString()
      };
    
    case 'UPDATE_CORRELATIONS':
      return {
        ...state,
        correlations: action.payload,
        lastSync: new Date().toISOString()
      };
    
    case 'SYNC_DATA':
      return {
        ...state,
        ...action.payload,
        lastSync: new Date().toISOString()
      };
    
    case 'CLEAR_DATA':
      return initialState;
    
    default:
      return state;
  }
};

// Context
export interface AISharedContextType {
  state: AISharedState;
  dispatch: React.Dispatch<AISharedAction>;
  
  // Helper functions
  addMethodAnalysis: (data: Omit<AIMethodData, 'id' | 'timestamp'>) => void;
  addMaintenanceAnalysis: (data: Omit<AIMaintenanceData, 'id' | 'timestamp'>) => void;
  addCostAnalysis: (data: Omit<AICostData, 'id' | 'timestamp'>) => void;
  
  // Correlation functions
  generateCorrelations: () => AIInsightCorrelation[];
  getMethodMaintenanceCorrelations: () => AIInsightCorrelation[];
  getMethodCostCorrelations: () => AIInsightCorrelation[];
  getMaintenanceCostCorrelations: () => AIInsightCorrelation[];
  
  // Query functions
  getRelatedMaintenanceData: (methodId: string) => AIMaintenanceData[];
  getRelatedCostData: (componentName: string) => AICostData[];
  getTotalPotentialSavings: () => number;
  getHighestRiskComponents: () => AIMaintenanceData[];
}

const AISharedContext = createContext<AISharedContextType | undefined>(undefined);

// Helper function to generate unique IDs
const generateId = () => `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Provider component
export const AISharedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiSharedReducer, initialState);

  // Helper functions
  const addMethodAnalysis = (data: Omit<AIMethodData, 'id' | 'timestamp'>) => {
    const methodData: AIMethodData = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_METHOD_DATA', payload: methodData });
    
    // Auto-generate correlations when new data is added
    setTimeout(() => {
      const correlations = generateCorrelations();
      dispatch({ type: 'UPDATE_CORRELATIONS', payload: correlations });
    }, 100);
  };

  const addMaintenanceAnalysis = (data: Omit<AIMaintenanceData, 'id' | 'timestamp'>) => {
    const maintenanceData: AIMaintenanceData = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_MAINTENANCE_DATA', payload: maintenanceData });
    
    // Auto-generate correlations when new data is added
    setTimeout(() => {
      const correlations = generateCorrelations();
      dispatch({ type: 'UPDATE_CORRELATIONS', payload: correlations });
    }, 100);
  };

  const addCostAnalysis = (data: Omit<AICostData, 'id' | 'timestamp'>) => {
    const costData: AICostData = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_COST_DATA', payload: costData });
    
    // Auto-generate correlations when new data is added
    setTimeout(() => {
      const correlations = generateCorrelations();
      dispatch({ type: 'UPDATE_CORRELATIONS', payload: correlations });
    }, 100);
  };

  // Correlation generation functions
  const generateCorrelations = (): AIInsightCorrelation[] => {
    const correlations: AIInsightCorrelation[] = [];
    
    // Method-Maintenance correlations
    correlations.push(...getMethodMaintenanceCorrelations());
    
    // Method-Cost correlations
    correlations.push(...getMethodCostCorrelations());
    
    // Maintenance-Cost correlations
    correlations.push(...getMaintenanceCostCorrelations());
    
    return correlations;
  };

  const getMethodMaintenanceCorrelations = (): AIInsightCorrelation[] => {
    const correlations: AIInsightCorrelation[] = [];
    
    // Find methods that could impact component health
    state.methodData.forEach(method => {
      state.maintenanceData.forEach(maintenance => {
        if (maintenance.healthScore < 70) {
          // High temperature methods affecting injector health
          if (method.parameters.columnTemperature > 250 && maintenance.component.toLowerCase().includes('injector')) {
            correlations.push({
              id: generateId(),
              type: 'method_maintenance',
              priority: 'high',
              title: 'High Temperature Method Impacting Injector Health',
              description: `Method with ${method.parameters.columnTemperature}°C temperature may accelerate injector wear (current health: ${maintenance.healthScore}%)`,
              affectedEngines: ['method', 'maintenance'],
              combinedRisk: 100 - maintenance.healthScore,
              actionItems: [
                'Reduce column temperature by 10-15°C',
                'Schedule injector maintenance within 2 weeks',
                'Implement temperature ramping to reduce thermal stress'
              ],
              timestamp: new Date().toISOString()
            });
          }
          
          // High injection volume affecting sample path
          if (method.parameters.injectionVolume > 2.0 && maintenance.component.toLowerCase().includes('sample')) {
            correlations.push({
              id: generateId(),
              type: 'method_maintenance',
              priority: 'medium',
              title: 'High Injection Volume Affecting Sample Path',
              description: `${method.parameters.injectionVolume}μL injection volume may contribute to sample path contamination`,
              affectedEngines: ['method', 'maintenance'],
              combinedRisk: 100 - maintenance.healthScore,
              actionItems: [
                'Reduce injection volume to 1.5μL or less',
                'Increase sample path cleaning frequency',
                'Consider splitless injection technique'
              ],
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    });
    
    return correlations;
  };

  const getMethodCostCorrelations = (): AIInsightCorrelation[] => {
    const correlations: AIInsightCorrelation[] = [];
    
    // Find methods that could be optimized for cost
    state.methodData.forEach(method => {
      state.costData.forEach(cost => {
        // High carrier gas flow affecting gas costs
        if (method.parameters.carrierGasFlow > 1.5 && cost.category.toLowerCase().includes('gas')) {
          correlations.push({
            id: generateId(),
            type: 'method_cost',
            priority: 'high',
            title: 'Optimized Gas Flow Could Reduce Costs',
            description: `Method using ${method.parameters.carrierGasFlow} mL/min flow rate - optimization could save ${cost.potentialSavings}/month`,
            affectedEngines: ['method', 'cost'],
            combinedSavings: cost.potentialSavings + method.estimatedSavings,
            actionItems: [
              'Reduce carrier gas flow to 1.2 mL/min',
              'Validate method performance at lower flow rate',
              'Implement flow optimization across all methods'
            ],
            timestamp: new Date().toISOString()
          });
        }
        
        // Low split ratio affecting sample consumption
        if (method.parameters.splitRatio < 10 && cost.category.toLowerCase().includes('sample')) {
          correlations.push({
            id: generateId(),
            type: 'method_cost',
            priority: 'medium',
            title: 'Split Ratio Optimization for Sample Efficiency',
            description: `Current 1:${method.parameters.splitRatio} split ratio - increasing could reduce sample consumption costs`,
            affectedEngines: ['method', 'cost'],
            combinedSavings: cost.potentialSavings * 0.3,
            actionItems: [
              'Evaluate method with 1:20 split ratio',
              'Assess detection limits at higher split ratios',
              'Implement sample volume reduction protocol'
            ],
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    return correlations;
  };

  const getMaintenanceCostCorrelations = (): AIInsightCorrelation[] => {
    const correlations: AIInsightCorrelation[] = [];
    
    // Find maintenance activities that could affect costs
    state.maintenanceData.forEach(maintenance => {
      state.costData.forEach(cost => {
        // Preventive maintenance reducing long-term costs
        if (maintenance.healthScore < 80 && cost.category.toLowerCase().includes('maintenance')) {
          const potentialDowntimeCost = maintenance.downtimeHours * 200; // $200/hour downtime cost
          
          correlations.push({
            id: generateId(),
            type: 'maintenance_cost',
            priority: maintenance.healthScore < 60 ? 'high' : 'medium',
            title: 'Preventive Maintenance Cost Optimization',
            description: `${maintenance.component} maintenance (${maintenance.maintenanceCost}) could prevent ${potentialDowntimeCost} in downtime costs`,
            affectedEngines: ['maintenance', 'cost'],
            combinedSavings: potentialDowntimeCost - maintenance.maintenanceCost,
            actionItems: [
              `Schedule ${maintenance.component} maintenance immediately`,
              'Implement predictive maintenance schedule',
              'Negotiate bulk maintenance contract discounts'
            ],
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    return correlations;
  };

  // Query functions
  const getRelatedMaintenanceData = (methodId: string): AIMaintenanceData[] => {
    const method = state.methodData.find(m => m.id === methodId);
    if (!method) return [];
    
    return state.maintenanceData.filter(maintenance => 
      maintenance.relatedMethods.includes(methodId) ||
      (method.parameters.columnTemperature > 250 && maintenance.component.toLowerCase().includes('injector')) ||
      (method.parameters.injectionVolume > 2.0 && maintenance.component.toLowerCase().includes('sample'))
    );
  };

  const getRelatedCostData = (componentName: string): AICostData[] => {
    return state.costData.filter(cost =>
      cost.relatedComponents.includes(componentName) ||
      cost.category.toLowerCase().includes(componentName.toLowerCase())
    );
  };

  const getTotalPotentialSavings = (): number => {
    const methodSavings = state.methodData.reduce((sum, m) => sum + m.estimatedSavings, 0);
    const costSavings = state.costData.reduce((sum, c) => sum + c.potentialSavings, 0);
    const maintenanceSavings = state.maintenanceData.reduce((sum, m) => 
      sum + (m.downtimeHours * 200 - m.maintenanceCost), 0);
    
    return methodSavings + costSavings + maintenanceSavings;
  };

  const getHighestRiskComponents = (): AIMaintenanceData[] => {
    return state.maintenanceData
      .filter(m => m.healthScore < 80)
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5);
  };

  const contextValue: AISharedContextType = {
    state,
    dispatch,
    addMethodAnalysis,
    addMaintenanceAnalysis,
    addCostAnalysis,
    generateCorrelations,
    getMethodMaintenanceCorrelations,
    getMethodCostCorrelations,
    getMaintenanceCostCorrelations,
    getRelatedMaintenanceData,
    getRelatedCostData,
    getTotalPotentialSavings,
    getHighestRiskComponents
  };

  return (
    <AISharedContext.Provider value={contextValue}>
      {children}
    </AISharedContext.Provider>
  );
};

// Custom hook to use the AI shared context
export const useAIShared = () => {
  const context = useContext(AISharedContext);
  if (context === undefined) {
    throw new Error('useAIShared must be used within an AISharedProvider');
  }
  return context;
};