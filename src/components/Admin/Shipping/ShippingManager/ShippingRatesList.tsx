import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { formatShippingEstimate } from '../../../../utils/shippingUtils';
import type { ShippingZone, ShippingRate } from '../../../../types/shipping';

interface ShippingRatesListProps {
  zone: ShippingZone;
  rates: ShippingRate[];
  onAddRate: () => void;
  onEditRate: (rate: ShippingRate) => void;
  onDeleteRate: (id: string) => void;
}

export function ShippingRatesList({
  zone,
  rates,
  onAddRate,
  onEditRate,
  onDeleteRate
}: ShippingRatesListProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Shipping Rates</h4>
        <button
          onClick={onAddRate}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Rate
        </button>
      </div>

      <div className="divide-y">
        {rates.map((rate) => (
          <div key={rate._id} className="py-4 flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">{rate.name}</h5>
              <div className="mt-1 text-sm text-gray-500">
                <span className="capitalize">{rate.type} rate</span>
                {' • '}
                <span>${rate.baseRate.toFixed(2)} base fee</span>
                {' • '}
                <span>{formatShippingEstimate(rate)}</span>
              </div>
              {rate.freeShippingThreshold && (
                <p className="mt-1 text-sm text-green-600">
                  Free shipping over ${rate.freeShippingThreshold}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditRate(rate)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteRate(rate._id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
