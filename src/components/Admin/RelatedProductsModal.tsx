import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string | { _id?: string; name?: string };
}

interface RelatedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  currentRelatedProducts: Product[];
}

export function RelatedProductsModal({
  isOpen,
  onClose,
  productId,
  currentRelatedProducts
}: RelatedProductsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(currentRelatedProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
  const response = await api.getWithRetry('/products');
        // Filter out the current product and already selected products
        const filteredProducts = response.data.filter(
          (product: Product) => 
            product._id !== productId && 
            !selectedProducts.some(p => p._id === product._id)
        );
        setAvailableProducts(filteredProducts);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, productId, selectedProducts]);

  const handleSave = async () => {
    setLoading(true);
    try {
  await api.putWithRetry(`/products/${productId}/related`, {
        relatedProducts: selectedProducts.map(p => p._id)
      });
      toast.success('Related products updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update related products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product => {
    const query = searchQuery.toLowerCase();
    const categoryName = typeof product.category === 'string'
      ? product.category
      : (product.category?.name ?? '');
    return product.name.toLowerCase().includes(query) || categoryName.toLowerCase().includes(query);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Manage Related Products
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Selected Products */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Selected Products ({selectedProducts.length})
              </h4>
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProducts(prev => 
                        prev.filter(p => p._id !== product._id)
                      )}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Search and Add Products */}
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => setSelectedProducts(prev => [...prev, product])}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}