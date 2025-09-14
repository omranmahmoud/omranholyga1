import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Sparkles, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export function BottomNav() {
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Search, label: 'Search', to: '/search' },
    { icon: Sparkles, label: 'New', to: '/new-arrivals' },
    { icon: ShoppingCart, label: 'Cart', to: '/cart', badge: cartCount },
    { icon: User, label: 'Me', to: isAuthenticated ? '/profile' : '/login' }
  ];

  // Hide on auth pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-50">
      <div className="flex items-center justify-around">
        {navItems.map(({ icon: Icon, label, to, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center py-2 px-4 relative
              ${isActive ? 'text-indigo-600' : 'text-gray-500'}
              active:scale-95 transition-transform
            `}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
            {badge ? (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center animate-pulse">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}