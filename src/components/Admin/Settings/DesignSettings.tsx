import React, { useState } from 'react';
import { Save, Palette, Type, Layout, Smartphone, Monitor, Eye } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { LogoSettings } from './LogoSettings';
import { toast } from 'react-hot-toast';

export function DesignSettings() {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('colors');
  
  const [formData, setFormData] = useState({
    // Design settings
    primaryColor: settings?.primaryColor || '#4F46E5',
    secondaryColor: settings?.secondaryColor || '#10B981',
    accentColor: settings?.accentColor || '#F59E0B',
    textColor: settings?.textColor || '#1F2937',
    backgroundColor: settings?.backgroundColor || '#FFFFFF',
    fontFamily: settings?.fontFamily || 'Inter',
    borderRadius: settings?.borderRadius || 'medium',
    buttonStyle: settings?.buttonStyle || 'rounded',
    
    // Layout settings
    headerLayout: settings?.headerLayout || 'modern',
    footerStyle: settings?.footerStyle || 'detailed',
    productCardStyle: settings?.productCardStyle || 'modern',
  productGridStyle: settings?.productGridStyle || 'standard',
    
    // Contact info
    phone: settings?.phone || '',
    address: settings?.address || '',
    
    // Social media
    socialLinks: {
      facebook: settings?.socialLinks?.facebook || '',
      twitter: settings?.socialLinks?.twitter || '',
      instagram: settings?.socialLinks?.instagram || '',
      youtube: settings?.socialLinks?.youtube || '',
      linkedin: settings?.socialLinks?.linkedin || '',
      tiktok: settings?.socialLinks?.tiktok || '',
    },
    
    // SEO settings
    siteTitle: settings?.siteTitle || '',
    siteDescription: settings?.siteDescription || '',
    keywords: settings?.keywords?.join(', ') || '',
  });

  const sections = [
    { id: 'colors', label: 'Colors & Brand', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'layout', label: 'Layout & Style', icon: Layout },
    { id: 'contact', label: 'Contact Info', icon: Smartphone },
    { id: 'social', label: 'Social Media', icon: Monitor },
    { id: 'seo', label: 'SEO Settings', icon: Eye },
  ];

  const colorPresets = [
    { name: 'Blue Ocean', primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
    { name: 'Purple Dreams', primary: '#8B5CF6', secondary: '#EC4899', accent: '#F97316' },
    { name: 'Forest Green', primary: '#059669', secondary: '#0D9488', accent: '#F59E0B' },
    { name: 'Sunset Orange', primary: '#EA580C', secondary: '#DC2626', accent: '#7C3AED' },
    { name: 'Dark Mode', primary: '#6366F1', secondary: '#8B5CF6', accent: '#F59E0B' },
  ];

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display', 
    'Poppins', 'Lato', 'Source Sans Pro', 'Raleway', 'Nunito'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const radiusMap: Record<string,string> = {
        none: '0px',
        small: '4px',
        medium: '8px',
        large: '12px',
        xl: '16px'
      };
      const dataToUpdate = {
        ...formData,
        borderRadius: radiusMap[formData.borderRadius] || formData.borderRadius,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
      };
      
      await updateSettings(dataToUpdate);
      toast.success('Design settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update design settings');
    } finally {
      setLoading(false);
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const renderColorSection = () => (
    <div className="space-y-6">
      {/* Logo Section */}
      <LogoSettings compact />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Color Palette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="#4F46E5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="#10B981"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="#F59E0B"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Color Presets</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {colorPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyColorPreset(preset)}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex gap-1 mb-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }} />
              </div>
              <span className="text-xs text-gray-600">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.textColor}
              onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.textColor}
              onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="#1F2937"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.backgroundColor}
              onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Typography</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select
              value={formData.fontFamily}
              onChange={(e) => setFormData(prev => ({ ...prev, fontFamily: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {fontOptions.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
            <select
              value={formData.borderRadius}
              onChange={(e) => setFormData(prev => ({ ...prev, borderRadius: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">None (0px)</option>
              <option value="small">Small (4px)</option>
              <option value="medium">Medium (8px)</option>
              <option value="large">Large (12px)</option>
              <option value="xl">Extra Large (16px)</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Button Style</label>
          <div className="grid grid-cols-3 gap-3">
            {(['rounded', 'square', 'pill'] as const).map(style => (
              <label key={style} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="buttonStyle"
                  value={style}
                  checked={formData.buttonStyle === style}
                  onChange={(e) => setFormData(prev => ({ ...prev, buttonStyle: e.target.value as any }))}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 capitalize">{style}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
        <div style={{ fontFamily: formData.fontFamily }}>
          <h5 className="text-lg font-semibold mb-2" style={{ color: formData.textColor }}>
            Sample Heading
          </h5>
          <p className="text-sm mb-3" style={{ color: formData.textColor }}>
            This is how your text will look with the selected font family and colors.
          </p>
          <button
            className={`px-4 py-2 text-white ${
              formData.buttonStyle === 'pill' ? 'rounded-full' :
              formData.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
            }`}
            style={{ backgroundColor: formData.primaryColor }}
          >
            Sample Button
          </button>
        </div>
      </div>
    </div>
  );

  const renderLayoutSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Layout & Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Header Layout</label>
            <div className="space-y-2">
              {(['classic', 'modern', 'minimal'] as const).map(layout => (
                <label key={layout} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="headerLayout"
                    value={layout}
                    checked={formData.headerLayout === layout}
                    onChange={(e) => setFormData(prev => ({ ...prev, headerLayout: e.target.value as any }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{layout}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Footer Style</label>
            <div className="space-y-2">
              {(['simple', 'detailed', 'newsletter'] as const).map(style => (
                <label key={style} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="footerStyle"
                    value={style}
                    checked={formData.footerStyle === style}
                    onChange={(e) => setFormData(prev => ({ ...prev, footerStyle: e.target.value as any }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{style}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Product Card Style</label>
            <div className="space-y-2">
              {(['modern', 'classic', 'minimal'] as const).map(style => (
                <label key={style} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="productCardStyle"
                    value={style}
                    checked={formData.productCardStyle === style}
                    onChange={(e) => setFormData(prev => ({ ...prev, productCardStyle: e.target.value as any }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{style}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Product Grid Style</label>
            <div className="space-y-2">
              {(['standard', 'compact', 'masonry', 'list', 'wide', 'gallery', 'carousel'] as const).map(style => (
                <label key={style} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="productGridStyle"
                    value={style}
                    checked={formData.productGridStyle === style}
                    onChange={(e) => setFormData(prev => ({ ...prev, productGridStyle: e.target.value as any }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{style}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="123 Fashion Street, NY 10001"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSocialSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.socialLinks).map(([platform, url]) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, [platform]: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={`https://${platform}.com/yourstore`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSEOSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
            <input
              type="text"
              value={formData.siteTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, siteTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Store Name - Quality Fashion"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
            <textarea
              value={formData.siteDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, siteDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe your store and what you offer..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="fashion, clothing, style, women, men"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'colors': return renderColorSection();
      case 'typography': return renderTypographySection();
      case 'layout': return renderLayoutSection();
      case 'contact': return renderContactSection();
      case 'social': return renderSocialSection();
      case 'seo': return renderSEOSection();
      default: return renderColorSection();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderCurrentSection()}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
