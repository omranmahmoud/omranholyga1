import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image, Modal, PanResponder, Animated, Easing, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { fetchProducts, fetchProductsByCategory } from '../services/productService';
import ProductCard, { Product } from '../components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_CONTENT_WIDTH, getContainerWidth } from '../utils/layout';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { fetchCategories, Category as Cat } from '../services/categoryService';
import { formatPrice } from '../utils/format';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export default function ProductListScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const cartCount = useMemo(() => cart.reduce((sum, it) => sum + (it.quantity ?? 0), 0), [cart]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]); // base list for current category
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Cat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [popularSort, setPopularSort] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPriceText, setMinPriceText] = useState('');
  const [maxPriceText, setMaxPriceText] = useState('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [openProductType, setOpenProductType] = useState(true);
  const [openCategory, setOpenCategory] = useState(true);
  const [openPriceRange, setOpenPriceRange] = useState(true);
  const [openSize, setOpenSize] = useState(false);
  const [openPatternType, setOpenPatternType] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openStyle, setOpenStyle] = useState(false);
  const [openLength, setOpenLength] = useState(false);
  const [openSleeveLength, setOpenSleeveLength] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // per-item image index for list view swipe gallery
  const [listImageIndices, setListImageIndices] = useState<Record<string, number>>({});
  const updateListImageIndex = (id: string, idx: number) => {
    setListImageIndices(prev => (prev[id] === idx ? prev : { ...prev, [id]: idx }));
  };
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const containerWidth = getContainerWidth(width, MAX_CONTENT_WIDTH);
  const [stickyHeight, setStickyHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const STICKY_TOP = insets.top + 32; // push header further down from the very top
  const listRef = useRef<FlatList<any> | null>(null);
  const FAB_VERTICAL_OFFSET = 48; // raise FABs a bit from bottom
  const upBtnScale = useRef(new Animated.Value(1)).current;
  const upBtnTY = useRef(new Animated.Value(0)).current;
  const AnimatedTOpacity: any = useMemo(() => Animated.createAnimatedComponent(TouchableOpacity as any), []);

  // FAB visibility driven by scroll
  const fabOpacity = useMemo(() => scrollY.interpolate({
    inputRange: [40, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }), [scrollY]);
  const fabTranslateY = useMemo(() => scrollY.interpolate({
    inputRange: [40, 120],
    outputRange: [16, 0],
    extrapolate: 'clamp',
  }), [scrollY]);
  const fabScale = useMemo(() => scrollY.interpolate({
    inputRange: [40, 120],
    outputRange: [0.96, 1],
    extrapolate: 'clamp',
  }), [scrollY]);
  // Icon appear as dot then expand
  const openProgress = fabOpacity; // 0..1
  const iconScale = useMemo(() => openProgress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.01, 0.4, 1],
    extrapolate: 'clamp',
  }), [openProgress]);
  const iconOpacity = useMemo(() => openProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.2, 1],
    extrapolate: 'clamp',
  }), [openProgress]);
  const dotScale = useMemo(() => openProgress.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0.7, 1.1, 0.4, 0],
    extrapolate: 'clamp',
  }), [openProgress]);
  const dotOpacity = useMemo(() => openProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  }), [openProgress]);
  // Background circle expand from a dot
  const bgScale = useMemo(() => openProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.01, 0.8, 1],
    extrapolate: 'clamp',
  }), [openProgress]);

  // responsive spacing
  const BASE_PAD = containerWidth >= 1000 ? 20 : containerWidth >= 700 ? 16 : 12;
  const PADDING_H = BASE_PAD + Math.max(insets.left, insets.right);
  const GAP = containerWidth >= 700 ? 14 : 10;
  // move header down from the very top; scale a bit with safe area
  const HEADER_OFFSET = Math.max(36, Math.round(insets.top * 0.5) + 28);

  // dynamic column calculation with a minimum card width so it scales on any device
  const MIN_CARD_WIDTH = 140; // keep in sync with ProductCard defaults
  const MAX_COLS = 6;
  const COLS = useMemo(() => {
    const inner = containerWidth - PADDING_H * 2;
    const raw = Math.floor((inner + GAP) / (MIN_CARD_WIDTH + GAP));
    const clamped = Math.max(1, Math.min(MAX_COLS, raw));
    return clamped;
  }, [containerWidth, PADDING_H, GAP]);

  const cardWidth = useMemo(() => {
    const inner = containerWidth - PADDING_H * 2 - GAP * (COLS - 1);
    return Math.floor(inner / COLS);
  }, [containerWidth, PADDING_H, COLS, GAP]);

  // helper: safe URL resolve similar to ProductCard
  const resolveImageUrl = (src?: string): string | undefined => {
    if (!src) return undefined;
    const s = src.trim();
    if (!s) return undefined;
    if (/^https?:\/\//i.test(s)) return s;
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    if (s.startsWith('/')) return `${base}${s}`;
    return `${base}/${s}`;
  };

  useEffect(() => {
    const passedCat = route?.params?.category;
    if (passedCat) {
      setSelectedCategory(passedCat);
    }
    setLoading(true);
    (async () => {
      try {
        const [productsData, catsData] = await Promise.all([
          passedCat ? fetchProductsByCategory(passedCat) : fetchProducts(),
          fetchCategories().catch(() => [] as Cat[]),
        ]);
        setCategories(catsData);
        setSourceProducts(productsData);
        setProducts(applyView(productsData));
      } catch (e) {
        console.warn('Failed to load products list', e);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, [route?.params?.category]);

  // filter by category
  const handleSelectCategory = async (id: string) => {
    setSelectedCategory(id);
    setLoading(true);
    try {
  const data = await fetchProductsByCategory(id);
  setSourceProducts(data);
  setProducts(applyView(data));
    } catch (e) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const clearCategory = async () => {
    setSelectedCategory(null);
    setLoading(true);
    try {
      const data = await fetchProducts();
  setSourceProducts(data);
  setProducts(applyView(data));
    } catch (e) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // helper: sort products by price based on current or provided mode
  const sortByPrice = (list: Product[], mode: 'none' | 'asc' | 'desc' = priceSort): Product[] => {
    if (!list) return [];
    if (mode === 'none') return [...list];
    const sign = mode === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const ap = typeof a.price === 'number' ? a.price : 0;
      const bp = typeof b.price === 'number' ? b.price : 0;
      if (ap === bp) return 0;
      return ap < bp ? -1 * sign : 1 * sign;
    });
  };

  const sortByPopular = (list: Product[]): Product[] => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      const as = typeof a.sold === 'number' ? a.sold : 0;
      const bs = typeof b.sold === 'number' ? b.sold : 0;
      if (as !== bs) return bs - as; // desc by sold
      const ar = typeof a.rating === 'number' ? a.rating : 0;
      const br = typeof b.rating === 'number' ? b.rating : 0;
      return br - ar; // tie-break by rating desc
    });
  };

  const applySort = (list: Product[], priceMode: 'none' | 'asc' | 'desc' = priceSort, popular = popularSort): Product[] => {
    if (popular) return sortByPopular(list);
    return sortByPrice(list, priceMode);
  };

  const applyFilter = (list: Product[], minV: number | null = minPrice, maxV: number | null = maxPrice): Product[] => {
    if (minV == null && maxV == null) return [...list];
    return list.filter((p) => {
      const price = typeof p.price === 'number' ? p.price : 0;
      if (minV != null && price < minV) return false;
      if (maxV != null && price > maxV) return false;
      return true;
    });
  };

  const applyView = (
    list: Product[],
    priceMode: 'none' | 'asc' | 'desc' = priceSort,
    popular = popularSort,
    minV: number | null = minPrice,
    maxV: number | null = maxPrice
  ): Product[] => {
    const featureFiltered = featuredOnly ? list.filter((p) => !!p.isFeatured) : list;
    const filtered = applyFilter(featureFiltered, minV, maxV);
    // Hide products that are fully out of stock: stock===0 OR (colors exist but none have sizes in stock)
    const stockFiltered = filtered.filter((p) => {
      const totalStock = typeof (p as any).stock === 'number' ? (p as any).stock : undefined;
      const hasSizeStock = Array.isArray((p as any).colors)
        ? (p as any).colors.some((c: any) => !Array.isArray(c.sizes) || c.sizes.some((s: any) => (s?.stock ?? 0) > 0))
        : true;
      if (totalStock === 0) return false;
      return hasSizeStock;
    });
    return applySort(stockFiltered, priceMode, popular);
  };

  const togglePriceSort = () => {
    const next: 'asc' | 'desc' = priceSort === 'asc' ? 'desc' : 'asc';
    setPopularSort(false);
    setPriceSort(next);
  setProducts(applyView(sourceProducts, next, false));
  };

  const togglePopularSort = () => {
    if (popularSort) {
      // turn off -> go back to current price sort (or recommend)
      setPopularSort(false);
  setProducts(applyView(sourceProducts, priceSort, false));
    } else {
      // turn on -> disable price sort and sort by popularity
      setPriceSort('none');
      setPopularSort(true);
  setProducts(applyView(sourceProducts, 'none', true));
    }
  };

  const activateRecommend = async () => {
    // Reset to default server ordering (recommended). Keep current category filter.
    setPopularSort(false);
    setPriceSort('none');
    setLoading(true);
    try {
      const data = selectedCategory
        ? await fetchProductsByCategory(selectedCategory)
        : await fetchProducts();
      setSourceProducts(data);
      setProducts(applyView(data, 'none', false));
    } catch (e) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const onApplyFilter = async () => {
    const parseNum = (s: string | null | undefined) => {
      if (!s) return null;
      const cleaned = s.replace(/[^0-9.,]/g, '').replace(',', '.');
      if (cleaned.trim() === '') return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    };
    let safeMin = parseNum(minPriceText);
    let safeMax = parseNum(maxPriceText);
    // clamp within known data range if available
    if (safeMin != null) safeMin = Math.max(priceStats.min, Math.min(priceStats.max, safeMin));
    if (safeMax != null) safeMax = Math.max(priceStats.min, Math.min(priceStats.max, safeMax));
    // ensure order if both present
    if (safeMin != null && safeMax != null && safeMin > safeMax) {
      const tmp = safeMin; safeMin = safeMax; safeMax = tmp;
    }
    setMinPrice(safeMin);
    setMaxPrice(safeMax);
    setFilterOpen(false);
    // If category selection changed in modal, refetch base list
    let base = sourceProducts;
    if (pendingCategory !== selectedCategory) {
      setLoading(true);
      try {
        base = pendingCategory
          ? await fetchProductsByCategory(pendingCategory)
          : await fetchProducts();
        setSelectedCategory(pendingCategory);
        setSourceProducts(base);
      } catch (e) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    setProducts(applyView(base, priceSort, popularSort, safeMin, safeMax));
  };

  const onResetFilter = () => {
  // Reset in-modal controls without applying filters or closing
  setFeaturedOnly(false);
  setPendingCategory(null); // All categories
  setMinPriceText(priceStats.min ? String(priceStats.min) : '');
  setMaxPriceText(priceStats.max ? String(priceStats.max) : '');
  setSliderMin(0);
  setSliderMax(1);
  };

  const priceStats = useMemo(() => {
    if (!sourceProducts.length) return { min: 0, max: 0 };
    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    for (const p of sourceProducts) {
      const val = typeof p.price === 'number' ? p.price : 0;
      if (val < lo) lo = val;
      if (val > hi) hi = val;
    }
    if (!Number.isFinite(lo)) lo = 0;
    return { min: Math.floor(lo), max: Math.ceil(hi) };
  }, [sourceProducts]);

  // range slider state (fractions 0..1 along the track)
  const [trackWidth, setTrackWidth] = useState(0);
  const [sliderMin, setSliderMin] = useState(0); // 0..1
  const [sliderMax, setSliderMax] = useState(1); // 0..1
  const leftStart = useRef(0);
  const rightStart = useRef(1);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const span = Math.max(0, priceStats.max - priceStats.min);
  const valueFromFraction = (f: number) => {
    if (span <= 0) return priceStats.min;
    return Math.round(priceStats.min + f * span);
  };
  const fractionFromValue = (val: number) => {
    if (span <= 0) return 0;
    return clamp((val - priceStats.min) / span, 0, 1);
  };

  // keep slider in sync when opening filter or when inputs change
  useEffect(() => {
  if (!filterOpen) return;
    const minTextNum = minPriceText.trim() !== '' ? Number(minPriceText) : priceStats.min;
    const maxTextNum = maxPriceText.trim() !== '' ? Number(maxPriceText) : priceStats.max;
    const safeMin = Number.isFinite(minTextNum) ? minTextNum : priceStats.min;
    const safeMax = Number.isFinite(maxTextNum) ? maxTextNum : priceStats.max;
    const fMin = fractionFromValue(safeMin);
    const fMax = fractionFromValue(safeMax);
    // ensure order
    const loF = Math.min(fMin, fMax);
    const hiF = Math.max(fMin, fMax);
    setSliderMin(loF);
    setSliderMax(hiF);
  }, [filterOpen, minPriceText, maxPriceText, priceStats.min, priceStats.max]);

  // when priceStats change while modal is closed, keep slider bounds sensible on next open
  useEffect(() => {
    if (filterOpen) return; // handled by the other effect
    setSliderMin(0);
    setSliderMax(1);
  }, [priceStats.min, priceStats.max, filterOpen]);

  // initialize inputs and slider when opening
  const openFilter = () => {
    // Initialize modal state from current selections
    setPendingCategory(selectedCategory);
    setMinPriceText(minPrice != null ? String(minPrice) : (priceStats.min ? String(priceStats.min) : ''));
    setMaxPriceText(maxPrice != null ? String(maxPrice) : (priceStats.max ? String(priceStats.max) : ''));
  // prepare slide animation
  slideAnim.setValue(0);
  setFilterOpen(true);
  };

  // Pan responders for the two handles
  const leftPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          leftStart.current = sliderMin;
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!trackWidth) return;
          const dx = gestureState.dx / trackWidth;
          let next = clamp(leftStart.current + dx, 0, sliderMax);
          setSliderMin(next);
          const val = valueFromFraction(next);
          setMinPriceText(String(val));
        },
      }),
    [sliderMin, sliderMax, trackWidth, priceStats.min, priceStats.max]
  );

  const rightPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          rightStart.current = sliderMax;
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!trackWidth) return;
          const dx = gestureState.dx / trackWidth;
          let next = clamp(rightStart.current + dx, sliderMin, 1);
          setSliderMax(next);
          const val = valueFromFraction(next);
          setMaxPriceText(String(val));
        },
      }),
    [sliderMin, sliderMax, trackWidth, priceStats.min, priceStats.max]
  );

  // slide-in animation for filter panel
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  useEffect(() => {
    if (filterOpen) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [filterOpen, slideAnim]);

  const closeFilter = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setFilterOpen(false));
  };

  // Category scale on scroll
  const catScale = useMemo(() => scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.86],
    extrapolate: 'clamp',
  }), [scrollY]);
  const headerRowScale = useMemo(() => scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  }), [scrollY]);
  const headerRowTY = useMemo(() => scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -4],
    extrapolate: 'clamp',
  }), [scrollY]);
  const catTY = useMemo(() => scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -2],
    extrapolate: 'clamp',
  }), [scrollY]);

  // List header (scrolls with the content): sort/filter and chips only
  const renderListHeader = () => (
    <View style={{ backgroundColor: '#fff' }}>
      {containerWidth >= 900 ? (
  <View style={{ width: containerWidth, alignSelf: 'center', paddingHorizontal: PADDING_H, paddingVertical: 10 }}>
          {/* Sort/Filter row (wide) */}
            <View style={ls.sortRow}>
              <TouchableOpacity style={ls.sortItem} onPress={activateRecommend}>
    <Text style={[ls.sortText, !popularSort && priceSort === 'none' && ls.sortTextActive]}>{t('productList.recommend')}</Text>
                <Ionicons name="chevron-down" size={14} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity style={ls.sortItem} onPress={togglePopularSort}>
    <Text style={[ls.sortText, popularSort && ls.sortTextActive]}>{t('productList.mostPopular')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ls.sortItem} onPress={togglePriceSort}>
    <Text style={[ls.sortText, priceSort !== 'none' && ls.sortTextActive]}>{t('productList.price')}</Text>
                <Ionicons name="swap-vertical-outline" size={16} color={priceSort !== 'none' ? '#111' : '#6b7280'} />
              </TouchableOpacity>
              <View style={ls.sortDivider} />
              <TouchableOpacity style={ls.sortItem} onPress={openFilter}>
    <Text style={[ls.sortText, ((minPrice != null || maxPrice != null || featuredOnly)) && ls.sortTextActive]}>{t('productList.filter')}</Text>
                <Ionicons name="funnel-outline" size={16} color={(minPrice != null || maxPrice != null || featuredOnly) ? '#111' : '#6b7280'} />
              </TouchableOpacity>
              {selectedCategory && (
                <TouchableOpacity onPress={clearCategory} style={[ls.sortItem, { marginLeft: 'auto' }]}> 
                  <Ionicons name="close-circle-outline" size={16} color="#6b7280" />
      <Text style={ls.sortText}>{t('productList.clear')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[t('common.trends'), t('productList.category'), t('productList.size'), t('productList.patternType'), t('productList.color'), t('productList.filter')].map((label, i) => (
                <TouchableOpacity key={i} style={[ls.chip, { paddingHorizontal: GAP + 8, paddingVertical: 8 }]} activeOpacity={0.8}>
                  <Text style={[ls.chipText, { fontSize: containerWidth >= 1200 ? 14 : 13 }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
      ) : (
        <>
          {/* Sort/Filter row (compact) */}
          <View style={{ width: containerWidth, alignSelf: 'center', paddingHorizontal: PADDING_H }}>
              <View style={ls.sortRow}>
                <TouchableOpacity style={ls.sortItem} onPress={activateRecommend}>
                  <Text style={[ls.sortText, !popularSort && priceSort === 'none' && ls.sortTextActive]}>{t('productList.recommend')}</Text>
                  <Ionicons name="chevron-down" size={14} color="#111" />
                </TouchableOpacity>
                {containerWidth >= 360 ? (
                  <TouchableOpacity style={ls.sortItem} onPress={togglePopularSort}>
                    <Text style={[ls.sortText, popularSort && ls.sortTextActive]}>{t('productList.mostPopular')}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={ls.sortItem} onPress={togglePriceSort}>
                  <Text style={[ls.sortText, priceSort !== 'none' && ls.sortTextActive]}>{t('productList.price')}</Text>
                  <Ionicons name="swap-vertical-outline" size={16} color={priceSort !== 'none' ? '#111' : '#6b7280'} />
                </TouchableOpacity>
                {containerWidth >= 360 ? <View style={ls.sortDivider} /> : null}
                <TouchableOpacity style={ls.sortItem} onPress={openFilter}>
                  <Text style={[ls.sortText, ((minPrice != null || maxPrice != null || featuredOnly)) && ls.sortTextActive]}>{t('productList.filter')}</Text>
                  <Ionicons name="funnel-outline" size={16} color={(minPrice != null || maxPrice != null || featuredOnly) ? '#111' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            </View>
            {/* Filter modal - slide in from right */}
            <Modal visible={filterOpen} transparent animationType="none" onRequestClose={closeFilter}>
              <View style={ls.sideOverlay}>
                <Pressable style={ls.sideBackdrop} onPress={closeFilter} />
                {(() => {
                  const panelWidth = Math.min(containerWidth - PADDING_H * 2, 520);
                  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [panelWidth, 0] });
                  return (
                    <Animated.View style={[
                      ls.sidePanel,
                      { width: panelWidth, transform: [{ translateX }], paddingTop: insets.top + 12 },
                    ]}>
                      <View style={ls.modalHeader}>
                        <TouchableOpacity accessibilityLabel={t('common.close')} onPress={closeFilter} style={ls.iconBtn}>
                          <Ionicons name="close" size={20} color="#111" />
                        </TouchableOpacity>
                        <Text style={[ls.modalTitle, { flex: 1, textAlign: 'center' }]}>{t('productList.filter')}</Text>
                        {/* spacer to balance the close button */}
                        <View style={ls.iconBtn} />
                      </View>

                      {/* Product Type (accordion) */}
                      <TouchableOpacity onPress={() => setOpenProductType((v) => !v)} style={ls.sectionHeader}>
                        <Text style={ls.sectionTitle}>{t('productList.productType')}</Text>
                        <Ionicons name={openProductType ? 'chevron-up' : 'chevron-down'} size={18} color="#111" />
                      </TouchableOpacity>
                      {openProductType && (
                        <View style={{ paddingHorizontal: 2, paddingBottom: 10 }}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <TouchableOpacity onPress={() => setFeaturedOnly((v) => !v)} style={[ls.chip, featuredOnly && { borderColor: '#111', backgroundColor: '#111' }]}>
                              <Text style={[ls.chipText, featuredOnly && { color: '#fff' }]}>{t('common.trends')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Category (accordion) */}
                      <TouchableOpacity onPress={() => setOpenCategory((v) => !v)} style={ls.sectionHeader}>
                        <Text style={ls.sectionTitle}>{t('productList.category')}</Text>
                        <Ionicons name={openCategory ? 'chevron-up' : 'chevron-down'} size={18} color="#111" />
                      </TouchableOpacity>
                      {openCategory && (
                        <View style={{ paddingHorizontal: 2, paddingBottom: 10 }}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {/* All option */}
                            <TouchableOpacity onPress={() => setPendingCategory(null)} style={[ ls.modalChip, (pendingCategory ?? selectedCategory) == null && { borderColor: '#111', backgroundColor: '#111' } ]}>
                              <Text style={[ls.modalChipText, (pendingCategory ?? selectedCategory) == null && { color: '#fff' }]}>{t('common.all')}</Text>
                            </TouchableOpacity>
                            {categories.slice(0, 8).map((c, i, arr) => (
                              <TouchableOpacity key={c._id} onPress={() => setPendingCategory((prev) => (prev === c._id ? null : c._id))} style={[ ls.modalChip, (pendingCategory ?? selectedCategory) === c._id && { borderColor: '#111', backgroundColor: '#111' } ]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={[ls.modalChipText, (pendingCategory ?? selectedCategory) === c._id && { color: '#fff' }]}>
                                    {c.name}
                                  </Text>
                                  {i === arr.length - 1 ? (
                                    <Ionicons name="chevron-down" size={14} color={(pendingCategory ?? selectedCategory) === c._id ? '#fff' : '#6b7280'} />
                                  ) : null}
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Price Range (accordion) */}
                      <TouchableOpacity onPress={() => setOpenPriceRange((v) => !v)} style={ls.sectionHeader}>
                        <Text style={ls.sectionTitle}>{t('productList.priceRange', { currency: 'USD' })}</Text>
                        <Ionicons name={openPriceRange ? 'chevron-up' : 'chevron-down'} size={18} color="#111" />
                      </TouchableOpacity>
                      {openPriceRange && (
                        <View style={{ paddingHorizontal: 2, paddingBottom: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={ls.priceHint}>US${priceStats.min}</Text>
                            <Text style={ls.priceHint}>US${priceStats.max}</Text>
                          </View>
                          {/* interactive range slider */}
                          <View style={ls.priceTrackWrap} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
                            {/* base track */}
                            <View style={ls.priceTrack} />
                            {/* active segment */}
                            <View pointerEvents="none" style={[ ls.priceTrackActive, { left: trackWidth * sliderMin, width: Math.max(0, trackWidth * (sliderMax - sliderMin)) } ]} />
                            {/* left handle */}
                            <View {...leftPanResponder.panHandlers} style={[ ls.priceHandle, { left: clamp(trackWidth * sliderMin - 12, -12, trackWidth - 12) } ]} />
                            {/* right handle */}
                            <View {...rightPanResponder.panHandlers} style={[ ls.priceHandle, { left: clamp(trackWidth * sliderMax - 12, -12, trackWidth - 12) } ]} />
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <View style={{ flex: 1 }}>
                              <TextInput value={minPriceText} onChangeText={(txt) => { const cleaned = txt.replace(/[^0-9.,]/g, '').replace(',', '.'); setMinPriceText(cleaned); }} placeholder={t('productList.min')} keyboardType="numeric" style={ls.modalInput} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <TextInput value={maxPriceText} onChangeText={(txt) => { const cleaned = txt.replace(/[^0-9.,]/g, '').replace(',', '.'); setMaxPriceText(cleaned); }} placeholder={t('productList.max')} keyboardType="numeric" style={ls.modalInput} />
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Footer buttons */}
                      <View style={ls.modalButtons}>
                        <TouchableOpacity onPress={onResetFilter} style={ls.btnGhost}>
                          <Text style={ls.btnGhostText}>{t('productList.clear')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onApplyFilter} style={ls.btnPrimary}>
                          <Text style={ls.btnPrimaryText}>{t('productList.done')}</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  );
                })()}
              </View>
            </Modal>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingVertical: 10, gap: 10 }} style={{ width: containerWidth, alignSelf: 'center' }}>
              {[t('common.trends'), t('productList.category'), t('productList.size'), t('productList.patternType'), t('productList.color'), t('productList.filter')].map((label, i) => (
                <TouchableOpacity key={i} style={[ls.chip, { paddingHorizontal: GAP + 6, paddingVertical: 8 }]} activeOpacity={0.8}>
                  <Text style={[ls.chipText, { fontSize: containerWidth >= 700 ? 13 : 12 }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
        </>
      )}
    </View>
  );

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Loading...</Text></View>;
  if (error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>{error}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Sticky: search + categories */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#fff', zIndex: 5, elevation: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' }}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (Math.abs(h - stickyHeight) > 0.5) setStickyHeight(h);
        }}
      >
  <View style={{ paddingTop: STICKY_TOP }}>
          {/* Top header row: back, search, actions */}
          <View style={{ width: containerWidth, alignSelf: 'center', paddingHorizontal: PADDING_H, paddingBottom: 6 }}>
            <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, transform: [{ scale: headerRowScale }, { translateY: headerRowTY }] }}>
              <TouchableOpacity accessibilityLabel={t('common.close')} onPress={() => navigation.goBack()} style={ls.iconBtn}>
                <Ionicons name="chevron-back" size={22} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Search', { initialQuery: '' })}
                style={ls.searchWrap}
                accessibilityRole="button"
                accessibilityLabel={t('productList.searchProducts')}
              >
                <Ionicons name="camera-outline" size={18} color="#9CA3AF" style={{ marginHorizontal: 10 }} />
                <Text style={ls.searchPlaceholder}>{t('productList.searchProducts')}</Text>
                <View style={ls.searchAction} pointerEvents="none">
                  <Ionicons name="search" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              {containerWidth >= 360 ? (
                <TouchableOpacity
                  accessibilityLabel={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                  style={ls.iconBtn}
                  onPress={() => setViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
                >
                  <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={18} color="#111" />
                </TouchableOpacity>
              ) : null}
                  <TouchableOpacity accessibilityLabel={t('common.wishlist')} style={[ls.iconBtn, { position: 'relative' }]} onPress={() => {
                if (!user) navigation.navigate('Login', { redirect: 'Wishlist' });
                else navigation.navigate('Wishlist');
              }}>
                <Ionicons name="heart-outline" size={20} color="#111" />
                {Array.isArray(wishlist) && wishlist.length > 0 ? (
                  <View style={ls.badge}><Text style={ls.badgeText}>{wishlist.length > 9 ? '9+' : String(wishlist.length)}</Text></View>
                ) : null}
              </TouchableOpacity>
            </Animated.View>
          </View>
          {/* Categories rail (sticky) */}
          {categories.length > 0 && (
            <Animated.View style={{ transform: [{ translateY: catTY }] }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PADDING_H, gap: 10 }} style={{ width: containerWidth, alignSelf: 'center', marginTop: 4, marginBottom: 4 }}>
              {categories.map((c) => {
                const img = c.image || c.resolvedImage;
                const url = resolveImageUrl(img);
                return (
                  <Animated.View key={c._id} style={{ transform: [{ scale: catScale }] }}>
                    <TouchableOpacity style={[ls.catItem, selectedCategory === c._id && { opacity: 0.9 }]} activeOpacity={0.8} onPress={() => handleSelectCategory(c._id)}>
                    {url ? (
                      <Image source={{ uri: url }} style={ls.catImage} />
                    ) : (
                      <View style={[ls.catImage, { backgroundColor: '#e5e7eb' }]} />
                    )}
                    <Text numberOfLines={2} style={[ls.catLabel, selectedCategory === c._id && ls.catLabelActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </View>
      {(() => {
        // Use Animated.FlatList for native-driven onScroll
        const AnimatedFlatList: any = Animated.createAnimatedComponent(FlatList as any);
        return (
          <AnimatedFlatList
  ref={listRef}
  style={{ width: containerWidth, alignSelf: 'center' }}
        key={viewMode === 'grid' ? `grid-${COLS}` : 'list'}
        data={products}
        numColumns={viewMode === 'grid' ? COLS : 1}
  keyExtractor={(item: Product) => item._id}
        ListHeaderComponent={renderListHeader}
        columnWrapperStyle={viewMode === 'grid' ? { paddingHorizontal: PADDING_H, gap: GAP, justifyContent: 'flex-start' } : undefined}
        contentContainerStyle={{ paddingTop: stickyHeight, paddingBottom: 12 + insets.bottom }}
        // drive category scaling
        onScroll={Animated.event([
          { nativeEvent: { contentOffset: { y: scrollY } } }
        ], { useNativeDriver: true })}
        scrollEventThrottle={16}
        renderItem={({ item }: { item: Product }) => (
          viewMode === 'grid' ? (
            <View style={{ width: cardWidth }}>
              <ProductCard product={item} width={cardWidth} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: PADDING_H }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                style={{ flexDirection: 'row', gap: 12, padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#eee' }}
              >
                {(() => {
                  const imgs: string[] = (item.images && item.images.length ? item.images : (item.colors?.[0]?.images || [])) || [];
                  const resolved = imgs.map(im => resolveImageUrl(im)).filter(Boolean) as string[];
                  const count = resolved.length;
                  const active = listImageIndices[item._id] || 0;
                  if (!count) {
                    return <View style={{ width: 110, height: 110, borderRadius: 10, backgroundColor: '#f3f4f6' }} />;
                  }
                  return (
                    <View style={{ width: 110, height: 110, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={110}
                        decelerationRate="fast"
                        scrollEventThrottle={16}
                        onScroll={(e) => {
                          const w = 110; // fixed
                          const x = e.nativeEvent.contentOffset.x;
                          const idx = Math.round(x / w);
                          if (idx !== active) updateListImageIndex(item._id, Math.min(Math.max(idx, 0), count - 1));
                        }}
                        style={{ width: 110, height: 110 }}
                        contentContainerStyle={{}}
                      >
                        {resolved.map((u, i) => (
                          <Image key={u + i} source={{ uri: u }} style={{ width: 110, height: 110 }} resizeMode="cover" />
                        ))}
                      </ScrollView>
                      {count > 1 && (
                        <View style={{ position: 'absolute', right: 4, bottom: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 }}>
                          {resolved.slice(0, 3).map((_, i) => (
                            <View key={i} style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 2, backgroundColor: i === active ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                          ))}
                          {count > 3 && (
                            <Text style={{ color: '#fff', fontSize: 10, marginLeft: 4 }}>{active + 1}/{count}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })()}
                <View style={{ flex: 1 }}>
                  {/* Chips row */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                    {item.isFeatured ? (
                      <Text style={{ fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', color: '#4c1d95', backgroundColor: '#ede9fe', fontWeight: '700' }}>trends</Text>
                    ) : null}
                  </View>

                  {/* Title */}
                  <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '600', color: '#222' }}>{item.name}</Text>

                  {/* Rating and count */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={((item.rating ?? 0) >= i + 1) ? 'star' : ((item.rating ?? 0) > i ? 'star-half' : 'star-outline')}
                        size={12}
                        color="#f59e0b"
                      />
                    ))}
                    {typeof item.rating === 'number' ? (
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>({item.rating.toFixed(1)})</Text>
                    ) : null}
                  </View>

                  {/* Price row with discount badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {typeof item.originalPrice === 'number' && item.originalPrice > (item.price ?? 0) ? (
                      <View style={{ backgroundColor: '#fde68a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '700' }}>-
                          {Math.round(((item.originalPrice - (item.price ?? 0)) / item.originalPrice) * 100)}%
                        </Text>
                      </View>
                    ) : null}
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>{typeof item.price === 'number' ? formatPrice(item.price) : ''}</Text>
                    {typeof item.originalPrice === 'number' && item.originalPrice > (item.price ?? 0) ? (
                      <Text style={{ fontSize: 12, color: '#999', textDecorationLine: 'line-through' }}>{typeof item.originalPrice === 'number' ? formatPrice(item.originalPrice) : ''}</Text>
                    ) : null}
                    {typeof item.sold === 'number' ? (
                      <Text style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>{t('product.sold', { count: item.sold })}</Text>
                    ) : null}
                  </View>
                </View>
                {/* Right-side actions — heart + pill cart (horizontal, bottom-right) */}
                <View style={{ position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity accessibilityLabel={t('common.wishlist')} style={{ padding: 4 }}>
                    <Ionicons name="heart-outline" size={18} color="#111" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel={t('common.addToCart')}
                    onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#111', borderRadius: 16, position: 'relative', flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ width: 18, height: 18 }}>
                      <Ionicons name="cart-outline" size={18} color="#111" />
                      <Ionicons name="add" size={10} color="#111" style={{ position: 'absolute', right: -2, top: -2 }} />
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          />
        );
      })()}

    {/* Floating actions */}
    {/* Up button (animated, appears on scroll) */}
    <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: PADDING_H,
      // place above the cart button (50 height + 12 gap)
      bottom: FAB_VERTICAL_OFFSET + insets.bottom + 62,
          zIndex: 10,
          opacity: fabOpacity,
          transform: [{ translateY: fabTranslateY }, { scale: fabScale }],
          alignItems: 'flex-end',
      gap: 12,
        }}
      >
        <AnimatedTOpacity
          accessibilityLabel={t('productList.scrollTop')}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          onPressIn={() => {
            Animated.spring(upBtnScale, {
              toValue: 0.92,
              useNativeDriver: true,
              friction: 6,
              tension: 200,
            }).start();
            Animated.spring(upBtnTY, {
              toValue: -8,
              useNativeDriver: true,
              friction: 7,
              tension: 180,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(upBtnScale, {
              toValue: 1,
              useNativeDriver: true,
              friction: 6,
              tension: 200,
            }).start();
            Animated.spring(upBtnTY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 7,
              tension: 180,
            }).start();
          }}
          activeOpacity={0.85}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
            transform: [{ scale: bgScale }, { scale: upBtnScale }, { translateY: upBtnTY }],
          }}
        >
          {/* Dot that appears first */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#111' }} />
          </Animated.View>
          {/* Arrow icon that scales in */}
          <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: iconScale }] }}>
            <Ionicons name="arrow-up" size={20} color="#111" />
          </Animated.View>
        </AnimatedTOpacity>
      </Animated.View>

      {/* Cart button (always visible, no animation) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: PADDING_H,
          bottom: FAB_VERTICAL_OFFSET + insets.bottom,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          accessibilityLabel={t('cart.title')}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#fff',
            borderWidth: cartCount > 0 ? 2 : 1,
            borderColor: cartCount > 0 ? '#111' : '#e5e7eb',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }}
        >
          <Ionicons name="cart-outline" size={22} color="#111" />
          {cartCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 3,
                borderRadius: 9,
                backgroundColor: '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#fff',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }} numberOfLines={1}>
                {cartCount > 99 ? '99+' : String(cartCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  catItem: {
  width: 68,
    alignItems: 'center',
  },
  catImage: {
  width: 50,
  height: 50,
  borderRadius: 25,
    backgroundColor: '#f3f4f6',
  },
  catLabel: {
    marginTop: 6,
  fontSize: 10.5,
    color: '#374151',
    textAlign: 'center',
  width: 68,
  },
  catLabelActive: {
    color: '#111',
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 8,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#111',
    fontWeight: '700',
  },
  sortDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: '#e5e7eb',
  },
  iconBtn: {
  width: 28,
  height: 28,
  borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchWrap: {
  flex: 1,
  height: 40,
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 20,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(242,242,242,0.97)',
  paddingRight: 6,
  },
  searchInput: {
    flex: 1,
  paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#111827',
  },
  searchAction: {
  marginRight: 2,
  width: 30,
  height: 30,
  borderRadius: 15,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: { flex: 1, color: '#888', fontSize: 15 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  chipText: {
    color: '#111',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  // Side panel styles
  sideOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sideBackdrop: {
    flex: 1,
  },
  sidePanel: {
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: -2, height: 0 },
    shadowRadius: 10,
    elevation: 8,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#111827',
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  btnGhostText: {
    color: '#111827',
    fontWeight: '700',
  },
  btnPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  priceHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceTrack: {
    height: 4,
  backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  priceTrackWrap: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  priceTrackActive: {
    position: 'absolute',
    height: 4,
  backgroundColor: '#111827',
    borderRadius: 2,
  top: 10,
  },
  priceHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#fff',
    top: 0,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  modalChipText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
});
