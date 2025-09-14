import { useState } from 'react';
import { 
  Settings, Code, Smartphone, Monitor, Tablet, Zap, 
  Palette, Type, Download, Upload, RotateCcw, Copy
} from 'lucide-react';

interface PageBuilderSettings {
  globalAnimations: boolean;
  animationDuration: number;
  responsiveBreakpoints: {
    tablet: number;
    mobile: number;
  };
  seoSettings: {
    enableAutoSEO: boolean;
    generateMetaTags: boolean;
  };
  performanceSettings: {
    lazyLoading: boolean;
    imageOptimization: boolean;
    cacheComponents: boolean;
  };
  customCSS: string;
}

export function AdvancedPageBuilderSettings() {
  const [settings, setSettings] = useState<PageBuilderSettings>({
    globalAnimations: true,
    animationDuration: 600,
    responsiveBreakpoints: {
      tablet: 768,
      mobile: 480
    },
    seoSettings: {
      enableAutoSEO: true,
      generateMetaTags: true
    },
    performanceSettings: {
      lazyLoading: true,
      imageOptimization: true,
      cacheComponents: true
    },
    customCSS: ''
  });

  const [activeTab, setActiveTab] = useState<'responsive' | 'animations' | 'seo' | 'performance' | 'custom'>('responsive');

  const updateSettings = (key: keyof PageBuilderSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSettings = (parent: keyof PageBuilderSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] as any), [key]: value }
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Advanced Page Builder Settings</h3>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'responsive', label: 'Responsive', icon: Monitor },
            { id: 'animations', label: 'Animations', icon: Zap },
            { id: 'seo', label: 'SEO', icon: Code },
            { id: 'performance', label: 'Performance', icon: RotateCcw },
            { id: 'custom', label: 'Custom CSS', icon: Palette }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {/* Responsive Settings */}
        {activeTab === 'responsive' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Responsive Breakpoints</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <Monitor className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">Desktop</div>
                      <div className="text-xs text-gray-500">1024px+</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <Tablet className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tablet</label>
                      <input
                        type="number"
                        value={settings.responsiveBreakpoints.tablet}
                        onChange={(e) => updateNestedSettings('responsiveBreakpoints', 'tablet', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="text-xs text-gray-500 mt-1">{settings.responsiveBreakpoints.tablet}px - 1023px</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input
                        type="number"
                        value={settings.responsiveBreakpoints.mobile}
                        onChange={(e) => updateNestedSettings('responsiveBreakpoints', 'mobile', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="text-xs text-gray-500 mt-1">0px - {settings.responsiveBreakpoints.mobile - 1}px</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Device-Specific Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Auto-hide elements on mobile</label>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Responsive images</label>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animation Settings */}
        {activeTab === 'animations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Global Animations</h4>
                <p className="text-sm text-gray-500">Enable animations across all page sections</p>
              </div>
              <button 
                onClick={() => updateSettings('globalAnimations', !settings.globalAnimations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.globalAnimations ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.globalAnimations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.globalAnimations && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Animation Duration: {settings.animationDuration}ms
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="2000"
                    step="100"
                    value={settings.animationDuration}
                    onChange={(e) => updateSettings('animationDuration', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>200ms</span>
                    <span>2000ms</span>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Animation Presets</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Fade In', value: 'fadeIn' },
                      { name: 'Slide Up', value: 'slideUp' },
                      { name: 'Slide Down', value: 'slideDown' },
                      { name: 'Zoom In', value: 'zoomIn' },
                      { name: 'Bounce', value: 'bounce' },
                      { name: 'Flip', value: 'flip' }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-gray-500">Preview animation</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SEO Settings */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto SEO Optimization</h4>
                <p className="text-sm text-gray-500">Automatically optimize page elements for search engines</p>
              </div>
              <button 
                onClick={() => updateNestedSettings('seoSettings', 'enableAutoSEO', !settings.seoSettings.enableAutoSEO)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.seoSettings.enableAutoSEO ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.seoSettings.enableAutoSEO ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Generate Meta Tags</h4>
                <p className="text-sm text-gray-500">Auto-generate meta descriptions and titles</p>
              </div>
              <button 
                onClick={() => updateNestedSettings('seoSettings', 'generateMetaTags', !settings.seoSettings.generateMetaTags)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.seoSettings.generateMetaTags ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.seoSettings.generateMetaTags ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="border-t pt-6">
              <h5 className="font-medium text-gray-900 mb-3">SEO Analysis</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-green-800">Page Load Speed</span>
                  <span className="text-sm font-medium text-green-800">Excellent</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm text-yellow-800">Image Alt Tags</span>
                  <span className="text-sm font-medium text-yellow-800">Good</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-800">Mobile Friendly</span>
                  <span className="text-sm font-medium text-blue-800">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Settings */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Lazy Loading</h4>
                <p className="text-sm text-gray-500">Load images and components only when needed</p>
              </div>
              <button 
                onClick={() => updateNestedSettings('performanceSettings', 'lazyLoading', !settings.performanceSettings.lazyLoading)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.performanceSettings.lazyLoading ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.performanceSettings.lazyLoading ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Image Optimization</h4>
                <p className="text-sm text-gray-500">Automatically compress and optimize images</p>
              </div>
              <button 
                onClick={() => updateNestedSettings('performanceSettings', 'imageOptimization', !settings.performanceSettings.imageOptimization)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.performanceSettings.imageOptimization ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.performanceSettings.imageOptimization ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Cache Components</h4>
                <p className="text-sm text-gray-500">Cache frequently used components for faster loading</p>
              </div>
              <button 
                onClick={() => updateNestedSettings('performanceSettings', 'cacheComponents', !settings.performanceSettings.cacheComponents)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.performanceSettings.cacheComponents ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.performanceSettings.cacheComponents ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="border-t pt-6">
              <h5 className="font-medium text-gray-900 mb-3">Performance Metrics</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">1.2s</div>
                  <div className="text-sm text-gray-600">Page Load Time</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">98</div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Custom CSS</h4>
              <p className="text-sm text-gray-500 mb-4">Add custom CSS to override default styles</p>
              
              <div className="relative">
                <textarea
                  value={settings.customCSS}
                  onChange={(e) => updateSettings('customCSS', e.target.value)}
                  placeholder="/* Add your custom CSS here */
.my-custom-class {
  color: #6366f1;
  font-weight: bold;
}

/* Override component styles */
.hero-section {
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
}"
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
                <div className="absolute top-2 right-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Download className="w-4 h-4" />
                Export CSS
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Import CSS
              </button>
            </div>

            <div className="border-t pt-6">
              <h5 className="font-medium text-gray-900 mb-3">CSS Snippets Library</h5>
              <div className="space-y-2">
                {[
                  { name: 'Gradient Backgrounds', description: 'Beautiful gradient backgrounds for sections' },
                  { name: 'Hover Effects', description: 'Smooth hover animations for buttons and cards' },
                  { name: 'Typography Styles', description: 'Custom font styles and text effects' },
                  { name: 'Layout Utilities', description: 'Flexbox and grid layout helpers' }
                ].map((snippet, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{snippet.name}</div>
                    <div className="text-xs text-gray-500">{snippet.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
