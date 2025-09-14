import React, { useState, useEffect, useRef } from 'react';
import { Banknote, CreditCard as CardIcon } from 'lucide-react';
import { OrderConfirmation } from './OrderConfirmation';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

// Lightweight helper to load PayPal script once
const loadPayPalScript = (clientId: string) => new Promise<void>((resolve, reject) => {
  if (window.paypal) return resolve();
  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons,hosted-fields&enable-funding=card&currency=USD`;
  s.async = true;
  s.onload = () => resolve();
  s.onerror = reject;
  document.body.appendChild(s);
});


interface PaymentFormProps {
  total: number;
  onBack: () => void;
  onComplete: () => void;
  shippingData: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    secondaryMobile?: string;
    countryCode: string;
    secondaryCountryCode?: string;
    country: string;
    address: string;
    city: string;
  };
}

export function PaymentForm({ total, onBack, onComplete, shippingData }: PaymentFormProps) {
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  // removed cardBrand detection for simplified UI
  const hostedFieldsInstance = useRef<any>(null);

  useEffect(() => {
    if (paymentMethod !== 'card') return;
    if (!PAYPAL_CLIENT_ID) {
      // Silently log but don't show verbose message to end user
      console.warn('[Payment] Missing PayPal Client ID (VITE_PAYPAL_CLIENT_ID). Card processing disabled; COD still available.');
      setPaypalError('missing_client_id');
      return;
    }
    let mounted = true;
    setPaypalError(null);
    setPaypalReady(false);
    loadPayPalScript(PAYPAL_CLIENT_ID)
      .then(() => {
        if (!mounted) return;
        if (!window.paypal) {
          setPaypalError('window.paypal not present after script load');
          return;
        }
        if (!window.paypal.HostedFields) {
          setPaypalError('HostedFields API missing (check components=hosted-fields in script URL)');
          return;
        }
        if (typeof window.paypal.HostedFields.isEligible === 'function' && !window.paypal.HostedFields.isEligible()) {
          setPaypalError('Hosted Fields not eligible for this merchant/environment');
          return;
        }
        window.paypal.HostedFields.render({
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
            number: { selector: '#card-number', placeholder: 'Please enter card number' },
            cvv: { selector: '#cvv', placeholder: '3-4 digits' },
            expirationMonth: { selector: '#exp-month', placeholder: 'Month' },
            expirationYear: { selector: '#exp-year', placeholder: 'Year' }
          }
        })
          .then((hf: any) => {
            if (!mounted) return;
            hostedFieldsInstance.current = hf;
            setPaypalReady(true);
            // card brand highlight removed
            try { hf.on('cardTypeChange', () => {}); } catch (e) { /* ignore */ }
          })
          .catch((err: any) => {
            console.error('HostedFields.render error', err);
            setPaypalError('Failed to initialize Hosted Fields');
          });
      })
  .catch((err: any) => {
        console.error('PayPal script load failed', err);
        setPaypalError('Failed to load PayPal SDK');
      });
    return () => { mounted = false; };
  }, [paymentMethod, PAYPAL_CLIENT_ID, total]);

  const { clearCart, items } = useCart();
  const { currency } = useCurrency();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Gift card minimal state (only balance check for now)
  const [giftCode, setGiftCode] = useState('');
  const [giftChecking, setGiftChecking] = useState(false);
  const [giftInfo, setGiftInfo] = useState<null | { balance: number; currency: string }>(null);

  const handleCheckGiftCard = async () => {
    const code = giftCode.trim();
    if (!code) { toast.error('Enter gift card code'); return; }
    setGiftChecking(true);
    try {
      const res = await api.getWithRetry(`/gift-cards/balance/${encodeURIComponent(code)}`);
      setGiftInfo(res.data);
      toast.success('Gift card loaded');
    } catch (e:any) {
      toast.error(e?.message || 'Gift card check failed');
      setGiftInfo(null);
    } finally {
      setGiftChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (paymentMethod === 'card') {
        if (!hostedFieldsInstance.current) throw new Error('Card fields not ready');
        // Hosted Fields submit should create/confirm the order (createOrder provided in render config) and return orderId
        const submission = await hostedFieldsInstance.current.submit({ contingencies: ['3D_SECURE'] });
        const orderID = submission?.orderId || submission?.id;
        if (!orderID) throw new Error('Missing order ID from Hosted Fields submission');
        // Capture via new capture-only flow
        const capture = await api.postWithRetry('/paypal/card/authorize', { orderID });
        if (capture.data && ['COMPLETED', 'APPROVED'].includes(capture.data.status)) {
          toast.success('Payment captured, creating order...');
          try {
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
            const orderRes = await api.postWithRetry('/orders', orderPayload);
            setOrderNumber(orderRes.data.orderNumber || '');
            setShowConfirmation(true);
            clearCart();
          } catch (orderErr:any) {
            console.error('Order creation after capture failed', orderErr);
            toast.error('Capture succeeded but order creation failed. Contact support.');
          }
        } else {
          toast.error('Payment capture failed');
        }
      } else {
        // COD flow: create order directly
        const orderPayload = {
          items: items.map(i => ({ product: i.id, quantity: i.quantity, size: i.size })),
          shippingAddress: { street: shippingData.address, city: shippingData.city, country: shippingData.country },
          paymentMethod: 'cod',
          customerInfo: {
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            email: shippingData.email,
            mobile: shippingData.mobile,
            secondaryMobile: shippingData.secondaryMobile
          },
          currency
        };
        const orderRes = await api.postWithRetry('/orders', orderPayload);
        setOrderNumber(orderRes.data.orderNumber || '');
        setShowConfirmation(true);
        clearCart();
      }
    } catch (err:any) {
      toast.error(err?.message || 'Payment error');
    } finally {
      setIsProcessing(false);
    }
  };

  // You could show confirmation UI after backend order creation
  // Currently unused showConfirmation logic was removed for clarity

  if (showConfirmation) {
    return (
      <OrderConfirmation
        orderNumber={orderNumber}
        email={shippingData.email}
        mobile={`${shippingData.countryCode} ${shippingData.mobile}`}
        onClose={onComplete}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:underline">&larr; Back</button>
      </div>

      <div className="flex gap-4 mb-2">
        <button type="button" className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod('card')}>
          <CardIcon className="inline mr-2" /> Card
        </button>
        <button type="button" className={`btn ${paymentMethod === 'cod' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod('cod')}>
          <Banknote className="inline mr-2" /> COD
        </button>
      </div>

      {paymentMethod === 'card' && (
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
              <div id="card-number" className="paypal-hosted-field h-10 px-3 py-2 border rounded text-sm bg-white" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Expire Date *</label>
                <div className="flex gap-2">
                  <div id="exp-month" className="paypal-hosted-field h-10 px-2 py-2 border rounded text-sm flex-1 bg-white" />
                  <div id="exp-year" className="paypal-hosted-field h-10 px-2 py-2 border rounded text-sm flex-1 bg-white" />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Security code *</label>
                <div className="flex items-start gap-3">
                  <div id="cvv" className="paypal-hosted-field h-10 px-3 py-2 border rounded text-sm w-24 bg-white" />
                  <button type="button" className="text-[11px] text-indigo-600 hover:underline mt-2">What is a security code?</button>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-gray-600 select-none">
              <input type="checkbox" className="w-4 h-4" /> Remember this card for later use
            </label>
          </div>
          {!paypalReady && paypalError !== 'missing_client_id' && !paypalError && (
            <p className="text-xs text-gray-500">Loading secure card fields…</p>
          )}
          {paypalError === 'missing_client_id' && (
            <p className="text-xs text-gray-500">Card payment temporarily unavailable. Please choose Cash on Delivery.</p>
          )}
          {paypalError && paypalError !== 'missing_client_id' && (
            <p className="text-xs text-red-600">Secure card fields unavailable.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Gift card code"
            value={giftCode}
            onChange={e => setGiftCode(e.target.value)}
            className="input flex-1"
          />
          <button type="button" className="btn btn-secondary" onClick={handleCheckGiftCard} disabled={giftChecking}>
            {giftChecking ? 'Checking…' : 'Apply'}
          </button>
        </div>
        {giftInfo && (
          <p className="text-xs text-green-600">Balance: {giftInfo.balance} {giftInfo.currency}</p>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isProcessing || (paymentMethod === 'card' && !paypalReady)}
      >
        {isProcessing ? 'Processing…' : paymentMethod === 'card' ? 'Pay Now' : 'Place Order'}
      </button>
    </form>
  );
}






