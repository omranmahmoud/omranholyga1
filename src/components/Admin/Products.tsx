import { useState, useEffect } from 'react';
import { Plus, Trash2, Link, Info, Upload } from 'lucide-react';
import { AddProductModal } from './AddProductModal';
import { RelatedProductsModal } from './RelatedProductsModal';
import { ProductInfo } from './ProductInfo';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice, convertPrice } from '../../utils/currency';
import { validatePrice } from '../../utils/priceValidation';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { BulkUploadModal } from './BulkUploadModal';

interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: Category | string;
  stock: number;
  relatedProducts: Product[];
}

interface ConvertedProduct extends Omit<Product, 'price'> {
  price: number;
  displayPrice: string;
}

export function Products() {
  const [products, setProducts] = useState<ConvertedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ConvertedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (error) {
        // Error handling is done in individual fetch functions
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const convertProductPrices = async (products: Product[]): Promise<ConvertedProduct[]> => {
    return Promise.all(
      products.map(async (product) => {
        const { isValid, value } = validatePrice(product.price);
        const price = isValid ? value : 0;
        const convertedPrice = await convertPrice(price, 'USD', currency);
        
        return {
          ...product,
          price: convertedPrice,
          displayPrice: formatPrice(convertedPrice, currency)
        };
      })
    );
  };

  const fetchProducts = async () => {
    try {
  const response = await api.getWithRetry('/products');
      const convertedProducts = await convertProductPrices(response.data);
      setProducts(convertedProducts);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
  const response = await api.getWithRetry('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const getCategoryName = (product: ConvertedProduct): string => {
    if (typeof product.category === 'string') {
      const category = categories.find(cat => cat._id === product.category);
      return category?.name || 'Uncategorized';
    }
    return product.category.name;
  };

  const handleAddProduct = async (formData: any) => {
    try {
      const { isValid, value } = validatePrice(formData.price);
      if (!isValid) {
        toast.error('Invalid price value');
        throw new Error('Invalid price');
      }

      // Note: formData.price is expected already in USD from the modal
      const response = await api.postWithRetry('/products', {
        ...formData,
        price: value
      });

      const convertedProducts = await convertProductPrices([response.data]);
      setProducts(prev => [...prev, ...convertedProducts]);
      setIsAddModalOpen(false);
      toast.success('Product added successfully!');
      return response.data; // Return created product for modal
    } catch (error) {
      toast.error('Failed to add product');
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
  await api.deleteWithRetry(`/products/${id}`);
      setProducts(products.filter(product => product._id !== id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Related
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg overflow-hidden">
                      {product.colors && product.colors.length > 0 && product.colors[0].images && product.colors[0].images.length > 0 ? (
                        <img
                          src={product.colors[0].images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src="/placeholder-image.svg"
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.description.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.displayPrice}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {getCategoryName(product)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.stock}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsRelatedModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900"
                  >
                    <Link className="w-4 h-4" />
                    <span className="text-sm">
                      {product.relatedProducts?.length || 0} products
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsInfoModalOpen(true);
                      }}
                      className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="View product info"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="p-1 text-red-600 hover:text-red-900 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProduct}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onDone={fetchProducts}
      />

      {selectedProduct && (
        <>
          <RelatedProductsModal
            isOpen={isRelatedModalOpen}
            onClose={() => {
              setIsRelatedModalOpen(false);
              setSelectedProduct(null);
            }}
            productId={selectedProduct._id}
            currentRelatedProducts={selectedProduct.relatedProducts}
          />

          {isInfoModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsInfoModalOpen(false)} />
                <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full">
                  <ProductInfo 
                    productId={selectedProduct._id}
                    onUpdate={fetchProducts}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}