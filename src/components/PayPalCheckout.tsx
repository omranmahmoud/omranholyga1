import React, { useCallback, useEffect, useRef, useState } from 'react';
// Dynamically load PayPal JS SDK
// Usage: <PayPalCheckout total={123.45} currency="USD" onSuccess={data=>...} />

interface PayPalCheckoutProps {
  total: number;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (err: any) => void;
}

// You must set VITE_PAYPAL_CLIENT_ID in .env for web build
const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ total, currency = 'USD', onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSdk = useCallback(() => {
    if (window.paypal) { setLoaded(true); return; }
    if (!clientId) { setError('Missing PayPal Client ID'); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Failed to load PayPal SDK');
    document.head.appendChild(script);
  }, [currency]);

  useEffect(() => { loadSdk(); }, [loadSdk]);

  useEffect(() => {
    if (!loaded || !window.paypal || !containerRef.current) return;

    try {
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total, currency })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Create order failed');
          return data.id;
        },
        onApprove: async (data: any) => {
          try {
            const res = await fetch(`/api/paypal/orders/${data.orderID}/capture`, { method: 'POST' });
            const details = await res.json();
            if (!res.ok) throw new Error(details.message || 'Capture failed');
            onSuccess?.(details);
          } catch (e:any) {
            setError(e.message);
            onError?.(e);
          }
        },
        onError: (err: any) => {
          setError('Payment error');
          onError?.(err);
        }
      }).render(containerRef.current);
    } catch (e:any) {
      setError(e.message);
    }
  }, [loaded, total, currency]);

  if (error) return <div style={{ color:'#dc2626', fontSize:12 }}>PayPal: {error}</div>;
  return <div ref={containerRef} />;
};

export default PayPalCheckout;
