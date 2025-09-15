import api from './api';
import { toast } from 'react-hot-toast';
import type { ShippingZone, ShippingRate, ShippingCalculation } from '../types/shipping';

class ShippingService {
  // Fetch all shipping zones
  async getZones(): Promise<ShippingZone[]> {
    try {
      console.log('ShippingService: Fetching zones from /shipping/zones');
      const response = await api.getWithRetry('/shipping/zones');
      console.log('ShippingService: Zones response:', response);
      if (!response.data) throw new Error('No data received for shipping zones');
      return response.data;
    } catch (error) {
      console.error('ShippingService: Error fetching shipping zones:', error);
      throw new Error('Failed to fetch shipping zones');
    }
  }

  // Fetch shipping rates, optionally filtered by zone ID
  async getRates(zoneId?: string): Promise<ShippingRate[]> {
    try {
      const url = zoneId ? `/shipping/rates?zone=${zoneId}` : '/shipping/rates';
      console.log('ShippingService: Fetching rates from', url);
      const response = await api.getWithRetry(url);
      console.log('ShippingService: Rates response:', response);
      if (!response.data) throw new Error('No data received for shipping rates');
      return response.data;
    } catch (error) {
      console.error(`ShippingService: Error fetching shipping rates for zone ${zoneId || 'all'}:`, error);
      throw new Error('Failed to fetch shipping rates');
    }
  }

  // Create a new shipping zone
  async createZone(data: Omit<ShippingZone, '_id'>): Promise<ShippingZone> {
    try {
      const response = await api.postWithRetry('/shipping/zones', data);
      if (!response.data) throw new Error('No data returned after creating shipping zone');
      toast.success('Shipping zone created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      toast.error('Failed to create shipping zone');
      throw error;
    }
  }

  // Update an existing shipping zone
  async updateZone(id: string, data: Partial<ShippingZone>): Promise<ShippingZone> {
    try {
      const response = await api.putWithRetry(`/shipping/zones/${id}`, data);
      if (!response.data) throw new Error('No data returned after updating shipping zone');
      toast.success('Shipping zone updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating shipping zone ${id}:`, error);
      toast.error('Failed to update shipping zone');
      throw error;
    }
  }

  // Delete a shipping zone
  async deleteZone(id: string): Promise<void> {
    try {
      await api.deleteWithRetry(`/shipping/zones/${id}`);
      toast.success('Shipping zone deleted successfully');
    } catch (error) {
      console.error(`Error deleting shipping zone ${id}:`, error);
      toast.error('Failed to delete shipping zone');
      throw error;
    }
  }

  // Create a new shipping rate
  async createRate(data: Omit<ShippingRate, '_id'>): Promise<ShippingRate> {
    try {
      const response = await api.postWithRetry('/shipping/rates', data);
      if (!response.data) throw new Error('No data returned after creating shipping rate');
      toast.success('Shipping rate created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating shipping rate:', error);
      toast.error('Failed to create shipping rate');
      throw error;
    }
  }

  // Update an existing shipping rate
  async updateRate(id: string, data: Partial<ShippingRate>): Promise<ShippingRate> {
    try {
      const response = await api.putWithRetry(`/shipping/rates/${id}`, data);
      if (!response.data) throw new Error('No data returned after updating shipping rate');
      toast.success('Shipping rate updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating shipping rate ${id}:`, error);
      toast.error('Failed to update shipping rate');
      throw error;
    }
  }

  // Delete a shipping rate
  async deleteRate(id: string): Promise<void> {
    try {
      await api.deleteWithRetry(`/shipping/rates/${id}`);
      toast.success('Shipping rate deleted successfully');
    } catch (error) {
      console.error(`Error deleting shipping rate ${id}:`, error);
      toast.error('Failed to delete shipping rate');
      throw error;
    }
  }

  // Calculate shipping fee based on input data
  async calculateShipping(data: ShippingCalculation): Promise<number> {
    try {
      const response = await api.postWithRetry('/shipping/calculate', data);
      if (!response.data || typeof response.data.fee !== 'number') {
        throw new Error('Invalid data received for shipping fee calculation');
      }
      return response.data.fee;
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      toast.error('Failed to calculate shipping fee');
      throw error;
    }
  }
}

// Export a singleton instance of the shipping service
export const shippingService = new ShippingService();
