// src/components/Admin/Shipping/ShippingRateModal/index.tsx
import React from 'react';
import { X } from 'lucide-react';
import { type ShippingRate, type ShippingZone } from '../../../../services/shippingService';
import { RateBasicInfo } from './RateBasicInfo';
import { RatePricing } from './RatePricing';
import { RateDeliveryTime } from './RateDeliveryTime';
import { RateActiveStatus } from './RateActiveStatus';
import { RateFormActions } from './RateFormActions';
import { useShippingRateForm } from './useShippingRateForm';

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
  const {
    formData,
    loading,
    handleSubmit,
    handleInputChange,
    handleCheckboxChange
  } = useShippingRateForm(rate, zone, onSubmit, onClose);

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
            <RateBasicInfo 
              formData={formData}
              onChange={handleInputChange}
            />

            <RatePricing 
              formData={formData}
              onChange={handleInputChange}
            />

            <RateDeliveryTime 
              formData={formData}
              onChange={handleInputChange}
            />

            <RateActiveStatus
              isActive={formData.isActive}
              onChange={(checked) => handleCheckboxChange('isActive', checked)}
            />

            <RateFormActions
              onCancel={onClose}
              loading={loading}
              isEdit={!!rate}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
