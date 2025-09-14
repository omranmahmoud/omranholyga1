import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  isFeatured: boolean;
}

interface SelectProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => Promise<void>;
}

export function SelectProductModal({ isOpen, onClose, onSelect }: SelectProductModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // Filter out products that are already featured
      const availableProducts = response.data.filter((p: Product) => !p.isFeatured);
      setProducts(availableProducts);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (productId: string) => {
    setLoading(true);
    try {
      await onSelect(productId);
      onClose();
    } catch (error) {
      toast.error('Failed to add product to featured collection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Add to Featured Collection
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Product List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products available to add
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleSelect(product._id)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          ${product.price.toFixed(2)} • {product.category}
                        </p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}