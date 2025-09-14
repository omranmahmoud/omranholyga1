import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings } = useStore();

  useEffect(() => {
    console.log('ThemeProvider: Settings changed', settings);
    if (settings) {
      const root = document.documentElement;
      
      // Apply theme colors as CSS variables
      if (settings.primaryColor) {
        console.log('Applying primary color:', settings.primaryColor);
        root.style.setProperty('--color-primary', settings.primaryColor);
      }
      if (settings.secondaryColor) {
        console.log('Applying secondary color:', settings.secondaryColor);
        root.style.setProperty('--color-secondary', settings.secondaryColor);
      }
      if (settings.accentColor) {
        root.style.setProperty('--color-accent', settings.accentColor);
      }
      if (settings.textColor) {
        root.style.setProperty('--color-text', settings.textColor);
      }
      if (settings.backgroundColor) {
        root.style.setProperty('--color-background', settings.backgroundColor);
      }
      
      // Apply font family
      if (settings.fontFamily) {
        root.style.setProperty('--font-family', settings.fontFamily);
      }
      
      // Apply border radius (supports tokens like 'medium' or direct px values like '12px')
      if (settings.borderRadius) {
        const val = settings.borderRadius.trim();
        const radiusMap = {
          'none': '0px',
          'small': '4px',
          'medium': '8px',
          'large': '12px',
          'xl': '16px'
        } as const;
        const resolved = val.endsWith('px') ? val : (radiusMap[val as keyof typeof radiusMap] ?? '8px');
        root.style.setProperty('--border-radius', resolved);
      }
      
      // Apply button style
      if (settings.buttonStyle) {
        const buttonRadiusMap = {
          'square': '0px',
          'rounded': '8px',
          'pill': '9999px'
        } as const;
        const resolved = buttonRadiusMap[settings.buttonStyle as keyof typeof buttonRadiusMap] ?? '8px';
        root.style.setProperty('--button-radius', resolved);
      }
      
      console.log('ThemeProvider: Applied all CSS variables to root');
    }
  }, [settings]);

  return <>{children}</>;
}
