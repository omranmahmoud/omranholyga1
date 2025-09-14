import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CheckoutSteps } from './CheckoutSteps';
import { ShippingForm } from './ShippingForm';
import { PaymentForm } from './PaymentForm';
import { OrderConfirmation } from './OrderConfirmation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export function CheckoutModal({ isOpen, onClose, total }: CheckoutModalProps) {
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [shippingData, setShippingData] = useState<any>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="checkout-modal" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-8 py-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          </div>

          <CheckoutSteps currentStep={step} />

          {step === 'shipping' ? (
            <ShippingForm
              onSubmit={(data) => {
                setShippingData(data);
                setStep('payment');
              }}
            />
          ) : (
            <PaymentForm
              total={total}
              onBack={() => setStep('shipping')}
              onComplete={onClose}
              shippingData={shippingData}
            />
          )}
        </div>
      </div>
    </div>
  );
}