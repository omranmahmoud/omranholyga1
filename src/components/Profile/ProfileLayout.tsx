import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { User, Package, Heart, Settings, CreditCard, Star } from 'lucide-react';
import { UserProfile } from './UserProfile';
import { UserOrders } from './UserOrders';
import { UserWishlist } from './UserWishlist';
import { UserSettings } from './UserSettings';
import { UserPayments } from './UserPayments';
import { UserReviews } from './UserReviews';
import { useAuth } from '../../context/AuthContext';

export function ProfileLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Profile', icon: User, to: '/profile' },
    { name: 'Orders', icon: Package, to: '/profile/orders' },
    { name: 'Wishlist', icon: Heart, to: '/profile/wishlist' },
    { name: 'Reviews', icon: Star, to: '/profile/reviews' },
    { name: 'Payment Methods', icon: CreditCard, to: '/profile/payments' },
    { name: 'Settings', icon: Settings, to: '/profile/settings' }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-600">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="bg-white rounded-xl shadow-sm divide-y">
              {navigation.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.name}
                    to={item.to}
                    className={`flex items-center gap-3 px-6 py-4 transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="bg-white rounded-xl shadow-sm p-6">
            <Routes>
              <Route path="/" element={<UserProfile />} />
              <Route path="/orders" element={<UserOrders />} />
              <Route path="/wishlist" element={<UserWishlist />} />
              <Route path="/reviews" element={<UserReviews />} />
              <Route path="/payments" element={<UserPayments />} />
              <Route path="/settings" element={<UserSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}