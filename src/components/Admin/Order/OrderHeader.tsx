import React from 'react';
import { X, Printer } from 'lucide-react';
import { Logo } from '../../Logo';
import { useStore } from '../../../context/StoreContext';

interface OrderHeaderProps {
  orderNumber: string;
  createdAt: string;
  onClose: () => void;
  onPrint: () => void;
}

export function OrderHeader({ orderNumber, createdAt, onClose, onPrint }: OrderHeaderProps) {
  const { settings } = useStore();

  return (
    <div className="flex items-center gap-6 mb-6 pb-6 border-b">
      <div className="w-32 h-12">
        <Logo />
      </div>
      <div className="flex-1 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {settings?.name || 'Eva Curves Fashion Store'}
        </h3>
        <div className="text-sm text-gray-500 mt-1">
          <p>{settings?.email || 'contact@evacurves.com'}</p>
          <p>{settings?.phone || '+1 (555) 123-4567'}</p>
          <p>{settings?.address || '123 Fashion Street, NY 10001'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrint}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Print order"
        >
          <Printer className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}