import { useState, useRef } from 'react';
import { 
  Save, Eye, Monitor, Smartphone, Tablet, Move, 
  Type, Image as ImageIcon, Layout, Grid, Settings as SettingsIcon,
  Copy, Trash2, Plus, ChevronDown, ChevronUp, Layers, 
  Palette, Zap, Code, Download, Upload, RotateCcw,
  Star, Users, ShoppingBag, Heart, MessageCircle, Play
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';

interface PageSection {
  id: string;
  type: 'hero' | 'featured' | 'categories' | 'products' | 'text' | 'image' | 'testimonials' | 'banner' | 'countdown' | 'newsletter' | 'video' | 'social' | 'faq' | 'contact';
  title: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
  animations?: {
    entrance: string;
    duration: number;
    delay: number;
  };
  responsive?: {
    desktop: Record<string, any>;
    tablet: Record<string, any>;
    mobile: Record<string, any>;
  };
}

interface ComponentLibraryItem {
  type: PageSection['type'];
  title: string;
  icon: any;
  description: string;
  category: 'content' | 'commerce' | 'media' | 'engagement' | 'layout';
  premium?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  sections: PageSection[];
  preview: string;
  category: 'ecommerce' | 'fashion' | 'electronics' | 'minimal' | 'creative';
  premium?: boolean;
}

export function VisualStoreBuilder() {
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'components' | 'layers'>('components');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'content' | 'commerce' | 'media' | 'engagement' | 'layout'>('all');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [undoStack, setUndoStack] = useState<PageSection[][]>([]);
  const [redoStack, setRedoStack] = useState<PageSection[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sections, setSections] = useState<PageSection[]>([
    {
      id: 'hero',
      type: 'hero',
      title: 'Hero Banner',
      enabled: true,
      order: 0,
      settings: {
        showOverlay: true,
        overlayOpacity: 50,
        textAlignment: 'center'
      }
    },
    {
      id: 'featured',
      type: 'featured',
      title: 'Featured Products',
      enabled: true,
      order: 1,
      settings: {
        itemsPerRow: 4,
        showDescription: true,
        showPrice: true
      }
    },
    {
      id: 'categories',
      type: 'categories',
      title: 'Product Categories',
      enabled: true,
      order: 2,
      settings: {
        displayStyle: 'grid',
        itemsPerRow: 6,
        showNames: true
      }
    },
    {
      id: 'products',
      type: 'products',
      title: 'Product Grid',
      enabled: true,
      order: 3,
      settings: {
        itemsPerRow: 4,
        showFilters: true,
        sortOptions: true
      }
    }
  ]);

  const templates: Template[] = [
    {
      id: 'modern-store',
      name: 'Modern Store',
      description: 'Clean and modern layout perfect for fashion brands',
      preview: '/templates/modern-store.jpg',
      category: 'fashion',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Hero Banner',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 40, textAlignment: 'center' }
        },
        {
          id: 'featured',
          type: 'featured',
          title: 'Featured Products',
          enabled: true,
          order: 1,
          settings: { itemsPerRow: 4, showDescription: true, showPrice: true }
        },
        {
          id: 'categories',
          type: 'categories',
          title: 'Shop by Category',
          enabled: true,
          order: 2,
          settings: { displayStyle: 'carousel', itemsPerRow: 6, showNames: true }
        }
      ]
    },
    {
      id: 'minimal-shop',
      name: 'Minimal Shop',
      description: 'Simple and elegant design with focus on products',
      preview: '/templates/minimal-shop.jpg',
      category: 'minimal',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Simple Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: false, textAlignment: 'left' }
        },
        {
          id: 'products',
          type: 'products',
          title: 'All Products',
          enabled: true,
          order: 1,
          settings: { itemsPerRow: 3, showFilters: false, sortOptions: true }
        }
      ]
    },
    {
      id: 'content-rich',
      name: 'Content Rich',
      description: 'Perfect for brands with strong storytelling focus',
      preview: '/templates/content-rich.jpg',
      category: 'creative',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Brand Story Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 60, textAlignment: 'center' }
        },
        {
          id: 'text-1',
          type: 'text',
          title: 'About Section',
          enabled: true,
          order: 1,
          settings: { backgroundColor: '#F9FAFB', textSize: 'large' }
        },
        {
          id: 'featured',
          type: 'featured',
          title: 'Best Sellers',
          enabled: true,
          order: 2,
          settings: { itemsPerRow: 3, showDescription: true, showPrice: true }
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          title: 'Customer Reviews',
          enabled: true,
          order: 3,
          settings: { displayStyle: 'carousel', showRatings: true }
        }
      ]
    },
    {
      id: 'electronics-hub',
      name: 'Electronics Hub',
      description: 'Tech-focused layout with product specifications',
      preview: '/templates/electronics-hub.jpg',
      category: 'electronics',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Tech Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 30, textAlignment: 'left' }
        },
        {
          id: 'banner',
          type: 'banner',
          title: 'Special Offers',
          enabled: true,
          order: 1,
          settings: { backgroundColor: '#1F2937', textColor: '#FFFFFF' }
        },
        {
          id: 'categories',
          type: 'categories',
          title: 'Shop by Category',
          enabled: true,
          order: 2,
          settings: { displayStyle: 'grid', itemsPerRow: 4, showNames: true }
        },
        {
          id: 'featured',
          type: 'featured',
          title: 'Top Deals',
          enabled: true,
          order: 3,
          settings: { itemsPerRow: 4, showDescription: true, showPrice: true }
        }
      ]
    },
    {
      id: 'luxury-boutique',
      name: 'Luxury Boutique',
      description: 'Premium design for high-end fashion and luxury goods',
      preview: '/templates/luxury-boutique.jpg',
      category: 'fashion',
      premium: true,
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Luxury Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 50, textAlignment: 'center' }
        },
        {
          id: 'video',
          type: 'video',
          title: 'Brand Story Video',
          enabled: true,
          order: 1,
          settings: { autoplay: false, showControls: true }
        },
        {
          id: 'featured',
          type: 'featured',
          title: 'Exclusive Collection',
          enabled: true,
          order: 2,
          settings: { itemsPerRow: 3, showDescription: true, showPrice: true }
        },
        {
          id: 'newsletter',
          type: 'newsletter',
          title: 'VIP Newsletter',
          enabled: true,
          order: 3,
          settings: { backgroundColor: '#F3F4F6', showBenefits: true }
        }
      ]
    }
  ];
          title: 'Featured Products',
          enabled: true,
          order: 1,
          settings: { itemsPerRow: 4, showDescription: true, showPrice: true }
        },
        {
          id: 'categories',
          type: 'categories',
          title: 'Shop by Category',
          enabled: true,
          order: 2,
          settings: { displayStyle: 'carousel', itemsPerRow: 6, showNames: true }
        }
      ]
    },
    {
      id: 'minimal-shop',
      name: 'Minimal Shop',
      description: 'Simple and elegant design with focus on products',
      preview: '/templates/minimal-shop.jpg',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Simple Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: false, textAlignment: 'left' }
        },
        {
          id: 'products',
          type: 'products',
          title: 'All Products',
          enabled: true,
          order: 1,
          settings: { itemsPerRow: 3, showFilters: false, sortOptions: true }
        }
      ]
    },
    {
      id: 'content-rich',
      name: 'Content Rich',
      description: 'Perfect for brands with strong storytelling focus',
      preview: '/templates/content-rich.jpg',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          title: 'Brand Story Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 60, textAlignment: 'center' }
        },
        {
          id: 'text-1',
          type: 'text',
          title: 'About Section',
          enabled: true,
          order: 1,
          settings: { backgroundColor: '#F9FAFB', textSize: 'large' }
        },
        {
          id: 'featured',
          type: 'featured',
          title: 'Best Sellers',
          enabled: true,
          order: 2,
          settings: { itemsPerRow: 3, showDescription: true, showPrice: true }
        },
        {
          id: 'testimonials',
          type: 'testimonials',
          title: 'Customer Reviews',
          enabled: true,
          order: 3,
          settings: { displayStyle: 'carousel', showRatings: true }
        }
      ]
    }
  ];

  const availableComponents = [
    { type: 'hero', title: 'Hero Banner', icon: ImageIcon, description: 'Large banner with call-to-action' },
    { type: 'featured', title: 'Featured Products', icon: Grid, description: 'Showcase selected products' },
    { type: 'categories', title: 'Categories', icon: Layout, description: 'Product category navigation' },
    { type: 'products', title: 'Product Grid', icon: Grid, description: 'Display all products' },
    { type: 'text', title: 'Text Section', icon: Type, description: 'Rich text content area' },
    { type: 'image', title: 'Image Block', icon: ImageIcon, description: 'Custom image section' },
    { type: 'testimonials', title: 'Testimonials', icon: Type, description: 'Customer reviews and ratings' }
  ];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setSections(updatedItems);
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  const addSection = (type: PageSection['type']) => {
    const newSection: PageSection = {
      id: `${type}-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      enabled: true,
      order: sections.length,
      settings: {}
    };

    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const applyTemplate = (template: Template) => {
    setSections(template.sections);
    setSelectedSection(null);
    toast.success(`${template.name} template applied!`);
  };

  const handleSave = async () => {
    try {
      // Here you would save the page layout configuration
      // For now, we'll just show a success message
      toast.success('Page layout saved successfully!');
    } catch (error) {
      toast.error('Failed to save page layout');
    }
  };

  const renderSectionPreview = (section: PageSection) => {
    const baseClasses = "relative border-2 border-dashed rounded-lg p-4 transition-all";
    const enabledClasses = section.enabled 
      ? "border-indigo-300 bg-indigo-50" 
      : "border-gray-300 bg-gray-50 opacity-60";
    const selectedClasses = selectedSection === section.id 
      ? "ring-2 ring-indigo-500" 
      : "";

    return (
      <div 
        className={`${baseClasses} ${enabledClasses} ${selectedClasses}`}
        onClick={() => setSelectedSection(section.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{section.title}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(section.id);
              }}
              className={`text-xs px-2 py-1 rounded ${
                section.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {section.enabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSection(section.id);
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Section Preview */}
        <div className="bg-white rounded p-3 min-h-[80px] flex items-center justify-center">
          {section.type === 'hero' && (
            <div className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs">
              Hero Banner
            </div>
          )}
          {section.type === 'featured' && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          )}
          {section.type === 'categories' && (
            <div className="grid grid-cols-4 gap-1 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-6 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          )}
          {section.type === 'products' && (
            <div className="grid grid-cols-2 gap-2 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          )}
          {section.type === 'text' && (
            <div className="w-full space-y-1">
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-2/3"></div>
            </div>
          )}
          {section.type === 'image' && (
            <div className="w-full h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Image Block
            </div>
          )}
          {section.type === 'testimonials' && (
            <div className="w-full h-12 bg-yellow-100 rounded flex items-center justify-center text-xs text-yellow-800">
              ⭐ Customer Reviews
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionSettings = () => {
    const section = sections.find(s => s.id === selectedSection);
    if (!section) {
      return (
        <div className="text-center py-8 text-gray-500">
          Select a section to configure its settings
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{section.title}</h3>
          <button
            onClick={() => setSelectedSection(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={section.title}
              onChange={(e) => {
                setSections(sections.map(s => 
                  s.id === section.id ? { ...s, title: e.target.value } : s
                ));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Section
            </label>
            <button
              onClick={() => toggleSection(section.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                section.enabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  section.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Section-specific settings */}
          {section.type === 'featured' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items per Row
              </label>
              <select
                value={section.settings.itemsPerRow || 4}
                onChange={(e) => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { ...s, settings: { ...s.settings, itemsPerRow: parseInt(e.target.value) } }
                      : s
                  ));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="6">6</option>
              </select>
            </div>
          )}

          {section.type === 'hero' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Alignment
                </label>
                <select
                  value={section.settings.textAlignment || 'center'}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, settings: { ...s.settings, textAlignment: e.target.value } }
                        : s
                    ));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Show Overlay
                </label>
                <button
                  onClick={() => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, settings: { ...s.settings, showOverlay: !s.settings.showOverlay } }
                        : s
                    ));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    section.settings.showOverlay ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      section.settings.showOverlay ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Visual Store Builder</h1>
            <p className="text-sm text-gray-500">Design your store layout with drag & drop</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Device Preview Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveDevice('desktop')}
                className={`p-2 rounded ${activeDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDevice('tablet')}
                className={`p-2 rounded ${activeDevice === 'tablet' ? 'bg-white shadow-sm' : ''}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDevice('mobile')}
                className={`p-2 rounded ${activeDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPreviewMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Templates & Components */}
        {!isPreviewMode && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Templates */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Page Templates</h3>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                      <button
                        onClick={() => applyTemplate(template)}
                        className="w-full px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                      >
                        Apply Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Components */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Add Components</h3>
                <div className="space-y-2">
                  {availableComponents.map((component) => {
                    const Icon = component.icon;
                    return (
                      <button
                        key={component.type}
                        onClick={() => addSection(component.type as PageSection['type'])}
                        className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{component.title}</div>
                          <div className="text-xs text-gray-500">{component.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Page Builder */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div 
              className={`mx-auto bg-white rounded-lg shadow-lg transition-all duration-300 ${
                activeDevice === 'desktop' ? 'max-w-full' : 
                activeDevice === 'tablet' ? 'max-w-4xl' : 'max-w-sm'
              }`}
            >
              {isPreviewMode ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {sections
                      .filter(section => section.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <div key={section.id}>
                          {renderSectionPreview(section)}
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="page-sections">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="p-6 space-y-4"
                      >
                        {sections
                          .sort((a, b) => a.order - b.order)
                          .map((section, index) => (
                            <Draggable
                              key={section.id}
                              draggableId={section.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="relative"
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute -left-3 top-1/2 transform -translate-y-1/2 cursor-move text-gray-400 hover:text-gray-600"
                                  >
                                    <Move className="w-5 h-5" />
                                  </div>
                                  {renderSectionPreview(section)}
                                </div>
                              )}
                            </Draggable>
                          ))
                        }
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Right Sidebar - Section Settings */}
          {!isPreviewMode && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon className="w-5 h-5 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Section Settings</h3>
                </div>
                {renderSectionSettings()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
