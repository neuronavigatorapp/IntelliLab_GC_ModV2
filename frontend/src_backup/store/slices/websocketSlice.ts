import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebSocketState, WebSocketMessage } from '../../types';

const initialState: WebSocketState = {
  connected: false,
  messages: [],
  error: null,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },
    messageReceived: (state, action: PayloadAction<WebSocketMessage>) => {
      state.messages.push(action.payload);
      // Keep only the last 100 messages
      if (state.messages.length > 100) {
        state.messages = state.messages.slice(-100);
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(
        (message) => message.id !== action.payload
      );
    },
  },
});

export const websocketActions = {
  setConnected: websocketSlice.actions.setConnected,
  messageReceived: websocketSlice.actions.messageReceived,
  setError: websocketSlice.actions.setError,
  clearError: websocketSlice.actions.clearError,
  clearMessages: websocketSlice.actions.clearMessages,
  removeMessage: websocketSlice.actions.removeMessage,
};

export default websocketSlice.reducer; 