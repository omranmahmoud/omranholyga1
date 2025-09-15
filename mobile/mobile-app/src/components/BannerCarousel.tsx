import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
// Note: We intentionally avoid importing `react-native-reanimated` or
// `react-native-reanimated-carousel` to keep Expo Go stable on devices
// where Reanimated native initialization may not be available.

const STATIC_IMAGES = [
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80'
];

const { width: screenWidth } = Dimensions.get('window');

type Banner = {
  image: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  link?: string;
};

type BannerCarouselProps = {
  height?: number;
  fullWidth?: boolean;
  categorySlug?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number; // ms
  loop?: boolean;
  showIndicators?: boolean;
};

const BannerCarousel = ({
  height = 240,
  fullWidth = false,
  categorySlug = '',
  autoPlay = true,
  autoPlayInterval = 4000,
  loop = true,
  showIndicators = true,
}: BannerCarouselProps) => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  // In React Native type can differ (number in JS runtime). Use broader type.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const path = categorySlug
          ? `/api/mobile-banners/by-category/${encodeURIComponent(categorySlug)}`
          : '/api/mobile-banners?active=1';
        const res = await api.get(path);
        const data = Array.isArray(res.data) ? res.data : [];
    const cleaned = data
          .filter((b: any) => b && typeof b.image === 'string' && b.image.trim().length > 0)
          .map((b: any) => ({
            image: (b.image || '').trim().startsWith('http')
              ? (b.image || '').trim()
              : `${api.defaults.baseURL}${(b.image || '').trim().startsWith('/') ? '' : '/'}${(b.image || '').trim()}`,
            title: b.title || '',
            subtitle: b.subtitle || '',
            cta: b.cta || 'Shop Now',
            link: b.link || '',
          }));
  if (mounted) setBanners(cleaned.length ? cleaned : []);
      } catch (e) {
  if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [categorySlug]);

  const fallbackBanners: Banner[] = [
    { image: STATIC_IMAGES[0], title: t('banner.cozy.title'), subtitle: t('banner.cozy.subtitle'), cta: t('banner.cozy.cta') },
    // Flash sale banner removed per request
    { image: STATIC_IMAGES[2], title: t('banner.new.title'), subtitle: t('banner.new.subtitle'), cta: t('banner.new.cta') },
  ];
  const dataToShow: Banner[] = banners.length ? banners : fallbackBanners;

  const width = fullWidth ? screenWidth : screenWidth * 0.92;

  // Auto play effect
  useEffect(() => {
    if (!autoPlay) return; // disabled
    const itemCount = dataToShow.length;
    if (itemCount <= 1) return; // nothing to slide
  if (intervalRef.current) clearInterval(intervalRef.current as any);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        const targetIndex = next < itemCount ? next : (loop ? 0 : prev);
        if (scrollRef.current && (loop || next < itemCount)) {
          scrollRef.current.scrollTo({ x: targetIndex * width, animated: true });
        }
        return targetIndex;
      });
    }, Math.max(1500, autoPlayInterval));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
  }, [autoPlay, autoPlayInterval, dataToShow, width, loop]);

  // Reset index if banner list changes length and currentIndex is out of range
  useEffect(() => {
    if (currentIndex > dataToShow.length - 1) {
      setCurrentIndex(0);
      if (scrollRef.current) scrollRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [dataToShow.length, currentIndex]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / width);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };
  const handleNavigate = (link?: string) => {
    if (!link) return;
    const l = link.trim();
    try {
      // External http(s)
      if (/^https?:\/\//i.test(l)) { Linking.openURL(l); return; }
      // Allow custom scheme app:// -> treat as path
      const normalized = l.replace(/^app:\/\//i, '/');
      // Product details: /product/ID or /products/ID
      let m = normalized.match(/^\/(?:product|products)\/([\w-]+)/i);
      if (m) { navigation.navigate('ProductDetails', { productId: m[1] }); return; }
      // Category slug: /category/slug or /categories/slug
      m = normalized.match(/^\/(?:category|categories)\/([\w-]+)/i);
      if (m) { navigation.navigate('ProductList', { category: m[1] }); return; }
      // Fallback attempt open as URL (could be mailto:, tel:, etc.)
      Linking.openURL(l);
    } catch {
      try { Linking.openURL(l); } catch {}
    }
  };

  const carouselContent = useMemo(() => {
    return dataToShow.map((item, idx) => (
      <TouchableOpacity
        key={idx}
        activeOpacity={0.9}
        style={[styles.carouselItem, { width }]}
        onPress={() => handleNavigate(item.link)}
        accessibilityRole="button"
  accessibilityLabel={item.title || t('banner.bannerFallback')}
      >
        <Image source={{ uri: item.image }} style={[styles.carouselImage, { height }]} />
        <LinearGradient
          colors={[ 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)' ]}
          locations={[0.4, 1]}
          style={styles.gradientOverlay}
        />
        <View style={styles.carouselOverlay}>
          <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
          <Text style={styles.carouselTitle}>{item.title}</Text>
          {!!item.cta && (
            <View style={styles.carouselBtn} pointerEvents="none">
              <Text style={styles.carouselBtnText}>{item.cta}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ));
  }, [dataToShow, width, height]);

  return (
    <View style={[styles.carouselContainer, fullWidth && { alignItems: 'stretch', marginTop: 0 }] }>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        accessibilityRole="adjustable"
  accessibilityLabel={t('banner.carouselLabel')}
      >
        {carouselContent}
      </ScrollView>
      {showIndicators && (
        <View style={styles.indicatorsWrapper} pointerEvents="none">
          {dataToShow.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : undefined,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 10,
    marginBottom: 18,
    alignItems: 'center',
  },
  carouselItem: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    borderRadius: 18,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  carouselOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    // Gradient provides contrast; keep transparent here
    backgroundColor: 'transparent',
  },
  carouselSubtitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  carouselBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  carouselBtnText: {
    color: 'orange',
    fontWeight: 'bold',
    fontSize: 14,
  },
  indicatorsWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
});

export default BannerCarousel;
