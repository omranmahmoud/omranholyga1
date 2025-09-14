import React from 'react';
import { Pencil, Trash2, Plus, ChevronDown } from 'lucide-react';
import { type ShippingZone, type ShippingRate } from '../../../services/shippingService';
import { formatShippingEstimate } from '../../../utils/shippingUtils';

interface ShippingZoneListProps {
  zones: ShippingZone[];
  rates: ShippingRate[];
  onEditZone: (zone: ShippingZone) => void;
  onDeleteZone: (id: string) => void;
  onAddRate: (zone: ShippingZone) => void;
  onEditRate: (rate: ShippingRate) => void;
  onDeleteRate: (id: string) => void;
}

export function ShippingZoneList({
  zones,
  rates,
  onEditZone,
  onDeleteZone,
  onAddRate,
  onEditRate,
  onDeleteRate
}: ShippingZoneListProps) {
  const [expandedZone, setExpandedZone] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      {zones.map((zone) => (
        <div key={zone._id} className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Zone Header */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {zone.countries.length} countries, {zone.regions.length} regions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditZone(zone)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDeleteZone(zone._id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setExpandedZone(expandedZone === zone._id ? null : zone._id)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    expandedZone === zone._id ? 'rotate-180' : ''
                  }`} 
                />
              </button>
            </div>
          </div>

          {/* Zone Details */}
          {expandedZone === zone._id && (
            <div className="border-t">
              {/* Countries & Regions */}
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Countries</h4>
                  <div className="flex flex-wrap gap-2">
                    {zone.countries.map((country) => (
                      <span
                        key={country}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Regions</h4>
                  <div className="flex flex-wrap gap-2">
                    {zone.regions.map((region) => (
                      <span
                        key={region}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping Rates */}
              <div className="border-t">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Shipping Rates</h4>
                    <button
                      onClick={() => onAddRate(zone)}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Rate
                    </button>
                  </div>

                  <div className="divide-y">
                    {rates.filter(rate => 
                      typeof rate.zone === 'string' 
                        ? rate.zone === zone._id
                        : rate.zone._id === zone._id
                    ).map((rate) => (
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
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
