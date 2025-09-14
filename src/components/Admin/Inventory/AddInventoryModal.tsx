import React, { useState, useEffect } from 'react';
interface Warehouse {
  _id: string;
  name: string;
}
import { X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

interface Size {
  name: string;
  stock: number;
}

interface Color {
  name: string;
  code: string;
  sizes?: Size[];
}

interface Product {
  _id: string;
  name: string;
  colors: Color[];
}

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function AddInventoryModal({ isOpen, onClose, onSubmit }: AddInventoryModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    size: '',
    color: '',
    quantity: 0,
    location: 'Main Warehouse',
    lowStockThreshold: 5
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.getWithRetry('/products');
        setProducts(response.data);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };
    const fetchWarehouses = async () => {
      try {
        const response = await api.getWithRetry('/warehouses');
        setWarehouses(response.data);
        if (response.data.length > 0) {
          setWarehouseId(response.data[0]._id);
        }
      } catch (error) {
        toast.error('Failed to fetch warehouses');
      }
    };
    if (isOpen) {
      fetchProducts();
      fetchWarehouses();
    }
  }, [isOpen]);

  const selectedProduct = products.find(p => p._id === formData.product);

  // Extract all unique sizes from all colors for the selected product
  const allSizes = selectedProduct && Array.isArray(selectedProduct.colors)
    ? Array.from(
        new Set(
          selectedProduct.colors
            .flatMap(color => Array.isArray(color.sizes) ? color.sizes.map(size => size.name) : [])
        )
      ).map(name => ({ name }))
    : [];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product) {
      toast.error('Please select a product');
      return;
    }

    if (!formData.size || !formData.color) {
      toast.error('Size and color are required');
      return;
    }

    if (!warehouseId) {
      toast.error('Warehouse is required');
      return;
    }

    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    if (formData.lowStockThreshold < 1) {
      toast.error('Low stock threshold must be at least 1');
      return;
    }

    setLoading(true);
    try {
      // Ensure we're sending the product ID correctly and all required fields
      const payload = {
        product: formData.product, // Product ID string
        size: formData.size.trim(),
        color: formData.color.trim(),
        quantity: parseInt(formData.quantity.toString()) || 0,
        location: formData.location.trim(),
        lowStockThreshold: parseInt(formData.lowStockThreshold.toString()) || 5,
        warehouse: warehouseId
      };

      console.log('Submitting inventory payload:', payload);
      
      await onSubmit(payload);
      setFormData({
        product: '',
        size: '',
        color: '',
        quantity: 0,
        location: 'Main Warehouse',
        lowStockThreshold: 5
      });
      onClose();
    } catch (error: any) {
      console.error('Error submitting inventory:', error);
      toast.error(error.message || 'Failed to add inventory');
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
            <h3 className="text-xl font-semibold text-gray-900">Add Inventory</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredProducts.map((product) => {
                  // Extract all unique sizes for this product
                  const productSizes = Array.isArray(product.colors)
                    ? Array.from(
                        new Set(
                          product.colors
                            .flatMap(color => Array.isArray(color.sizes) ? color.sizes.map(size => size.name) : [])
                        )
                      )
                    : [];
                  return (
                    <label
                      key={product._id}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                        formData.product === product._id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="product"
                        value={product._id}
                        checked={formData.product === product._id}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          product: e.target.value,
                          size: '',
                          color: ''
                        }))}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {productSizes.length} sizes • {(Array.isArray(product.colors) ? product.colors.length : 0)} colors
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedProduct && (
              <>
                {/* Size and Color Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Size</option>
                      {allSizes.map((size) => (
                        <option key={size.name} value={size.name}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Color</option>
                      {(Array.isArray(selectedProduct.colors) ? selectedProduct.colors : []).map((color) => (
                        <option key={color.name} value={color.name}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        quantity: parseInt(e.target.value) 
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        lowStockThreshold: parseInt(e.target.value) 
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {warehouses.map(wh => (
                      <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.product}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Inventory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}