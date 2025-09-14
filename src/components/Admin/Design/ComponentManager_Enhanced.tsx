import { useState, useMemo } from 'react';
import { usePageLayout, PageSection } from '../../../context/PageLayoutContext';
import { 
  Settings, Eye, EyeOff, Move, Copy, Trash2, 
  ChevronDown, ChevronUp, Edit3, Save, X,
  Palette, Type, Image, Layout, MousePointer,
  Search, Filter, MoreHorizontal, Download, Upload,
  RotateCcw, Play, Pause, Zap, Lock, Unlock,
  SortAsc, SortDesc, Grid, List, Bookmark,
  Share2, History, FileText, BarChart3, Monitor,
  Smartphone, Tablet, Clock, Target
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

export function ComponentManager({ isOpen, onClose }: ComponentManagerProps) {
  const { sections, updateSection, removeSection, reorderSections, saveLayout, addSection } = usePageLayout();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PageSection>>({});
  
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

  if (!isOpen) return null;

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

  // Helper functions
  const toggleFavorite = (sectionId: string) => {
    setFavorites(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleLock = (sectionId: string) => {
    setLockedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
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
    toast.success(enabled ? 'Section hidden' : 'Section shown');
  };

  const handleDeleteSection = (sectionId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      removeSection(sectionId);
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
    toast.success('Section duplicated');
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedSections.length - 1)
    ) {
      return;
    }

    const newSections = [...sortedSections];
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
  };

  const handleEditSection = (section: PageSection) => {
    setEditingSection(section.id);
    setEditForm(section);
  };

  const handleSaveEdit = () => {
    if (editingSection && editForm) {
      updateSection(editingSection, editForm);
      setEditingSection(null);
      setEditForm({});
      toast.success('Section updated');
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
              {sortedSections.map((section, index) => {
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
                      /* Enhanced Edit Mode */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Edit3 className="mr-2 text-indigo-600" size={20} />
                            Edit Component
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center"
                            >
                              <Save size={14} className="mr-1" />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center"
                            >
                              <X size={14} className="mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                              <option value="hero">Hero</option>
                              <option value="featured">Featured</option>
                              <option value="products">Products</option>
                              <option value="text">Text</option>
                              <option value="image">Image</option>
                              <option value="banner">Banner</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.enabled || false}
                                onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable Component</span>
                            </label>
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
                              disabled={index === 0 || isLocked}
                              className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUp size={16} />
                            </button>

                            {/* Move Down */}
                            <button
                              onClick={() => handleMoveSection(section.id, 'down')}
                              disabled={index === sortedSections.length - 1 || isLocked}
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

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicateSection(section)}
                              className="p-2 rounded hover:bg-gray-100 text-green-600"
                              title="Duplicate component"
                            >
                              <Copy size={16} />
                            </button>

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
