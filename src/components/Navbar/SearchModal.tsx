import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Debounced search function
  const searchProducts = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/products', {
          params: { search: searchQuery }
        });
        setResults(response.data);
      } catch (error) {
        toast.error('Failed to search products');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      searchProducts(query);
    } else {
      setResults([]);
    }
  }, [query, searchProducts]);

  const addToRecentSearches = (term: string) => {
    setRecentSearches(prev => {
      const newSearches = [term, ...prev.filter(s => s !== term)].slice(0, 5);
      return newSearches;
    });
  };

  const handleProductClick = (product: SearchResult) => {
    addToRecentSearches(product.name);
    navigate(`/product/${product._id}`);
    onClose();
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
    addToRecentSearches(term);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      
      <div className="fixed inset-x-0 top-0 bg-white shadow-lg transform transition-transform">
        <div className="max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative flex items-center p-4">
            <Search className="absolute left-6 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : query ? (
              results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => handleProductClick(result)}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={result.images && result.images.length > 0 ? result.images[0] : '/placeholder-image.svg'}
                          alt={result.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.category}</p>
                        <p className="text-sm font-medium text-indigo-600 mt-1">
                          ${result.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No results found for "{query}"</p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(term)}
                          className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-700 flex items-center gap-2"
                        >
                          {term}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Popular Categories
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Clothing', 'Shoes', 'Accessories', 'Bags', 'Jewelry'].map((category) => (
                      <button
                        key={category}
                        onClick={() => setQuery(category)}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}