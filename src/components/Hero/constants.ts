
import { Shield, Truck, RefreshCw } from 'lucide-react';

export const TRUST_BADGES = [
  { icon: Shield, value: '100%', label: 'Authentic Products' },
  { icon: Truck, value: 'Free', label: 'Global Shipping' },
  { icon: RefreshCw, value: '30 Days', label: 'Easy Returns' }
] as const;

export const ANIMATION_CLASSES = {
  fadeIn: 'animate-fadeIn',
  spinSlow: 'animate-spin-slow',
  shine: 'animate-shine',
  slide: 'animate-slide'
} as const;

export const GRADIENT_CLASSES = {
  primary: 'from-indigo-50 via-white to-white',
  text: 'from-violet-600 via-indigo-600 to-purple-600'
} as const;
