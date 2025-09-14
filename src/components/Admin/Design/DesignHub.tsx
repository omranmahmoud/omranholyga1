import { useState, useEffect } from 'react';
import { 
  Palette, Brush, Layout, Eye, Settings as SettingsIcon, 
  HelpCircle, Download, Smartphone, Tablet, Save, X
} from 'lucide-react';
import { StoreThemeDesigner } from './StoreThemeDesigner';
import { VisualStoreBuilder } from './EnhancedVisualStoreBuilder';
import { ComponentManager } from './ComponentManager';
import { DesignSettings } from '../Settings/DesignSettings';
import { DesignTutorial } from './DesignTutorial';
import { usePageLayout } from '../../../context/PageLayoutContext';
import { toast } from 'react-hot-toast';

export function DesignHub() {
  const [activeTab, setActiveTab] = useState('theme-designer');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showComponentManager, setShowComponentManager] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { sections, saveLayout } = usePageLayout();
  
  // Keep track of preview windows
  const [previewWindows, setPreviewWindows] = useState<{ [key: string]: Window | null }>({
    store: null,
    mobile: null,
    tablet: null
  });

  // Close all preview windows
  const closeAllPreviews = () => {
    Object.values(previewWindows).forEach(window => {
      if (window && !window.closed) {
        window.close();
      }
    });
    setPreviewWindows({ store: null, mobile: null, tablet: null });
    toast.success('All preview windows closed');
  };

  useEffect(() => {
    // Show tutorial for first-time users
    const hasSeenTutorial = localStorage.getItem('design-tutorial-completed');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const tabs = [
    {
      id: 'theme-designer',
      name: 'Theme Designer',
      icon: Palette,
      description: 'Customize colors, fonts, and overall style',
      component: StoreThemeDesigner
    },
    {
      id: 'visual-builder',
      name: 'Page Builder',
      icon: Layout,
      description: 'Design your store layout with drag & drop',
      component: VisualStoreBuilder
    },
    {
      id: 'design-settings',
      name: 'Design Settings',
      icon: SettingsIcon,
      description: 'Advanced design configuration',
      component: DesignSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || StoreThemeDesigner;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Studio</h1>
              <p className="text-sm text-gray-500">
                Customize every aspect of your store's appearance and layout
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComponentManager(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
              >
                <Layout className="w-4 h-4" />
                Manage Components
              </button>
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors border ${
                  showQuickActions 
                    ? 'text-blue-700 bg-blue-50 border-blue-300' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Quick Actions
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Tutorial
              </button>
              <div className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live Preview Active
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <ActiveComponent />
      </div>

      {/* Quick Actions Floating Panel */}
      {showQuickActions && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900">Quick Actions</div>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close Quick Actions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        <div className="space-y-2">
          {/* Preview Store */}
          <button 
            onClick={() => {
              // Close existing store preview if open
              if (previewWindows.store && !previewWindows.store.closed) {
                previewWindows.store.close();
              }
              
              const newWindow = window.open('/', '_blank');
              setPreviewWindows(prev => ({ ...prev, store: newWindow }));
              toast.success('Store preview opened');
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
            title="Preview your store in a new tab"
          >
            <Eye className="w-4 h-4 text-gray-500" />
            Preview Store
          </button>

          {/* Mobile Preview */}
          <button 
            onClick={() => {
              // Close existing mobile preview if open
              if (previewWindows.mobile && !previewWindows.mobile.closed) {
                previewWindows.mobile.close();
              }
              
              const newWindow = window.open('/', '_blank', 'width=375,height=667,scrollbars=yes,resizable=yes');
              if (newWindow) {
                newWindow.document.title = 'Mobile Preview';
                setPreviewWindows(prev => ({ ...prev, mobile: newWindow }));
                toast.success('Mobile preview opened');
              } else {
                toast.error('Please allow popups to open mobile preview');
              }
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
            title="Preview your store on mobile size"
          >
            <Smartphone className="w-4 h-4 text-gray-500" />
            Mobile Preview
          </button>

          {/* Tablet Preview */}
          <button 
            onClick={() => {
              // Close existing tablet preview if open
              if (previewWindows.tablet && !previewWindows.tablet.closed) {
                previewWindows.tablet.close();
              }
              
              const newWindow = window.open('/', '_blank', 'width=768,height=1024,scrollbars=yes,resizable=yes');
              if (newWindow) {
                newWindow.document.title = 'Tablet Preview';
                setPreviewWindows(prev => ({ ...prev, tablet: newWindow }));
                toast.success('Tablet preview opened');
              } else {
                toast.error('Please allow popups to open tablet preview');
              }
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
            title="Preview your store on tablet size"
          >
            <Tablet className="w-4 h-4 text-gray-500" />
            Tablet Preview
          </button>

          {/* Save Layout */}
          <button 
            onClick={async () => {
              try {
                await saveLayout();
                toast.success('Layout saved successfully!');
              } catch (error) {
                toast.error('Failed to save layout');
                console.error('Save error:', error);
              }
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
            title="Save your current layout"
          >
            <Save className="w-4 h-4 text-gray-500" />
            Save Layout
          </button>

          {/* Export Theme */}
          <button 
            onClick={() => {
              try {
                // Get current layout data from context
                const layoutData = {
                  sections: sections,
                  theme: {
                    colors: {
                      primary: '#3B82F6',
                      secondary: '#6B7280',
                      accent: '#F59E0B',
                      background: '#FFFFFF',
                      text: '#1F2937'
                    },
                    fonts: {
                      heading: 'Inter',
                      body: 'Inter'
                    },
                    spacing: {
                      xs: '0.25rem',
                      sm: '0.5rem',
                      md: '1rem',
                      lg: '1.5rem',
                      xl: '2rem'
                    }
                  },
                  metadata: {
                    name: 'Custom Store Theme',
                    created: new Date().toISOString(),
                    version: '1.0',
                    componentsCount: sections.length,
                    enabledComponents: sections.filter(s => s.enabled).length
                  }
                };

                // Create and download the theme file
                const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `store-theme-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show success toast
                toast.success(`Theme exported! ${sections.length} components included.`);
              } catch (error) {
                toast.error('Failed to export theme. Please try again.');
                console.error('Export error:', error);
              }
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg transition-colors"
            title="Export your current theme configuration"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export Theme
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Close All Previews */}
          <button 
            onClick={closeAllPreviews}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors"
            title="Close all preview windows"
          >
            <X className="w-4 h-4" />
            Close All Previews
          </button>
        </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="fixed bottom-6 left-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Brush className="w-5 h-5" />
          <span className="font-medium">Design Pro Tips</span>
        </div>
        <div className="text-sm opacity-90">
          {activeTab === 'theme-designer' && "Use color presets for quick styling or create custom palettes that match your brand."}
          {activeTab === 'visual-builder' && "Drag sections to reorder them. Click any section to customize its settings."}
          {activeTab === 'design-settings' && "Advanced settings let you fine-tune typography, spacing, and layout details."}
        </div>
      </div>

      {/* Tutorial Modal */}
      <DesignTutorial 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Component Manager Modal */}
      <ComponentManager 
        isOpen={showComponentManager} 
        onClose={() => setShowComponentManager(false)} 
      />
    </div>
  );
}
