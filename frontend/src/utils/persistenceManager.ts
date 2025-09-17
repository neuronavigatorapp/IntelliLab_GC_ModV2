/**
 * IntelliLab GC Frontend - Persistent Memory Management
 * Ensures robust client-side data persistence and state management
 */

import React from 'react';

interface PersistentData {
  id: string;
  timestamp: number;
  data: any;
  expiry?: number;
}

interface SessionData {
  sessionId: string;
  userId: string;
  preferences: UserPreferences;
  currentTool: string | null;
  toolStates: Record<string, any>;
  calculationHistory: CalculationResult[];
  recentFiles: FileReference[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'professional';
  precision: number;
  autoSave: boolean;
  chartSettings: ChartPreferences;
  calculationDefaults: CalculationDefaults;
}

interface ChartPreferences {
  defaultType: 'line' | 'bar' | 'scatter';
  showGridlines: boolean;
  autoScale: boolean;
  colorScheme: string;
}

interface CalculationDefaults {
  detectionLimitMethod: '3sigma' | '10sigma' | 'blank_plus_3std';
  uncertaintyCalculations: boolean;
  roundResults: boolean;
  significantFigures: number;
}

interface CalculationResult {
  id: string;
  type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  timestamp: number;
  executionTime: number;
}

interface FileReference {
  id: string;
  name: string;
  path: string;
  type: string;
  lastOpened: number;
  size: number;
}

class FrontendPersistenceManager {
  private dbName = 'IntelliLabGC_Frontend';
  private version = 2;
  private db: IDBDatabase | null = null;
  private sessionId: string;
  
  // Store names
  private stores = {
    userPreferences: 'user_preferences',
    sessionData: 'session_data', 
    calculationHistory: 'calculation_history',
    instrumentConfigs: 'instrument_configs',
    methodTemplates: 'method_templates',
    recentFiles: 'recent_files',
    appState: 'app_state',
    cache: 'cache'
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDatabase();
    this.startPeriodicSave();
    this.setupBeforeUnloadHandler();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to initialize IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        
        // Load existing session or create new one
        this.loadOrCreateSession();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add indexes based on store type
            switch (storeName) {
              case this.stores.calculationHistory:
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
              case this.stores.sessionData:
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
              case this.stores.recentFiles:
                store.createIndex('lastOpened', 'lastOpened', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                break;
              case this.stores.cache:
                store.createIndex('expiry', 'expiry', { unique: false });
                break;
            }
          }
        });
      };
    });
  }

  // === Core Storage Operations ===

  private async store<T>(storeName: string, id: string, data: T, expiry?: number): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const persistentData: PersistentData = {
        id,
        timestamp: Date.now(),
        data,
        ...(expiry && { expiry })
      };

      const request = store.put(persistentData);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error(`Failed to store data in ${storeName}:`, request.error);
        resolve(false);
      };
    });
  }

  private async retrieve<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as PersistentData;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check expiry
        if (result.expiry && Date.now() > result.expiry) {
          this.delete(storeName, id); // Clean up expired data
          resolve(null);
          return;
        }

        resolve(result.data as T);
      };

      request.onerror = () => {
        console.error(`Failed to retrieve data from ${storeName}:`, request.error);
        resolve(null);
      };
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as PersistentData[];
        const now = Date.now();
        
        // Filter out expired items and extract data
        const validData = results
          .filter(item => !item.expiry || now <= item.expiry)
          .map(item => item.data as T);

        resolve(validData);
      };

      request.onerror = () => {
        console.error(`Failed to get all data from ${storeName}:`, request.error);
        resolve([]);
      };
    });
  }

  private async delete(storeName: string, id: string): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  // === User Preferences Management ===

  async saveUserPreferences(preferences: UserPreferences): Promise<boolean> {
    return this.store(this.stores.userPreferences, 'current', preferences);
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const stored = await this.retrieve<UserPreferences>(this.stores.userPreferences, 'current');
    
    // Return defaults if no preferences stored
    return stored || {
      theme: 'professional',
      precision: 4,
      autoSave: true,
      chartSettings: {
        defaultType: 'line',
        showGridlines: true,
        autoScale: true,
        colorScheme: 'professional'
      },
      calculationDefaults: {
        detectionLimitMethod: '3sigma',
        uncertaintyCalculations: true,
        roundResults: true,
        significantFigures: 4
      }
    };
  }

  // === Session Management ===

  private async loadOrCreateSession(): Promise<void> {
    // Try to load existing session from today
    const today = new Date().toDateString();
    const existingSession = await this.retrieve<SessionData>(this.stores.sessionData, today);

    if (existingSession) {
      // Restore session
      this.restoreSessionState(existingSession);
    } else {
      // Create new session
      await this.createNewSession();
    }
  }

  private async createNewSession(): Promise<void> {
    const preferences = await this.getUserPreferences();
    
    const sessionData: SessionData = {
      sessionId: this.sessionId,
      userId: 'anonymous', // Could be enhanced with actual user auth
      preferences,
      currentTool: null,
      toolStates: {},
      calculationHistory: [],
      recentFiles: []
    };

    await this.saveSessionData(sessionData);
  }

  async saveSessionData(sessionData: Partial<SessionData>): Promise<boolean> {
    const today = new Date().toDateString();
    const existing = await this.retrieve<SessionData>(this.stores.sessionData, today);
    
    const updated: SessionData = {
      ...existing,
      ...sessionData,
      sessionId: this.sessionId
    } as SessionData;

    return this.store(this.stores.sessionData, today, updated);
  }

  async getCurrentSessionData(): Promise<SessionData | null> {
    const today = new Date().toDateString();
    return this.retrieve<SessionData>(this.stores.sessionData, today);
  }

  private restoreSessionState(sessionData: SessionData): void {
    // Dispatch events or call callbacks to restore UI state
    window.dispatchEvent(new CustomEvent('sessionRestored', { 
      detail: sessionData 
    }));
  }

  // === Calculation History Management ===

  async saveCalculationResult(result: CalculationResult): Promise<boolean> {
    const success = await this.store(this.stores.calculationHistory, result.id, result);
    
    if (success) {
      // Also update session data
      const sessionData = await this.getCurrentSessionData();
      if (sessionData) {
        sessionData.calculationHistory = sessionData.calculationHistory || [];
        sessionData.calculationHistory.unshift(result);
        
        // Keep only last 50 in session
        if (sessionData.calculationHistory.length > 50) {
          sessionData.calculationHistory = sessionData.calculationHistory.slice(0, 50);
        }
        
        await this.saveSessionData(sessionData);
      }
    }
    
    return success;
  }

  async getCalculationHistory(limit: number = 20): Promise<CalculationResult[]> {
    const allCalculations = await this.getAll<CalculationResult>(this.stores.calculationHistory);
    
    // Sort by timestamp (newest first) and limit
    return allCalculations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getCalculationsByType(type: string): Promise<CalculationResult[]> {
    const allCalculations = await this.getAll<CalculationResult>(this.stores.calculationHistory);
    
    return allCalculations
      .filter(calc => calc.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // === File Management ===

  async addRecentFile(file: FileReference): Promise<boolean> {
    // Remove if already exists
    await this.delete(this.stores.recentFiles, file.id);
    
    // Add with current timestamp
    file.lastOpened = Date.now();
    
    const success = await this.store(this.stores.recentFiles, file.id, file);
    
    if (success) {
      // Clean up old files (keep only last 20)
      const allFiles = await this.getAll<FileReference>(this.stores.recentFiles);
      const sorted = allFiles.sort((a, b) => b.lastOpened - a.lastOpened);
      
      if (sorted.length > 20) {
        for (let i = 20; i < sorted.length; i++) {
          await this.delete(this.stores.recentFiles, sorted[i].id);
        }
      }
    }
    
    return success;
  }

  async getRecentFiles(): Promise<FileReference[]> {
    const files = await this.getAll<FileReference>(this.stores.recentFiles);
    return files.sort((a, b) => b.lastOpened - a.lastOpened);
  }

  // === Application State Management ===

  async saveAppState(key: string, state: any): Promise<boolean> {
    return this.store(this.stores.appState, key, state);
  }

  async getAppState<T>(key: string): Promise<T | null> {
    return this.retrieve<T>(this.stores.appState, key);
  }

  // === Cache Management ===

  async cacheData(key: string, data: any, ttlMinutes: number = 30): Promise<boolean> {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    return this.store(this.stores.cache, key, data, expiry);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return this.retrieve<T>(this.stores.cache, key);
  }

  // === Cleanup and Maintenance ===

  private async cleanupExpiredData(): Promise<void> {
    if (!this.db) return;

    const stores = Object.values(this.stores);
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value as PersistentData;
          
          // Delete expired items
          if (data.expiry && Date.now() > data.expiry) {
            cursor.delete();
          }
          
          cursor.continue();
        }
      };
    }
  }

  async exportData(): Promise<string> {
    const exportData: Record<string, any> = {};
    
    for (const [key, storeName] of Object.entries(this.stores)) {
      exportData[key] = await this.getAll(storeName);
    }
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: this.version,
      sessionId: this.sessionId,
      data: exportData
    }, null, 2);
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    storeStats: Record<string, { count: number; estimatedSize: number }>;
  }> {
    const stats: Record<string, { count: number; estimatedSize: number }> = {};
    let totalSize = 0;

    for (const [key, storeName] of Object.entries(this.stores)) {
      const data = await this.getAll(storeName);
      const estimatedSize = JSON.stringify(data).length;
      
      stats[key] = {
        count: data.length,
        estimatedSize
      };
      
      totalSize += estimatedSize;
    }

    return { totalSize, storeStats: stats };
  }

  // === Automatic Persistence ===

  private startPeriodicSave(): void {
    // Auto-save session data every 30 seconds
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 30000);

    // Cleanup expired data every 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 5 * 60 * 1000);
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', async () => {
      // Save current state before page unload
      const currentState = {
        timestamp: Date.now(),
        currentUrl: window.location.href,
        scrollPosition: window.scrollY
      };
      
      await this.saveAppState('lastSession', currentState);
    });
  }

  // === Public API ===

  async ensureDataPersistence(): Promise<boolean> {
    try {
      // Test database operations
      const testKey = `test_${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };
      
      // Test write
      const writeSuccess = await this.store(this.stores.cache, testKey, testData);
      if (!writeSuccess) return false;
      
      // Test read
      const readData = await this.retrieve(this.stores.cache, testKey);
      if (!readData) return false;
      
      // Test delete
      const deleteSuccess = await this.delete(this.stores.cache, testKey);
      if (!deleteSuccess) return false;
      
      console.log('Frontend persistence validated successfully');
      return true;
    } catch (error) {
      console.error('Frontend persistence validation failed:', error);
      return false;
    }
  }
}

// === Global Instance and Utilities ===

let persistenceManager: FrontendPersistenceManager | null = null;

export function getPersistenceManager(): FrontendPersistenceManager {
  if (!persistenceManager) {
    persistenceManager = new FrontendPersistenceManager();
  }
  return persistenceManager;
}

export async function ensureFrontendPersistence(): Promise<boolean> {
  const manager = getPersistenceManager();
  return manager.ensureDataPersistence();
}

// === React Hooks for Easy Integration ===

export function usePersistentState<T>(
  key: string, 
  defaultValue: T, 
  _storeName: string = 'app_state'
): [T, (value: T) => Promise<void>] {
  const [state, setState] = React.useState<T>(defaultValue);
  const manager = getPersistenceManager();

  // Load initial value
  React.useEffect(() => {
    const loadInitialValue = async () => {
      const stored = await manager.getAppState<T>(key);
      if (stored !== null) {
        setState(stored);
      }
    };
    
    loadInitialValue();
  }, [key]);

  const updateState = async (value: T) => {
    setState(value);
    await manager.saveAppState(key, value);
  };

  return [state, updateState];
}

export function useCalculationHistory(): {
  history: CalculationResult[];
  addCalculation: (result: CalculationResult) => Promise<void>;
  getByType: (type: string) => Promise<CalculationResult[]>;
} {
  const [history, setHistory] = React.useState<CalculationResult[]>([]);
  const manager = getPersistenceManager();

  const loadHistory = React.useCallback(async () => {
    const results = await manager.getCalculationHistory();
    setHistory(results);
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addCalculation = async (result: CalculationResult) => {
    await manager.saveCalculationResult(result);
    await loadHistory(); // Refresh the list
  };

  const getByType = async (type: string) => {
    return manager.getCalculationsByType(type);
  };

  return { history, addCalculation, getByType };
}

export function useUserPreferences(): {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
} {
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null);
  const manager = getPersistenceManager();

  React.useEffect(() => {
    const loadPreferences = async () => {
      const prefs = await manager.getUserPreferences();
      setPreferences(prefs);
    };
    
    loadPreferences();
  }, []);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    
    const updated = { ...preferences, ...updates };
    await manager.saveUserPreferences(updated);
    setPreferences(updated);
  };

  return { 
    preferences: preferences || {
      theme: 'professional',
      precision: 4,
      autoSave: true,
      chartSettings: {
        defaultType: 'line',
        showGridlines: true,
        autoScale: true,
        colorScheme: 'professional'
      },
      calculationDefaults: {
        detectionLimitMethod: '3sigma',
        uncertaintyCalculations: true,
        roundResults: true,
        significantFigures: 4
      }
    }, 
    updatePreferences 
  };
}

// Export types for use in other components
export type {
  PersistentData,
  SessionData,
  UserPreferences,
  CalculationResult,
  FileReference,
  ChartPreferences,
  CalculationDefaults
};

export default FrontendPersistenceManager;