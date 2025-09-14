import api from './api';
import { API_ENDPOINTS } from './api/endpoints';
import { withRetry } from '../utils/retry';
import type { Hero, StoreSettings, Announcement } from '../types/store';

class StoreService {
  private async fetchWithRetry<T>(endpoint: string, defaultValue: T, opts?: { silent404?: boolean }): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response = await api.getWithRetry(endpoint, opts?.silent404 ? {
            validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404
          } : undefined);
          // If we intentionally allowed 404, convert it to default
          if (opts?.silent404 && response?.status === 404) {
            return defaultValue;
          }
          return response.data;
        } catch (error: any) {
          // Return default value for 404 errors (resource not found)
          if (error.response?.status === 404) {
            return defaultValue;
          }
          throw error;
        }
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        onError: (error: any) => {
          // Don't log expected 404s that resolve to provided defaults
          if (error?.response?.status === 404) return;
          console.error('Store service error:', error);
        }
      }
    );
  }

  async getActiveHero(): Promise<Hero | null> {
  return this.fetchWithRetry<Hero | null>(API_ENDPOINTS.HERO.ACTIVE, null, { silent404: true });
  }

  async getSettings(): Promise<StoreSettings> {
    return this.fetchWithRetry<StoreSettings>(API_ENDPOINTS.SETTINGS.GET, {
      name: 'Eva Curves Fashion Store',
      email: 'contact@evacurves.com',
      currency: 'USD',
      timezone: 'UTC',
  logo: null,
  productGridStyle: 'standard'
  ,productCardStyle: 'modern'
    });
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
  return this.fetchWithRetry<Announcement[]>(`${API_ENDPOINTS.ANNOUNCEMENTS.ACTIVE}?platform=web`, []);
  }

  async getActiveBackground(): Promise<any> {
    return this.fetchWithRetry<any>(API_ENDPOINTS.BACKGROUNDS.ACTIVE, null);
  }

  async updateHero(id: string, data: Partial<Hero>): Promise<Hero> {
    const response = await api.putWithRetry(API_ENDPOINTS.HERO.UPDATE(id), data);
    return response.data;
  }

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const response = await api.putWithRetry(API_ENDPOINTS.SETTINGS.UPDATE, data);
    return response.data;
  }
}

export const storeService = new StoreService();
