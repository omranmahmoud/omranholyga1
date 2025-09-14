import React, { useState } from 'react';
import { Save, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FooterSocialLinksProps {
  settings: any;
  onUpdate: (data: any) => Promise<void>;
}

export function FooterSocialLinks({ settings, onUpdate }: FooterSocialLinksProps) {
  const [formData, setFormData] = useState({
    socialLinks: {
      facebook: settings?.socialLinks?.facebook || '',
      twitter: settings?.socialLinks?.twitter || '',
      instagram: settings?.socialLinks?.instagram || '',
      youtube: settings?.socialLinks?.youtube || ''
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate(formData);
      toast.success('Social links updated successfully');
    } catch (error) {
      toast.error('Failed to update social links');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facebook
          </label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.socialLinks.facebook}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, facebook: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter Facebook URL"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Twitter
          </label>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.socialLinks.twitter}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, twitter: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter Twitter URL"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instagram
          </label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.socialLinks.instagram}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, instagram: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter Instagram URL"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube
          </label>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.socialLinks.youtube}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, youtube: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter YouTube URL"
            />
          </div>
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
