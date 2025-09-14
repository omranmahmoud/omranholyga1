import React from 'react';
import { Package } from 'lucide-react';

interface OrderStatusProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  statusOptions: string[];
  statusColors: Record<string, string>;
}

export function OrderStatus({ 
  currentStatus, 
  onStatusChange, 
  statusOptions, 
  statusColors 
}: OrderStatusProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div className="flex items-center gap-4">
        <Package className="w-5 h-5 text-gray-400" />
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            statusColors[currentStatus as keyof typeof statusColors]
          }`}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => onStatusChange(currentStatus)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Close
      </button>
    </div>
  );
}