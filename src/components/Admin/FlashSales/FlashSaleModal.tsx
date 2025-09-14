import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { resolveImageUrl, getPrimaryProductImage } from '../../../utils/imageUtils';
import { toast } from 'react-hot-toast';
import { FlashSaleSelectProductModal } from './FlashSaleSelectProductModal';

export interface FlashSaleFormValues {
  title: string;
  description?: string;
  startDate: string; // ISO string for input datetime-local
  endDate: string;
  items: FlashSaleItemForm[];
}

interface FlashSaleItemForm {
  product: string; // id
  name: string;
  basePrice: number;
  flashPrice: number | '';
  stockLimit?: number | '';
  perUserLimit?: number | '';
  images?: string[];
  _id?: string; // existing item id if editing (subdocument _id)
}

// Payload shape sent to API
interface FlashSaleSubmitPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  items: Array<{
    product: string;
    flashPrice: number;
    stockLimit?: number;
    perUserLimit?: number;
  }>;
}

interface FlashSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlashSaleSubmitPayload) => Promise<any> | any;
  flashSale?: any; // Existing flash sale (editing)
}

export function FlashSaleModal({ isOpen, onClose, onSubmit, flashSale }: FlashSaleModalProps) {
  const [form, setForm] = useState<FlashSaleFormValues>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    items: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const existingIds = new Set(form.items.map(i => i.product));

  useEffect(() => {
    if (flashSale) {
      setForm({
        title: flashSale.title || '',
        description: flashSale.description || '',
        startDate: flashSale.startDate ? flashSale.startDate.substring(0,16) : '',
        endDate: flashSale.endDate ? flashSale.endDate.substring(0,16) : '',
        items: (flashSale.items || []).map((it:any) => {
          let rawImgs = Array.isArray(it.product?.images) ? it.product.images : [];
            // fallback to color images if base images empty
            if ((!rawImgs.length) && Array.isArray(it.product?.colors) && it.product.colors[0]?.images?.length) {
              rawImgs = it.product.colors[0].images;
            }
          const normImgs = Array.isArray(rawImgs)
            ? rawImgs.map((im:any) => resolveImageUrl(im))
            : [];
          return {
            product: it.product?._id || it.product,
            name: it.product?.name || 'Unknown',
            basePrice: it.product?.price ?? 0,
            flashPrice: it.flashPrice,
            stockLimit: it.stockLimit ?? '',
            perUserLimit: it.perUserLimit ?? '',
            images: normImgs,
            _id: it._id
          };
        })
      });
    } else {
      setForm({ title: '', description: '', startDate: '', endDate: '', items: [] });
    }
  }, [flashSale, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateItems = () => {
    for (const item of form.items) {
      if (item.flashPrice === '' || typeof item.flashPrice !== 'number') return 'Flash price required for all items';
      if (item.flashPrice >= item.basePrice) return `Flash price must be less than base price for ${item.name}`;
      if (item.stockLimit !== '' && item.stockLimit !== undefined && Number(item.stockLimit) < 0) return 'Stock limit must be >= 0';
      if (item.perUserLimit !== '' && item.perUserLimit !== undefined && Number(item.perUserLimit) < 1) return 'Per-user limit must be >= 1';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('Title, Start and End date are required');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    const itemErr = validateItems();
    if (itemErr) { toast.error(itemErr); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: form.items.map(i => ({
          product: i.product,
          flashPrice: Number(i.flashPrice),
          stockLimit: i.stockLimit === '' ? undefined : Number(i.stockLimit),
          perUserLimit: i.perUserLimit === '' ? undefined : Number(i.perUserLimit)
        }))
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      // onSubmit handles toast
    } finally {
      setSubmitting(false);
    }
  };

  const addProduct = (p: any) => {
    // Normalize images from various possible shapes (string, object) + fallback to first color image
    let rawImages: any[] = Array.isArray(p.images) ? p.images : [];
    if ((!rawImages.length) && Array.isArray(p.colors) && p.colors[0]?.images?.length) {
      rawImages = p.colors[0].images;
    }
    const normalizedImages = rawImages
      .map(im => resolveImageUrl(im))
      .filter((v: string) => !!v && v !== '/placeholder-image.svg');

    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        product: p._id,
        name: p.name,
        basePrice: p.price,
        flashPrice: Math.max(0, Number((p.price * 0.9).toFixed(2))), // default 10% off
        stockLimit: '',
        perUserLimit: '',
        images: normalizedImages
      }]
    }));
  };

  const updateItemField = (index: number, field: keyof FlashSaleItemForm, value: any) => {
    setForm(prev => {
      const items = [...prev.items];
      // @ts-ignore
      items[index][field] = value;
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">
            {flashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
          </h2>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={2000}
              placeholder="Optional description for internal notes or landing text"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Date *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          {/* Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Products</label>
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-indigo-500 text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4" /> Add Products
              </button>
            </div>
            {form.items.length === 0 && (
              <div className="border border-dashed rounded-lg p-6 text-center text-gray-500 text-sm">
                No products added yet.
              </div>
            )}
            {form.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-left font-medium">Base</th>
                      <th className="px-3 py-2 text-left font-medium">Flash Price</th>
                      <th className="px-3 py-2 text-left font-medium">Stock Limit</th>
                      <th className="px-3 py-2 text-left font-medium">Per User</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {form.items.map((it, idx) => {
                      const invalid = typeof it.flashPrice === 'number' && it.flashPrice >= it.basePrice;
                      return (
                        <tr key={it.product} className={invalid ? 'bg-red-50/40' : ''}>
                          <td className="px-3 py-2 max-w-[180px]">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                <img
                                  src={it.images?.[0] ? resolveImageUrl(it.images[0]) : getPrimaryProductImage(it)}
                                  alt={it.name}
                                  title={it.images?.[0] || ''}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-medium text-gray-800 line-clamp-2">{it.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">${it.basePrice.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={it.flashPrice}
                              onChange={e => updateItemField(idx, 'flashPrice', e.target.value === '' ? '' : Number(e.target.value))}
                              className={`w-28 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 ${invalid ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-indigo-300'}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={it.stockLimit === '' || it.stockLimit === undefined ? '' : it.stockLimit}
                              onChange={e => updateItemField(idx, 'stockLimit', e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-24 rounded border px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              value={it.perUserLimit === '' || it.perUserLimit === undefined ? '' : it.perUserLimit}
                              onChange={e => updateItemField(idx, 'perUserLimit', e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-24 rounded border px-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="w-3.5 h-3.5" /> Flash price must be lower than base price.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (flashSale ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
        <FlashSaleSelectProductModal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          onSelect={(p) => { addProduct(p); }}
          existingIds={existingIds}
        />
      </div>
    </div>
  );
}
