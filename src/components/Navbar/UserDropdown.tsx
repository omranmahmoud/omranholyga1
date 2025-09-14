import React from 'react';
import { Settings, LogOut, Heart, Package, CreditCard, Star } from 'lucide-react';
import { UserIcon } from '../Common/UserIcon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function UserDropdown({ isOpen, onClose, user }: UserDropdownProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  if (!isOpen) return null;

  const menuItems = [
    { icon: Package, label: 'Orders', onClick: () => navigate('/orders') },
    { icon: Heart, label: 'Wishlist', onClick: () => navigate('/wishlist') },
    { icon: Star, label: 'Reviews', onClick: () => navigate('/reviews') },
    { icon: CreditCard, label: 'Payment Methods', onClick: () => navigate('/payment-methods') },
    { icon: Settings, label: 'Settings', onClick: () => navigate('/settings') },
    { 
      icon: LogOut, 
      label: 'Sign Out',
      onClick: () => {
        logout();
        navigate('/login');
        onClose();
      }
    },
  ];

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <UserIcon 
            name={user?.name} 
            image={user?.image}
            size="sm" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Guest User'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.email || 'guest@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}