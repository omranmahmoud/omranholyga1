import React from 'react';
import { useStore } from '../context/StoreContext';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  const { settings } = useStore();

  if (settings?.logo) {
    return (
      <img 
        src={settings.logo} 
        alt="Store Logo" 
        className={`h-full w-auto ${className}`}
      />
    );
  }

  // No logo available, render nothing (or you can return null or a minimal placeholder if desired)
  return null;
}