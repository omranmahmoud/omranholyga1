import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
  // Flash sale metadata (optional)
  flashPrice?: number;          // discounted flash price actually applied
  originalPrice?: number;       // original/base price before flash
  flashEndsAt?: string;         // ISO end time for sale (for future countdown badges)
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    AsyncStorage.getItem('cart')
      .then((data) => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          } else {
            // If corrupted/legacy shape, reset
            setCart([]);
            AsyncStorage.removeItem('cart').catch(() => {});
          }
        } catch {
          // If JSON is invalid, reset
          setCart([]);
          AsyncStorage.removeItem('cart').catch(() => {});
        }
      })
      .catch(() => {
        // Ignore storage errors; keep empty cart
      });
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
      if (existing) {
        return prev.map(i => (i.productId === item.productId && i.color === item.color && i.size === item.size)
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setCart(prev => prev.filter(i => {
      const sameProduct = i.productId === productId;
      const sameVariant = (i.color === color) && (i.size === size);
      // If color/size provided, remove only that variant; otherwise remove all items with productId
      return color || size ? !(sameProduct && sameVariant) : !sameProduct;
    }));
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (productId: string, quantity: number, color?: string, size?: string) => {
    setCart(prev => prev.map(i => {
      const match = i.productId === productId && (!color && !size ? true : (i.color === color && i.size === size));
      return match ? { ...i, quantity } : i;
    }));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
