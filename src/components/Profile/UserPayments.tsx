import React from 'react';
import { CreditCard, Plus } from 'lucide-react';

export function UserPayments() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your saved payment methods.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Add New Card Button */}
        <button className="h-48 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors group">
          <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
          <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">
            Add New Card
          </span>
        </button>

        {/* Sample Saved Card */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white overflow-hidden">
          <div className="absolute top-4 right-4">
            <CreditCard className="w-8 h-8 opacity-50" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="text-xl tracking-widest">•••• •••• •••• 4242</div>
            <div className="flex justify-between text-sm">
              <span>John Doe</span>
              <span>12/24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="bg-gray-50 rounded-xl divide-y">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Order #1234</p>
              <p className="text-sm text-gray-500">Dec 12, 2023</p>
            </div>
            <span className="font-medium text-gray-900">$299.00</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Order #1233</p>
              <p className="text-sm text-gray-500">Dec 1, 2023</p>
            </div>
            <span className="font-medium text-gray-900">$199.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}