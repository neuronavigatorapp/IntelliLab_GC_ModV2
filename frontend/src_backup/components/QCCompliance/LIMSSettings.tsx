import React, { useState, useEffect } from 'react';
import { useGlobalData } from '../../store/globalDataStore';
import { LIMSConfig, LIMSConnectionResult } from '../../store/globalDataStore';

const LIMSSettings: React.FC = () => {
  const { 
    fetchLIMSConfigs, 
    createLIMSConfig, 
    updateLIMSConfig, 
    deleteLIMSConfig, 
    testLIMSConnection 
  } = useGlobalData();
  
  const [configs, setConfigs] = useState<LIMSConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<number, LIMSConnectionResult>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LIMSConfig | null>(null);
  
  const [formData, setFormData] = useState({
    base_url: '',
    api_key: '',
    format: 'json',
    connection_name: '',
    description: ''
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configsData = await fetchLIMSConfigs();
      setConfigs(configsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LIMS configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setFormData({
      base_url: '',
      api_key: '',
      format: 'json',
      connection_name: '',
      description: ''
    });
    setEditingConfig(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingConfig) {
        await updateLIMSConfig(editingConfig.id, formData);
      } else {
        await createLIMSConfig(formData);
      }
      
      await loadConfigs();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LIMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: LIMSConfig) => {
    setEditingConfig(config);
    setFormData({
      base_url: config.base_url,
      api_key: config.api_key,
      format: config.format,
      connection_name: config.connection_name,
      description: config.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (configId: number) => {
    if (!window.confirm('Are you sure you want to delete this LIMS configuration?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteLIMSConfig(configId);
      await loadConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete LIMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (configId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await testLIMSConnection(configId);
      setTestResults(prev => ({ ...prev, [configId]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test LIMS connection');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getTestResultColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">LIMS Settings</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Configuration
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {editingConfig ? 'Edit LIMS Configuration' : 'Add LIMS Configuration'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.connection_name}
                  onChange={(e) => handleFormChange('connection_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production LIMS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.base_url}
                  onChange={(e) => handleFormChange('base_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://lims.example.com/api"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  required
                  value={formData.api_key}
                  onChange={(e) => handleFormChange('api_key', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => handleFormChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description of this LIMS connection"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">LIMS Configurations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {configs.map((config) => (
            <div key={config.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{config.connection_name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.is_active)}`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{config.base_url}</p>
                  {config.description && (
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Format: {config.format.toUpperCase()}</span>
                    <span>Created: {new Date(config.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestConnection(config.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(config)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Test Results */}
              {testResults[config.id] && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getTestResultColor(testResults[config.id].success)}`}>
                      {testResults[config.id].success ? '✓' : '✗'} Connection Test
                    </span>
                    <span className="text-sm text-gray-500">
                      {testResults[config.id].message}
                    </span>
                    {testResults[config.id]?.response_time && (
                      <span className="text-sm text-gray-500">
                        ({testResults[config.id]?.response_time?.toFixed(2)}s)
                      </span>
                    )}
                  </div>
                  {testResults[config.id].error_details && (
                    <div className="mt-2 text-sm text-red-600">
                      {testResults[config.id].error_details}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {configs.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No LIMS configurations found. Click "Add Configuration" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LIMSSettings;
