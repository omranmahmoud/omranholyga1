import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { FilterBar } from './FilterBar';
import { Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { convertPrice } from '../../utils/currency';
import api from '../../services/api';
import { withFallback } from '../../utils/images';
import { toast } from 'react-hot-toast';
import { useStore } from '../../context/StoreContext';

interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  reviews: any[];
  category: Category | string;
  originalPrice?: number;
  discount?: string;
  isNew?: boolean;
  colors: { name: string; images: string[] }[];
  sizes: { name: string }[];
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const categoriesFromUrl = searchParams.get('categories');
  const isNewFromUrl = searchParams.get('isNew');
  const topRatedFromUrl = searchParams.get('topRated');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { currency } = useCurrency();
  const [convertedProducts, setConvertedProducts] = useState<Product[]>([]);
  const { settings } = useStore();
  const gridStyle = settings?.productGridStyle || 'standard';

  // ...existing code...

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (error) {
        // Error handling is done in individual fetch functions
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryFromUrl, categoriesFromUrl, isNewFromUrl, topRatedFromUrl]);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Convert prices whenever products or currency changes
  // All products are stored in USD, convert to selected currency
  useEffect(() => {
    const convertPrices = async () => {
      try {
        const converted = await Promise.all(
          products.map(async (product) => ({
            ...product,
            price: await convertPrice(product.price, 'USD', currency),
            originalPrice: product.originalPrice 
              ? await convertPrice(product.originalPrice, 'USD', currency)
              : undefined
          }))
        );
        setConvertedProducts(converted);
      } catch (error) {
        console.error('Error converting prices:', error);
        setConvertedProducts(products); // Fallback to original prices
      }
    };

    convertPrices();
  }, [products, currency]);

  const fetchProducts = async () => {
    try {
      setError(null);
      const params: any = {};
  if (isNewFromUrl === 'true') params.isNew = true;
      if (categoryFromUrl && categoryFromUrl !== 'all') params.category = categoryFromUrl;
      if (categoriesFromUrl) params.categories = categoriesFromUrl;
  if (topRatedFromUrl === 'true') params.minRating = 4;
      const response = await api.getWithRetry('/products', { params } as any);
      setProducts(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
  const response = await api.getWithRetry('/categories');
      const activeCategories = response.data
        .filter((cat: Category) => cat.isActive)
        .sort((a: Category, b: Category) => a.name.localeCompare(b.name));
      setCategories(activeCategories);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const getCategoryId = (product: Product): string => {
    if (typeof product.category === 'string') {
      return product.category;
    }
    return product.category._id;
  };


  const filterProducts = (product: Product) => {
    if (selectedCategory !== 'all' && getCategoryId(product) !== selectedCategory) {
      return false;
    }

    if (selectedFilters.length > 0) {
      const hasSize = selectedFilters.some(filter => 
        product.sizes.some(size => size.name === filter)
      );
      
      const hasColor = selectedFilters.some(filter => 
        product.colors.some(color => color.name === filter)
      );

      const hasPriceRange = selectedFilters.some(filter => {
        const price = product.price;
        switch (filter) {
          case 'under-50': return price < 50;
          case '50-100': return price >= 50 && price <= 100;
          case '100-200': return price >= 100 && price <= 200;
          case '200-500': return price >= 200 && price <= 500;
          case 'over-500': return price > 500;
          default: return false;
        }
      });

      return hasSize || hasColor || hasPriceRange;
    }

    return true;
  };

  const filteredProducts = convertedProducts.filter(filterProducts);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        {error}
      </div>
    );
  }

  return (
    <section className="py-8 lg:py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our Collection
          </h1>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our curated selection of premium fashion pieces, crafted with quality and style in mind.
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 px-4 py-3 rounded-lg text-gray-700 font-medium"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <FilterBar
            categories={categories.map(cat => ({
              id: cat._id,
              name: cat.name
            }))}
            selectedCategory={selectedCategory}
            selectedFilters={selectedFilters}
            onCategoryChange={setSelectedCategory}
            onFilterChange={setSelectedFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
          
          <div className="flex-1">
            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              <div
                className={
                  gridStyle === 'list'
                    ? 'space-y-4'
                    : gridStyle === 'compact'
                      ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3 md:gap-4'
                      : gridStyle === 'masonry'
                        ? 'columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]'
                        : gridStyle === 'wide'
                          ? 'grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6'
                          : gridStyle === 'gallery'
                            ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3'
                            : gridStyle === 'carousel'
                              ? 'overflow-x-auto flex gap-4 pb-2 snap-x snap-mandatory'
                              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8'
                }
              >
                {filteredProducts.map((product) => {
                  // Use first image from first color, fallback to placeholder
                  const firstColorImage = product.colors && product.colors.length > 0 && product.colors[0].images && product.colors[0].images.length > 0
                    ? withFallback(product.colors[0].images[0])
                    : '/placeholder-image.jpg';
                  const card = (
                    <ProductCard
                      key={product._id}
                      product={{
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: firstColorImage,
                        rating: product.rating,
                        reviews: product.reviews.length,
                        originalPrice: product.originalPrice,
                        discount: product.discount ? `-${product.discount}%` : undefined,
                        isNew: product.isNew
                      }}
                      layoutVariant={gridStyle as any}
                    />
                  );
                  if (gridStyle === 'list') {
                    return (
                      <div key={product._id} className="p-4 bg-white border border-gray-100 rounded-lg flex gap-4 hover:shadow-sm transition-shadow">
                        <div className="w-24 aspect-square overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
                          <img src={firstColorImage} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{product.isNew ? 'New Arrival' : 'Product'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                            )}
                            <span className="text-sm font-semibold text-indigo-600">${product.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (gridStyle === 'masonry') {
                    return (
                      <div key={product._id} className="mb-4 break-inside-avoid">
                        {card}
                      </div>
                    );
                  }
                  if (gridStyle === 'carousel') {
                    return (
                      <div key={product._id} className="snap-start min-w-[220px] w-[220px] flex-shrink-0">
                        {card}
                      </div>
                    );
                  }
                  return card;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}