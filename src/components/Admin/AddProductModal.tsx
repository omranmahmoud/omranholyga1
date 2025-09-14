import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { convertPrice } from '../../utils/currency';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { uploadVideoToCloudinary } from '../../services/cloudinary';
import { ColorSection } from './ColorSection';

interface Size {
  name: string;
  stock: number;
}

interface Color {
  name: string;
  code: string;
  images: string[];
  sizes: Size[];
}

interface Category {
  _id: string;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<any>;
}

export function AddProductModal({ isOpen, onClose, onSubmit }: AddProductModalProps) {
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isNew: false,
    isFeatured: false,
    video: '',
    colors: [] as Color[]
  });
  const [videoUploading, setVideoUploading] = useState(false);

  // Local component for video upload
  const VideoUpload: React.FC<{ onUploaded: (url: string) => void; uploading: boolean; setUploading: (b: boolean) => void; }> = ({ onUploaded, uploading, setUploading }) => {
    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!/^video\//.test(file.type)) {
        toast.error('Please select a valid video file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit example
        toast.error('Video must be less than 50MB');
        return;
      }
      try {
        setUploading(true);
        const url = await uploadVideoToCloudinary(file);
        onUploaded(url);
        toast.success('Video uploaded');
      } catch (err) {
        toast.error('Failed to upload video');
      } finally {
        setUploading(false);
      }
    };
    return (
      <div className="border border-dashed rounded p-4 flex flex-col items-center justify-center text-center gap-2">
        <p className="text-xs text-gray-600">Upload product showcase video (mp4, webm). Max 50MB.</p>
        <label className="px-3 py-1 bg-indigo-600 text-white rounded text-xs cursor-pointer hover:bg-indigo-700 disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Select Video'}
          <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={handleVideoChange} />
        </label>
      </div>
    );
  };
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newColor, setNewColor] = useState({ name: '', code: '#000000' });

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await api.getWithRetry('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleAddColor = () => {
    if (!newColor.name || !newColor.code) return;
    if (formData.colors.some(c => c.name === newColor.name)) {
      toast.error('Color already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [
        ...prev.colors,
        { name: newColor.name, code: newColor.code, images: [], sizes: [] }
      ]
    }));
    setNewColor({ name: '', code: '#000000' });
  };

  const handleUpdateColor = (idx: number, updated: Color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => (i === idx ? updated : c))
    }));
  };

  const handleRemoveColor = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.colors.length === 0) throw new Error('Add at least one color');
      if (!formData.colors.some(c => c.sizes.length > 0)) throw new Error('Add at least one size for a color');
      // Calculate total stock
      const totalStock = formData.colors.reduce((sum, c) => sum + c.sizes.reduce((s, sz) => s + sz.stock, 0), 0);
      // Convert price to USD
      const priceInUSD = await convertPrice(parseFloat(formData.price), currency, 'USD');
      const payload = {
        ...formData,
        price: priceInUSD,
        stock: totalStock,
        currency: 'USD',
        video: formData.video || undefined
      };
      console.log('Submitting product payload:', payload);
      await onSubmit(payload);
  setFormData({ name: '', description: '', price: '', category: '', isNew: false, isFeatured: false, video: '', colors: [] });
      onClose();
      toast.success('Product added successfully');
    } catch (error: any) {
      console.error('Product add error:', error?.response?.data || error);
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
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
            <h3 className="text-xl font-semibold text-gray-900">Add New Product</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ({currency})</label>
                  <input type="number" required min="0" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select required value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isNew} onChange={e => setFormData(prev => ({ ...prev, isNew: e.target.checked }))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Mark as New</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
              </div>
              {/* Optional Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Video (optional)</label>
                {formData.video ? (
                  <div className="space-y-2">
                    <video src={formData.video} controls className="w-full max-h-60 rounded" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, video: '' }))} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded">Remove</button>
                      <a href={formData.video} target="_blank" rel="noreferrer" className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">Open</a>
                    </div>
                  </div>
                ) : (
                  <VideoUpload onUploaded={(url) => setFormData(prev => ({ ...prev, video: url }))} uploading={videoUploading} setUploading={setVideoUploading} />
                )}
              </div>
            </div>
            {/* Color Management */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Colors, Images & Sizes</label>
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Color name" value={newColor.name} onChange={e => setNewColor(prev => ({ ...prev, name: e.target.value }))} className="px-2 py-1 border rounded text-sm" />
                <input type="color" value={newColor.code} onChange={e => setNewColor(prev => ({ ...prev, code: e.target.value }))} className="w-8 h-8 p-0 border rounded" />
                <button type="button" onClick={handleAddColor} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Add Color</button>
              </div>
              {formData.colors.map((color, idx) => (
                <ColorSection
                  key={color.name}
                  color={color}
                  onUpdate={updated => handleUpdateColor(idx, updated)}
                  onRemove={() => handleRemoveColor(idx)}
                />
              ))}
            </div>
            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Adding Product...' : 'Add Product'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
