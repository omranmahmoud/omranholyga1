import React, { useState } from 'react';
import { ShoppingCart, Heart, Check } from 'lucide-react';

export function ProductActions() {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 2000);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleAddToCart}
        className="w-full bg-indigo-600 text-white py-4 px-8 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-75 disabled:hover:transform-none"
        disabled={isAddingToCart}
      >
        {isAddingToCart ? (
          <>
            <Check className="w-5 h-5 animate-bounce" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Add to Cart - $299.00
          </>
        )}
      </button>

      <button
        onClick={toggleFavorite}
        className={`group w-full py-4 px-8 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
          isFavorite
            ? 'bg-pink-50 text-pink-600'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
        }`}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
            isFavorite
              ? 'fill-pink-600 stroke-pink-600'
              : 'group-hover:fill-gray-200 group-hover:stroke-gray-700'
          }`}
        />
        <span className="text-sm">
          {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
        </span>
      </button>
    </div>
  );
}