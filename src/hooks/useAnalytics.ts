import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { facebookPixel } from '../services/analytics/facebookPixel';

export function useAnalytics() {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    facebookPixel.trackEvent('PageView');
  }, [location.pathname]);

  const trackEvent = (eventName: string, params?: object) => {
    facebookPixel.trackEvent(eventName, params);
  };

  const trackCustomEvent = (eventName: string, params?: object) => {
    facebookPixel.trackCustomEvent(eventName, params);
  };

  return {
    trackEvent,
    trackCustomEvent
  };
}
