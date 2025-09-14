import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Cart } from '../Cart/Cart';
import { WishlistModal } from '../Wishlist/WishlistModal';
import { UserDropdown } from './UserDropdown';
import { UserIcon } from '../Common/UserIcon';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { CurrencySelector } from './CurrencySelector';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { GuestLoginForm } from './GuestLoginForm';
import { useStore } from '../../context/StoreContext';
import { resolveImagePath } from '../../utils/images';

export function NavActions() {
  const { t } = useTranslation();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings } = useStore();
  const wishlistIcon = resolveImagePath(settings?.headerIcons?.wishlist);
  const cartIcon = resolveImagePath(settings?.headerIcons?.cart);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
  <CurrencySelector />

        <button
          onClick={() => setIsWishlistOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
          aria-label={t('common.wishlist')}
        >
          {wishlistIcon ? (
            <img src={wishlistIcon} alt="Wishlist" className="w-5 h-5 object-contain" />
          ) : (
            <Heart className="w-5 h-5 text-gray-600" />
          )}
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-medium">
              {wishlistCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
          aria-label={t('common.cart')}
        >
          {cartIcon ? (
            <img src={cartIcon} alt="Cart" className="w-5 h-5 object-contain" />
          ) : (
            <ShoppingBag className="w-5 h-5 text-gray-600" />
          )}
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-medium">
              {cartCount}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          {settings?.headerIcons?.user ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('common.account')}
            >
              <img src={resolveImagePath(settings?.headerIcons?.user)} alt="Account" className="w-7 h-7 object-contain rounded-full" />
            </button>
          ) : (
            <UserIcon 
              name={user?.name}
              image={user?.image}
              size="sm"
              className="ring-2 ring-white"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
          )}

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5">
              {user ? (
                <UserDropdown 
                  isOpen={true}
                  onClose={() => setIsDropdownOpen(false)}
                  user={user}
                />
              ) : (
                <GuestLoginForm onClose={() => setIsDropdownOpen(false)} />
              )}
            </div>
          )}
        </div>
      </div>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistModal isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
  {/* Search moved to centered header input; modal removed */}
    </>
  );
}