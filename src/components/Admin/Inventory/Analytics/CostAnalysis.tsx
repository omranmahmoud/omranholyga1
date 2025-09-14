import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertTriangle,
  Target,
  Calculator,
  Percent
} from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie } from 'recharts';

interface CategoryCostData {
  category: string;
  inventoryValue: number;
  costValue: number;
  potentialProfit: number;
  marginPercentage: number;
  items: number;
}

interface CostAnalysisData {
  summary: {
    totalInventoryValue: number;
    totalCostValue: number;
    totalPotentialProfit: number;
    overallMarginPercentage: number;
    annualCarryingCost: number;
    dailyCarryingCost: number;
    returnOnInventoryInvestment: number;
  };
  categories: CategoryCostData[];
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    categories?: string[];
  }>;
}

interface CostAnalysisProps {
  data: CostAnalysisData;
}

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export function CostAnalysis({ data }: CostAnalysisProps) {
  const { summary, categories, recommendations } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const pieChartData = categories.map(cat => ({
    name: cat.category,
    value: cat.inventoryValue,
    profit: cat.potentialProfit
  }));

  const marginData = categories.map(cat => ({
    category: cat.category,
    marginPercentage: cat.marginPercentage
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalInventoryValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Cost: {formatCurrency(summary.totalCostValue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Potential Profit</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPotentialProfit)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Margin: {formatPercentage(summary.overallMarginPercentage)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Annual Carrying Cost</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.annualCarryingCost)}</p>
            </div>
            <Calculator className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Daily: {formatCurrency(summary.dailyCarryingCost)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-blue-600">{formatPercentage(summary.returnOnInventoryInvestment)}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Return on investment
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin Analysis Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Margins by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [formatPercentage(value as number), 'Profit Margin']}
                />
                <Bar 
                  dataKey="marginPercentage" 
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cost Analysis by Category</h3>
          <p className="text-gray-600 mt-1">Detailed breakdown of costs, values, and profitability</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.category} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">
                        {category.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.inventoryValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.costValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(category.potentialProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        category.marginPercentage >= 30 ? 'text-green-600' :
                        category.marginPercentage >= 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(category.marginPercentage)}
                      </span>
                      {category.marginPercentage >= 30 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                      ) : category.marginPercentage < 20 ? (
                        <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                      ) : null}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          category.marginPercentage >= 30 ? 'bg-green-500' :
                          category.marginPercentage >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(category.marginPercentage * 2, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.marginPercentage >= 30 ? 'text-green-800 bg-green-100' :
                      category.marginPercentage >= 20 ? 'text-yellow-800 bg-yellow-100' : 'text-red-800 bg-red-100'
                    }`}>
                      {category.marginPercentage >= 30 ? 'Excellent' :
                       category.marginPercentage >= 20 ? 'Good' : 'Needs Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">💰 Cost Optimization Recommendations</h4>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {recommendation.priority === 'medium' && <Percent className="w-3 h-3 mr-1" />}
                    {recommendation.priority === 'low' && <Target className="w-3 h-3 mr-1" />}
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
                  {recommendation.categories && (
                    <div className="text-xs text-gray-500">
                      Affected categories: {recommendation.categories.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Excellent Cost Management!</h3>
              <p className="text-gray-500">No immediate cost optimization recommendations at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Financial Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Capital Efficiency</h5>
            <p className="text-sm text-gray-600">
              Your inventory investment is generating a {formatPercentage(summary.returnOnInventoryInvestment)} return
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Carrying Cost Impact</h5>
            <p className="text-sm text-gray-600">
              Annual carrying costs represent {formatPercentage((summary.annualCarryingCost / summary.totalInventoryValue) * 100)} of inventory value
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h5 className="font-medium text-gray-900 mb-2">Profit Optimization</h5>
            <p className="text-sm text-gray-600">
              {summary.overallMarginPercentage >= 25 ? 'Strong margins maintained across categories' : 'Opportunity to improve margins through pricing optimization'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
