import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { formatPrice } from '../utils/currency';
import { Link } from 'react-router-dom';
import { CouponForm } from '../components/Cart/CouponForm';
import api from '../services/api';
import { toast } from 'react-hot-toast';

// New "Place Order" style page replacing the previous multi-step checkout
export function CheckoutPage() {
  const { items, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const { currency } = useCurrency();

  // Shipping address form state (local only for now)
  const [shipping, setShipping] = useState({
    location: '',
    firstName: '',
    lastName: '',
    phone: '',
    phone2: '', // optional second mobile number
    city: '',
    address1: '',
    address2: '',
  email: '', // added email field
    makeDefault: false
  });
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showItems, setShowItems] = useState(true);
  // Order summary side states
  const [discount, setDiscount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [giftCardNumber, setGiftCardNumber] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [giftCardApplied, setGiftCardApplied] = useState(false);

  const shippingFee = 0; // placeholder
  const shippingGuarantee = 0; // placeholder

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Country detection state
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  // Expanded list incl. Middle East & common markets (ISO 3166-1 alpha-2 lower-case)
  const SUPPORTED_COUNTRIES: { code: string; label: string }[] = [
    // Core English markets
    { code: 'us', label: 'United States' },
    { code: 'ca', label: 'Canada' },
    { code: 'uk', label: 'United Kingdom' }, // (GB) shown as UK for user familiarity
    { code: 'au', label: 'Australia' },
    { code: 'nz', label: 'New Zealand' },
    // Europe (sample high‑traffic)
    { code: 'de', label: 'Germany' },
    { code: 'fr', label: 'France' },
    { code: 'es', label: 'Spain' },
    { code: 'it', label: 'Italy' },
    { code: 'nl', label: 'Netherlands' },
    { code: 'se', label: 'Sweden' },
    { code: 'no', label: 'Norway' },
    { code: 'fi', label: 'Finland' },
    { code: 'ie', label: 'Ireland' },
    { code: 'ch', label: 'Switzerland' },
    // Middle East & North Africa
    { code: 'sa', label: 'Saudi Arabia' },
    { code: 'ae', label: 'United Arab Emirates' },
    { code: 'qa', label: 'Qatar' },
    { code: 'bh', label: 'Bahrain' },
    { code: 'kw', label: 'Kuwait' },
    { code: 'om', label: 'Oman' },
    { code: 'jo', label: 'Jordan' },
    { code: 'lb', label: 'Lebanon' },
    { code: 'eg', label: 'Egypt' },
    { code: 'iq', label: 'Iraq' },
    { code: 'il', label: 'Israel' },
    { code: 'sy', label: 'Syria' },
    { code: 'ps', label: 'Palestine' },
    { code: 'ye', label: 'Yemen' },
    { code: 'ma', label: 'Morocco' },
    { code: 'dz', label: 'Algeria' },
    { code: 'tn', label: 'Tunisia' },
    // Asia (select)
    { code: 'tr', label: 'Türkiye' },
    { code: 'in', label: 'India' },
    { code: 'pk', label: 'Pakistan' },
    { code: 'bd', label: 'Bangladesh' },
    { code: 'ph', label: 'Philippines' },
    { code: 'my', label: 'Malaysia' },
    { code: 'sg', label: 'Singapore' },
    { code: 'id', label: 'Indonesia' },
    { code: 'th', label: 'Thailand' },
    { code: 'vn', label: 'Vietnam' },
    { code: 'cn', label: 'China' },
    { code: 'jp', label: 'Japan' },
    { code: 'kr', label: 'South Korea' },
    // Americas (additional)
    { code: 'mx', label: 'Mexico' },
    { code: 'br', label: 'Brazil' },
    { code: 'ar', label: 'Argentina' },
    { code: 'cl', label: 'Chile' },
    // Africa (additional key markets)
    { code: 'ng', label: 'Nigeria' },
    { code: 'za', label: 'South Africa' }
  ];

  // Attempt automatic country detection on mount (IP based + locale fallback)
  useEffect(() => {
    if (shipping.location || manualMode) return; // don't override once set or in manual
    let cancelled = false;
    const detect = async () => {
      setDetectingCountry(true);
      setDetectionError(null);
      const tryApis = [
        'https://ipapi.co/json/',
        'https://ipwho.is/'
      ];
      let found = false;
      for (const url of tryApis) {
        if (cancelled) break;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4500);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data: any = await res.json();
            const ccRaw = (data?.country_code || data?.countryCode || data?.country?.code || '').toLowerCase();
            const cc = ccRaw === 'gb' ? 'uk' : ccRaw; // map GB to UK label
            if (cc && SUPPORTED_COUNTRIES.some(c => c.code === cc)) {
              setShipping(prev => ({ ...prev, location: cc }));
              found = true;
              break;
            }
          }
        } catch (_) {
          // continue to next API
        }
      }
      if (!found && !cancelled) {
        // Language fallback
        const lang = navigator.language || '';
        const maybeCC = lang.split('-')[1]?.toLowerCase();
        if (maybeCC && SUPPORTED_COUNTRIES.some(c => c.code === maybeCC)) {
          setShipping(prev => ({ ...prev, location: maybeCC }));
          found = true;
        }
      }
      if (!found && !cancelled) {
        setDetectionError('Automatic country detection failed. Please choose manually.');
      }
      if (!cancelled) setDetectingCountry(false);
    };
    detect();
    return () => { cancelled = true; };
  }, [shipping.location, manualMode]);

  const retryDetect = () => {
    if (detectingCountry) return;
    setShipping(prev => ({ ...prev, location: '' }));
    setManualMode(false); // re-enable auto pipeline
  };
  const promotions = discount; // alias for clarity
  const total = subtotal + shippingFee + shippingGuarantee - promotions;
  const rewardPoints = Math.max(0, Math.floor(total / 10));

  const handleChange = (field: string, value: any) => {
  setShipping(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate async save
    setTimeout(() => {
      setSaving(false);
      setEditingAddress(false);
    }, 600);
  };

  const adjustQty = async (id: string, current: number, delta: number) => {
    const next = current + delta;
    if (next < 1) return;
    await updateQuantity(id, next);
  };

  const handleApplyGiftCard = () => {
    if (giftCardNumber.length >= 4 && giftCardPin.length >= 3) {
      setGiftCardApplied(true);
      // Future: connect to API to validate card and modify totals
    }
  };

  const [placingOrder, setPlacingOrder] = useState(false);
  const continueToPayment = () => {
    // Ensure shipping saved and valid
    if (editingAddress) {
      toast.error('Save your shipping address first');
      return;
    }
  if (!shipping.firstName || !shipping.lastName || !shipping.email || !shipping.phone || !shipping.city || !shipping.address1 || !shipping.location) {
      toast.error('Incomplete shipping address');
      setEditingAddress(true);
      return;
    }
    try {
      sessionStorage.setItem('checkoutShipping', JSON.stringify(shipping));
    } catch(_) {}
    navigate('/payment');
  };
  const createCodOrder = async () => {
    if (placingOrder) return;
    // Basic validation for required shipping fields
  if (!shipping.firstName || !shipping.lastName || !shipping.email || !shipping.phone || !shipping.city || !shipping.address1 || !shipping.location) {
      toast.error('Complete shipping address first');
      setEditingAddress(true);
      return;
    }
    try {
      setPlacingOrder(true);
      const payload = {
        items: items.map(i => ({ product: i.id, quantity: i.quantity, size: i.size })),
        shippingAddress: { street: shipping.address1 + (shipping.address2 ? `, ${shipping.address2}` : ''), city: shipping.city, country: shipping.location.toUpperCase() },
        paymentMethod: 'cod',
        customerInfo: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: 'guest@example.com', // placeholder until user email capture added
          mobile: shipping.phone,
          secondaryMobile: shipping.phone2 || ''
        },
        currency
      };
      const res = await api.postWithRetry('/orders', payload);
  toast.success(`Order placed (#${res?.data?.order?.orderNumber || ''})`);
  clearCart();
  // navigate to store homepage
  navigate('/');
    } catch (err:any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
            <Link to="/products" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-gray-500 flex gap-2 pt-2 mb-6" aria-label="Breadcrumb">
          <span>Cart</span>
          <span>{'>'}</span>
          <span className="text-gray-900 font-medium">Place Order</span>
          <span>{'>'}</span>
          <span>Pay</span>
          <span>{'>'}</span>
          <span>Order Complete</span>
        </nav>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-8 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b flex items-center">
                <h2 className="text-lg font-semibold flex-1">Shipping Address</h2>
                {!editingAddress && (
                  <button type="button" onClick={() => { setEditingAddress(true); }} className="text-xs font-medium text-indigo-600 hover:underline">Change &gt;</button>
                )}
              </div>
              {editingAddress ? (
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location*</label>
                  {!manualMode && shipping.location && !detectingCountry && (
                    <div className="flex items-center gap-3">
                      <input
                        readOnly
                        value={SUPPORTED_COUNTRIES.find(c=>c.code===shipping.location)?.label || shipping.location.toUpperCase()}
                        className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700"
                      />
                      <button type="button" onClick={()=>setManualMode(true)} className="text-[11px] px-2 py-1 border rounded hover:bg-gray-50">Change</button>
                      <button type="button" onClick={retryDetect} className="text-[11px] px-2 py-1 border rounded hover:bg-gray-50">Retry</button>
                    </div>
                  )}
                  {!manualMode && !shipping.location && (
                    <div className="flex items-center gap-3">
                      <input
                        readOnly
                        value={detectingCountry ? 'Detecting your country…' : (detectionError || 'Unable to detect automatically')}
                        className={`flex-1 border rounded-md px-3 py-2 text-sm ${detectingCountry? 'animate-pulse':''}`}
                      />
                      <button type="button" onClick={()=>setManualMode(true)} className="text-[11px] px-2 py-1 border rounded hover:bg-gray-50">{detectionError? 'Select' : 'Manual'}</button>
                      {!detectionError && <button type="button" onClick={retryDetect} disabled={detectingCountry} className="text-[11px] px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Retry</button>}
                    </div>
                  )}
                  {manualMode && (
                    <div className="space-y-1">
                      <select
                        value={shipping.location}
                        onChange={e => handleChange('location', e.target.value)}
                        required
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70"
                      >
                        <option value="">Select your country</option>
                        {SUPPORTED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-3 text-[11px]">
                        <button type="button" onClick={()=>{ setManualMode(false); }} className="text-indigo-600 hover:underline">Auto Detect</button>
                        {shipping.location && <span className="text-gray-500">Selected: {SUPPORTED_COUNTRIES.find(c=>c.code===shipping.location)?.label}</span>}
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-gray-500">
                    {manualMode ? 'Manual selection enabled.' : shipping.location ? 'Country detected automatically.' : detectionError ? 'Select your country manually.' : 'Attempting automatic detection…'}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">First Name*</label>
                    <input value={shipping.firstName} onChange={e => handleChange('firstName', e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Name*</label>
                    <input value={shipping.lastName} onChange={e => handleChange('lastName', e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number*</label>
                    <input value={shipping.phone} onChange={e => handleChange('phone', e.target.value)} required placeholder="Primary" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Second Mobile</label>
                    <input value={shipping.phone2} onChange={e => handleChange('phone2', e.target.value)} placeholder="Optional" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City*</label>
                    <input value={shipping.city} onChange={e => handleChange('city', e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1*</label>
                  <input value={shipping.address1} onChange={e => handleChange('address1', e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
                  <input value={shipping.address2} onChange={e => handleChange('address2', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="makeDefault" type="checkbox" checked={shipping.makeDefault} onChange={e => handleChange('makeDefault', e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                  <label htmlFor="makeDefault" className="text-xs text-gray-700 select-none">Make Default</label>
                  <div className="ml-auto flex gap-4 text-[11px]">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Email*</label>
                              <input type="email" value={shipping.email} onChange={e => handleChange('email', e.target.value)} required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/70" />
                            </div>
                    <button type="button" className="text-gray-600 hover:text-black">General Address Tips</button>
                    <button type="button" className="text-gray-600 hover:text-black">Privacy & Cookie Policy</button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-[11px] text-gray-600 flex gap-2">
                  <span className="text-green-600">🔒</span>
                  <p>Security & Privacy – We maintain industry‑standard physical, technical, and administrative measures to safeguard your information.</p>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={saving} className="mx-auto block bg-black text-white px-10 py-2.5 text-sm font-semibold rounded disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
              ) : (
                <div className="p-5">
                  <div className="border rounded-md p-4 flex items-start gap-4 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l bg-indigo-500" />
                    <div className="flex-1 space-y-1 pl-2">
                      <p className="text-sm font-semibold text-gray-900">{(shipping.firstName || shipping.lastName) ? `${shipping.firstName} ${shipping.lastName}`.trim() : '—'} {shipping.phone && <span className="font-normal text-gray-600 ml-1">{shipping.phone}</span>}</p>
                      {shipping.phone2 && <p className="text-[11px] text-gray-500">Alt: {shipping.phone2}</p>}
                      <p className="text-[12px] text-gray-700">{shipping.address1 || 'No address line 1'}{shipping.address2 ? `, ${shipping.address2}` : ''}</p>
                      <p className="text-[12px] text-gray-500">{shipping.city && `${shipping.city}, `}{SUPPORTED_COUNTRIES.find(c=>c.code===shipping.location)?.label || (shipping.location ? shipping.location.toUpperCase(): '')}</p>
                    </div>
                    <div>
                      <button type="button" onClick={() => { setEditingAddress(true); }} className="text-[11px] border px-3 py-1 rounded hover:bg-gray-50">Edit Address</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 flex items-center justify-between border-b">
                <h2 className="text-lg font-semibold">Order Details</h2>
                <button type="button" className="text-xs font-medium text-gray-600 hover:text-black" onClick={() => setShowItems(s => !s)}>
                  {showItems ? `Hide ${items.length} item${items.length>1?'s':''}` : `View ${items.length} item${items.length>1?'s':''}`}
                </button>
              </div>
              {showItems && (
                <ul className="divide-y">
                  {items.map(item => (
                    <li key={item.id} className="flex gap-4 px-6 py-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500">
                          {item.color && <span>Color: {item.color}</span>}
                                  {shipping.email && <p className="text-[11px] text-gray-500">{shipping.email}</p>} {/* Display email */}
                          {item.size && <span>Size: {item.size}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => adjustQty(item.id, item.quantity, -1)} className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-50">-</button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => adjustQty(item.id, item.quantity, 1)} className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-50">+</button>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity, currency)}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-6 py-4 border-t flex justify-between text-sm font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Payment Method</h2>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="payment" value="card" checked={paymentMethod==='card'} onChange={e => setPaymentMethod(e.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Credit/Debit Card <span className="text-gray-400 text-xs">ⓘ</span></p>
                    <div className="mt-2 flex flex-wrap items-center gap-1 grayscale-[30%]">
                      {['visa','mastercard','amex','discover','mada','applepay'].map(brand => (
                        <span key={brand} className="px-2 py-1 bg-gray-100 rounded text-[10px] uppercase tracking-wide text-gray-600">{brand}</span>
                      ))}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod==='cod'} onChange={e => setPaymentMethod(e.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-[11px] text-gray-500">Pay with cash when your order arrives.</p>
                  </div>
                </label>
                <div className="pt-4 border-t text-[11px] text-gray-600 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">🛡️</span>
                    <p className="leading-relaxed">Payment Security – We share your payment information only with providers who follow strict safeguards.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">🔒</span>
                    <p>Security & Privacy – We use industry‑standard encryption. We don’t store raw card details.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600">📦</span>
                    <p>Secure Shipment Guarantee – Free exchanges or refunds for lost, returned, or damaged packages.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-600">🎧</span>
                    <p>Customer Support – Need help? Reach our team any time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ORDER SUMMARY */}
          <aside className="mt-10 lg:mt-0 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b">
                  <h2 className="text-base font-semibold">Order Summary</h2>
                </div>
                <div className="p-4 space-y-4 text-sm">
                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600"><span>Retail Price: {items.length} {items.length===1?'Item':'Items'}</span><span>{formatPrice(subtotal, currency)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Shipping Fee:</span><span>{formatPrice(shippingFee, currency)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Shipping Guarantee:</span><span>{formatPrice(shippingGuarantee, currency)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Promotions</span><span className="text-red-500">{promotions>0?'-'+formatPrice(promotions,currency):formatPrice(0,currency)}</span></div>
                    <div className="pt-2 mt-1 border-t flex justify-between text-base font-bold"><span>Order Total:</span><span className="text-orange-600">{formatPrice(total, currency)}</span></div>
                  </div>

                  {/* Reward Points */}
                  <div className="bg-gray-50 rounded px-3 py-2 flex items-center gap-2 text-[13px] border border-dashed border-gray-200">
                    <span className="text-yellow-600">🏅</span>
                    <span>Reward <span className="font-semibold">{rewardPoints}</span> Points</span>
                    <button type="button" className="ml-auto text-gray-400" title="Points info">ⓘ</button>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500 tracking-wide">Coupon Code</label>
                    <div className="flex gap-2">
                      <div className="flex-1"><CouponForm onApply={setDiscount} totalAmount={subtotal} /></div>
                    </div>
                  </div>

                  {/* Gift Card */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500 tracking-wide">Gift Card <button type="button" className="text-gray-400 ml-1" title="Gift card info">ⓘ</button></label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Card Number" value={giftCardNumber} onChange={e=>setGiftCardNumber(e.target.value)} className="flex-1 border rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="text" placeholder="PIN" value={giftCardPin} onChange={e=>setGiftCardPin(e.target.value)} className="w-20 border rounded px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button type="button" disabled={giftCardApplied} onClick={handleApplyGiftCard} className={`px-4 py-2 text-xs font-medium rounded ${giftCardApplied?'bg-gray-200 text-gray-500':'bg-gray-800 text-white hover:bg-gray-700'}`}>{giftCardApplied?'Applied':'Apply'}</button>
                    </div>
                  </div>

                  {/* View More toggle */}
                  <div className="text-center">
                    <button type="button" onClick={()=>setShowMore(v=>!v)} className="text-xs font-medium text-indigo-600 hover:underline">{showMore?'Hide':'View More'} {showMore?'▲':'▼'}</button>
                  </div>

                  {showMore && (
                    <ul className="divide-y max-h-48 overflow-y-auto pr-1 custom-scrollbar border rounded">
                      {items.map(item => (
                        <li key={item.id} className="py-3 px-3 flex gap-4 bg-white/50">
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.name}</p>
                            <div className="text-[11px] text-gray-500 flex gap-2 mt-1 flex-wrap">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </div>
                            <div className="mt-1 text-[11px] text-gray-600">Qty: {item.quantity}</div>
                          </div>
                          <div className="text-xs font-semibold text-gray-900">{formatPrice(item.price * item.quantity, currency)}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Place Order (COD) */}
                  <div>
                    {paymentMethod === 'cod' ? (
                      <button type="button" onClick={createCodOrder} disabled={placingOrder} className="w-full bg-black text-white font-semibold py-3 rounded text-sm tracking-wide disabled:opacity-60">
                        {placingOrder ? 'Placing Order...' : 'Place Order'}
                      </button>
                    ) : (
                      <button type="button" onClick={continueToPayment} className="w-full bg-black text-white font-semibold py-3 rounded text-sm tracking-wide">Continue to Payment</button>
                    )}
                  </div>

                  {/* Info Sections */}
                  <div className="space-y-4 pt-2 border-t text-[11px] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">🛡️</span>
                      <div>
                        <p className="font-medium text-gray-800">Payment Security</p>
                        <p className="text-gray-500">We only share payment info with providers that safeguard your data.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">🔒</span>
                      <div>
                        <p className="font-medium text-gray-800">Security & Privacy</p>
                        <p className="text-gray-500">Industry‑standard encryption keeps your details safe.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">📦</span>
                      <div>
                        <p className="font-medium text-gray-800">Secure Shipment Guarantee</p>
                        <p className="text-gray-500">Free exchanges or refunds for lost or damaged packages.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-600 mt-0.5">🎧</span>
                      <div>
                        <p className="font-medium text-gray-800">Customer Support</p>
                        <p className="text-gray-500">Questions? Contact our support team anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
