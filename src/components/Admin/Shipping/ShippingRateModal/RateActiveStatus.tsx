
import React from 'react';

interface RateActiveStatusProps {
  isActive: boolean;
  onChange: (checked: boolean) => void;
}

export function RateActiveStatus({ isActive, onChange }: RateActiveStatusProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id="isActive"
        checked={isActive}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
        Active Rate
      </label>
    </div>
  );
}
