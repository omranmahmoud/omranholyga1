
import React from 'react';

interface RateDeliveryTimeProps {
  formData: {
    estimatedDays: {
      min: number;
      max: number;
    };
  };
  onChange: (field: string, value: any) => void;
}

export function RateDeliveryTime({ formData, onChange }: RateDeliveryTimeProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min. Delivery Days
        </label>
        <input
          type="number"
          min="0"
          required
          value={formData.estimatedDays.min}
          onChange={(e) => onChange('estimatedDays', {
            ...formData.estimatedDays,
            min: parseInt(e.target.value)
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max. Delivery Days
        </label>
        <input
          type="number"
          min="0"
          required
          value={formData.estimatedDays.max}
          onChange={(e) => onChange('estimatedDays', {
            ...formData.estimatedDays,
            max: parseInt(e.target.value)
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
