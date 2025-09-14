import { useState, useEffect } from 'react';
import { Star, Shield, Truck, Edit2, Save, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface ProductInfoProps {
  productId: string;
  onUpdate?: () => void;
}

interface ProductDetails {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  rating: number;
  reviews: Array<{
    rating: number;
    comment: string;
  }>;
  isNew: boolean;
  video?: string;
}

export function ProductInfo({ productId, onUpdate }: ProductInfoProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<ProductDetails>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
  const response = await api.getWithRetry(`/products/${productId}`);
      setProduct(response.data);
      setEditedProduct(response.data);
    } catch (error) {
      toast.error('Failed to fetch product details');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
  await api.putWithRetry(`/products/${productId}`, editedProduct);
      setProduct({ ...product, ...editedProduct } as ProductDetails);
      setIsEditing(false);
      toast.success('Product updated successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (editedProduct.originalPrice && editedProduct.price) {
      return Math.round(
        ((editedProduct.originalPrice - editedProduct.price) / editedProduct.originalPrice) * 100
      );
    }
    return 0;
  };

  if (!product) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Product Information</h2>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProduct.name || ''}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-900">{product.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            {isEditing ? (
              <select
                value={editedProduct.category || ''}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {['Clothing', 'Shoes', 'Accessories', 'Bags', 'Jewelry'].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{product.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Price
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={editedProduct.price || ''}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-900">${product.price.toFixed(2)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={editedProduct.originalPrice || ''}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-900">
                {product.originalPrice ? `$${product.originalPrice.toFixed(2)}` : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editedProduct.stock || ''}
                onChange={(e) => setEditedProduct(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-900">{product.stock} units</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Product
            </label>
            {isEditing ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editedProduct.isNew || false}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, isNew: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Mark as new product</span>
              </label>
            ) : (
              <p className="text-gray-900">{product.isNew ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          {isEditing ? (
            <textarea
              rows={4}
              value={editedProduct.description || ''}
              onChange={(e) => setEditedProduct(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-600">{product.description}</p>
          )}
        </div>

        {/* Video */}
        <div className="pt-6 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Video</label>
          {product.video ? (
            <div className="space-y-2">
              <video src={product.video} controls className="w-full max-h-80 rounded" />
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedProduct.video || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, video: e.target.value }))}
                    placeholder="Video URL"
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setEditedProduct(prev => ({ ...prev, video: '' }))}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded"
                  >Remove</button>
                </div>
              )}
            </div>
          ) : isEditing ? (
            <input
              type="text"
              value={editedProduct.video || ''}
              onChange={(e) => setEditedProduct(prev => ({ ...prev, video: e.target.value }))}
              placeholder="Enter video URL"
              className="w-full px-3 py-2 border rounded"
            />
          ) : (
            <p className="text-gray-500 text-sm">No video added</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-2">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-lg font-semibold">{product.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-600">
              {product.reviews.length} reviews
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-lg font-semibold">100%</span>
            </div>
            <p className="text-sm text-gray-600">Authentic</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <Truck className="w-5 h-5" />
              <span className="text-lg font-semibold">Free</span>
            </div>
            <p className="text-sm text-gray-600">Shipping</p>
          </div>
        </div>

        {/* Calculated Values */}
        {editedProduct.originalPrice && editedProduct.price && (
          <div className="pt-6 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Calculated Discount:
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                {calculateDiscount()}% OFF
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}