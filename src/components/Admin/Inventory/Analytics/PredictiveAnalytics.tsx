import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  Package,
  Clock
} from 'lucide-react';
import { formatPrice } from '../../../../utils/currency';
import { useCurrency } from '../../../../context/CurrencyContext';

interface PredictiveData {
  product: {
    _id: string;
    name: string;
    category: string;
  };
  currentStock: number;
  avgDailyDemand: number;
  demandTrend: number;
  seasonalFactor: number;
  predictedStockoutDate: string | null;
  daysUntilStockout: number | null;
  recommendedOrderQuantity: number;
  riskLevel: 'high' | 'medium' | 'low';
  forecastAccuracy: number;
}

interface PredictiveAnalyticsProps {
  data: {
    predictions: PredictiveData[];
    summary: {
      totalProducts: number;
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
      avgAccuracy: number;
    };
  };
}

export function PredictiveAnalytics({ data }: PredictiveAnalyticsProps) {
  const { currency } = useCurrency();
  const { predictions, summary } = data;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Target className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not applicable';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{summary.highRisk}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.mediumRisk}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{summary.lowRisk}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(summary.avgAccuracy * 100)}%</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Stock Predictions & Recommendations</h3>
          <p className="text-gray-600 mt-1">AI-powered demand forecasting and inventory optimization</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stockout Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.map((prediction) => (
                <tr key={prediction.product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prediction.product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prediction.product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {prediction.avgDailyDemand}
                    </div>
                    <div className="text-xs text-gray-500">
                      Seasonal: ×{prediction.seasonalFactor.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${
                      prediction.demandTrend > 0 ? 'text-green-600' : 
                      prediction.demandTrend < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {prediction.demandTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : prediction.demandTrend < 0 ? (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      ) : null}
                      <span className="text-sm">
                        {prediction.demandTrend > 0 ? '+' : ''}{(prediction.demandTrend * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(prediction.predictedStockoutDate)}
                    </div>
                    {prediction.daysUntilStockout && (
                      <div className="text-xs text-gray-500">
                        {prediction.daysUntilStockout} days
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(prediction.riskLevel)}`}>
                      {getRiskIcon(prediction.riskLevel)}
                      <span className="ml-1 capitalize">{prediction.riskLevel}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.recommendedOrderQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Math.round(prediction.forecastAccuracy * 100)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${prediction.forecastAccuracy * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {predictions.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Predictions Available</h3>
              <p className="text-gray-500">Predictions will appear here once sufficient sales data is available</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Immediate Action Required</h5>
            <p className="text-sm text-gray-600">
              {summary.highRisk} products need immediate attention to prevent stockouts
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Forecast Accuracy</h5>
            <p className="text-sm text-gray-600">
              Model predictions are {Math.round(summary.avgAccuracy * 100)}% accurate on average
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Optimization Potential</h5>
            <p className="text-sm text-gray-600">
              Following AI recommendations could improve inventory efficiency by 15-25%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
