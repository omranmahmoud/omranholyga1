import { Smartphone } from 'lucide-react';
import { ManageMobileBanners } from '../Mobile/ManageMobileBanners';

export const mobileSection = {
  label: 'Mobile',
  items: [
    { name: 'Mobile Banners', icon: Smartphone, path: '/admin/mobile/banners', component: ManageMobileBanners },
    // Add more mobile management items here
  ]
};
