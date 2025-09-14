import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ProductCard } from '../ProductGrid/ProductCard';
import { withFallback } from '../../utils/images';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Link } from 'react-router-dom';

// Simple hook fallback if not existing
// (If there's already a window size hook, adjust import)
interface ProductLike {
  _id: string;
  name: string;
  price: number;
  rating: number;
  reviews: any[];
  colors?: { images?: string[] }[];
  images?: string[];
}

export function NewArrivalsSection({
  title = 'New Arrivals',
  subtitle = 'Fresh picks just landed',
  maxRows = 2,
  className = ''
}: {
  title?: string;
  subtitle?: string;
  maxRows?: number; // cap how many rows to ever show
  className?: string;
}) {
  const [products, setProducts] = useState<ProductLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();

  // Determine columns by breakpoint (tailwind-ish logic in JS for slicing only)
  let cols = 2; // base mobile
  if (width >= 640) cols = 3; // sm
  if (width >= 1024) cols = 4; // lg
  if (width >= 1536) cols = 5; // 2xl (optional)

  // How many total items to show based on rows * cols
  const rowsToShow = Math.min(maxRows,  width < 640 ? 2 : 2); // keep 2 rows for now; can customize more
  const visibleCount = rowsToShow * cols;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.getWithRetry('/products', { params: { isNew: true, limit: 40 } });
        if (active) setProducts(res.data || []);
      } catch (e) {
        // silent fail here; homepage shouldn't break
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const display = products.slice(0, visibleCount);

  if (loading && products.length === 0) {
    return (
      <section className={`py-10 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-pulse h-8 w-48 bg-gray-200 rounded" />
            <div className="animate-pulse h-6 w-24 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_,i)=>(
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] w-full bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!display.length) return null;

  return (
    <section className={`py-14 ${className}`}>      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <span>{title}</span>
              <span className="inline-flex animate-pulse rounded-full bg-indigo-600 text-white text-xs px-2 py-1 font-medium">New</span>
            </h2>
            {subtitle && <p className="text-gray-600 mt-2 text-sm sm:text-base">{subtitle}</p>}
          </div>
          <Link to="/new-arrivals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
        </div>

        <div className={`grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${cols===5?'2xl:grid-cols-5':''}`}>
          {display.map(p => {
            const cover = p?.colors?.[0]?.images?.[0] || p?.images?.[0];
            return (
              <ProductCard
                key={p._id}
                product={{
                  id: p._id,
                  name: p.name,
                  price: p.price,
                  image: withFallback(cover),
                  rating: p.rating || 0,
                  reviews: p.reviews?.length || 0,
                  isNew: true
                }}
                layoutVariant="standard"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
