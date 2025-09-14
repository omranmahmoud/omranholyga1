import api from '../api';
import { toast } from 'react-hot-toast';
import type { AnalyticsConfig } from '../../types/analytics';

class AnalyticsService {
  async getFacebookPixelConfig() {
    try {
      const response = await api.get('/settings/analytics/facebook-pixel');
      return response.data;
    } catch (error) {
      console.error('Error fetching Facebook Pixel config:', error);
      throw error;
    }
  }

  async updateFacebookPixelConfig(config: { pixelId: string; enabled: boolean }) {
    try {
      const response = await api.put('/settings/analytics/facebook-pixel', config);
      return response.data;
    } catch (error) {
      console.error('Error updating Facebook Pixel config:', error);
      throw error;
    }
  }

  async getAnalyticsConfig(): Promise<AnalyticsConfig> {
    try {
      const response = await api.get('/settings/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics config:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
