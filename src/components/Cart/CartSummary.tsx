import { } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';

interface CartSummaryProps {
  subtotal: number;
  onCheckout?: () => void;
}

export function CartSummary({ subtotal, onCheckout }: CartSummaryProps) {
  const { currency } = useCurrency();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;
  const navigate = useNavigate();

  return (
    <div className="border-t bg-gray-50 px-6 py-6">
      <div className="space-y-4">
        <div className="flex justify-between text-base text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, currency)}</span>
        </div>

  {/* Coupons are now applied at checkout */}

        <div className="flex justify-between text-base text-gray-600">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
        </div>

        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>

        <button 
          onClick={() => {
            if (onCheckout) onCheckout();
            // delay navigation slightly to allow drawer closing animation
            requestAnimationFrame(() => navigate('/checkout'));
          }}
          className="w-full bg-indigo-600 text-white py-4 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 group"
        >
          <span>Checkout</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Secure checkout</span>
        </div>
      </div>
    </div>
  );
}