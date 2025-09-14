
import { useState, useEffect } from 'react';

export function useHeroAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return {
    isVisible,
    fadeInClass: isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
    transitionClass: 'transition-all duration-700 ease-out'
  };
}
