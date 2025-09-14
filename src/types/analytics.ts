export interface AnalyticsConfig {
  facebookPixel?: {
    pixelId: string;
    enabled: boolean;
  };
  // Add other analytics configurations here
}

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}
