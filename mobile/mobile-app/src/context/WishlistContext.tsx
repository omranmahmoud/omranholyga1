import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WishlistItem {
  productId: string;
  name: string;
  price?: number;
  image?: string;
  color?: string;
  size?: string;
}

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string, color?: string, size?: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isWishlisted: (productId: string, color?: string, size?: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('wishlist')
      .then(data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) setWishlist(parsed);
        } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('wishlist', JSON.stringify(wishlist)).catch(() => {});
  }, [wishlist]);

  const eq = (a: WishlistItem, b: WishlistItem) =>
    a.productId === b.productId && (a.color || '') === (b.color || '') && (a.size || '') === (b.size || '');

  const isWishlisted = (productId: string, color?: string, size?: string) => {
    return wishlist.some(w => w.productId === productId && (color ? w.color === color : true) && (size ? w.size === size : true));
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlist(prev => (prev.some(w => eq(w, item)) ? prev : [...prev, item]));
  };

  const removeFromWishlist = (productId: string, color?: string, size?: string) => {
    setWishlist(prev => prev.filter(w => !(w.productId === productId && (color ? w.color === color : true) && (size ? w.size === size : true))));
  };

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist(prev => (prev.some(w => eq(w, item)) ? prev.filter(w => !eq(w, item)) : [...prev, item]));
  };

  const clearWishlist = () => setWishlist([]);

  const value = useMemo(() => ({ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, clearWishlist }), [wishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
