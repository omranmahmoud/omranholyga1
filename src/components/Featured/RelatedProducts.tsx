import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductCard } from '../ProductGrid/ProductCard';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  reviews: any[];
  isNew?: boolean;
}

export function RelatedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1;
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        // Filter featured products or use a dedicated API endpoint for related products
        setProducts(response.data.slice(0, 6)); // Limit to 6 products for 
      } catch (error) {
        toast.error('Failed to fetch related products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < products.length - itemsPerPage;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(Math.min(products.length - itemsPerPage, currentIndex + 1));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            You May Also Like
          </h2>
          <p className="mt-2 text-gray-600">
            Based on your preferences and shopping history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className={`p-2 rounded-full border ${
              canScrollLeft
                ? 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                : 'border-gray-100 text-gray-300 cursor-not-allowed'
            } transition-colors`}
            disabled={!canScrollLeft}
            aria-label="Previous products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className={`p-2 rounded-full border ${
              canScrollRight
                ? 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                : 'border-gray-100 text-gray-300 cursor-not-allowed'
            } transition-colors`}
            disabled={!canScrollRight}
            aria-label="Next products"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex gap-8 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="w-full min-w-[calc(100%/4-1.5rem)] sm:min-w-[calc(50%-1rem)] lg:min-w-[calc(25%-1.5rem)]"
              >
                <ProductCard
                  product={{
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    rating: product.rating,
                    reviews: product.reviews.length,
                    isNew: product.isNew
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Overlays */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        )}
      </div>
    </section>
  );
}