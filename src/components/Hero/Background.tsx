import React from 'react';
import { useBackground } from '../../context/BackgroundContext';

export function Background() {
  const { activeBackground } = useBackground();

  if (!activeBackground) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-10 -right-10 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute w-96 h-96 top-1/3 -left-10 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute w-96 h-96 bottom-0 right-1/3 bg-violet-200/30 rounded-full blur-3xl" />
      </div>
    );
  }

  const getBackgroundStyle = () => {
    switch (activeBackground.type) {
      case 'color':
        return { backgroundColor: activeBackground.value };
      case 'gradient':
  // Ensure value is a valid CSS gradient string, e.g., 'linear-gradient(...)'
  return { backgroundImage: activeBackground.value.replace(/^background:\s*/, '').replace(/;$/, '') };
      case 'pattern':
        return {
          backgroundImage: `url(${activeBackground.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden transition-all duration-500"
      style={getBackgroundStyle()}
    />
  );
}