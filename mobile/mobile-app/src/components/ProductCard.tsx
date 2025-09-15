import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Pressable, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { formatPrice } from '../utils/format';
import { ms } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  colors?: {
    name?: string;
    code?: string;
    images?: string[];
    sizes?: { name: string; stock: number }[];
  }[];
  stock?: number;
  rating?: number;
  sold?: number;
  isFeatured?: boolean;
};

function resolveImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  let s = src.trim();
  if (!s) return undefined;
  s = s.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  // Normalize uploads variants
  const lower = s.toLowerCase();
  if (lower.startsWith('/api/uploads/')) return `${base}${s}`; // server exposes /api/uploads
  const match = lower.match(/(?:^|\/)(public\/)?uploads\/(.+)$/);
  if (match) return `${base}/api/uploads/${match[2]}`;
  if (lower.startsWith('/uploads/')) return `${base}/api${s}`; // leading slash without /api
  if (lower.startsWith('uploads/')) return `${base}/api/${s}`; // no leading slash
  if (!s.startsWith('/')) s = '/' + s;
  return `${base}${s}`;
}

type Props = { 
  product: Product; 
  width?: number; 
  style?: any; 
  noRightMargin?: boolean; 
  autoRotate?: boolean; 
  /** If provided, replaces the default price row (price + add to cart) */
  overridePriceRow?: React.ReactNode;
  /** Hide the default top-left discount badge */
  hideDiscountBadge?: boolean;
};

export default function ProductCard({ product, width, style, noRightMargin, autoRotate = true, overridePriceRow, hideDiscountBadge }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const cardWidth = width || 140;
  const imageHeight = useMemo(() => Math.round(cardWidth * 1.15), [cardWidth]);
  const img =
    product.images?.[0] ||
    product.colors?.[0]?.images?.[0] ||
    undefined;
  const imgUrl = resolveImageUrl(img);
  
  // all images available for card swipe (prefer product.images; fallback to first color images; else single resolved image)
  const allImages: string[] = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length) return product.images.filter(Boolean) as string[];
    if (Array.isArray(product.colors) && product.colors[0]?.images?.length) return (product.colors[0].images || []).filter(Boolean) as string[];
    return imgUrl ? [imgUrl] : [];
  }, [product.images, product.colors, imgUrl]);
  
  const imageCount = allImages.length;
  const [imgIndex, setImgIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(cardWidth);
  const [isManualSwiping, setIsManualSwiping] = useState(false);

  const hasDiscount =
    typeof product.originalPrice === 'number' &&
    product.originalPrice > (product.price ?? 0);
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const inCartQty = useMemo(() => (cart.find(i => i.productId === product._id)?.quantity) ?? 0, [cart, product._id]);
  const previewImages = useMemo(() => {
    const imgs = (product.images && product.images.length > 0)
      ? product.images
      : (imgUrl ? [imgUrl] : []);
    return (imgs || []).filter(Boolean) as string[];
  }, [product.images, imgUrl]);
  const colors = useMemo(() => {
    const cs = (product.colors || []).filter(Boolean);
    // Keep colors with no sizes; if sizes exist, keep only if any size has stock > 0
    return cs.filter(c => !Array.isArray(c.sizes) || c.sizes.some(s => (s?.stock ?? 0) > 0));
  }, [product.colors]);
  const selectedColor = colors && colors.length > 0 ? colors[Math.min(selectedColorIdx, colors.length - 1)] : undefined;
  const sizeOptions = useMemo(() => (selectedColor?.sizes || []).filter(s => !!s && typeof s.name === 'string' && (s.stock ?? 0) > 0), [selectedColor]);
  
  // when opening sheet or colors change, reset selection to first valid
  React.useEffect(() => {
    if (open) {
      setSelectedColorIdx(0);
      setSelectedSize(null);
    }
  }, [open, colors?.length]);
  
  const sheetImages = useMemo(() => {
    const cImgs = (selectedColor?.images || []).map(resolveImageUrl).filter(Boolean) as string[];
    return (cImgs.length ? cImgs : previewImages).slice(0, 4);
  }, [selectedColor, previewImages]);
  const isRTL = I18nManager.isRTL;

  // Enhanced swipe tracking refs
  const draggingRef = useRef(false);
  const dragReleaseTimer = useRef<NodeJS.Timeout | null>(null);
  const lastOffsetRef = useRef(0);
  const totalSwipeDxRef = useRef(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartXRef = useRef(0);
  const swipeVelocityRef = useRef(0);

  const handleNavigate = () => {
    // If user swiped horizontally a meaningful amount, don't navigate
    if (draggingRef.current || totalSwipeDxRef.current > 8) return;
    navigation.navigate('ProductDetails', { productId: product._id });
  };

  // Enhanced auto-advance carousel
  useEffect(() => {
    if (!autoRotate) return; // disabled by parent
    if (imageCount <= 1) return; // nothing to rotate
    if (!carouselWidth) return;
    if (isManualSwiping) return; // pause during manual swipe
    
    const INTERVAL = 3500; // slightly longer interval
    const start = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current as any);
      autoTimerRef.current = setInterval(() => {
        // Skip while user actively dragging or recently swiped
        if (draggingRef.current || isManualSwiping) return;
        
        setImgIndex(curr => {
          const next = (curr + 1) % imageCount;
          // Programmatically scroll with smooth animation
          const x = next * carouselWidth;
          scrollRef.current?.scrollTo({ x, animated: true });
          return next;
        });
      }, INTERVAL);
    };
    start();
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [imageCount, carouselWidth, autoRotate, isManualSwiping]);

  // Reset manual swiping flag after a delay
  useEffect(() => {
    if (isManualSwiping) {
      const timer = setTimeout(() => {
        setIsManualSwiping(false);
      }, 2000); // Resume auto-rotate after 2 seconds of no manual activity
      return () => clearTimeout(timer);
    }
  }, [isManualSwiping]);

  return (
    <>
    <Pressable
      style={[
        styles.card,
        { width: cardWidth },
        width ? { marginRight: 0 } : null,
        noRightMargin && { marginRight: 0 },
        isRTL && { marginRight: 0, marginLeft: 12 },
        style,
      ]}
      onPress={handleNavigate}
      accessibilityRole="button"
    >
      <View
        style={styles.imageWrap}
        onLayout={e => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w && w !== carouselWidth) setCarouselWidth(w);
        }}
      >
        {imageCount > 0 ? (
          <ScrollView
            ref={(r) => { scrollRef.current = r; }}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={carouselWidth}
            snapToAlignment="start"
            disableIntervalMomentum
            scrollEventThrottle={16}
            bounces={false} // Prevent bouncing at edges
            
            onScrollBeginDrag={(e) => {
              draggingRef.current = true;
              setIsManualSwiping(true);
              if (dragReleaseTimer.current) clearTimeout(dragReleaseTimer.current);
              totalSwipeDxRef.current = 0;
              lastOffsetRef.current = e.nativeEvent.contentOffset.x;
              swipeStartXRef.current = e.nativeEvent.contentOffset.x;
              
              // Pause auto-rotation when user starts swiping
              if (autoTimerRef.current) {
                clearInterval(autoTimerRef.current);
                autoTimerRef.current = null;
              }
            }}
            
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const { contentOffset, layoutMeasurement, velocity } = e.nativeEvent;
              const w = layoutMeasurement?.width || carouselWidth;
              const dxFromLast = contentOffset.x - lastOffsetRef.current;
              totalSwipeDxRef.current += Math.abs(dxFromLast);
              
              // Store velocity for smoother transitions
              if (velocity) {
                swipeVelocityRef.current = velocity.x;
              }
              
              // Lower threshold for better responsiveness
              if (!draggingRef.current && Math.abs(totalSwipeDxRef.current) > 3) {
                draggingRef.current = true;
              }
              
              lastOffsetRef.current = contentOffset.x;
              
              if (w > 0) {
                const idx = Math.round(contentOffset.x / w);
                const clampedIdx = Math.min(Math.max(idx, 0), imageCount - 1);
                if (clampedIdx !== imgIndex) {
                  setImgIndex(clampedIdx);
                }
              }
            }}
            
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / carouselWidth);
              const clampedIdx = Math.min(Math.max(idx, 0), imageCount - 1);
              
              if (clampedIdx !== imgIndex) {
                setImgIndex(clampedIdx);
              }
              
              // Reset drag state with shorter delay for better responsiveness
              if (dragReleaseTimer.current) clearTimeout(dragReleaseTimer.current);
              dragReleaseTimer.current = setTimeout(() => { 
                draggingRef.current = false; 
                totalSwipeDxRef.current = 0; 
              }, 100);
            }}
            
            onScrollEndDrag={(e) => {
              // Ensure proper snapping on drag end
              const offsetX = e.nativeEvent.contentOffset.x;
              const targetIdx = Math.round(offsetX / carouselWidth);
              const clampedIdx = Math.min(Math.max(targetIdx, 0), imageCount - 1);
              
              if (Math.abs(offsetX - (clampedIdx * carouselWidth)) > 5) {
                // Snap to correct position if not aligned
                scrollRef.current?.scrollTo({ 
                  x: clampedIdx * carouselWidth, 
                  animated: true 
                });
              }
            }}
            
            style={{ width: '100%' }}
            contentContainerStyle={{}}
          >
            {allImages.map((u, i) => (
              <Image
                key={String(u)+i}
                source={{ uri: resolveImageUrl(String(u)) }}
                style={[styles.image, { height: imageHeight, width: carouselWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { height: imageHeight }]} />
        )}
  {hasDiscount && !hideDiscountBadge && (
          <View style={[styles.badge, isRTL && styles.badgeRTL]}>
            <Text style={styles.badgeText}>-{discountPct}%</Text>
          </View>
        )}
        {imageCount > 1 && (
          <View style={[styles.rightIndicators, isRTL && styles.leftIndicators]}>
            {allImages.slice(0, 3).map((_, i) => (
              <View key={i} style={[styles.indicatorDot, i === imgIndex && styles.indicatorDotActive]} />
            ))}
            {imageCount > 3 && (
              <View style={styles.indicatorCount}>
                <Text style={styles.indicatorCountText}>{imgIndex + 1}/{imageCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* optional chips row */}
      {product.isFeatured ? (
        <View style={styles.chipsRow}>
          <Text style={[styles.chip, styles.chipPurple]}>{t('common.trends')}</Text>
        </View>
      ) : null}
      
      <Pressable onPress={handleNavigate} accessibilityRole="button">
        <Text
          numberOfLines={2}
          style={[styles.name, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
        >
          {product.name}
        </Text>
      </Pressable>
      
      {product.description ? (
        <Text
          numberOfLines={2}
          style={[styles.desc, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
        >
          {product.description}
        </Text>
      ) : null}
      
      {overridePriceRow ? (
        <>{overridePriceRow}</>
      ) : (
        <View style={[styles.priceRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <Pressable onPress={handleNavigate} style={[styles.priceLeft, isRTL && { flexDirection: 'row-reverse' }]} accessibilityRole="button">
            <Text style={[styles.price, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}>
              {typeof product.price === 'number' ? formatPrice(product.price) : ''}
            </Text>
            {hasDiscount && (
              <Text style={[styles.strike, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}>
                {typeof product.originalPrice === 'number' ? formatPrice(product.originalPrice) : ''}
              </Text>
            )}
          </Pressable>
          <TouchableOpacity
            accessibilityLabel={t('common.quickAdd')}
            onPress={() => setOpen(true)}
            activeOpacity={0.9}
            style={[styles.quickAddInline, { borderColor: inCartQty > 0 ? '#111' : '#e5e7eb', borderWidth: inCartQty > 0 ? 2 : 1 }]}
          >
            <View style={{ width: 18, height: 18 }}>
              <Ionicons name="cart-outline" size={18} color="#111" />
              <Ionicons
                name="add"
                size={10}
                color="#111"
                style={{ position: 'absolute', top: -2, right: isRTL ? undefined : -2, left: isRTL ? -2 : undefined }}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
      
      {typeof product.sold === 'number' ? (
        <Text style={[styles.soldText, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}>
          {t('product.sold', { count: product.sold })}
        </Text>
      ) : null}
      
      <View style={[styles.repeatRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="ribbon-outline" size={12} color="#ef8f00" />
        <Text style={[styles.repeatText, isRTL && { textAlign: 'right' }]}>{t('common.highRepeat')}</Text>
      </View>
  </Pressable>
  
  {/* Quick Add Bottom Sheet */}
    <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
      <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={() => setOpen(false)} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* images preview row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
            {sheetImages.map((u, i) => (
              <Image key={String(u)+i} source={{ uri: resolveImageUrl(String(u)) }} style={styles.sheetImage} resizeMode="cover" />
            ))}
          </ScrollView>
          {/* title */}
          <Text
            style={[styles.sheetTitle, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          {/* price row */}
      <View style={[styles.sheetPriceRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.sheetPrice}>{typeof product.price === 'number' ? formatPrice(product.price) : ''}</Text>
            {hasDiscount && (
        <View style={[styles.sheetStrikeWrap, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.sheetStrike}>{typeof product.originalPrice === 'number' ? formatPrice(product.originalPrice) : ''}</Text>
                <Text style={styles.sheetDiscount}>-{discountPct}%</Text>
              </View>
            )}
          </View>
          {/* color section */}
          {colors && colors.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.colorLabel, isRTL && { textAlign: 'right' }]}>
                  {t('common.color')}: {selectedColor?.name || '—'}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
                {colors.map((c, idx) => {
                  const thumb = resolveImageUrl(c.images?.[0] || imgUrl || '');
                  const isActive = idx === selectedColorIdx;
                  return (
                    <TouchableOpacity key={(c.name || 'color') + idx} onPress={() => { setSelectedColorIdx(idx); setSelectedSize(null); }} activeOpacity={0.9}>
                      <Image source={{ uri: thumb }} style={[styles.colorThumb, isActive && styles.colorThumbActive]} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
          {/* size section */}
          {sizeOptions && sizeOptions.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={[styles.sizeLabel, isRTL && { textAlign: 'right' }]}>{t('common.size')}</Text>
                <Text style={[styles.sizeBadge, isRTL && { textAlign: 'right' }]}>{t('common.defaultSize')}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {sizeOptions.map(s => {
                  const disabled = typeof s.stock === 'number' && s.stock <= 0;
                  const active = selectedSize === s.name;
                  return (
                    <TouchableOpacity key={s.name} disabled={disabled} onPress={() => setSelectedSize(s.name)} style={[styles.sizeChip, active && styles.sizeChipActive, disabled && styles.sizeChipDisabled]}>
                      <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive, disabled && styles.sizeChipTextDisabled]}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
        {/* bottom cta */}
        <View style={styles.sheetFooter}>
          <TouchableOpacity
            onPress={() => {
              if (!user) {
                // Close sheet first so the modal doesn't overlay the login screen
                setOpen(false);
                setTimeout(() => navigation.navigate('Login'), 0);
                return;
              }
              toggleWishlist({ productId: product._id, name: product.name, price: product.price, image: resolveImageUrl(selectedColor?.images?.[0] || previewImages[0] || imgUrl) });
            }}
            style={styles.wishBtn}
            accessibilityLabel="Wishlist"
          >
            <Ionicons name={isWishlisted(product._id) ? 'heart' : 'heart-outline'} size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t('common.addToCart')}
            onPress={() => {
              const colorName = selectedColor?.name;
              const sizeName = selectedSize || undefined;
              // Validate stock when size options exist
              const sizeObj = (selectedColor?.sizes || []).find(s => s.name === selectedSize);
              if ((selectedColor?.sizes && selectedColor.sizes.length > 0) && (!sizeObj || sizeObj.stock <= 0)) {
                return; // guarded by disabled button visually, but double-check here
              }
              const thumb = resolveImageUrl(selectedColor?.images?.[0] || previewImages[0] || imgUrl || '');
              addToCart({ productId: product._id, name: product.name, price: product.price, quantity: 1, ...(colorName ? { color: colorName } : {}), ...(sizeName ? { size: sizeName } : {}), ...(thumb ? { image: thumb } : {}) });
              setOpen(false);
            }}
            activeOpacity={0.9}
            style={[styles.addToCartBtn, (sizeOptions && sizeOptions.length > 0 && !selectedSize) && styles.addToCartDisabled]}
            disabled={!!(sizeOptions && sizeOptions.length > 0 && !selectedSize)}
          >
            <Text style={styles.addToCartText}>{t('common.addToCart')}</Text>
          </TouchableOpacity>
        </View>
      </View>
  </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140, // default for rails; grid can override via prop
    marginRight: 12,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f2f2f2',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff5252',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: 6,
  },
  badgeRTL: {
    left: undefined,
    right: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: ms(12),
    fontWeight: '700',
  },
  rightIndicators: {
    position: 'absolute',
    right: 6,
    top: '35%',
    alignItems: 'center',
    gap: 4,
  },
  leftIndicators: {
    right: undefined,
    left: 6,
    alignItems: 'center',
  },
  quickAdd: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  quickAddOut: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  indicatorDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: '#111827',
    marginVertical: 2,
  },
  indicatorDotActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
  },
  indicatorCount: {
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: ms(8),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  indicatorCountText: {
    color: '#fff',
    fontSize: ms(10),
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  chip: {
    fontSize: ms(11),
    paddingHorizontal: ms(8),
    paddingVertical: ms(2),
    borderRadius: 6,
    overflow: 'hidden',
    color: '#4c1d95',
    backgroundColor: '#ede9fe',
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  chipPurple: {
    // color/background set in chip
  },
  name: {
    marginTop: 6,
    fontSize: ms(14),
    color: '#222',
    fontWeight: '600',
  },
  desc: {
    marginTop: 4,
    fontSize: ms(12),
    lineHeight: ms(15),
    color: '#4b5563',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: ms(14),
    color: '#111',
    fontWeight: '700',
  },
  strike: {
    fontSize: ms(12),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  soldText: {
    marginTop: 2,
    fontSize: ms(12),
    color: '#6b7280',
  },
  quickAddInline: {
    width: 36,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  repeatRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repeatText: {
    fontSize: ms(12),
    color: '#ef8f00',
    fontWeight: '600',
  },
  // Sheet styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%'
  },
  sheetHeader: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  sheetScroll: {
    paddingBottom: 40,
  },
  sheetImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#f3f4f6'
  },
  sheetTitle: {
    fontSize: ms(16),
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 6,
    color: '#111'
  },
  sheetPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  sheetPrice: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#111'
  },
  sheetStrikeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetStrike: {
    fontSize: ms(13),
    color: '#9ca3af',
    textDecorationLine: 'line-through'
  },
  sheetDiscount: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  colorLabel: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#111'
  },
  colorThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#f3f4f6'
  },
  colorThumbActive: {
    borderWidth: 2,
    borderColor: '#111'
  },
  sizeLabel: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#111'
  },
  sizeBadge: {
    fontSize: ms(11),
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden'
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  sizeChipActive: {
    backgroundColor: '#111',
    borderColor: '#111'
  },
  sizeChipDisabled: {
    opacity: 0.4
  },
  sizeChipText: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#111'
  },
  sizeChipTextActive: {
    color: '#fff'
  },
  sizeChipTextDisabled: {
    color: '#6b7280'
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  wishBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addToCartDisabled: {
    backgroundColor: '#9ca3af'
  },
  addToCartText: {
    color: '#fff',
    fontSize: ms(15),
    fontWeight: '700'
  }
});