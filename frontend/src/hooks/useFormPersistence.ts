import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  storageKey: string;
  debounceMs?: number;
  version?: number;
}

export function useFormPersistence<T extends Record<string, any>>(
  initialValues: T,
  options: FormPersistenceOptions
) {
  const { storageKey, debounceMs = 500, version = 1 } = options;
  const fullKey = `form_${storageKey}_v${version}`;
  
  // Load saved values or use initial
  const [values, setValues] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(fullKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate saved data has expected keys
        const hasAllKeys = Object.keys(initialValues).every(key => key in parsed);
        if (hasAllKeys) {
          return { ...initialValues, ...parsed };
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
    return initialValues;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(values));
      } catch (error) {
        console.error('Failed to save form data:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [values, fullKey, debounceMs]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    localStorage.removeItem(fullKey);
    setValues(initialValues);
  }, [fullKey, initialValues]);

  // Update single field
  const updateField = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setValues(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    values,
    updateField,
    updateFields,
    clearSaved,
    setValues
  };
}
