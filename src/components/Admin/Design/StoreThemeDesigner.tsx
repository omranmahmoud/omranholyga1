import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Palette, Type, Layout, Monitor, Eye, Undo, Redo,
  Download, Upload, Brush, Layers, Smartphone, Tablet,
  Zap, Sparkles, RefreshCw, Copy, Check, Settings,
  Sliders, Shuffle, TrendingUp
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { HomepagePositions } from './HomepagePositions';

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
  };
  layout: {
    headerLayout: string;
    footerStyle: string;
    productCardStyle: string;
    borderRadius: string;
    buttonStyle: string;
  };
}

interface DesignHistory {
  id: string;
  timestamp: Date;
  settings: any;
  description: string;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

interface FontPair {
  id: string;
  name: string;
  heading: string;
  body: string;
  description: string;
}

export function StoreThemeDesigner() {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<DesignHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [realtimePreview, setRealtimePreview] = useState(true);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveInProgress = useRef(false);

  const [designState, setDesignState] = useState({
    primaryColor: settings?.primaryColor || '#4F46E5',
    secondaryColor: settings?.secondaryColor || '#10B981',
    accentColor: settings?.accentColor || '#F59E0B',
    textColor: settings?.textColor || '#1F2937',
    backgroundColor: settings?.backgroundColor || '#FFFFFF',
    fontFamily: settings?.fontFamily || 'Inter',
    headerLayout: settings?.headerLayout || 'modern',
    footerStyle: settings?.footerStyle || 'detailed',
    productCardStyle: settings?.productCardStyle || 'modern',
    borderRadius: settings?.borderRadius || 'medium',
    buttonStyle: settings?.buttonStyle || 'rounded',
    headingFont: (settings as any)?.headingFont || 'Inter',
    bodyFont: (settings as any)?.bodyFont || 'Inter',
    fontSize: (settings as any)?.fontSize || 'medium',
    lineHeight: (settings as any)?.lineHeight || 'normal',
    letterSpacing: (settings as any)?.letterSpacing || 'normal',
    fontWeight: (settings as any)?.fontWeight || 'normal',
  // Nav categories typography
  navCategoryFontColor: (settings as any)?.navCategoryFontColor || '#374151',
  navCategoryFontSize: (settings as any)?.navCategoryFontSize || 'medium',
  // Wide panel colors
  navPanelHeaderColor: (settings as any)?.navPanelHeaderColor || '#ea580c',
  navPanelFontColor: (settings as any)?.navPanelFontColor || '#111827',
  navPanelAccentColor: (settings as any)?.navPanelAccentColor || '#e5e7eb',
  navPanelColumnActiveBgColor: (settings as any)?.navPanelColumnActiveBgColor || '#f3f4f6',
  headerBackgroundColor: (settings as any)?.headerBackgroundColor || '',
  headerTextColor: (settings as any)?.headerTextColor || '',
  addToCartBgColor: (settings as any)?.addToCartBgColor || '#4f46e5',
  headerIcons: (settings as any)?.headerIcons || { wishlist: '', cart: '', user: '' },
  });

  // Optional: helper to upload an icon file and set URL
  const uploadIcon = useCallback(async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.postWithRetry('/uploads/icons', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res?.data as { url: string; path: string };
  }, []);

  // Color palettes for quick selection
  const colorPalettes: ColorPalette[] = [
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      colors: ['#3B82F6', '#1E40AF', '#60A5FA', '#1F2937', '#F8FAFC'],
      description: 'Professional and trustworthy'
    },
    {
      id: 'warm-sunset',
      name: 'Warm Sunset',
      colors: ['#F59E0B', '#DC2626', '#FB923C', '#1F2937', '#FFFBEB'],
      description: 'Energetic and welcoming'
    },
    {
      id: 'nature-green',
      name: 'Nature Green',
      colors: ['#10B981', '#059669', '#34D399', '#064E3B', '#F0FDF4'],
      description: 'Fresh and organic feel'
    },
    {
      id: 'luxury-purple',
      name: 'Luxury Purple',
      colors: ['#8B5CF6', '#7C3AED', '#A78BFA', '#1F2937', '#FAF5FF'],
      description: 'Premium and sophisticated'
    },
    {
      id: 'minimalist-gray',
      name: 'Minimalist Gray',
      colors: ['#6B7280', '#374151', '#9CA3AF', '#111827', '#F9FAFB'],
      description: 'Clean and timeless'
    },
    {
      id: 'vibrant-pink',
      name: 'Vibrant Pink',
      colors: ['#EC4899', '#BE185D', '#F472B6', '#1F2937', '#FDF2F8'],
      description: 'Bold and creative'
    }
  ];

  // Font pairings for typography
  const fontPairs: FontPair[] = [
    {
      id: 'modern-sans',
      name: 'Modern Sans',
      heading: 'Inter',
      body: 'Inter',
      description: 'Clean and professional'
    },
    {
      id: 'elegant-serif',
      name: 'Elegant Serif',
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
      description: 'Sophisticated and readable'
    },
    {
      id: 'friendly-rounded',
      name: 'Friendly Rounded',
      heading: 'Poppins',
      body: 'Nunito',
      description: 'Approachable and modern'
    },
    {
      id: 'tech-corporate',
      name: 'Tech Corporate',
      heading: 'Montserrat',
      body: 'Roboto',
      description: 'Professional and technical'
    },
    {
      id: 'creative-display',
      name: 'Creative Display',
      heading: 'Raleway',
      body: 'Lato',
      description: 'Artistic and expressive'
    }
  ];

  // Real-time preview update
  useEffect(() => {
    if (realtimePreview && autoSave && !autoSaveInProgress.current) {
      const timeoutId = setTimeout(async () => {
        try {
          autoSaveInProgress.current = true;
          await updateSettings(designState);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          autoSaveInProgress.current = false;
        }
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [designState, realtimePreview, autoSave]); // Removed updateSettings from deps to prevent infinite loop

  // Copy color to clipboard
  const copyColor = useCallback(async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      toast.success(`Copied ${color} to clipboard!`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      toast.error('Failed to copy color');
    }
  }, []);

  // Apply color palette
  const applyColorPalette = useCallback(async (palette: ColorPalette) => {
    const newDesignState = {
      ...designState,
      primaryColor: palette.colors[0],
      secondaryColor: palette.colors[1],
      accentColor: palette.colors[2],
      textColor: palette.colors[3],
      backgroundColor: palette.colors[4],
  };
    setDesignState(newDesignState);
    addToHistory(`Applied ${palette.name} color palette`);
    
    // Immediately save the palette changes
    try {
      console.log('Saving color palette data:', newDesignState);
      await updateSettings(newDesignState);
      toast.success(`${palette.name} palette applied and saved!`);
    } catch (error) {
      console.error('Failed to save palette:', error);
      toast.error(`${palette.name} palette applied but failed to save`);
    }
  }, [designState, updateSettings]);

  // Apply font pair
  const applyFontPair = useCallback((fontPair: FontPair) => {
    const newDesignState = {
      ...designState,
      headingFont: fontPair.heading,
      bodyFont: fontPair.body,
      fontFamily: fontPair.body, // For backward compatibility
    };
    setDesignState(newDesignState);
    addToHistory(`Applied ${fontPair.name} font pairing`);
    toast.success(`${fontPair.name} fonts applied!`);
  }, [designState]);

  // Generate random theme
  const generateRandomTheme = useCallback(() => {
    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const randomFontPair = fontPairs[Math.floor(Math.random() * fontPairs.length)];
    
    const newDesignState = {
      ...designState,
      primaryColor: randomPalette.colors[0],
      secondaryColor: randomPalette.colors[1],
      accentColor: randomPalette.colors[2],
      textColor: randomPalette.colors[3],
      backgroundColor: randomPalette.colors[4],
      headingFont: randomFontPair.heading,
      bodyFont: randomFontPair.body,
      fontFamily: randomFontPair.body,
    };
    setDesignState(newDesignState);
    addToHistory('Generated random theme');
    toast.success('Random theme generated!');
  }, [designState, colorPalettes, fontPairs]);

  const themeTemplates: ThemeTemplate[] = [
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, contemporary design with subtle shadows',
      preview: '/themes/modern-minimal.jpg',
      colors: {
        primary: '#1F2937',
        secondary: '#6366F1',
        accent: '#F59E0B',
        text: '#111827',
        background: '#FFFFFF'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 'medium'
      },
      layout: {
        headerLayout: 'minimal',
        footerStyle: 'simple',
        productCardStyle: 'minimal',
        borderRadius: 'large',
        buttonStyle: 'rounded'
      }
    },
    {
      id: 'vibrant-modern',
      name: 'Vibrant Modern',
      description: 'Bold colors with modern aesthetics',
      preview: '/themes/vibrant-modern.jpg',
      colors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#F97316',
        text: '#1F2937',
        background: '#FFFFFF'
      },
      typography: {
        fontFamily: 'Poppins',
        fontSize: 'medium'
      },
      layout: {
        headerLayout: 'modern',
        footerStyle: 'detailed',
        productCardStyle: 'modern',
        borderRadius: 'medium',
        buttonStyle: 'rounded'
      }
    },
    {
      id: 'elegant-classic',
      name: 'Elegant Classic',
      description: 'Timeless design with sophisticated typography',
      preview: '/themes/elegant-classic.jpg',
      colors: {
        primary: '#92400E',
        secondary: '#059669',
        accent: '#DC2626',
        text: '#1F2937',
        background: '#FFFBEB'
      },
      typography: {
        fontFamily: 'Playfair Display',
        fontSize: 'large'
      },
      layout: {
        headerLayout: 'classic',
        footerStyle: 'detailed',
        productCardStyle: 'classic',
        borderRadius: 'small',
        buttonStyle: 'square'
      }
    },
    {
      id: 'dark-premium',
      name: 'Dark Premium',
      description: 'Luxurious dark theme for premium brands',
      preview: '/themes/dark-premium.jpg',
      colors: {
        primary: '#F59E0B',
        secondary: '#10B981',
        accent: '#EF4444',
        text: '#F9FAFB',
        background: '#111827'
      },
      typography: {
        fontFamily: 'Montserrat',
        fontSize: 'medium'
      },
      layout: {
        headerLayout: 'modern',
        footerStyle: 'newsletter',
        productCardStyle: 'modern',
        borderRadius: 'medium',
        buttonStyle: 'pill'
      }
    },
    {
      id: 'fresh-organic',
      name: 'Fresh & Organic',
      description: 'Natural colors perfect for organic/eco brands',
      preview: '/themes/fresh-organic.jpg',
      colors: {
        primary: '#059669',
        secondary: '#0D9488',
        accent: '#F59E0B',
        text: '#064E3B',
        background: '#F0FDF4'
      },
      typography: {
        fontFamily: 'Nunito',
        fontSize: 'medium'
      },
      layout: {
        headerLayout: 'modern',
        footerStyle: 'detailed',
        productCardStyle: 'modern',
        borderRadius: 'large',
        buttonStyle: 'rounded'
      }
    },
    {
      id: 'tech-corporate',
      name: 'Tech Corporate',
      description: 'Professional design for B2B and tech companies',
      preview: '/themes/tech-corporate.jpg',
      colors: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        text: '#1F2937',
        background: '#F8FAFC'
      },
      typography: {
        fontFamily: 'Source Sans Pro',
        fontSize: 'medium'
      },
      layout: {
        headerLayout: 'modern',
        footerStyle: 'detailed',
        productCardStyle: 'modern',
        borderRadius: 'small',
        buttonStyle: 'square'
      }
    }
  ];

  // Add to history when design changes
  const addToHistory = (description: string) => {
    const newHistoryItem: DesignHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      settings: { ...designState },
      description
    };

    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(newHistoryItem);
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1];
      setDesignState(previousState.settings);
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  };

  const redo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setDesignState(nextState.settings);
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  const applyTheme = (theme: ThemeTemplate) => {
    const newDesignState = {
      ...designState,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      accentColor: theme.colors.accent,
      textColor: theme.colors.text,
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fontFamily,
      headerLayout: theme.layout.headerLayout as 'classic' | 'modern' | 'minimal',
      footerStyle: theme.layout.footerStyle as 'simple' | 'detailed' | 'newsletter',
      productCardStyle: theme.layout.productCardStyle as 'classic' | 'modern' | 'minimal',
      borderRadius: theme.layout.borderRadius,
      buttonStyle: theme.layout.buttonStyle as 'rounded' | 'square' | 'pill'
    };
    setDesignState(newDesignState);
    addToHistory(`Applied ${theme.name} theme`);
    toast.success(`${theme.name} theme applied!`);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(designState);
      addToHistory('Saved design changes');
      toast.success('Design saved successfully!');
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  const exportTheme = () => {
    const themeData = {
      name: 'Custom Theme',
      timestamp: new Date().toISOString(),
      settings: designState
    };
    
    const dataStr = JSON.stringify(themeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'store-theme.json';
    link.click();
    
    toast.success('Theme exported successfully!');
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeData = JSON.parse(e.target?.result as string);
        setDesignState(themeData.settings);
        addToHistory(`Imported ${themeData.name || 'Custom'} theme`);
        toast.success('Theme imported successfully!');
      } catch (error) {
        toast.error('Invalid theme file');
      }
    };
    reader.readAsText(file);
  };

  const renderThemeTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Theme Templates</h3>
          <p className="text-sm text-gray-500">Choose from pre-designed themes or create your own</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importTheme}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themeTemplates.map((theme) => (
          <div key={theme.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Preview</p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex gap-1 mb-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.primary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.secondary }} />
                <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.accent }} />
              </div>
              
              <h4 className="font-medium text-gray-900 mb-1">{theme.name}</h4>
              <p className="text-sm text-gray-500 mb-3">{theme.description}</p>
              
              <button
                onClick={() => applyTheme(theme)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Apply Theme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomDesigner = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Custom Design</h3>
          <p className="text-sm text-gray-500">Fine-tune every aspect of your store's appearance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Auto-save
            </label>
            {lastSaved && (
              <span className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Real-time preview toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={realtimePreview}
                onChange={(e) => setRealtimePreview(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Zap className="w-4 h-4" />
              Real-time
            </label>
          </div>

          {/* Generate random theme */}
          <button
            onClick={generateRandomTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            Random
          </button>

          {/* History controls */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <button
              onClick={undo}
              disabled={currentHistoryIndex <= 0}
              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={currentHistoryIndex >= history.length - 1}
              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Palettes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Color Palettes
          </h4>
          <button className="text-sm text-indigo-600 hover:text-indigo-700">
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorPalettes.map((palette) => (
            <div
              key={palette.id}
              onClick={() => applyColorPalette(palette)}
              className="group cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex gap-1 mb-2">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                {palette.name}
              </div>
              <div className="text-xs text-gray-500">{palette.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Color Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Advanced Colors
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[ 
            { key: 'primaryColor', label: 'Primary Color', value: designState.primaryColor, description: 'Main brand color for buttons and highlights' },
            { key: 'secondaryColor', label: 'Secondary Color', value: designState.secondaryColor, description: 'Supporting color for accents' },
            { key: 'accentColor', label: 'Accent Color', value: designState.accentColor, description: 'Call-to-action and emphasis color' },
            { key: 'textColor', label: 'Text Color', value: designState.textColor, description: 'Primary text color' },
            { key: 'backgroundColor', label: 'Background Color', value: designState.backgroundColor, description: 'Main background color' },
            { key: 'headerBackgroundColor', label: 'Header Background Color', value: (designState as any).headerBackgroundColor, description: 'Site header background override (leave empty for default)' },
            { key: 'headerTextColor', label: 'Header Text Color', value: (designState as any).headerTextColor, description: 'Site header text color override (leave empty for default)' },
            { key: 'navPanelHeaderColor', label: 'Wide Panel Header Color', value: (designState as any).navPanelHeaderColor, description: 'Section title color in the mega menu' },
            { key: 'navPanelFontColor', label: 'Wide Panel Item Text Color', value: (designState as any).navPanelFontColor, description: 'Item label color in the mega menu' },
            { key: 'navPanelAccentColor', label: 'Wide Panel Accent Color', value: (designState as any).navPanelAccentColor, description: 'Borders, rings, and chevrons in the mega menu' },
            { key: 'navPanelColumnActiveBgColor', label: 'Left Column Active Background', value: (designState as any).navPanelColumnActiveBgColor, description: 'Background for the active item in the left list' },
            { key: 'addToCartBgColor', label: 'Add to Cart Background', value: (designState as any).addToCartBgColor, description: 'Background color for Add to Cart buttons site-wide' }
          ].map((color) => (
            <div key={color.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{color.label}</label>
                  <p className="text-xs text-gray-500">{color.description}</p>
                </div>
                <button
                  onClick={() => copyColor(color.value)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy color"
                >
                  {copiedColor === color.value ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={color.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, [color.key]: e.target.value }))}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                  />
                  <div 
                    className="absolute inset-1 rounded-md"
                    style={{ backgroundColor: color.value }}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={color.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, [color.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header Icons */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Header Icons
        </h4>
        <p className="text-sm text-gray-500 mb-4">Paste URLs or uploaded paths for custom icons. PNG/SVG recommended. Leave empty to use default icons.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'wishlist', label: 'Wishlist Icon URL', placeholder: '/uploads/icons/heart.svg' },
            { key: 'cart', label: 'Cart Icon URL', placeholder: '/uploads/icons/cart.svg' },
            { key: 'user', label: 'User Icon URL', placeholder: '/uploads/icons/user.svg' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
              <input
                type="text"
                value={(designState as any).headerIcons?.[f.key] || ''}
                onChange={(e) => setDesignState(prev => ({
                  ...prev,
                  headerIcons: { ...(prev as any).headerIcons, [f.key]: e.target.value }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={f.placeholder}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,image/svg+xml"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setLoading(true);
                      const uploaded = await uploadIcon(file);
                      setDesignState(prev => ({
                        ...prev,
                        headerIcons: { ...(prev as any).headerIcons, [f.key]: uploaded.path }
                      }));
                      toast.success('Icon uploaded');
                    } catch (err) {
                      toast.error('Upload failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </div>
              {(designState as any).headerIcons?.[f.key] && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={(designState as any).headerIcons?.[f.key]} alt={`${f.key} preview`} className="w-6 h-6 object-contain" />
                  <span className="text-xs text-gray-500 truncate">{(designState as any).headerIcons?.[f.key]}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await updateSettings({ headerIcons: (designState as any).headerIcons });
                toast.success('Header icons updated');
              } catch (e) {
                toast.error('Failed to save header icons');
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading}
          >
            <Save className="w-4 h-4" /> Save Icons
          </button>
        </div>
      </div>

  {/* Homepage Positions (Sliders and Side Banners) */}
  <HomepagePositions />

      {/* Typography Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typography & Fonts
          </h4>
          <button className="text-sm text-indigo-600 hover:text-indigo-700">
            Font Library
          </button>
        </div>

        {/* Font Pairings */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Font Pairings</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fontPairs.map((fontPair) => (
              <div
                key={fontPair.id}
                onClick={() => applyFontPair(fontPair)}
                className="group cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div 
                    className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600"
                    style={{ fontFamily: fontPair.heading }}
                  >
                    Heading
                  </div>
                  <div 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: fontPair.body }}
                  >
                    Body text example
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{fontPair.name}</div>
                  <div className="text-xs text-gray-500">{fontPair.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Categories Typography */}
        <div className="mt-8">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Navigation Categories Typography</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={designState.navCategoryFontColor}
                  onChange={(e) => setDesignState(prev => ({ ...prev, navCategoryFontColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                />
                <input
                  type="text"
                  value={designState.navCategoryFontColor}
                  onChange={(e) => setDesignState(prev => ({ ...prev, navCategoryFontColor: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="#374151"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <select
                value={designState.navCategoryFontSize}
                onChange={(e) => setDesignState(prev => ({ ...prev, navCategoryFontSize: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Typography Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
            <select
              value={designState.headingFont}
              onChange={(e) => setDesignState(prev => ({ ...prev, headingFont: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Poppins">Poppins</option>
              <option value="Lato">Lato</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Raleway">Raleway</option>
              <option value="Nunito">Nunito</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
            <select
              value={designState.bodyFont}
              onChange={(e) => setDesignState(prev => ({ ...prev, bodyFont: e.target.value, fontFamily: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Poppins">Poppins</option>
              <option value="Lato">Lato</option>
              <option value="Nunito">Nunito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={designState.fontSize}
              onChange={(e) => setDesignState(prev => ({ ...prev, fontSize: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
            <select
              value={designState.lineHeight}
              onChange={(e) => setDesignState(prev => ({ ...prev, lineHeight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tight">Tight</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout & Style Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Layout & Components
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Header Layout</label>
            <div className="space-y-3">
              {[
                { value: 'classic', label: 'Classic', description: 'Traditional layout with centered logo' },
                { value: 'modern', label: 'Modern', description: 'Clean layout with left-aligned logo' },
                { value: 'minimal', label: 'Minimal', description: 'Simplified header with minimal elements' }
              ].map(layout => (
                <label key={layout.value} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="headerLayout"
                    value={layout.value}
                    checked={designState.headerLayout === layout.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, headerLayout: e.target.value as any }))}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {layout.label}
                    </div>
                    <div className="text-xs text-gray-500">{layout.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Footer Style</label>
            <div className="space-y-3">
              {[
                { value: 'simple', label: 'Simple', description: 'Basic footer with essential links' },
                { value: 'detailed', label: 'Detailed', description: 'Comprehensive footer with multiple sections' },
                { value: 'newsletter', label: 'Newsletter', description: 'Footer focused on newsletter signup' }
              ].map(style => (
                <label key={style.value} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="footerStyle"
                    value={style.value}
                    checked={designState.footerStyle === style.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, footerStyle: e.target.value as any }))}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {style.label}
                    </div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Product Cards</label>
            <div className="space-y-3">
              {[
                { value: 'modern', label: 'Modern', description: 'Contemporary cards with subtle shadows' },
                { value: 'classic', label: 'Classic', description: 'Traditional card design' },
                { value: 'minimal', label: 'Minimal', description: 'Clean cards with minimal styling' }
              ].map(style => (
                <label key={style.value} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="productCardStyle"
                    value={style.value}
                    checked={designState.productCardStyle === style.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, productCardStyle: e.target.value as any }))}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {style.label}
                    </div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Featured New In Product */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Featured "New In" Product</label>
          <FeaturedNewInPicker />
        </div>

        {/* Border Radius and Button Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Border Radius</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'none', label: 'None' },
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' }
              ].map(radius => (
                <label key={radius.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="borderRadius"
                    value={radius.value}
                    checked={designState.borderRadius === radius.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, borderRadius: e.target.value }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{radius.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Button Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'rounded', label: 'Rounded' },
                { value: 'square', label: 'Square' },
                { value: 'pill', label: 'Pill' }
              ].map(style => (
                <label key={style.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="buttonStyle"
                    value={style.value}
                    checked={designState.buttonStyle === style.value}
                    onChange={(e) => setDesignState(prev => ({ ...prev, buttonStyle: e.target.value as any }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{style.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLivePreview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
            {realtimePreview && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">See how your changes look in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh preview */}
          <button
            onClick={() => {
              toast.success('Preview refreshed!');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {/* Device preview toggles */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-all ${
                previewMode === 'desktop' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Desktop preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-all ${
                previewMode === 'tablet' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Tablet preview"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-all ${
                previewMode === 'mobile' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Mobile preview"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Preview Container */}
      <div className="bg-gray-50 rounded-xl p-8 relative overflow-hidden">
        {/* Device frame indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border">
            {previewMode === 'desktop' && <Monitor className="w-4 h-4 text-gray-600" />}
            {previewMode === 'tablet' && <Tablet className="w-4 h-4 text-gray-600" />}
            {previewMode === 'mobile' && <Smartphone className="w-4 h-4 text-gray-600" />}
            <span className="text-sm text-gray-600 capitalize font-medium">
              {previewMode} Preview
            </span>
            <div className="flex items-center gap-1 ml-2 text-xs text-gray-400">
              {previewMode === 'desktop' && '1920×1080'}
              {previewMode === 'tablet' && '768×1024'}
              {previewMode === 'mobile' && '375×667'}
            </div>
          </div>
        </div>

        <div 
          className={`mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-500 ${
            previewMode === 'desktop' ? 'max-w-6xl' : 
            previewMode === 'tablet' ? 'max-w-2xl' : 'max-w-sm'
          }`}
          style={{
            color: designState.textColor,
            backgroundColor: designState.backgroundColor,
            fontFamily: designState.bodyFont || designState.fontFamily,
            transform: previewMode === 'mobile' ? 'scale(0.9)' : 'scale(1)',
          }}
        >
          {/* Enhanced Preview Header */}
          <div 
            className="px-6 py-4 border-b relative overflow-hidden"
            style={{ 
              backgroundColor: designState.primaryColor,
              color: designState.backgroundColor
            }}
          >
            <div className="flex items-center justify-between relative z-10">
              <h2 
                className="text-xl font-bold"
                style={{ fontFamily: designState.headingFont || designState.fontFamily }}
              >
                Your Store
              </h2>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-4 text-sm opacity-90">
                  <span>Home</span>
                  <span>Products</span>
                  <span>About</span>
                  <span>Contact</span>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${designState.secondaryColor}20` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: designState.secondaryColor }}></div>
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${designState.accentColor}20` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: designState.accentColor }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Header background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8" 
                   style={{ backgroundColor: designState.secondaryColor }}></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-4 -translate-x-4" 
                   style={{ backgroundColor: designState.accentColor }}></div>
            </div>
          </div>

          {/* Hero Section */}
          <div 
            className="relative px-6 py-12 text-center"
            style={{ backgroundColor: `${designState.backgroundColor}` }}
          >
            <div className="relative z-10">
              <h1 
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ 
                  fontFamily: designState.headingFont || designState.fontFamily,
                  color: designState.textColor 
                }}
              >
                Welcome to Our Store
              </h1>
              <p className="text-lg mb-8 opacity-80" style={{ color: designState.textColor }}>
                Discover amazing products with our new design
              </p>
              <button
                className={`px-8 py-3 font-semibold text-white transition-all hover:scale-105 ${
                  designState.buttonStyle === 'pill' ? 'rounded-full' :
                  designState.buttonStyle === 'square' ? 'rounded-none' : 'rounded-lg'
                }`}
                style={{ backgroundColor: designState.secondaryColor }}
              >
                Shop Now
              </button>
            </div>
            {/* Hero background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-10" 
                   style={{ backgroundColor: designState.primaryColor }}></div>
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full opacity-10" 
                   style={{ backgroundColor: designState.accentColor }}></div>
            </div>
          </div>

          {/* Enhanced Preview Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ 
                  fontFamily: designState.headingFont || designState.fontFamily,
                  color: designState.textColor 
                }}
              >
                Featured Products
              </h3>
              <div className={`grid gap-4 ${
                previewMode === 'mobile' ? 'grid-cols-1' : 
                previewMode === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`group bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-all ${
                      designState.borderRadius === 'none' ? 'rounded-none' :
                      designState.borderRadius === 'small' ? 'rounded' :
                      designState.borderRadius === 'large' ? 'rounded-xl' : 'rounded-lg'
                    }`}
                    style={{ backgroundColor: `${designState.backgroundColor}f8` }}
                  >
                    <div 
                      className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 mb-3 relative overflow-hidden"
                      style={{ 
                        borderRadius: designState.borderRadius === 'large' ? '12px' : 
                                    designState.borderRadius === 'small' ? '4px' : 
                                    designState.borderRadius === 'none' ? '0' : '8px'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br opacity-20"
                           style={{ 
                             background: `linear-gradient(135deg, ${designState.primaryColor}, ${designState.secondaryColor})` 
                           }}></div>
                    </div>
                    <h4 
                      className="font-medium text-sm mb-1 group-hover:text-opacity-80 transition-colors"
                      style={{ color: designState.textColor }}
                    >
                      Product {i}
                    </h4>
                    <p className="text-sm mb-3 opacity-70" style={{ color: designState.textColor }}>
                      Beautiful product description
                    </p>
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-bold"
                        style={{ color: designState.primaryColor }}
                      >
                        ${(29.99 * i).toFixed(2)}
                      </span>
                      <button
                        className={`px-4 py-2 text-sm text-white transition-all hover:scale-105 ${
                          designState.buttonStyle === 'pill' ? 'rounded-full' :
                          designState.buttonStyle === 'square' ? 'rounded-none' : 'rounded'
                        }`}
                        style={{ backgroundColor: designState.secondaryColor }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Section */}
            <div 
              className="rounded-xl p-6 text-center relative overflow-hidden"
              style={{ backgroundColor: `${designState.primaryColor}10` }}
            >
              <div className="relative z-10">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ 
                    fontFamily: designState.headingFont || designState.fontFamily,
                    color: designState.textColor 
                  }}
                >
                  Stay Updated
                </h3>
                <p className="text-sm mb-4 opacity-70" style={{ color: designState.textColor }}>
                  Subscribe to our newsletter for latest updates
                </p>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 rounded border border-gray-300 text-sm"
                    style={{ borderRadius: designState.borderRadius === 'large' ? '8px' : '4px' }}
                  />
                  <button
                    className={`px-4 py-2 text-sm text-white font-medium ${
                      designState.buttonStyle === 'pill' ? 'rounded-full' :
                      designState.buttonStyle === 'square' ? 'rounded-none' : 'rounded'
                    }`}
                    style={{ backgroundColor: designState.accentColor }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-4 translate-x-4"
                   style={{ backgroundColor: designState.accentColor }}></div>
            </div>
          </div>

          {/* Enhanced Preview Footer */}
          <div 
            className="px-6 py-8 border-t mt-8"
            style={{ 
              backgroundColor: designState.textColor, 
              color: designState.backgroundColor,
              borderColor: `${designState.textColor}20`
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 mb-4 text-sm opacity-80">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Contact Us</span>
              </div>
              <div className="text-sm opacity-60">
                © 2024 Your Store. All rights reserved.
              </div>
            </div>
          </div>
        </div>

        {/* Preview Controls Overlay */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={() => setRealtimePreview(!realtimePreview)}
              className={`p-2 rounded ${
                realtimePreview 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              } transition-colors`}
              title={realtimePreview ? 'Disable real-time preview' : 'Enable real-time preview'}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900">Performance Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-sm text-gray-600">85/100</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Real-time analysis of your theme's performance impact
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'themes', label: 'Theme Templates', icon: Layers, description: 'Pre-designed themes' },
    { id: 'custom', label: 'Custom Design', icon: Brush, description: 'Advanced customization' },
    { id: 'preview', label: 'Live Preview', icon: Eye, description: 'Real-time preview' },
    { id: 'advanced', label: 'Advanced', icon: Settings, description: 'Expert settings' }
  ];

  // Add advanced tab content
  const renderAdvancedTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings</h3>
        <p className="text-sm text-gray-500">Expert-level customization options</p>
      </div>

      {/* CSS Variables */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          CSS Variables
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Box Shadow</label>
              <input
                type="text"
                placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transition Duration</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="150ms">Fast (150ms)</option>
                <option value="300ms">Normal (300ms)</option>
                <option value="500ms">Slow (500ms)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance & Optimization
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Lazy Load Images</div>
              <div className="text-sm text-gray-500">Improve page load times</div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Preload Critical Fonts</div>
              <div className="text-sm text-gray-500">Reduce font loading flicker</div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Minimize CSS</div>
              <div className="text-sm text-gray-500">Compress stylesheets for production</div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Custom CSS</h4>
        <div className="space-y-4">
          <textarea
            placeholder="/* Add your custom CSS here */
.custom-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
}"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Custom CSS will be applied after theme styles
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              Validate CSS
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
            Store Theme Designer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Design and customize your store's appearance with real-time preview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme status indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Theme Active</span>
          </div>

          {/* Auto-save status */}
          {autoSave && lastSaved && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Auto-saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Design'}
          </button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-lg shadow-sm">
        <nav className="flex space-x-1 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'themes' && renderThemeTemplates()}
        {activeTab === 'custom' && renderCustomDesigner()}
        {activeTab === 'preview' && renderLivePreview()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>
    </div>
  );
}

function FeaturedNewInPicker() {
  const { settings, updateSettings } = useStore();
  const [options, setOptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const selected = (settings as any)?.featuredNewProductId || '';

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getWithRetry('/products', { params: { isNew: true } } as any);
        setOptions(res.data || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    await updateSettings({ featuredNewProductId: value });
  };

  return (
    <div className="flex items-center gap-3">
      <select
        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
        value={selected || ''}
        onChange={onChange}
        disabled={loading}
      >
        <option value="">Auto (icon or placeholder)</option>
        {options.map((p) => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>
      {selected && (
        <span className="text-xs text-gray-500">Saved</span>
      )}
    </div>
  );
}
