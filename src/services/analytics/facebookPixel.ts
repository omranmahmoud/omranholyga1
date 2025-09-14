export interface FacebookPixelConfig {
  pixelId: string;
  enabled: boolean;
}

class FacebookPixelService {
  private config: FacebookPixelConfig | null = null;

  init(config: FacebookPixelConfig) {
    this.config = config;
    if (config.enabled) {
      this.loadPixelScript(config.pixelId);
    }
  }

  private loadPixelScript(pixelId: string) {
    // Initialize Facebook Pixel
    const script = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;

    // Create and append script element
    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = script;
    document.head.appendChild(scriptElement);

    // Add noscript pixel
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);
  }

  trackEvent(eventName: string, params?: object) {
    if (!this.config?.enabled) return;
    
    if (typeof window.fbq !== 'function') {
      console.warn('Facebook Pixel not initialized');
      return;
    }

    window.fbq('track', eventName, params);
  }

  trackCustomEvent(eventName: string, params?: object) {
    if (!this.config?.enabled) return;
    
    if (typeof window.fbq !== 'function') {
      console.warn('Facebook Pixel not initialized');
      return;
    }

    window.fbq('trackCustom', eventName, params);
  }
}

export const facebookPixel = new FacebookPixelService();
