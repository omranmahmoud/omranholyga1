import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, Heart, Star } from 'lucide-react';

export function UserProfile() {
  const { user } = useAuth();

  const stats = [
    { name: 'Orders', icon: Package, value: '12' },
    { name: 'Wishlist', icon: Heart, value: '8' },
    { name: 'Reviews', icon: Star, value: '5' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your account information.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-gray-50 rounded-xl p-6">
            <stat.icon className="w-8 h-8 text-indigo-600" />
            <p className="mt-4 text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Order Delivered</p>
                <p className="text-sm text-gray-500">Your order #1234 has been delivered</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Star className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Review Posted</p>
                <p className="text-sm text-gray-500">You reviewed Wool Blend Coat</p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Member Since</label>
            <p className="mt-1 text-gray-900">January 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}