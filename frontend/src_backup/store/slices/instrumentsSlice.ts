import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Instrument, InstrumentState, FleetOverview } from '../../types';
import { apiService } from '../../services/apiService';

// Async thunks
export const fetchInstruments = createAsyncThunk(
  'instruments/fetchInstruments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/instruments/');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch instruments');
    }
  }
);

export const createInstrument = createAsyncThunk(
  'instruments/createInstrument',
  async (instrument: Omit<Instrument, 'id'>, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/instruments/', instrument);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create instrument');
    }
  }
);

export const updateInstrument = createAsyncThunk(
  'instruments/updateInstrument',
  async ({ id, instrument }: { id: number; instrument: Partial<Instrument> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/instruments/${id}`, instrument);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update instrument');
    }
  }
);

export const deleteInstrument = createAsyncThunk(
  'instruments/deleteInstrument',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete(`/instruments/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete instrument');
    }
  }
);

export const fetchFleetOverview = createAsyncThunk(
  'instruments/fetchFleetOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/instruments/fleet/overview');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fleet overview');
    }
  }
);

export const getInstrumentPerformance = createAsyncThunk(
  'instruments/getInstrumentPerformance',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/instruments/${id}/performance`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch instrument performance');
    }
  }
);

// Initial state
const initialState: InstrumentState = {
  instruments: [],
  selectedInstrument: null,
  loading: false,
  error: null,
  fleetOverview: null,
};

// Slice
const instrumentsSlice = createSlice({
  name: 'instruments',
  initialState,
  reducers: {
    setSelectedInstrument: (state, action: PayloadAction<Instrument | null>) => {
      state.selectedInstrument = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateInstrumentOptimistic: (state, action: PayloadAction<{ id: number; updates: Partial<Instrument> }>) => {
      const { id, updates } = action.payload;
      const instrument = state.instruments.find(inst => inst.id === id);
      if (instrument) {
        Object.assign(instrument, updates);
      }
      if (state.selectedInstrument?.id === id) {
        Object.assign(state.selectedInstrument, updates);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch instruments
    builder
      .addCase(fetchInstruments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstruments.fulfilled, (state, action) => {
        state.loading = false;
        state.instruments = action.payload;
      })
      .addCase(fetchInstruments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create instrument
    builder
      .addCase(createInstrument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInstrument.fulfilled, (state, action) => {
        state.loading = false;
        state.instruments.push(action.payload);
      })
      .addCase(createInstrument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update instrument
    builder
      .addCase(updateInstrument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInstrument.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.instruments.findIndex(inst => inst.id === action.payload.id);
        if (index !== -1) {
          state.instruments[index] = action.payload;
        }
        if (state.selectedInstrument?.id === action.payload.id) {
          state.selectedInstrument = action.payload;
        }
      })
      .addCase(updateInstrument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete instrument
    builder
      .addCase(deleteInstrument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInstrument.fulfilled, (state, action) => {
        state.loading = false;
        state.instruments = state.instruments.filter(inst => inst.id !== action.payload);
        if (state.selectedInstrument?.id === action.payload) {
          state.selectedInstrument = null;
        }
      })
      .addCase(deleteInstrument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch fleet overview
    builder
      .addCase(fetchFleetOverview.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchFleetOverview.fulfilled, (state, action) => {
        state.fleetOverview = action.payload;
      })
      .addCase(fetchFleetOverview.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Get instrument performance
    builder
      .addCase(getInstrumentPerformance.pending, (state) => {
        state.error = null;
      })
      .addCase(getInstrumentPerformance.fulfilled, (state, action) => {
        // Update the selected instrument with performance data
        if (state.selectedInstrument) {
          state.selectedInstrument.performance_history = action.payload;
        }
      })
      .addCase(getInstrumentPerformance.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedInstrument, clearError, updateInstrumentOptimistic } = instrumentsSlice.actions;
export default instrumentsSlice.reducer; 