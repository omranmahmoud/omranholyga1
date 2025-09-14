import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

// Lightweight PayPal loader (duplicated to keep component standalone)
const loadPayPalScript = (clientId: string) => new Promise<void>((resolve, reject) => {
  if ((window as any).paypal) return resolve();
  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons,hosted-fields&enable-funding=card&currency=USD`;
  s.async = true;
  s.onload = () => resolve();
  s.onerror = reject;
  document.body.appendChild(s);
});

export interface HostedCardFieldsHandle {
  submit: () => Promise<{ success: boolean; orderNumber?: string; error?: string }>; 
  ready: boolean;
  error: string | null;
}

interface Props {
  total: number;
  shippingData: {
    firstName: string; lastName: string; email: string; mobile: string; secondaryMobile?: string;
    country: string; address: string; city: string;
  };
  onOrderCreated?: (orderNumber: string) => void;
}

export const HostedCardFields = forwardRef<HostedCardFieldsHandle, Props>(function HostedCardFields({ total, shippingData, onOrderCreated }, ref) {
  const PAYPAL_CLIENT_ID = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || '';
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hostedFieldsInstance = useRef<any>(null);
  const { items, clearCart } = useCart();
  const { currency } = useCurrency();
  // removed initializing state (not needed for UI)

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!PAYPAL_CLIENT_ID) {
        console.warn('[Payment] Missing PayPal Client ID, card entry disabled');
        setError('missing_client_id');
        return;
      }
  // start init
      try {
        await loadPayPalScript(PAYPAL_CLIENT_ID);
        if (!mounted) return;
        if (!(window as any).paypal?.HostedFields) {
          setError('Hosted Fields API unavailable');
          return;
        }
        (window as any).paypal.HostedFields.render({
          createOrder: () => fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total, currency: 'USD' })
          }).then(r => r.json()).then(d => d.id),
          styles: {
            input: { 'font-size': '13px', color: '#222', 'font-family': 'inherit' },
            ':focus': { 'outline': 'none', 'border-color': '#111' },
            '.invalid': { 'color': '#dc2626' }
          },
          fields: {
            number: { selector: '#hcf-card-number', placeholder: 'Please enter card number' },
            cvv: { selector: '#hcf-cvv', placeholder: '3-4 digits' },
            expirationMonth: { selector: '#hcf-exp-month', placeholder: 'Month' },
            expirationYear: { selector: '#hcf-exp-year', placeholder: 'Year' }
          }
        }).then((hf: any) => {
          if (!mounted) return;
          hostedFieldsInstance.current = hf;
          setReady(true);
          try { hf.on('cardTypeChange', () => {}); } catch(_) {}
  }).catch((e: any) => {
          console.error('HostedFields init failed', e);
          setError('init_failed');
  });
      } catch (e) {
        console.error('PayPal script load error', e);
        setError('sdk_load_failed');
      }
    };
    init();
    return () => { mounted = false; };
  }, [PAYPAL_CLIENT_ID, total]);

  const submit = async (): Promise<{ success: boolean; orderNumber?: string; error?: string }> => {
    if (error) return { success:false, error };
    if (!ready || !hostedFieldsInstance.current) return { success:false, error: 'not_ready' };
    try {
      const submission = await hostedFieldsInstance.current.submit({ contingencies: ['3D_SECURE'] });
      const orderID = submission?.orderId || submission?.id;
      if (!orderID) throw new Error('missing_order_id');
      const capture = await api.postWithRetry('/paypal/card/authorize', { orderID });
      if (!(capture.data && ['COMPLETED','APPROVED'].includes(capture.data.status))) {
        return { success:false, error:'capture_failed' };
      }
      const orderPayload = {
        items: items.map(i => ({ product: i.id, quantity: i.quantity, size: i.size })),
        shippingAddress: { street: shippingData.address, city: shippingData.city, country: shippingData.country },
        paymentMethod: 'card',
        paymentStatus: 'completed',
        paymentReference: capture.data.id || '',
        customerInfo: {
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
            email: shippingData.email,
            mobile: shippingData.mobile,
            secondaryMobile: shippingData.secondaryMobile
        },
        currency
      };
      const res = await api.postWithRetry('/orders', orderPayload);
      const orderNumber = res.data.orderNumber || res.data?.order?.orderNumber || '';
      clearCart();
      toast.success('Order placed');
      onOrderCreated?.(orderNumber);
      return { success:true, orderNumber };
    } catch (e:any) {
      console.error('Card submit failed', e);
      toast.error(e?.message || 'Payment failed');
      return { success:false, error: e?.message || 'error' };
    }
  };

  useImperativeHandle(ref, () => ({ submit, ready, error }), [ready, error]);

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4 space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">Card Information <span className="text-gray-400">🔒</span></h3>
          <p className="text-[11px] text-gray-500">Your screenshot may contain private information. Please be careful not to share.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['visa','mastercard','amex','diners','discover','carnet','cabal','naps','jcb','unionpay','verve'].map(b => (
            <span key={b} className="px-2 py-1 bg-white border rounded text-[10px] font-medium uppercase tracking-wide text-gray-600 flex items-center justify-center h-6">{b}</span>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Card Number *</label>
            <div id="hcf-card-number" className="paypal-hosted-field h-10 px-3 py-2 border rounded text-sm bg-white" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Expire Date *</label>
              <div className="flex gap-2">
                <div id="hcf-exp-month" className="paypal-hosted-field h-10 px-2 py-2 border rounded text-sm flex-1 bg-white" />
                <div id="hcf-exp-year" className="paypal-hosted-field h-10 px-2 py-2 border rounded text-sm flex-1 bg-white" />
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Security code *</label>
              <div className="flex items-start gap-3">
                <div id="hcf-cvv" className="paypal-hosted-field h-10 px-3 py-2 border rounded text-sm w-24 bg-white" />
                <button type="button" className="text-[11px] text-indigo-600 hover:underline mt-2">What is a security code?</button>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-gray-600 select-none">
            <input type="checkbox" className="w-4 h-4" /> Remember this card for later use
          </label>
        </div>
        {!ready && !error && <p className="text-xs text-gray-500">Loading secure card fields…</p>}
        {error === 'missing_client_id' && <p className="text-xs text-gray-500">Card payment unavailable. Choose COD earlier.</p>}
        {error && !['missing_client_id'].includes(error) && <p className="text-xs text-red-600">Card entry unavailable.</p>}
      </div>
    </div>
  );
});

export default HostedCardFields;
