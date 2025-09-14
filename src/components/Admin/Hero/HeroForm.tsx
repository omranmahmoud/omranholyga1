import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { HeroImageUpload } from './HeroImageUpload';
import { useStore } from '../../../context/store';
import type { Hero } from '../../../types/store';

interface HeroFormProps {
  hero: Hero | null;
}

export function HeroForm({ hero }: HeroFormProps) {
  const { updateHero } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hero) {
      setFormData({
        title: hero.title,
        subtitle: hero.subtitle,
        primaryButtonText: hero.primaryButtonText,
        secondaryButtonText: hero.secondaryButtonText,
        isActive: hero.isActive
      });
    }
  }, [hero]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateHero(formData);
    } catch (error) {
      // Error is handled by the store
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (imageUrl: string) => {
    try {
      await updateHero({ image: imageUrl });
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <HeroImageUpload
        currentImage={hero?.image}
        onImageUpload={handleImageUpload}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtitle
          </label>
          <textarea
            value={formData.subtitle}
            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Button Text
            </label>
            <input
              type="text"
              value={formData.primaryButtonText}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryButtonText: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Button Text
            </label>
            <input
              type="text"
              value={formData.secondaryButtonText}
              onChange={(e) => setFormData(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
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
            Active Hero Section
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
