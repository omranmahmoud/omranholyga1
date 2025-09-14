import React from 'react';
import type { ShippingZone } from '../../../../types/shipping';

interface ShippingZoneDetailsProps {
  zone: ShippingZone;
}

export function ShippingZoneDetails({ zone }: ShippingZoneDetailsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
      <div className="mt-2 space-y-2">
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
        {zone.regions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {zone.regions.map((region) => (
              <span
                key={region}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-sm rounded"
              >
                {region}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
