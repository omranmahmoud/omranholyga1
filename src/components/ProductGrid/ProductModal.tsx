import { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Heart, ShoppingCart, Star } from 'lucide-react';
import { Reviews } from '../Reviews/Reviews';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    originalPrice?: string;
    rating: number;
    reviews: number;
    description?: string;
  };
  onAddToCart: () => void;
}

export function ProductModal({ isOpen, onClose, product, onAddToCart }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [reviews, setReviews] = useState([]);
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const { settings } = useStore();

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    }
  }, [isOpen, product.id]);

  const fetchReviews = async () => {
    try {
  const response = await api.getWithRetry(`/products/${product.id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      toast.error('Failed to fetch reviews');
  } finally {
  }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid md:grid-cols-2">
            {/* Product Image */}
            <div className="relative aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Product Details */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-900">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({product.reviews} reviews)
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-600">
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600">
                {product.description || 'A timeless piece crafted with premium materials and attention to detail. Perfect for any occasion.'}
              </p>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Select Size</span>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        size === selectedSize
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-600'
                          : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-6">
                <button
                  onClick={() => {
                    onAddToCart();
                    onClose();
                  }}
                  className="w-full text-white py-4 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 group"
                  style={{ backgroundColor: settings?.addToCartBgColor || '#4f46e5' }}
                >
                  <ShoppingCart className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                  Add to Cart
                </button>

                <button className="w-full bg-white text-gray-900 py-4 rounded-full font-semibold border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center gap-2 group">
                  <Heart className="w-5 h-5" />
                  Add to Wishlist
                </button>
              </div>

              {/* Reviews Section */}
              <div className="pt-8 border-t">
                <Reviews
                  productId={product.id}
                  reviews={reviews}
                  onReviewAdded={fetchReviews}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}