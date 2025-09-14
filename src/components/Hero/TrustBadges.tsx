import React from 'react';
import { Shield, Truck, RefreshCw } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    { icon: Shield, value: '100%', label: 'Authentic Products' },
    { icon: Truck, value: 'Free', label: 'Global Shipping' },
    { icon: RefreshCw, value: '30 Days', label: 'Easy Returns' },
  ];

  return (
    <div className="grid grid-cols-3 gap-8">
      {badges.map(({ icon: Icon, value, label }) => (
        <div key={label} className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Icon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      ))}
    </div>
  );
}