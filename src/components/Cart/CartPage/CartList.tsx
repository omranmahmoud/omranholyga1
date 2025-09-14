import React from 'react';
import { CartItemCard } from './CartItemCard';
import { useCart } from '../../../context/CartContext';

export function CartList() {
  const { items } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {items.map((item) => (
        <CartItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}