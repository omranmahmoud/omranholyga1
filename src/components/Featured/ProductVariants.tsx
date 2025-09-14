import React from 'react';
import { ProductActions } from './ProductActions';

export function ProductVariants() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = [
    { name: 'Charcoal', class: 'bg-gray-900' },
    { name: 'Camel', class: 'bg-amber-700' },
    { name: 'Navy', class: 'bg-indigo-900' },
  ];

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <span className="text-sm text-gray-500">Charcoal Selected</span>
        </div>
        <div className="flex gap-3">
          {colors.map(({ name, class: bgClass }) => (
            <button
              key={name}
              className={`group relative w-12 h-12 rounded-full ${
                name === 'Charcoal' 
                  ? 'ring-2 ring-indigo-600 ring-offset-2' 
                  : 'ring-2 ring-transparent hover:ring-gray-300'
              } transition-all duration-200`}
            >
              <span className={`absolute inset-2 rounded-full ${bgClass}`} />
              <span className="sr-only">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <button className="text-sm text-indigo-600 hover:text-indigo-700">Size Guide</button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                size === 'M'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-600'
                  : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <ProductActions />
      </div>
    </div>
  );
}