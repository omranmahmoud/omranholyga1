import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentlyViewedItem {
  id: string; // product id
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  viewedAt: string; // ISO date-time
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[]; // sorted desc by viewedAt
  addRecent: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  removeRecents: (ids: string[]) => void;
  clearRecents: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'recentlyViewed:v1';
const MAX_ITEMS = 120; // keep last 120 products

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // load from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            // basic shape validation
            setItems(parsed.filter(p => p && p.id && p.viewedAt));
          }
        } catch {}
      })
      .finally(() => setLoaded(true));
  }, []);

  // persist
  useEffect(() => {
    if (!loaded) return; // avoid writing before initial load
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, loaded]);

  const addRecent = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems(prev => {
      const now = new Date().toISOString();
      const withoutExisting = prev.filter(p => p.id !== item.id); // dedupe by product id
      const updated: RecentlyViewedItem[] = [{ ...item, viewedAt: now }, ...withoutExisting];
      if (updated.length > MAX_ITEMS) updated.length = MAX_ITEMS;
      return updated;
    });
  }, []);

  const removeRecents = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setItems(prev => prev.filter(p => !ids.includes(p.id)));
  }, []);

  const clearRecents = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, addRecent, removeRecents, clearRecents }), [items, addRecent, removeRecents, clearRecents]);
  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
};

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
