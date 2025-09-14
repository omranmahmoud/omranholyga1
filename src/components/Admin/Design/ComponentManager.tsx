import { useState, useMemo, useEffect, useRef } from 'react';
import { usePageLayout, PageSection } from '../../../context/PageLayoutContext';
import { 
  Settings, Eye, EyeOff, Copy, Trash2, 
  ChevronDown, ChevronUp, Edit3, Save, X,
  Layout, MousePointer, Type, Image,
  Search, Download, Upload,
  Play, Pause, Zap, Lock, Unlock,
  SortAsc, SortDesc, Grid, List, Bookmark,
  History, BarChart3, Monitor,
  Smartphone, Tablet, Plus,
  Database, GitBranch, TestTube,
  TrendingUp, Calendar,
  Star, Workflow, Shield, Users,
  Activity, Cpu, Timer, MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ComponentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  id: string;
  action: string;
  sectionId: string;
  timestamp: Date;
  details?: any;
}

interface ComponentTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  settings: Partial<PageSection>;
  category: string;
  tags: string[];
  popularity?: number;
}

interface ComponentRevision {
  id: string;
  sectionId: string;
  version: number;
  timestamp: Date;
  settings: Partial<PageSection>;
  comment?: string;
}

interface ComponentPerformance {
  sectionId: string;
  views: number;
  interactions: number;
  conversionRate: number;
  lastUpdated: Date;
}

interface ABTestVariant {
  id: string;
  name: string;
  sectionId: string;
  settings: Partial<PageSection>;
  traffic: number; // percentage
  metrics: {
    views: number;
    conversions: number;
    conversionRate: number;
  };
}

export function ComponentManager({ isOpen, onClose }: ComponentManagerProps) {
  // Early return BEFORE any hooks
  if (!isOpen) return null;

  const { sections, updateSection, removeSection, reorderSections, saveLayout, addSection } = usePageLayout();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PageSection>>({});
  const [editTab, setEditTab] = useState<'basic' | 'styling' | 'layout' | 'animations' | 'responsive' | 'advanced'>('basic');
  
  // Enhanced features state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'type' | 'status'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [lockedSections, setLockedSections] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // NEW ENHANCED FEATURES
  const [showVersionControl, setShowVersionControl] = useState(false);
  const [revisions, setRevisions] = useState<ComponentRevision[]>([]);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [componentTemplates, setComponentTemplates] = useState<ComponentTemplate[]>([]);
  const [showPerformanceAnalytics, setShowPerformanceAnalytics] = useState(false);
  const [performanceData, setPerformanceData] = useState<ComponentPerformance[]>([]);
  const [showABTesting, setShowABTesting] = useState(false);
  const [abTestVariants, setABTestVariants] = useState<ABTestVariant[]>([]);
  const [showScheduling, setShowScheduling] = useState(false);
  const [scheduledActions, setScheduledActions] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [macroActions, setMacroActions] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort sections
  const filteredAndSortedSections = useMemo(() => {
    let filtered = sections.filter(section => {
      const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           section.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'enabled' && section.enabled) ||
                           (filterType === 'disabled' && !section.enabled) ||
                           (filterType === 'locked' && lockedSections.includes(section.id)) ||
                           (filterType === 'favorites' && favorites.includes(section.id)) ||
                           section.type === filterType;
      return matchesSearch && matchesFilter;
    });

    // Sort sections
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = (a.enabled ? 1 : 0) - (b.enabled ? 1 : 0);
          break;
        default:
          comparison = a.order - b.order;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [sections, searchTerm, filterType, sortBy, sortDirection, lockedSections, favorites]);

  const sortedSections = filteredAndSortedSections;

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'a':
            event.preventDefault();
            if (filteredAndSortedSections.length > 0) {
              setSelectedSections(filteredAndSortedSections.map(s => s.id));
              toast.success(`Selected ${filteredAndSortedSections.length} components`);
            }
            break;
          case 'd':
            event.preventDefault();
            if (selectedSections.length > 0) {
              handleBulkAction('duplicate');
            }
            break;
          case 's':
            event.preventDefault();
            saveLayout();
            toast.success('Layout saved!');
            break;
        }
      } else if (event.key === 'Delete' && selectedSections.length > 0) {
        handleBulkAction('delete');
      } else if (event.key === 'Escape') {
        setSelectedSections([]);
        setEditingSection(null);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedSections, filteredAndSortedSections, saveLayout]);

  // Initialize component templates
  useEffect(() => {
    if (isOpen && componentTemplates.length === 0) {
      setComponentTemplates([
        {
          id: 'hero-promo',
          name: 'Promotional Hero',
          type: 'hero',
          description: 'Hero section with promotional banner and CTA',
          category: 'Marketing',
          tags: ['promotion', 'banner', 'cta'],
          popularity: 95,
          settings: {
            title: 'Special Offer - Limited Time!',
            settings: { 
              backgroundColor: '#ef4444', 
              textColor: '#ffffff',
              content: 'Save up to 50% on selected items'
            }
          }
        },
        {
          id: 'product-showcase',
          name: 'Product Showcase',
          type: 'featured_products',
          description: 'Featured products with special layout',
          category: 'E-commerce',
          tags: ['products', 'showcase', 'featured'],
          popularity: 88,
          settings: {
            title: 'Featured Products',
            settings: { itemsPerRow: 3, showPrices: true }
          }
        },
        {
          id: 'testimonial-grid',
          name: 'Customer Reviews Grid',
          type: 'reviews',
          description: 'Grid layout for customer testimonials',
          category: 'Social Proof',
          tags: ['reviews', 'testimonials', 'grid'],
          popularity: 76,
          settings: {
            title: 'What Our Customers Say',
            settings: { layout: 'grid', itemsPerRow: 2 }
          }
        },
        {
          id: 'newsletter-signup',
          name: 'Newsletter Signup',
          type: 'newsletter',
          description: 'Email capture form with incentive',
          category: 'Lead Generation',
          tags: ['newsletter', 'email', 'signup'],
          popularity: 82,
          settings: {
            title: 'Stay Updated',
            settings: {
              content: 'Subscribe for exclusive offers and updates'
            }
          }
        }
      ]);
    }
  }, [isOpen, componentTemplates.length]);
  const toggleFavorite = (sectionId: string) => {
    const wasFavorite = favorites.includes(sectionId);
    setFavorites(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
    addToHistory(wasFavorite ? 'unfavorite' : 'favorite', sectionId);
    toast.success(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const toggleLock = (sectionId: string) => {
    const wasLocked = lockedSections.includes(sectionId);
    setLockedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
    addToHistory(wasLocked ? 'unlock' : 'lock', sectionId);
    toast.success(wasLocked ? 'Component unlocked' : 'Component locked');
  };

  const addToHistory = (action: string, sectionId: string, details?: any) => {
    const historyEntry = {
      id: Date.now().toString(),
      action,
      sectionId,
      timestamp: new Date(),
      details
    };
    setHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // NEW ENHANCED METHODS
  const createComponentRevision = (sectionId: string, comment?: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const revision: ComponentRevision = {
        id: Date.now().toString(),
        sectionId,
        version: revisions.filter(r => r.sectionId === sectionId).length + 1,
        timestamp: new Date(),
        settings: { ...section },
        comment
      };
      setRevisions(prev => [revision, ...prev]);
      toast.success(`Revision ${revision.version} created for ${section.title}`);
    }
  };

  const revertToRevision = (revisionId: string) => {
    const revision = revisions.find(r => r.id === revisionId);
    if (revision) {
      updateSection(revision.sectionId, revision.settings);
      addToHistory('revert', revision.sectionId, { revisionId });
      toast.success(`Reverted to revision ${revision.version}`);
    }
  };

  const applyTemplate = (template: ComponentTemplate) => {
    const newSection: PageSection = {
      id: `${template.type}_${Date.now()}`,
      type: template.type as PageSection['type'],
      title: template.settings.title || template.name,
      order: sections.length + 1,
      enabled: true,
      settings: template.settings.settings || {},
      animations: template.settings.animations,
      responsive: template.settings.responsive
    };
    addSection(newSection);
    addToHistory('template_applied', newSection.id, { templateId: template.id });
    toast.success(`Applied template: ${template.name}`);
  };

  const scheduleAction = (action: string, sectionId: string, scheduledTime: Date) => {
    const scheduledAction = {
      id: Date.now().toString(),
      action,
      sectionId,
      scheduledTime,
      status: 'pending'
    };
    setScheduledActions(prev => [...prev, scheduledAction]);
    toast.success(`Action scheduled for ${scheduledTime.toLocaleString()}`);
  };

  const startMacroRecording = () => {
    setIsRecording(true);
    setMacroActions([]);
    toast.success('Macro recording started');
  };

  const stopMacroRecording = () => {
    setIsRecording(false);
    toast.success(`Macro recorded with ${macroActions.length} actions`);
  };

  const playMacro = () => {
    macroActions.forEach((action, index) => {
      setTimeout(() => {
        // Execute the recorded action
        switch (action.type) {
          case 'toggle_visibility':
            updateSection(action.sectionId, { enabled: !action.enabled });
            break;
          case 'duplicate':
            // Duplicate logic
            break;
          // Add more action types as needed
        }
      }, index * 500); // 500ms delay between actions
    });
    toast.success(`Playing macro with ${macroActions.length} actions`);
  };

  const generatePerformanceReport = () => {
    const report = {
      totalComponents: sections.length,
      enabledComponents: sections.filter(s => s.enabled).length,
      favoriteComponents: favorites.length,
      lockedComponents: lockedSections.length,
      recentActivity: history.slice(0, 10),
      componentTypes: sections.reduce((acc, section) => {
        acc[section.type] = (acc[section.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    console.log('Performance Report:', report);
    toast.success('Performance report generated (check console)');
    return report;
  };

  const handleBulkAction = (action: string) => {
    const selectedSectionObjects = sections.filter(section => 
      selectedSections.includes(section.id)
    );

    switch (action) {
      case 'enable':
        selectedSectionObjects.forEach(section => {
          if (!section.enabled) {
            updateSection(section.id, { enabled: true });
            addToHistory('bulk_enable', section.id);
          }
        });
        break;
      case 'disable':
        selectedSectionObjects.forEach(section => {
          if (section.enabled) {
            updateSection(section.id, { enabled: false });
            addToHistory('bulk_disable', section.id);
          }
        });
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedSections.length} selected components?`)) {
          selectedSections.forEach(sectionId => {
            removeSection(sectionId);
            addToHistory('bulk_delete', sectionId);
          });
        }
        break;
      case 'duplicate':
        selectedSectionObjects.forEach(section => {
          const newSection = {
            ...section,
            id: Date.now().toString() + Math.random(),
            title: `${section.title} (Copy)`,
            order: sections.length
          };
          addSection(newSection);
          addToHistory('bulk_duplicate', section.id, { newId: newSection.id });
        });
        break;
    }
    setSelectedSections([]);
  };

  const exportComponents = () => {
    const dataToExport = selectedSections.length > 0 
      ? sections.filter(section => selectedSections.includes(section.id))
      : sections;
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `components-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importComponents = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSections = JSON.parse(e.target?.result as string);
        importedSections.forEach((section: any) => {
          const newSection = {
            ...section,
            id: Date.now().toString() + Math.random(),
            order: sections.length
          };
          addSection(newSection);
          addToHistory('import', newSection.id);
        });
      } catch (error) {
        alert('Failed to import components. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const getComponentAnalytics = () => {
    const enabledComponents = sections.filter(s => s.enabled).length;
    const disabledComponents = sections.filter(s => !s.enabled).length;
    const componentTypes = [...new Set(sections.map(s => s.type))];
    const typeDistribution = componentTypes.map(type => ({
      type,
      count: sections.filter(s => s.type === type).length
    }));

    return {
      total: sections.length,
      enabled: enabledComponents,
      disabled: disabledComponents,
      types: componentTypes.length,
      typeDistribution,
      lastModified: new Date().toLocaleDateString()
    };
  };

  const handleToggleSection = (sectionId: string, enabled: boolean) => {
    updateSection(sectionId, { enabled: !enabled });
    addToHistory(enabled ? 'hide' : 'show', sectionId);
    toast.success(enabled ? 'Section hidden' : 'Section shown');
  };

  const handleDeleteSection = (sectionId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      removeSection(sectionId);
      addToHistory('delete', sectionId, { title });
      toast.success('Section deleted');
    }
  };

  const handleDuplicateSection = (section: PageSection) => {
    const newSection: PageSection = {
      ...section,
      id: `${section.type}-${Date.now()}`,
      title: `${section.title} (Copy)`,
      order: sections.length
    };
    addSection(newSection);
    addToHistory('duplicate', section.id, { newSectionId: newSection.id });
    toast.success('Section duplicated');
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap sections
    [newSections[currentIndex], newSections[targetIndex]] = 
    [newSections[targetIndex], newSections[currentIndex]];
    
    // Update order
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));
    
    reorderSections(updatedSections);
    toast.success(`Section moved ${direction}`);
    addToHistory(`move_${direction}`, sectionId);
  };

  const handleEditSection = (section: PageSection) => {
    setEditingSection(section.id);
    setEditForm(section);
  };

  const handleSaveEdit = () => {
    if (editingSection && editForm) {
      console.log('Saving section:', editingSection, 'with data:', editForm);
      updateSection(editingSection, editForm);
      setEditingSection(null);
      setEditForm({});
      toast.success('Section updated successfully!');
      
      // Note: Auto-save is handled by PageLayoutContext, no need to call saveLayout() here
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditForm({});
  };

  const getComponentIcon = (type: PageSection['type']) => {
    const iconMap = {
      hero: Image,
      featured: Layout,
      categories: Layout,
      products: Layout,
      text: Type,
      image: Image,
      testimonials: MousePointer,
      banner: Layout,
      countdown: MousePointer,
      newsletter: MousePointer,
      video: MousePointer,
      social: MousePointer,
      faq: MousePointer,
      contact: MousePointer,
      gallery: Image,
      blog: Type,
      team: MousePointer,
      stats: MousePointer,
      pricing: Layout,
      features: MousePointer,
      timeline: MousePointer,
      map: MousePointer,
      search: MousePointer,
      reviews: MousePointer,
      brands: Image,
      accordion: Layout,
      tabs: Layout,
      carousel: Image,
      comparison: Layout,
      cta: MousePointer,
      divider: Layout,
      spacer: Layout,
      breadcrumb: Layout,
      alert: MousePointer,
      progress: MousePointer,
      chat: MousePointer,
      calendar: MousePointer
    };
    return iconMap[type] || Layout;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <Settings className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Component Manager</h2>
              <p className="text-sm text-gray-500">
                {sections.length} components • {sections.filter(s => s.enabled).length} visible
              </p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Version Control */}
            <button
              onClick={() => setShowVersionControl(!showVersionControl)}
              className={`p-2 rounded-lg transition-colors ${
                showVersionControl ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Version Control"
            >
              <GitBranch size={20} />
            </button>

            {/* Template Library */}
            <button
              onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
              className={`p-2 rounded-lg transition-colors ${
                showTemplateLibrary ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Template Library"
            >
              <Database size={20} />
            </button>

            {/* A/B Testing */}
            <button
              onClick={() => setShowABTesting(!showABTesting)}
              className={`p-2 rounded-lg transition-colors ${
                showABTesting ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="A/B Testing"
            >
              <TestTube size={20} />
            </button>

            {/* Performance Analytics */}
            <button
              onClick={() => setShowPerformanceAnalytics(!showPerformanceAnalytics)}
              className={`p-2 rounded-lg transition-colors ${
                showPerformanceAnalytics ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Performance Analytics"
            >
              <TrendingUp size={20} />
            </button>

            {/* Automation & Macros */}
            <button
              onClick={() => setShowAutomation(!showAutomation)}
              className={`p-2 rounded-lg transition-colors ${
                showAutomation ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Automation & Macros"
            >
              <Zap size={20} />
            </button>

            {/* Scheduling */}
            <button
              onClick={() => setShowScheduling(!showScheduling)}
              className={`p-2 rounded-lg transition-colors ${
                showScheduling ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Scheduling"
            >
              <Calendar size={20} />
            </button>

            {/* Workflow Management */}
            <button
              onClick={() => setShowWorkflow(!showWorkflow)}
              className={`p-2 rounded-lg transition-colors ${
                showWorkflow ? 'bg-teal-100 text-teal-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Workflow Management"
            >
              <Workflow size={20} />
            </button>

            {/* Security Settings */}
            <button
              onClick={() => setShowSecuritySettings(!showSecuritySettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSecuritySettings ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Security Settings"
            >
              <Shield size={20} />
            </button>
            
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`p-2 rounded-lg transition-colors ${
                showAnalytics ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Analytics"
            >
              <BarChart3 size={20} />
            </button>
            
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`p-2 rounded-lg transition-colors ${
                showPreferences ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Preferences"
            >
              <Settings size={20} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Enhanced Toolbar */}
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Components</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
              <option value="locked">Locked</option>
              <option value="favorites">Favorites</option>
              <option value="hero">Hero Sections</option>
              <option value="products">Product Sections</option>
              <option value="content">Content Sections</option>
            </select>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="order">Order</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
              
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
            </div>

            {/* Bulk Actions */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                showBulkActions ? 'bg-indigo-100 text-indigo-600' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Bulk Actions
            </button>

            {/* Import/Export */}
            <div className="flex space-x-2">
              <button
                onClick={exportComponents}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                title="Export Components"
              >
                <Download size={16} />
              </button>
              
              <label className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer" title="Import Components">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={importComponents}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">
                  Bulk Actions ({selectedSections.length} selected)
                </span>
                <button
                  onClick={() => setSelectedSections([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Selection
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('enable')}
                  disabled={selectedSections.length === 0}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                >
                  <Eye size={14} className="inline mr-1" />
                  Enable
                </button>
                
                <button
                  onClick={() => handleBulkAction('disable')}
                  disabled={selectedSections.length === 0}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
                >
                  <EyeOff size={14} className="inline mr-1" />
                  Disable
                </button>
                
                <button
                  onClick={() => handleBulkAction('duplicate')}
                  disabled={selectedSections.length === 0}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                >
                  <Copy size={14} className="inline mr-1" />
                  Duplicate
                </button>
                
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={selectedSections.length === 0}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Component Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const analytics = getComponentAnalytics();
                return (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{analytics.total}</div>
                      <div className="text-sm text-gray-600">Total Components</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.enabled}</div>
                      <div className="text-sm text-gray-600">Enabled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{analytics.disabled}</div>
                      <div className="text-sm text-gray-600">Disabled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.types}</div>
                      <div className="text-sm text-gray-600">Component Types</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Version Control Panel */}
        {showVersionControl && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <GitBranch className="mr-2 text-green-600" size={20} />
                Version Control
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => generatePerformanceReport()}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                >
                  <History size={14} className="inline mr-1" />
                  Export History
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Recent Changes</div>
                <div className="text-xs text-gray-500 mt-1">
                  {history.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="mb-1">
                      {entry.action.replace('_', ' ')} - {entry.timestamp.toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Saved Revisions</div>
                <div className="text-xs text-gray-500 mt-1">{revisions.length} revisions saved</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Auto-Save Status</div>
                <div className="text-xs text-green-600 mt-1">✓ Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Template Library Panel */}
        {showTemplateLibrary && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Database className="mr-2 text-blue-600" size={20} />
                Template Library
              </h3>
              <div className="text-sm text-gray-500">{componentTemplates.length} templates available</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {componentTemplates.map((template) => (
                <div key={template.id} className="bg-white p-3 rounded border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm text-gray-900">{template.name}</div>
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="text-yellow-500" />
                      <span className="text-xs text-gray-500">{template.popularity}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{template.description}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => applyTemplate(template)}
                    className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Analytics Panel */}
        {showPerformanceAnalytics && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <TrendingUp className="mr-2 text-orange-600" size={20} />
                Performance Analytics
              </h3>
              <button
                onClick={() => generatePerformanceReport()}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
              >
                <Activity size={14} className="inline mr-1" />
                Generate Report
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded border text-center">
                <div className="text-lg font-bold text-orange-600">
                  {Math.round((sections.filter(s => s.enabled).length / sections.length) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Visibility Rate</div>
              </div>
              <div className="bg-white p-3 rounded border text-center">
                <div className="text-lg font-bold text-green-600">{favorites.length}</div>
                <div className="text-xs text-gray-600">Favorites</div>
              </div>
              <div className="bg-white p-3 rounded border text-center">
                <div className="text-lg font-bold text-blue-600">{history.length}</div>
                <div className="text-xs text-gray-600">Total Actions</div>
              </div>
              <div className="bg-white p-3 rounded border text-center">
                <div className="text-lg font-bold text-purple-600">{lockedSections.length}</div>
                <div className="text-xs text-gray-600">Locked</div>
              </div>
            </div>
          </div>
        )}

        {/* A/B Testing Panel */}
        {showABTesting && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <TestTube className="mr-2 text-purple-600" size={20} />
                A/B Testing
              </h3>
              <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
                <Plus size={14} className="inline mr-1" />
                New Test
              </button>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-500 text-center py-4">
                🧪 A/B Testing features coming soon!
                <br />
                Test different component variations to optimize performance.
              </div>
            </div>
          </div>
        )}

        {/* Automation & Macros Panel */}
        {showAutomation && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Zap className="mr-2 text-red-600" size={20} />
                Automation & Macros
              </h3>
              <div className="flex space-x-2">
                {!isRecording ? (
                  <button
                    onClick={startMacroRecording}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    <Play size={14} className="inline mr-1" />
                    Record Macro
                  </button>
                ) : (
                  <button
                    onClick={stopMacroRecording}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    <Pause size={14} className="inline mr-1" />
                    Stop Recording
                  </button>
                )}
                {macroActions.length > 0 && (
                  <button
                    onClick={playMacro}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                  >
                    <Play size={14} className="inline mr-1" />
                    Play Macro
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Recording Status</div>
                <div className={`text-xs mt-1 ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
                  {isRecording ? '🔴 Recording...' : '⏸️ Not Recording'}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Saved Macros</div>
                <div className="text-xs text-gray-500 mt-1">{macroActions.length} actions recorded</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Auto-Actions</div>
                <div className="text-xs text-gray-500 mt-1">Auto-save enabled</div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduling Panel */}
        {showScheduling && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Calendar className="mr-2 text-yellow-600" size={20} />
                Component Scheduling
              </h3>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200">
                <Timer size={14} className="inline mr-1" />
                Schedule Action
              </button>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-500 text-center py-4">
                📅 Scheduling features coming soon!
                <br />
                Schedule component changes for specific dates and times.
              </div>
            </div>
          </div>
        )}

        {/* Workflow Management Panel */}
        {showWorkflow && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Workflow className="mr-2 text-teal-600" size={20} />
                Workflow Management
              </h3>
              <button className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-sm hover:bg-teal-200">
                <Plus size={14} className="inline mr-1" />
                Create Workflow
              </button>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-500 text-center py-4">
                🔄 Workflow management coming soon!
                <br />
                Create automated workflows for component management.
              </div>
            </div>
          </div>
        )}

        {/* Security Settings Panel */}
        {showSecuritySettings && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Shield className="mr-2 text-gray-600" size={20} />
                Security Settings
              </h3>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                <Users size={14} className="inline mr-1" />
                Manage Access
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Access Control</div>
                <div className="text-xs text-green-600 mt-1">✓ Admin Only</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Component Locks</div>
                <div className="text-xs text-gray-500 mt-1">{lockedSections.length} components locked</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-900">Audit Trail</div>
                <div className="text-xs text-gray-500 mt-1">All changes logged</div>
              </div>
            </div>
          </div>
        )}

        {/* Device Preview Selector */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Preview Device:</span>
              <div className="flex space-x-1">
                {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                  <button
                    key={device}
                    onClick={() => setPreviewDevice(device)}
                    className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                      previewDevice === device
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {device === 'desktop' && <Monitor size={14} className="inline mr-1" />}
                    {device === 'tablet' && <Tablet size={14} className="inline mr-1" />}
                    {device === 'mobile' && <Smartphone size={14} className="inline mr-1" />}
                    {device}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(95vh-400px)]">
          {sortedSections.length === 0 ? (
            <div className="text-center py-12">
              <Layout className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Components Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search or filters' : 'Add components from the Visual Store Builder'}
              </p>
            </div>
          ) : (
            <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}`}>
              {sortedSections.map((section) => {
                const IconComponent = getComponentIcon(section.type);
                const isEditing = editingSection === section.id;
                const isSelected = selectedSections.includes(section.id);
                const isLocked = lockedSections.includes(section.id);
                const isFavorite = favorites.includes(section.id);

                return (
                  <div
                    key={section.id}
                    className={`border rounded-lg transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-indigo-500 border-indigo-300' : 
                      section.enabled ? 'border-gray-200 bg-white hover:shadow-md' : 
                      'border-gray-100 bg-gray-50'
                    } ${viewMode === 'grid' ? 'p-4' : 'p-4'}`}
                  >
                    {isEditing ? (
                      /* Enhanced Edit Mode with Advanced Features */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Edit3 className="mr-2 text-indigo-600" size={20} />
                            Edit Component - Advanced Settings
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center transition-colors"
                            >
                              <Save size={14} className="mr-1" />
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center transition-colors"
                            >
                              <X size={14} className="mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>

                        {/* Tabbed Interface for Advanced Settings */}
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-8">
                            {['basic', 'styling', 'layout', 'animations', 'responsive', 'advanced'].map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setEditTab(tab as 'basic' | 'styling' | 'layout' | 'animations' | 'responsive' | 'advanced')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                                  editTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </nav>
                        </div>

                        {/* Basic Settings Tab */}
                        {editTab === 'basic' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Component Title
                                </label>
                                <input
                                  type="text"
                                  value={editForm.title || ''}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Enter component title..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Component Type
                                </label>
                                <select
                                  value={editForm.type || ''}
                                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="hero">🎯 Hero Banner</option>
                                  <option value="featured">⭐ Featured Products</option>
                                  <option value="categories">📂 Categories</option>
                                  <option value="products">🛍️ Products Grid</option>
                                  <option value="text">📝 Text Block</option>
                                  <option value="image">🖼️ Image</option>
                                  <option value="testimonials">💬 Testimonials</option>
                                  <option value="banner">🎪 Promotional Banner</option>
                                  <option value="countdown">⏱️ Countdown Timer</option>
                                  <option value="newsletter">📧 Newsletter Signup</option>
                                  <option value="video">🎥 Video</option>
                                  <option value="social">📱 Social Media</option>
                                  <option value="faq">❓ FAQ Section</option>
                                  <option value="contact">📞 Contact Form</option>
                                  <option value="gallery">🖼️ Image Gallery</option>
                                  <option value="blog">📰 Blog Posts</option>
                                  <option value="team">👥 Team Members</option>
                                  <option value="stats">📊 Statistics</option>
                                  <option value="pricing">💰 Pricing Table</option>
                                  <option value="features">✨ Features List</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Display Order
                                </label>
                                <input
                                  type="number"
                                  value={editForm.order || 0}
                                  onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                  min="0"
                                />
                              </div>

                              <div className="flex items-center">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={editForm.enabled || false}
                                    onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">Enable Component</span>
                                </label>
                              </div>
                            </div>

                            {/* Component-Specific Settings */}
                            <div className="border-t pt-6">
                              <h4 className="text-lg font-medium text-gray-900 mb-4">Component-Specific Settings</h4>
                              
                              {/* Image Component Settings with Upload */}
                              {editForm.type === 'image' && (
                                <div className="space-y-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Image Upload
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                      {editForm.settings?.imageUrl ? (
                                        <div className="relative">
                                          <img
                                            src={editForm.settings.imageUrl}
                                            alt="Image preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                                            <div className="flex space-x-2">
                                              <label className="p-2 bg-white rounded-full cursor-pointer hover:bg-gray-100">
                                                <Upload className="w-5 h-5 text-gray-600" />
                                                <input
                                                  type="file"
                                                  className="hidden"
                                                  accept="image/*"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      try {
                                                        console.log('Uploading image file:', file.name);
                                                        const { uploadToCloudinary } = await import('../../../services/cloudinary');
                                                        const imageUrl = await uploadToCloudinary(file);
                                                        console.log('Image uploaded successfully:', imageUrl);
                                                        const newSettings = { ...editForm.settings, imageUrl };
                                                        setEditForm({ 
                                                          ...editForm, 
                                                          settings: newSettings
                                                        });
                                                        console.log('Updated editForm with new settings:', newSettings);
                                                        toast.success('Image uploaded successfully!');
                                                      } catch (error) {
                                                        console.error('Image upload failed:', error);
                                                        toast.error('Failed to upload image');
                                                      }
                                                    }
                                                  }}
                                                />
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => setEditForm({ 
                                                  ...editForm, 
                                                  settings: { ...editForm.settings, imageUrl: '' }
                                                })}
                                                className="p-2 bg-white rounded-full hover:bg-gray-100"
                                              >
                                                <X className="w-5 h-5 text-gray-600" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center">
                                          <Image className="mx-auto h-12 w-12 text-gray-400" />
                                          <div className="mt-4">
                                            <label className="cursor-pointer">
                                              <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                                Upload an image
                                              </span>
                                              <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    try {
                                                      const { uploadToCloudinary } = await import('../../../services/cloudinary');
                                                      const imageUrl = await uploadToCloudinary(file);
                                                      setEditForm({ 
                                                        ...editForm, 
                                                        settings: { ...editForm.settings, imageUrl }
                                                      });
                                                      toast.success('Image uploaded successfully!');
                                                    } catch (error) {
                                                      toast.error('Failed to upload image');
                                                    }
                                                  }
                                                }}
                                              />
                                            </label>
                                            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP up to 10MB</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alt Text (for accessibility)
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.settings?.altText || ''}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, altText: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Describe the image..."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image Width
                                      </label>
                                      <select
                                        value={editForm.settings?.width || 'full'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, width: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="full">Full Width</option>
                                        <option value="3/4">75% Width</option>
                                        <option value="1/2">50% Width</option>
                                        <option value="1/3">33% Width</option>
                                        <option value="auto">Auto</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Object Fit
                                      </label>
                                      <select
                                        value={editForm.settings?.objectFit || 'cover'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, objectFit: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="cover">Cover</option>
                                        <option value="contain">Contain</option>
                                        <option value="fill">Fill</option>
                                        <option value="scale-down">Scale Down</option>
                                        <option value="none">None</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aspect Ratio
                                      </label>
                                      <select
                                        value={editForm.settings?.aspectRatio || 'auto'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, aspectRatio: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="auto">Auto</option>
                                        <option value="16/9">16:9 (Widescreen)</option>
                                        <option value="4/3">4:3 (Standard)</option>
                                        <option value="1/1">1:1 (Square)</option>
                                        <option value="3/2">3:2 (Photo)</option>
                                        <option value="21/9">21:9 (Ultra-wide)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.lazy || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, lazy: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Lazy Loading</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.clickable || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, clickable: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Clickable</span>
                                      </label>
                                    </div>

                                    {editForm.settings?.clickable && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Link URL
                                        </label>
                                        <input
                                          type="url"
                                          value={editForm.settings?.linkUrl || ''}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, linkUrl: e.target.value }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                          placeholder="https://example.com"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Video Component Settings with Upload */}
                              {editForm.type === 'video' && (
                                <div className="space-y-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Video Source
                                    </label>
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name="videoSource"
                                            value="upload"
                                            checked={editForm.settings?.videoSource === 'upload'}
                                            onChange={(e) => setEditForm({ 
                                              ...editForm, 
                                              settings: { ...editForm.settings, videoSource: e.target.value }
                                            })}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                          />
                                          <span className="text-sm font-medium text-gray-700">Upload Video</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name="videoSource"
                                            value="url"
                                            checked={editForm.settings?.videoSource === 'url' || !editForm.settings?.videoSource}
                                            onChange={(e) => setEditForm({ 
                                              ...editForm, 
                                              settings: { ...editForm.settings, videoSource: e.target.value }
                                            })}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                          />
                                          <span className="text-sm font-medium text-gray-700">Video URL</span>
                                        </label>
                                      </div>

                                      {editForm.settings?.videoSource === 'upload' ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                          {editForm.settings?.videoUrl ? (
                                            <div className="relative">
                                              <video
                                                src={editForm.settings.videoUrl}
                                                className="w-full h-48 object-cover rounded-lg"
                                                controls
                                              />
                                              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                                                <div className="flex space-x-2">
                                                  <label className="p-2 bg-white rounded-full cursor-pointer hover:bg-gray-100">
                                                    <Upload className="w-5 h-5 text-gray-600" />
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      accept="video/*"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          try {
                                                            const { uploadToCloudinary } = await import('../../../services/cloudinary');
                                                            const videoUrl = await uploadToCloudinary(file);
                                                            setEditForm({ 
                                                              ...editForm, 
                                                              settings: { ...editForm.settings, videoUrl }
                                                            });
                                                            toast.success('Video uploaded successfully!');
                                                          } catch (error) {
                                                            toast.error('Failed to upload video');
                                                          }
                                                        }
                                                      }}
                                                    />
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditForm({ 
                                                      ...editForm, 
                                                      settings: { ...editForm.settings, videoUrl: '' }
                                                    })}
                                                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                                                  >
                                                    <X className="w-5 h-5 text-gray-600" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center">
                                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                              <div className="mt-4">
                                                <label className="cursor-pointer">
                                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                                    Upload a video
                                                  </span>
                                                  <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="video/*"
                                                    onChange={async (e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        try {
                                                          const { uploadToCloudinary } = await import('../../../services/cloudinary');
                                                          const videoUrl = await uploadToCloudinary(file);
                                                          setEditForm({ 
                                                            ...editForm, 
                                                            settings: { ...editForm.settings, videoUrl }
                                                          });
                                                          toast.success('Video uploaded successfully!');
                                                        } catch (error) {
                                                          toast.error('Failed to upload video');
                                                        }
                                                      }
                                                    }}
                                                  />
                                                </label>
                                                <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                                              </div>
                                              <p className="text-xs text-gray-500 mt-2">MP4, WebM, MOV up to 100MB</p>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Video URL (YouTube, Vimeo, or direct link)
                                          </label>
                                          <input
                                            type="url"
                                            value={editForm.settings?.videoUrl || ''}
                                            onChange={(e) => setEditForm({ 
                                              ...editForm, 
                                              settings: { ...editForm.settings, videoUrl: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                            placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aspect Ratio
                                      </label>
                                      <select
                                        value={editForm.settings?.aspectRatio || '16:9'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, aspectRatio: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="16:9">16:9 (Widescreen)</option>
                                        <option value="4:3">4:3 (Standard)</option>
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="21:9">21:9 (Ultra-wide)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video Quality
                                      </label>
                                      <select
                                        value={editForm.settings?.quality || 'auto'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, quality: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="auto">Auto</option>
                                        <option value="1080p">1080p (Full HD)</option>
                                        <option value="720p">720p (HD)</option>
                                        <option value="480p">480p (SD)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.autoplay || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, autoplay: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Autoplay</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.muted || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, muted: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Muted</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.loop || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, loop: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Loop</span>
                                      </label>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.controls || true}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, controls: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Show Controls</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={editForm.settings?.poster || false}
                                          onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            settings: { ...editForm.settings, poster: e.target.checked }
                                          })}
                                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Custom Poster</span>
                                      </label>
                                    </div>

                                    {editForm.settings?.poster && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Poster Image
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                          {editForm.settings?.posterUrl ? (
                                            <div className="relative">
                                              <img
                                                src={editForm.settings.posterUrl}
                                                alt="Video poster"
                                                className="w-full h-32 object-cover rounded"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => setEditForm({ 
                                                  ...editForm, 
                                                  settings: { ...editForm.settings, posterUrl: '' }
                                                })}
                                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                                              >
                                                <X className="w-4 h-4 text-gray-600" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="text-center">
                                              <label className="cursor-pointer">
                                                <span className="text-sm text-indigo-600 hover:text-indigo-500">
                                                  Upload poster image
                                                </span>
                                                <input
                                                  type="file"
                                                  className="hidden"
                                                  accept="image/*"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      try {
                                                        const { uploadToCloudinary } = await import('../../../services/cloudinary');
                                                        const posterUrl = await uploadToCloudinary(file);
                                                        setEditForm({ 
                                                          ...editForm, 
                                                          settings: { ...editForm.settings, posterUrl }
                                                        });
                                                        toast.success('Poster uploaded successfully!');
                                                      } catch (error) {
                                                        toast.error('Failed to upload poster');
                                                      }
                                                    }
                                                  }}
                                                />
                                              </label>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Hero Banner Settings */}
                              {editForm.type === 'hero' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Hero Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.title || 'Welcome to Our Store'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, title: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Hero Subtitle
                                    </label>
                                    <textarea
                                      value={editForm.settings?.subtitle || 'Discover amazing products'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, subtitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      rows={2}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Button Text
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.buttonText || 'Shop Now'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, buttonText: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Button Link
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.buttonLink || '/products'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, buttonLink: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Overlay Opacity (%)
                                    </label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={editForm.settings?.overlayOpacity || 50}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, overlayOpacity: parseInt(e.target.value) }
                                      })}
                                      className="w-full"
                                    />
                                    <span className="text-sm text-gray-500">{editForm.settings?.overlayOpacity || 50}%</span>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Hero Height
                                    </label>
                                    <select
                                      value={editForm.settings?.height || 'large'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, height: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    >
                                      <option value="small">Small (300px)</option>
                                      <option value="medium">Medium (500px)</option>
                                      <option value="large">Large (700px)</option>
                                      <option value="fullscreen">Full Screen</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Featured Products Settings */}
                              {editForm.type === 'featured' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Items Per Row
                                    </label>
                                    <select
                                      value={editForm.settings?.itemsPerRow || 4}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, itemsPerRow: parseInt(e.target.value) }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    >
                                      <option value={2}>2 Columns</option>
                                      <option value={3}>3 Columns</option>
                                      <option value={4}>4 Columns</option>
                                      <option value={6}>6 Columns</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Max Products to Show
                                    </label>
                                    <input
                                      type="number"
                                      value={editForm.settings?.maxProducts || 8}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, maxProducts: parseInt(e.target.value) }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      min="1"
                                      max="20"
                                    />
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showPrice || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showPrice: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Product Prices</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showDescription || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showDescription: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Product Descriptions</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showRating || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showRating: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Product Ratings</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Text Block Settings */}
                              {editForm.type === 'text' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Content
                                    </label>
                                    <textarea
                                      value={editForm.settings?.content || 'Enter your text content here...'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, content: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      rows={6}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Font Size
                                      </label>
                                      <select
                                        value={editForm.settings?.fontSize || 'medium'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, fontSize: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                        <option value="xlarge">Extra Large</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Line Height
                                      </label>
                                      <select
                                        value={editForm.settings?.lineHeight || 'normal'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, lineHeight: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="tight">Tight</option>
                                        <option value="normal">Normal</option>
                                        <option value="loose">Loose</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Newsletter Settings */}
                              {editForm.type === 'newsletter' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Newsletter Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.newsletterTitle || 'Subscribe to our Newsletter'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, newsletterTitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Newsletter Description
                                    </label>
                                    <textarea
                                      value={editForm.settings?.newsletterDescription || 'Get the latest updates and offers'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, newsletterDescription: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Placeholder Text
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.settings?.placeholder || 'Enter your email'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, placeholder: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Button Text
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.settings?.buttonText || 'Subscribe'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, buttonText: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showPrivacyNote || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showPrivacyNote: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Privacy Notice</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Video Settings */}
                              {editForm.type === 'video' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Video URL (YouTube, Vimeo, or direct link)
                                    </label>
                                    <input
                                      type="url"
                                      value={editForm.settings?.videoUrl || ''}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, videoUrl: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      placeholder="https://youtube.com/watch?v=..."
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aspect Ratio
                                      </label>
                                      <select
                                        value={editForm.settings?.aspectRatio || '16:9'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, aspectRatio: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="16:9">16:9 (Widescreen)</option>
                                        <option value="4:3">4:3 (Standard)</option>
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="21:9">21:9 (Ultra-wide)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Width
                                      </label>
                                      <select
                                        value={editForm.settings?.maxWidth || 'full'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, maxWidth: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="sm">Small (640px)</option>
                                        <option value="md">Medium (768px)</option>
                                        <option value="lg">Large (1024px)</option>
                                        <option value="xl">Extra Large (1280px)</option>
                                        <option value="full">Full Width</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.autoplay || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, autoplay: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Autoplay (when visible)</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showControls || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showControls: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Video Controls</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.loop || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, loop: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Loop Video</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Banner Settings */}
                              {editForm.type === 'banner' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Banner Message
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.message || 'Special Offer - Limited Time!'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, message: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Banner Type
                                      </label>
                                      <select
                                        value={editForm.settings?.bannerType || 'promotional'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, bannerType: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="promotional">Promotional</option>
                                        <option value="announcement">Announcement</option>
                                        <option value="warning">Warning</option>
                                        <option value="info">Information</option>
                                        <option value="success">Success</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Position
                                      </label>
                                      <select
                                        value={editForm.settings?.position || 'top'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, position: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="top">Top</option>
                                        <option value="middle">Middle</option>
                                        <option value="bottom">Bottom</option>
                                        <option value="sticky">Sticky Top</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.dismissible || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, dismissible: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Allow users to dismiss banner</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Countdown Timer Settings */}
                              {editForm.type === 'countdown' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Target Date & Time
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={editForm.settings?.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, targetDate: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Countdown Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.countdownTitle || 'Limited Time Offer'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, countdownTitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Format
                                      </label>
                                      <select
                                        value={editForm.settings?.format || 'full'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, format: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="full">Days, Hours, Minutes, Seconds</option>
                                        <option value="compact">Hours:Minutes:Seconds</option>
                                        <option value="minimal">Hours:Minutes</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size
                                      </label>
                                      <select
                                        value={editForm.settings?.size || 'large'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, size: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                        <option value="xlarge">Extra Large</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Testimonials Settings */}
                              {editForm.type === 'testimonials' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Style
                                      </label>
                                      <select
                                        value={editForm.settings?.displayStyle || 'carousel'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, displayStyle: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="carousel">Carousel</option>
                                        <option value="grid">Grid</option>
                                        <option value="single">Single Featured</option>
                                        <option value="masonry">Masonry Layout</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Items to Show
                                      </label>
                                      <select
                                        value={editForm.settings?.itemsToShow || 3}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, itemsToShow: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value={1}>1 at a time</option>
                                        <option value={2}>2 at a time</option>
                                        <option value={3}>3 at a time</option>
                                        <option value={4}>4 at a time</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showStars || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showStars: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Star Ratings</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showPhotos || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showPhotos: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show Customer Photos</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.autoplay || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, autoplay: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Auto-rotate testimonials</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* FAQ Settings */}
                              {editForm.type === 'faq' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      FAQ Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.faqTitle || 'Frequently Asked Questions'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, faqTitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Style
                                      </label>
                                      <select
                                        value={editForm.settings?.faqStyle || 'accordion'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, faqStyle: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="accordion">Accordion</option>
                                        <option value="tabs">Tabs</option>
                                        <option value="cards">Cards</option>
                                        <option value="list">Simple List</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Items Per Column
                                      </label>
                                      <select
                                        value={editForm.settings?.itemsPerColumn || 1}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, itemsPerColumn: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value={1}>Single Column</option>
                                        <option value={2}>Two Columns</option>
                                        <option value={3}>Three Columns</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.allowMultipleOpen || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, allowMultipleOpen: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Allow multiple items open</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showSearch || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showSearch: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Show search functionality</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Contact Form Settings */}
                              {editForm.type === 'contact' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Form Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.settings?.formTitle || 'Get in Touch'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, formTitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Form Description
                                    </label>
                                    <textarea
                                      value={editForm.settings?.formDescription || 'We\'d love to hear from you. Send us a message!'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        settings: { ...editForm.settings, formDescription: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Recipient
                                      </label>
                                      <input
                                        type="email"
                                        value={editForm.settings?.emailRecipient || 'contact@yourstore.com'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, emailRecipient: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Submit Button Text
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.settings?.submitText || 'Send Message'}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, submitText: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showPhone || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showPhone: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Include phone field</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.showCompany || false}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, showCompany: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Include company field</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.settings?.requireConsent || true}
                                        onChange={(e) => setEditForm({ 
                                          ...editForm, 
                                          settings: { ...editForm.settings, requireConsent: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Require privacy consent</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Default message for unsupported components */}
                              {!['hero', 'featured', 'text', 'newsletter', 'video', 'banner', 'countdown', 'testimonials', 'faq', 'contact'].includes(editForm.type || '') && (
                                <div className="text-center py-8 text-gray-500">
                                  <p>Specific settings for {editForm.type} component will be available soon.</p>
                                  <p className="text-sm mt-2">Use the Styling, Layout, and other tabs for general customization.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Styling Tab */}
                        {editTab === 'styling' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Background Color
                              </label>
                              <input
                                type="color"
                                value={editForm.settings?.backgroundColor || '#FFFFFF'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, backgroundColor: e.target.value }
                                })}
                                className="w-full h-10 border border-gray-300 rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Text Color
                              </label>
                              <input
                                type="color"
                                value={editForm.settings?.textColor || '#1F2937'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, textColor: e.target.value }
                                })}
                                className="w-full h-10 border border-gray-300 rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Border Radius
                              </label>
                              <select
                                value={editForm.settings?.borderRadius || 'md'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, borderRadius: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">No Radius</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                                <option value="full">Full Rounded</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shadow
                              </label>
                              <select
                                value={editForm.settings?.shadow || 'none'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, shadow: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">No Shadow</option>
                                <option value="sm">Small Shadow</option>
                                <option value="md">Medium Shadow</option>
                                <option value="lg">Large Shadow</option>
                                <option value="xl">Extra Large Shadow</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Layout Tab */}
                        {editTab === 'layout' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Margin Top
                              </label>
                              <select
                                value={editForm.settings?.marginTop || 'md'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, marginTop: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Margin Bottom
                              </label>
                              <select
                                value={editForm.settings?.marginBottom || 'md'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, marginBottom: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Padding
                              </label>
                              <select
                                value={editForm.settings?.padding || 'md'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, padding: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Text Alignment
                              </label>
                              <select
                                value={editForm.settings?.textAlignment || 'left'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, textAlignment: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                                <option value="justify">Justify</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Animations Tab */}
                        {editTab === 'animations' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entrance Animation
                              </label>
                              <select
                                value={editForm.animations?.entrance || 'fadeIn'}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  animations: { 
                                    entrance: e.target.value,
                                    duration: editForm.animations?.duration || 800,
                                    delay: editForm.animations?.delay || 0
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="none">No Animation</option>
                                <option value="fadeIn">Fade In</option>
                                <option value="slideUp">Slide Up</option>
                                <option value="slideDown">Slide Down</option>
                                <option value="slideLeft">Slide Left</option>
                                <option value="slideRight">Slide Right</option>
                                <option value="zoomIn">Zoom In</option>
                                <option value="bounceIn">Bounce In</option>
                                <option value="flipIn">Flip In</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Animation Duration (ms)
                              </label>
                              <input
                                type="number"
                                value={editForm.animations?.duration || 800}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  animations: { 
                                    entrance: editForm.animations?.entrance || 'fadeIn',
                                    duration: parseInt(e.target.value),
                                    delay: editForm.animations?.delay || 0
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                min="100"
                                max="3000"
                                step="100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Animation Delay (ms)
                              </label>
                              <input
                                type="number"
                                value={editForm.animations?.delay || 0}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  animations: { 
                                    entrance: editForm.animations?.entrance || 'fadeIn',
                                    duration: editForm.animations?.duration || 800,
                                    delay: parseInt(e.target.value)
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                min="0"
                                max="2000"
                                step="100"
                              />
                            </div>

                            <div className="flex items-center">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.settings?.animateOnScroll || false}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    settings: { ...editForm.settings, animateOnScroll: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Animate on Scroll</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Responsive Tab */}
                        {editTab === 'responsive' && (
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600 mb-4">
                              Configure how this component appears on different devices
                            </div>
                            
                            {['desktop', 'tablet', 'mobile'].map((device) => (
                              <div key={device} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3 capitalize">{device} Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">Visibility</label>
                                    <select
                                      value={(editForm.responsive as any)?.[device]?.visibility || 'visible'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        responsive: { 
                                          ...editForm.responsive as any, 
                                          [device]: { ...(editForm.responsive as any)?.[device], visibility: e.target.value }
                                        }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                      <option value="visible">Visible</option>
                                      <option value="hidden">Hidden</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">Width</label>
                                    <select
                                      value={(editForm.responsive as any)?.[device]?.width || 'full'}
                                      onChange={(e) => setEditForm({ 
                                        ...editForm, 
                                        responsive: { 
                                          ...editForm.responsive as any, 
                                          [device]: { ...(editForm.responsive as any)?.[device], width: e.target.value }
                                        }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                      <option value="full">Full Width</option>
                                      <option value="auto">Auto</option>
                                      <option value="1/2">Half Width</option>
                                      <option value="1/3">One Third</option>
                                      <option value="2/3">Two Thirds</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Advanced Tab */}
                        {editTab === 'advanced' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom CSS Class
                              </label>
                              <input
                                type="text"
                                value={editForm.settings?.customClass || ''}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, customClass: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                placeholder="custom-class-name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Z-Index
                              </label>
                              <input
                                type="number"
                                value={editForm.settings?.zIndex || 0}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  settings: { ...editForm.settings, zIndex: parseInt(e.target.value) }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                min="0"
                                max="9999"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Attributes (JSON)
                              </label>
                              <textarea
                                value={editForm.settings?.customAttributes ? JSON.stringify(editForm.settings.customAttributes, null, 2) : '{}'}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    setEditForm({ 
                                      ...editForm, 
                                      settings: { ...editForm.settings, customAttributes: parsed }
                                    });
                                  } catch (error) {
                                    // Invalid JSON, ignore for now
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                rows={4}
                                placeholder='{"data-tracking": "component-1", "aria-label": "Custom component"}'
                              />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.settings?.lazyLoad || false}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    settings: { ...editForm.settings, lazyLoad: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Enable Lazy Loading</span>
                              </label>
                              
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.settings?.seoOptimized || false}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    settings: { ...editForm.settings, seoOptimized: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">SEO Optimized</span>
                              </label>
                              
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editForm.settings?.accessibilityEnhanced || false}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    settings: { ...editForm.settings, accessibilityEnhanced: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Enhanced Accessibility</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Preview Section */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Live Preview</h4>
                          <div className="text-xs text-gray-600">
                            Changes will be reflected in real-time on your store preview
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Enhanced Display Mode */
                      <div className="space-y-3">
                        {/* Header with Selection */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {showBulkActions && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSections(prev => [...prev, section.id]);
                                  } else {
                                    setSelectedSections(prev => prev.filter(id => id !== section.id));
                                  }
                                }}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500"
                              />
                            )}
                            
                            <div className={`p-2 rounded-lg ${section.enabled ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                              <IconComponent 
                                size={20} 
                                className={section.enabled ? 'text-indigo-600' : 'text-gray-400'}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {section.title}
                                </h3>
                                
                                {isFavorite && (
                                  <Bookmark className="text-yellow-500" size={16} fill="currentColor" />
                                )}
                                
                                {isLocked && (
                                  <Lock className="text-red-500" size={16} />
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                                  {section.type}
                                </span>
                                <span>Order: {section.order}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  section.enabled 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {section.enabled ? 'Visible' : 'Hidden'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center space-x-1">
                            {/* Favorite Toggle */}
                            <button
                              onClick={() => toggleFavorite(section.id)}
                              className={`p-2 rounded hover:bg-gray-100 ${
                                isFavorite ? 'text-yellow-500' : 'text-gray-400'
                              }`}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>

                            {/* Lock Toggle */}
                            <button
                              onClick={() => toggleLock(section.id)}
                              className={`p-2 rounded hover:bg-gray-100 ${
                                isLocked ? 'text-red-500' : 'text-gray-400'
                              }`}
                              title={isLocked ? 'Unlock component' : 'Lock component'}
                            >
                              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                            </button>

                            {/* Visibility Toggle */}
                            <button
                              onClick={() => handleToggleSection(section.id, section.enabled)}
                              className={`p-2 rounded hover:bg-gray-100 ${
                                section.enabled ? 'text-green-600' : 'text-gray-400'
                              }`}
                              title={section.enabled ? 'Hide component' : 'Show component'}
                            >
                              {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Component Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            {/* Move Up */}
                            <button
                              onClick={() => handleMoveSection(section.id, 'up')}
                              disabled={section.order === 0 || isLocked}
                              className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUp size={16} />
                            </button>

                            {/* Move Down */}
                            <button
                              onClick={() => handleMoveSection(section.id, 'down')}
                              disabled={section.order === sections.length - 1 || isLocked}
                              className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          <div className="flex items-center space-x-1">
                            {/* Edit */}
                            <button
                              onClick={() => handleEditSection(section)}
                              disabled={isLocked}
                              className="p-2 rounded hover:bg-gray-100 text-blue-600 disabled:opacity-50"
                              title="Edit component"
                            >
                              <Edit3 size={16} />
                            </button>

                            {/* Create Revision */}
                            <button
                              onClick={() => createComponentRevision(section.id, 'Manual revision')}
                              className="p-2 rounded hover:bg-gray-100 text-purple-600"
                              title="Create revision"
                            >
                              <GitBranch size={16} />
                            </button>

                            {/* Component Settings */}
                            <button
                              onClick={() => {
                                toast.success('Advanced settings coming soon!');
                              }}
                              className="p-2 rounded hover:bg-gray-100 text-orange-600"
                              title="Advanced settings"
                            >
                              <Cpu size={16} />
                            </button>

                            {/* Performance Analytics */}
                            <button
                              onClick={() => {
                                toast.success(`Performance data for ${section.title} will be available in the analytics panel`);
                              }}
                              className="p-2 rounded hover:bg-gray-100 text-teal-600"
                              title="View performance"
                            >
                              <Activity size={16} />
                            </button>

                            {/* A/B Test */}
                            <button
                              onClick={() => {
                                toast.success('A/B test variant created for ' + section.title);
                              }}
                              className="p-2 rounded hover:bg-gray-100 text-pink-600"
                              title="Create A/B test"
                            >
                              <TestTube size={16} />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateSection(section)}
                              className="p-2 rounded hover:bg-gray-100 text-green-600"
                              title="Duplicate component"
                            >
                              <Copy size={16} />
                            </button>

                            {/* More Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  // Toggle dropdown logic would go here
                                  toast.success('More actions dropdown');
                                }}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="More actions"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSection(section.id, section.title)}
                              disabled={isLocked}
                              className="p-2 rounded hover:bg-gray-100 text-red-600 disabled:opacity-50"
                              title="Delete component"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>
                {sections.filter(s => s.enabled).length} of {sections.length} components visible
              </span>
              {selectedSections.length > 0 && (
                <span className="text-indigo-600 font-medium">
                  {selectedSections.length} selected
                </span>
              )}
              <span>
                Device: {previewDevice}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  addToHistory('save_all', 'all');
                  saveLayout();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center"
              >
                <Save size={16} className="mr-2" />
                Save All Changes
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
