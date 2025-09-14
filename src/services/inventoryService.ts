import api from './api';

export interface InventoryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
  };
  size: string;
  color: string;
  quantity: number;
  location: string;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

class InventoryService {
  private cache: {
    data: InventoryItem[] | null;
    timestamp: number;
    expiresIn: number;
  } = {
    data: null,
    timestamp: 0,
    expiresIn: 5 * 60 * 1000 // 5 minutes
  };

  private isCacheValid(): boolean {
    return (
      this.cache.data !== null &&
      Date.now() - this.cache.timestamp < this.cache.expiresIn
    );
  }

  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      // Return cached data if valid
      if (this.isCacheValid()) {
        console.log('Returning cached inventory data:', this.cache.data?.length, 'items');
        return this.cache.data!;
      }

      console.log('Fetching inventory from API...');
      const response = await api.getWithRetry('/inventory');
      console.log('API Response received:', response.data);
      
      const normalizedData = this.normalizeInventoryData(response.data);
      console.log('Normalized data:', normalizedData.length, 'items');
      
      // Update cache
      this.cache = {
        data: normalizedData,
        timestamp: Date.now(),
        expiresIn: 5 * 60 * 1000
      };

      return normalizedData;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  async getProductInventory(productId: string): Promise<InventoryItem[]> {
    try {
      const response = await api.getWithRetry(`/inventory/product/${productId}`);
      return this.normalizeInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching product inventory:', error);
      throw new Error('Failed to fetch product inventory');
    }
  }

  async updateInventory(id: string, quantity: number): Promise<InventoryItem> {
    try {
      const response = await api.putWithRetry(`/inventory/${id}`, { quantity });
      
      // Update cache if it exists
      if (this.cache.data) {
        this.cache.data = this.cache.data.map(item =>
          item._id === id ? { ...item, quantity } : item
        );
      }

      const result = this.normalizeInventoryItem(response.data);
      if (!result) {
        throw new Error('Invalid inventory item returned from server');
      }
      return result;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  async addInventory(data: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const response = await api.postWithRetry('/inventory', this.serializeInventoryData(data));
      
      // Update cache if it exists
      if (this.cache.data) {
        const normalizedItem = this.normalizeInventoryItem(response.data);
        if (normalizedItem) {
          this.cache.data = [...this.cache.data, normalizedItem];
        }
      }

      const result = this.normalizeInventoryItem(response.data);
      if (!result) {
        throw new Error('Invalid inventory item returned from server');
      }
      return result;
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      
      // Extract error message from different error formats
      let errorMessage = 'Failed to add inventory';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async bulkUpdateInventory(items: { _id: string; quantity: number }[]): Promise<void> {
    try {
      await api.postWithRetry('/inventory/bulk', { items });
      
      // Invalidate cache after bulk update
      this.cache.data = null;
    } catch (error) {
      console.error('Error performing bulk update:', error);
      throw new Error('Failed to update inventory');
    }
  }

  private normalizeInventoryData(data: any[]): InventoryItem[] {
    console.log('normalizeInventoryData called with:', data);
    
    if (!Array.isArray(data)) {
      console.error('Invalid inventory data - not an array:', data);
      return [];
    }
    
    const normalized = data
      .map(item => this.normalizeInventoryItem(item))
      .filter((item): item is InventoryItem => item !== null);
      
    console.log('Normalized inventory items:', normalized);
    return normalized;
  }

  private normalizeInventoryItem(item: any): InventoryItem | null {
    if (!item || typeof item !== 'object') {
      console.error('Invalid inventory item:', item);
      return null;
    }

    try {
      return {
        _id: String(item._id),
        product: {
          _id: String(item.product?._id || item.product),
          name: String(item.product?.name || ''),
          images: Array.isArray(item.product?.images) ? [...item.product.images] : []
        },
        size: String(item.size),
        color: String(item.color),
        quantity: Number(item.quantity),
        location: String(item.location),
        lowStockThreshold: Number(item.lowStockThreshold || 5),
        status: this.calculateStatus(Number(item.quantity), Number(item.lowStockThreshold || 5)),
        lastUpdated: new Date(item.lastUpdated || item.updatedAt || Date.now()).toISOString()
      };
    } catch (error) {
      console.error('Error normalizing inventory item:', error);
      return null;
    }
  }

  private calculateStatus(quantity: number, threshold: number): InventoryItem['status'] {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= threshold) return 'low_stock';
    return 'in_stock';
  }

  private serializeInventoryData(data: Partial<InventoryItem>): any {
    return {
      ...data,
      product: typeof data.product === 'object' ? data.product._id : data.product,
      quantity: Number(data.quantity)
    };
  }
}

export const inventoryService = new InventoryService();
