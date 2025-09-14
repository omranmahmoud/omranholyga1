
import React, { useState } from 'react';

interface Size {
  name: string;
  stock: number;
}

interface SizeSelectorProps {
  sizes: Size[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

export function SizeSelector({ sizes, selectedSize, onSizeChange }: SizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  // Filter out sizes with no stock
  const availableSizes = sizes.filter(size => size.stock > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Size</label>
        <button 
          type="button"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Size Guide
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {sizes.map(({ name, stock }) => {
          const isSelected = name === selectedSize;
          const isOutOfStock = stock === 0;
          const isHovered = name === hoveredSize;

          return (
            <div key={name} className="relative">
              <button
                type="button"
                onClick={() => !isOutOfStock && onSizeChange(name)}
                onMouseEnter={() => setHoveredSize(name)}
                onMouseLeave={() => setHoveredSize(null)}
                disabled={isOutOfStock}
                className={`
                  relative w-full py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isSelected
                    ? 'bg-indigo-600 text-white'
                    : isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {name}
                {/* Selected Indicator */}
                {isSelected && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>

              {/* Stock Indicator Tooltip */}
              {isHovered && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium ${
                  isOutOfStock ? 'bg-red-900' : 'bg-gray-900'
                } text-white rounded whitespace-nowrap z-10`}>
                  {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
