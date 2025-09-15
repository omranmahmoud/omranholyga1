import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Alert, Image, ScrollView, Share, Pressable } from 'react-native';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp as StackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useWishlist } from '../context/WishlistContext';
import { loadStoredAddress } from '../storage/address';
import { formatPrice } from '../utils/format';
import { fetchProductById } from '../services/productService';
import { useTranslation } from 'react-i18next';

export default function CartScreen() {
  const { t } = useTranslation();
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const { token } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { addToWishlist } = useWishlist();
  const [checkingOut, setCheckingOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [managing, setManaging] = useState(false);
  const safeCart = Array.isArray(cart) ? cart : [];
  // Selection state keyed by item unique key
  const getKey = (item: any) => `${item.productId}-${item.color || 'noColor'}-${item.size || 'noSize'}`;
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Default: select all items when screen opens or cart populates and nothing selected yet
  useEffect(() => {
    if (safeCart.length > 0 && Object.keys(selected).length === 0) {
      const next: Record<string, boolean> = {};
      safeCart.forEach((it) => (next[getKey(it)] = true));
      setSelected(next);
    }
  }, [safeCart]);

  const selectedKeys = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const allSelected = safeCart.length > 0 && selectedKeys.length === safeCart.length;

  const selectedItems = selectedKeys.length
    ? safeCart.filter((it) => selected[getKey(it)])
    : safeCart;

  // Calculate totals using flashPrice when valid
  const { total, savings, flashOriginalTotal, anyFlash, soonestFlashEndsAt } = useMemo(() => {
    let running = 0;
    let savingsSum = 0;
    let flashOrig = 0;
    let hasFlash = false;
    let earliest: number | undefined = undefined;
    for (const item of selectedItems) {
      const hasValidFlash = typeof item.flashPrice === 'number' && typeof item.originalPrice === 'number' && item.originalPrice > item.flashPrice;
      const unitPrice = hasValidFlash ? (item.flashPrice as number) : item.price;
      running += (unitPrice || 0) * (item.quantity || 0);
      if (hasValidFlash) {
        hasFlash = true;
        const orig = item.originalPrice as number;
        const flash = item.flashPrice as number;
        savingsSum += (orig - flash) * (item.quantity || 0);
        flashOrig += orig * (item.quantity || 0);
        if (item.flashEndsAt) {
          const ts = new Date(item.flashEndsAt).getTime();
          if (!isNaN(ts)) {
            if (earliest === undefined || ts < earliest) earliest = ts;
          }
        }
      }
    }
    return { total: running, savings: savingsSum, flashOriginalTotal: flashOrig, anyFlash: hasFlash, soonestFlashEndsAt: earliest };
  }, [selectedItems]);
  const formattedTotal = useMemo(() => formatPrice(total), [total]);
  const totalQty = useMemo(() => selectedItems.reduce((s,i)=> s + i.quantity, 0), [selectedItems]);
  const formattedSavings = useMemo(() => savings > 0 ? formatPrice(savings) : null, [savings]);
  const overallFlashDiscountPct = useMemo(() => {
    if (!flashOriginalTotal || !savings) return null;
    return Math.round((savings / flashOriginalTotal) * 100);
  }, [flashOriginalTotal, savings]);
  const flashTimeLabel = useMemo(() => {
    if (!soonestFlashEndsAt) return null;
    const now = Date.now();
    const diffMs = soonestFlashEndsAt - now;
    if (diffMs <= 0) return null;
    const diffHrs = diffMs / 3600000;
    if (diffHrs <= 12) return 'Last 12 hours';
    if (diffHrs <= 24) return 'Last day';
    const days = Math.floor(diffHrs / 24);
    if (days >= 1) return `${days}d left`;
    return `${Math.ceil(diffHrs)}h left`;
  }, [soonestFlashEndsAt]);

  // Map of item key -> resolved image URL (fetched if missing)
  const [fetchedImages, setFetchedImages] = useState<Record<string,string>>({});

  // Helper to normalize relative URLs
  const resolveImageUrl = useCallback((src?: string) => {
    if (!src) return undefined;
    const s = src.trim(); if (!s) return undefined;
    if (/^https?:\/\//i.test(s)) return s;
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
  }, []);

  // Fetch images for any cart items lacking an image
  useEffect(() => {
    let cancelled = false;
    const toFetch = safeCart.filter(it => !it.image).map(it => ({ it, key: getKey(it) }))
      .filter(pair => !fetchedImages[pair.key]);
    if (!toFetch.length) return;
    (async () => {
      for (const { it, key } of toFetch) {
        try {
          const p = await fetchProductById(it.productId);
          if (cancelled || !p) continue;
            let imgs: string[] = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
            if (!imgs.length && Array.isArray(p.colors)) {
              for (const c of p.colors) {
                if (Array.isArray(c?.images) && c.images.length) { imgs = c.images.filter(Boolean); break; }
              }
            }
            if (imgs.length) {
              setFetchedImages(prev => ({ ...prev, [key]: resolveImageUrl(imgs[0]) || '' }));
            }
        } catch {/* ignore individual failures */}
      }
    })();
    return () => { cancelled = true; };
  }, [safeCart, fetchedImages, getKey, resolveImageUrl]);

  const handleCheckout = useCallback(async () => {
    if (checkingOut) return; // prevent double taps
    if (safeCart.length === 0) return;
    if (selectedKeys.length === 0) {
      Alert.alert(t('cart.selectItems'), t('cart.selectItemsMsg'));
      return;
    }
    if (!token) {
      navigation.navigate('Login');
      return;
    }
    setCheckingOut(true);
    try {
      const stored = await loadStoredAddress();
      const isComplete = !!(stored && (stored.firstName && stored.lastName && stored.phone && (stored.country || stored.countryCode) && stored.city && stored.line1));
      if (isComplete) {
        navigation.navigate('Checkout', { address: stored });
      } else {
        navigation.navigate('ShippingAddress');
      }
    } finally {
      setCheckingOut(false);
    }
  }, [checkingOut, safeCart.length, selectedKeys.length, token, navigation, t]);

  const handleShare = async () => {
    try {
      const list = (selectedItems.length ? selectedItems : safeCart)
        .map((i) => `${i.name} x${i.quantity}`)
        .join('\n');
  const message = `${t('cart.title')} (${selectedItems.length || safeCart.length}) - ${formattedTotal}\n\n${list}`;
      await Share.share({ message });
    } catch {}
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
  Alert.alert(t('cart.selectItems'), t('cart.selectItemsMsg'));
      return;
    }
    selectedItems.forEach((it) => removeFromCart(it.productId, it.color, it.size));
    setSelected({});
  };

  return (
    <View style={{ flex: 1, paddingTop: 40, backgroundColor: '#fff' }}>
      {/* Full-screen overlay to close menu when tapping outside */}
      {showMenu && (
        <Pressable
          onPress={() => setShowMenu(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
        />
      )}
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, position: 'relative' }}>
        {/* Top row: All | Title | Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Left: Select All */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {safeCart.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  if (allSelected) {
                    setSelected({});
                  } else {
                    const next: Record<string, boolean> = {};
                    safeCart.forEach((it) => (next[getKey(it)] = true));
                    setSelected(next);
                  }
                }}
                style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: allSelected ? '#111827' : 'transparent' }}
              >
                {allSelected ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}
              </TouchableOpacity>
            )}
            {safeCart.length > 0 && <Text style={{ fontWeight: '600' }}>{t('cart.all')}</Text>}
          </View>

          {/* Middle: Title */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              {t('cart.title')}
              {safeCart.length ? (
                <Text style={{ fontSize: 14, fontWeight: '400', color: '#6b7280' }}>{` (${safeCart.length})`}</Text>
              ) : null}
            </Text>
          </View>

          {/* Right: Actions */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            {managing ? (
              <TouchableOpacity
                onPress={() => {
                  setManaging(false);
                  const next: Record<string, boolean> = {};
                  safeCart.forEach((it) => (next[getKey(it)] = true));
                  setSelected(next);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 16, color: '#111827', fontWeight: '600' }}>{t('cart.done')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowMenu((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: 16 }}
                >
                  <Text style={{ fontSize: 22, color: '#6b7280' }}>…</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: 22, color: '#6b7280' }}>×</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Drop-down menu below ellipsis */}
        {showMenu && (
          <>
            <View style={{ position: 'absolute', right: 8, top: 28, zIndex: 10 }}>
              {/* Triangle */}
              <View style={{ alignSelf: 'flex-end', width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff', marginRight: 12 }} />
              <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 8, minWidth: 160, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <TouchableOpacity onPress={() => { setShowMenu(false); handleShare(); }} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#111827' }}>{t('common.share', { defaultValue: 'Share' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowMenu(false); setManaging(true); }} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#111827' }}>{t('cart.manage')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
  <Text style={{ color: '#6b7280', marginTop: 2, textAlign: 'center' }}>{t('cart.shipTo', { country: 'Palestine' })}</Text>
      </View>

  {/* Select All row removed; now integrated in header */}

      {/* Sign-in banner when not logged in */}
      {!token && (
        <View style={{ backgroundColor: '#eef2ff', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#374151' }}>{t('cart.signInSync')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('profile.signIn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {safeCart.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text>{t('cart.empty')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            data={safeCart}
            keyExtractor={(item) => `${item.productId}-${item.color || 'noColor'}-${item.size || 'noSize'}`}
            ListFooterComponent={
              !managing ? (
                <View>
                  {/* Suggestions */}
                  <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 }}>
                    {t('cart.youMightLike')}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[1, 2, 3, 4].map((i) => (
                      <Image
                        key={i}
                        source={{ uri: 'https://via.placeholder.com/160x200.png?text=Product' }}
                        style={{ width: 160, height: 200, borderRadius: 10, marginRight: 12, backgroundColor: '#f3f4f6' }}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const key = getKey(item);
              const isSelected = !!selected[key];
              // Determine image to show (priority: item.image -> fetchedImages)
              const displayImg = resolveImageUrl(item.image) || fetchedImages[key];
              return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10 }}>
                {/* Item selection checkbox */}
                <TouchableOpacity
                  onPress={() => setSelected((prev) => ({ ...prev, [key]: !prev[key] }))}
                  style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: isSelected ? '#111827' : 'transparent' }}
                >
                  {isSelected ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}
                </TouchableOpacity>
                {displayImg ? (
                  <Image source={{ uri: displayImg }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 10 }} />
                ) : (
                  <View style={{ width:64, height:64, borderRadius:8, backgroundColor:'#f3f4f6', marginRight:10, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:10, color:'#9ca3af' }}>IMG</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                  {item.color ? <Text style={{ color: '#6b7280' }}>{t('common.color')}: {item.color}</Text> : null}
                  {item.size ? <Text style={{ color: '#6b7280' }}>{t('common.size')}: {item.size}</Text> : null}
                  {/* Flash sale pricing block */}
                  {item.flashPrice && item.originalPrice && item.originalPrice > item.flashPrice ? (
                    <View style={{ marginTop:8 }}>
                      <Text style={{ fontSize:12, color:'#C2410C', fontWeight:'600' }}>Flash Sale <Text style={{ fontSize:18, fontWeight:'700', color:'#C2410C' }}>{formatPrice(item.flashPrice * item.quantity)}</Text> <Text style={{ textDecorationLine:'line-through', color:'#9ca3af', fontSize:14 }}>{formatPrice(item.originalPrice * item.quantity)}</Text></Text>
                      <View style={{ flexDirection:'row', marginTop:6 }}>
                        <View style={{ backgroundColor:'#FEE2E2', paddingHorizontal:8, paddingVertical:4, borderRadius:6, marginRight:6 }}>
                          <Text style={{ color:'#DC2626', fontSize:12, fontWeight:'700' }}>-{Math.round(((item.originalPrice - item.flashPrice)/item.originalPrice)*100)}%</Text>
                        </View>
                        <View style={{ backgroundColor:'#FFF1C2', paddingHorizontal:8, paddingVertical:4, borderRadius:6 }}>
                          <Text style={{ color:'#B45309', fontSize:12, fontWeight:'600' }}>Last day</Text>
                        </View>
                      </View>
                    </View>
                  ) : null}
                  {/* Footer row: price left (fallback) + controls */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: item.flashPrice && item.originalPrice && item.originalPrice > item.flashPrice ? 10 : 8, justifyContent: 'space-between' }}>
                    <View style={{ alignItems:'flex-start' }}>
                      <Text style={{ fontSize: 18, fontWeight: '700' }}>{formatPrice((item.flashPrice ?? item.price) * item.quantity)}</Text>
                      {item.quantity > 1 && (
                        <Text style={{ fontSize:11, color:'#6b7280', fontWeight:'500' }}>{formatPrice(item.flashPrice ?? item.price)} ea</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: managing ? 0.4 : 1 }}>
                      {/* Trash button */}
                      <TouchableOpacity
                        disabled={managing}
                        onPress={() => removeFromCart(item.productId, item.color, item.size)}
                        style={{ width: 36, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
                      >
                        <Text style={{ color: '#9ca3af' }}>🗑️</Text>
                      </TouchableOpacity>
                      {/* Quantity group */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' }}>
                        <TouchableOpacity
                          disabled={managing || item.quantity <= 1}
                          onPress={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.color, item.size)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                          <Text style={{ color: (managing || item.quantity <= 1) ? '#d1d5db' : '#111827', fontSize: 16 }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ paddingHorizontal: 10, color: '#9ca3af' }}>{item.quantity}</Text>
                        <TouchableOpacity
                          disabled={managing}
                          onPress={() => updateQuantity(item.productId, item.quantity + 1, item.color, item.size)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                          <Text style={{ color: managing ? '#d1d5db' : '#111827', fontSize: 16 }}>＋</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              );
            }}
          />

          {/* Bottom checkout bar */}
          <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, paddingVertical: 16, paddingLeft: 8, paddingRight: 16, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' }}>
            {managing ? (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  disabled={selectedKeys.length === 0}
                  onPress={() => {
                    const items = selectedKeys.length ? selectedItems : [];
                    items.forEach((it) =>
                      addToWishlist({ productId: it.productId, name: it.name, price: it.price, image: it.image, color: it.color, size: it.size })
                    );
                    items.forEach((it) => removeFromCart(it.productId, it.color, it.size));
                    setSelected({});
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#111827', borderRadius: 8, marginRight: 12, opacity: selectedKeys.length === 0 ? 0.5 : 1 }}
                >
                  <Text style={{ color: '#111827', fontWeight: '600' }}>{t('cart.moveToWishlist')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={selectedKeys.length === 0}
                  onPress={handleDeleteSelected}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#111827', borderRadius: 8, opacity: selectedKeys.length === 0 ? 0.5 : 1 }}
                >
                  <Text style={{ color: '#111827', fontWeight: '600' }}>{t('cart.delete')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Total & savings */}
                  <View style={{ flexShrink:1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: anyFlash ? '#EA580C' : '#111827' }}>
                      {formattedTotal}
                      <Text style={{ fontSize:12, fontWeight:'500', color:'#6b7280' }}> ({totalQty} {totalQty===1 ? t('common.item','item') : t('common.items','items')})</Text>
                      {formattedSavings ? <Text style={{ fontSize:14, fontWeight:'600', color:'#6b7280' }}>  Saved {formattedSavings}</Text> : null}
                    </Text>
                    {anyFlash && (overallFlashDiscountPct || flashTimeLabel) ? (
                      <Text style={{ marginTop:4, fontSize:12, color:'#EA580C', fontWeight:'600' }}>🕒 {overallFlashDiscountPct ? `-${overallFlashDiscountPct}%` : ''}{overallFlashDiscountPct && flashTimeLabel ? ' | ' : ''}{flashTimeLabel || ''}</Text>
                    ) : null}
                  </View>
                  {/* Flash aware checkout button */}
                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={checkingOut || selectedKeys.length === 0}
                    style={{ flex: 1, marginLeft: 16, backgroundColor: '#111827', paddingVertical: anyFlash ? 10 : 14, borderRadius: 8, alignItems: 'center', justifyContent:'center', opacity: checkingOut || selectedKeys.length === 0 ? 0.55 : 1 }}
                  >
                    {anyFlash ? (
                      <View style={{ alignItems:'center' }}>
                        <Text style={{ color:'#fff', fontWeight:'800', fontSize:18 }}>
                          {t('cart.checkout')}({selectedItems.length})
                        </Text>
                        <Text style={{ color:'#fff', fontWeight:'600', fontSize:14, marginTop:2 }}>
                          ⚡ {checkingOut ? t('common.processing', { defaultValue: 'Processing...' }) : 'Flash Sale Now!'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                        {checkingOut ? t('common.processing', { defaultValue: 'Processing...' }) : `${t('cart.checkout')}(${selectedItems.length})`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}
