import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { tCategory, registerCategoryNames } from '../i18n';
import { useCategoryLabels } from '../hooks/useCategoryLabel';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { MAX_CONTENT_WIDTH, getContainerWidth } from '../utils/layout';

type Cat = { _id: string; name: string; image?: string; slug?: string; isActive?: boolean; order?: number };

function resolveImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  const s = src.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

type Props = { selectedNavSlug?: string };

const COLS = 4;
const GAP = 12;
const PADDING_H = 12;
const ICON_SIZE = 64; // slightly larger, rounded-square look

export default function CategoriesGrid({ selectedNavSlug = '' }: Props) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [nav, setNav] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [latestImages, setLatestImages] = useState<Record<string, string | undefined>>({});
  const navigation = useNavigation<any>();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [catRes, navRes, prodRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/navigation'),
          api.get('/api/products'), // fetch all products (consider pagination optimization later)
        ]);
        if (!mounted) return;
        const arr: Cat[] = (Array.isArray(catRes.data) ? catRes.data : [])
          .filter((c: any) => c && (c.isActive ?? true))
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        setCats(arr);
        // Dynamically add backend names/slugs to i18n fallback map
        registerCategoryNames(arr.map(c => ({ name: c.name, slug: c.slug })));
        const navArr: any[] = (Array.isArray(navRes.data) ? navRes.data : [])
          .filter((n: any) => n && (n.isActive ?? true));
        setNav(navArr);
        // Map latest product image per category
        const prods: any[] = Array.isArray(prodRes.data) ? prodRes.data : [];
        // Sort by createdAt if present to ensure chronological order; fallback to original order
        const sorted = prods.slice().sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return aTime - bTime; // ascending so later override keeps last
        });
        const map: Record<string, string | undefined> = {};
        for (const p of sorted) {
          const catId = p?.category?._id || p?.category; // support populated or raw id
            if (!catId) continue;
            let img: string | undefined = undefined;
            if (Array.isArray(p.images) && p.images.length) img = p.images[0];
            else if (Array.isArray(p.colors) && p.colors[0]?.images?.length) img = p.colors[0].images[0];
            if (img) map[String(catId)] = img;
        }
        setLatestImages(map);
        // Optionally register nav subcategory slugs if present
        navArr.forEach((n:any) => {
          if (Array.isArray(n.subCategories)) {
            registerCategoryNames(n.subCategories.map((s:any) => ({ name: s.name, slug: s.slug })));
          }
        });
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // If a navigation slug is selected (e.g., "women"), filter categories to those referenced by its subCategories
  const filteredCats = useMemo(() => {
    const slug = (selectedNavSlug || '').trim().toLowerCase();
    if (!slug) return cats; // All
    const navMatch = nav.find((n: any) => String(n?.slug || '').toLowerCase() === slug);
    if (!navMatch) return [];
    const subSlugs: string[] = Array.isArray(navMatch.subCategories)
      ? navMatch.subCategories.map((s: any) => String(s?.slug || '').toLowerCase()).filter(Boolean)
      : [];
    // If no explicit subCategories, try fallback mapping to its own slug/category relation
    const bySlugSet = new Set(subSlugs);
    let scoped = cats.filter(c => bySlugSet.has(String(c.slug || '').toLowerCase()));
    if (scoped.length === 0 && navMatch.category) {
      // If navigation is mapped to a Category, include that category id
      const mappedId = typeof navMatch.category === 'object' ? navMatch.category._id : navMatch.category;
      scoped = cats.filter(c => String(c._id) === String(mappedId));
    }
    return scoped;
  }, [cats, nav, selectedNavSlug]);

  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const containerWidth = getContainerWidth(width, MAX_CONTENT_WIDTH);
  const itemWidth = Math.floor((containerWidth - PADDING_H * 2 - GAP * (COLS - 1)) / COLS);

  const PAGE_SIZE = 12;
  const pages: Cat[][] = useMemo(() => {
    if (!filteredCats || filteredCats.length === 0) return [];
    const res: Cat[][] = [];
    for (let i = 0; i < filteredCats.length; i += PAGE_SIZE) {
      res.push(filteredCats.slice(i, i + PAGE_SIZE));
    }
    return res;
  }, [filteredCats]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const p = Math.round(x / width);
    if (p !== page) setPage(p);
  };

  // Prepare batch translation of all category names currently visible
  const allVisibleNames = useMemo(() => filteredCats.map(c => c.name).filter(Boolean) as string[], [filteredCats]);
  const labelMap = useCategoryLabels(allVisibleNames);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.header,
          {
            flexDirection: 'row',
            justifyContent: I18nManager.isRTL ? 'flex-end' : 'flex-start',
            width: containerWidth,
            alignSelf: 'center',
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { textAlign: I18nManager.isRTL ? 'right' : 'left', writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {t('common.categories')}
        </Text>
      </View>
      {pages.length <= 1 ? (
        <View style={styles.grid}>
          {filteredCats.map((c, idx) => {
            const latest = latestImages[c._id];
            const imgUrl = resolveImageUrl(latest || c.image);
            const isLastInRow = (idx + 1) % COLS === 0;
            const dynamicLabel = labelMap[c.name] || c.name;
            return (
              <TouchableOpacity
                key={c._id}
                style={[styles.item, { width: itemWidth, marginRight: isLastInRow ? 0 : GAP }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProductList', { category: c._id })}
              >
                <View style={styles.iconSquircle}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.iconImg} />
                  ) : (
                    <Text style={styles.iconFallback}>{(c.name || '?').charAt(0)}</Text>
                  )}
                </View>
                <Text numberOfLines={1} style={styles.label}>{tCategory(dynamicLabel)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <>
      <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {pages.map((group, pIdx) => (
              <View key={`page-${pIdx}`} style={[styles.page, { width }]}> 
                <View style={{ width: containerWidth, alignSelf: 'center' }}>
                  <View style={styles.grid}>
                  {group.map((c, idx) => {
                    const latest = latestImages[c._id];
                    const imgUrl = resolveImageUrl(latest || c.image);
                    const isLastInRow = (idx + 1) % COLS === 0;
                    const dynamicLabel = labelMap[c.name] || c.name;
                    return (
                      <TouchableOpacity
                        key={c._id}
                        style={[styles.item, { width: itemWidth, marginRight: isLastInRow ? 0 : GAP }]}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ProductList', { category: c._id })}
                      >
                        <View style={styles.iconSquircle}>
                          {imgUrl ? (
                            <Image source={{ uri: imgUrl }} style={styles.iconImg} />
                          ) : (
                            <Text style={styles.iconFallback}>{(c.name || '?').charAt(0)}</Text>
                          )}
                        </View>
                        <Text numberOfLines={1} style={styles.label}>{tCategory(dynamicLabel)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.dots, { width: containerWidth, alignSelf: 'center' }]}>
            {pages.map((_, i) => (
              <View key={`dot-${i}`} style={[styles.dot, i === page ? styles.dotActive : null]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  header: { paddingHorizontal: 12, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PADDING_H },
  item: { alignItems: 'center', marginBottom: GAP },
  page: { paddingVertical: 4, alignSelf: 'center' },
  iconSquircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 18,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  iconImg: { width: '100%', height: '100%' },
  iconFallback: { color: '#555', fontSize: 20, fontWeight: '700' },
  label: { fontSize: 13, color: '#374151', maxWidth: ICON_SIZE + 24, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#111827' },
});
