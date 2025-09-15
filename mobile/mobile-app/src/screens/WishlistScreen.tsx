import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchProducts, fetchProductsFiltered } from '../services/productService';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function WishlistScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { cart, addToCart } = useCart();
  const cartCount = useMemo(() => (Array.isArray(cart) ? cart.reduce((n, it) => n + (it.quantity || 0), 0) : 0), [cart]);
  const insets = useSafeAreaInsets();
  const [recs, setRecs] = useState<any[]>([]);
  // Hand press animation
  const handAnim = useRef(new Animated.Value(0)).current;
  const visible = useRef(new Animated.Value(1)).current; // shared visibility for heart + hand
  const [heartLayout, setHeartLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [handLayout, setHandLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // Fallback reach if we don't have layout yet
  const fallbackDx = -18; // move left
  const fallbackDy = 1;   // tiny down
  // Removed external finger PNG dependency; using an inline emoji instead to avoid missing asset build failures.

  useEffect(() => {
    let mounted = true;
    // Prefer featured and highly rated as "real" recommendations
    (async () => {
      try {
        const featured = await fetchProductsFiltered({ isFeatured: true, minRating: 4 });
        if (mounted && Array.isArray(featured) && featured.length) {
          setRecs(featured.slice(0, 12));
          return;
        }
      } catch {}
      try {
        const topRated = await fetchProductsFiltered({ minRating: 4 });
        if (mounted && Array.isArray(topRated) && topRated.length) {
          setRecs(topRated.slice(0, 12));
          return;
        }
      } catch {}
      try {
        const all = await fetchProducts();
        if (mounted && Array.isArray(all)) setRecs(all.slice(0, 12));
      } catch {
        if (mounted) setRecs([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Loop a subtle "press" animation: hand nudges left toward the heart then returns
  useEffect(() => {
    const loopSeq = Animated.loop(
      Animated.sequence([
        // Ensure visible before starting a press cycle
        Animated.timing(visible, { toValue: 1, duration: 150, useNativeDriver: true }),
        // Move hand to press the heart
        Animated.timing(handAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        // Hold at pressed state so heart stays black
        Animated.delay(350),
        // Hide both hand and heart
        Animated.timing(visible, { toValue: 0, duration: 200, useNativeDriver: true }),
        // Reset position while hidden
        Animated.timing(handAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        // Wait hidden for a moment
        Animated.delay(600),
        // Fade back in before next cycle
        Animated.timing(visible, { toValue: 1, duration: 250, useNativeDriver: true }),
        // Optional idle time visible
        Animated.delay(400),
      ])
    );
    loopSeq.start();
    return () => {
      loopSeq.stop();
    };
  }, [handAnim, visible]);

  // Compute exact reach to heart using measured centers. Small tip offsets to align fingertip.
  const dx = heartLayout && handLayout
    ? (heartLayout.x + heartLayout.width / 2) - (handLayout.x + handLayout.width / 2) + 4 // push a bit further
    : fallbackDx;
  const dy = heartLayout && handLayout
    ? (heartLayout.y + heartLayout.height / 2) - (handLayout.y + handLayout.height / 2) + 2
    : fallbackDy;

  const handAnimatedStyle = {
    transform: [
      { translateX: handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      { rotate: handAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
      { scale: handAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) },
    ],
    opacity: handAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }),
  } as const;

  // Heart responds to the press: crossfade outline->filled and subtle scale
  const heartScaleStyle = {
    transform: [
      // press down -> overshoot -> settle
      { scale: handAnim.interpolate({ inputRange: [0, 0.6, 0.9, 1], outputRange: [1, 0.92, 1.06, 1] }) },
    ],
  } as const;
  const heartOutlineOpacity = handAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const heartFilledOpacity = handAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] });
  const rippleOpacity = handAnim.interpolate({ inputRange: [0.8, 1], outputRange: [0, 0.35], extrapolate: 'clamp' });
  const rippleScale = handAnim.interpolate({ inputRange: [0.8, 1], outputRange: [0.6, 1.6], extrapolate: 'clamp' });

  const resolveImageUrl = (src?: string): string | undefined => {
    if (!src) return undefined;
    const s = String(src).trim();
    if (!s) return undefined;
    if (/^https?:\/\//i.test(s)) return s;
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    if (s.startsWith('/')) return `${base}${s}`;
    return `${base}/${s}`;
  };

  const goLogin = () => navigation.navigate('Login', { redirect: 'Wishlist' });
  const goShop = () => navigation.navigate('Home');

  const renderEmpty = (
    <>
  <View style={s.emptyWrap}>
        <Ionicons name="heart-outline" size={64} color="#c4c4c4" />
        <Text style={s.emptyTitle}>{t('wishlistScreen.empty', 'It is empty here.')}</Text>
        <View style={s.actionRow}>
          {!user ? (
            <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={goLogin}>
              <Text style={s.btnPrimaryText}>{t('profile.signIn')} / {t('profile.createAccount')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={goShop}>
            <Text style={s.btnGhostText}>{t('banner.new.cta', 'Shop Now')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[s.infoBlock, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.infoTitle}>{t('wishlistScreen.heartIt', 'Heart It.')}</Text>
          <Text style={s.infoDesc}>{t('wishlistScreen.line1', 'Store everything you love on one page.')}</Text>
          <Text style={s.infoDesc}>{t('wishlistScreen.line2', 'Think about it before purchasing it.')}</Text>
          <Text style={s.infoDesc}>{t('wishlistScreen.line3', 'Get notification about out-of-stock items.')}</Text>
        </View>
        <View style={s.heartWrap}>
          <TouchableOpacity
            accessibilityLabel="Wishlist info heart"
            onPress={goShop}
            style={s.bigHeartBtn}
            onLayout={(e) => setHeartLayout(e.nativeEvent.layout)}
          >
            <Animated.View style={[heartScaleStyle, { opacity: visible }]}>
              <View style={{ width: 18, height: 18 }}>
                {/* Outline -> Filled */}
                <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', opacity: heartOutlineOpacity }]}>
                  <Ionicons name="heart-outline" size={18} color="#9ca3af" />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', opacity: heartFilledOpacity }]}>
                  <Ionicons name="heart" size={18} color="#111" />
                </Animated.View>
                {/* Tap ripple */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { alignItems: 'center', justifyContent: 'center', opacity: rippleOpacity, transform: [{ scale: rippleScale }] },
                  ]}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#111' }} />
                </Animated.View>
              </View>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.hand}
            onPress={goShop}
            accessibilityRole="button"
            accessibilityLabel="Tap hand to click heart"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
            onLayout={(e) => setHandLayout(e.nativeEvent.layout)}
          >
            <Animated.View style={[handAnimatedStyle, { opacity: visible }]}>
              <Text style={s.handImage}>👉</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.introBlock}>
  <Text style={s.introTitle}>{t('wishlistScreen.introTitle')}</Text>
  <Text style={s.introDesc}>{t('wishlistScreen.introDesc')}</Text>
      </View>
      <View style={s.sectionHeaderRow}>
        <View style={s.diamond} />
  <Text style={s.sectionTitle}>{t('wishlistScreen.youMayAlsoLike')}</Text>
        <View style={s.diamond} />
      </View>
      <View style={s.grid}>
        {recs.map((p, i) => {
          const img = resolveImageUrl((Array.isArray(p?.images) && p.images[0]) || p?.image);
          const price = Number(p?.price || 0);
          const original = typeof p?.originalPrice === 'number' ? Number(p.originalPrice) : undefined;
          const discount = original && original > price ? Math.round(((original - price) / original) * 100) : undefined;
          return (
            <View key={p._id || p.id || i} style={s.card}>
              {img ? (
                <Image source={{ uri: img }} style={s.cardImage} />
              ) : (
                <View style={[s.cardImage, { backgroundColor: '#f3f4f6' }]} />
              )}
              <TouchableOpacity
                onPress={() => addToCart({ productId: p._id || p.id, name: p.name, price, quantity: 1, image: img })}
                style={s.cardAdd}
                accessibilityLabel={t('common.addToCart')}
              >
                <Ionicons name="cart-outline" size={16} color="#111" />
              </TouchableOpacity>
              <View style={s.priceRow}>
                <Text style={s.priceText}>{formatPrice(price)}</Text>
                {typeof discount === 'number' ? (
                  <Text style={s.discountChip}>-{discount}%</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  const renderItem = ({ item }: any) => (
    <View style={s.row}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={s.rowImage} />
      ) : (
        <View style={[s.rowImage, { backgroundColor: '#f3f4f6' }]} />
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={s.rowTitle}>{item.name}</Text>
        <View style={s.rowMeta}>
          {item.color ? <Text style={s.metaText}>{t('common.color')}: {item.color}</Text> : null}
          {item.size ? <Text style={s.metaText}>{t('common.size')}: {item.size}</Text> : null}
        </View>
  <Text style={s.rowPrice}>{formatPrice(Number(item.price || 0))}</Text>
        <View style={s.rowActions}>
          <TouchableOpacity
            onPress={() => {
              addToCart({ productId: item.productId, name: item.name, price: item.price || 0, quantity: 1, color: item.color, size: item.size, image: item.image });
            }}
            style={[s.btn, s.btnPrimary, { flex: 1 }]}
          >
            <Text style={s.btnPrimaryText}>{t('common.addToCart')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeFromWishlist(item.productId, item.color, item.size)} style={[s.btn, s.btnGhost, { marginLeft: 8 }]}>
            <Text style={s.btnGhostText}>{t('wishlistScreen.remove')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const list = Array.isArray(wishlist) ? wishlist : [];

  return (
    <View style={s.container}>
  <View style={[s.header, { paddingTop: Math.max(12, insets.top + 24) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={20} color="#111" />
        </TouchableOpacity>
  <Text style={s.headerTitle}>{t('wishlistScreen.title', 'Wishlist')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={[s.headerBtn, { position: 'relative' }]}>
          <Ionicons name="cart-outline" size={20} color="#111" />
          {cartCount > 0 ? (
            <View style={s.badge}><Text style={s.badgeText}>{cartCount > 9 ? '9+' : String(cartCount)}</Text></View>
          ) : null}
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
        data={user ? list : []}
        keyExtractor={(it) => `${it.productId}-${it.color || 'nc'}-${it.size || 'ns'}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#eee' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  badge: { position: 'absolute', right: 2, top: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emptyTitle: { marginTop: 12, fontSize: 16, color: '#111' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { height: 44, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#111' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  btnGhostText: { color: '#111', fontWeight: '700' },
  infoBlock: { padding: 16, borderTopWidth: 1, borderColor: '#f0f0f0' },
  infoTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  infoDesc: { color: '#6b7280', marginBottom: 4 },
  bigHeartBtn: { padding: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 0 },
  heartWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hand: { marginLeft: 6, opacity: 0.95, marginTop: 4 },
  handImage: { width: 18, height: 18, resizeMode: 'contain' },
  introBlock: { paddingHorizontal: 16, paddingVertical: 10 },
  introTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  introDesc: { color: '#6b7280' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  diamond: { width: 6, height: 6, transform: [{ rotate: '45deg' }], backgroundColor: '#d1d5db', borderRadius: 1 },
  sectionTitle: { fontWeight: '800', color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingTop: 4 },
  card: { width: '31.5%', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f3f4f6' },
  cardAdd: { position: 'absolute', right: 6, bottom: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 8, gap: 6 },
  priceText: { fontSize: 12, fontWeight: '800', color: '#111' },
  discountChip: { fontSize: 11, fontWeight: '800', color: '#ef4444' },
  row: { flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, backgroundColor: '#fff' },
  rowImage: { width: 84, height: 84, borderRadius: 8 },
  rowTitle: { fontSize: 14, color: '#111', fontWeight: '700' },
  rowMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaText: { color: '#6b7280', fontSize: 12 },
  rowPrice: { marginTop: 6, fontSize: 14, fontWeight: '800', color: '#111' },
  rowActions: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
});
