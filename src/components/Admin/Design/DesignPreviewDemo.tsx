import { useState } from 'react';
import { 
  Play, Palette, Layout, Monitor, Smartphone, 
  Eye, Settings as SettingsIcon, Download
} from 'lucide-react';

export function DesignPreviewDemo() {
  const [activePreview, setActivePreview] = useState('theme');

  const previews = {
    theme: {
      title: 'Theme Designer',
      description: 'Choose from professional themes or create custom designs',
      features: ['6 Pre-made Themes', 'Custom Color Palettes', 'Typography Controls', 'Real-time Preview']
    },
    builder: {
      title: 'Visual Page Builder',
      description: 'Drag and drop to design your store layout',
      features: ['Drag & Drop Interface', 'Component Library', 'Mobile Responsive', 'Section Settings']
    },
    advanced: {
      title: 'Advanced Design',
      description: 'Professional-level customization options',
      features: ['Custom CSS', 'Animation Controls', 'Performance Optimization', 'SEO Integration']
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Design Studio Preview</h3>
          <p className="text-sm text-gray-500">See what's possible with our design tools</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Play className="w-4 h-4" />
          Start Designing
        </button>
      </div>

      {/* Preview Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActivePreview('theme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreview === 'theme' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          Themes
        </button>
        <button
          onClick={() => setActivePreview('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreview === 'builder' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layout className="w-4 h-4" />
          Builder
        </button>
        <button
          onClick={() => setActivePreview('advanced')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreview === 'advanced' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Advanced
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Info */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">
            {previews[activePreview as keyof typeof previews].title}
          </h4>
          <p className="text-gray-600 mb-4">
            {previews[activePreview as keyof typeof previews].description}
          </p>
          
          <div className="space-y-2">
            {previews[activePreview as keyof typeof previews].features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Mock Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-gray-500" />
            <Smartphone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Responsive Preview</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Mock Store Header */}
            <div className="bg-indigo-600 text-white p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Your Store</div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>

            {/* Mock Content */}
            <div className="p-3 space-y-3">
              <div className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-center justify-center text-sm text-gray-600">
                Hero Section
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square bg-gray-100 rounded"></div>
                ))}
              </div>
              
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
