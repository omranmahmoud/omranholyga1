import { useState, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Bell,
  Brain,
  Snowflake,
  Calculator,
  Users,
  Zap
} from 'lucide-react';
import { InventoryValueChart } from './InventoryValueChart';
import { StockMovementChart } from './StockMovementChart';
import { TurnoverAnalysis } from './TurnoverAnalysis';
import { CategoryBreakdown } from './CategoryBreakdown';
import { LocationAnalysis } from './LocationAnalysis';
import { AlertsPanel } from './AlertsPanel';
import { RealTimeActivityFeed } from './RealTimeActivityFeed';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { SeasonalAnalysis } from './SeasonalAnalysis';
import { CostAnalysis } from './CostAnalysis';
import { SupplierPerformance } from './SupplierPerformance';
import { AdvancedMetrics } from './AdvancedMetrics';
import { useInventoryAnalytics } from '../../../../hooks/useInventoryAnalytics';
import { LoadingSpinner } from '../../../LoadingSpinner';
import { formatPrice } from '../../../../utils/currency';
import { useCurrency } from '../../../../context/CurrencyContext';

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const DATE_RANGES: DateRange[] = [
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 7 days'
  },
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days'
  },
  {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 3 months'
  },
  {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last year'
  }
];

export function InventoryAnalytics() {
  const { currency } = useCurrency();
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]); // Default to last 30 days
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'turnover' | 'categories' | 'locations' | 'predictive' | 'seasonal' | 'cost' | 'suppliers' | 'advanced'>('overview');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Stable callback to avoid re-creating fetch dependencies and loops
  const handleInventoryChange = useCallback((data: any) => {
    console.log('Inventory data updated:', data);
  }, []);

  const {
    analytics,
    stockMovements,
    turnoverData,
    categoryBreakdown,
    locationAnalysis,
    alerts,
    predictiveAnalytics,
    seasonalAnalysis,
    costAnalysis,
    supplierPerformance,
    advancedMetrics,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    realTimeStatus,
    refreshAnalytics
  } = useInventoryAnalytics({
    dateRange: selectedRange,
    autoRefresh: true,
    refreshInterval: realTimeEnabled ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds for real-time, 5 minutes otherwise
    realTime: realTimeEnabled,
  onInventoryChange: handleInventoryChange
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Analytics</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refreshAnalytics}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'movements', label: 'Stock Movements', icon: Activity },
    { id: 'turnover', label: 'Turnover Analysis', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: PieChart },
    { id: 'locations', label: 'Locations', icon: Package },
    { id: 'predictive', label: 'AI Predictions', icon: Brain },
    { id: 'seasonal', label: 'Seasonal Analysis', icon: Snowflake },
    { id: 'cost', label: 'Cost Analysis', icon: Calculator },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'advanced', label: 'Advanced Metrics', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1>
            
            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2">
              {realTimeEnabled ? (
                <div className="flex items-center gap-1">
                  {realTimeStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : realTimeStatus === 'connecting' ? (
                    <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">Real-time</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Standard</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-500">Comprehensive insights into your inventory performance</p>
            
            {/* Last Updated */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Real-time</label>
            <button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                realTimeEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  realTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={refreshAnalytics}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={selectedRange.label}
              onChange={(e) => {
                const range = DATE_RANGES.find(r => r.label === e.target.value);
                if (range) setSelectedRange(range);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {DATE_RANGES.map(range => (
                <option key={range.label} value={range.label}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Alerts Banner */}
      {realTimeEnabled && alerts && (alerts.lowStock?.length > 0 || alerts.outOfStock?.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 animate-pulse" />
              <span className="font-medium text-amber-800">Live Inventory Alerts</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {alerts.lowStock?.length > 0 && (
                <span className="text-amber-700">
                  {alerts.lowStock.length} items low on stock
                </span>
              )}
              {alerts.outOfStock?.length > 0 && (
                <span className="text-red-700">
                  {alerts.outOfStock.length} items out of stock
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(analytics?.totalValue || 0, currency)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center ${(analytics?.valueChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(analytics?.valueChange ?? 0) >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(analytics?.valueChange || 0).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Units in Stock</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalItems || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{analytics?.uniqueProducts || 0} unique products</span>
            {typeof analytics?.variantCount === 'number' && (
              <span>· {analytics.variantCount} variants</span>
            )}
            {typeof analytics?.variantsInStockCount === 'number' && (
              <span>· {analytics.variantsInStockCount} variants in stock</span>
            )}
          </div>
          {(typeof analytics?.inStockCount === 'number' || typeof analytics?.lowStockCount === 'number' || typeof analytics?.outOfStockCount === 'number') && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {typeof analytics?.inStockCount === 'number' && (
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">{analytics.inStockCount} in stock</span>
              )}
              {typeof analytics?.lowStockCount === 'number' && (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">{analytics.lowStockCount} low</span>
              )}
              {typeof analytics?.outOfStockCount === 'number' && (
                <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full">{analytics.outOfStockCount} out</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.turnoverRate || 0}x</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              Avg. days in stock: {analytics?.avgDaysInStock || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative">
          {isRefreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts?.lowStock?.length || 0}</p>
              {realTimeEnabled && (alerts?.lowStock?.length || 0) > 0 && (
                <div className="animate-pulse">
                  <Bell className="w-3 h-3 text-amber-500 inline ml-1" />
                </div>
              )}
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {alerts?.outOfStock?.length || 0} out of stock
            </span>
            {realTimeEnabled && (alerts?.outOfStock?.length || 0) > 0 && (
              <Bell className="w-3 h-3 text-red-500 ml-1 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts && (alerts.lowStock?.length > 0 || alerts.outOfStock?.length > 0) && (
        <AlertsPanel alerts={alerts} />
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InventoryValueChart data={analytics?.valueHistory || []} />
              <StockMovementChart data={stockMovements || []} />
            </div>
          )}

          {activeTab === 'movements' && (
            <StockMovementChart data={stockMovements || []} detailed />
          )}

          {activeTab === 'turnover' && (
            <TurnoverAnalysis data={turnoverData || []} />
          )}

          {activeTab === 'categories' && (
            <CategoryBreakdown data={categoryBreakdown || []} />
          )}

          {activeTab === 'locations' && (
            <LocationAnalysis data={locationAnalysis || []} />
          )}

          {activeTab === 'predictive' && (
            <PredictiveAnalytics data={predictiveAnalytics || { predictions: [], summary: { totalProducts: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, avgAccuracy: 0 } }} />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalAnalysis data={seasonalAnalysis || { monthlyData: [], insights: { peakMonths: [], lowMonths: [], avgSeasonalVariation: 0, recommendedStockingPeriods: [] } }} />
          )}

          {activeTab === 'cost' && (
            <CostAnalysis data={costAnalysis || { summary: { totalInventoryValue: 0, totalCostValue: 0, totalPotentialProfit: 0, overallMarginPercentage: 0, annualCarryingCost: 0, dailyCarryingCost: 0, returnOnInventoryInvestment: 0 }, categories: [], recommendations: [] }} />
          )}

          {activeTab === 'suppliers' && (
            <SupplierPerformance data={supplierPerformance || { suppliers: [], summary: { totalSuppliers: 0, avgLeadTime: 0, avgOnTimeDelivery: 0, avgQualityRating: 0, highRiskSuppliers: 0 }, recommendations: [] }} />
          )}

          {activeTab === 'advanced' && (
            <AdvancedMetrics data={advancedMetrics || { abcAnalysis: { aCategory: [], bCategory: [], cCategory: [] }, keyMetrics: { inventoryTurnoverRatio: 0, daysInInventory: 0, fillRate: 0, inventoryAccuracy: 0, stockoutFrequency: 0, averageStockValue: 0 }, performance: { turnoverTrend: 'stable', efficiency: 'good', recommendations: [] } }} />
          )}
        </div>

        {/* Real-time Activity Feed Sidebar */}
        <div className="lg:col-span-1">
          <RealTimeActivityFeed isRealTime={realTimeEnabled} />
        </div>
      </div>
    </div>
  );
}
