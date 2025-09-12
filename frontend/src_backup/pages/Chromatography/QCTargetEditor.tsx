import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { qcAPI } from '../../services/apiService';
import { QCTarget, QCTargetFormData } from '../../types/qc';

interface QCTargetEditorProps {}

const QCTargetEditor: React.FC<QCTargetEditorProps> = () => {
  const [targets, setTargets] = useState<QCTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState<QCTarget | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<QCTargetFormData>({
    methodId: '1',
    instrumentId: '1',
    analyte: '',
    mean: '',
    sd: '',
    unit: 'ppm',
    n_required: '20'
  });

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      // Load targets for all methods (simplified for demo)
      const response = await qcAPI.getTargets('1'); // Default method
      setTargets(response.data);
    } catch (error) {
      console.error('Failed to load QC targets:', error);
      toast.error('Failed to load QC targets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.analyte || !formData.mean || !formData.sd) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const mean = parseFloat(formData.mean);
      const sd = parseFloat(formData.sd);
      const n_required = parseInt(formData.n_required);
      
      if (isNaN(mean) || isNaN(sd) || isNaN(n_required)) {
        toast.error('Please enter valid numbers');
        return;
      }
      
      if (sd <= 0) {
        toast.error('Standard deviation must be positive');
        return;
      }
      
      if (n_required < 1) {
        toast.error('N required must be at least 1');
        return;
      }
      
      // Create target object
      const targetData: QCTarget = {
        id: editingTarget?.id || '',
        methodId: formData.methodId,
        instrumentId: formData.instrumentId,
        analyte: formData.analyte,
        mean,
        sd,
        unit: formData.unit,
        n_required
      };
      
      // Save target
      await qcAPI.createTarget(targetData);
      
      toast.success(editingTarget ? 'QC target updated successfully' : 'QC target created successfully');
      
      // Reset form and reload targets
      resetForm();
      loadTargets();
      
    } catch (error) {
      console.error('Failed to save QC target:', error);
      toast.error('Failed to save QC target');
    }
  };

  const handleEdit = (target: QCTarget) => {
    setEditingTarget(target);
    setFormData({
      methodId: target.methodId,
      instrumentId: target.instrumentId || '1',
      analyte: target.analyte,
      mean: target.mean.toString(),
      sd: target.sd.toString(),
      unit: target.unit,
      n_required: target.n_required.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (target: QCTarget) => {
    if (!window.confirm(`Are you sure you want to delete the QC target for ${target.analyte}?`)) {
      return;
    }
    
    try {
      await qcAPI.deleteTarget(target.id);
      toast.success('QC target deleted successfully');
      loadTargets();
    } catch (error) {
      console.error('Failed to delete QC target:', error);
      toast.error('Failed to delete QC target');
    }
  };

  const resetForm = () => {
    setEditingTarget(null);
    setShowForm(false);
    setFormData({
      methodId: '1',
      instrumentId: '1',
      analyte: '',
      mean: '',
      sd: '',
      unit: 'ppm',
      n_required: '20'
    });
  };

  const calculateZScore = (value: number, target: QCTarget): number => {
    return (value - target.mean) / target.sd;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QC Targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qc-target-editor p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QC Target Editor</h1>
        <p className="text-gray-600">Manage QC targets for Westgard rule evaluation</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New QC Target
        </button>
      </div>

      {/* QC Targets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">QC Targets</h2>
        </div>
        
        {targets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analyte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instrument ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mean
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Std Dev
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {targets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {target.analyte}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.methodId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.instrumentId || 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.mean.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.sd.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {target.n_required}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(target)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(target)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No QC targets defined</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Add New QC Target" to create your first target
            </p>
          </div>
        )}
      </div>

      {/* QC Target Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {editingTarget ? 'Edit QC Target' : 'Add QC Target'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method ID
                  </label>
                  <select
                    value={formData.methodId}
                    onChange={(e) => setFormData({ ...formData, methodId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="1">Method 1</option>
                    <option value="2">Method 2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrument ID (Optional)
                  </label>
                  <select
                    value={formData.instrumentId}
                    onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">All Instruments</option>
                    <option value="1">GC-MS-001</option>
                    <option value="2">GC-FID-002</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analyte *
                  </label>
                  <input
                    type="text"
                    value={formData.analyte}
                    onChange={(e) => setFormData({ ...formData, analyte: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Benzene"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mean Value *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.mean}
                    onChange={(e) => setFormData({ ...formData, mean: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="5.000"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Deviation *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.sd}
                    onChange={(e) => setFormData({ ...formData, sd: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.250"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ppm">ppm</option>
                    <option value="ppb">ppb</option>
                    <option value="mg/L">mg/L</option>
                    <option value="μg/L">μg/L</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Required for Strict Rules
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.n_required}
                    onChange={(e) => setFormData({ ...formData, n_required: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                {/* Preview z-score calculation */}
                {formData.mean && formData.sd && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Preview Z-score calculation:</p>
                    <p className="text-xs text-gray-500 mt-1">
                      For value {parseFloat(formData.mean) + parseFloat(formData.sd || '0')}: 
                      Z = {((parseFloat(formData.mean) + parseFloat(formData.sd || '0')) - parseFloat(formData.mean)) / parseFloat(formData.sd || '1') || 0}σ
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {editingTarget ? 'Update' : 'Create'} Target
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCTargetEditor;
