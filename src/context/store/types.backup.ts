// Clean backup of store context types including productGridStyle
export interface Hero {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  isActive: boolean;
}

export interface StoreSettings {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  timezone: string;
  logo: string | null;
  // Design settings
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  buttonStyle?: 'rounded' | 'square' | 'pill';
  // Layout settings
  headerLayout?: 'classic' | 'modern' | 'minimal';
  footerStyle?: 'simple' | 'detailed' | 'newsletter';
  productCardStyle?: 'modern' | 'classic' | 'minimal';
  productGridStyle?: 'standard' | 'compact' | 'masonry';
  // Social media
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
  };
  // SEO settings
  siteTitle?: string;
  siteDescription?: string;
  keywords?: string[];
  // Analytics
  facebookPixel?: {
    pixelId: string;
    enabled: boolean;
  };
  googleAnalytics?: {
    trackingId: string;
    enabled: boolean;
  };
}

export interface Announcement {
  _id: string;
  text: string;
  icon: string;
  isActive: boolean;
}

export interface StoreState {
  hero: Hero | null;
  settings: StoreSettings | null;
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

export interface StoreActions {
  updateHero: (data: Partial<Hero>) => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

export type StoreContextType = StoreState & StoreActions;
```