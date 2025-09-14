import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type ShippingRate, type ShippingZone } from '../../../services/shippingService';

interface ShippingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ShippingRate, '_id'>) => Promise<void>;
  rate?: ShippingRate | null;
  zone?: ShippingZone | null;
}

export function ShippingRateModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  rate,
  zone
}: ShippingRateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'flat' as const,
    baseRate: 0,
    conditions: [] as Array<{
      type: 'min_weight' | 'max_weight' | 'min_price' | 'max_price';
      value: number;
    }>,
    additionalFee: 0,
    freeShippingThreshold: undefined as number | undefined,
    isActive: true,
    estimatedDays: {
      min: 1,
      max: 3
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rate) {
      setFormData({
        name: rate.name,
        type: rate.type,
        baseRate: rate.baseRate,
        conditions: rate.conditions,
        additionalFee: rate.additionalFee,
        freeShippingThreshold: rate.freeShippingThreshold,
        isActive: rate.isActive,
        estimatedDays: rate.estimatedDays
      });
    } else {
      setFormData({
        name: '',
        type: 'flat',
        baseRate: 0,
        conditions: [],
        additionalFee: 0,
        freeShippingThreshold: undefined,
        isActive: true,
        estimatedDays: {
          min: 1,
          max: 3
        }
      });
    }
  }, [rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        zone: zone._id
      });
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {rate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rate Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter rate name"
              />
            </div>

            {/* Other form inputs */}

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Rate
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : rate ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
