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
    updateSection(newSection.id, newSection);
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="text-indigo-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Component Manager</h2>
            <span className="text-sm text-gray-500">({sections.length} components)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {sortedSections.length === 0 ? (
            <div className="text-center py-12">
              <Layout className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Components Yet</h3>
              <p className="text-gray-500">Add components from the Visual Store Builder</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSections.map((section, index) => {
                const IconComponent = getComponentIcon(section.type);
                const isEditing = editingSection === section.id;

                return (
                  <div
                    key={section.id}
                    className={`border rounded-lg p-4 transition-all ${
                      section.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">Edit Component</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Animation
                            </label>
                            <select
                              value={editForm.animations?.entrance || 'fadeIn'}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                animations: { ...prev.animations, entrance: e.target.value, duration: 600, delay: 0 }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="fadeIn">Fade In</option>
                              <option value="fadeInUp">Fade In Up</option>
                              <option value="slideUp">Slide Up</option>
                              <option value="slideLeft">Slide Left</option>
                              <option value="slideRight">Slide Right</option>
                              <option value="zoomIn">Zoom In</option>
                              <option value="bounce">Bounce</option>
                            </select>
                          </div>

                          {/* Settings based on component type */}
                          {section.type === 'text' && (
                            <>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Background Color
                                </label>
                                <input
                                  type="color"
                                  value={editForm.settings?.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => setEditForm(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, backgroundColor: e.target.value }
                                  }))}
                                  className="w-full h-10 border border-gray-300 rounded-md"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Content Title
                                </label>
                                <input
                                  type="text"
                                  value={editForm.settings?.title || ''}
                                  onChange={(e) => setEditForm(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, title: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </>
                          )}

                          {['featured', 'categories', 'products'].includes(section.type) && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Items Per Row
                                </label>
                                <select
                                  value={editForm.settings?.itemsPerRow || 4}
                                  onChange={(e) => setEditForm(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, itemsPerRow: parseInt(e.target.value) }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  <option value={2}>2 Columns</option>
                                  <option value={3}>3 Columns</option>
                                  <option value={4}>4 Columns</option>
                                  <option value={6}>6 Columns</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Background Color
                                </label>
                                <input
                                  type="color"
                                  value={editForm.settings?.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => setEditForm(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, backgroundColor: e.target.value }
                                  }))}
                                  className="w-full h-10 border border-gray-300 rounded-md"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <IconComponent 
                              className={section.enabled ? 'text-indigo-600' : 'text-gray-400'} 
                              size={20} 
                            />
                          </div>
                          
                          <div>
                            <h3 className={`font-medium ${section.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                              {section.title}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className="capitalize">{section.type}</span>
                              <span>•</span>
                              <span>{section.animations?.entrance || 'No animation'}</span>
                              {!section.enabled && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-500">Hidden</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Visibility Toggle */}
                          <button
                            onClick={() => handleToggleSection(section.id, section.enabled)}
                            className={`p-2 rounded hover:bg-gray-100 ${
                              section.enabled ? 'text-green-600' : 'text-gray-400'
                            }`}
                            title={section.enabled ? 'Hide section' : 'Show section'}
                          >
                            {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>

                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveSection(section.id, 'down')}
                            disabled={index === sortedSections.length - 1}
                            className="p-2 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditSection(section)}
                            className="p-2 rounded hover:bg-gray-100 text-blue-600"
                            title="Edit section"
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicateSection(section)}
                            className="p-2 rounded hover:bg-gray-100 text-green-600"
                            title="Duplicate section"
                          >
                            <Copy size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSection(section.id, section.title)}
                            className="p-2 rounded hover:bg-gray-100 text-red-600"
                            title="Delete section"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {sections.filter(s => s.enabled).length} of {sections.length} components visible
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => saveLayout()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
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
  );
}
