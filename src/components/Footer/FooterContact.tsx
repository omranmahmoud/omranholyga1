import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

interface FooterContactProps {
  address: string;
  phone: string;
  email: string;
}

export function FooterContact({ address, phone, email }: FooterContactProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-gray-600">
        <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <span>{address}</span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Phone className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <span>{phone}</span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <span>{email}</span>
      </div>
    </div>
  );
}