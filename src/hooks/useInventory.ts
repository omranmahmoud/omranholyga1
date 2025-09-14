import { useState, useEffect, useCallback } from 'react';
import { inventoryService, InventoryItem } from '../services/inventoryService';
import { toast } from 'react-hot-toast';

interface UseInventoryOptions {
  autoFetch?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useInventory(options: UseInventoryOptions = {}) {
  const {
    autoFetch = true,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchInventory = useCallback(async (retry = false) => {
    if (retry && retryCount >= maxRetries) {
      setError('Maximum retry attempts reached');
      setLoading(false);
      return;
    }

    try {
      console.log('useInventory: Starting inventory fetch...');
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAllInventory();
      console.log('useInventory: Received inventory data:', data);
      setInventory(data);
      setRetryCount(0); // Reset retry count on success
      console.log('useInventory: Inventory state updated');
    } catch (error: any) {
      console.error('useInventory: Error fetching inventory:', error);
      
      // Check if it's an authorization error
      if (error.status === 401 || error.status === 403) {
        setError('You do not have permission to access inventory data');
        toast.error('Access denied: Admin privileges required');
        setLoading(false);
        return;
      }
      
      setError(error.message || 'Failed to fetch inventory');
      
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchInventory(true);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        toast.error('Failed to fetch inventory data');
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [maxRetries, retryCount, retryDelay, retryOnError]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchInventory();
    }
  }, [autoFetch, fetchInventory]);

  const updateInventory = async (id: string, quantity: number) => {
    try {
      setLoading(true);
      const updatedItem = await inventoryService.updateInventory(id, quantity);
      setInventory(prev => prev.map(item => 
        item._id === id ? updatedItem : item
      ));
      toast.success('Inventory updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addInventory = async (data: any) => {
    try {
      setLoading(true);
      const newItem = await inventoryService.addInventory(data);
      setInventory(prev => [...prev, newItem]);
      toast.success('Inventory added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add inventory');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdate = async (items: { _id: string; quantity: number }[]) => {
    try {
      setLoading(true);
      await inventoryService.bulkUpdateInventory(items);
      await fetchInventory(); // Refresh data after bulk update
      toast.success('Bulk update completed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    inventory,
    loading,
    error,
    refreshInventory: () => fetchInventory(false),
    updateInventory,
    addInventory,
    bulkUpdate
  };
}
