import React from 'react';
import { AlertTriangle, XCircle, Clock, TrendingDown } from 'lucide-react';
import { InventoryAlerts } from '../../../../services/inventoryAnalyticsService';

interface AlertsPanelProps {
  alerts: InventoryAlerts;
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const alertTypes = [
    {
      key: 'lowStock',
      title: 'Low Stock Alerts',
      icon: AlertTriangle,
      color: 'amber',
      data: alerts.lowStock || [],
      description: 'Products running low on inventory'
    },
    {
      key: 'outOfStock',
      title: 'Out of Stock',
      icon: XCircle,
      color: 'red',
      data: alerts.outOfStock || [],
      description: 'Products completely out of stock'
    },
    {
      key: 'deadStock',
      title: 'Dead Stock',
      icon: Clock,
      color: 'gray',
      data: alerts.deadStock || [],
      description: 'Products not moving for extended periods'
    },
    {
      key: 'overstock',
      title: 'Overstock',
      icon: TrendingDown,
      color: 'blue',
      data: alerts.overstock || [],
      description: 'Products with excess inventory'
    }
  ];

  const getAlertColorClasses = (color: string) => {
    const colors = {
      amber: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: 'text-amber-500'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-500'
      },
      gray: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-500'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const hasAlerts = alertTypes.some(type => type.data.length > 0);

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
        <p className="text-sm text-gray-500 mt-1">Items requiring immediate attention</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {alertTypes.map((alertType) => {
            if (alertType.data.length === 0) return null;

            const Icon = alertType.icon;
            const colors = getAlertColorClasses(alertType.color);

            return (
              <div key={alertType.key} className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <div>
                    <h4 className={`font-medium ${colors.text}`}>{alertType.title}</h4>
                    <p className="text-sm text-gray-600">{alertType.description}</p>
                  </div>
                  <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                    {alertType.data.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alertType.data.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="bg-white rounded p-3 text-sm">
                      {alertType.key === 'lowStock' && (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.product}</p>
                            <p className="text-gray-600">{item.location}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${colors.text}`}>
                              {item.currentStock} / {item.threshold}
                            </p>
                            <p className="text-xs text-gray-500">Current / Threshold</p>
                          </div>
                        </div>
                      )}

                      {alertType.key === 'outOfStock' && (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.product}</p>
                            <p className="text-gray-600">{item.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Last sold: {new Date(item.lastSold).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {alertType.key === 'deadStock' && (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.product}</p>
                            <p className="text-gray-600">{item.location}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${colors.text}`}>
                              {item.daysInStock} days
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {item.currentStock}
                            </p>
                          </div>
                        </div>
                      )}

                      {alertType.key === 'overstock' && (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.product}</p>
                            <p className="text-gray-600">{item.location}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${colors.text}`}>
                              {item.currentStock} / {item.averageDemand}
                            </p>
                            <p className="text-xs text-gray-500">Current / Avg Demand</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {alertType.data.length > 5 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">
                        +{alertType.data.length - 5} more items
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
