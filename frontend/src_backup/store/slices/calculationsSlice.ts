import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { calculationsAPI } from '../../services/apiService';
import {
  InletSimulationRequest,
  InletSimulationResponse,
  DetectionLimitRequest,
  DetectionLimitResponse,
  OvenRampRequest,
  OvenRampResponse,
  CalculationHistory,
} from '../../types';

// Async thunks
export const performInletSimulation = createAsyncThunk(
  'calculations/inletSimulation',
  async (data: InletSimulationRequest) => {
    const response = await calculationsAPI.inletSimulation(data);
    return response.data;
  }
);

export const performDetectionLimitCalculation = createAsyncThunk(
  'calculations/detectionLimit',
  async (data: DetectionLimitRequest) => {
    const response = await calculationsAPI.detectionLimit(data);
    return response.data;
  }
);

export const performOvenRampCalculation = createAsyncThunk(
  'calculations/ovenRamp',
  async (data: OvenRampRequest) => {
    const response = await calculationsAPI.ovenRamp(data);
    return response.data;
  }
);

export const fetchCalculationHistory = createAsyncThunk(
  'calculations/fetchHistory',
  async (params?: { calculationType?: string; limit?: number }) => {
    const response = await calculationsAPI.getHistory();
    return response.data;
  }
);

// State interface
interface CalculationsState {
  inletSimulation: InletSimulationResponse | null;
  detectionLimit: DetectionLimitResponse | null;
  ovenRamp: OvenRampResponse | null;
  loading: boolean;
  error: string | null;
  history: CalculationHistory[];
  historyLoading: boolean;
  historyError: string | null;
}

// Initial state
const initialState: CalculationsState = {
  inletSimulation: null,
  detectionLimit: null,
  ovenRamp: null,
  loading: false,
  error: null,
  history: [],
  historyLoading: false,
  historyError: null,
};

// Slice
const calculationsSlice = createSlice({
  name: 'calculations',
  initialState,
  reducers: {
    clearResults: (state) => {
      state.inletSimulation = null;
      state.detectionLimit = null;
      state.ovenRamp = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Inlet Simulation
    builder
      .addCase(performInletSimulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performInletSimulation.fulfilled, (state, action) => {
        state.loading = false;
        state.inletSimulation = action.payload;
        state.error = null;
      })
      .addCase(performInletSimulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Inlet simulation failed';
      });

    // Detection Limit
    builder
      .addCase(performDetectionLimitCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performDetectionLimitCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.detectionLimit = action.payload;
        state.error = null;
      })
      .addCase(performDetectionLimitCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Detection limit calculation failed';
      });

    // Oven Ramp
    builder
      .addCase(performOvenRampCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performOvenRampCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.ovenRamp = action.payload;
        state.error = null;
      })
      .addCase(performOvenRampCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Oven ramp calculation failed';
      });

    // History
    builder
      .addCase(fetchCalculationHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchCalculationHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
        state.historyError = null;
      })
      .addCase(fetchCalculationHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.error.message || 'Failed to fetch calculation history';
      });
  },
});

export const { clearResults, clearError, setLoading } = calculationsSlice.actions;
export default calculationsSlice.reducer; 