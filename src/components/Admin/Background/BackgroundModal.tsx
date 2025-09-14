import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Background {
  _id: string;
  name: string;
  type: 'color' | 'gradient' | 'pattern';
  value: string;
  isActive: boolean;
}

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Background>) => Promise<void>;
  background?: Background | null;
}

export function BackgroundModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  background 
}: BackgroundModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'color' as const,
    value: '',
    isActive: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (background) {
      setFormData({
        name: background.name,
        type: background.type,
        value: background.value,
        isActive: background.isActive
      });
    } else {
      setFormData({
        name: '',
        type: 'color',
        value: '',
        isActive: false
      });
    }
  }, [background]);

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
              {background ? 'Edit Background' : 'Add Background'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter background name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'color' | 'gradient' | 'pattern'
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="color">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="pattern">Pattern</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'color' ? 'Color' : 
                 formData.type === 'gradient' ? 'Gradient CSS' : 'Pattern URL'}
              </label>
              {formData.type === 'color' ? (
                <input
                  type="color"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full h-12 p-1 border border-gray-300 rounded-lg"
                />
              ) : (
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={formData.type === 'gradient' 
                    ? 'linear-gradient(to right, #4f46e5, #7c3aed)'
                    : 'https://example.com/pattern.png'
                  }
                />
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Background
              </label>
            </div>

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
                {loading ? 'Saving...' : background ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}