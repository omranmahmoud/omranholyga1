import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Package,
  Clock,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';

interface ABCItem {
  product: {
    _id: string;
    name: string;
  };
  value: number;
  quantity: number;
  rank: number;
  cumulativePercentage: number;
  abcCategory: 'A' | 'B' | 'C';
}

interface AdvancedMetricsData {
  abcAnalysis: {
    aCategory: ABCItem[];
    bCategory: ABCItem[];
    cCategory: ABCItem[];
  };
  keyMetrics: {
    inventoryTurnoverRatio: number;
    daysInInventory: number;
    fillRate: number;
    inventoryAccuracy: number;
    stockoutFrequency: number;
    averageStockValue: number;
  };
  performance: {
    turnoverTrend: 'improving' | 'declining' | 'stable';
    efficiency: 'excellent' | 'good' | 'needs_improvement';
    recommendations: string[];
  };
}

interface AdvancedMetricsProps {
  data: AdvancedMetricsData;
}

export function AdvancedMetrics({ data }: AdvancedMetricsProps) {
  const { abcAnalysis, keyMetrics, performance } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'stable': return <Activity className="w-5 h-5 text-blue-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const abcChartData = [
    { name: 'A Category', value: abcAnalysis.aCategory.length, fill: '#10B981' },
    { name: 'B Category', value: abcAnalysis.bCategory.length, fill: '#F59E0B' },
    { name: 'C Category', value: abcAnalysis.cCategory.length, fill: '#EF4444' }
  ];

  const metricsData = [
    { name: 'Turnover Ratio', value: keyMetrics.inventoryTurnoverRatio, target: 4, fill: '#4F46E5' },
    { name: 'Fill Rate %', value: keyMetrics.fillRate, target: 95, fill: '#06B6D4' },
    { name: 'Accuracy %', value: keyMetrics.inventoryAccuracy, target: 98, fill: '#10B981' }
  ];

  const radialData = [
    { name: 'Fill Rate', value: keyMetrics.fillRate, fill: '#10B981' },
    { name: 'Accuracy', value: keyMetrics.inventoryAccuracy, fill: '#4F46E5' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Turnover Ratio</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics.inventoryTurnoverRatio}x</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center">
            {getTrendIcon(performance.turnoverTrend)}
            <span className="text-xs text-gray-500 ml-1 capitalize">{performance.turnoverTrend}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days in Inventory</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics.daysInInventory}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {keyMetrics.daysInInventory <= 90 ? 'Optimal' : keyMetrics.daysInInventory <= 180 ? 'Good' : 'High'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fill Rate</p>
              <p className="text-2xl font-bold text-green-600">{keyMetrics.fillRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Target: 95%+
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">{keyMetrics.inventoryAccuracy.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Target: 98%+
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stockouts</p>
              <p className="text-2xl font-bold text-red-600">{keyMetrics.stockoutFrequency}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Items out of stock
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Stock Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(keyMetrics.averageStockValue)}</p>
            </div>
            <Package className="w-8 h-8 text-gray-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Per product
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEfficiencyColor(performance.efficiency)}`}>
            {performance.efficiency === 'excellent' && <Zap className="w-4 h-4 mr-1" />}
            {performance.efficiency === 'good' && <CheckCircle className="w-4 h-4 mr-1" />}
            {performance.efficiency === 'needs_improvement' && <AlertCircle className="w-4 h-4 mr-1" />}
            <span className="capitalize">{performance.efficiency.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metrics vs Targets */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Performance vs Targets</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#E5E7EB" opacity={0.5} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radial Progress */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Key Metrics Status</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ABC Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ABC Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ABC Analysis Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-green-600">A Items (High Value)</p>
              <p className="text-lg font-bold">{abcAnalysis.aCategory.length}</p>
              <p className="text-xs text-gray-500">~80% of value</p>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">B Items (Medium Value)</p>
              <p className="text-lg font-bold">{abcAnalysis.bCategory.length}</p>
              <p className="text-xs text-gray-500">~15% of value</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">C Items (Low Value)</p>
              <p className="text-lg font-bold">{abcAnalysis.cCategory.length}</p>
              <p className="text-xs text-gray-500">~5% of value</p>
            </div>
          </div>
        </div>

        {/* Top A Category Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top A Category Items</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {abcAnalysis.aCategory.slice(0, 10).map((item, index) => (
              <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Rank #{item.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-gray-500">{item.cumulativePercentage.toFixed(1)}% cumulative</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🎯 Performance Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performance.recommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {performance.recommendations.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Performance!</h3>
            <p className="text-gray-500">Your inventory metrics are performing well across all categories.</p>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Advanced Analytics Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Inventory Velocity</h5>
            <p className="text-sm text-gray-600">
              Your turnover ratio of {keyMetrics.inventoryTurnoverRatio}x indicates{' '}
              {keyMetrics.inventoryTurnoverRatio >= 4 ? 'excellent' : keyMetrics.inventoryTurnoverRatio >= 2 ? 'good' : 'slow'} inventory movement
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Service Level</h5>
            <p className="text-sm text-gray-600">
              {keyMetrics.fillRate >= 95 ? 'Excellent customer service with minimal stockouts' : 
               keyMetrics.fillRate >= 90 ? 'Good service level with room for improvement' : 
               'Service level needs attention to reduce stockouts'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">ABC Focus</h5>
            <p className="text-sm text-gray-600">
              Focus on {abcAnalysis.aCategory.length} A-category items representing 80% of your inventory value for maximum impact
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
