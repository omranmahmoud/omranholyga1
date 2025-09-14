import React from 'react';
import { CheckCircle, Package, Mail, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderConfirmationProps {
  orderNumber: string;
  email: string;
  mobile: string;
  onClose: () => void;
}

export function OrderConfirmation({ orderNumber, email, mobile, onClose }: OrderConfirmationProps) {
  return (
    <div className="px-8 py-12 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Order Successfully Placed!
      </h3>
      <p className="text-gray-600 mb-6">
        Thank you for your order. We'll send you shipping confirmation soon.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />
          Order #{orderNumber}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            Confirmation sent to {email}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            Updates will be sent to {mobile}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link
          to="/orders"
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
        >
          View Order Status
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}