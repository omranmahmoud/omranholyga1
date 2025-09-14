import React from 'react';

interface Color {
  name: string;
  code: string;
}

interface ColorSelectorProps {
  colors: Color[];
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorSelector({ colors, selectedColor, onColorChange }: ColorSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <span className="text-sm text-gray-500">{selectedColor} Selected</span>
      </div>
      <div className="flex gap-3">
        {colors.map(({ name, code }) => (
          <button
            key={name}
            onClick={() => onColorChange(name)}
            className={`group relative w-12 h-12 rounded-full ${
              name === selectedColor 
                ? 'ring-2 ring-indigo-600 ring-offset-2' 
                : 'ring-2 ring-transparent hover:ring-gray-300'
            } transition-all duration-200`}
          >
            <span className="absolute inset-2 rounded-full" style={{ backgroundColor: code }} />
            <span className="sr-only">{name}</span>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}