// no React import needed with new JSX transform
import { useCart } from '../context/CartContext';
import { CartHeader } from '../components/Cart/CartPage/CartHeader';
import { CartList } from '../components/Cart/CartPage/CartList';
import { CartSummary } from '../components/Cart/CartSummary';
import { EmptyCart } from '../components/Cart/EmptyCart';

export function CartPage() {
  const { items } = useCart();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CartHeader />

        {items.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CartList />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 h-fit lg:sticky lg:top-24">
              <CartSummary subtotal={subtotal} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            <EmptyCart onClose={() => {}} />
          </div>
        )}

      </div>
    </div>
  );
}