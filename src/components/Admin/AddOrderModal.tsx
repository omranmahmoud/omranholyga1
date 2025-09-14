import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Search } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

interface OrderItem {
  product: string;
  quantity: number;
  name: string;
  price: number;
}

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
}

export function AddOrderModal({ isOpen, onClose, onSubmit }: AddOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
  email: '',
  mobile: '',
  secondaryMobile: ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  country: 'JO'
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const fetchProducts = async () => {
      try {
    const response = await api.getWithRetry('/products');
        setProducts(response.data);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const handleAddProduct = (product: Product) => {
    setSelectedProducts(prev => [
      ...prev,
      {
        product: product._id,
        quantity: 1,
        name: product.name,
        price: product.price
      }
    ]);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSelectedProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedProducts.length === 0) {
        throw new Error('Please add at least one product');
      }

      // Normalize and validate mobile numbers to match server schema
      const normalizePhone = (phone: string) => phone.trim().replace(/[\s\-()]/g, '');
      const mobileNormalized = normalizePhone(customerInfo.mobile);
      const secondaryMobileNormalized = customerInfo.secondaryMobile ? normalizePhone(customerInfo.secondaryMobile) : '';
      const phoneRegex = /^\+[0-9]{1,4}[0-9]{9,10}$/;
      if (!phoneRegex.test(mobileNormalized)) {
        throw new Error('Please enter a valid mobile in international format (e.g., +9627XXXXXXXX)');
      }

      const orderData = {
        items: selectedProducts,
        customerInfo: {
          ...customerInfo,
          mobile: mobileNormalized,
          secondaryMobile: secondaryMobileNormalized || undefined
        },
        shippingAddress,
        paymentMethod,
        totalAmount: calculateTotal()
      };

      await onSubmit(orderData);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create New Order</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+962712345678"
                    value={customerInfo.mobile}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use international format, e.g. +9627XXXXXXXX</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Mobile (optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+9627XXXXXXXX"
                    value={customerInfo.secondaryMobile}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, secondaryMobile: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    required
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="JO">Jordan (JO)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="KW">Kuwait (KW)</option>
                    <option value="QA">Qatar (QA)</option>
                    <option value="BH">Bahrain (BH)</option>
                    <option value="OM">Oman (OM)</option>
                    <option value="EG">Egypt (EG)</option>
                    <option value="IQ">Iraq (IQ)</option>
                    <option value="LB">Lebanon (LB)</option>
                    <option value="PS">Palestine (PS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Products</h4>
              
              {/* Product Search */}
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

              {/* Product List */}
              <div className="max-h-64 overflow-y-auto mb-4 border rounded-lg divide-y">
                {products
                  .filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !selectedProducts.some(item => item.product === product._id)
                  )
                  .map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-indigo-600" />
                    </button>
                  ))
                }
              </div>

              {/* Selected Products */}
              <div className="space-y-4">
                {selectedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h4>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 p-4 rounded-lg border ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex-1 p-4 rounded-lg border ${
                    paymentMethod === 'cod'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Cash on Delivery
                </button>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-lg font-semibold text-gray-900">
                Total: ${calculateTotal().toFixed(2)}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedProducts.length === 0}
                  className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}