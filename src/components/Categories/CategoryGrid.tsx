import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  image: string;
  slug: string;
  isActive: boolean;
  order: number;
}

interface CategoryGridProps {
  itemsPerRow?: 2 | 3 | 4 | 6;
  showNames?: boolean;
}

export function CategoryGrid({ itemsPerRow = 6, showNames = true }: CategoryGridProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
  const response = await api.getWithRetry('/categories');
        const activeCategories = (response.data || [])
          .filter((cat: Category) => cat.isActive)
          .sort((a: Category, b: Category) => a.order - b.order);
        setCategories(activeCategories);
      } catch (error) {
        toast.error('Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const onClick = (cat: Category) => navigate(`/products?category=${cat._id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!categories.length) return null;

  const gridClassByCols: Record<number, string> = {
    2: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  };

  const gridColsClass = gridClassByCols[itemsPerRow] || gridClassByCols[6];

  return (
    <div className={`grid ${gridColsClass} gap-6`}>
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onClick(cat)}
          className="group text-center"
          aria-label={`Open category ${cat.name}`}
        >
          <div className="relative aspect-square w-full max-w-[128px] mx-auto rounded-[24px] overflow-hidden bg-white border border-gray-200 shadow-sm">
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          {showNames && (
            <div className="mt-2">
              <div className="text-sm sm:text-base font-medium text-gray-900">
                {cat.name}
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default CategoryGrid;
