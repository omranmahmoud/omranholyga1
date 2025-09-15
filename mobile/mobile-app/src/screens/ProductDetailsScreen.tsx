import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, Image, TouchableOpacity, StyleSheet, Share, Platform, StatusBar, Animated, useWindowDimensions, Pressable, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ReviewSection } from '../components/ReviewSection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../utils/responsive';
import { MAX_CONTENT_WIDTH, getContainerWidth } from '../utils/layout';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { fetchProductById, fetchProductsByCategory } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';
import { formatPrice } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

function resolveImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  const s = String(src).trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

export default function ProductDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const { addRecent } = useRecentlyViewed();
  const [colorIdx, setColorIdx] = useState<number>(0);
  const [sizeIdx, setSizeIdx] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [videoStarted, setVideoStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const openMenu = () => {
    if (menuOpen) return;
    setMenuOpen(true);
    requestAnimationFrame(() => {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, { toValue: 1, duration: 140, useNativeDriver: true, easing: undefined }).start();
    });
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => setMenuOpen(false));
  };
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const scrollY = useRef(new Animated.Value(0)).current;
  const DETAILS_MAX = Math.min(MAX_CONTENT_WIDTH, 1000);
  const containerWidth = getContainerWidth(width, DETAILS_MAX);
  const isWide = containerWidth >= 900; // tablets/landscape
  const GAP = 16;
  const leftWidth = isWide ? Math.round(containerWidth * 0.58) : containerWidth;
  const rightWidth = isWide ? containerWidth - leftWidth - GAP : containerWidth;
  // Base header only (tabs will overlay and appear after scroll)
  const TABS_HEIGHT = 44;
  const APPROX_HEADER_CONTENT = 72; // fallback estimate before measurement
  const [headerHeight, setHeaderHeight] = useState((insets.top || statusBarHeight) + APPROX_HEADER_CONTENT);
  const headerOffset = headerHeight; // scroll content offset equals current measured header height (without tabs)
  const carouselHeight = useMemo(() => {
    // Make images tall on phones; on wide layouts use up to 80% of screen height
    const basis = leftWidth;
    const h = Math.round(basis * 1.2);
    return isWide
      ? Math.min(Math.max(h, 420), Math.round(height * 0.8))
      : Math.min(Math.max(h, 320), Math.round(height * 0.65));
  }, [leftWidth, height, isWide]);

  // Section nav handling (Goods / Reviews / Recommend)
  const scrollViewRef = useRef<ScrollView | null>(null);
  const sectionPositions = useRef<{ goods?: number; reviews?: number; recommend?: number }>({});
  const [activeSection, setActiveSection] = useState<'goods' | 'reviews' | 'recommend'>('goods');
  const tabOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const tabTranslate = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [-TABS_HEIGHT, 0],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const pos = sectionPositions.current;
      if (!pos) return;
      const reviewsY = pos.reviews ?? Infinity;
      const recommendY = pos.recommend ?? Infinity;
      const sectionOffset = headerOffset + TABS_HEIGHT; // height hidden behind header+tabs
      const currentVisibleTop = value + sectionOffset; // approximate content point under tabs
      const buffer = 20; // small pre-trigger buffer

      if (currentVisibleTop >= recommendY - buffer) {
        if (activeSection !== 'recommend') setActiveSection('recommend');
      } else if (currentVisibleTop >= reviewsY - buffer) {
        if (activeSection !== 'reviews') setActiveSection('reviews');
      } else if (activeSection !== 'goods') {
        setActiveSection('goods');
      }
    });
    return () => { scrollY.removeListener(id); };
  }, [activeSection, scrollY, headerOffset]);

  const scrollToSection = (key: 'goods' | 'reviews' | 'recommend') => {
    if (key === 'goods') {
      // Scroll fully to top (media visible)
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const y = sectionPositions.current[key];
    if (y == null) return;
    const offset = headerOffset + TABS_HEIGHT;
    const target = Math.max(y - offset, 0);
    scrollViewRef.current?.scrollTo({ y: target, animated: true });
  };

  useEffect(() => {
    fetchProductById(productId)
      .then((data) => setProduct(data))
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!product || !product.category) return;
    const catId = product.category?._id || product.category?.id || product.category;
    if (!catId) return;
    setRecLoading(true);
    fetchProductsByCategory(String(catId))
      .then(list => {
        if (Array.isArray(list)) {
          const currentId = product._id || product.id;
          const filtered = list.filter(p => (p._id || p.id) !== currentId).slice(0, 12);
          setRecommended(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [product]);

  // Ref to ensure single record per product id
  const recordedRef = useRef<string | null>(null);

  // Build images based on selected color fallback
  const images: string[] = useMemo(() => {
    const baseImgs: string[] = Array.isArray(product?.images) ? product.images : [];
    const colorImgs: string[] = Array.isArray(product?.colors?.[colorIdx]?.images)
      ? product.colors[colorIdx].images
      : [];
    const chosen = colorImgs.length ? colorImgs : baseImgs;
    return chosen.map(resolveImageUrl).filter(Boolean) as string[];
  }, [product, colorIdx]);

  // Build media array with optional video first
  const media = useMemo(() => {
    const arr: Array<{ type: 'video' | 'image'; url?: string }> = [];
    if (product?.video) arr.push({ type: 'video', url: resolveImageUrl(product.video) });
    images.forEach(u => arr.push({ type: 'image', url: u }));
    return arr.length ? arr : [{ type: 'image', url: undefined }];
  }, [product?.video, images]);
  // Record recently viewed after images prepared (one-time per product)
  useEffect(() => {
    if (!product) return;
    const currentId = product._id || product.id;
    if (!currentId || recordedRef.current === currentId) return;
    recordedRef.current = currentId;
    try {
      const variantPrimary = images && images[0] ? images[0] : undefined;
      const fallbackPrimary = Array.isArray(product.images) && product.images[0] ? resolveImageUrl(product.images[0]) : undefined;
      const firstImage = variantPrimary || fallbackPrimary;
      addRecent({
        id: currentId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: firstImage
      });
    } catch {}
  }, [productId, product, images, addRecent]);
  const videoIndex = product?.video ? 0 : -1;

  const hasDiscount =
    typeof product?.originalPrice === 'number' &&
    product.originalPrice > (product?.price ?? 0);
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const rating = Number(product?.rating ?? 0);
  const reviewsCount = Array.isArray(product?.reviews) ? product.reviews.length : (product?.reviewsCount ?? 0);

  const handleAddToCart = () => {
    if (!product) return;
    const color = product.colors?.[colorIdx];
    const size = color?.sizes?.[sizeIdx];
    addToCart({
      productId: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      // include variant info if available
      ...(color?.name ? { color: color.name } : {}),
      ...(size?.name ? { size: size.name } : {}),
      ...(images?.[0] ? { image: images[0] } : {}),
    });
  Alert.alert(t('productDetails.addedToCart'), t('productDetails.addedToCartMsg', { name: product.name }));
  };

  if (loading) return <View style={ds.loading}><Text>{t('loading')}</Text></View>;
  if (error) return <View style={ds.loading}><Text>{error}</Text></View>;
  if (!product) return null;

  // Reusable block to render textual/selector details
  const DetailsBlock = (
    <>
      {/* Price + discount */}
      <View style={[ds.priceRow, { width: rightWidth || containerWidth, alignSelf: 'center' }]}> 
  <Text style={ds.price}>{typeof product.price === 'number' ? formatPrice(product.price) : ''}</Text>
        {hasDiscount && (
          <>
            <Text style={ds.strike}>{typeof product.originalPrice === 'number' ? formatPrice(product.originalPrice) : ''}</Text>
            <View style={ds.discountBadge}><Text style={ds.discountText}>-{discountPct}%</Text></View>
          </>
        )}
      </View>

      {/* Title */}
      <Text style={[ds.title, { width: rightWidth || containerWidth, alignSelf: 'center' }]} numberOfLines={3}>{product.name}</Text>

      {/* Rating and reviews */}
      <View style={[ds.ratingRow, { width: rightWidth || containerWidth, alignSelf: 'center' }]}>
        <Ionicons name="star" size={16} color="#f59e0b" />
        <Text style={ds.ratingText}>{rating.toFixed(2)}</Text>
        {reviewsCount ? <Text style={ds.ratingCount}>({reviewsCount}+)</Text> : null}
        <Text style={ds.ratingPipe}>•</Text>
    <Text style={ds.ratingLabel}>{t('productDetails.fiveStarRating')}</Text>
        {reviewsCount ? (
          <>
            <Text style={ds.ratingPipe}>•</Text>
      <Text style={ds.ratingLabel}>{t('productDetails.fiveStarReviews', { count: reviewsCount })}</Text>
          </>
        ) : null}
      </View>

      {/* Chips */}
      <View style={[ds.chipsRow, { width: rightWidth || containerWidth, alignSelf: 'center' }]}>
        {product.isFeatured ? (
          <Text style={[ds.chip, ds.chipOrange]}>{t('productDetails.bestsellerRank', { rank: 2 })}</Text>
        ) : null}
        {product.category ? (
          <Text style={[ds.chip, ds.chipPurple]}>{product.category?.name || ''}</Text>
        ) : null}
      </View>

      {/* Color selector (image thumbnails) */}
      {Array.isArray(product.colors) && product.colors.length > 0 && (
        <View style={[ds.selectorBlock, { width: rightWidth || containerWidth, alignSelf: 'center' }] }>
          <Text style={ds.selectorTitle}>
            {t('productDetails.color')}: {product.colors[colorIdx]?.name || ''}  ›
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {product.colors.map((c: any, idx: number) => {
              const thumb = Array.isArray(c.images) && c.images[0] ? resolveImageUrl(c.images[0]) : (images[0] || undefined);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { setColorIdx(idx); setSizeIdx(0); setPage(0); setVideoStarted(false); }}
                  style={[ds.colorThumb, idx === colorIdx && ds.colorThumbSelected]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${c?.name || idx + 1}`}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={ds.colorThumbImage} resizeMode="cover" />
                  ) : (
                    <View style={[ds.colorThumbImage, { backgroundColor: '#e5e7eb' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Size selector */}
      {Array.isArray(product.colors?.[colorIdx]?.sizes) && product.colors[colorIdx].sizes.length > 0 && (
        <View style={[ds.selectorBlock, { width: rightWidth || containerWidth, alignSelf: 'center' }]}>
          <Text style={ds.selectorTitle}>{t('productDetails.size')}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {product.colors[colorIdx].sizes.map((s: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSizeIdx(idx)}
                style={[ds.pill, idx === sizeIdx && ds.pillActive]}
              >
                <Text style={[ds.pillText, idx === sizeIdx && ds.pillTextActive]}>{s?.name || t('productDetails.sizeOption', { index: idx + 1 })}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
  {/* Sticky header (tabs appear separately when scrolled) */}
      <Animated.View onLayout={e => {
        const h = e.nativeEvent.layout.height; // includes safe area padding
        if (h && Math.abs(h - headerHeight) > 1) setHeaderHeight(h);
      }} style={[ds.headerWrap, {
        paddingTop: (insets.top || statusBarHeight) + 16,
        paddingLeft: 12 + (insets.left || 0),
        paddingRight: 12 + (insets.right || 0),
        backgroundColor: '#fff',
  // Border removed so tabs overlay touches header with no gap
      }]}> 
        <View style={[ds.headerRowContainer, { width: containerWidth, alignSelf: 'center' }]}>
          <View style={ds.headerRow}>
          <TouchableOpacity style={ds.headerIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={ds.pillBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
            <Text style={ds.headerPillText} numberOfLines={1}>{t('productDetails.headerPromo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ds.headerIconBtn} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={18} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={[ds.headerIconBtn, { position: 'relative' }]} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={18} color="#111" />
            {cart?.length ? (
              <View style={ds.cartBadge}><Text style={ds.cartBadgeText}>{cart.length}</Text></View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={ds.headerIconBtn}
            onPress={async () => {
              try {
                const link = (images && images[0]) || undefined;
                await Share.share({ title: product?.name, message: `${product?.name}${link ? `\n${link}` : ''}` });
              } catch {}
            }}
          >
            <Ionicons name="share-outline" size={18} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={ds.headerIconBtn} onPress={() => (menuOpen ? closeMenu() : openMenu())}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#111" />
          </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      <Animated.ScrollView
        ref={(ref) => { scrollViewRef.current = ref as any; }}
        contentContainerStyle={{ paddingTop: headerOffset, paddingBottom: 96 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
  {/* Top anchor for Goods (records y=0) */}
  <View onLayout={e => { if (sectionPositions.current.goods == null) sectionPositions.current.goods = e.nativeEvent.layout.y; }} />
  <View style={{ width: containerWidth, alignSelf: 'center' }}>
          {isWide ? (
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {/* Left: Image carousel */}
              <View style={{ width: leftWidth }}>
                <View style={{ width: leftWidth, height: carouselHeight, backgroundColor: '#f5f5f5' }}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                      const p = Math.round(e.nativeEvent.contentOffset.x / leftWidth);
                      setPage(p);
                    }}
                  >
                    {media.map((m, i) => (
                      <View key={i} style={{ width: leftWidth, height: carouselHeight }}>
                        {m.type === 'video' && m.url ? (
                          videoStarted ? (
                            <Video
                              source={{ uri: m.url }}
                              style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                              resizeMode={ResizeMode.COVER}
                              useNativeControls
                              shouldPlay={i === page && videoStarted}
                              isLooping
                              onError={() => setVideoStarted(false)}
                            />
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              style={{ width: '100%', height: '100%', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
                              onPress={() => setVideoStarted(true)}
                            >
                              {/** Poster fallback: first image or dark background */}
                              {images[0] ? (
                                <Image source={{ uri: images[0] }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.55 }} resizeMode="cover" />
                              ) : null}
                              <View style={ds.playButton}> 
                                <Ionicons name="play" size={30} color="#fff" />
                              </View>
                            </TouchableOpacity>
                          )
                        ) : m.url ? (
                          <Image source={{ uri: m.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  <View style={ds.rightDots}>
                    {media.map((_, i) => (
                      <View key={i} style={[ds.dot, i === page && ds.dotActive]} />
                    ))}
                  </View>
                </View>
              </View>
              {/* Right: Details */}
              <View
                style={{ width: rightWidth, paddingTop: 6 }}
                onLayout={e => {
                  // Record goods section top (first time only to avoid minor relayout noise)
                  if (sectionPositions.current.goods == null) {
                    sectionPositions.current.goods = e.nativeEvent.layout.y + (isWide ? 0 : 0);
                  }
                }}
              >
                {DetailsBlock}
              </View>
            </View>
          ) : (
            <>
              {/* Stacked phone layout */}
              <View style={{ width: containerWidth, height: carouselHeight, backgroundColor: '#f5f5f5' }}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const p = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
                    setPage(p);
                  }}
                >
                  {media.map((m, i) => (
                    <View key={i} style={{ width: containerWidth, height: carouselHeight }}>
                      {m.type === 'video' && m.url ? (
                        videoStarted ? (
                          <Video
                            source={{ uri: m.url }}
                            style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                            resizeMode={ResizeMode.COVER}
                            useNativeControls
                            shouldPlay={i === page && videoStarted}
                            isLooping
                            onError={() => setVideoStarted(false)}
                          />
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={{ width: '100%', height: '100%', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => setVideoStarted(true)}
                          >
                            {images[0] ? (
                              <Image source={{ uri: images[0] }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.55 }} resizeMode="cover" />
                            ) : null}
                            <View style={ds.playButton}> 
                              <Ionicons name="play" size={36} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        )
                      ) : m.url ? (
                        <Image source={{ uri: m.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                      )}
                    </View>
                  ))}
                </ScrollView>
                <View style={ds.rightDots}>
                  {media.map((_, i) => (
                    <View key={i} style={[ds.dot, i === page && ds.dotActive]} />
                  ))}
                </View>
              </View>

              <View
                onLayout={e => {
                  sectionPositions.current.goods = e.nativeEvent.layout.y;
                }}
              >{DetailsBlock}</View>
            </>
          )}
        </View>
        {/* Reviews Section */}
        <View
          style={{ width: containerWidth, alignSelf: 'center' }}
          onLayout={e => { sectionPositions.current.reviews = e.nativeEvent.layout.y; }}
        >
          <ReviewSection productId={product._id || product.id} initialReviews={product.reviews} />
        </View>
        {/* Recommend Section */}
        <View
          style={{ width: containerWidth, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 32, paddingBottom: 80 }}
          onLayout={e => { sectionPositions.current.recommend = e.nativeEvent.layout.y; }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>{t('productDetails.recommendationsTitle', 'Recommended for you')}</Text>
          {recLoading ? (
            <ActivityIndicator />
          ) : recommended.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {recommended.map((p, idx) => {
                const pid = p._id || p.id;
                const imgs: string[] = Array.isArray(p.images) ? p.images : [];
                const first = imgs[0] ? resolveImageUrl(imgs[0]) : undefined;
                const hasDisc = typeof p.originalPrice === 'number' && p.originalPrice > (p.price || 0);
                const discPct = hasDisc ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                const columns = isWide ? 4 : 3;
                const cardWidth = (containerWidth - 12*2 - 6*2) / columns; // approximate; marginHorizontal:-6
                return (
                  <TouchableOpacity
                    key={pid}
                    activeOpacity={0.85}
                    style={[ds.miniCard, { width: cardWidth, marginHorizontal: 6, marginBottom: 18 }]}
                    onPress={() => navigation.push('ProductDetails', { productId: pid })}
                  >
                    {first ? <Image source={{ uri: first }} style={ds.miniCardImage} /> : <View style={[ds.miniCardImage, { backgroundColor:'#f3f4f6' }]} />}
                    <View style={ds.miniPriceRow}>
                      <Text style={ds.miniPriceText}>{typeof p.price === 'number' ? formatPrice(p.price) : ''}</Text>
                      {hasDisc ? (
                        <View style={ds.miniDiscountPill}><Text style={ds.miniDiscountPillText}>-{discPct}%</Text></View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: '#6b7280' }}>{t('productDetails.noRecommendations', 'No recommendations yet.')}</Text>
          )}
        </View>
  </Animated.ScrollView>


      {/* Tabs overlay (appears after scroll) */}
  <Animated.View
        style={{
          position: 'absolute',
    top: headerHeight, // directly beneath measured header
            left: 0,
            right: 0,
            height: TABS_HEIGHT,
            backgroundColor: '#fff',
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: 12,
            borderBottomWidth: 1,
            borderColor: '#eee',
            opacity: tabOpacity,
            transform: [{ translateY: tabTranslate }],
            zIndex: 55
        }}
      >
        {[
          { key: 'goods', label: t('productDetails.tabGoods', 'Goods') },
          { key: 'reviews', label: t('productDetails.tabReviews', 'Reviews') },
          { key: 'recommend', label: t('productDetails.tabRecommend', 'Recommend') },
        ].map(tab => {
          const active = activeSection === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { setActiveSection(tab.key as any); scrollToSection(tab.key as any); }}
              style={[ds.tabBtn, active && ds.tabBtnActive, { justifyContent: 'flex-end', paddingBottom: 6 }]}
              accessibilityRole="button"
            >
              <Text style={[ds.tabText, active && ds.tabTextActive]}>{tab.label}</Text>
              <View style={[ds.tabIndicator, active && ds.tabIndicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Bottom bar */}
      <View style={[ds.bottomBar, { paddingBottom: 12 + (insets.bottom || 0) }]}>
        <View style={{ width: containerWidth, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
          {(() => {
            const productIdVal = product._id || product.id;
            const colorName = product.colors?.[colorIdx]?.name as string | undefined;
            const sizeName = product.colors?.[colorIdx]?.sizes?.[sizeIdx]?.name as string | undefined;
            const saved = isWishlisted(productIdVal, colorName, sizeName);
            const onToggle = () => {
              if (!user) {
                navigation.navigate('Login');
                return;
              }
              toggleWishlist({
                productId: productIdVal,
                name: product.name,
                price: product.price,
                image: images?.[0],
                ...(colorName ? { color: colorName } : {}),
                ...(sizeName ? { size: sizeName } : {}),
              });
            };
            return (
              <TouchableOpacity accessibilityLabel={t('common.wishlist')} style={ds.iconBtn} onPress={onToggle}>
                <MaterialIcons name={saved ? 'favorite' : 'favorite-border'} size={22} color={saved ? '#ef4444' : '#111'} />
              </TouchableOpacity>
            );
          })()}
          <TouchableOpacity style={ds.addBtn} onPress={handleAddToCart}>
            <Text style={ds.addBtnText}>{t('common.addToCart')}</Text>
          </TouchableOpacity>
        </View>
  </View>
      {menuOpen && (
        <View pointerEvents="box-none" style={ds.menuOverlay}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <Animated.View
            style={[ds.menuWrapper, {
              top: headerHeight + 4, // place menu fully below header (dynamic)
              opacity: menuAnim,
              transform: [
                { translateY: menuAnim.interpolate({ inputRange: [0,1], outputRange: [-4,0] }) },
                { scale: menuAnim.interpolate({ inputRange: [0,1], outputRange: [0.96,1] }) }
              ]
            }]}
          >
            <View style={ds.menuArrow} />
            <View style={ds.menuBox}>
              {[
                { key: 'home', label: t('common.home', 'Home'), icon: 'home-outline', action: () => navigation.navigate('Home' as any) },
                { key: 'wishlist', label: t('common.wishlist', 'Wishlist'), icon: 'heart-outline', action: () => navigation.navigate('Wishlist' as any) },
                { key: 'recent', label: t('productDetails.recentlyViewed', 'Recently Viewed'), icon: 'time-outline', action: () => navigation.navigate('RecentlyViewed' as any) },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => { closeMenu(); item.action(); }}
                  style={({ pressed }) => [ds.menuItem, pressed && ds.menuItemPressed]}
                  android_ripple={{ color: '#e5e7eb' }}
                >
                  <Ionicons name={item.icon as any} size={20} color="#4b5563" style={{ marginRight: 16 }} />
                  <Text style={ds.menuItemText}>{item.label}</Text>
                </Pressable>
              ))}
              {/* Optional footer placeholder (e.g., account / settings) */}
              {/* <View style={ds.menuFooterPlaceholder} /> */}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Mini product card styles (mirrors RecentlyViewedScreen cards for visual parity)
  miniCard: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  miniCardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  miniPriceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, gap: 6 },
  miniPriceText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  miniDiscountPill: { backgroundColor: '#fff1ee', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniDiscountPillText: { color: '#f97316', fontSize: 11, fontWeight: '700' },
  headerWrap: {
    position: 'absolute', left: 0, right: 0, top: 0, zIndex: 50,
    paddingHorizontal: 12,
  },
  headerRowContainer: { alignSelf: 'center' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerIconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pillBar: {
    flex: 1, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerPillText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  rightDots: {
    position: 'absolute', right: 8, top: '40%', alignItems: 'center'
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d1d5db', marginVertical: 3 },
  dotActive: { backgroundColor: '#111827' },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  price: { fontSize: ms(26), fontWeight: '800', color: '#111' },
  strike: { fontSize: ms(14), color: '#9ca3af', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#ff5252', paddingHorizontal: ms(8), paddingVertical: ms(2), borderRadius: 6 },
  discountText: { color: '#fff', fontWeight: '700', fontSize: ms(12) },
  title: { marginTop: 8, paddingHorizontal: 12, fontSize: ms(16), color: '#111', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 6 },
  ratingText: { marginLeft: 4, fontWeight: '700', color: '#111' },
  ratingCount: { marginLeft: 4, color: '#6b7280', fontSize: ms(12) },
  ratingPipe: { marginHorizontal: 6, color: '#9ca3af' },
  ratingLabel: { color: '#6b7280', fontSize: 12 },
  chipsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8, gap: 8 },
  chip: { fontSize: ms(12), paddingHorizontal: ms(8), paddingVertical: ms(4), borderRadius: 8, overflow: 'hidden', fontWeight: '700' },
  chipOrange: { backgroundColor: '#fff7ed', color: '#9a3412' },
  chipPurple: { backgroundColor: '#f5f3ff', color: '#5b21b6' },
  selectorBlock: { marginTop: 16, paddingHorizontal: 12 },
  selectorTitle: { fontWeight: '700', color: '#111', marginBottom: 4 },
  pill: { paddingHorizontal: ms(12), paddingVertical: ms(8), borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8, backgroundColor: '#fff' },
  pillActive: { borderColor: '#111', backgroundColor: '#111' },
  pillText: { color: '#111', fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee',
  },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addBtn: { height: 42, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, minWidth: 330 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)'
  },
  colorThumb: {
    width: 70,
    height: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  colorThumbSelected: {
    borderColor: '#111',
    borderWidth: 2
  },
  colorThumbImage: {
    width: '100%',
    height: '100%'
  },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6, paddingHorizontal: 12, height: 44 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  tabBtnActive: { backgroundColor: '#f5f5f5' },
  tabText: { fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#111', fontWeight: '800' },
  tabIndicator: { marginTop: 6, width: 34, height: 2, backgroundColor: 'transparent', borderRadius: 1 },
  tabIndicatorActive: { backgroundColor: '#111' },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  // menuWrapper top set dynamically (below header) when rendering
  menuWrapper: { position: 'absolute', right: 8 },
  menuArrow: { position: 'absolute', top: -7, right: 26, width: 16, height: 16, backgroundColor: '#fff', transform: [{ rotate: '45deg' }], borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  menuBox: { minWidth: 210, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 9, borderWidth: 1, borderColor: '#e5e7eb' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13 },
  menuItemDivider: {},
  menuItemText: { fontSize: 16, color: '#111', fontWeight: '600' },
  menuItemPressed: { backgroundColor: '#f3f4f6' },
  menuFooterPlaceholder: { height: 2 }
});
