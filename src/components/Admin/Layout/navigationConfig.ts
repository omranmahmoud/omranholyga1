import {
  LayoutGrid, Users, Package, Settings, Truck, 
  Type, Palette, BoxIcon, Gift, Tag, BarChart3, Star,
  FolderTree, Menu, Layout, Brush, Image, UserPlus, History
} from 'lucide-react';

import { Dashboard } from '../Dashboard';
import { mobileSection } from './mobileSection';
import { Products } from '../Products';
import { Orders } from '../Orders';
import { AdminSettings } from '../AdminSettings';
import { Hero } from '../Hero';
import { FeaturedCollection } from '../FeaturedCollection';
import { Reviews } from '../Reviews';
import { Categories } from '../Categories';
import { NavigationCategories } from '../NavigationCategories';
import { FooterManagement } from '../Footer/FooterManagement';
import { DeliveryManagementHub } from '../DeliveryManagement/DeliveryManagementHub';
import { AnnouncementManager } from '../Announcements/AnnouncementManager';
import { BackgroundManager } from '../Background/BackgroundManager';
import { InventoryManager } from '../Inventory/InventoryManager';
import { GiftCardManager } from '../GiftCards/GiftCardManager';
import { CouponManager } from '../Coupons/CouponManager';
import { FlashSaleManager } from '../FlashSales/FlashSaleManager';
import { ShippingManager } from '../Shipping/ShippingManager';
import { AnalyticsSettings } from '../Analytics/AnalyticsSettings';
import { DesignHub } from '../Design/DesignHub';
import { Customers } from '../Customers/Customers';
import { WhatsAppAudits } from '../WhatsApp/WhatsAppAudits';
import { HomepageManager } from '../Homepage/HomepageManager';
import RecipientsList from '../Recipients/RecipientsList';
import WarehouseManager from '../WarehouseManager';

export const navigationConfig = [
  {
    label: 'General',
    items: [
      { name: 'Design Studio', icon: Brush, path: '/admin/design', component: DesignHub },
      { name: 'Dashboard', icon: LayoutGrid, path: '/admin', component: Dashboard },
      { name: 'Products', icon: Package, path: '/admin/products', component: Products },
      { name: 'Orders', icon: Users, path: '/admin/orders', component: Orders },
      { name: 'Customers', icon: UserPlus, path: '/admin/customers', component: Customers },
      { name: 'Recipients', icon: UserPlus, path: '/admin/recipients', component: RecipientsList }
    ]
  },
  {
    label: 'Content',
    items: [
  { name: 'Homepage', icon: Image, path: '/admin/homepage', component: HomepageManager },
      { name: 'Hero Section', icon: Image, path: '/admin/hero', component: Hero },
      { name: 'Featured', icon: Star, path: '/admin/featured', component: FeaturedCollection },
      { name: 'Categories', icon: FolderTree, path: '/admin/categories', component: Categories },
      { name: 'Navigation', icon: Menu, path: '/admin/navigation', component: NavigationCategories },
      { name: 'Footer', icon: Layout, path: '/admin/footer', component: FooterManagement },
      { name: 'Announcements', icon: Type, path: '/admin/announcements', component: AnnouncementManager },
      { name: 'Background', icon: Palette, path: '/admin/background', component: BackgroundManager }
    ]
  },
  {
    label: 'Sales',
    items: [
      { name: 'Inventory', icon: BoxIcon, path: '/admin/inventory', component: InventoryManager },
      { name: 'Warehouses', icon: Truck, path: '/admin/warehouses', component: WarehouseManager },
      { name: 'Gift Cards', icon: Gift, path: '/admin/gift-cards', component: GiftCardManager },
  { name: 'Coupons', icon: Tag, path: '/admin/coupons', component: CouponManager },
  { name: 'Flash Sales', icon: Tag, path: '/admin/flash-sales', component: FlashSaleManager }
    ]
  },
  {
    label: 'Shipping',
    items: [
      { name: 'Delivery', icon: Truck, path: '/admin/delivery', component: DeliveryManagementHub },
      { name: 'Shipping', icon: Truck, path: '/admin/shipping', component: ShippingManager }
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Analytics', icon: BarChart3, path: '/admin/analytics', component: AnalyticsSettings },
      { name: 'Reviews', icon: Star, path: '/admin/reviews', component: Reviews },
      { name: 'Settings', icon: Settings, path: '/admin/settings', component: AdminSettings },
      { name: 'WhatsApp Audits', icon: History, path: '/admin/whatsapp-audits', component: WhatsAppAudits }
    ]
  },
  mobileSection
];

// Flatten routes for easier access
export const AdminRoutes = navigationConfig.reduce((acc, section) => {
  return [...acc, ...section.items];
}, [] as typeof navigationConfig[0]['items']);
