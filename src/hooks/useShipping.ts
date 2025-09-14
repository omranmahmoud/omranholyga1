import { useState, useEffect, useCallback } from 'react';
import { shippingService } from '../services/shippingService';
import { toast } from 'react-hot-toast';
import type { ShippingZone, ShippingRate } from '../types/shipping';

interface UseShippingOptions {
  autoFetch?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

export function useShipping(options: UseShippingOptions = {}) {
  const {
    autoFetch = true,
    retryOnError = true,
    maxRetries = 3
  } = options;

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchShippingData = useCallback(async (retry = false) => {
    if (retry && retryCount >= maxRetries) {
      console.error('Maximum retry attempts reached for shipping data');
      setError('Maximum retry attempts reached');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching shipping data...');
      setLoading(true);
      setError(null);

      const [zonesData, ratesData] = await Promise.all([
        shippingService.getZones(),
        shippingService.getRates()
      ]);

      console.log('Shipping data fetched successfully:', { zonesData, ratesData });
      setZones(zonesData);
      setRates(ratesData);
      setRetryCount(0); // Reset retry count on success
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shipping data:', error);
      setError('Failed to load shipping data');
      
      if (retryOnError && retryCount < maxRetries) {
        console.log(`Retrying... attempt ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchShippingData(true);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        toast.error('Failed to load shipping data');
        setLoading(false);
      }
    }
  }, [maxRetries, retryCount, retryOnError]);

  useEffect(() => {
    if (autoFetch) {
      fetchShippingData();
    }
  }, [autoFetch, fetchShippingData]);

  const createZone = async (data: Omit<ShippingZone, '_id'>) => {
    try {
      const newZone = await shippingService.createZone(data);
      setZones(prev => [...prev, newZone]);
      return newZone;
    } catch (error) {
      throw error;
    }
  };

  const updateZone = async (id: string, data: Partial<ShippingZone>) => {
    try {
      const updatedZone = await shippingService.updateZone(id, data);
      setZones(prev => prev.map(zone => 
        zone._id === id ? updatedZone : zone
      ));
      return updatedZone;
    } catch (error) {
      throw error;
    }
  };

  const deleteZone = async (id: string) => {
    try {
      await shippingService.deleteZone(id);
      setZones(prev => prev.filter(zone => zone._id !== id));
    } catch (error) {
      throw error;
    }
  };

  const createRate = async (data: Omit<ShippingRate, '_id'>) => {
    try {
      const newRate = await shippingService.createRate(data);
      setRates(prev => [...prev, newRate]);
      return newRate;
    } catch (error) {
      throw error;
    }
  };

  const updateRate = async (id: string, data: Partial<ShippingRate>) => {
    try {
      const updatedRate = await shippingService.updateRate(id, data);
      setRates(prev => prev.map(rate => 
        rate._id === id ? updatedRate : rate
      ));
      return updatedRate;
    } catch (error) {
      throw error;
    }
  };

  const deleteRate = async (id: string) => {
    try {
      await shippingService.deleteRate(id);
      setRates(prev => prev.filter(rate => rate._id !== id));
    } catch (error) {
      throw error;
    }
  };

  return {
    zones,
    rates,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    createRate,
    updateRate,
    deleteRate,
    refreshData: () => {
      setRetryCount(0);
      return fetchShippingData();
    }
  };
}
