import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';

interface CartItem {
  id: string;
  name: string;
  price: number;
  color?: string;
  size?: string;
  quantity: number;
  image: string;
}

interface CartItemsProps {
  items: CartItem[];
}

export function CartItems({ items }: CartItemsProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { currency } = useCurrency();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            {/* Product Image */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {item.name}
                  </h3>
                  {(item.color || item.size) && (
                    <p className="mt-1 text-sm text-gray-500">
                      {[item.color, item.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-base font-medium text-gray-900">
                  {formatPrice(item.price * item.quantity, currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}