import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoCapture } from '../../components/Attachments/PhotoCapture';
import { notificationManager } from '../../notifications/notify';
import { mutationQueue } from '../../offline/sync/queue';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
  unit: string;
  supplier?: string;
}

export const QuickInventory: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [notes, setNotes] = useState('');
  const [photoAttachmentId, setPhotoAttachmentId] = useState<string | undefined>();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentAmount(0);
    setNotes('');
    setPhotoAttachmentId(undefined);
  };

  const handleAdjustment = async () => {
    if (!selectedItem || adjustmentAmount <= 0) {
      await notificationManager.showToast({
        title: 'Validation Error',
        message: 'Please select an item and enter a valid amount.',
        type: 'error'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const newStock = adjustmentType === 'add' 
        ? selectedItem.current_stock + adjustmentAmount
        : selectedItem.current_stock - adjustmentAmount;

      const updateData = {
        current_stock: newStock,
        last_updated: new Date().toISOString(),
        notes: notes || undefined
      };

      // Try to submit directly first
      const response = await fetch(`/api/v1/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Link photo if captured
        if (photoAttachmentId) {
          await linkPhotoToInventory(selectedItem.id, photoAttachmentId);
        }

        // Check if stock is low
        if (newStock <= selectedItem.min_threshold) {
          await notificationManager.notifyInventoryLow(selectedItem.name, newStock);
        }

        await notificationManager.showToast({
          title: 'Inventory Updated',
          message: `${selectedItem.name} stock updated to ${newStock} ${selectedItem.unit}.`,
          type: 'success'
        });

        // Reset form
        setSelectedItem(null);
        setAdjustmentAmount(0);
        setNotes('');
        setPhotoAttachmentId(undefined);

        // Reload inventory
        await loadInventory();
      } else {
        throw new Error(`Failed to update inventory: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Inventory update failed:', error);
      
      // Queue for offline sync
      await mutationQueue.addMutation(`/api/v1/inventory/${selectedItem.id}`, 'PUT', {
        current_stock: adjustmentType === 'add' 
          ? selectedItem.current_stock + adjustmentAmount
          : selectedItem.current_stock - adjustmentAmount,
        last_updated: new Date().toISOString(),
        notes: notes || undefined
      });

      await notificationManager.showToast({
        title: 'Update Queued',
        message: 'Inventory update will be synced when connection is restored.',
        type: 'info'
      });

      // Reset form
      setSelectedItem(null);
      setAdjustmentAmount(0);
      setNotes('');
      setPhotoAttachmentId(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkPhotoToInventory = async (itemId: string, attachmentId: string) => {
    try {
      await fetch(`/api/v1/attachments/${attachmentId}/meta`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: 'inventory',
          entity_id: itemId
        })
      });
    } catch (error) {
      console.error('Failed to link photo to inventory item:', error);
    }
  };

  const handlePhotoCaptured = (attachmentMeta: any) => {
    setPhotoAttachmentId(attachmentMeta.id);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= item.min_threshold) {
      return 'text-red-600 bg-red-100';
    } else if (item.current_stock <= item.min_threshold * 1.5) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-green-600 bg-green-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Quick Inventory</h1>
        </div>
      </div>

      {/* Inventory List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Item</h2>
        <div className="space-y-3">
          {inventory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`bg-white rounded-lg p-4 shadow-sm cursor-pointer border-2 ${
                selectedItem?.id === item.id ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStockStatus(item)}`}>
                  {item.current_stock} {item.unit}
                </div>
              </div>
              {item.current_stock <= item.min_threshold && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ Low stock alert
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment Form */}
      {selectedItem && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Adjust {selectedItem.name}
          </h2>
          
          <div className="space-y-4">
            {/* Current Stock Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Current Stock</div>
              <div className="text-xl font-semibold text-gray-900">
                {selectedItem.current_stock} {selectedItem.unit}
              </div>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    adjustmentType === 'add'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  ➕ Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('remove')}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    adjustmentType === 'remove'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  ➖ Remove Stock
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({selectedItem.unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Photo Capture */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Photo (Optional)</h3>
              <PhotoCapture
                entityType="inventory"
                entityId={selectedItem.id}
                onPhotoCaptured={handlePhotoCaptured}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {selectedItem && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleAdjustment}
            disabled={isSubmitting || adjustmentAmount <= 0}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '📤 Updating...' : `📦 ${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`}
          </button>
        </div>
      )}
    </div>
  );
};
