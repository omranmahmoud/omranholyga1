import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { convertPrice, formatPrice } from '../utils/currency';
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
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { currency } = useCurrency();
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const convertedPrice = await convertPrice(product.price, 'USD', currency);
    addToCart({
      id: product.id,
      name: product.name,
      price: convertedPrice,
      image: product.image
    });
    toast.success('Added to cart');
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const convertedPrice = await convertPrice(product.price, 'USD', currency);
    if (isFavorite) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: convertedPrice,
        image: product.image
      });
      toast.success('Added to wishlist');
    }
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group relative cursor-pointer theme-font"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] theme-border-radius overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Quick Actions */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleWishlist}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isFavorite 
                ? 'bg-rose-100 text-rose-600' 
                : 'theme-background-bg/90 backdrop-blur-sm hover:theme-background-bg theme-text'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges */}
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

        {/* Add to Cart Button */}
        <div className={`absolute inset-x-4 bottom-4 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <button
            onClick={handleAddToCart}
            className="w-full py-3 theme-background-bg/90 backdrop-blur-sm hover:theme-background-bg theme-text theme-button-radius font-medium transition-colors flex items-center justify-center gap-2 group"
          >
            <ShoppingBag className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium theme-text">
              {product.rating}
            </span>
          </div>
          <span className="text-sm theme-text opacity-70">
            ({product.reviews} reviews)
          </span>
        </div>

        <h3 className="font-medium theme-text group-hover:theme-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold theme-primary">
            {formatPrice(product.price, currency)}
          </span>
          {product.originalPrice && (
            <span className="text-sm theme-text opacity-60 line-through">
              {formatPrice(product.originalPrice, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}