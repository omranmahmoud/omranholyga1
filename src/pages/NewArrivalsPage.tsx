import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductGrid/ProductCard';
import api from '../services/api';
import { withFallback } from '../utils/images';
import { toast } from 'react-hot-toast';

export function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
  const response = await api.getWithRetry('/products', {
          params: { isNew: true }
        });
        setProducts(response.data);
      } catch (error) {
        toast.error('Failed to fetch new arrivals');
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            New Arrivals
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover our latest collection of fresh styles and trends
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => {
            const cover = product?.colors?.[0]?.images?.[0] || product?.images?.[0];
            return (
            <ProductCard
              key={product._id}
              product={{
                id: product._id,
                name: product.name,
                price: product.price,
                image: withFallback(cover),
                rating: product.rating,
                reviews: product.reviews.length,
                isNew: true
              }}
            />
            );
          })}
        </div>
      </div>
    </div>
  );
}