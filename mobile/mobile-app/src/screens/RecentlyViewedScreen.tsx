import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Pressable, useWindowDimensions, StatusBar, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../types/navigation';
import { formatPrice } from '../utils/format';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { fetchProductById } from '../services/productService';
import api from '../services/api';
import { useCart } from '../context/CartContext';

// Simple in-memory recent tracker placeholder (replace with persisted storage / API later)
interface RecentItem { id: string; name: string; image?: string; price: number; originalPrice?: number; viewedAt: string; discountPct?: number; }

// Format a YYYY-MM-DD key as local date text (prevents timezone shifts that can show previous day)
const formatDayKey = (dayKey: string) => {
  const parts = dayKey.split('-');
  if (parts.length !== 3) return dayKey;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return dayKey;
  const date = new Date(y, m - 1, d); // local date
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function RecentlyViewedScreen({ navigation }: NavigationProps<'RecentlyViewed'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { width } = useWindowDimensions();
  const { items, removeRecents } = useRecentlyViewed();
  const { addToCart } = useCart();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null); // which card shows delete overlay
  const scrollRef = useRef<ScrollView | null>(null);
  const itemPositions = useRef<{ id: string; y: number; x: number; h: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const totalItems = items.length || 0;
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Quick view modal state
  const [quickId, setQuickId] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickProduct, setQuickProduct] = useState<any | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickColorIdx, setQuickColorIdx] = useState(0);
  const [quickSizeIdx, setQuickSizeIdx] = useState(0);
  const sheetAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  const sheetTranslate = sheetAnim.interpolate({ inputRange:[0,1], outputRange:[400,0] });
  // In-memory product cache to avoid refetching (cleared on unmount implicitly)
  const productCacheRef = useRef<Map<string, any>>(new Map());

  // Ensure relative image paths become absolute using same logic as ProductCard
  const resolveImageUrl = useCallback((src?: string): string | undefined => {
    if (!src) return undefined; const s = src.trim(); if (!s) return undefined;
    if (/^https?:\/\//i.test(s)) return s;
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    if (s.startsWith('/')) return `${base}${s}`;
    return `${base}/${s}`;
  }, []);

  const closeQuick = () => {
    Animated.timing(sheetAnim, { toValue:0, duration:180, useNativeDriver:true }).start(() => {
      setQuickId(null); setQuickProduct(null); setQuickColorIdx(0); setQuickSizeIdx(0);
    });
  };

  useEffect(() => {
    if (!quickId) return;
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, { toValue:1, duration:220, useNativeDriver:true }).start();
    setQuickError(null);
    const cache = productCacheRef.current;
    const cached = cache.get(quickId);
    if (cached) {
      setQuickProduct(cached);
      setQuickLoading(false);
      return;
    }
    let cancelled = false;
    setQuickLoading(true);
    // Timeout wrapper (6s) so spinner doesn't sit forever
    const TIMEOUT_MS = 6000;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setQuickLoading(false);
      setQuickError('timeout');
    }, TIMEOUT_MS);
    fetchProductById(quickId)
      .then(p => {
        if (cancelled) return; clearTimeout(timer);
        setQuickProduct(p); cache.set(quickId, p);
      })
      .catch(err => {
        if (cancelled) return; clearTimeout(timer);
        console.warn('Quick view load failed', err?.message || err);
        setQuickProduct(null);
        setQuickError('error');
      })
      .finally(() => { if (!cancelled) setQuickLoading(false); });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [quickId, sheetAnim]);

  // Prefetch first few recently viewed products to make quick modal snappier
  useEffect(() => {
    const PREFETCH_LIMIT = 6;
    const ids = items.slice(0, PREFETCH_LIMIT).map(i => i.id);
    if (!ids.length) return;
    const cache = productCacheRef.current;
    const toFetch = ids.filter(id => !cache.has(id));
    if (!toFetch.length) return;
    let cancelled = false;
    Promise.allSettled(toFetch.map(id => fetchProductById(id)))
      .then(resArr => {
        if (cancelled) return;
        resArr.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            cache.set(toFetch[idx], res.value);
          }
        });
      });
    return () => { cancelled = true; };
  }, [items]);

  // Derive images for quick modal prioritizing selected color's images; fallback to root then first color with images
  const quickImages: string[] = useMemo(() => {
    if (!quickProduct) return [];
    const colors = Array.isArray(quickProduct.colors) ? quickProduct.colors : [];
    const selectedColor = colors[quickColorIdx];
    const selectedImages = Array.isArray(selectedColor?.images) ? selectedColor.images.filter(Boolean) : [];
    if (selectedImages.length) return selectedImages as string[];
    const root = Array.isArray(quickProduct.images) ? quickProduct.images.filter(Boolean) : [];
    if (root.length) return root as string[];
    for (const c of colors) {
      if (Array.isArray(c?.images) && c.images.length) {
        return c.images.filter(Boolean) as string[];
      }
    }
    return [];
  }, [quickProduct, quickColorIdx]);
  const [quickImgIndex, setQuickImgIndex] = useState(0);
  const quickCarouselRef = useRef<ScrollView | null>(null);

  // When color changes or product changes, reset carousel index & scroll position
  useEffect(() => {
    setQuickImgIndex(0);
    // small timeout to ensure scroll view mounted before scrolling (esp. when product just loaded)
    requestAnimationFrame(() => {
      quickCarouselRef.current?.scrollTo({ x: 0, animated: false });
    });
  }, [quickColorIdx, quickProduct?._id]);

  // Fixed 3-column grid layout
  const layout = useMemo(() => {
    const horizontalPad = 12 * 2; // horizontal screen padding
    const gapX = 12; // horizontal gap between cards
    const gapY = 8;  // reduced vertical gap
    const columns = 3;
    let cardWidth = Math.floor((width - horizontalPad - gapX * (columns - 1)) / columns);
    if (cardWidth < 100) {
      // fallback to 2 columns on extremely narrow widths
      const fallbackCols = 2;
      cardWidth = Math.floor((width - horizontalPad - gapX * (fallbackCols - 1)) / fallbackCols);
      return { columns: fallbackCols, cardWidth, gapX, gapY };
    }
    return { columns, cardWidth, gapX, gapY };
  }, [width]);

  // Reset measurements when items list changes (e.g., delete)
  useEffect(() => {
    itemPositions.current = [];
    setCurrentIndex(1);
  }, [totalItems]);

  const registerItemY = (id: string, y: number, x: number, h: number) => {
    const arr = itemPositions.current;
    const existing = arr.find(p => p.id === id);
    if (existing) {
      existing.y = y; existing.x = x; existing.h = h;
    } else {
      arr.push({ id, y, x, h });
    }
    // keep sorted (y then x)
    arr.sort((a,b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (!isScrolling) setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 650);
    // Determine most visible card in viewport (by overlap height)
    const arr = itemPositions.current;
    if (!arr.length) return;
    const viewportHeight = e.nativeEvent.layoutMeasurement.height;
    const viewportCenter = offsetY + viewportHeight / 2;
    let bestIdx = 0;
    let bestDelta = Infinity;
    arr.forEach((p, i) => {
      const center = p.y + (p.h || 0) / 2;
      const delta = Math.abs(center - viewportCenter);
      if (delta < bestDelta) { bestDelta = delta; bestIdx = i; }
    });
    const target = bestIdx + 1;
    if (target !== currentIndex) setCurrentIndex(target);
  };

  const showArrow = currentIndex >= 20 && !isScrolling;

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(m => {
      if (m) setSelected(new Set());
      setOpenDeleteId(null); // close any open delete overlay
      return !m;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // group by day (yyyy-mm-dd)
  const groups = useMemo(() => {
    const map: Record<string, RecentItem[]> = {};
    for (const it of items) {
      const dt = new Date(it.viewedAt);
      if (isNaN(dt.getTime())) continue; // skip invalid
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2,'0');
      const d = String(dt.getDate()).padStart(2,'0');
      const dayKey = `${y}-${m}-${d}`; // local day key
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(it);
    }
    const orderedKeys = Object.keys(map).sort((a,b) => b.localeCompare(a));
    return orderedKeys.map(k => ({ key: k, label: formatDayKey(k), items: map[k] }));
  }, [items]);

  // Derived values for rendering
  const { cardWidth, columns, gapX, gapY } = layout;

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={[styles.headerWrap, { paddingTop: (insets.top || StatusBar.currentHeight || 0) + 8, paddingBottom: 8 }]}>
        <View style={styles.headerRow}> 
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle,{ position:'absolute', left:0, right:0, textAlign:'center', marginLeft:0 }]} pointerEvents="none">{t('recentlyViewed.title','Recently Viewed')}</Text>
          <View style={{ flex:1 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSelectionMode}>
            {selectionMode ? (
              <Ionicons name="checkmark-done" size={18} color={selected.size ? '#16a34a' : '#111'} />
            ) : (
              <Ionicons name="list" size={18} color="#111" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn,{ position:'relative'}]} onPress={() => navigation.navigate('Cart') }>
            <Ionicons name="cart-outline" size={18} color="#111" />
            {cart?.length ? (<View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>) : null}
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
  ref={r => { scrollRef.current = r; }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={() => { if (!scrollTimeoutRef.current) return; /* rely on timeout */ }}
        onScrollEndDrag={() => { /* timeout already set in onScroll */ }}
        contentContainerStyle={{ paddingTop: (insets.top || StatusBar.currentHeight || 0) + 64, paddingBottom: 140 }}
      >
        {groups.map(group => (
          <View key={group.key} style={{ paddingBottom: 24 }}>
            <Text style={styles.dateLabel}>{group.label}</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap' }}>
              {group.items.map((it, idx) => {
                const hasDiscount = typeof it.originalPrice === 'number' && it.originalPrice > it.price;
                const discountPct = hasDiscount ? Math.round(((it.originalPrice!- it.price)/ it.originalPrice!) * 100) : (it.discountPct || 0);
                const sel = selected.has(it.id);
        return (
                  <View
                    key={it.id+idx}
                    onLayout={e => registerItemY(`${it.id}-${idx}`, e.nativeEvent.layout.y, e.nativeEvent.layout.x, e.nativeEvent.layout.height)}
                    style={{ width: cardWidth, marginLeft: idx % columns === 0 ? 0 : gapX, marginTop: idx < columns ? 0 : gapY }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.card, selectionMode && sel && { borderColor:'#111', borderWidth:2 }]}
                      onPress={() => {
                        if (selectionMode) { toggleItem(it.id); return; }
                        navigation.navigate('ProductDetails', { productId: it.id });
                      }}
                      onLongPress={() => { if (!selectionMode) { setSelectionMode(true); toggleItem(it.id); } }}
                    >
                      <View style={{ position:'relative' }}>
                        {it.image ? (
                          <Image
                            source={{ uri: resolveImageUrl(it.image) }}
                            style={styles.cardImage}
                            onError={() => {/* could set local error state if needed */}}
                          />
                        ) : (
                          <View style={[styles.cardImage,{ backgroundColor:'#f3f4f6'}]} />
                        )}
                        {/* Top-left brand label removed as requested */}
                        {/* Quick cart icon bottom-right */}
                        {!selectionMode && (
                          <TouchableOpacity style={styles.quickCartBtn} activeOpacity={0.85} onPress={() => { if (!quickLoading) setQuickId(it.id); }}>
                            <Ionicons name="cart-outline" size={15} color="#111" />
                          </TouchableOpacity>
                        )}
                        {selectionMode && (
                          <View style={[styles.selectionBadge, sel && styles.selectionBadgeActive]}>
                            {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                        )}
                      </View>
                      <View style={styles.priceRow}> 
                        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                          <Text style={styles.priceText}>{formatPrice(it.price)}</Text>
                          {hasDiscount ? (
                            <View style={styles.discountPill}><Text style={styles.discountPillText}>-{discountPct}%</Text></View>
                          ) : null}
                        </View>
                        {!selectionMode ? (
                          <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => setOpenDeleteId(prev => prev === it.id ? null : it.id)}
                            style={styles.dotsAction}
                          >
                            {[0,1,2].map(i2 => <View key={i2} style={styles.dotSep} />)}
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.dotsAction}>
                            {[0,1,2].map(i2 => <View key={i2} style={[styles.dotSep,{ opacity:0.35 }]} />)}
                          </View>
                        )}
                      </View>
                      {openDeleteId === it.id && !selectionMode && (
                        <Pressable style={styles.deleteOverlay} onPress={() => setOpenDeleteId(null)}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.deleteOverlayBtn}
                            onPress={() => { removeRecents([it.id]); setOpenDeleteId(null); }}
                          >
                            <Text style={styles.deleteOverlayText}>{t('common.delete','Delete')}</Text>
                          </TouchableOpacity>
                        </Pressable>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        {!groups.length && (
          <View style={{ padding:32, alignItems:'center' }}>
            <Text style={{ color:'#6b7280' }}>{t('recentlyViewed.empty','No recently viewed items yet.')}</Text>
          </View>
        )}
      </ScrollView>
      {selectionMode && (
        <View style={[styles.actionBar, { paddingBottom: 8 + (insets.bottom || 0) }]}> 
          <TouchableOpacity style={styles.actionLeft} onPress={() => {
            if (selected.size === items.length) setSelected(new Set());
            else setSelected(new Set(items.map(i => i.id)));
          }}>
            <View style={[styles.radio, selected.size === items.length && styles.radioActive]}>
              {selected.size === items.length && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.actionText}>{selected.size === items.length ? t('common.clearAll','All') : t('common.all','All')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!selected.size}
            onPress={() => { removeRecents(Array.from(selected)); setSelected(new Set()); }}
            style={styles.deleteBtn}
          >
            <Text style={[styles.deleteText, !selected.size && { opacity:0.35 }]}>{t('common.delete','Delete')}({selected.size})</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Floating counter / scroll-to-top */}
      {!!totalItems && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { if (showArrow) scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
          style={[styles.counterFab, showArrow && styles.counterFabArrow]}
        >
          {showArrow ? (
            <Ionicons name="arrow-up" size={26} color="#111" />
          ) : (
            <>
              <Text style={styles.counterTop}>{totalItems}</Text>
              <View style={styles.counterDivider} />
              <Text style={styles.counterBottom}>{totalItems}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {/* Quick view modal */}
      {quickId && (
        <View style={styles.quickBackdrop} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeQuick} />
          <Animated.View style={[styles.quickSheet, { transform:[{ translateY: sheetTranslate }], opacity: sheetAnim, paddingBottom:16 + (insets.bottom || 0) }]}> 
            <TouchableOpacity style={styles.quickClose} onPress={closeQuick}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
            {quickLoading && !quickError && (
              <View style={{ flex:1, alignItems:'center', justifyContent:'center', paddingVertical:60 }}>
                <ActivityIndicator size="small" color="#111" />
                <Text style={{ marginTop:12, color:'#444', fontSize:12 }}>Loading...</Text>
              </View>
            )}
            {!quickLoading && quickError && (
              <View style={{ flex:1, alignItems:'center', justifyContent:'center', paddingVertical:60 }}>
                <Text style={{ color:'#dc2626', fontSize:13, fontWeight:'600' }}>
                  {quickError === 'timeout' ? 'Load taking too long' : 'Failed to load product'}
                </Text>
                <TouchableOpacity
                  style={{ marginTop:14, paddingHorizontal:16, paddingVertical:8, backgroundColor:'#111', borderRadius:6 }}
                  onPress={() => { if (!quickId) return; setQuickId(quickId); }}
                >
                  <Text style={{ color:'#fff', fontSize:13, fontWeight:'600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {!quickLoading && !quickError && quickProduct && (
              <>
                <View style={{ width:'100%', marginBottom:14 }}>
                  {quickImages.length ? (
                    <View>
                      <ScrollView
                        ref={quickCarouselRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                          const w = e.nativeEvent.layoutMeasurement.width;
                          const x = e.nativeEvent.contentOffset.x;
                          if (w > 10) {
                            const idx = Math.round(x / w);
                            if (idx !== quickImgIndex) setQuickImgIndex(idx);
                          }
                        }}
                        scrollEventThrottle={16}
                        style={{ width:'100%' }}
                      >
                        {quickImages.map((img, i) => (
                          <View key={i} style={{ width: width - 32, aspectRatio:1, borderRadius:10, overflow:'hidden', backgroundColor:'#f3f4f6', marginRight: i === quickImages.length -1 ? 0 : 0 }}>
                            <Image source={{ uri: resolveImageUrl(img) }} style={{ width:'100%', height:'100%' }} />
                          </View>
                        ))}
                      </ScrollView>
                      {quickImages.length > 1 && (
                        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:10, gap:6 }}>
                          {quickImages.map((_, i) => (
                            <View key={i} style={{ width:8, height:8, borderRadius:4, backgroundColor: i === quickImgIndex ? '#111' : '#d1d5db' }} />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={{ width:'100%', aspectRatio:1, borderRadius:10, backgroundColor:'#f3f4f6' }} />
                  )}
                </View>
                <Text numberOfLines={2} style={styles.quickTitle}>{quickProduct.name}</Text>
                <View style={{ flexDirection:'row', alignItems:'center', marginTop:6, gap:8 }}>
                  <Text style={styles.quickPrice}>{formatPrice(quickProduct.price)}</Text>
                  {typeof quickProduct.originalPrice === 'number' && quickProduct.originalPrice > quickProduct.price && (
                    <>
                      <Text style={styles.quickStrike}>{formatPrice(quickProduct.originalPrice)}</Text>
                      <View style={styles.quickDiscount}><Text style={styles.quickDiscountText}>-{Math.round(((quickProduct.originalPrice - quickProduct.price)/quickProduct.originalPrice)*100)}%</Text></View>
                    </>
                  )}
                </View>
                {Array.isArray(quickProduct.colors) && quickProduct.colors.length ? (
                  <View style={{ marginTop:18 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <Text style={styles.quickSection}>{t('product.color','Color')}: <Text style={{ fontWeight:'700' }}>{quickProduct.colors[quickColorIdx]?.name || quickProduct.colors[quickColorIdx]?.color || ''}</Text></Text>
                    </View>
                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:14 }}>
                      {quickProduct.colors.map((c:any, idx:number) => {
                        const code = (c?.code || c?.color || '').trim();
                        const imgSrc = !code && Array.isArray(c?.images) && c.images[0] ? c.images[0] : undefined;
                        const isHex = /^#?[0-9a-f]{3,8}$/i.test(code);
                        const bgColor = isHex ? (code.startsWith('#') ? code : `#${code}`) : (code && !code.includes(' ') && code.length < 20 ? code : undefined);
                        const isWhite = /^#?fff(f{0,5})?$/i.test(bgColor || '') || /white/i.test(bgColor || '');
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => { setQuickColorIdx(idx); setQuickSizeIdx(0); setQuickImgIndex(0); }}
                            style={[styles.colorCircleWrapper, idx === quickColorIdx && styles.colorCircleWrapperActive]}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${c?.name || c?.color || idx+1}`}
                          >
                            <View style={[styles.colorCircle, isWhite && styles.colorCircleWhite, idx === quickColorIdx && styles.colorCircleSelected]}>
                              {bgColor ? (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, borderRadius: 999 }]} />
                              ) : imgSrc ? (
                                <Image source={{ uri: resolveImageUrl(imgSrc) }} style={styles.colorCircleImage} />
                              ) : (
                                <Text style={styles.colorCircleFallback}>{(c?.name || '?').slice(0,1)}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                {Array.isArray(quickProduct.colors?.[quickColorIdx]?.sizes) && quickProduct.colors[quickColorIdx].sizes.length ? (
                  <View style={{ marginTop:22 }}>
                    <View style={styles.sizeHeaderRow}>
                      <Text style={styles.quickSection}>{t('product.size','Size')}</Text>
                      <TouchableOpacity
                        onPress={() => { /* placeholder for size guide / default size feature */ }}
                        style={styles.sizeDefaultChip}
                        accessibilityRole="button"
                        accessibilityLabel="Default size"
                      >
                        <Text style={styles.sizeDefaultChipText}>{t('product.defaultSize','Default Size')}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#111" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.sizePillsRow}>
                      {quickProduct.colors[quickColorIdx].sizes.map((s:any, idx:number) => {
                        const label = s?.name || s;
                        const active = idx === quickSizeIdx;
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setQuickSizeIdx(idx)}
                            style={[styles.sizeOval, active && styles.sizeOvalActive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={`Size ${label}`}
                          >
                            <Text style={[styles.sizeOvalText, active && styles.sizeOvalTextActive]}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                <View style={styles.quickAddBar}>
                  <TouchableOpacity style={styles.quickAddBtn} activeOpacity={0.85} onPress={() => {
                    if (!quickProduct) return;
                    const color = quickProduct.colors?.[quickColorIdx];
                    const size = color?.sizes?.[quickSizeIdx];
                    const firstImg = quickImages[0] ? resolveImageUrl(quickImages[0]) : undefined;
                    addToCart({ productId: quickProduct._id || quickProduct.id, name: quickProduct.name, price: quickProduct.price, quantity:1, ...(color?.name?{color:color.name}:{}), ...(size?.name?{size:size.name}:{}), ...(firstImg?{image:firstImg}:{}) });
                    closeQuick();
                  }}>
                    <Text style={styles.quickAddText}>{t('common.addToCart','Add to Cart')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { position:'absolute', top:0, left:0, right:0, backgroundColor:'#fff', zIndex:10, paddingHorizontal:12, borderBottomWidth:1, borderColor:'#f3f4f6' },
  headerRow: { flexDirection:'row', alignItems:'center', gap:8 },
  headerTitle: { fontSize:18, fontWeight:'700', marginLeft:4 },
  iconBtn: { width:34, height:34, borderRadius:17, backgroundColor:'rgba(255,255,255,0.95)', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4, shadowOffset:{ width:0, height:2 }, elevation:2 },
  cartBadge: { position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8, backgroundColor:'#ef4444', alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  cartBadgeText: { color:'#fff', fontSize:10, fontWeight:'800' },
  dateLabel: { fontSize:15, fontWeight:'700', paddingHorizontal:12, paddingBottom:12, paddingTop:4 },
  card: { borderRadius:8, overflow:'hidden', backgroundColor:'#fff' },
  cardImage: { width:'100%', height:165, resizeMode:'cover' },
  brandWrap: { position:'absolute', top:8, left:8, backgroundColor:'rgba(255,255,255,0.92)', paddingHorizontal:8, paddingVertical:4, borderRadius:4 },
  brandText: { fontSize:12, fontWeight:'700', color:'#111', maxWidth:110 },
  quickCartBtn: { position:'absolute', right:7, bottom:7, width:26, height:26, borderRadius:13, backgroundColor:'rgba(255,255,255,0.95)', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:2.5, shadowOffset:{ width:0, height:1.5 }, elevation:2 },
  dotsAction: { flexDirection:'row', justifyContent:'center', alignItems:'center', paddingHorizontal:10, paddingTop:8, gap:4 },
  dotSep: { width:4, height:4, borderRadius:2, backgroundColor:'#e5e7eb' },
  selectionBadge: { position:'absolute', top:8, left:8, width:24, height:24, borderRadius:12, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center' },
  selectionBadgeActive: { backgroundColor:'#111827' },
  priceRow: { flexDirection:'row', alignItems:'center', paddingHorizontal:6, paddingVertical:6, justifyContent:'space-between' },
  priceText: { fontSize:14, fontWeight:'700', color:'#111827' },
  discountPill: { backgroundColor:'#fff1ee', paddingHorizontal:6, paddingVertical:2, borderRadius:4 },
  discountPillText: { color:'#f97316', fontSize:11, fontWeight:'700' },
  moreBtn: { alignSelf:'flex-start', padding:6, marginTop:4 }
  ,actionBar: { position:'absolute', left:0, right:0, bottom:0, flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:10, backgroundColor:'#fff', borderTopWidth:1, borderColor:'#e5e7eb' },
  actionLeft: { flexDirection:'row', alignItems:'center', gap:10 },
  radio: { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:'#6b7280', alignItems:'center', justifyContent:'center' },
  radioActive: { borderColor:'#111' },
  radioDot: { width:12, height:12, borderRadius:6, backgroundColor:'#111' },
  actionText: { fontSize:16, fontWeight:'600', color:'#111' },
  deleteBtn: { padding:8 },
  deleteText: { fontSize:16, fontWeight:'700', color:'#dc2626' }
  ,counterFab: { position:'absolute', right:18, bottom:90, width:58, height:58, borderRadius:29, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:6, shadowOffset:{ width:0, height:3 }, elevation:4 },
  counterFabArrow: { width:50, height:50, borderRadius:25 },
  counterTop: { fontSize:14, fontWeight:'600', color:'#111', marginTop:4 },
  counterBottom: { fontSize:14, fontWeight:'600', color:'#111', marginBottom:4 },
  counterDivider: { width:38, height:1, backgroundColor:'#d1d5db', marginVertical:3 }
  ,deleteOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:12, zIndex:20, elevation:6 },
  deleteOverlayBtn: { backgroundColor:'#000', paddingHorizontal:18, paddingVertical:10, borderRadius:6 },
  deleteOverlayText: { color:'#fff', fontSize:14, fontWeight:'700' }
  ,quickBackdrop: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.35)', zIndex:50, justifyContent:'flex-end' },
  quickSheet: { width:'100%', backgroundColor:'#fff', borderTopLeftRadius:18, borderTopRightRadius:18, padding:16, maxHeight:'86%' },
  quickClose: { position:'absolute', top:8, right:12, zIndex:2, width:34, height:34, borderRadius:17, backgroundColor:'rgba(0,0,0,0.05)', alignItems:'center', justifyContent:'center' },
  quickTitle: { fontSize:16, fontWeight:'700', color:'#111', marginTop:4 },
  quickPrice: { fontSize:20, fontWeight:'800', color:'#dc2626' },
  quickStrike: { fontSize:14, color:'#6b7280', textDecorationLine:'line-through' },
  quickDiscount: { backgroundColor:'#fee2e2', paddingHorizontal:6, paddingVertical:2, borderRadius:4 },
  quickDiscountText: { fontSize:11, fontWeight:'700', color:'#dc2626' },
  quickSection: { fontSize:14, fontWeight:'600', color:'#111' },
  colorSwatch: { paddingHorizontal:10, paddingVertical:8, backgroundColor:'#f3f4f6', borderRadius:6 },
  colorSwatchActive: { backgroundColor:'#111' },
  colorSwatchText: { fontSize:11, fontWeight:'600', color:'#111' },
  sizePill: { paddingHorizontal:14, paddingVertical:8, borderRadius:18, backgroundColor:'#f3f4f6' },
  sizePillActive: { backgroundColor:'#111' },
  sizePillText: { fontSize:13, fontWeight:'600', color:'#111' },
  sizePillTextActive: { color:'#fff' },
  quickAddBar: { marginTop:22 },
  quickAddBtn: { backgroundColor:'#111', borderRadius:10, paddingVertical:14, alignItems:'center', justifyContent:'center' },
  quickAddText: { color:'#fff', fontSize:16, fontWeight:'700' },
  // New color selector styles
  colorCircleWrapper: { width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center' },
  colorCircleWrapperActive: { borderWidth:2, borderColor:'#111' },
  colorCircle: { width:34, height:34, borderRadius:17, overflow:'hidden', backgroundColor:'#eee', alignItems:'center', justifyContent:'center' },
  colorCircleWhite: { borderWidth:1, borderColor:'#d1d5db' },
  colorCircleSelected: { shadowColor:'#000', shadowOpacity:0.15, shadowRadius:4, shadowOffset:{ width:0, height:2 }, elevation:3 },
  colorCircleImage: { width:'100%', height:'100%' },
  colorCircleFallback: { fontSize:13, fontWeight:'600', color:'#111' }
  ,sizeHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  sizeDefaultChip: { flexDirection:'row', alignItems:'center', backgroundColor:'#f3f4f6', paddingHorizontal:10, paddingVertical:6, borderRadius:14, gap:4 },
  sizeDefaultChipText: { fontSize:12, fontWeight:'600', color:'#111' },
  sizePillsRow: { flexDirection:'row', flexWrap:'wrap', gap:14, marginTop:14 },
  sizeOval: { paddingHorizontal:18, paddingVertical:10, borderRadius:22, borderWidth:1, borderColor:'#d1d5db', backgroundColor:'#fff' },
  sizeOvalActive: { backgroundColor:'#fff', borderColor:'#111', borderWidth:2 },
  sizeOvalText: { fontSize:14, fontWeight:'600', color:'#111' },
  sizeOvalTextActive: { color:'#111' }
});
