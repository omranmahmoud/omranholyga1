import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StockMovement } from '../../../../services/inventoryAnalyticsService';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StockMovementChartProps {
  data: StockMovement[];
  detailed?: boolean;
}

export function StockMovementChart({ data, detailed = false }: StockMovementChartProps) {
  // Group data by date for chart
  const chartData = React.useMemo(() => {
    const grouped = data.reduce((acc, movement) => {
      const date = format(parseISO(movement.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          increase: 0,
          decrease: 0,
          net: 0
        };
      }
      
      if (movement.type === 'increase') {
        acc[date].increase += movement.quantity;
        acc[date].net += movement.quantity;
      } else {
        acc[date].decrease += movement.quantity;
        acc[date].net -= movement.quantity;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'MMM dd');
  };

  const formatTooltip = (value: any, name: string) => {
    const labels = {
      increase: 'Stock Added',
      decrease: 'Stock Removed', 
      net: 'Net Change'
    };
    return [value, labels[name as keyof typeof labels] || name];
  };

  if (detailed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Stock Movement Details</h3>
            <div className="text-sm text-gray-500">
              {data.length} movements
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={(label) => format(new Date(label), 'MMMM dd, yyyy')}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="increase" fill="#10b981" name="Stock Added" />
                <Bar dataKey="decrease" fill="#ef4444" name="Stock Removed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent movements list */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Recent Movements</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.slice(0, 10).map((movement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      movement.type === 'increase' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {movement.type === 'increase' ? (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{movement.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {movement.reason} • {movement.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      movement.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'increase' ? '+' : '-'}{movement.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(movement.date), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Stock Movements</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Last {chartData.length} days
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => format(new Date(label), 'MMMM dd, yyyy')}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="increase" fill="#10b981" />
            <Bar dataKey="decrease" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {chartData.length === 0 && (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No movement data</p>
            <p className="text-sm">Stock movement data will appear here once available</p>
          </div>
        </div>
      )}
    </div>
  );
}
