import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface OrderDetailsProps {
  orderNumber: string;
  createdAt: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'card' | 'cod';
  paymentStatus: string;
}

export function OrderDetails({
  orderNumber,
  createdAt,
  customerInfo,
  shippingAddress,
  paymentMethod,
  paymentStatus
}: OrderDetailsProps) {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Customer Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          Customer
        </h4>
        <p className="text-sm text-gray-600">
          {customerInfo.firstName} {customerInfo.lastName}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          {customerInfo.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          {customerInfo.mobile}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          Shipping Address
        </h4>
        <p className="text-sm text-gray-600">{shippingAddress.street}</p>
        <p className="text-sm text-gray-600">
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
        </p>
        <p className="text-sm text-gray-600">{shippingAddress.country}</p>
      </div>

      {/* Order Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Order Information</h4>
        <p className="text-sm text-gray-600">
          Order #: <span className="font-medium">{orderNumber}</span>
        </p>
        <p className="text-sm text-gray-600">
          Date: {format(new Date(createdAt), 'PPP')}
        </p>
        <p className="text-sm text-gray-600">
          Payment: {paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}
        </p>
        <p className="text-sm text-gray-600">
          Status: <span className="capitalize">{paymentStatus}</span>
        </p>
      </div>
    </div>
  );
}