
// Core Components
export { default as App } from './App';

// Layout Components
export { MainLayout } from './components/Layout/MainLayout';
export { AdminLayout } from './components/Admin/Layout/AdminLayout';

// Auth Components
export { LoginPage } from './components/Auth/LoginPage';
export { RegisterPage } from './components/Auth/RegisterPage';
export { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Hero Components
export { Hero as HeroComponent } from './components/Hero';
export { Background } from './components/Hero/Background';
export { Badge } from './components/Hero/Badge';
export { AdLine } from './components/Hero/AdLine';
export { MarqueeText } from './components/Hero/MarqueeText';
export { TrustBadges } from './components/Hero/TrustBadges';

// Featured Components
export { Featured } from './components/Featured/Featured';
export { ProductCard } from './components/Featured/ProductCard';
export { ProductGallery } from './components/Featured/ProductGallery';
export { ProductInfo } from './components/Featured/ProductInfo';
export { ProductVariants } from './components/Featured/ProductVariants';
export { RelatedProducts } from './components/Featured/RelatedProducts';

// Product Components
export { ProductGrid } from './components/ProductGrid/ProductGrid';
export { FilterBar } from './components/ProductGrid/FilterBar';

// Cart Components
export { Cart } from './components/Cart/Cart';
export { CartItems } from './components/Cart/CartItems';
export { CartSummary } from './components/Cart/CartSummary';
export { CheckoutModal } from './components/Cart/CheckoutModal';
export { EmptyCart } from './components/Cart/EmptyCart';
export { GiftCardRedemption } from './components/GiftCard/GiftCardRedemption';

// Admin Components
export { ShippingManager } from './components/Admin/Shipping/ShippingManager';
export { InventoryManager } from './components/Admin/Inventory/InventoryManager';
export { GiftCardManager } from './components/Admin/GiftCards/GiftCardManager';
export { CouponManager } from './components/Admin/Coupons/CouponManager';
export { AnnouncementManager } from './components/Admin/Announcements/AnnouncementManager';
export { BackgroundManager } from './components/Admin/Background/BackgroundManager';
export { FooterManagement } from './components/Admin/Footer/FooterManagement';

// Design Components
export { DesignHub } from './components/Admin/Design/DesignHub';
export { StoreThemeDesigner } from './components/Admin/Design/StoreThemeDesigner';
export { VisualStoreBuilder } from './components/Admin/Design/EnhancedVisualStoreBuilder';
export { HomepageSliders } from './components/Homepage/HomepageSliders';
export { CarouselWithSideBanners } from './components/Homepage/CarouselWithSideBanners';
export { HomepageSideCategoryBanners } from './components/Homepage/HomepageSideCategoryBanners';
export { DesignPreviewDemo } from './components/Admin/Design/DesignPreviewDemo';

// Common Components
export { LoadingSpinner } from './components/LoadingSpinner';
export { ErrorBoundary } from './components/ErrorBoundary';
export { ErrorFallback } from './components/ErrorFallback';
export { ScrollToTop } from './components/Common/ScrollToTop';
export { UserIcon } from './components/Common/UserIcon';
export { WhatsAppButton } from './components/Common/WhatsAppButton';

// Context Providers
export { AuthProvider, useAuth } from './context/AuthContext';
export { StoreProvider, useStore } from './context/store';
export { CartProvider, useCart } from './context/CartContext';
export { WishlistProvider, useWishlist } from './context/WishlistContext';
export { CurrencyProvider, useCurrency } from './context/CurrencyContext';
export { BackgroundProvider, useBackground } from './context/BackgroundContext';

// Hooks
export { useGeolocation } from './hooks/useGeolocation';
export { useDebounce } from './hooks/useDebounce';
export { useInventory } from './hooks/useInventory';
export { useShipping } from './hooks/useShipping';

// Services
export { default as api } from './services/api';
export { storeService } from './services/storeService';
export { shippingService } from './services/shippingService';
export { inventoryService } from './services/inventoryService';
export { deliveryService } from './services/deliveryService';
export { uploadToCloudinary } from './services/cloudinary';

// Types
export type { Hero, StoreSettings, Announcement } from './types/store';
export type { ShippingZone, ShippingRate } from './types/shipping';
export type { CurrencyCode, CurrencyDetails } from './types/currency';
export type { 
  DeliveryCompany, 
  DeliveryOrder, 
  DeliveryStatus,
  FieldMapping,
  DeliveryStatistics 
} from './types/delivery';

// Utilities
export { formatPrice, convertPrice, getCurrencySymbol } from './utils/currency';
export { validateShippingZone, validateShippingRate } from './utils/shippingValidation';
export { calculateShippingFee, formatShippingEstimate } from './utils/shippingCalculation';
export { validatePrice, formatPriceForDisplay } from './utils/priceValidation';
export { withRetry } from './utils/retry';
export { reverseGeocode, getCountryCurrency } from './utils/geolocation';

// i18n
export { default as i18n } from './i18n/config';
