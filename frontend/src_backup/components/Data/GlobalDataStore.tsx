import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Data Types
export interface Compound {
  id: string;
  name: string;
  formula: string;
  boilingPoint: number;
  vaporPressure: number;
  logKow: number;
  color: string;
  category: string;
  retentionTime?: number;
  peakWidth?: number;
  intensity?: number;
}

export interface Method {
  id: string;
  name: string;
  description: string;
  analysisType: string;
  parameters: {
    initialTemp: number;
    finalTemp: number;
    rampRate: number;
    holdTime: number;
    carrierFlow: number;
    columnLength: number;
    columnDiameter: number;
    filmThickness: number;
    splitRatio: number;
    inletTemp: number;
  };
  compounds: Compound[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'archived';
  performance?: {
    resolution: number;
    analysisTime: number;
    efficiency: number;
  };
}

export interface Instrument {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance' | 'calibration';
  location: string;
  lastCalibration: Date;
  nextCalibration: Date;
  methods: string[]; // Method IDs
  performance: {
    uptime: number;
    samplesProcessed: number;
    averageResolution: number;
  };
}

export interface AnalysisResult {
  id: string;
  methodId: string;
  instrumentId: string;
  timestamp: Date;
  compounds: Compound[];
  chromatogramData: number[];
  timeAxis: number[];
  parameters: Method['parameters'];
  performance: {
    resolution: number;
    analysisTime: number;
    efficiency: number;
    detectionLimits: Record<string, number>;
  };
  status: 'completed' | 'failed' | 'processing';
}

export interface Workflow {
  id: string;
  name: string;
  type: 'design' | 'simulate' | 'deploy' | 'analyze';
  steps: WorkflowStep[];
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'method_design' | 'simulation' | 'deployment' | 'analysis';
  status: 'pending' | 'active' | 'completed' | 'failed';
  data?: any;
  timestamp: Date;
}

// State Interface
export interface GlobalState {
  compounds: Compound[];
  methods: Method[];
  instruments: Instrument[];
  results: AnalysisResult[];
  workflows: Workflow[];
  currentWorkflow?: Workflow;
  loading: boolean;
  error?: string;
}

// Action Types
export type GlobalAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_COMPOUND'; payload: Compound }
  | { type: 'UPDATE_COMPOUND'; payload: Compound }
  | { type: 'DELETE_COMPOUND'; payload: string }
  | { type: 'ADD_METHOD'; payload: Method }
  | { type: 'UPDATE_METHOD'; payload: Method }
  | { type: 'DELETE_METHOD'; payload: string }
  | { type: 'ADD_INSTRUMENT'; payload: Instrument }
  | { type: 'UPDATE_INSTRUMENT'; payload: Instrument }
  | { type: 'DELETE_INSTRUMENT'; payload: string }
  | { type: 'ADD_RESULT'; payload: AnalysisResult }
  | { type: 'UPDATE_RESULT'; payload: AnalysisResult }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'SET_CURRENT_WORKFLOW'; payload: Workflow }
  | { type: 'LOAD_INITIAL_DATA'; payload: Partial<GlobalState> };

// Initial State
const initialState: GlobalState = {
  compounds: [],
  methods: [],
  instruments: [],
  results: [],
  workflows: [],
  loading: false,
};

// Reducer
function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_COMPOUND':
      return { ...state, compounds: [...state.compounds, action.payload] };
    
    case 'UPDATE_COMPOUND':
      return {
        ...state,
        compounds: state.compounds.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'DELETE_COMPOUND':
      return {
        ...state,
        compounds: state.compounds.filter(c => c.id !== action.payload)
      };
    
    case 'ADD_METHOD':
      return { ...state, methods: [...state.methods, action.payload] };
    
    case 'UPDATE_METHOD':
      return {
        ...state,
        methods: state.methods.map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      };
    
    case 'DELETE_METHOD':
      return {
        ...state,
        methods: state.methods.filter(m => m.id !== action.payload)
      };
    
    case 'ADD_INSTRUMENT':
      return { ...state, instruments: [...state.instruments, action.payload] };
    
    case 'UPDATE_INSTRUMENT':
      return {
        ...state,
        instruments: state.instruments.map(i => 
          i.id === action.payload.id ? action.payload : i
        )
      };
    
    case 'DELETE_INSTRUMENT':
      return {
        ...state,
        instruments: state.instruments.filter(i => i.id !== action.payload)
      };
    
    case 'ADD_RESULT':
      return { ...state, results: [...state.results, action.payload] };
    
    case 'UPDATE_RESULT':
      return {
        ...state,
        results: state.results.map(r => 
          r.id === action.payload.id ? action.payload : r
        )
      };
    
    case 'ADD_WORKFLOW':
      return { ...state, workflows: [...state.workflows, action.payload] };
    
    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w => 
          w.id === action.payload.id ? action.payload : w
        )
      };
    
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload };
    
    case 'LOAD_INITIAL_DATA':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

// Context
const GlobalDataContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  actions: {
    addCompound: (compound: Compound) => void;
    updateCompound: (compound: Compound) => void;
    deleteCompound: (id: string) => void;
    addMethod: (method: Method) => void;
    updateMethod: (method: Method) => void;
    deleteMethod: (id: string) => void;
    addInstrument: (instrument: Instrument) => void;
    updateInstrument: (instrument: Instrument) => void;
    deleteInstrument: (id: string) => void;
    addResult: (result: AnalysisResult) => void;
    updateResult: (result: AnalysisResult) => void;
    addWorkflow: (workflow: Workflow) => void;
    updateWorkflow: (workflow: Workflow) => void;
    setCurrentWorkflow: (workflow: Workflow) => void;
    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => void;
  };
} | undefined>(undefined);

// Provider Component
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Local Storage Functions
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('intellilab_gc_data', JSON.stringify({
        compounds: state.compounds,
        methods: state.methods,
        instruments: state.instruments,
        results: state.results,
        workflows: state.workflows,
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [state]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('intellilab_gc_data');
      if (saved) {
        const data = JSON.parse(saved);
        dispatch({ type: 'LOAD_INITIAL_DATA', payload: data });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Auto-save on state changes
  useEffect(() => {
    if (state.compounds.length > 0 || state.methods.length > 0) {
      saveToLocalStorage();
    }
  }, [state, saveToLocalStorage]);

  // Action creators
  const actions = {
    addCompound: (compound: Compound) => {
      dispatch({ type: 'ADD_COMPOUND', payload: compound });
    },
    updateCompound: (compound: Compound) => {
      dispatch({ type: 'UPDATE_COMPOUND', payload: compound });
    },
    deleteCompound: (id: string) => {
      dispatch({ type: 'DELETE_COMPOUND', payload: id });
    },
    addMethod: (method: Method) => {
      dispatch({ type: 'ADD_METHOD', payload: method });
    },
    updateMethod: (method: Method) => {
      dispatch({ type: 'UPDATE_METHOD', payload: method });
    },
    deleteMethod: (id: string) => {
      dispatch({ type: 'DELETE_METHOD', payload: id });
    },
    addInstrument: (instrument: Instrument) => {
      dispatch({ type: 'ADD_INSTRUMENT', payload: instrument });
    },
    updateInstrument: (instrument: Instrument) => {
      dispatch({ type: 'UPDATE_INSTRUMENT', payload: instrument });
    },
    deleteInstrument: (id: string) => {
      dispatch({ type: 'DELETE_INSTRUMENT', payload: id });
    },
    addResult: (result: AnalysisResult) => {
      dispatch({ type: 'ADD_RESULT', payload: result });
    },
    updateResult: (result: AnalysisResult) => {
      dispatch({ type: 'UPDATE_RESULT', payload: result });
    },
    addWorkflow: (workflow: Workflow) => {
      dispatch({ type: 'ADD_WORKFLOW', payload: workflow });
    },
    updateWorkflow: (workflow: Workflow) => {
      dispatch({ type: 'UPDATE_WORKFLOW', payload: workflow });
    },
    setCurrentWorkflow: (workflow: Workflow) => {
      dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow });
    },
    saveToLocalStorage,
    loadFromLocalStorage,
  };

  return (
    <GlobalDataContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GlobalDataContext.Provider>
  );
};

// Hook to use the global data store
export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
};

// Specialized hooks for different data types
export const useSharedMethods = () => {
  const { state, actions } = useGlobalData();
  return {
    methods: state.methods,
    addMethod: actions.addMethod,
    updateMethod: actions.updateMethod,
    deleteMethod: actions.deleteMethod,
  };
};

export const useInstrumentData = () => {
  const { state, actions } = useGlobalData();
  return {
    instruments: state.instruments,
    addInstrument: actions.addInstrument,
    updateInstrument: actions.updateInstrument,
    deleteInstrument: actions.deleteInstrument,
  };
};

export const useAnalyticsData = () => {
  const { state, actions } = useGlobalData();
  return {
    results: state.results,
    addResult: actions.addResult,
    updateResult: actions.updateResult,
  };
};

export const useWorkflowData = () => {
  const { state, actions } = useGlobalData();
  return {
    workflows: state.workflows,
    currentWorkflow: state.currentWorkflow,
    addWorkflow: actions.addWorkflow,
    updateWorkflow: actions.updateWorkflow,
    setCurrentWorkflow: actions.setCurrentWorkflow,
  };
};

export default GlobalDataProvider;
