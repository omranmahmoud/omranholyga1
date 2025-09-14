import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  color?: string;
  size?: string;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<boolean>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart items from localStorage on initial render
    const savedItems = localStorage.getItem('cartItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  }, [items]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const addToCart = async (newItem: Omit<CartItem, 'quantity'>): Promise<boolean> => {
    try {
      // Check stock availability
      const response = await api.get(`/products/${newItem.id}`);
      const product = response.data;

      const existingItem = items.find(item => item.id === newItem.id);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const requestedQuantity = currentQuantityInCart + 1;

      // Check if we have enough stock
      if (product.stock < requestedQuantity) {
        toast.error(`Only ${product.stock} items available in stock`);
        return false;
      }

      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.id === newItem.id);

        if (existingItem) {
          return currentItems.map(item =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        return [...currentItems, { ...newItem, quantity: 1 }];
      });

      return true;
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to add item to cart');
      return false;
    }
  };

  const removeFromCart = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const updateQuantity = async (id: string, quantity: number): Promise<boolean> => {
    if (quantity < 1) return false;

    try {
      // Check stock availability
      const response = await api.get(`/products/${id}`);
      const product = response.data;

      if (product.stock < quantity) {
        toast.error(`Only ${product.stock} items available in stock`);
        return false;
      }

      setItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );

      return true;
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to update quantity');
      return false;
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}