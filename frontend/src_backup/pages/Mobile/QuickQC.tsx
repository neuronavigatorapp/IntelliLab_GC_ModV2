import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoCapture } from '../../components/Attachments/PhotoCapture';
import { notificationManager } from '../../notifications/notify';
import { mutationQueue } from '../../offline/sync/queue';

interface Instrument {
  id: string;
  name: string;
  type: string;
}

interface QCForm {
  instrument_id: string;
  analyte: string;
  value: number;
  unit: string;
  notes: string;
  photo_attachment_id?: string;
}

export const QuickQC: React.FC = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<QCForm>({
    instrument_id: '',
    analyte: '',
    value: 0,
    unit: 'ppm',
    notes: '',
    photo_attachment_id: undefined
  });

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/instruments');
      if (response.ok) {
        const data = await response.json();
        setInstruments(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, instrument_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to load instruments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.instrument_id || !form.analyte || form.value <= 0) {
      await notificationManager.showToast({
        title: 'Validation Error',
        message: 'Please fill in all required fields.',
        type: 'error'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const qcData = {
        instrument_id: form.instrument_id,
        analyte: form.analyte,
        value: form.value,
        unit: form.unit,
        notes: form.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Try to submit directly first
      const response = await fetch('/api/v1/qc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qcData)
      });

      if (response.ok) {
        const qcRecord = await response.json();
        
        // If photo was captured, link it to the QC record
        if (form.photo_attachment_id) {
          await linkPhotoToQC(qcRecord.id, form.photo_attachment_id);
        }

        await notificationManager.notifyQCAdded(
          instruments.find(i => i.id === form.instrument_id)?.name || 'Unknown',
          form.analyte
        );

        await notificationManager.showToast({
          title: 'QC Record Added',
          message: 'QC measurement has been recorded successfully.',
          type: 'success'
        });

        // Reset form
        setForm({
          instrument_id: instruments[0]?.id || '',
          analyte: '',
          value: 0,
          unit: 'ppm',
          notes: '',
          photo_attachment_id: undefined
        });

        // Navigate back
        navigate('/m');
      } else {
        throw new Error(`Failed to submit QC: ${response.statusText}`);
      }
    } catch (error) {
      console.error('QC submission failed:', error);
      
      // Queue for offline sync
      await mutationQueue.addMutation('/api/v1/qc', 'POST', {
        instrument_id: form.instrument_id,
        analyte: form.analyte,
        value: form.value,
        unit: form.unit,
        notes: form.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      await notificationManager.showToast({
        title: 'QC Queued',
        message: 'QC record will be synced when connection is restored.',
        type: 'info'
      });

      navigate('/m');
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkPhotoToQC = async (qcId: string, attachmentId: string) => {
    try {
      await fetch(`/api/v1/attachments/${attachmentId}/meta`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: 'qc_records',
          entity_id: qcId
        })
      });
    } catch (error) {
      console.error('Failed to link photo to QC record:', error);
    }
  };

  const handlePhotoCaptured = (attachmentMeta: any) => {
    setForm(prev => ({
      ...prev,
      photo_attachment_id: attachmentMeta.id
    }));
  };

  const handleInputChange = (field: keyof QCForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading instruments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/m')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quick QC</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">QC Measurement</h2>
          
          <div className="space-y-4">
            {/* Instrument Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrument *
              </label>
              <select
                value={form.instrument_id}
                onChange={(e) => handleInputChange('instrument_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Instrument</option>
                {instruments.map((instrument) => (
                  <option key={instrument.id} value={instrument.id}>
                    {instrument.name} ({instrument.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Analyte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analyte *
              </label>
              <input
                type="text"
                value={form.analyte}
                onChange={(e) => handleInputChange('analyte', e.target.value)}
                placeholder="e.g., Toluene, Benzene"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Value and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={form.value}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                  <option value="%">%</option>
                  <option value="mg/L">mg/L</option>
                  <option value="μg/L">μg/L</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional observations or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Photo Capture */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo (Optional)</h3>
          <PhotoCapture
            entityType="qc_records"
            entityId="temp"
            onPhotoCaptured={handlePhotoCaptured}
          />
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '📤 Submitting...' : '📊 Record QC'}
          </button>
        </div>
      </form>
    </div>
  );
};
