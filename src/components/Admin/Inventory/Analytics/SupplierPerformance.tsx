import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  Package,
  MapPin,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SupplierData {
  supplier: string;
  totalProducts: number;
  totalValue: number;
  avgLeadTime: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  costEfficiency: number;
  categories: string[];
  performanceScore: number;
  riskLevel: 'high' | 'medium' | 'low';
}

interface SupplierPerformanceData {
  suppliers: SupplierData[];
  summary: {
    totalSuppliers: number;
    avgLeadTime: number;
    avgOnTimeDelivery: number;
    avgQualityRating: number;
    highRiskSuppliers: number;
  };
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    suppliers?: string[];
  }>;
}

interface SupplierPerformanceProps {
  data: SupplierPerformanceData;
}

export function SupplierPerformance({ data }: SupplierPerformanceProps) {
  const { suppliers, summary, recommendations } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 0.9) return <Award className="w-4 h-4" />;
    if (score >= 0.8) return <Star className="w-4 h-4" />;
    if (score >= 0.7) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const leadTimeData = suppliers.map(supplier => ({
    supplier: supplier.supplier.length > 15 ? supplier.supplier.substring(0, 15) + '...' : supplier.supplier,
    leadTime: supplier.avgLeadTime,
    fill: supplier.avgLeadTime <= 7 ? '#10B981' : supplier.avgLeadTime <= 14 ? '#F59E0B' : '#EF4444'
  }));

  const performanceData = suppliers.slice(0, 8).map(supplier => ({
    supplier: supplier.supplier.length > 10 ? supplier.supplier.substring(0, 10) + '...' : supplier.supplier,
    onTime: supplier.onTimeDeliveryRate,
    quality: supplier.qualityRating,
    cost: supplier.costEfficiency,
    overall: supplier.performanceScore * 100
  }));

  // Radar chart data for top 5 suppliers
  const radarData = suppliers.slice(0, 5).map(supplier => ({
    supplier: supplier.supplier.length > 10 ? supplier.supplier.substring(0, 10) + '...' : supplier.supplier,
    'On-Time': supplier.onTimeDeliveryRate,
    'Quality': supplier.qualityRating,
    'Cost Efficiency': supplier.costEfficiency,
    'Lead Time': Math.max(0, 100 - (supplier.avgLeadTime * 5)) // Invert lead time for radar (lower is better)
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSuppliers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Lead Time</p>
              <p className="text-2xl font-bold text-gray-900">{summary.avgLeadTime.toFixed(1)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            days
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-bold text-green-600">{summary.avgOnTimeDelivery.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Quality</p>
              <p className="text-2xl font-bold text-blue-600">{summary.avgQualityRating.toFixed(1)}%</p>
            </div>
            <Star className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{summary.highRiskSuppliers}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Time Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Time Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="supplier" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} days`, 'Lead Time']}
                />
                <Bar 
                  dataKey="leadTime" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Radar */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData[0] ? [radarData[0]] : []}>
                <PolarGrid />
                <PolarAngleAxis tick={{ fontSize: 12 }} />
                <PolarRadiusAxis 
                  angle={45} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Performance"
                  dataKey="On-Time"
                  stroke="#4F46E5"
                  fill="#4F46E5"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Quality"
                  dataKey="Quality"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Cost"
                  dataKey="Cost Efficiency"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Supplier Performance Scorecard</h3>
          <p className="text-gray-600 mt-1">Comprehensive supplier evaluation and risk assessment</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier, index) => (
                <tr key={supplier.supplier} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.supplier}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.totalProducts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(supplier.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-1" />
                      <span className={`text-sm ${
                        supplier.avgLeadTime <= 7 ? 'text-green-600' :
                        supplier.avgLeadTime <= 14 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {supplier.avgLeadTime} days
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.onTimeDeliveryRate}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          supplier.onTimeDeliveryRate >= 95 ? 'bg-green-500' :
                          supplier.onTimeDeliveryRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${supplier.onTimeDeliveryRate}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{supplier.qualityRating}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getPerformanceColor(supplier.performanceScore)}`}>
                        {(supplier.performanceScore * 100).toFixed(0)}%
                      </span>
                      <span className={`ml-1 ${getPerformanceColor(supplier.performanceScore)}`}>
                        {getPerformanceIcon(supplier.performanceScore)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          supplier.performanceScore >= 0.9 ? 'bg-green-500' :
                          supplier.performanceScore >= 0.8 ? 'bg-blue-500' :
                          supplier.performanceScore >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${supplier.performanceScore * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(supplier.riskLevel)}`}>
                      {getRiskIcon(supplier.riskLevel)}
                      <span className="ml-1 capitalize">{supplier.riskLevel}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {supplier.categories.slice(0, 3).map((category, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                          {category}
                        </span>
                      ))}
                      {supplier.categories.length > 3 && (
                        <span className="text-xs text-gray-500">+{supplier.categories.length - 3} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {suppliers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Supplier Data</h3>
              <p className="text-gray-500">Supplier performance data will appear here once products are linked to suppliers</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🤝 Supplier Management Recommendations</h4>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {recommendation.priority === 'medium' && <Clock className="w-3 h-3 mr-1" />}
                    {recommendation.priority === 'low' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {recommendation.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">
                    {recommendation.type.replace('_', ' ').toUpperCase()}
                  </h5>
                  <p className="text-sm text-gray-600 mb-2">
                    {recommendation.message}
                  </p>
                  {recommendation.suppliers && (
                    <div className="text-xs text-gray-500">
                      Affected suppliers: {recommendation.suppliers.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Supplier Management!</h3>
              <p className="text-gray-500">All suppliers are performing well. Continue monitoring performance metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Supplier Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Performance Leaders</h5>
            <p className="text-sm text-gray-600">
              {suppliers.filter(s => s.performanceScore >= 0.9).length} suppliers are performing at excellent levels (90%+)
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Delivery Efficiency</h5>
            <p className="text-sm text-gray-600">
              Average delivery performance is {summary.avgOnTimeDelivery.toFixed(1)}% with {summary.avgLeadTime.toFixed(1)} day lead times
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Risk Management</h5>
            <p className="text-sm text-gray-600">
              {summary.highRiskSuppliers} suppliers require immediate attention for performance improvement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
