import React from 'react';
import { Star, Shield, Truck } from 'lucide-react';

export function ProductInfo() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">(128 reviews)</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wool Blend Overcoat</h1>
        <div className="mt-4 flex items-center gap-4">
          <p className="text-2xl font-semibold text-indigo-600">$299.00</p>
          <span className="text-sm text-gray-500 line-through">$399.00</span>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Save 25%</span>
        </div>
      </div>

      <p className="text-gray-600">
        Crafted from premium wool blend, this timeless overcoat features a classic silhouette 
        with modern details. Perfect for both casual and formal occasions.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="text-sm text-gray-600">Quality Guaranteed</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Truck className="w-5 h-5 text-indigo-600" />
          <span className="text-sm text-gray-600">Free Shipping</span>
        </div>
      </div>
    </div>
  );
}