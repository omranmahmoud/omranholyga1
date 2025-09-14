import React from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  inStock: number;
}

interface InventoryStatsProps {
  stats: InventoryStats;
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'In Stock',
      value: stats.inStock,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: XCircle,
      color: 'bg-red-50 text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}