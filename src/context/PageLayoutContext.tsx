import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PageSection {
  id: string;
  type: 'hero' | 'featured' | 'categories' | 'products' | 'text' | 'image' | 'testimonials' | 'banner' | 'countdown' | 'newsletter' | 'video' | 'social' | 'faq' | 'contact' | 'gallery' | 'blog' | 'team' | 'stats' | 'pricing' | 'features' | 'timeline' | 'map' | 'search' | 'reviews' | 'brands' | 'accordion' | 'tabs' | 'carousel' | 'comparison' | 'cta' | 'divider' | 'spacer' | 'breadcrumb' | 'alert' | 'progress' | 'chat' | 'calendar' | 'sliders' | 'side-banners' | 'carousel-with-side-banners' | 'new-arrivals';
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

interface PageLayoutContextType {
  sections: PageSection[];
  setSections: (sections: PageSection[]) => void;
  updateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  addSection: (section: PageSection) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (sections: PageSection[]) => void;
  saveLayout: () => Promise<void>;
  loadLayout: () => Promise<void>;
  isLoading: boolean;
}

const PageLayoutContext = createContext<PageLayoutContextType | undefined>(undefined);

export function usePageLayout() {
  const context = useContext(PageLayoutContext);
  if (!context) {
    throw new Error('usePageLayout must be used within a PageLayoutProvider');
  }
  return context;
}

interface PageLayoutProviderProps {
  children: ReactNode;
}

export function PageLayoutProvider({ children }: PageLayoutProviderProps) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default layout for new stores
  const defaultLayout: PageSection[] = [
    {
      id: 'hero-default',
      type: 'hero',
      title: 'Hero Banner',
      enabled: true,
      order: 0,
      settings: {
        showOverlay: true,
        overlayOpacity: 50,
        textAlignment: 'center',
        backgroundColor: '#1F2937',
        title: 'Welcome to Our Store',
        subtitle: 'Discover amazing products at great prices',
        buttonText: 'Shop Now',
        buttonLink: '/products'
      },
      animations: {
        entrance: 'fadeIn',
        duration: 1000,
        delay: 0
      }
    },
    {
      id: 'featured-default',
      type: 'featured',
      title: 'Featured Products',
      enabled: true,
      order: 1,
      settings: {
        itemsPerRow: 4,
        showDescription: true,
        showPrice: true,
        backgroundColor: '#FFFFFF',
        title: 'Featured Products',
        subtitle: 'Check out our best-selling items'
      },
      animations: {
        entrance: 'slideUp',
        duration: 800,
        delay: 200
      }
    },
    {
      id: 'categories-default',
      type: 'categories',
      title: 'Product Categories',
      enabled: true,
      order: 2,
      settings: {
        displayStyle: 'grid',
        itemsPerRow: 6,
        showNames: true,
        backgroundColor: '#F9FAFB',
        title: 'Shop by Category',
        subtitle: 'Browse our product categories'
      },
      animations: {
        entrance: 'fadeInUp',
        duration: 600,
        delay: 400
      }
    }
  ];

  // Load layout from localStorage or API
  const loadLayout = async () => {
    setIsLoading(true);
    try {
      // First try to load from localStorage
      const savedLayout = localStorage.getItem('store-page-layout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        setSections(parsedLayout);
      } else {
        // Use default layout
        setSections(defaultLayout);
        // Save default layout
        localStorage.setItem('store-page-layout', JSON.stringify(defaultLayout));
      }
    } catch (error) {
      console.error('Failed to load page layout:', error);
      setSections(defaultLayout);
    } finally {
      setIsLoading(false);
    }
  };

  // Save layout to localStorage and API
  const saveLayout = async () => {
    try {
      // Save to localStorage immediately
      localStorage.setItem('store-page-layout', JSON.stringify(sections));
      
      // TODO: Also save to API/database
      // await api.post('/api/store/layout', { sections });
      
      console.log('Page layout saved successfully');
    } catch (error) {
      console.error('Failed to save page layout:', error);
      throw error;
    }
  };

  // Update a specific section
  const updateSection = (sectionId: string, updates: Partial<PageSection>) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )
    );
  };

  // Add a new section
  const addSection = (section: PageSection) => {
    setSections(prev => [...prev, section]);
  };

  // Remove a section
  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  // Reorder sections
  const reorderSections = (newSections: PageSection[]) => {
    setSections(newSections);
  };

  // Load layout on mount
  useEffect(() => {
    loadLayout();
  }, []);

  // Auto-save when sections change (debounced)
  useEffect(() => {
    if (!isLoading && sections.length > 0) {
      const timer = setTimeout(() => {
        saveLayout();
      }, 1000); // Save 1 second after last change

      return () => clearTimeout(timer);
    }
  }, [sections, isLoading]);

  const value: PageLayoutContextType = {
    sections,
    setSections,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    saveLayout,
    loadLayout,
    isLoading
  };

  return (
    <PageLayoutContext.Provider value={value}>
      {children}
    </PageLayoutContext.Provider>
  );
}
