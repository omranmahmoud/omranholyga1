import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storeService } from '../services/storeService';
import { toast } from 'react-hot-toast';
import type { Hero, StoreSettings, Announcement } from '../types/store';
import { realTimeService } from '../services/realTimeService';
import { facebookPixel } from '../services/analytics';

// Define context state interface
interface StoreState {
  hero: Hero | null;
  settings: StoreSettings | null;
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

// Define context actions interface
interface StoreActions {
  updateHero: (data: Partial<Hero>) => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

// Combine state and actions for context type
type StoreContextType = StoreState & StoreActions;

// Create context with undefined initial value
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Configuration options
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // Base delay in ms
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [state, setState] = useState<StoreState>({
    hero: null,
    settings: null,
    announcements: [],
    loading: true,
    error: null
  });
  const [retryCount, setRetryCount] = useState(0);

  // Fetch store data with retry logic
  const fetchStoreData = useCallback(async (retry = false) => {
    // Check retry limit
    if (retry && retryCount >= CONFIG.MAX_RETRIES) {
      setState(prev => ({
        ...prev,
        error: 'Maximum retry attempts reached',
        loading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all data concurrently
      const [heroData, settingsData, announcementsData] = await Promise.all([
        storeService.getActiveHero(),
        storeService.getSettings(),
        storeService.getActiveAnnouncements()
      ]);

      // Update state with fetched data
      setState({
        hero: heroData,
        settings: settingsData,
        announcements: announcementsData,
        loading: false,
        error: null
      });

      // Apply SEO from settings on initial load
      if (settingsData?.siteTitle) {
        document.title = settingsData.siteTitle;
      }
      const ensureMeta = (name: string) => {
        let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!m) {
          m = document.createElement('meta');
          m.setAttribute('name', name);
          document.head.appendChild(m);
        }
        return m;
      };
      if (settingsData?.siteDescription) {
        ensureMeta('description').setAttribute('content', settingsData.siteDescription);
      }
      if (settingsData?.keywords?.length) {
        ensureMeta('keywords').setAttribute('content', settingsData.keywords.join(', '));
      }

      // Reset retry count on success
      setRetryCount(0);

    } catch (error) {
      console.error('Error fetching store data:', error);

      // Handle retry logic
      if (retryCount < CONFIG.MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        setTimeout(() => {
          fetchStoreData(true);
        }, delay);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to load store data',
          loading: false
        }));
        toast.error('Failed to load store data');
      }
    }
  }, [retryCount]);

  // Initial data fetch
  useEffect(() => {
    fetchStoreData();

    // Optional: Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchStoreData();
    }, CONFIG.AUTO_REFRESH_INTERVAL);

    // Subscribe to real-time design/settings updates
    const unsubscribeSettings = realTimeService.subscribe('settings_updated', (event) => {
      const updated = event.data as Partial<StoreSettings>;
      setState(prev => ({
        ...prev,
        // Merge only provided fields to avoid overwriting others
        settings: { ...prev.settings, ...updated } as StoreSettings
      }));
      // Reflect SEO immediately if provided
      if (updated.siteTitle) {
        document.title = updated.siteTitle;
      }
      if (updated.siteDescription || (updated.keywords && updated.keywords.length)) {
        const ensureMeta = (name: string) => {
          let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (!m) {
            m = document.createElement('meta');
            m.setAttribute('name', name);
            document.head.appendChild(m);
          }
          return m;
        };
        if (updated.siteDescription) {
          const metaDesc = ensureMeta('description');
          metaDesc.setAttribute('content', updated.siteDescription);
        }
        if (updated.keywords) {
          const metaKeywords = ensureMeta('keywords');
          metaKeywords.setAttribute('content', updated.keywords.join(', '));
        }
      }
  const msgParts: string[] = [];
  if (updated.primaryColor || updated.headerLayout) msgParts.push('Design');
  if (updated.socialLinks) msgParts.push('Social');
  if (updated.phone || updated.address || updated.email || updated.name) msgParts.push('Contact');
  if (updated.siteTitle || updated.siteDescription || updated.keywords) msgParts.push('SEO');
  const msg = (msgParts.length ? msgParts.join(' + ') : 'Settings') + ' updated';
  toast.success(msg, { id: 'settings-updated' });
    });

    // Optionally handle footer settings updates if your UI uses them elsewhere
    const unsubscribeFooter = realTimeService.subscribe('footer_settings_updated', () => {
      toast.success('Footer settings updated', { id: 'footer-settings-updated' });
    });

    return () => {
      clearInterval(refreshInterval);
  unsubscribeSettings();
  unsubscribeFooter();
    };
  }, [fetchStoreData]);

  // Update hero section
  const updateHero = async (heroData: Partial<Hero>) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      if (state.hero?._id) {
        const updatedHero = await storeService.updateHero(state.hero._id, heroData);
        setState(prev => ({
          ...prev,
          hero: updatedHero,
          loading: false
        }));
        toast.success('Hero section updated successfully');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  // Update store settings
  const updateSettings = useCallback(async (settingsData: Partial<StoreSettings>) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const updatedSettings = await storeService.updateSettings(settingsData);
      
      // Initialize Facebook Pixel if enabled
      if (settingsData.facebookPixel?.enabled) {
        facebookPixel.init(settingsData.facebookPixel);
      }

      setState(prev => ({
        ...prev,
        settings: updatedSettings,
        loading: false
      }));
      
      toast.success('Store settings updated successfully');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []); // Empty dependency array since it only uses setState

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setRetryCount(0);
    await fetchStoreData();
  }, [fetchStoreData]);

  // Context value
  const value: StoreContextType = {
    ...state,
    updateHero,
    updateSettings,
    refreshData
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

// Custom hook for using store context
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
