import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Palette, Bell, Database, Shield, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [theme, setTheme] = useState('dark');
  const [units, setUnits] = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const featureFlags = [
    { id: 'ai-assistant', label: 'AI Assistant', enabled: true },
    { id: 'advanced-analytics', label: 'Advanced Analytics', enabled: true },
    { id: 'batch-processing', label: 'Batch Processing', enabled: false },
    { id: 'cloud-sync', label: 'Cloud Synchronization', enabled: false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-theme-primary-500" />
        <h1 className="text-2xl font-bold text-theme-text">Settings</h1>
      </div>

      {/* API Configuration */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          API Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              API Base URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="app-input w-full"
              placeholder="http://localhost:8000"
            />
            <p className="text-xs text-theme-muted mt-2">
              Backend API endpoint for data and analytics services
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-theme-surface-2 rounded-lg">
            <div>
              <div className="font-medium text-theme-text">Connection Status</div>
              <div className="text-sm text-theme-muted">Current API connectivity</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-success text-sm font-medium">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Feature Flags
        </h2>
        
        <div className="space-y-3">
          {featureFlags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-3 hover:bg-theme-surface-2 rounded-lg transition-colors">
              <div>
                <div className="font-medium text-theme-text">{flag.label}</div>
                <div className="text-sm text-theme-muted">Feature ID: {flag.id}</div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                flag.enabled ? 'bg-theme-primary-500' : 'bg-theme-border'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  flag.enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Appearance
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="app-input w-full"
            >
              <option value="dark">Dark (Professional)</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Units System
            </label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="app-input w-full"
            >
              <option value="metric">Metric (°C, mL, mg)</option>
              <option value="imperial">Imperial (°F, fl oz, oz)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="app-card p-6">
        <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Preferences
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text">Enable Notifications</div>
              <div className="text-sm text-theme-muted">System alerts and analysis updates</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              notifications ? 'bg-theme-primary-500' : 'bg-theme-border'
            }`} onClick={() => setNotifications(!notifications)}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-theme-text">Auto-save Settings</div>
              <div className="text-sm text-theme-muted">Automatically save configuration changes</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
              autoSave ? 'bg-theme-primary-500' : 'bg-theme-border'
            }`} onClick={() => setAutoSave(!autoSave)}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button className="app-button-primary">
          Save Changes
        </button>
        <button className="px-4 py-2 border border-theme-border rounded-lg text-theme-muted hover:bg-theme-surface-2 transition-colors">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};