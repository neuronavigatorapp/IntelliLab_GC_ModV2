/**
 * IntelliLab GC - Integrated Persistence System Demo
 * Demonstrates complete frontend-backend persistence integration
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Database, Save, RotateCcw, FileText, Settings, TrendingUp } from 'lucide-react';
import { getPersistenceManager, useCalculationHistory, useUserPreferences } from '../../utils/persistenceManager';
import type { CalculationResult, FileReference } from '../../utils/persistenceManager';

interface PersistenceStatus {
  frontend: 'checking' | 'ready' | 'error';
  backend: 'checking' | 'ready' | 'error';
  database: 'checking' | 'ready' | 'error';
}

interface StorageStats {
  totalSize: number;
  storeStats: Record<string, { count: number; estimatedSize: number }>;
}

export default function PersistenceDemo() {
  const [status, setStatus] = useState<PersistenceStatus>({
    frontend: 'checking',
    backend: 'checking', 
    database: 'checking'
  });

  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { history, addCalculation } = useCalculationHistory();
  const { preferences, updatePreferences } = useUserPreferences();

  const persistenceManager = getPersistenceManager();

  useEffect(() => {
    checkSystemStatus();
    loadStorageStats();
  }, []);

  const checkSystemStatus = async () => {
    // Check frontend persistence
    try {
      const frontendReady = await persistenceManager.ensureDataPersistence();
      setStatus(prev => ({ 
        ...prev, 
        frontend: frontendReady ? 'ready' : 'error' 
      }));
    } catch (error) {
      console.error('Frontend persistence check failed:', error);
      setStatus(prev => ({ ...prev, frontend: 'error' }));
    }

    // Check backend connection
    try {
      const response = await fetch('http://localhost:8000/health');
      const backendReady = response.ok;
      setStatus(prev => ({ 
        ...prev, 
        backend: backendReady ? 'ready' : 'error' 
      }));
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setStatus(prev => ({ ...prev, backend: 'error' }));
    }

    // Check database (via backend)
    try {
      const response = await fetch('http://localhost:8000/database/status');
      const dbStatus = response.ok;
      setStatus(prev => ({ 
        ...prev, 
        database: dbStatus ? 'ready' : 'error' 
      }));
    } catch (error) {
      console.error('Database check failed:', error);
      setStatus(prev => ({ ...prev, database: 'error' }));
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await persistenceManager.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const runPersistenceTests = async () => {
    setIsRunningTests(true);
    const results: string[] = [];

    // Test 1: User Preferences
    try {
      results.push('Testing user preferences persistence...');
      await updatePreferences({ precision: 6 });
      const savedPrefs = await persistenceManager.getUserPreferences();
      
      if (savedPrefs.precision === 6) {
        results.push('✓ User preferences: PASSED');
      } else {
        results.push('✗ User preferences: FAILED');
      }
    } catch (error) {
      results.push(`✗ User preferences: ERROR - ${error}`);
    }

    // Test 2: Calculation History
    try {
      results.push('Testing calculation history...');
      const testCalc: CalculationResult = {
        id: `test_${Date.now()}`,
        type: 'detection_limit',
        inputs: { blank: [0.1, 0.2, 0.15], sample: [5.2, 5.1, 5.3] },
        outputs: { detectionLimit: 0.45, method: '3sigma' },
        timestamp: Date.now(),
        executionTime: 150
      };

      await addCalculation(testCalc);
      const storedHistory = await persistenceManager.getCalculationHistory(1);
      
      if (storedHistory.length > 0 && storedHistory[0].id === testCalc.id) {
        results.push('✓ Calculation history: PASSED');
      } else {
        results.push('✗ Calculation history: FAILED');
      }
    } catch (error) {
      results.push(`✗ Calculation history: ERROR - ${error}`);
    }

    // Test 3: Session Data
    try {
      results.push('Testing session data...');
      await persistenceManager.saveSessionData({
        currentTool: 'persistence-demo'
      });
      
      const sessionData = await persistenceManager.getCurrentSessionData();
      
      if (sessionData?.currentTool === 'persistence-demo') {
        results.push('✓ Session data: PASSED');
      } else {
        results.push('✗ Session data: FAILED');
      }
    } catch (error) {
      results.push(`✗ Session data: ERROR - ${error}`);
    }

    // Test 4: File References
    try {
      results.push('Testing file references...');
      const testFile: FileReference = {
        id: `file_${Date.now()}`,
        name: 'test_method.json',
        path: '/methods/test_method.json',
        type: 'method',
        lastOpened: Date.now(),
        size: 1024
      };

      await persistenceManager.addRecentFile(testFile);
      const recentFiles = await persistenceManager.getRecentFiles();
      
      if (recentFiles.some((f: FileReference) => f.id === testFile.id)) {
        results.push('✓ File references: PASSED');
      } else {
        results.push('✗ File references: FAILED');
      }
    } catch (error) {
      results.push(`✗ File references: ERROR - ${error}`);
    }

    // Test 5: Cache System
    try {
      results.push('Testing cache system...');
      const testData = { cached: true, timestamp: Date.now() };
      
      await persistenceManager.cacheData('test_cache', testData, 1);
      const cachedData = await persistenceManager.getCachedData<{ cached: boolean; timestamp: number }>('test_cache');
      
      if (cachedData && cachedData.cached === true) {
        results.push('✓ Cache system: PASSED');
      } else {
        results.push('✗ Cache system: FAILED');
      }
    } catch (error) {
      results.push(`✗ Cache system: ERROR - ${error}`);
    }

    // Test 6: Backend Integration
    try {
      results.push('Testing backend integration...');
      const response = await fetch('http://localhost:8000/calculations/detection-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blank_values: [0.1, 0.2, 0.15],
          sample_values: [5.2, 5.1, 5.3],
          method: '3sigma'
        })
      });

      if (response.ok) {
        const data = await response.json();
        results.push('✓ Backend integration: PASSED');
        results.push(`  Detection limit calculated: ${data.detection_limit}`);
      } else {
        results.push('✗ Backend integration: FAILED');
      }
    } catch (error) {
      results.push(`✗ Backend integration: ERROR - ${error}`);
    }

    results.push('');
    results.push('=== Persistence Tests Complete ===');
    
    setTestResults(results);
    setIsRunningTests(false);
    await loadStorageStats(); // Refresh stats
  };

  const exportAllData = async () => {
    try {
      const exportData = await persistenceManager.exportData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellilab_gc_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white mb-4">
            IntelliLab GC
            <span className="block text-3xl font-normal text-blue-200 mt-2">
              Persistence System Integration
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Comprehensive demonstration of frontend and backend data persistence,
            ensuring your analytical data is safely stored and accessible across sessions.
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(status.frontend)}
              <h3 className="text-xl font-semibold text-white">Frontend Storage</h3>
            </div>
            <p className="text-slate-300">
              IndexedDB persistence for user preferences, calculation history, and session data.
            </p>
            <div className="mt-4 text-sm text-slate-400">
              Status: <span className={`font-semibold ${
                status.frontend === 'ready' ? 'text-green-400' : 
                status.frontend === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {status.frontend.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(status.backend)}
              <h3 className="text-xl font-semibold text-white">Backend API</h3>
            </div>
            <p className="text-slate-300">
              FastAPI server handling calculations and data processing.
            </p>
            <div className="mt-4 text-sm text-slate-400">
              Status: <span className={`font-semibold ${
                status.backend === 'ready' ? 'text-green-400' : 
                status.backend === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {status.backend.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(status.database)}
              <h3 className="text-xl font-semibold text-white">Database</h3>
            </div>
            <p className="text-slate-300">
              SQLite databases for persistent analytical data storage.
            </p>
            <div className="mt-4 text-sm text-slate-400">
              Status: <span className={`font-semibold ${
                status.database === 'ready' ? 'text-green-400' : 
                status.database === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {status.database.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Statistics */}
        {storageStats && (
          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Database className="w-6 h-6 text-blue-400" />
              <h3 className="text-2xl font-semibold text-white">Storage Statistics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatBytes(storageStats.totalSize)}
                </div>
                <div className="text-sm text-slate-400">Total Storage Used</div>
              </div>

              {Object.entries(storageStats.storeStats).map(([store, stats]) => (
                <div key={store} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.count}
                  </div>
                  <div className="text-sm text-slate-400 capitalize">
                    {store.replace(/([A-Z])/g, ' $1')} Records
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatBytes(stats.estimatedSize)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Data Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Recent Calculations</h3>
            </div>
            {history.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {history.slice(0, 5).map((calc: CalculationResult) => (
                  <div key={calc.id} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium capitalize">
                        {calc.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(calc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Execution time: {calc.executionTime}ms
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No calculations recorded yet.</p>
            )}
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">User Preferences</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Theme</span>
                <span className="text-white capitalize">{preferences.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Precision</span>
                <span className="text-white">{preferences.precision} digits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Auto Save</span>
                <span className="text-white">{preferences.autoSave ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Detection Method</span>
                <span className="text-white">{preferences.calculationDefaults.detectionLimitMethod}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card-premium p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runPersistenceTests}
              disabled={isRunningTests}
              className="btn-premium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`w-5 h-5 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Running Tests...' : 'Run Persistence Tests'}
            </button>

            <button
              onClick={checkSystemStatus}
              className="btn-premium bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Check System Status
            </button>

            <button
              onClick={exportAllData}
              className="btn-premium bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Save className="w-5 h-5 mr-2" />
              Export All Data
            </button>

            <button
              onClick={loadStorageStats}
              className="btn-premium bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              <Database className="w-5 h-5 mr-2" />
              Refresh Statistics
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Test Results</h3>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm max-h-80 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    result.includes('✓') ? 'text-green-400' :
                    result.includes('✗') ? 'text-red-400' :
                    result.includes('===') ? 'text-blue-400 font-bold' :
                    'text-slate-300'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}