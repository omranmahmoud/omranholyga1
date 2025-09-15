import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import ProductCard, { Product } from '../components/ProductCard';
import FlashSaleProductCard from '../components/FlashSaleProductCard';
import { formatPrice } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

// Minimal Flash Sale product shape extension (server likely returns flashSaleEnd, flashPrice)
interface FlashSaleProduct extends Product {
  flashPrice?: number;           // discounted price during flash sale
  flashSaleEndsAt?: string;      // ISO date string for countdown
  flashSaleStartsAt?: string;    // optional start time (used for slot heading)
  categoryName?: string;         // lightweight category name for filter chips
  _compositeId?: string;         // unique key (saleId + productId + index) to avoid duplicate key collisions
  colors?: { name?: string; images?: any[]; sizes?: { name: string; stock: number }[] }[]; // minimal color variant info
  sold?: number;                 // units sold (optional)
  description?: string;
}

const FlashSaleScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [filtered, setFiltered] = useState<FlashSaleProduct[]>([]);
  // NOTE: removed page-level ticking 'now' state to avoid re-rendering the entire FlatList every second.
  // Countdown moved into isolated component below.
  const { cart } = useCart();
  const cartCount = useMemo(() => cart.reduce((s, i) => s + (i.quantity || 0), 0), [cart]);
  // Aggregate flash sale savings for items currently in cart (original - flash) * qty
  const flashSavings = useMemo(() => {
    if (!products.length || !cart.length) return 0;
    const map = new Map(products.map(p => [p._id, p]));
    let total = 0;
    cart.forEach(ci => {
      const p = map.get(ci.productId);
      if (p && p.flashPrice != null && p.originalPrice != null && p.originalPrice > p.flashPrice) {
        total += (p.originalPrice - p.flashPrice) * (ci.quantity || 1);
      }
    });
    return total;
  }, [cart, products]);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gridColumns = 2;
  // Outer horizontal padding for FlatList row (columnWrapperStyle paddingHorizontal:12)
  const outerPadding = 24; // 12 left + 12 right
  const interItemGap = 12; // visual space between two cards
  const cardWidth = useMemo(() => {
    if (layoutMode === 'list') return width - outerPadding; // full width for list
    const available = width - outerPadding - interItemGap; // subtract gap once between 2 items
    return Math.floor(available / gridColumns);
  }, [layoutMode, width]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // Track which product ids have already been hydrated (details fetched) to avoid duplicate network calls
  const hydratedIdsRef = useRef<Set<string>>(new Set());
  // Keep a ref of last products to allow fetchFlashSale to reference previous data without being in its deps
  const prevProductsRef = useRef<FlashSaleProduct[]>([]);
  useEffect(() => { prevProductsRef.current = products; }, [products]);

  // Centralized URL resolver (mirror logic in ProductCard so we store already absolute URLs)
  const resolveImageUrl = (raw?: any): string | null => {
    if (!raw) return null;
    let val = raw;
    if (typeof val === 'object') {
      val = val?.url || val?.path || val?.src || val?.file || val?.location || '';
    }
    if (typeof val !== 'string') return null;
    let s = val.trim();
    if (!s) return null;
    s = s.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s; // already absolute
    const lower = s.toLowerCase();
    // Normalize variants that should map to /api/uploads
    if (lower.startsWith('/api/uploads/')) return (api.defaults.baseURL || '').replace(/\/$/, '') + s;
    const match = lower.match(/(?:^|\/)(public\/)?uploads\/(.+)$/);
    if (match) return `${(api.defaults.baseURL || '').replace(/\/$/, '')}/api/uploads/${match[2]}`;
    if (lower.startsWith('/uploads/')) return `${(api.defaults.baseURL || '').replace(/\/$/, '')}/api${s}`;
    if (lower.startsWith('uploads/')) return `${(api.defaults.baseURL || '').replace(/\/$/, '')}/api/${s}`;
    if (!s.startsWith('/')) s = '/' + s;
    return (api.defaults.baseURL || '').replace(/\/$/, '') + s;
  };

  const CACHE_KEY = 'flashSaleImageCache_v1';

  // On mount, attempt to seed from cache (if products still empty)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return;
        const cache: Record<string, { images: string[]; name?: string; price?: number; originalPrice?: number }> = JSON.parse(raw);
        if (cache && Object.keys(cache).length && products.length === 0) {
          const pre: FlashSaleProduct[] = Object.entries(cache).map(([id, v]) => ({
            _id: id,
            name: v.name || '—',
            price: v.price || 0,
            originalPrice: v.originalPrice,
            images: v.images,
            _compositeId: 'cache_' + id,
            _needsHydration: false,
          } as any));
          if (pre.length) setProducts(pre);
        }
      } catch {/* ignore */}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistCache = useCallback((list: FlashSaleProduct[]) => {
    const out: Record<string, { images: string[]; name?: string; price?: number; originalPrice?: number }> = {};
    list.forEach(p => {
      if (p._id && p.images && p.images.length && !/placeholder|via\.placeholder/.test(p.images[0])) {
        out[p._id] = { images: p.images.slice(0,6), name: p.name, price: p.price, originalPrice: p.originalPrice };
      }
    });
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(out)).catch(() => {});
  }, []);

  // NOTE: Avoid including `products` in deps to prevent infinite fetch loop.
  const fetchFlashSale = useCallback(async (isPullRefresh: boolean = false) => {
    try {
      if (!refreshing && !isPullRefresh) setLoading(true);
      const { data } = await api.get('/api/flash-sales/public/active/list');
      try {
        if (__DEV__) {
          console.log('[FlashSaleScreen][debug] raw flash sales length:', Array.isArray(data) ? data.length : 'not-array');
          if (Array.isArray(data) && data[0]) {
            const sample = JSON.parse(JSON.stringify(data[0]));
            // Avoid flooding: only log keys + first item product keys
            console.log('[FlashSaleScreen][debug] sample sale keys:', Object.keys(sample));
            if (sample.items && sample.items[0]) {
              const si = sample.items[0];
              console.log('[FlashSaleScreen][debug] first item product fields:', si.product ? Object.keys(si.product) : 'no product');
              console.log('[FlashSaleScreen][debug] first item product.images:', si.product?.images);
              console.log('[FlashSaleScreen][debug] first item product.colors[0]?.images:', si.product?.colors && si.product.colors[0]?.images);
            }
          }
        }
      } catch {}

      // If this is an explicit pull-to-refresh, allow re-hydration again
  if (refreshing || isPullRefresh) {
        hydratedIdsRef.current.clear();
      }

  // Map of previous products so we can retain already-hydrated images & names (using ref to avoid re-fetch loops)
  const prevMap = new Map(prevProductsRef.current.map(p => [p._id, p]));

      // Backend returns array of flash sale objects each with items array
      const list: FlashSaleProduct[] = Array.isArray(data)
        ? data.flatMap((sale: any) => (sale.items || []).map((it: any, idx: number) => {
            const prod = it.product || {};
            const productId = typeof prod === 'object' ? prod._id : prod;
            // Gather images (prefer product.images, fallback to first color images)
            let rawImages: any[] = Array.isArray(prod.images) ? prod.images : [];
            if ((!rawImages.length) && Array.isArray(prod.colors) && prod.colors[0]?.images?.length) {
              rawImages = prod.colors[0].images;
            }
            let images = rawImages.map(resolveImageUrl).filter(Boolean) as string[];
            images = Array.from(new Set(images)); // dedupe
            let usedPlaceholder = images.length === 0;
            // If we only have placeholder(s) treat as missing
            const placeholderPattern = /placeholder|via\.placeholder/i;
            if (!usedPlaceholder && images.every(u => placeholderPattern.test(u || ''))) {
              usedPlaceholder = true;
            }
            // Preserve previously hydrated images while we wait for backend to populate again
            const prev = prevMap.get(productId);
            if (usedPlaceholder && prev && prev.images && prev.images.length > 0 && !/placeholder/.test(prev.images[0])) {
              images = prev.images; // keep old good images
              usedPlaceholder = false;
            }
            // Final attempt: if still placeholder/missing but color images exist (server might not have copied) use them here
            if (usedPlaceholder && Array.isArray(prod.colors) && prod.colors[0]?.images?.length) {
              images = (prod.colors[0].images || []).map(resolveImageUrl).filter(Boolean) as string[];
              if (images.length) {
                usedPlaceholder = false;
              }
            }
            if (usedPlaceholder) {
              images = ['https://via.placeholder.com/400x400.png?text=Product'];
              if (__DEV__) {
                try { console.log('[FlashSaleScreen][debug] using placeholder for product', productId); } catch {}
              }
            }
            return {
              _id: productId,
              name: prod.name || it.name || prev?.name || '—',
              price: prod.price ?? prev?.price,
              images,
              flashPrice: it.flashPrice,
              flashSaleEndsAt: sale.endDate,
              flashSaleStartsAt: sale.startDate,
              originalPrice: prod.originalPrice || prod.price || prev?.originalPrice,
              colors: Array.isArray(prod.colors) ? prod.colors.map((c:any) => ({
                name: c.name,
                images: Array.isArray(c.images) ? c.images : [],
                sizes: Array.isArray(c.sizes) ? c.sizes.map((s:any)=>({ name: s.name, stock: s.stock })) : []
              })) : [],
              _compositeId: `${sale._id || 'sale'}_${productId || 'pid'}_${idx}`,
              _needsHydration: usedPlaceholder || !prod.name || !Array.isArray(prod.images) || !prod.images.length,
            } as FlashSaleProduct;
          }))
        : [];
  setProducts(list);
    persistCache(list);
    } catch (err) {
      console.warn('Failed to load flash sale products', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, persistCache]);

  // Hydrate products missing real images by fetching product details (retry + delayed requeue + cache persist)
  useEffect(() => {
    const needing = products.filter(p => (p as any)._needsHydration && p._id && !hydratedIdsRef.current.has(p._id));
    if (!needing.length) return;
    let cancelled = false;
    (async () => {
      try {
        const chunks: typeof needing[] = [];
        const size = 6;
        for (let i=0;i<needing.length;i+=size) chunks.push(needing.slice(i,i+size));
        for (const chunk of chunks) {
          await Promise.all(chunk.map(async (p) => {
            try {
              hydratedIdsRef.current.add(p._id);
              let attempt = 0; let prod: any = null;
              while (attempt < 2 && !prod) {
                attempt++;
                try {
                  const res = await api.get(`/api/products/${p._id}`);
                  prod = res.data || null;
                } catch (e) {
                  if (attempt >= 2) throw e;
                }
              }
              if (!prod || cancelled) return;
              let imgs: any[] = Array.isArray(prod.images) ? prod.images : [];
              if ((!imgs.length) && Array.isArray(prod.colors) && prod.colors[0]?.images?.length) imgs = prod.colors[0].images;
              const normImgs = imgs.map((im:any)=>resolveImageUrl(im)).filter((u:string|null): u is string => !!u);
              if (!normImgs.length) { // requeue after 5s
                setTimeout(()=> hydratedIdsRef.current.delete(p._id), 5000);
                return;
              }
              setProducts(prev => {
                const updated = prev.map(item => item._id === p._id ? {
                  ...item,
                  images: normImgs as string[],
                  name: prod.name || item.name,
                  price: prod.price || item.price,
                  originalPrice: prod.originalPrice || prod.price || item.originalPrice,
                  colors: Array.isArray(prod.colors) ? prod.colors.map((c:any) => ({
                    name: c.name,
                    images: Array.isArray(c.images) ? c.images : [],
                    sizes: Array.isArray(c.sizes) ? c.sizes.map((s:any)=>({ name: s.name, stock: s.stock })) : []
                  })) : item.colors,
                  _needsHydration: false
                } : item);
                try { persistCache(updated); } catch {}
                return updated;
              });
            } catch (e) {
              console.log('[FlashSaleScreen] hydration failed for', p._id);
              setTimeout(()=> hydratedIdsRef.current.delete(p._id), 8000); // transient failure retry
            }
          }));
          if (cancelled) break;
        }
      } catch (e) { /* swallow */ }
    })();
    return () => { cancelled = true; };
  }, [products, persistCache]);

  // Initial load only
  useEffect(() => { fetchFlashSale(false); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: log any items still missing real images after hydration
  useEffect(() => {
    const missing = products.filter(p => !p.images || p.images.length === 0 || (p.images.length === 1 && /placeholder|via\.placeholder/.test(p.images[0])));
    if (missing.length) {
      console.log('[FlashSaleScreen] Products missing images:', missing.map(m => ({ id: m._id, images: m.images })));
    }
  }, [products]);

  // Removed per-second ticking at screen level to prevent FlatList re-render storms.

  // Derive category list from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      const n = p.categoryName || (p as any).category?.name;
      if (n) set.add(String(n));
    });
    return Array.from(set.values());
  }, [products]);

  // Filter products by active category
  useEffect(() => {
    if (!activeCategory) { setFiltered(products); return; }
    setFiltered(products.filter(p => (p.categoryName || (p as any).category?.name) === activeCategory));
  }, [products, activeCategory]);

  // slotStart only needs to react to products; no need to tick every second.

  const onRefresh = () => { setRefreshing(true); fetchFlashSale(true); };

  // Simple slot label (assumption: take earliest start among products) - adjust if backend provides explicit slots
  const slotStart = useMemo(() => {
    const starts = products
      .map(p => p.flashSaleStartsAt ? new Date(p.flashSaleStartsAt).getTime() : null)
      .filter((n): n is number => !!n && n <= Date.now());
    if (!starts.length) return null;
    const earliest = Math.min(...starts);
    const d = new Date(earliest);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return { time: `${hh}:${mm}`, date: `${month}/${day}` };
  }, [products]);

  // Separate countdown component prevents whole screen rerender every second.
  const Countdown: React.FC<{ products: FlashSaleProduct[] }> = React.useMemo(() => {
    return React.memo(({ products }) => {
      const [nowLocal, setNowLocal] = useState(Date.now());
      useEffect(() => {
        const id = setInterval(() => setNowLocal(Date.now()), 1000);
        return () => clearInterval(id);
      }, []);
      const soonestEnd = useMemo(() => {
        const times = products
          .map(p => p.flashSaleEndsAt ? new Date(p.flashSaleEndsAt).getTime() : null)
          .filter((n): n is number => !!n && n > nowLocal);
        return times.length ? Math.min(...times) : null;
      }, [products, nowLocal]);
      const remaining = useMemo(() => {
        if (!soonestEnd) return null;
        const diff = Math.max(soonestEnd - nowLocal, 0);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      }, [soonestEnd, nowLocal]);
      if (!remaining) return null;
      const parts = remaining.split(':');
      return (
        <View style={styles.countdownRow}>
          <Text style={styles.endsInLabel}>{t('flashSale.endsIn', 'Ends in')}</Text>
            <View style={styles.countBlocksWrap}>
              {parts.map((p, i) => (
                <React.Fragment key={i}>
                  <View style={styles.countBlock}><Text style={styles.countBlockText}>{p}</Text></View>
                  {i < parts.length - 1 && <Text style={styles.countSep}>:</Text>}
                </React.Fragment>
              ))}
            </View>
        </View>
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed external PNG lightning background (flash (2).png) to avoid missing asset build issues.

  const renderItem = useCallback(({ item }: { item: FlashSaleProduct }) => {
    // Compute discount percent
    let discountPct: number | null = null;
    const baseOriginal = item.originalPrice || (item.price && item.flashPrice ? item.price : undefined);
    if (item.flashPrice && baseOriginal && baseOriginal > item.flashPrice) {
      discountPct = Math.round(((baseOriginal - item.flashPrice) / baseOriginal) * 100);
    }
    if (__DEV__) {
      try {
        console.log('[FlashSaleScreen][renderItem]', item._id, 'img0:', item.images?.[0], 'count:', item.images?.length);
      } catch {}
    }
    return (
      <View style={[
        styles.cardWrap,
        layoutMode === 'list' && styles.listCardWrap,
        layoutMode === 'grid' && { width: cardWidth },
      ]}>
        <FlashSaleProductCard
          product={{
            _id: item._id,
            name: item.name,
            price: item.price || 0,
            originalPrice: item.originalPrice || item.price,
            flashPrice: item.flashPrice,
            flashSaleEndsAt: item.flashSaleEndsAt,
            images: item.images,
            colors: (item as any).colors || [],
          }}
          width={layoutMode === 'grid' ? cardWidth : undefined}
          list={layoutMode === 'list'}
        />
      </View>
    );
  }, [cardWidth, layoutMode]);

  const dataSource = layoutMode === 'grid' ? filtered : filtered; // same list; layout via props

  return (
    <View style={styles.container}> 
      {/* Yellow Header + Slot */}
  <View style={[styles.headerWrap, { paddingTop: 16 + insets.top, paddingBottom: 18 }]}> 
        <View style={styles.topBar}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel={t('common.back','Back')}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('flashSale.title','Flash Sale')}</Text>
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={() => setLayoutMode(m => m === 'grid' ? 'list' : 'grid')} style={styles.iconBtn} accessibilityLabel={layoutMode === 'grid' ? t('flashSale.listView','List view') : t('flashSale.gridView','Grid view')}>
              <Ionicons name={layoutMode === 'grid' ? 'reorder-three-outline' : 'grid-outline'} size={22} color="#111" />
            </TouchableOpacity>
            <View style={styles.cartWrap}>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={[styles.iconBtn, { marginLeft: 4 }]} accessibilityLabel={t('cart.title','Cart')}>
                <Ionicons name="cart-outline" size={22} color="#111" />
                {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text></View>}
              </TouchableOpacity>
              {flashSavings > 0 && (
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsPillText}>-{formatPrice(flashSavings)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.slotCenter}> 
          <Text style={styles.slotTimeRow}>
            <Text style={styles.slotTime}>{slotStart?.time || '--:--'}</Text>
            {slotStart?.date ? <Text style={styles.slotDateInline}>  {slotStart.date}</Text> : null}
          </Text>
          <Text style={styles.onSaleNow}>{t('flashSale.onSaleNow','On Sale Now')}</Text>
        </View>
      </View>
  {/* Countdown */}
  <Countdown products={products} />
      <Text style={styles.limitNote}>{t('flashSale.limitNote','Limited purchase of 5 products')}</Text>
      {/* Category filter chips */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <TouchableOpacity onPress={() => setActiveCategory(null)} style={[styles.chip, !activeCategory && styles.chipActive]}><Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>{t('common.all','All')}</Text></TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat === activeCategory ? null : cat)} style={[styles.chip, activeCategory === cat && styles.chipActive]}>
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]} numberOfLines={1}>{cat}</Text>
              <Ionicons name="chevron-down" size={14} color={activeCategory === cat ? '#111' : '#666'} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* Product list */}
      {loading && !refreshing ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          key={layoutMode} // force re-layout when mode changes
          data={dataSource}
          keyExtractor={(item) => item._compositeId || item._id}
          numColumns={layoutMode === 'grid' ? gridColumns : 1}
          columnWrapperStyle={layoutMode === 'grid' ? { paddingHorizontal: 12, justifyContent: 'space-between' } : undefined}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 48, paddingTop: 6 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={!loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t('flashSale.empty','No flash sale items right now')}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFlashSale(true)}><Text style={styles.retryText}>{t('common.retry','Retry')}</Text></TouchableOpacity>
            </View>
          ) : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerWrap: { backgroundColor: '#FDD835', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0c400', minHeight: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 6, borderRadius: 16 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#111' },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  cartWrap: { alignItems: 'center', justifyContent: 'flex-start' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#e53935', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 8 },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  savingsPill: { marginTop: 4, backgroundColor: '#F4511E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 30, alignSelf: 'center', minHeight: 24, justifyContent: 'center' },
  savingsPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  slotRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotTime: { fontSize: 22, fontWeight: '700', color: '#111' },
  slotDate: { fontSize: 12, fontWeight: '600', color: '#111', marginTop: -2 },
  slotCenter: { marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  slotTimeRow: { flexDirection: 'row', fontSize: 22, fontWeight: '700', color: '#111' },
  slotDateInline: { fontSize: 12, fontWeight: '700', color: '#111' },
  onSaleNow: { fontSize: 12, fontWeight: '600', color: '#111', marginTop: 2 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  endsInLabel: { fontSize: 14, fontWeight: '500', marginRight: 8, color: '#222' },
  countBlocksWrap: { flexDirection: 'row', alignItems: 'center' },
  countBlock: { backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, minWidth: 40, alignItems: 'center', marginHorizontal: 2 },
  countBlockText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  countSep: { fontSize: 16, fontWeight: '700', color: '#111', marginHorizontal: 2 },
  limitNote: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 4, marginBottom: 6 },
  chipsScroll: { maxHeight: 46 },
  chipsContent: { paddingHorizontal: 12, paddingVertical: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8 },
  chipActive: { backgroundColor: '#FDD835' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#555' },
  chipTextActive: { color: '#111', fontWeight: '700' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrap: { marginBottom: 16, marginHorizontal: 0 },
  // list variant takes full width and adds its own horizontal padding
  listCardWrap: { width: '100%', paddingHorizontal: 12 },
  listCardInner: { flexDirection: 'row' },
  // old discountFlag replaced by custom bar
  flashPriceBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 6 },
  flashPriceText: { fontSize: 16, fontWeight: '700', color: '#C75100' },
  flashOrigPrice: { fontSize: 12, color: '#A66', textDecorationLine: 'line-through', marginTop: -2 },
  flashDiscountBadgeWrap: { width: 86, height: 52, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  flashDiscountImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  flashDiscountImgText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  flashCartBtn: { width: 34, height: 34, backgroundColor: '#FFE0B2', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  emptyWrap: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#444', marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});

export default FlashSaleScreen;
