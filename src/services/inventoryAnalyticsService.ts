import api from './api';

export interface InventoryAnalytics {
  totalValue: number;
  valueChange: number;
  totalItems: number;
  reservedUnits?: number;
  availableUnits?: number;
  uniqueProducts: number;
  variantCount?: number;
  variantsInStockCount?: number;
  inStockCount?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  turnoverRate: number;
  avgDaysInStock: number;
  valueHistory: ValueHistoryPoint[];
}

export interface ValueHistoryPoint {
  date: string;
  value: number;
  change: number;
}

export interface StockMovement {
  date: string;
  product: {
    _id: string;
    name: string;
  };
  type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  location: string;
  user: {
    _id: string;
    name: string;
  };
}

export interface TurnoverData {
  product: {
    _id: string;
    name: string;
    category: string;
  };
  currentStock: number;
  averageStock: number;
  soldQuantity: number;
  turnoverRate: number;
  daysInStock: number;
  reorderPoint: number;
  status: 'healthy' | 'slow_moving' | 'fast_moving' | 'dead_stock';
}

export interface CategoryData {
  category: string;
  totalValue: number;
  totalItems: number;
  percentageOfTotal: number;
  turnoverRate: number;
  profitMargin: number;
}

export interface LocationData {
  location: string;
  totalValue: number;
  totalItems: number;
  utilizationRate: number;
  averageTurnover: number;
  alertCount: number;
}

export interface InventoryAlerts {
  lowStock: {
    product: string;
    currentStock: number;
    threshold: number;
    location: string;
  }[];
  outOfStock: {
    product: string;
    location: string;
    lastSold: string;
  }[];
  deadStock: {
    product: string;
    daysInStock: number;
    currentStock: number;
    location: string;
  }[];
  overstock: {
    product: string;
    currentStock: number;
    averageDemand: number;
    location: string;
  }[];
}

class InventoryAnalyticsService {
  async getAnalytics(dateRange: { start: Date; end: Date }): Promise<InventoryAnalytics> {
    try {
      const url = `/inventory/analytics?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching inventory analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }

  async getStockMovements(dateRange: { start: Date; end: Date }): Promise<StockMovement[]> {
    try {
      const url = `/inventory/movements?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching stock movements:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch stock movements');
    }
  }

  async getTurnoverAnalysis(dateRange: { start: Date; end: Date }): Promise<TurnoverData[]> {
    try {
      const url = `/inventory/turnover?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching turnover analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch turnover analysis');
    }
  }

  async getCategoryBreakdown(dateRange: { start: Date; end: Date }): Promise<CategoryData[]> {
    try {
      const url = `/inventory/categories?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching category breakdown:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch category breakdown');
    }
  }

  async getLocationAnalysis(dateRange: { start: Date; end: Date }): Promise<LocationData[]> {
    try {
      const url = `/inventory/locations?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching location analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch location analysis');
    }
  }

  async getAlerts(): Promise<InventoryAlerts> {
    try {
      const response = await api.getWithRetry('/inventory/alerts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching inventory alerts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }

  async exportAnalytics(dateRange: { start: Date; end: Date }, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    try {
      const url = `/inventory/export?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}&format=${format}`;
      const response = await api.getWithRetry(url, { responseType: 'blob' });
      return response.data;
    } catch (error: any) {
      console.error('Error exporting analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to export analytics');
    }
  }

  // NEW ENHANCED ANALYTICS METHODS
  async getPredictiveAnalytics(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const url = `/inventory/analytics/predictive?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching predictive analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch predictive analytics');
    }
  }

  async getSeasonalAnalysis(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const url = `/inventory/analytics/seasonal?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching seasonal analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch seasonal analysis');
    }
  }

  async getCostAnalysis(): Promise<any> {
    try {
      const response = await api.getWithRetry('/inventory/analytics/cost');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching cost analysis:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cost analysis');
    }
  }

  async getSupplierPerformance(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const url = `/inventory/analytics/suppliers?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching supplier performance:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch supplier performance');
    }
  }

  async getAdvancedMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const url = `/inventory/analytics/advanced?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching advanced metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch advanced metrics');
    }
  }
}

export const inventoryAnalyticsService = new InventoryAnalyticsService();
