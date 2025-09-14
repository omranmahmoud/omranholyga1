import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { convertPrice, formatPrice } from '../../utils/currency';

interface Category {
  id: string;
  name: string;
}

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  selectedFilters: string[];
  onCategoryChange: (categoryId: string) => void;
  onFilterChange: (filters: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FilterBar({ 
  categories, 
  selectedCategory, 
  selectedFilters,
  onCategoryChange, 
  onFilterChange,
  isOpen,
  onClose
}: FilterBarProps) {
  const { currency } = useCurrency();
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    sizes: true,
    colors: true,
    price: true
  });
  const [priceRanges, setPriceRanges] = useState<Array<{
    label: string;
    value: string;
    min: number;
    max: number | null;
  }>>([]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = [
    { name: 'Black', class: 'bg-gray-900' },
    { name: 'White', class: 'bg-white border border-gray-200' },
    { name: 'Navy', class: 'bg-indigo-900' },
    { name: 'Brown', class: 'bg-amber-800' },
    { name: 'Green', class: 'bg-emerald-700' },
    { name: 'Red', class: 'bg-red-600' }
  ];

  // Update price ranges when currency changes
  useEffect(() => {
    const updatePriceRanges = async () => {
      // Base ranges in USD
      const baseRanges = [
        { min: 0, max: 50 },
        { min: 50, max: 100 },
        { min: 100, max: 200 },
        { min: 200, max: 500 },
        { min: 500, max: null }
      ];

      // Convert ranges to selected currency
      const convertedRanges = await Promise.all(
        baseRanges.map(async ({ min, max }) => {
          const convertedMin = await convertPrice(min, 'USD', currency);
          const convertedMax = max ? await convertPrice(max, 'USD', currency) : null;

          return {
            min: convertedMin,
            max: convertedMax,
            value: `${min}-${max || 'up'}`,
            label: max
              ? `${formatPrice(convertedMin, currency)} - ${formatPrice(convertedMax!, currency)}`
              : `${formatPrice(convertedMin, currency)}+`
          };
        })
      );

      setPriceRanges(convertedRanges);
    };

    updatePriceRanges();
  }, [currency]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearFilters = () => {
    onCategoryChange('all');
    onFilterChange([]);
    onClose();
  };

  const FilterSection = ({ 
    title, 
    children, 
    name 
  }: { 
    title: string; 
    children: React.ReactNode; 
    name: keyof typeof expandedSections 
  }) => (
    <div className="py-4 border-b border-gray-200 last:border-0">
      <button
        onClick={() => toggleSection(name)}
        className="flex items-center justify-between w-full group"
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
          expandedSections[name] ? 'rotate-180' : ''
        }`} />
      </button>
      <div className={`mt-4 space-y-4 ${expandedSections[name] ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Drawer */}
      <div className={`
        fixed inset-0 z-40 lg:relative lg:opacity-100 lg:pointer-events-auto
        transition-opacity duration-300 ease-in-out
        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:block'}
      `}>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className={`
          fixed right-0 top-0 h-full w-[300px] bg-white transform transition-transform duration-300 ease-in-out lg:relative lg:w-64 lg:transform-none
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full overflow-y-auto p-4 lg:p-0">
            <div className="flex items-center justify-between lg:hidden mb-4">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-1">
              <FilterSection title="Categories" name="categories">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === 'all'}
                      onChange={() => {
                        onCategoryChange('all');
                        if (isOpen) onClose();
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className={`text-sm ${selectedCategory === 'all' ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
                      All Categories
                    </span>
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.id}
                        onChange={() => {
                          onCategoryChange(category.id);
                          if (isOpen) onClose();
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className={`text-sm ${selectedCategory === category.id ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Size" name="sizes">
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((size) => (
                    <label
                      key={size}
                      className="relative flex items-center justify-center"
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={selectedFilters.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onFilterChange([...selectedFilters, size]);
                          } else {
                            onFilterChange(selectedFilters.filter(f => f !== size));
                          }
                        }}
                      />
                      <div className="w-full py-2 text-sm text-center border rounded-lg cursor-pointer transition-all duration-200 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 hover:bg-gray-50 peer-checked:hover:bg-indigo-700">
                        {size}
                      </div>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Color" name="colors">
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <label
                      key={color.name}
                      className="relative group"
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={selectedFilters.includes(color.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onFilterChange([...selectedFilters, color.name]);
                          } else {
                            onFilterChange(selectedFilters.filter(f => f !== color.name));
                          }
                        }}
                      />
                      <div className={`w-8 h-8 rounded-full cursor-pointer ${color.class} ring-2 ring-transparent peer-checked:ring-indigo-600 peer-checked:ring-offset-2 transition-all duration-200`} />
                      <span className="sr-only">{color.name}</span>
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {color.name}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Price Range" name="price">
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedFilters.includes(range.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onFilterChange([...selectedFilters, range.value]);
                          } else {
                            onFilterChange(selectedFilters.filter(f => f !== range.value));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-600">{range.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Clear Filters Button - Mobile Only */}
              <div className="lg:hidden pt-4">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}