import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LocationData } from '../../../../services/inventoryAnalyticsService';
import { MapPin, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatPrice } from '../../../../utils/currency';
import { useCurrency } from '../../../../context/CurrencyContext';

interface LocationAnalysisProps {
  data: LocationData[];
}

export function LocationAnalysis({ data }: LocationAnalysisProps) {
  const { currency } = useCurrency();

  const formatTooltip = (value: any, name: string) => {
    if (name === 'totalValue') {
      return [formatPrice(value, currency), 'Total Value'];
    }
    if (name === 'utilizationRate') {
      return [`${value.toFixed(1)}%`, 'Utilization Rate'];
    }
    if (name === 'averageTurnover') {
      return [`${value.toFixed(2)}x`, 'Average Turnover'];
    }
    return [value, name];
  };

  const sortedByValue = [...data].sort((a, b) => b.totalValue - a.totalValue);
  const sortedByUtilization = [...data].sort((a, b) => b.utilizationRate - a.utilizationRate);

  const totalValue = data.reduce((sum, location) => sum + location.totalValue, 0);
  const totalItems = data.reduce((sum, location) => sum + location.totalItems, 0);
  const totalAlerts = data.reduce((sum, location) => sum + location.alertCount, 0);
  const avgUtilization = data.reduce((sum, location) => sum + location.utilizationRate, 0) / data.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalValue, currency)}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{avgUtilization.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value by Location Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Inventory Value by Location</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedByValue} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="location" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatPrice(value, currency)}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="totalValue" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utilization Rate Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Location Utilization Rates</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedByUtilization} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="location" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="utilizationRate" 
                  fill={(entry: any) => {
                    if (entry.utilizationRate >= 80) return '#10b981';
                    if (entry.utilizationRate >= 60) return '#f59e0b';
                    return '#ef4444';
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h4 className="text-md font-semibold text-gray-900">Location Performance Details</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Turnover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedByValue.map((location, index) => (
                <tr key={location.location} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{location.location}</span>
                      {index === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Highest Value
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(location.totalValue, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {location.totalItems.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            location.utilizationRate >= 80 ? 'bg-green-500' :
                            location.utilizationRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(location.utilizationRate, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        location.utilizationRate >= 80 ? 'text-green-600' :
                        location.utilizationRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {location.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      location.averageTurnover >= 2 ? 'text-green-600' :
                      location.averageTurnover >= 1 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {location.averageTurnover.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {location.alertCount > 0 ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        {location.alertCount}
                      </span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Data</h3>
              <p className="text-gray-500">Location analysis will appear here once inventory is distributed across locations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
