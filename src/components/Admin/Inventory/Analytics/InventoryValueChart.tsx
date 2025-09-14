import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ValueHistoryPoint } from '../../../../services/inventoryAnalyticsService';
import { formatPrice } from '../../../../utils/currency';
import { useCurrency } from '../../../../context/CurrencyContext';

interface InventoryValueChartProps {
  data: ValueHistoryPoint[];
}

export function InventoryValueChart({ data }: InventoryValueChartProps) {
  const { currency } = useCurrency();

  const formatTooltip = (value: any, name: string) => {
    if (name === 'value') {
      return [formatPrice(value, currency), 'Inventory Value'];
    }
    return [value, name];
  };

  const formatXAxis = (tickItem: string) => {
    return new Date(tickItem).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Value Trend</h3>
        <div className="text-sm text-gray-500">
          Last {data.length} data points
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatPrice(value, currency)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#4f46e5" 
              strokeWidth={2}
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Inventory value data will appear here once available</p>
          </div>
        </div>
      )}
    </div>
  );
}
