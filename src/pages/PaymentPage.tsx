import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatPrice } from '../utils/currency';
import HostedCardFields, { HostedCardFieldsHandle } from '../components/Cart/HostedCardFields';
import { toast } from 'react-hot-toast';

interface ShippingData { location: string; firstName: string; lastName: string; email: string; phone: string; phone2?: string; city: string; address1: string; address2?: string; }

export function PaymentPage(){
  const navigate = useNavigate();
  const { items } = useCart();
  const { currency } = useCurrency();
  const [shipping, setShipping] = useState<ShippingData | null>(null);

  useEffect(()=>{
    try {
      const saved = sessionStorage.getItem('checkoutShipping');
      if(saved) setShipping(JSON.parse(saved)); else navigate('/checkout');
    } catch { navigate('/checkout'); }
  },[navigate]);

  const subtotal = items.reduce((a,i)=>a + i.price * i.quantity,0);
  const shippingFee = 0; const shippingGuarantee = 0; const total = subtotal + shippingFee + shippingGuarantee;


  const [orderNumber, setOrderNumber] = useState('');
  const [placing, setPlacing] = useState(false);
  const cardRef = useRef<HostedCardFieldsHandle | null>(null);

  const handlePlaceOrder = async () => {
    if (!cardRef.current) return;
    if (placing) return;
    if (!cardRef.current.ready) { toast.error('Card not ready'); return; }
    setPlacing(true);
    const res = await cardRef.current.submit();
    if (res.success) {
      setOrderNumber(res.orderNumber || '');
      // redirect or stay; stay to show order number
      setTimeout(()=> navigate('/'), 1500);
    }
    setPlacing(false);
  };

  if(!shipping) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center text-[12px] text-gray-500 gap-2">
        <button onClick={()=>navigate('/checkout')} className="text-indigo-600 hover:underline">&lt; Back to Place Order Page</button>
        <span className="mx-auto hidden sm:inline text-gray-400">Place Order &gt; Shopping Bag &gt; Pay &gt; Order Complete</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Billing Address</h2>
              <button onClick={()=>navigate('/checkout')} className="text-xs border px-3 py-1 rounded hover:bg-gray-50">Edit</button>
            </div>
            <div className="p-5 text-sm space-y-1">
              <p className="font-medium">{shipping.firstName} {shipping.lastName} <span className="font-normal text-gray-500 ml-1">{shipping.phone}</span></p>
              {shipping.phone2 && <p className="text-gray-500">Alt: {shipping.phone2}</p>}
              <p>{shipping.address1}{shipping.address2? ', '+shipping.address2:''}</p>
              <p className="text-gray-500 text-xs">{shipping.city}, {shipping.location.toUpperCase()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <HostedCardFields
              ref={cardRef}
              total={subtotal}
              shippingData={{
                firstName: shipping.firstName,
                lastName: shipping.lastName,
                email: shipping.email,
                mobile: shipping.phone,
                secondaryMobile: shipping.phone2,
                country: shipping.location.toUpperCase(),
                address: shipping.address1 + (shipping.address2? ', '+shipping.address2:''),
                city: shipping.city
              }}
              onOrderCreated={(num)=> setOrderNumber(num)}
            />
          </div>
        </div>

        <aside className="mt-10 lg:mt-0 lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b"><h2 className="text-base font-semibold">Order Summary</h2></div>
              <div className="p-4 space-y-5 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700"><span>Order No.</span><span className="font-medium">{orderNumber || '—'}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Retail Price:</span><span>{formatPrice(subtotal,currency)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>{formatPrice(subtotal,currency)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Shipping Fee:</span><span>{formatPrice(shippingFee,currency)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Shipping Guarantee:</span><span>{formatPrice(shippingGuarantee,currency)}</span></div>
                  <div className="pt-2 mt-1 border-t flex justify-between text-base font-bold"><span>Grand Total:</span><span className="text-orange-600">{formatPrice(total,currency)}</span></div>
                </div>
                <div>
                  <button onClick={handlePlaceOrder} disabled={placing || !!orderNumber || !cardRef.current?.ready} className="w-full bg-black text-white font-semibold py-3 rounded text-sm tracking-wide disabled:opacity-60">
                    {orderNumber ? 'Placed' : placing ? 'Placing...' : 'PLACE ORDER'}
                  </button>
                </div>
                <div className="space-y-4 pt-2 border-t text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">🛡️</span>
                    <div>
                      <p className="font-medium text-gray-800">Secure Delivery Guarantee</p>
                      <p className="text-gray-500">Reliable partners ensure safe arrival. Issues? We solve them.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">🔒</span>
                    <div>
                      <p className="font-medium text-gray-800">Payment Security</p>
                      <p className="text-gray-500">Industry encryption. No raw card details stored.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">📦</span>
                    <div>
                      <p className="font-medium text-gray-800">Security & Privacy</p>
                      <p className="text-gray-500">Your data protected by layered safeguards.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PaymentPage;
