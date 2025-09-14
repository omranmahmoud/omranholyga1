import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { withFallback } from '../../utils/images';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  image?: string;
  resolvedImage?: string;
  slug: string;
  isActive: boolean;
  order: number;
}

export function CategorySlider({
  showHeader = true,
  heading,
  subheading,
  itemsToShow: itemsToShowProp,
  rows: rowsProp,
  columns: columnsProp,
  forceExactColumns,
}: {
  showHeader?: boolean;
  heading?: string;
  subheading?: string;
  itemsToShow?: number;
  rows?: number;
  columns?: number;
  forceExactColumns?: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // for legacy single-row mode
  const [currentPage, setCurrentPage] = useState(0); // for paginated grid mode
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const rows = rowsProp ?? 1;
  const columns = columnsProp ?? 5;
  const perPage = rows * columns;
  const itemsToShow = Math.min(itemsToShowProp ?? columns, categories.length);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getWithRetry('/categories');
      // Filter active categories and sort by order
      const activeCategories = response.data
        .filter((cat: Category) => cat.isActive)
        .sort((a: Category, b: Category) => a.order - b.order);
      setCategories(activeCategories);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (rows > 1) {
      const totalPages = Math.ceil(categories.length / perPage);
      setCurrentPage((p) => (p + 1) % Math.max(totalPages, 1));
    } else {
      setCurrentIndex((prev) => (prev + 1 >= categories.length ? 0 : prev + 1));
    }
  };

  const prevSlide = () => {
    if (rows > 1) {
      const totalPages = Math.ceil(categories.length / perPage);
      setCurrentPage((p) => (p - 1 < 0 ? Math.max(totalPages - 1, 0) : p - 1));
    } else {
      setCurrentIndex((prev) => (prev - 1 < 0 ? categories.length - 1 : prev - 1));
    }
  };

  const getVisibleCategories = () => {
    const visibleItems: Category[] = [];
    let count = 0;
    let index = currentIndex;

    if (rows > 1) {
      const start = currentPage * perPage;
      for (let i = start; i < Math.min(start + perPage, categories.length); i++) {
        visibleItems.push(categories[i]);
      }
      return visibleItems;
    } else {
      while (count < itemsToShow && count < categories.length) {
        visibleItems.push(categories[index]);
        count++;
        index = (index + 1) % categories.length;
      }
    }

    return visibleItems;
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/products?category=${category._id}`);
  };

  useEffect(() => {
    if (rows > 1) {
      if (categories.length <= perPage) return;
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    } else {
      if (categories.length <= itemsToShow) return;
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [rows, currentIndex, currentPage, categories.length, itemsToShow, perPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const showNavigation = rows > 1
    ? categories.length > perPage
    : categories.length > itemsToShow;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-12 lg:pr-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            {showHeader && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{heading || 'Shop by Category'}</h2>
                <p className="mt-2 text-gray-600">{subheading || 'Browse our curated collection of categories'}</p>
              </>
            )}
          </div>
          {showNavigation && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Previous category"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-full border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Next category"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          {rows > 1 ? (
            <div
              className={`grid gap-x-6 gap-y-8 justify-items-center ${forceExactColumns ? 'overflow-x-auto pb-2' : ''}`}
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, minWidth: forceExactColumns ? `${columns * 156}px` : undefined }}
            >
              {getVisibleCategories().map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className="text-center group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square w-full max-w-[128px] mx-auto rounded-[24px] overflow-hidden bg-white border border-gray-200 shadow-sm">
                      <img
                        src={withFallback(category.resolvedImage || category.image)}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg'; }}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div>
                      <h3 className="text-[13px] sm:text-sm font-medium text-gray-900">{category.name}</h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-between items-center gap-8">
              {getVisibleCategories().map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex-1 text-center group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square w-full max-w-[140px] mx-auto rounded-[28px] overflow-hidden bg-white border border-gray-200 shadow-sm">
                      <img
                        src={withFallback(category.resolvedImage || category.image)}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.jpg'; }}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">{category.name}</h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showNavigation && (
            <>
              {/* Gradient Overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
            </>
          )}
        </div>

        {/* Navigation Dots */}
        {showNavigation && (
          <div className="flex justify-center gap-2 mt-8">
            {rows > 1
              ? Array.from({ length: Math.ceil(categories.length / perPage) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentPage ? 'w-6 bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))
              : categories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-6 bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to category ${idx + 1}`}
                  />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}