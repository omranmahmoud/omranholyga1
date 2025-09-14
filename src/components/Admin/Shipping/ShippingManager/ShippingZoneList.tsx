import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { formatShippingEstimate } from '../../../../utils/shippingUtils';
import { ShippingZoneDetails } from './ShippingZoneDetails';
import { ShippingRatesList } from './ShippingRatesList';
import type { ShippingZone, ShippingRate } from '../../../../types/shipping';

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
          <div className="p-6 flex items-center justify-between">
            <ShippingZoneDetails zone={zone} />
            
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
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {expandedZone === zone._id && (
            <div className="border-t">
              <ShippingRatesList
                zone={zone}
                rates={rates.filter(rate => 
                  typeof rate.zone === 'string' 
                    ? rate.zone === zone._id
                    : rate.zone._id === zone._id
                )}
                onAddRate={() => onAddRate(zone)}
                onEditRate={onEditRate}
                onDeleteRate={onDeleteRate}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
