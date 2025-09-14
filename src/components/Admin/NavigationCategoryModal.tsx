import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface SubCategory {
  name: string;
  slug: string;
}

interface NavigationCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subCategories?: SubCategory[];
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

interface NavigationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<NavigationCategory>) => Promise<void>;
  category?: NavigationCategory | null;
}

export function NavigationCategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  category 
}: NavigationCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    isActive: true,
    subCategories: [] as SubCategory[]
  });
  const [newSubCategory, setNewSubCategory] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        subCategories: category.subCategories || []
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        isActive: true,
        subCategories: []
      });
    }
  }, [category]);

  // Fetch existing product categories to allow selecting as sub-categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        // Only keep active categories and map to minimal shape
        const opts: CategoryOption[] = (res.data || [])
          .filter((c: any) => c && (c.isActive ?? true))
          .map((c: any) => ({ _id: c._id, name: c.name, slug: c.slug, isActive: c.isActive }));
        setCategoryOptions(opts);
      } catch (e) {
        // Non-blocking; manual add still works
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleAddSubCategory = () => {
    if (!newSubCategory.name) return;

    const slug = generateSlug(newSubCategory.name);
    
    setFormData(prev => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        { name: newSubCategory.name, slug }
      ]
    }));
    
    setNewSubCategory({ name: '', slug: '' });
  };

  const handleAddFromExisting = () => {
    if (!selectedCategoryId) return;
    const found = categoryOptions.find(c => c._id === selectedCategoryId);
    if (!found) return;

    // Prevent duplicates by slug
    const exists = formData.subCategories.some(sc => sc.slug === found.slug);
    if (exists) {
      toast.error('Sub-category already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      subCategories: [
        ...prev.subCategories,
        { name: found.name, slug: found.slug }
      ]
    }));
    setSelectedCategoryId('');
  };

  const handleRemoveSubCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {category ? 'Edit Category' : 'Add Category'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter category name"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="category-slug"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Category
              </label>
            </div>

            {/* Sub Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sub Categories
              </label>
              
              <div className="space-y-4">
                {/* Add From Existing Category */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-500">Add from existing Category</div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a category…</option>
                      {categoryOptions
                        .filter(opt => !formData.subCategories.some(sc => sc.slug === opt.slug))
                        .map(opt => (
                          <option key={opt._id} value={opt._id}>
                            {opt.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddFromExisting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Add New Sub Category */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubCategory.name}
                    onChange={(e) => setNewSubCategory(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                    placeholder="Enter sub-category name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubCategory}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub Categories List */}
                <div className="space-y-2">
                  {formData.subCategories.map((sub, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubCategory(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : category ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}