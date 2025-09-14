// no default React import needed with react-jsx runtime
import { useStore } from '../../context/StoreContext';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';

export function UserWishlist() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { settings } = useStore();

  const handleAddToCart = (item: any) => {
    addToCart(item);
    removeFromWishlist(item.id);
    toast.success('Added to cart');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          Save items for later and keep track of products you love.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Wishlist is Empty</h3>
          <p className="text-gray-500">Save items you love to your wishlist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-4">
              <div className="aspect-square rounded-lg overflow-hidden mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-indigo-600 font-medium mt-1">${item.price.toFixed(2)}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 text-white px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: settings?.addToCartBgColor || '#4f46e5' }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}