
import { useState, useEffect } from 'react';
import { analyticsService } from '../../../../../services/analytics/analyticsService';
import { facebookPixel } from '../../../../../services/analytics/facebookPixel';
import { toast } from 'react-hot-toast';

export function useFacebookPixel() {
  const [config, setConfig] = useState({ pixelId: '', enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await analyticsService.getFacebookPixelConfig();
      setConfig(data);
    } catch (error) {
      toast.error('Failed to load Facebook Pixel settings');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: { pixelId: string; enabled: boolean }) => {
    try {
      setLoading(true);
      
      // Validate Pixel ID format
      if (newConfig.enabled && !/^\d{15,16}$/.test(newConfig.pixelId)) {
        throw new Error('Invalid Facebook Pixel ID format');
      }

      // Update config on server
      await analyticsService.updateFacebookPixelConfig(newConfig);

      // Update local state
      setConfig(newConfig);

      // Initialize pixel if enabled
      if (newConfig.enabled) {
        facebookPixel.init(newConfig);
      }

      toast.success('Facebook Pixel settings updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update Facebook Pixel settings');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    updateConfig
  };
}
