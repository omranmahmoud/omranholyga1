import { useState, useRef } from 'react';
import { 
  Save, Eye, Monitor, Smartphone, Tablet, Move, 
  Type, Image as ImageIcon, Layout, Grid, Settings as SettingsIcon,
  Copy, Trash2, Plus, ChevronDown, ChevronUp, Layers, 
  Palette, Zap, Download, Upload, RotateCcw,
  Star, Users, ShoppingBag, MessageCircle, Play,
  Search, Filter, Clock, Mail, Share2, Calendar,
  MapPin, TrendingUp, Award, 
  BarChart3, User, Camera, Hash, 
  List, ArrowRight, Minus, Navigation,
  AlertCircle, Activity, MessageSquare, CheckCircle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import { usePageLayout, PageSection } from '../../../context/PageLayoutContext';

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
  const { sections, setSections, saveLayout } = usePageLayout();
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

  const templates: Template[] = [
    {
      id: 'modern-ecommerce',
      name: 'Modern E-commerce',
      description: 'Professional layout with modern design elements',
      preview: '/templates/modern-ecommerce.jpg',
      category: 'ecommerce',
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          title: 'Main Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 40, textAlignment: 'center' }
        },
        {
          id: 'banner-1',
          type: 'banner',
          title: 'Promotional Banner',
          enabled: true,
          order: 1,
          settings: { backgroundColor: '#EF4444', textColor: '#FFFFFF' }
        },
        {
          id: 'featured-1',
          type: 'featured',
          title: 'Featured Products',
          enabled: true,
          order: 2,
          settings: { itemsPerRow: 4, showDescription: true, showPrice: true }
        },
        {
          id: 'categories-1',
          type: 'categories',
          title: 'Shop by Category',
          enabled: true,
          order: 3,
          settings: { displayStyle: 'grid', itemsPerRow: 6, showNames: true }
        }
      ]
    },
    {
      id: 'fashion-boutique',
      name: 'Fashion Boutique',
      description: 'Elegant design perfect for fashion brands',
      preview: '/templates/fashion-boutique.jpg',
      category: 'fashion',
      sections: [
        {
          id: 'hero-2',
          type: 'hero',
          title: 'Fashion Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: true, overlayOpacity: 30, textAlignment: 'left' }
        },
        {
          id: 'video-1',
          type: 'video',
          title: 'Brand Story',
          enabled: true,
          order: 1,
          settings: { autoplay: false, showControls: true }
        },
        {
          id: 'featured-2',
          type: 'featured',
          title: 'New Collection',
          enabled: true,
          order: 2,
          settings: { itemsPerRow: 3, showDescription: true, showPrice: true }
        }
      ]
    },
    {
      id: 'minimal-store',
      name: 'Minimal Store',
      description: 'Clean and simple design focusing on products',
      preview: '/templates/minimal-store.jpg',
      category: 'minimal',
      sections: [
        {
          id: 'hero-3',
          type: 'hero',
          title: 'Simple Hero',
          enabled: true,
          order: 0,
          settings: { showOverlay: false, textAlignment: 'center' }
        },
        {
          id: 'products-1',
          type: 'products',
          title: 'All Products',
          enabled: true,
          order: 1,
          settings: { itemsPerRow: 4, showFilters: true, sortOptions: true }
        }
      ]
    }
  ];

  const componentLibrary: ComponentLibraryItem[] = [
    // Layout Components
    { type: 'hero', title: 'Hero Section', icon: ImageIcon, description: 'Large banner with call-to-action', category: 'layout' },
    { type: 'banner', title: 'Promotional Banner', icon: Star, description: 'Attention-grabbing announcement bar', category: 'layout' },
    { type: 'divider', title: 'Divider', icon: Minus, description: 'Visual section separator', category: 'layout' },
    { type: 'spacer', title: 'Spacer', icon: Move, description: 'Add vertical spacing', category: 'layout' },
    { type: 'breadcrumb', title: 'Breadcrumb', icon: Navigation, description: 'Navigation breadcrumb trail', category: 'layout' },
  { type: 'sliders', title: 'Homepage Sliders', icon: ImageIcon, description: 'Carousel or grid of homepage banners', category: 'layout' },
  { type: 'side-banners', title: 'Side Category Banners', icon: Grid, description: 'Left/Right side promotional banners', category: 'layout' },
  { type: 'carousel-with-side-banners', title: 'Carousel with Side Banners', icon: Layout, description: 'Center carousel with 3 category banners on each side', category: 'layout' },
  { type: 'new-arrivals', title: 'New Arrivals Grid', icon: Star, description: 'Latest products in responsive rows', category: 'layout' },
    
    // Commerce Components
    { type: 'featured', title: 'Featured Products', icon: ShoppingBag, description: 'Showcase selected products', category: 'commerce' },
    { type: 'categories', title: 'Product Categories', icon: Grid, description: 'Product category navigation', category: 'commerce' },
    { type: 'products', title: 'Product Grid', icon: Layout, description: 'Display all products with filters', category: 'commerce' },
    { type: 'countdown', title: 'Countdown Timer', icon: Clock, description: 'Create urgency with countdown', category: 'commerce' },
    { type: 'pricing', title: 'Pricing Table', icon: BarChart3, description: 'Product pricing comparison', category: 'commerce' },
    { type: 'brands', title: 'Brand Showcase', icon: Award, description: 'Display partner brands', category: 'commerce' },
    { type: 'comparison', title: 'Product Comparison', icon: Layout, description: 'Compare multiple products', category: 'commerce' },
    { type: 'reviews', title: 'Product Reviews', icon: Star, description: 'Customer product reviews', category: 'commerce' },
    
    // Content Components
    { type: 'text', title: 'Rich Text', icon: Type, description: 'Rich text content area', category: 'content' },
    { type: 'faq', title: 'FAQ Section', icon: MessageCircle, description: 'Frequently asked questions', category: 'content' },
    { type: 'testimonials', title: 'Testimonials', icon: Users, description: 'Customer reviews and ratings', category: 'content' },
    { type: 'blog', title: 'Blog Posts', icon: Type, description: 'Display latest blog articles', category: 'content' },
    { type: 'team', title: 'Team Members', icon: User, description: 'Show team member profiles', category: 'content' },
    { type: 'stats', title: 'Statistics', icon: TrendingUp, description: 'Display key numbers and metrics', category: 'content' },
    { type: 'features', title: 'Feature List', icon: CheckCircle, description: 'Highlight key features', category: 'content' },
    { type: 'timeline', title: 'Timeline', icon: Clock, description: 'Show chronological events', category: 'content' },
    { type: 'accordion', title: 'Accordion', icon: List, description: 'Collapsible content sections', category: 'content' },
    { type: 'tabs', title: 'Tab Content', icon: Hash, description: 'Organize content in tabs', category: 'content' },
    { type: 'alert', title: 'Alert Box', icon: AlertCircle, description: 'Important notifications', category: 'content' },
    { type: 'progress', title: 'Progress Bar', icon: Activity, description: 'Show completion progress', category: 'content' },
    
    // Media Components
    { type: 'image', title: 'Image Block', icon: ImageIcon, description: 'Custom image section', category: 'media' },
    { type: 'video', title: 'Video Player', icon: Play, description: 'Embedded video content', category: 'media', premium: true },
    { type: 'gallery', title: 'Image Gallery', icon: Camera, description: 'Photo gallery with lightbox', category: 'media' },
    { type: 'carousel', title: 'Image Carousel', icon: ImageIcon, description: 'Sliding image carousel', category: 'media' },
    
    // Engagement Components
    { type: 'newsletter', title: 'Newsletter Signup', icon: Mail, description: 'Email subscription form', category: 'engagement' },
    { type: 'social', title: 'Social Media', icon: Share2, description: 'Social media integration', category: 'engagement' },
    { type: 'contact', title: 'Contact Form', icon: MessageCircle, description: 'Customer contact form', category: 'engagement' },
    { type: 'search', title: 'Search Bar', icon: Search, description: 'Product search functionality', category: 'engagement' },
    { type: 'map', title: 'Location Map', icon: MapPin, description: 'Interactive location map', category: 'engagement' },
    { type: 'chat', title: 'Live Chat', icon: MessageSquare, description: 'Customer support chat', category: 'engagement', premium: true },
    { type: 'calendar', title: 'Event Calendar', icon: Calendar, description: 'Event scheduling calendar', category: 'engagement' },
    { type: 'cta', title: 'Call to Action', icon: ArrowRight, description: 'Prominent action button', category: 'engagement' }
  ];

  // Utility functions
  const saveToUndoStack = () => {
    setUndoStack(prev => [...prev.slice(-9), sections]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [sections, ...prev.slice(0, 9)]);
      setUndoStack(prev => prev.slice(0, -1));
      setSections(previousState);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, sections]);
      setRedoStack(prev => prev.slice(1));
      setSections(nextState);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    saveToUndoStack();
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setSections(updatedItems);
  };

  const toggleSection = (sectionId: string) => {
    saveToUndoStack();
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  const addSection = (type: PageSection['type']) => {
    saveToUndoStack();
    const newSection: PageSection = {
      id: `${type}-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      enabled: true,
      order: sections.length,
      settings: {},
      animations: {
        entrance: 'fadeIn',
        duration: 600,
        delay: 0
      }
    };

    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
    toast.success(`${newSection.title} added successfully!`);
  };

  const deleteSection = (sectionId: string) => {
    saveToUndoStack();
    setSections(sections.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
    toast.success('Section deleted');
  };

  const duplicateSection = (sectionId: string) => {
    saveToUndoStack();
    const sectionToDuplicate = sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicatedSection: PageSection = {
      ...sectionToDuplicate,
      id: `${sectionToDuplicate.type}-${Date.now()}`,
      title: `${sectionToDuplicate.title} Copy`,
      order: sectionToDuplicate.order + 1
    };

    const newSections = [...sections];
    newSections.splice(sectionToDuplicate.order + 1, 0, duplicatedSection);
    
    // Update order numbers
    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(reorderedSections);
    toast.success('Section duplicated');
  };

  const applyTemplate = (template: Template) => {
    saveToUndoStack();
    setSections(template.sections);
    setSelectedSection(null);
    toast.success(`${template.name} template applied!`);
  };

  const exportLayout = () => {
    const layoutData = {
      sections,
      metadata: {
        name: 'Custom Store Layout',
        created: new Date().toISOString(),
        version: '1.0'
      }
    };

    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'store-layout.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Layout exported successfully!');
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layoutData = JSON.parse(e.target?.result as string);
        if (layoutData.sections) {
          saveToUndoStack();
          setSections(layoutData.sections);
          setSelectedSection(null);
          toast.success('Layout imported successfully!');
        }
      } catch (error) {
        toast.error('Invalid layout file');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    try {
      // Save layout configuration to context and localStorage
      await saveLayout();
      toast.success('Page layout saved successfully! Changes are live on your store.');
    } catch (error) {
      toast.error('Failed to save page layout');
    }
  };

  const filteredComponents = componentLibrary.filter(component => {
    const matchesSearch = component.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || component.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const renderSectionPreview = (section: PageSection) => {
    const baseClasses = "relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer";
    const enabledClasses = section.enabled 
      ? "border-indigo-300 bg-indigo-50 hover:border-indigo-400" 
      : "border-gray-300 bg-gray-50 opacity-60";
    const selectedClasses = selectedSection === section.id 
      ? "ring-2 ring-indigo-500 border-indigo-500" 
      : "";

    return (
      <div 
        className={`${baseClasses} ${enabledClasses} ${selectedClasses}`}
        onClick={() => setSelectedSection(section.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{section.title}</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateSection(section.id);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Duplicate section"
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(section.id);
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                section.enabled 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {section.enabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSection(section.id);
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete section"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>
        
        {/* Enhanced Section Preview */}
        <div className="bg-white rounded p-3 min-h-[80px] flex items-center justify-center relative overflow-hidden">
          {section.type === 'hero' && (
            <div className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-medium">
              Hero Banner
            </div>
          )}
          {section.type === 'featured' && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                </div>
              ))}
            </div>
          )}
          {section.type === 'categories' && (
            <div className="grid grid-cols-4 gap-1 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <Grid className="w-3 h-3 text-gray-500" />
                </div>
              ))}
            </div>
          )}
          {section.type === 'products' && (
            <div className="grid grid-cols-2 gap-2 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded flex items-center justify-center">
                  <Layout className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          )}
          {section.type === 'sliders' && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {[1,2,3].map(i => (
                <div key={i} className="h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded" />
              ))}
            </div>
          )}
          {section.type === 'side-banners' && (
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="space-y-1">
                {[1,2].map(i => (<div key={i} className="h-6 bg-gray-200 rounded"></div>))}
              </div>
              <div className="space-y-1">
                {[1,2].map(i => (<div key={i} className="h-6 bg-gray-200 rounded"></div>))}
              </div>
            </div>
          )}
          {section.type === 'carousel-with-side-banners' && (
            <div className="grid grid-cols-12 gap-1 w-full">
              <div className="col-span-3 space-y-1">
                {[1,2,3].map(i => (<div key={i} className="h-3 bg-gray-200 rounded"></div>))}
              </div>
              <div className="col-span-6 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded"></div>
              <div className="col-span-3 space-y-1">
                {[1,2,3].map(i => (<div key={i} className="h-3 bg-gray-200 rounded"></div>))}
              </div>
            </div>
          )}
          {section.type === 'new-arrivals' && (
            <div className="grid grid-cols-4 gap-1 w-full">
              {[1,2,3,4].map(i => (<div key={i} className="h-8 bg-indigo-100 rounded"></div>))}
            </div>
          )}
          {section.type === 'text' && (
            <div className="w-full space-y-1">
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-2/3"></div>
            </div>
          )}
          {section.type === 'banner' && (
            <div className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded flex items-center justify-center text-white text-xs font-medium">
              Promotional Banner
            </div>
          )}
          {section.type === 'video' && (
            <div className="w-full h-12 bg-gray-800 rounded flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          )}
          {section.type === 'newsletter' && (
            <div className="w-full h-12 bg-blue-100 rounded flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
          )}
          {section.type === 'testimonials' && (
            <div className="w-full h-12 bg-yellow-100 rounded flex items-center justify-center text-xs text-yellow-800">
              <Star className="w-4 h-4 mr-1" />
              Customer Reviews
            </div>
          )}
          {section.type === 'countdown' && (
            <div className="w-full h-12 bg-orange-100 rounded flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          )}
          
          {/* Animation indicator */}
          {section.animations && (
            <div className="absolute top-1 right-1" title={`Animation: ${section.animations.entrance}`}>
              <Zap className="w-3 h-3 text-purple-500" />
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
          <Layout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a section to configure its settings</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{section.title}</h3>
          <button
            onClick={() => setSelectedSection(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Basic Settings */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        </div>

        {/* Advanced Settings Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Settings
          </button>
        </div>

        {/* Section-specific settings */}
        {section.type === 'featured' && (
          <div className="space-y-4">
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
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Show Descriptions
              </label>
              <button
                onClick={() => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { ...s, settings: { ...s.settings, showDescription: !s.settings.showDescription } }
                      : s
                  ));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  section.settings.showDescription ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    section.settings.showDescription ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
        {section.type === 'new-arrivals' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={section.settings.subtitle || ''}
                onChange={(e)=>{
                  setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, subtitle: e.target.value }}: s));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional subtitle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Rows
              </label>
              <select
                value={section.settings.maxRows || 2}
                onChange={(e)=>{
                  setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, maxRows: parseInt(e.target.value) }}: s));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
        )}

        {section.type === 'categories' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Style</label>
              <select
                value={section.settings.displayStyle || 'grid'}
                onChange={(e)=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, displayStyle: e.target.value } } : s))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="grid">Grid</option>
                <option value="slider">Slider</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items per Row (grid)</label>
              <select
                value={section.settings.itemsPerRow || 6}
                onChange={(e)=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, itemsPerRow: Number(e.target.value) } } : s))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="6">6</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Show Category Names</label>
              <button
                onClick={()=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, showNames: !s.settings.showNames } } : s))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.settings.showNames !== false ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.settings.showNames !== false ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            { (section.settings.displayStyle || 'grid') === 'slider' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slider Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={section.settings.sliderRows ?? 2}
                    onChange={(e)=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, sliderRows: Number(e.target.value) } } : s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Columns per Row</label>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    value={section.settings.sliderColumns ?? 9}
                    onChange={(e)=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, sliderColumns: Number(e.target.value) } } : s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            { (section.settings.displayStyle || 'grid') === 'slider' && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Always keep exact columns (enable horizontal scroll on small screens)</label>
                <button
                  onClick={()=> setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, forceExactColumns: !s.settings.forceExactColumns } } : s))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.settings.forceExactColumns ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.settings.forceExactColumns ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
        )}

        {(section.type === 'sliders' || section.type === 'side-banners' || section.type === 'carousel-with-side-banners') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Heading (optional)</label>
              <input
                type="text"
                value={section.settings.title || ''}
                onChange={(e) => {
                  setSections(sections.map(s => s.id === section.id ? { ...s, settings: { ...s.settings, title: e.target.value } } : s));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (optional)</label>
              <input
                type="text"
                value={section.settings.subtitle || ''}
                onChange={(e) => {
                  setSections(sections.map(s => s.id === section.id ? { ...s, settings: { ...s.settings, subtitle: e.target.value } } : s));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {section.type === 'carousel-with-side-banners' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Autoplay</label>
                  <button
                    onClick={() => setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, autoPlay: !s.settings.autoPlay } } : s))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.settings.autoPlay ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.settings.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interval (ms)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={section.settings.intervalMs ?? 4000}
                    onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, intervalMs: Number(e.target.value) } } : s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Show Arrows</label>
                  <button
                    onClick={() => setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, showArrows: !s.settings.showArrows } } : s))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.settings.showArrows ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.settings.showArrows ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Show Dots</label>
                  <button
                    onClick={() => setSections(sections.map(s => s.id===section.id ? { ...s, settings: { ...s.settings, showDots: !s.settings.showDots } } : s))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.settings.showDots ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.settings.showDots ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {/* Label appearance settings */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Label Background</label>
                    <select
                      value={section.settings.labelBgType || 'gradient'}
                      onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, labelBgType: e.target.value } } : s))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="gradient">Gradient (left to right)</option>
                      <option value="solid">Solid behind text</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                      <input
                        type="color"
                        value={section.settings.labelBgColor || '#000000'}
                        onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, labelBgColor: e.target.value } } : s))}
                        className="w-full h-10 p-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <input
                        type="color"
                        value={section.settings.labelTextColor || '#FFFFFF'}
                        onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, labelTextColor: e.target.value } } : s))}
                        className="w-full h-10 p-1 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  {section.settings.labelBgType !== 'none' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Opacity (start)</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={section.settings.labelBgOpacity ?? 60}
                        onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, labelBgOpacity: Number(e.target.value) } } : s))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">{section.settings.labelBgOpacity ?? 60}%</div>
                    </div>
                  )}
                </div>
                {/* Per-Category Box label overrides (optional) */}
                <div className="border rounded-lg p-3 space-y-3">
                  <div className="text-sm font-medium text-gray-700">Per Category Box Colors (optional)</div>
                  <div className="text-xs text-gray-500">Enter the Banner ID and choose colors to override label background for that box.</div>
                  <PerItemLabelEditor
                    settings={section.settings}
                    onChange={(next)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, labelStylesById: next } } : s))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center Height</label>
                  <select
                    value={section.settings.centerHeight || 'lg'}
                    onChange={(e)=> setSections(sections.map(s=> s.id===section.id ? { ...s, settings: { ...s.settings, centerHeight: e.target.value } } : s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {section.type === 'hero' && (
          <div className="space-y-4">
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

            {section.settings.showOverlay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overlay Opacity: {section.settings.overlayOpacity || 50}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={section.settings.overlayOpacity || 50}
                  onChange={(e) => {
                    setSections(sections.map(s => 
                      s.id === section.id 
                        ? { ...s, settings: { ...s.settings, overlayOpacity: parseInt(e.target.value) } }
                        : s
                    ));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Animation Settings */}
        {showAdvancedSettings && section.animations && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animation Settings
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrance Animation
              </label>
              <select
                value={section.animations.entrance}
                onChange={(e) => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { 
                          ...s, 
                          animations: { 
                            ...s.animations!, 
                            entrance: e.target.value 
                          } 
                        }
                      : s
                  ));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="fadeIn">Fade In</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="zoomIn">Zoom In</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration: {section.animations.duration}ms
              </label>
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={section.animations.duration}
                onChange={(e) => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { 
                          ...s, 
                          animations: { 
                            ...s.animations!, 
                            duration: parseInt(e.target.value) 
                          } 
                        }
                      : s
                  ));
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay: {section.animations.delay}ms
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="100"
                value={section.animations.delay}
                onChange={(e) => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { 
                          ...s, 
                          animations: { 
                            ...s.animations!, 
                            delay: parseInt(e.target.value) 
                          } 
                        }
                      : s
                  ));
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Background Color */}
        {showAdvancedSettings && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Styling
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={section.settings.backgroundColor || '#FFFFFF'}
                onChange={(e) => {
                  setSections(sections.map(s => 
                    s.id === section.id 
                      ? { ...s, settings: { ...s.settings, backgroundColor: e.target.value } }
                      : s
                  ));
                }}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Enhanced Visual Store Builder</h1>
            <p className="text-sm text-gray-500">Professional page builder with advanced features</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r pr-3">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </button>
            </div>

            {/* Device Preview */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveDevice('desktop')}
                className={`p-2 rounded transition-colors ${activeDevice === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Desktop view"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDevice('tablet')}
                className={`p-2 rounded transition-colors ${activeDevice === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Tablet view"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDevice('mobile')}
                className={`p-2 rounded transition-colors ${activeDevice === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Mobile view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportLayout}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Export layout"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importLayout}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Import layout"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>

              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPreviewMode 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
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
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Enhanced Left Sidebar */}
        {!isPreviewMode && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {/* Tab Navigation */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                    activeTab === 'templates' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab('components')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                    activeTab === 'components' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Components
                </button>
                <button
                  onClick={() => setActiveTab('layers')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                    activeTab === 'layers' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Layers
                </button>
              </div>

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Professional Templates</h3>
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                            {template.premium && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">PRO</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                          <button
                            onClick={() => applyTemplate(template)}
                            className="w-full px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                          >
                            Apply Template
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Components Tab */}
              {activeTab === 'components' && (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search components..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="layout">Layout</option>
                        <option value="commerce">Commerce</option>
                        <option value="content">Content</option>
                        <option value="media">Media</option>
                        <option value="engagement">Engagement</option>
                      </select>
                    </div>
                  </div>

                  {/* Component Library */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Add Components</h3>
                    <div className="space-y-2">
                      {filteredComponents.map((component) => {
                        const Icon = component.icon;
                        return (
                          <button
                            key={component.type}
                            onClick={() => addSection(component.type)}
                            className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                          >
                            <div className="flex-shrink-0">
                              <Icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-sm text-gray-900">{component.title}</div>
                                {component.premium && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">PRO</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{component.description}</div>
                              <div className="text-xs text-indigo-600 mt-1 capitalize">{component.category}</div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Layers Tab */}
              {activeTab === 'layers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Page Layers</h3>
                    <span className="text-xs text-gray-500">{sections.length} sections</span>
                  </div>
                  
                  <div className="space-y-1">
                    {sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <div
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedSection === section.id 
                              ? 'bg-indigo-50 border border-indigo-200' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                            <Layers className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{section.title}</div>
                            <div className="text-xs text-gray-500 capitalize">{section.type}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {section.animations && (
                              <div title="Has animations">
                                <Zap className="w-3 h-3 text-purple-500" />
                              </div>
                            )}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                section.enabled ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={section.enabled ? 'Visible' : 'Hidden'}
                            />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
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
                        <div key={section.id} className="group">
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
                        className="p-6 space-y-4 min-h-[400px]"
                      >
                        {sections
                          .sort((a, b) => a.order - b.order)
                          .map((section, index) => (
                            <Draggable
                              key={section.id}
                              draggableId={section.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative transition-transform ${
                                    snapshot.isDragging ? 'rotate-1 scale-105' : ''
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute -left-3 top-1/2 transform -translate-y-1/2 cursor-move text-gray-400 hover:text-gray-600 transition-colors"
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
                        
                        {/* Empty state */}
                        {sections.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your page</h3>
                            <p className="text-sm">Add components from the sidebar to begin designing your store</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Enhanced Right Sidebar - Section Settings */}
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

// Small helper to edit per-item label background overrides (by item id)
function PerItemLabelEditor({ settings, onChange }: { settings: any; onChange: (next: Record<string, { bgType?: string; bgColor?: string; bgOpacity?: number; textColor?: string }>) => void }) {
  const map: Record<string, { bgType?: string; bgColor?: string; bgOpacity?: number; textColor?: string }> = settings?.labelStylesById || {};
  const entries = Object.entries(map);

  const updateKey = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    const next = { ...map } as Record<string, any>;
    next[newKey] = { ...next[oldKey] };
    delete next[oldKey];
    onChange(next);
  };

  const updateValue = (key: string, patch: Partial<{ bgType: string; bgColor: string; bgOpacity: number; textColor: string }>) => {
    const next = { ...map } as Record<string, any>;
    next[key] = { ...(next[key] || {}), ...patch };
    onChange(next);
  };

  const remove = (key: string) => {
    const next = { ...map } as Record<string, any>;
    delete next[key];
    onChange(next);
  };

  const add = (id: string) => {
    if (!id) return;
    if (map[id]) return; // don't overwrite
    const next = { ...map } as Record<string, any>;
    next[id] = { bgType: 'gradient', bgColor: '#000000', bgOpacity: 60, textColor: '#FFFFFF' };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input placeholder="Banner ID" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" id="per-item-id-input" />
        <button
          className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={() => {
            const input = document.getElementById('per-item-id-input') as HTMLInputElement | null;
            add(input?.value?.trim() || '');
            if (input) input.value = '';
          }}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {entries.length === 0 && (
        <div className="text-xs text-gray-500">No overrides yet. Add a Banner ID to customize its label colors.</div>
      )}

      <div className="space-y-3">
        {entries.map(([key, val]) => (
          <div key={key} className="border rounded-md p-3 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Banner ID</label>
              <input
                value={key}
                onChange={(e)=> updateKey(key, e.target.value.trim())}
                className="flex-1 px-2 py-1 border border-gray-300 rounded"
              />
              <button className="p-1.5 rounded hover:bg-red-50" onClick={()=> remove(key)} title="Remove">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Background Type</label>
                <select
                  value={val.bgType || 'gradient'}
                  onChange={(e)=> updateValue(key, { bgType: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                <input
                  type="range" min={0} max={100}
                  value={val.bgOpacity ?? 60}
                  onChange={(e)=> updateValue(key, { bgOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                <input type="color" value={val.bgColor || '#000000'} onChange={(e)=> updateValue(key, { bgColor: e.target.value })} className="w-14 h-10 p-0 border rounded" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                <input type="color" value={val.textColor || '#FFFFFF'} onChange={(e)=> updateValue(key, { textColor: e.target.value })} className="w-14 h-10 p-0 border rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
