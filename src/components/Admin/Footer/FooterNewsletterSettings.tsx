import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FooterNewsletterSettingsProps {
  settings: any;
  onUpdate: (data: any) => Promise<void>;
}

export function FooterNewsletterSettings({ settings, onUpdate }: FooterNewsletterSettingsProps) {
  const [formData, setFormData] = useState({
    newsletter: {
      title: settings?.newsletter?.title || 'Join Our Newsletter',
      subtitle: settings?.newsletter?.subtitle || 'Subscribe to get special offers, free giveaways, and exclusive deals.',
      placeholder: settings?.newsletter?.placeholder || 'Enter your email',
      buttonText: settings?.newsletter?.buttonText || 'Subscribe'
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate(formData);
      toast.success('Newsletter settings updated successfully');
    } catch (error) {
      toast.error('Failed to update newsletter settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Newsletter Title
          </label>
          <input
            type="text"
            value={formData.newsletter.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              newsletter: { ...prev.newsletter, title: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter newsletter title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Newsletter Subtitle
          </label>
          <textarea
            value={formData.newsletter.subtitle}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              newsletter: { ...prev.newsletter, subtitle: e.target.value }
            }))}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter newsletter subtitle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Placeholder
          </label>
          <input
            type="text"
            value={formData.newsletter.placeholder}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              newsletter: { ...prev.newsletter, placeholder: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter email placeholder text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Text
          </label>
          <input
            type="text"
            value={formData.newsletter.buttonText}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              newsletter: { ...prev.newsletter, buttonText: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter button text"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
