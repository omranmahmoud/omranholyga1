// src/components/Admin/Shipping/ShippingRateModal/RateBasicInfo.tsx
import React from 'react';

interface RateBasicInfoProps {
  formData: {
    name: string;
    type: 'flat' | 'weight' | 'price';
  };
  onChange: (field: string, value: any) => void;
}

export function RateBasicInfo({ formData, onChange }: RateBasicInfoProps) {
  return (
    <div className="space-y-4">
      {/* Rate Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter rate name"
        />
      </div>

      {/* Rate Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => onChange('type', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="flat">Flat Rate</option>
          <option value="weight">Weight Based</option>
          <option value="price">Price Based</option>
        </select>
      </div>
    </div>
  );
}
