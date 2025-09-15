
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, StatusBar, useWindowDimensions, Text, Alert, I18nManager, Animated } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BannerCarousel from '../components/BannerCarousel';
import CategoryMenu from '../components/CategoryMenu';
import ProductRail from '../components/ProductRail';
import api from '../services/api';
import MobileAnnouncementBanner from '../components/MobileAnnouncementBanner';
import type { Product } from '../components/ProductCard';
import CategoriesGrid from '../components/CategoriesGrid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_CONTENT_WIDTH, getContainerWidth } from '../utils/layout';
import BottomTabBar from '../components/BottomTabBar';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const containerWidth = getContainerWidth(width, MAX_CONTENT_WIDTH);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cart } = useCart();
  const cartCount = useMemo(() => cart.reduce((sum, it) => sum + (it.quantity ?? 0), 0), [cart]);
  const { user, logout } = useAuth();
  const [showSigninBanner, setShowSigninBanner] = useState(true);
  // Constants matching BottomTabBar layout for consistent spacing
  const BOTTOM_TAB_HEIGHT = 72; // keep in sync with BottomTabBar.styles.bar.height
  const CENTER_BTN_PROTRUSION = 8; // center button extends ~8px above bar top
  const SIGNIN_BANNER_SPACING = -40; // even more overlap with the bar (banner sits lower)

  useEffect(() => {
    let mounted = true;

    const fetchBySlug = async (slug: string) => {
      try {
        // If no selection, load all products
        if (!slug) {
          const { data: all } = await api.get('/api/products');
          if (!mounted) return;
          const products: Product[] = Array.isArray(all) ? all : [];
          setFeatured(products.filter((p: any) => p?.isFeatured).slice(0, 10));
          setNewArrivals(products.filter((p: any) => p?.isNew).slice(0, 10));
          setTopRated(products
            .slice()
            .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))
            .slice(0, 10)
          );
          return;
        }

  // Fetch Navigation categories (populated with mapped Category) and find selected
  const { data: navCats } = await api.get('/api/navigation');
  const nlist = Array.isArray(navCats) ? navCats : [];
  const navMatch = nlist.find((n: any) => String(n.slug || '').toLowerCase() === slug.toLowerCase());
  const mappedCategoryId = navMatch?.category?._id || navMatch?.category || null;

  if (!mappedCategoryId) {
          // No matching Category; show empty rails
          setFeatured([]);
          setNewArrivals([]);
          setTopRated([]);
          return;
        }

  // Fetch products filtered by mapped Category id
  const { data: filtered } = await api.get(`/api/products?category=${encodeURIComponent(mappedCategoryId)}`);
        if (!mounted) return;
        const products: Product[] = Array.isArray(filtered) ? filtered : [];
        setFeatured(products.filter((p: any) => p?.isFeatured).slice(0, 10));
        setNewArrivals(products.filter((p: any) => p?.isNew).slice(0, 10));
        setTopRated(products
          .slice()
          .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 10)
        );
      } catch (err: any) {
        if (!mounted) return;
        console.warn('Failed to fetch products:', err?.message || err);
        // On error, don’t break UI: keep rails empty for selected category
        if (slug) {
          setFeatured([]);
          setNewArrivals([]);
          setTopRated([]);
        }
      }
    };

    fetchBySlug(selectedCategorySlug);
    return () => { mounted = false; };
  }, [selectedCategorySlug]);

  // Animated value for scroll position to reveal compact header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [160, 230],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerTranslate = scrollY.interpolate({
    inputRange: [160, 230],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });
  const mainCatOpacity = scrollY.interpolate({
    inputRange: [0, 160, 230],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  // Cross-fade original announcement banner out as compact header (with its own banner) fades in
  const mainAnnouncementOpacity = scrollY.interpolate({
    inputRange: [160, 230],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
  <Animated.ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{
      paddingBottom:
        (insets.bottom || 0) + 84 + (!user && showSigninBanner ? 60 : 0),
    }}
    scrollEventThrottle={16}
    onScroll={Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )}
  >
  {/* Banner at top with overlaid header + category menu */}
  <View>
    <BannerCarousel fullWidth height={320} categorySlug={selectedCategorySlug} />
    {/* Overlay group */}
    <View style={[styles.overlayHeaderWrap, { paddingTop: statusBarHeight + (insets.top || 0) + 8, paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }]}> 
      <View style={[styles.headerBar, { width: containerWidth, alignSelf: 'center' }]}>  
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.messages') || 'Messages'}
          style={styles.topIconBtn}
          onPress={() => {}}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="mail-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.calendar') || 'Calendar'}
          style={[styles.topIconBtn, { marginLeft: 8 }]}
          onPress={() => {}}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search', { initialQuery: '' })}
          style={[styles.searchPill, styles.searchPillOverlay, { marginRight: 2 }, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.searchProductsA11y')}
        >
          <Text style={[styles.searchPlaceholder, { color: '#fff' }]} numberOfLines={1} ellipsizeMode="tail">
            {t('productList.searchProducts')}
          </Text>
          <View style={[styles.searchRightGroup, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}> 
            <Ionicons name="camera-outline" size={20} color="#f1f1f1" style={I18nManager.isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
            <View style={[styles.searchEndCap, styles.searchEndCapOverlay]}>
              <Ionicons
                name="search"
                size={18}
                color="#fff"
              />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topIconBtn, { marginLeft: 4 }]}
          accessibilityLabel="Wishlist"
          accessibilityRole="button"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <MaterialIcons name="favorite-border" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={[styles.categoryRow, { width: containerWidth, alignSelf: 'center', marginTop: 14 }]}> 
        <View style={{ flex: 1 }}>
          <CategoryMenu selectedSlug={selectedCategorySlug} onSelect={setSelectedCategorySlug} onDark />
        </View>
        <View style={[styles.categoryDivider, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.allCategories') || 'All Categories'}
          style={styles.categoryHamburgerBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={() => navigation.navigate('Category')}
        >
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
  {/* Announcements directly after hero banner (fades out when compact header appears) */}
  <Animated.View style={{ opacity: mainAnnouncementOpacity }}>
    <MobileAnnouncementBanner />
  </Animated.View>
  {/* Sign-in prompt moved below (outside ScrollView) */}
  {/* (Removed separate in-flow header, now overlaid on banner) */}
      {/* Content below */}
      <View style={{ marginTop: 8 }}>
  {/* FeatureButtons (free shipping / flash sale) removed per request */}
  <CategoriesGrid selectedNavSlug={selectedCategorySlug} />
  <ProductRail title={t('home.featured')} products={featured} paging autoRotateCards={false} />
  {/* New arrivals displayed in responsive wrapped rows */}
  <ProductRail title={t('home.newArrivals')} products={newArrivals} wrap />
  <ProductRail title={t('home.topRated')} products={topRated} wrap />
      </View>
    </Animated.ScrollView>
    {/* Compact header that appears after scrolling past the hero/banner */}
    <Animated.View
      pointerEvents={undefined}
      style={[
        styles.compactHeader,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslate }],
          paddingTop: statusBarHeight + (insets.top || 0),
          paddingLeft: 12 + insets.left,
          paddingRight: 12 + insets.right,
        },
      ]}
    >
      <View style={[styles.compactHeaderBar, { width: containerWidth, alignSelf: 'center' }]}>  
        <TouchableOpacity style={styles.topIconBtn} accessibilityLabel={t('common.messages') || 'Messages'}>
          <Ionicons name="mail-outline" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topIconBtn, { marginLeft: 8 }]} accessibilityLabel={t('common.calendar') || 'Calendar'}>
          <Ionicons name="calendar-outline" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search', { initialQuery: '' })}
          style={[styles.searchPill, { flex: 1, marginLeft: 8, marginRight: 2 }, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.searchProductsA11y')}
        >
          <Text style={styles.searchPlaceholder} numberOfLines={1} ellipsizeMode="tail">{t('productList.searchProducts')}</Text>
          <View style={[styles.searchRightGroup, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}> 
            <Ionicons name="camera-outline" size={18} color="#666" style={I18nManager.isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
            <View style={[styles.searchEndCap, { backgroundColor: '#111', borderWidth: 1, borderColor: '#222' }]}> 
              <Ionicons
                name="search"
                size={16}
                color="#fff"
              />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topIconBtn} accessibilityLabel="Wishlist" onPress={() => navigation.navigate('Wishlist')}>
          <MaterialIcons name="favorite-border" size={24} color="#111" />
        </TouchableOpacity>
      </View>
      <View style={[styles.compactCategoryWrap, styles.categoryRow, { width: containerWidth, alignSelf: 'center' }]}> 
        <View style={{ flex: 1 }}>
          <CategoryMenu selectedSlug={selectedCategorySlug} onSelect={setSelectedCategorySlug} />
        </View>
        <View style={styles.categoryDivider} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.allCategories') || 'All Categories'}
          style={styles.categoryHamburgerBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={() => navigation.navigate('Category')}
        >
          <Ionicons name="menu-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>
      {/* Compact version of announcement banner inside sticky header */}
      <View style={[styles.compactAnnouncementWrap, { width: containerWidth, alignSelf: 'center' }]}> 
  <MobileAnnouncementBanner compact slideIntervalMs={3500} style={styles.compactAnnouncement} />
      </View>
    </Animated.View>
    {/* Sign-in prompt (only when not logged in), anchored above BottomTabBar */}
    {!user && showSigninBanner && (
      <View
        style={[
          styles.signinBanner,
          {
            bottom: (insets.bottom || 0) + BOTTOM_TAB_HEIGHT + CENTER_BTN_PROTRUSION + SIGNIN_BANNER_SPACING,
            left: 12 + insets.left,
            right: 12 + insets.right,
          },
        ]}
      >
        <Text numberOfLines={1} style={styles.signinText}>{t('home.signInEnjoy')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signinBtn}>
          <Text style={styles.signinBtnText}>{t('home.signIn')}</Text>
        </TouchableOpacity>
      </View>
    )}
    {/* Bottom navigation bar */}
    <BottomTabBar
      active="home"
      cartCount={cartCount}
      onHome={() => { /* already here */ }}
  onCategory={() => navigation.navigate('Category')}
      onTrends={() => navigation.navigate('ProductList')}
      onCart={() => navigation.navigate('Cart')}
      onMe={() => navigation.navigate('Profile')}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  // overlayContainer removed (was absolute); search & tabs now scroll with content
  signinBanner: {
    position: 'absolute',
  zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  signinBtn: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signinBtnText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  backgroundColor: 'rgba(242,242,242,0.97)',
    borderRadius: 20,
    paddingHorizontal: 12,
  paddingVertical: 10,
    marginBottom: 8,
  marginLeft: 20, // moved further right
  // subtle shadow for separation
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
  // Make the whole pill a bit narrower than the full container width
  alignSelf: 'center',
  width: '80%', // slightly reduced to compensate added left margin
  maxWidth: 480,
  minWidth: 260,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
  justifyContent: 'flex-start',
  },
  wishlistBtn: {
    marginLeft: 16,
  padding: 8, // increased for larger icon
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  topIconBtn: {
    padding: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  searchPillOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  searchRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchEndCap: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  searchEndCapOverlay: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  topSearchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  topSearchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  // Compact header styles (shown after scroll)
  compactHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    zIndex: 50,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    paddingBottom: 8,
  },
  compactHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  compactSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    marginRight: 10,
  },
  compactSearchText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    marginLeft: 6,
  },
  compactWishlistBtn: {
    padding: 6,
    borderRadius: 16,
  },
  compactCategoryWrap: {
    marginTop: 6,
  },
  compactAnnouncementWrap: {
    marginTop: 4,
  },
  compactAnnouncement: {
    marginTop: 0,
    marginHorizontal: 0,
  },
  overlayHeaderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 30,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHamburgerBtn: {
    padding: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  categoryDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
    opacity: 0.6,
  },
});

export default HomeScreen;
// (Removed any code or imports after this line)