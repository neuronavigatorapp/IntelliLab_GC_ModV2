import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface ApiStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastCheck: Date | null;
}

export function useApiStatus(checkInterval: number = 30000) {
  const [status, setStatus] = useState<ApiStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastCheck: null,
  });

  const checkApiHealth = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      await apiClient.healthCheck();
      setStatus({
        isConnected: true,
        isLoading: false,
        error: null,
        lastCheck: new Date(),
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      });
    }
  };

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkInterval]);

  return { status, refresh: checkApiHealth };
}