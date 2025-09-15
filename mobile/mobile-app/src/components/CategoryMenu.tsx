import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

type NavCat = { _id: string; name: string; slug?: string };

type Props = {
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  onDark?: boolean; // when overlaid on dark/imagery background
};

const DEFAULT_CATEGORIES: NavCat[] = [
  { _id: 'all', name: 'common.all', slug: '' },
];

const CategoryMenu = ({ selectedSlug = '', onSelect, onDark = false }: Props) => {
  const [categories, setCategories] = useState<NavCat[]>(DEFAULT_CATEGORIES);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/navigation');
        if (!mounted) return;
        const cats: NavCat[] = (Array.isArray(data) ? data : [])
          .filter((c: any) => c && (c.isActive ?? true))
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((c: any) => ({ _id: String(c._id || ''), name: String(c.name || '').trim(), slug: String(c.slug || '') }))
          .filter((c: NavCat) => !!c.name);
        if (cats.length) setCategories([DEFAULT_CATEGORIES[0], ...cats]);
      } catch (_err) {
        // keep defaults on error
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.categoryMenuContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat, idx) => {
          const isAll = idx === 0;
          const isActive = isAll ? !selectedSlug : (cat.slug || '') === selectedSlug;
          const dynamicTextStyles = [
            styles.categoryText,
            isActive && styles.categoryTextActive,
            onDark && { color: '#fff', opacity: isActive ? 1 : 0.85 },
            onDark && isActive && { textDecorationColor: '#fff' },
          ];
          return (
            <TouchableOpacity
              key={`${cat.slug || cat._id}-${idx}`}
              style={styles.categoryBtn}
              onPress={() => onSelect && onSelect(isAll ? '' : (cat.slug || ''))}
            >
              <Text style={dynamicTextStyles}>
                {cat.name === 'common.all' ? t('common.all') : cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryMenuContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  categoryBtn: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  categoryText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '700', // bold for all items
  },
  categoryTextActive: {
  color: '#111',
  fontWeight: '700', // remains bold; color + underline differentiate
  textDecorationLine: 'underline',
  textDecorationColor: '#111',
  },
});

export default CategoryMenu;
