import { useState, useEffect, useCallback, useRef } from 'react';
import { inventoryAnalyticsService, InventoryAnalytics, StockMovement, TurnoverData, CategoryData, LocationData, InventoryAlerts } from '../services/inventoryAnalyticsService';
import { toast } from 'react-hot-toast';

interface UseInventoryAnalyticsOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
  realTime?: boolean;
  onInventoryChange?: (data: any) => void;
}

export function useInventoryAnalytics(options: UseInventoryAnalyticsOptions) {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [locationAnalysis, setLocationAnalysis] = useState<LocationData[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlerts | null>(null);
  
  // New enhanced analytics states
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<any>(null);
  const [seasonalAnalysis, setSeasonalAnalysis] = useState<any>(null);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [supplierPerformance, setSupplierPerformance] = useState<any>(null);
  const [advancedMetrics, setAdvancedMetrics] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  const fetchAnalytics = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [
        analyticsData,
        movementsData,
        turnoverAnalysis,
        categoryData,
        locationData,
        alertsData,
        predictiveData,
        seasonalData,
        costData,
        supplierData,
        advancedData
      ] = await Promise.all([
        inventoryAnalyticsService.getAnalytics(options.dateRange),
        inventoryAnalyticsService.getStockMovements(options.dateRange),
        inventoryAnalyticsService.getTurnoverAnalysis(options.dateRange),
        inventoryAnalyticsService.getCategoryBreakdown(options.dateRange),
        inventoryAnalyticsService.getLocationAnalysis(options.dateRange),
        inventoryAnalyticsService.getAlerts(),
        inventoryAnalyticsService.getPredictiveAnalytics(options.dateRange),
        inventoryAnalyticsService.getSeasonalAnalysis(options.dateRange),
        inventoryAnalyticsService.getCostAnalysis(),
        inventoryAnalyticsService.getSupplierPerformance(options.dateRange),
        inventoryAnalyticsService.getAdvancedMetrics(options.dateRange)
      ]);

      setAnalytics(analyticsData);
      setStockMovements(movementsData);
      setTurnoverData(turnoverAnalysis);
      setCategoryBreakdown(categoryData);
      setLocationAnalysis(locationData);
      setAlerts(alertsData);
      setPredictiveAnalytics(predictiveData);
      setSeasonalAnalysis(seasonalData);
      setCostAnalysis(costData);
      setSupplierPerformance(supplierData);
      setAdvancedMetrics(advancedData);
      setLastUpdated(new Date());

      // Check for new alerts and show notifications
      if (alertsData && showRefreshIndicator) {
        const lowStockCount = alertsData.lowStock?.length || 0;
        const outOfStockCount = alertsData.outOfStock?.length || 0;
        
        if (lowStockCount > 0 || outOfStockCount > 0) {
          toast.error(`${lowStockCount} low stock, ${outOfStockCount} out of stock items`, {
            duration: 4000,
          });
        }
      }

      options.onInventoryChange?.(analyticsData);
    } catch (err: any) {
      console.error('Error fetching inventory analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      
      if (showRefreshIndicator) {
        toast.error('Failed to refresh analytics data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [options.dateRange, options.onInventoryChange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return;

    const interval = setInterval(() => fetchAnalytics(true), options.refreshInterval);
    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchAnalytics]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics(true);
    toast.success('Analytics refreshed', { duration: 2000 });
  }, [fetchAnalytics]);

  return {
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
  };
}
