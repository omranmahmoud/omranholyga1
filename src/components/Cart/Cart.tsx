// React import not required with new JSX transform
import { X } from 'lucide-react';
import { CartItems } from './CartItems';
import { CartSummary } from './CartSummary';
import { EmptyCart } from './EmptyCart';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';
// navigation handled inside CartSummary button

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { t } = useTranslation();
  const { items } = useCart();

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-white/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900">{t('common.cart')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] flex flex-col">
          {items.length > 0 ? (
            <>
              <CartItems items={items} />
              <CartSummary 
                subtotal={subtotal} 
                onCheckout={onClose}
              />
            </>
          ) : (
            <EmptyCart onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}