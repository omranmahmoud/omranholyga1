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
  // Wide panel (mega menu) typography
  navPanelHeaderColor?: string;
  navPanelFontColor?: string;
  navPanelAccentColor?: string; // borders/rings
  navPanelColumnActiveBgColor?: string; // left list active bg
  // Navigation categories typography
  navCategoryFontColor?: string; // hex or CSS color
  navCategoryFontSize?: 'small' | 'medium' | 'large';
  borderRadius?: string;
  buttonStyle?: 'rounded' | 'square' | 'pill';
  // Buttons
  addToCartBgColor?: string; // background color for Add to Cart buttons
  
  // Layout settings
  headerLayout?: 'classic' | 'modern' | 'minimal';
  footerStyle?: 'simple' | 'detailed' | 'newsletter';
  productCardStyle?: 'modern' | 'classic' | 'minimal';
  productGridStyle?: 'standard' | 'compact' | 'masonry' | 'list' | 'wide' | 'gallery' | 'carousel';
  // Header colors
  headerBackgroundColor?: string; // empty/undefined -> default theme
  headerTextColor?: string;
  // Header icons (overrides)
  headerIcons?: {
    wishlist?: string; // URL or /uploads path
    cart?: string;
    user?: string;
  };
  
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
  // Payments
  paypalConfig?: {
    enabled: boolean;
    clientId: string;
    mode: 'sandbox' | 'live';
  };

  // Auth providers
  googleAuth?: {
    enabled: boolean;
    clientId: string;
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
    secretPreview?: string; // masked only
  };
  facebookAuth?: {
    enabled: boolean;
    appId: string;
    webAppId?: string;
    iosAppId?: string;
    androidAppId?: string;
    secretPreview?: string; // masked only
  };

  // Featured product to display in "New In" tile
  featuredNewProductId?: string | null;
}

export interface Hero {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  video?: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  isActive: boolean;
}

export interface Announcement {
  _id: string;
  text: string;
  icon: string;
  isActive: boolean;
  url?: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  description?: string;
}
// (other types below)
