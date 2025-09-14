
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';

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

export function NavLinks() {
  const { t } = useTranslation();
  const { settings } = useStore();
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.getWithRetry('/navigation');
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
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);


  if (loading) {
    return (
      <div className="flex items-center gap-8">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-4 w-20 bg-gray-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Helper to signal the Navbar that a top item is hovered (to open the mega menu)
  const notifyHover = (id: string) => {
    const event = new CustomEvent('nav-hover', { detail: { id } });
    window.dispatchEvent(event);
  };

  const fontSize = settings?.navCategoryFontSize === 'small'
    ? '0.875rem'
    : settings?.navCategoryFontSize === 'large'
      ? '1.125rem'
      : '1rem';
  const color = settings?.navCategoryFontColor || 'inherit';

  return (
    <div className="flex items-center gap-8">
      {categories.map((category) => (
        <Link 
          key={category._id}
          to={`/products`}
          className="hover:theme-primary font-medium transition-colors py-2"
          style={{ color, fontSize }}
          onMouseEnter={() => notifyHover(category._id)}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
