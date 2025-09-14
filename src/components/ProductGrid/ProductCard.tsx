import React, { useState } from 'react';
import { withFallback } from '../../utils/images';
import { useStore } from '../../context/StoreContext';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    originalPrice?: number;
    discount?: string;
    isNew?: boolean;
    rating: number;
    reviews: number;
  };
  layoutVariant?: 'standard' | 'compact' | 'masonry' | 'list' | 'wide' | 'gallery' | 'carousel';
}

export function ProductCard({ product, layoutVariant = 'standard' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useStore();
  const cardStyle = settings?.productCardStyle || 'modern';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { currency } = useCurrency();
  // Use string ID consistently
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast.success('Added to cart');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your wishlist');
      return;
    }

    if (isFavorite) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      toast.success('Added to wishlist');
    }
  };

  const isGallery = layoutVariant === 'gallery';
  const isCompact = layoutVariant === 'compact';
  const isCarousel = layoutVariant === 'carousel';
  const isWide = layoutVariant === 'wide';
  const baseAspect = isGallery ? 'aspect-square' : isWide ? 'aspect-[4/5]' : 'aspect-[3/4]';
  const imgSrc = withFallback(product.image);

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className={`group relative cursor-pointer theme-font ${
        cardStyle === 'minimal' ? '' : 'transition-transform'
      } ${isCompact ? 'text-xs' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={`relative ${baseAspect} overflow-hidden bg-gray-100 ${
        cardStyle === 'classic' ? 'rounded-lg' : 'theme-border-radius'
      } ${isGallery ? 'ring-1 ring-gray-200 hover:ring-indigo-400' : ''}`}>
        <img
          src={imgSrc}
          alt={product.name}
          className={`w-full h-full object-cover ${
            cardStyle === 'minimal' ? '' : 'transform transition-transform duration-700 group-hover:scale-105'
          }`}
          onError={(e: any) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
        />
        
        {/* Overlay */}
        <div className={`absolute inset-0 ${
          isGallery ? 'bg-black/0 group-hover:bg-black/30' : 'bg-black/10'
        } ${isHovered && !isGallery ? 'opacity-100' : isGallery ? 'transition-colors' : 'opacity-0'} ${
          cardStyle === 'minimal' ? 'hidden' : 'transition-opacity duration-300'
        }`} />

        {/* Quick Actions (hidden in gallery for minimal look) */}
        {!isGallery && (
          <div className="absolute top-4 right-4">
          <button
            onClick={handleWishlist}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isFavorite 
                ? 'theme-primary-bg theme-background' 
                : 'theme-background-bg/90 backdrop-blur-sm hover:theme-background-bg theme-text'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          </div>
        )}

        {/* Badges (simplified in gallery) */}
        {!isGallery && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isNew && (
              <span className="px-3 py-1 theme-primary-bg theme-background text-xs font-medium rounded-full">
                New
              </span>
            )}
            {product.discount && (
              <span className="px-3 py-1 bg-rose-600 theme-background text-xs font-medium rounded-full">
                {product.discount}
              </span>
            )}
          </div>
        )}

        {/* Add to Cart Button (hidden in gallery, smaller in compact, always visible in carousel) */}
        {(isCarousel || (!isGallery && !isCompact)) && (
          <div className={`absolute inset-x-4 bottom-4 ${
            isHovered || isCarousel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } ${cardStyle === 'minimal' ? 'hidden' : 'transition-all duration-300'}`}>
            <button
              onClick={handleAddToCart}
              className={`w-full ${isCompact ? 'py-2 text-xs' : 'py-3'} theme-button-radius font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2`}
              style={{ backgroundColor: settings?.addToCartBgColor || '#4f46e5', color: '#ffffff' }}
            >
              <ShoppingBag className="w-4 h-4" />
              {isCompact ? 'Cart' : 'Add to Cart'}
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      {isGallery ? (
        <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 via-black/10 to-transparent">
          <h3 className="text-[11px] font-medium text-white line-clamp-1 mb-1">{product.name}</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-white">{formatPrice(product.price, currency)}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-200 line-through">{formatPrice(product.originalPrice, currency)}</span>
            )}
          </div>
        </div>
      ) : (
        <div className={`mt-3 space-y-1 ${cardStyle === 'minimal' ? 'text-center' : ''}`}>
          {!isCompact && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium theme-text">
                  {product.rating}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({product.reviews} reviews)
              </span>
            </div>
          )}
          <h3 className={`font-medium leading-tight theme-text ${cardStyle === 'minimal' ? '' : 'group-hover:theme-primary transition-colors'} ${isCompact ? 'text-xs line-clamp-2 min-h-[2.2rem]' : 'text-sm'}`}>
            {product.name}
          </h3>
             <div className="flex items-center gap-2">
            <span className={`font-semibold theme-primary ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {formatPrice(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className={`text-gray-500 line-through ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
                {formatPrice(product.originalPrice, currency)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}