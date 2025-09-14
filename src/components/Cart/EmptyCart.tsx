import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface EmptyCartProps {
  onClose: () => void;
}

export function EmptyCart({ onClose }: EmptyCartProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
        <ShoppingBag className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Your cart is empty
      </h3>
      <p className="text-gray-500 text-center mb-8">
        Looks like you haven't added any items to your cart yet.
      </p>
      <button
        onClick={onClose}
        className="bg-indigo-600 text-white py-3 px-8 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
      >
        Continue Shopping
      </button>
    </div>
  );
}