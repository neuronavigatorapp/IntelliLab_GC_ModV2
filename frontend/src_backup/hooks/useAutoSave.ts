import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-save triggers
  onSave: () => Promise<void> | void; // Function to call for saving
  enabled?: boolean; // Whether auto-save is enabled
  showToast?: boolean; // Whether to show toast notifications
}

/**
 * Hook for auto-save functionality
 * Debounces save operations and provides manual save capability
 */
export const useAutoSave = (
  data: any,
  options: AutoSaveOptions
) => {
  const {
    delay = 2000,
    onSave,
    enabled = true,
    showToast = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef(data);
  const isSavingRef = useRef(false);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave();
      previousDataRef.current = data;
      
      if (showToast) {
        toast.success('Changes saved', {
          duration: 2000,
          position: 'bottom-right'
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (showToast) {
        toast.error('Failed to save changes', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, showToast]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveNow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveNow,
    isSaving: isSavingRef.current
  };
};

/**
 * Hook for method auto-save specifically
 */
export const useMethodAutoSave = (
  method: any,
  enabled: boolean = true
) => {
  const saveMethod = useCallback(async () => {
    if (!method?.id) return;

    try {
      const { methodsAPI } = await import('../services/apiService');
      await methodsAPI.update(method.id, method);
    } catch (error) {
      console.error('Failed to save method:', error);
      throw error;
    }
  }, [method]);

  return useAutoSave(method, {
    onSave: saveMethod,
    enabled: enabled && !!method?.id,
    delay: 2000,
    showToast: true
  });
};

/**
 * Hook for compound auto-save
 */
export const useCompoundAutoSave = (
  compound: any,
  enabled: boolean = true
) => {
  const saveCompound = useCallback(async () => {
    if (!compound?.id) return;

    try {
      const { compoundsAPI } = await import('../services/apiService');
      await compoundsAPI.update(compound.id, compound);
    } catch (error) {
      console.error('Failed to save compound:', error);
      throw error;
    }
  }, [compound]);

  return useAutoSave(compound, {
    onSave: saveCompound,
    enabled: enabled && !!compound?.id,
    delay: 1500,
    showToast: true
  });
};

/**
 * Hook for instrument auto-save
 */
export const useInstrumentAutoSave = (
  instrument: any,
  enabled: boolean = true
) => {
  const saveInstrument = useCallback(async () => {
    if (!instrument?.id) return;

    try {
      const { instrumentsAPI } = await import('../services/apiService');
      await instrumentsAPI.update(instrument.id, instrument);
    } catch (error) {
      console.error('Failed to save instrument:', error);
      throw error;
    }
  }, [instrument]);

  return useAutoSave(instrument, {
    onSave: saveInstrument,
    enabled: enabled && !!instrument?.id,
    delay: 2000,
    showToast: true
  });
};

export default useAutoSave;
