import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LowStockItem {
  _id: string;
  product: {
    name: string;
    images: string[];
  };
  size: string;
  color: string;
  quantity: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-amber-900">
          Low Stock Alert
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item._id} className="flex items-center gap-4 bg-white p-4 rounded-lg">
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900">{item.product.name}</h3>
              <p className="text-sm text-gray-500">
                {item.size} / {item.color}
              </p>
              <p className="text-sm font-medium text-amber-600">
                Only {item.quantity} left in stock
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}