import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import instrumentsReducer from './slices/instrumentsSlice';
import calculationsReducer from './slices/calculationsSlice';
import uiReducer from './slices/uiSlice';
import websocketReducer from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    instruments: instrumentsReducer,
    calculations: calculationsReducer,
    ui: uiReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/messageReceived'],
        ignoredPaths: ['websocket.messages'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 