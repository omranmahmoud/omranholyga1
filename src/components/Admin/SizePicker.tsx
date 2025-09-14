import React from 'react';
import { X } from 'lucide-react';

interface Size {
  name: string;
  stock: number;
}

interface SizePickerProps {
  selectedSizes: Size[];
  onAddSize: (size: Size) => void;
  onRemoveSize: (index: number) => void;
}

export function SizePicker({ selectedSizes, onAddSize, onRemoveSize }: SizePickerProps) {
  const [newSize, setNewSize] = React.useState({ name: '', stock: 0 });

  const predefinedSizes = [
    { name: 'XS', label: 'Extra Small' },
    { name: 'S', label: 'Small' },
    { name: 'M', label: 'Medium' },
    { name: 'L', label: 'Large' },
    { name: 'XL', label: 'Extra Large' },
    { name: 'XXL', label: '2X Large' }
  ];

  const handleAddSize = () => {
    if (!newSize.name || newSize.stock < 0) {
      return;
    }
    onAddSize(newSize);
    setNewSize({ name: '', stock: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {predefinedSizes.map((size) => (
          <button
            key={size.name}
            type="button"
            onClick={() => setNewSize(prev => ({ ...prev, name: size.name }))}
            className={`p-3 rounded-lg border hover:border-gray-300 transition-colors ${
              newSize.name === size.name ? 'border-indigo-600' : 'border-gray-200'
            }`}
          >
            <div className="text-center">
              <p className="font-medium text-gray-900">{size.name}</p>
              <p className="text-xs text-gray-500">{size.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={newSize.name}
          onChange={(e) => setNewSize(prev => ({ ...prev, name: e.target.value }))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Size</option>
          {predefinedSizes.map((size) => (
            <option key={size.name} value={size.name}>
              {size.name} - {size.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Stock"
          value={newSize.stock}
          onChange={(e) => setNewSize(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={handleAddSize}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {selectedSizes.map((size, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <span className="font-medium text-gray-900">{size.name}</span>
              <span className="ml-2 text-sm text-gray-500">
                Stock: {size.stock}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveSize(index)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Total Stock: {selectedSizes.reduce((sum, size) => sum + size.stock, 0)} units
        </p>
      </div>
    </div>
  );
}