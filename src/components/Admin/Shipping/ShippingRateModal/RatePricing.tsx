// src/components/Admin/Shipping/ShippingRateModal/RatePricing.tsx
import React from 'react';

interface RatePricingProps {
  formData: {
    type: string;
    baseRate: number;
    additionalFee: number;
    freeShippingThreshold?: number;
  };
  onChange: (field: string, value: any) => void;
}

export function RatePricing({ formData, onChange }: RatePricingProps) {
  return (
    <div className="space-y-4">
      {/* Base Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base Rate
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.baseRate}
            onChange={(e) => onChange('baseRate', parseFloat(e.target.value))}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Additional Fee */}
      {formData.type !== 'flat' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Fee (per unit)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.additionalFee}
              onChange={(e) => onChange('additionalFee', parseFloat(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Free Shipping Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Free Shipping Threshold (Optional)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.freeShippingThreshold || ''}
            onChange={(e) => onChange('freeShippingThreshold', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter amount for free shipping"
          />
        </div>
      </div>
    </div>
  );
}
