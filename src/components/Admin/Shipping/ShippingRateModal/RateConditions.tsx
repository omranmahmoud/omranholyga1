import React from 'react';
import { Plus, X } from 'lucide-react';

interface Condition {
  type: 'min_weight' | 'max_weight' | 'min_price' | 'max_price';
  value: number;
}

interface RateConditionsProps {
  conditions: Condition[];
  rateType: 'weight' | 'price' | 'flat';
  onAdd: (condition: Condition) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, condition: Condition) => void;
}

export function RateConditions({ 
  conditions, 
  rateType, 
  onAdd, 
  onRemove, 
  onChange 
}: RateConditionsProps) {
  const [newCondition, setNewCondition] = useState<Condition>({
    type: 'min_weight',
    value: 0
  });

  const conditionTypes = rateType === 'weight' 
    ? [
        { value: 'min_weight', label: 'Minimum Weight' },
        { value: 'max_weight', label: 'Maximum Weight' }
      ]
    : [
        { value: 'min_price', label: 'Minimum Price' },
        { value: 'max_price', label: 'Maximum Price' }
      ];

  if (rateType === 'flat') return null;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {rateType === 'weight' ? 'Weight Conditions' : 'Price Conditions'}
      </label>

      {/* Existing Conditions */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-4">
            <select
              value={condition.type}
              onChange={(e) => onChange(index, { 
                ...condition, 
                type: e.target.value as Condition['type']
              })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {conditionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step={rateType === 'weight' ? '0.1' : '0.01'}
              value={condition.value}
              onChange={(e) => onChange(index, {
                ...condition,
                value: parseFloat(e.target.value)
              })}
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Condition */}
      <div className="flex items-center gap-4">
        <select
          value={newCondition.type}
          onChange={(e) => setNewCondition(prev => ({ 
            ...prev, 
            type: e.target.value as Condition['type']
          }))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          {conditionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step={rateType === 'weight' ? '0.1' : '0.01'}
          value={newCondition.value}
          onChange={(e) => setNewCondition(prev => ({
            ...prev,
            value: parseFloat(e.target.value)
          }))}
          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => {
            onAdd(newCondition);
            setNewCondition({ type: 'min_weight', value: 0 });
          }}
          className="p-2 text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
