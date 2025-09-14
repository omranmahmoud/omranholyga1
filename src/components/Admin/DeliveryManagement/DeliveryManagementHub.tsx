import React, { useState } from 'react';
import { Settings, Truck, FileText, BarChart3 } from 'lucide-react';
import { DeliveryCompaniesManager } from '../DeliveryCompanies/DeliveryCompaniesManager';
import { OrderDeliveryManager } from '../DeliveryCompanies/OrderDeliveryManager';
import { DeliveryFieldMapping } from '../DeliveryCompanies/DeliveryFieldMapping';

type TabType = 'companies' | 'orders' | 'field-mapping' | 'analytics';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export function DeliveryManagementHub() {
  const [activeTab, setActiveTab] = useState<TabType>('companies');

  const tabs: TabConfig[] = [
    {
      id: 'companies',
      label: 'Delivery Companies',
      icon: <Truck className="w-4 h-4" />,
      component: <DeliveryCompaniesManager />
    },
    {
      id: 'orders',
      label: 'Order Management',
      icon: <FileText className="w-4 h-4" />,
      component: <OrderDeliveryManager />
    },
    {
      id: 'field-mapping',
      label: 'Field Mapping',
      icon: <Settings className="w-4 h-4" />,
      component: <DeliveryFieldMapping />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      component: (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-500">
              Delivery analytics and reporting features will be available in a future update.
            </p>
          </div>
        </div>
      )
    }
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Management Hub</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive delivery management for multiple service providers
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTabConfig.component}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-2">Delivery Management Guide</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Companies:</strong> Add and configure delivery service providers</li>
              <li><strong>Orders:</strong> Assign orders to companies and track delivery status</li>
              <li><strong>Field Mapping:</strong> Control which data fields are sent to each company</li>
              <li><strong>Analytics:</strong> View delivery performance metrics and insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
