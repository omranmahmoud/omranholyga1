import { useState } from 'react';
import { Settings, Package } from 'lucide-react';
import { DeliveryCompaniesManager } from './DeliveryCompanies/DeliveryCompaniesManager';
import { OrderDeliveryManager } from './DeliveryCompanies/OrderDeliveryManager';

type TabType = 'companies' | 'orders';

export function DeliveryManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('companies');

  const tabs = [
    {
      id: 'companies' as TabType,
      name: 'Delivery Companies',
      icon: Settings,
      description: 'Manage delivery service providers'
    },
    {
      id: 'orders' as TabType,
      name: 'Order Assignment',
      icon: Package,
      description: 'Assign orders to delivery companies'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-600 mt-1">
            Manage multiple delivery companies and assign orders
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'companies' && <DeliveryCompaniesManager />}
        {activeTab === 'orders' && <OrderDeliveryManager />}
      </div>
    </div>
  );
}