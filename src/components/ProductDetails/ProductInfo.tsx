// no default React import needed with react-jsx runtime
import { useStore } from '../../context/StoreContext';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';

interface Color {
  name: string;
  code: string;
}

interface Size {
  name: string;
  stock: number;
}

interface ProductInfoProps {
  product: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    colors: Color[];
    sizes: Size[];
    rating: number;
    reviews: any[];
    isNew?: boolean;
  };
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  isInWishlist: boolean;
}

export function ProductInfo({
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onAddToCart,
  onAddToWishlist,
  isInWishlist
}: ProductInfoProps) {
  const { currency } = useCurrency();
  const { settings } = useStore();

  return (
    <div className="space-y-6">
      {/* Badges */}
      <div className="flex gap-2">
        {product.isNew && (
          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
            New
          </span>
        )}
        {product.originalPrice && (
          <span className="px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">
            Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      {/* Title and Rating */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-gray-500">
            ({product.reviews.length} reviews)
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-indigo-600">
          {formatPrice(product.price, currency)}
        </span>
        {product.originalPrice && (
          <span className="text-xl text-gray-500 line-through">
            {formatPrice(product.originalPrice, currency)}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600">{product.description}</p>

      {/* Color Selection */}
      {product.colors.length > 0 && (
        <ColorSelector
          colors={product.colors}
          selectedColor={selectedColor}
          onColorChange={onColorChange}
        />
      )}

      {/* Size Selection */}
      {product.sizes.length > 0 && (
        <SizeSelector
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSizeChange={onSizeChange}
        />
      )}

      {/* Actions */}
      <div className="space-y-4 pt-6">
        <button
          onClick={onAddToCart}
          className="w-full text-white py-4 rounded-full font-semibold transition-colors hover:opacity-90 flex items-center justify-center gap-2 group"
          style={{ backgroundColor: settings?.addToCartBgColor || '#4f46e5' }}
        >
          <ShoppingBag className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          Add to Cart
        </button>

        <button
          onClick={onAddToWishlist}
          className={`w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors ${
            isInWishlist
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
          {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
      </div>
    </div>
  );
}