import React, { useState } from 'react';
import { Search, User, ChevronRight, ShoppingBag, Heart, X, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { UserIcon } from '../Common/UserIcon';
import api from '../../services/api';

interface NavigationCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subCategories?: {
    name: string;
    slug: string;
  }[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/navigation');
        setCategories(response.data.filter((cat: NavigationCategory) => cat.isActive));
      } catch (error) {
        console.error('Error fetching navigation:', error);
        // Fallback to default categories if API fails
        setCategories([
          { _id: '1', name: t('navigation.newIn'), slug: 'new-in', isActive: true },
          { _id: '2', name: t('navigation.women'), slug: 'women', isActive: true },
          { _id: '3', name: t('navigation.men'), slug: 'men', isActive: true },
          { _id: '4', name: t('navigation.accessories'), slug: 'accessories', isActive: true },
          { _id: '5', name: t('navigation.sale'), slug: 'sale', isActive: true }
        ]);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="relative w-full max-w-xs bg-white h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          {user ? (
            <div className="flex items-center gap-3">
              <UserIcon name={user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link
                to="/login"
                className="flex items-center gap-2 text-gray-900 font-medium"
                onClick={onClose}
              >
                <User className="w-5 h-5" />
                Sign In / Register
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Categories */}
          <div className="py-2">
            {categories.map((category) => (
              <div key={category._id}>
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category._id ? null : category._id
                  )}
                  className="flex items-center justify-between w-full p-4 text-gray-900 hover:bg-gray-50"
                >
                  <span className="font-medium">{category.name}</span>
                  {category.subCategories && category.subCategories.length > 0 && (
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedCategory === category._id ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Sub Categories */}
                {expandedCategory === category._id && category.subCategories && (
                  <div className="bg-gray-50 py-2">
                    {category.subCategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/category/${category.slug}/${sub.slug}`}
                        className="block px-8 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={onClose}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="border-t py-2">
            <button
              onClick={() => handleNavigate('/cart')}
              className="flex items-center justify-between w-full p-4 text-gray-900 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <span>Shopping Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavigate('/wishlist')}
              className="flex items-center justify-between w-full p-4 text-gray-900 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-600 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>© 2024 Eva Curves</span>
            <Link 
              to="/contact" 
              className="hover:text-gray-900"
              onClick={onClose}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}