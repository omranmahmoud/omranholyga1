import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Announcement {
  _id: string;
  text: string;
  url?: string;
  icon: string;
  iconImage?: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  isActive: boolean;
  platform?: string;
  description?: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Announcement>) => Promise<void>;
  announcement?: Announcement | null;
}

const AVAILABLE_ICONS = [
  'Truck',
  'Sparkles',
  'Clock',
  'CreditCard',
  'Star',
  'Gift',
  'Heart',
  'Tag'
];

const FONT_SIZES = [
  { value: 'xs', label: 'Extra Small' },
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' }
];

export function AnnouncementModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  announcement 
}: AnnouncementModalProps) {
  const [formData, setFormData] = useState({
    text: '',
  description: '',
  url: '',
    icon: 'Star',
    iconImage: '',
    fontSize: 'sm',
    textColor: '#FFFFFF',
    backgroundColor: '#4F46E5',
  isActive: true,
  platform: 'web'
  });
  const [loading, setLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (announcement) {
      setFormData({
        text: announcement.text,
  description: announcement.description || '',
  url: announcement.url || '',
  icon: announcement.icon,
  iconImage: announcement.iconImage || '',
  fontSize: announcement.fontSize || 'sm',
  textColor: announcement.textColor || '#FFFFFF',
  backgroundColor: announcement.backgroundColor || '#4F46E5',
  isActive: announcement.isActive,
  platform: announcement.platform || 'web'
      });
    } else {
      setFormData({
        text: '',
  description: '',
  url: '',
        icon: 'Star',
        iconImage: '',
        fontSize: 'sm',
        textColor: '#FFFFFF',
        backgroundColor: '#4F46E5',
  isActive: true,
  platform: 'web'
      });
    }
  }, [announcement]);

  const handleIconImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      // Try common token storage keys
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('authToken') ||
        '';
      const res = await fetch('/api/uploads/icons', {
        method: 'POST',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        body,
      });
      let data: any = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        const msg = data?.message || data?.error || `${res.status} Upload failed`;
        throw new Error(msg);
      }
      setFormData(prev => ({ ...prev, iconImage: data?.path || data?.url || '' }));
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingIcon(false);
    }
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
              {announcement ? 'Edit Announcement' : 'Add Announcement'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Text
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter announcement text"
              />
              <p className="mt-1 text-sm text-gray-500">
                {100 - formData.text.length} characters remaining
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                maxLength={160}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Additional line shown under main text"
                rows={2}
              />
              <p className="mt-1 text-xs text-gray-500">{160 - formData.description.length} characters remaining</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Optional Link URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com or /collections/sale"
                pattern={"^(https?:\\/\\/[^\\s]+|\\/[A-Za-z0-9_\\-\\/\\#?&=.%]+)$"}
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty for no link.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {AVAILABLE_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Will be ignored if a custom image is uploaded below.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Icon Image (optional)</label>
              {formData.iconImage && (
                <div className="flex items-center gap-3 mb-2">
                  <img src={formData.iconImage.startsWith('http') ? formData.iconImage : formData.iconImage} alt="Icon" className="w-8 h-8 object-contain rounded border" />
                  <button type="button" className="text-xs text-red-600" onClick={() => setFormData(p => ({ ...p, iconImage: '' }))}>Remove</button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconImageUpload}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {uploadingIcon && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <select
                value={formData.fontSize}
                onChange={(e) => setFormData(prev => ({ ...prev, fontSize: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="web">Web Only</option>
                <option value="mobile">Mobile Only</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="#FFFFFF"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="#4F46E5"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
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
                Active Announcement
              </label>
            </div>

            {/* Preview */}
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              {formData.url ? (
                <a
                  href="#preview"
                  className={`block text-${formData.fontSize} text-center underline-offset-2 hover:underline`}
                  style={{ color: formData.textColor }}
                  onClick={(e) => e.preventDefault()}
                >
                  {formData.text || 'Preview text'}
                </a>
              ) : (
                <p 
                  className={`text-${formData.fontSize} text-center`} 
                  style={{ color: formData.textColor }}
                >
                  {formData.text || 'Preview text'}
                </p>
              )}
              {formData.description && (
                <p className="mt-1 text-center text-xs" style={{ color: formData.textColor, opacity: 0.85 }}>
                  {formData.description}
                </p>
              )}
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
                {loading ? 'Saving...' : announcement ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}