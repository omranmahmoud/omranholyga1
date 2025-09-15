import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, I18nManager, ActivityIndicator, Platform, Modal, TextInput, Alert, Image } from 'react-native';
import axios from 'axios';
import { resolveApiBase } from '../utils/apiBase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/format';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { validateCoupon, applyCouponUsage, checkGiftCardBalance, applyGiftCard } from '../services/discounts';
import type { RootStackParamList } from '../types/navigation';

// Enhanced checkout summary screen
export default function CheckoutScreen() {
  const { cart, clearCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Checkout'>>();
  const address = route?.params?.address;
  const isRTL = I18nManager.isRTL;
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [showMore, setShowMore] = useState(false);
  const [couponModal, setCouponModal] = useState(false);
  const [giftModal, setGiftModal] = useState(false);
  const [couponTab, setCouponTab] = useState<'available' | 'unavailable'>('available');
  const [couponCode, setCouponCode] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [giftLoading, setGiftLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [giftAppliedAmount, setGiftAppliedAmount] = useState<number>(0);
  const [giftBalance, setGiftBalance] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{ id?: string } | null>(null);
  // Lists for coupon classification
  const [availableCoupons, setAvailableCoupons] = useState<{ code:string; discount:number }[]>([]);
  const [unavailableCoupons, setUnavailableCoupons] = useState<string[]>([]);

  // Calculate original (non-discounted) and effective subtotal (flash applied)
  const { subtotalOriginal, subtotal, flashSavings, anyFlash, earliestEndsAt } = useMemo(() => {
    let original = 0; let effective = 0; let flashSave = 0; let earliest: number | undefined = undefined; let hasFlash = false;
    for (const it of cart) {
      const qty = it.quantity || 0;
      const hasValidFlash = typeof it.originalPrice === 'number' && typeof it.flashPrice === 'number' && it.originalPrice > it.flashPrice;
      const originalUnit = hasValidFlash ? (it.originalPrice as number) : it.price;
      const effectiveUnit = hasValidFlash ? (it.flashPrice as number) : it.price;
      original += (originalUnit || 0) * qty;
      effective += (effectiveUnit || 0) * qty;
      if (hasValidFlash) {
        hasFlash = true;
        flashSave += (originalUnit - effectiveUnit) * qty;
        if (it.flashEndsAt) {
          const ts = new Date(it.flashEndsAt).getTime();
          if (!isNaN(ts) && (earliest === undefined || ts < earliest)) earliest = ts;
        }
      }
    }
    return { subtotalOriginal: original, subtotal: effective, flashSavings: flashSave, anyFlash: hasFlash, earliestEndsAt: earliest };
  }, [cart]);

  const shipping = 13.50; // placeholder static shipping
  const shippingGuarantee = 0.99; // optional guarantee toggle in future
  // Promotions now include flash savings + coupon discounts (and are displayed as a negative value)
  const promotions = -((couponDiscount || 0) + (flashSavings || 0));
  const baseBeforeGift = subtotal + promotions; // subtotal already includes flash discounts; promotions subtract coupon & flash from original
  const total = Math.max(0, baseBeforeGift - giftAppliedAmount);
  const rewardPoints = Math.round(subtotal * 0.8); // reward based on effective spend

  const [flashCountdown, setFlashCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!earliestEndsAt) { setFlashCountdown(null); return; }
    const tick = () => {
      const diff = earliestEndsAt - Date.now();
      if (diff <= 0) { setFlashCountdown('00:00:00'); return; }
      const h = Math.floor(diff/3600000).toString().padStart(2,'0');
      const m = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
      const s = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
      setFlashCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [earliestEndsAt]);

  // Try loading LinearGradient if available (optional dependency)
  const LinearGradientComp = useMemo(() => {
    try { return require('expo-linear-gradient').LinearGradient; } catch { return null; }
  }, []);

  // Resolve API base (allow EXPO_PUBLIC_API_URL override). For real devices use your LAN IP (e.g. http://192.168.1.50:5000)
  const apiBase = resolveApiBase();
  const mapAddressToServer = (addr:any) => addr ? ({
    street: addr.line1 || addr.line2 || 'N/A',
    city: addr.city || 'City',
    country: addr.countryCode || 'US'
  }) : { street:'N/A', city:'City', country:'US' };

  const placeOrder = async () => {
    if (!cart.length) return;
  const orderPayload = {
      items: cart.map(it => ({ product: it.productId, quantity: it.quantity, size: it.size })),
      shippingAddress: mapAddressToServer(address),
      paymentMethod,
      customerInfo: {
    firstName: address?.firstName || (user?.name?.split(' ')[0]) || 'Guest',
    lastName: address?.lastName || (user?.name?.split(' ').slice(1).join(' ') || 'User'),
    email: address?.email || user?.email || 'guest@example.com',
    mobile: address?.phone || user?.mobile || '+100000000000'
      },
      currency: 'USD'
    };
    if (paymentMethod === 'card') {
      const orderNumber = 'TMP' + Date.now().toString().slice(-8);
      navigation.navigate('Payment', {
        summary: { subtotal, shipping, shippingGuarantee, promotions, total, couponDiscount, giftAppliedAmount },
        address,
        orderNumber,
        draftOrder: orderPayload
      });
      return;
    }
    setPlacing(true);
    try {
  const res = await axios.post(apiBase + '/api/orders', orderPayload, { timeout:10000 });
  setPlacing(false);
  clearCart();
  setOrderSuccess({ id: res.data?.order?._id });
    } catch (e:any) {
      setPlacing(false);
      // Enhanced diagnostics
      let detail = 'Unknown error';
      if (e?.response) {
        detail = `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}`;
      } else if (e?.request) {
        detail = 'No response (network / CORS / server down)';
      } else if (e?.message) {
        detail = e.message;
      }
      console.warn('Order create failed', detail);
      Alert.alert('Order Failed', detail);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Modal */}
      {orderSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <TouchableOpacity style={styles.successClose} onPress={() => { setOrderSuccess(null); navigation.navigate('Home'); }}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" style={{ marginBottom:12 }} />
            <Text style={{ fontSize:20, fontWeight:'800', color:'#111', marginBottom:4 }}>{t('checkout.orderPlaced', { defaultValue: 'Order Placed!' })}</Text>
            <Text style={{ fontSize:14, color:'#374151', textAlign:'center', marginBottom:20 }}>
              {t('checkout.orderSuccessMsg', { defaultValue: 'Your order was placed successfully.' })}
            </Text>
            <TouchableOpacity style={styles.viewOrderBtn} onPress={() => {
              const id = orderSuccess.id; 
              setOrderSuccess(null); 
              if (id) {
                navigation.navigate('OrderDetails', { orderId: id });
              } else {
                navigation.navigate('OrderHistory');
              }
            }}>
              <Text style={styles.viewOrderText}>{t('checkout.viewOrder', { defaultValue: 'View Order' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successHomeBtn} onPress={() => { setOrderSuccess(null); navigation.navigate('Home'); }}>
              <Text style={styles.successHomeText}>{t('common.close', { defaultValue: 'Close' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel={t('common.close')}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#111" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]} numberOfLines={1}>{t('checkout.shippingAddress')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
  {/* Address summary card (top) */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ShippingAddress')}
          activeOpacity={0.8}
          style={{
            marginHorizontal:16,
            marginTop:12,
            marginBottom:8,
            backgroundColor:'#fff',
            borderWidth:1,
            borderColor:'#e5e7eb',
            borderRadius:14,
            padding:14,
            shadowColor:'#000',
            shadowOpacity:0.05,
            shadowRadius:6,
            shadowOffset:{width:0,height:2},
            elevation:2
          }}
        >
          <View style={{ flexDirection:'row', alignItems:'flex-start' }}>
            <Ionicons name="location" size={20} color="#111" style={{ marginTop:2, marginRight:12 }} />
            <View style={{ flex:1 }}>
              {address ? (
                <>
                  <Text style={{ fontSize:15, fontWeight:'700', color:'#111' }} numberOfLines={1}>
                    {(address.firstName || '') + (address.lastName ? ' ' + address.lastName : '')}
                    {address.phone ? '  ' : ''}
                    {address.phone ? <Text style={{ fontSize:13, fontWeight:'500', color:'#6b7280' }}>{address.phone}</Text> : null}
                  </Text>
                  {/* Address lines */}
                  {!!address.line1 && (
                    <Text style={{ marginTop:4, fontSize:14, color:'#111' }} numberOfLines={1}>
                      {address.line1}{address.line2 ? ' ' + address.line2 : ''}
                    </Text>
                  )}
                  <Text style={{ marginTop:4, fontSize:13, color:'#374151' }} numberOfLines={2}>
                    {[address.city, address.state, address.countryCode || address.countryCode, address.zip].filter(Boolean).join(' ')}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize:14, fontWeight:'600', color:'#111' }}>{t('checkout.addShippingAddress', { defaultValue:'Add shipping address' })}</Text>
              )}
            </View>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#6b7280" />
          </View>
          {/* Striped bar (decorative) */}
          <View style={{ flexDirection:'row', marginTop:12, height:6, borderRadius:3, overflow:'hidden' }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View
                key={i}
                style={{ flex:1, backgroundColor: i % 3 === 0 ? '#2563eb' : i % 3 === 1 ? '#f97316' : '#94a3b8' }}
              />
            ))}
          </View>
        </TouchableOpacity>

        {/* Order items preview card */}
        {cart.length > 0 && (
          <View
            style={{
              marginHorizontal:16,
              marginBottom:12,
              backgroundColor:'#fff',
              borderWidth:1,
              borderColor:'#e5e7eb',
              borderRadius:14,
              padding:0,
              shadowColor:'#000',
              shadowOpacity:0.04,
              shadowRadius:4,
              shadowOffset:{width:0,height:2},
              elevation:2
            }}
          >
            {/* Header Row (tap navigates to cart) */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.8}
              style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingTop:14, paddingBottom:anyFlash?0:10 }}
            >
              <Text style={{ fontSize: anyFlash ? 18 : 13, fontWeight:'800', color:'#111' }}>
                {t('checkout.orderItems', { defaultValue:'Order items' })}({cart.length})
              </Text>
              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color="#111" />
            </TouchableOpacity>
            {anyFlash && (
              LinearGradientComp ? (
                <LinearGradientComp colors={['#f97316','#fb923c']} start={{x:0,y:0}} end={{x:1,y:0}} style={{ marginTop:8, marginHorizontal:0, borderTopLeftRadius:14, borderTopRightRadius:14, paddingHorizontal:14, paddingVertical:8 }}>
                  <View style={{ flexDirection:'row', alignItems:'center' }}>
                    <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>{t('checkout.savedToday',{ defaultValue:'Saved'})} {formatPrice(flashSavings)} {t('checkout.todayLabel',{ defaultValue:'Today!' })}</Text>
                    <View style={{ width:1, height:16, backgroundColor:'rgba(255,255,255,0.35)', marginHorizontal:10 }} />
                    <View style={{ flex:1, flexDirection:'row', alignItems:'center' }}>
                      <View style={{ flex:1, height:8, backgroundColor:'rgba(255,255,255,0.28)', borderRadius:4, overflow:'hidden', marginRight:6 }}>
                        <View style={{ width: flashCountdown && flashCountdown!=='00:00:00' ? '55%' : '0%', backgroundColor:'#fff', flex:1 }} />
                      </View>
                      <Ionicons name='time-outline' size={16} color='#fff' style={{ marginRight:3 }} />
                      <Text style={{ fontSize:12, fontWeight:'700', color:'#fff' }}>{flashCountdown || '--:--:--'}</Text>
                    </View>
                  </View>
                </LinearGradientComp>
              ) : (
                <View style={{ backgroundColor:'#f97316', marginTop:8, paddingHorizontal:14, paddingVertical:8, borderTopLeftRadius:14, borderTopRightRadius:14 }}>
                  <Text style={{ fontSize:14, fontWeight:'800', color:'#fff' }}>{t('checkout.savedToday',{ defaultValue:'Saved'})} {formatPrice(flashSavings)} {t('checkout.todayLabel',{ defaultValue:'Today!' })}  {flashCountdown || ''}</Text>
                </View>
              )
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:14, paddingTop:anyFlash?12:0, paddingBottom:14 }}>
              {cart.map((it, idx) => {
                const hasFlash = typeof it.flashPrice === 'number' && typeof it.originalPrice === 'number' && it.originalPrice > it.flashPrice;
                const unit = hasFlash ? (it.flashPrice as number) : it.price;
                return (
                  <View key={idx} style={{ width: anyFlash?140:104, marginRight:12 }}>
                    <View style={{ width:'100%', height:anyFlash?140:104, borderRadius:8, backgroundColor:'#f3f4f6', overflow:'hidden', marginBottom:6 }}>
                      {it.image ? (
                        <Image source={{ uri: it.image }} style={{ width:'100%', height:'100%' }} resizeMode='cover' />
                      ) : (
                        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text style={{ color:'#9ca3af', fontSize:12 }}>IMG</Text></View>
                      )}
                      {hasFlash && flashCountdown && (
                        <View style={{ position:'absolute', left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.55)', flexDirection:'row', alignItems:'center', paddingHorizontal:6, paddingVertical:4 }}>
                          <Text style={{ color:'#facc15', fontSize:12, fontWeight:'800', marginRight:6 }}>⚡</Text>
                          <Text style={{ color:'#fff', fontSize:12, fontWeight:'600' }}>{flashCountdown}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:4 }}>
                      <Text style={{ fontSize:anyFlash?15:13, fontWeight:'800', color:'#EA580C', marginRight:4 }}>{formatPrice(unit || 0)}</Text>
                      {hasFlash && (
                        <>
                          <View style={{ borderWidth:1, borderColor:'#f97316', paddingHorizontal:6, paddingVertical:2, borderRadius:5, marginRight:4 }}>
                            <Text style={{ fontSize: anyFlash?12:13, fontWeight:'700', color:'#f97316' }}>-{Math.round((((it.originalPrice as number) - (it.flashPrice as number))/(it.originalPrice as number))*100)}%</Text>
                          </View>
                          {anyFlash && <Text style={{ fontSize:12, color:'#9ca3af', textDecorationLine:'line-through' }}>{formatPrice((it.originalPrice as number) || 0)}</Text>}
                        </>
                      )}
                    </View>
                    <View style={{ flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, overflow:'hidden', height:anyFlash?40:34 }}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(it.productId, Math.max(1, (it.quantity||1)-1), it.color, it.size)}
                        disabled={(it.quantity||1) <= 1}
                        style={{ width:anyFlash?40:32, height:'100%', alignItems:'center', justifyContent:'center', backgroundColor:'#fafafa' }}>
                        <Text style={{ fontSize:anyFlash?18:17, fontWeight:'600', color:(it.quantity||1) <= 1 ? '#d1d5db' : '#111' }}>−</Text>
                      </TouchableOpacity>
                      <View style={{ width:anyFlash?40:32, height:'100%', alignItems:'center', justifyContent:'center', borderLeftWidth:1, borderRightWidth:1, borderColor:'#e5e7eb' }}>
                        <Text style={{ fontSize:anyFlash?16:13, fontWeight:'700', color:'#111' }}>{it.quantity}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => updateQuantity(it.productId, (it.quantity||1)+1, it.color, it.size)}
                        style={{ width:anyFlash?40:32, height:'100%', alignItems:'center', justifyContent:'center', backgroundColor:'#fafafa' }}>
                        <Text style={{ fontSize:anyFlash?18:17, fontWeight:'600', color:'#111' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        {/* Payment Method */}
        <Section>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('checkout.paymentMethod')}</Text>
          <Text style={styles.secureText}>{t('checkout.paymentSecure')}</Text>
          <TouchableOpacity onPress={() => setPaymentMethod('card')} style={[styles.payOption, paymentMethod==='card' && styles.payOptionActive, isRTL && styles.payOptionRTL]}>
            <View style={[styles.payIconWrap, paymentMethod==='card' && styles.payIconWrapActive]}>
              <Ionicons name="card" size={18} color={paymentMethod==='card' ? '#fff' : '#111'} />
            </View>
            <Text style={[styles.payLabel, isRTL && styles.textRTL]}>{t('checkout.creditDebitCard')}</Text>
            <Ionicons name={paymentMethod==='card' ? 'radio-button-on' : 'radio-button-off'} size={20} color={paymentMethod==='card' ? '#111' : '#9ca3af'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod('cod')} style={[styles.payOption, paymentMethod==='cod' && styles.payOptionActive, isRTL && styles.payOptionRTL]}>
            <View style={[styles.payIconWrap, paymentMethod==='cod' && styles.payIconWrapActive]}>
              <Ionicons name="cash-outline" size={18} color={paymentMethod==='cod' ? '#fff' : '#111'} />
            </View>
            <Text style={[styles.payLabel, isRTL && styles.textRTL]}>{t('checkout.cashOnDelivery')}</Text>
            <Ionicons name={paymentMethod==='cod' ? 'radio-button-on' : 'radio-button-off'} size={20} color={paymentMethod==='cod' ? '#111' : '#9ca3af'} />
          </TouchableOpacity>
          <Text style={styles.paymentHint}>{address?.countryCode === 'EG' && paymentMethod==='card' ? 'Egypt only supports credit cards in EGP currency.' : ''}</Text>
        </Section>

        {/* Apply Coupon */}
  <RowNav label={couponDiscount ? `${t('checkout.discountApplied')} (-${formatPrice(couponDiscount)})` : t('checkout.applyCoupon')} onPress={() => setCouponModal(true)} isRTL={isRTL} />
  <RowNav label={giftAppliedAmount ? `${t('checkout.giftApplied')} (-${formatPrice(giftAppliedAmount)})` : t('checkout.giftCard')} onPress={() => setGiftModal(true)} isRTL={isRTL} />
        <TouchableOpacity onPress={() => setShowMore(s => !s)} style={styles.viewMoreBtn}>
          <Text style={styles.viewMoreText}>{showMore ? t('checkout.viewLess') : t('checkout.viewMore')}</Text>
        </TouchableOpacity>

        {/* Totals */}
        <Section>
          <SummaryRow label={t('checkout.retailPrice')} value={anyFlash ? `${formatPrice(subtotal)} / ${formatPrice(subtotalOriginal)}` : formatPrice(subtotal)} isRTL={isRTL} />
          {/* Shipping fee & shipping guarantee rows removed per request */}
          <SummaryRow label={t('checkout.promotions')} value={formatPrice(promotions)} highlight={promotions!==0} isRTL={isRTL} />
          {giftAppliedAmount>0 && <SummaryRow label={t('checkout.giftCard')} value={`-${formatPrice(giftAppliedAmount)}`} highlight isRTL={isRTL} />}
          <View style={styles.divider} />
          <SummaryRow label={t('checkout.orderTotal')} value={formatPrice(total)} bold isRTL={isRTL} />
          {(promotions!==0 || flashSavings>0) && <Text style={styles.savedText}>{t('checkout.saved', { amount: formatPrice(Math.abs(promotions)) })}</Text>}
        </Section>

        <Section>
          <Text style={styles.rewardText}>{t('checkout.rewardPoints', { points: rewardPoints })}</Text>
        </Section>

        {/* Safety */}
        <Section>
          <Text style={styles.sectionTitle}>{t('checkout.shopSafely')}</Text>
          <View style={styles.safeGrid}>
            <SafeItem icon="cube-outline" text={t('checkout.secureDelivery')} />
            <SafeItem icon="shield-checkmark-outline" text={t('checkout.securePayment')} />
            <SafeItem icon="lock-closed-outline" text={t('checkout.securityTitle')} />
            <SafeItem icon="headset-outline" text={t('checkout.customerSupport')} />
          </View>
        </Section>
      </ScrollView>
      {cart.length > 0 && (
        <View style={[styles.footer, isRTL && styles.footerRTL]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalFooter}>{formatPrice(total)}</Text>
            <Text style={styles.itemsLeft}>{t('checkout.onlyLeft', { count: cart.reduce((n,i)=> n + (i.quantity||0),0) })}</Text>
          </View>
          <TouchableOpacity disabled={placing} onPress={placeOrder} style={[styles.placeBtn, placing && { opacity: 0.5 }]}>
            {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>{t('checkout.placeOrder')}</Text>}
          </TouchableOpacity>
        </View>
      )}
      {/* Coupon Modal bottom sheet */}
      <Modal visible={couponModal} transparent animationType="fade" onRequestClose={() => setCouponModal(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={()=>setCouponModal(false)} />
          <View style={[styles.couponSheet, isRTL && { direction:'rtl' }]}> 
            <View style={styles.sheetHandle} />
            <View style={styles.couponHeaderRow}>
              <Text style={[styles.modalTitle, { flex:1 }]} numberOfLines={1}>{t('checkout.myCoupons')}</Text>
              <TouchableOpacity onPress={()=>setCouponModal(false)} style={styles.closeX}><Ionicons name="close" size={22} color="#111" /></TouchableOpacity>
            </View>
            {/* Tabs */}
            <View style={[styles.couponTabs, isRTL && { flexDirection:'row-reverse' }]}> 
              <TouchableOpacity onPress={()=>setCouponTab('available')} style={styles.couponTabBtn}>
                <Text style={[styles.couponTabText, couponTab==='available' && styles.couponTabTextActive]}>{t('checkout.availableCoupons')}</Text>
                {couponTab==='available' && <View style={styles.couponTabUnderline} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setCouponTab('unavailable')} style={styles.couponTabBtn}>
                <Text style={[styles.couponTabText, couponTab==='unavailable' && styles.couponTabTextActive]}>{t('checkout.unavailableCoupons')}</Text>
                {couponTab==='unavailable' && <View style={styles.couponTabUnderline} />}
              </TouchableOpacity>
            </View>
            {/* Notice bar */}
            <View style={styles.couponNoticeRow}>
              <Ionicons name="lock-closed-outline" size={14} color="#92400e" style={{ marginHorizontal:8 }} />
              <Text style={styles.couponNoticeText} numberOfLines={1}>{t('checkout.onlyOneCoupon')}</Text>
              <Ionicons name="close" size={16} color="#92400e" style={{ opacity:0.6, marginHorizontal:8 }} />
            </View>
            {/* Input row */}
            <View style={[styles.couponInputRow, isRTL && { flexDirection:'row-reverse' }]}> 
              <TextInput
                placeholder={t('checkout.applyCoupon')}
                placeholderTextColor="#9ca3af"
                value={couponCode}
                onChangeText={setCouponCode}
                style={[styles.couponInput, isRTL && { textAlign:'right' }]}
                autoCapitalize="characters"
              />
              <TouchableOpacity disabled={couponLoading || !couponCode} onPress={async () => {
                if (!couponCode) return; setCouponLoading(true); setCouponError(null);
                try {
                  const v = await validateCoupon(couponCode, subtotal + shipping);
                  setCouponDiscount(v.discount);
                  setAvailableCoupons(prev => {
                    const codeU = couponCode.toUpperCase();
                    if (prev.some(c=>c.code===codeU)) return prev;
                    return [...prev, { code: codeU, discount: v.discount }];
                  });
                  await applyCouponUsage(couponCode);
                  setCouponModal(false);
                }
                catch(e:any){
                  const codeU = couponCode.toUpperCase();
                  setUnavailableCoupons(prev => prev.includes(codeU) ? prev : [...prev, codeU]);
                  setCouponError(e.message || t('checkout.invalidCoupon'));
                } finally { setCouponLoading(false); }
              }} style={[styles.couponApplyBtn, (!couponCode||couponLoading) && { opacity:0.4 }]}>
                {couponLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.couponApplyBtnText}>{t('checkout.apply')}</Text>}
              </TouchableOpacity>
            </View>
            {couponError && <Text style={styles.errorTextSmall}>{couponError}</Text>}
            {couponDiscount>0 && (
              <TouchableOpacity onPress={() => { setCouponDiscount(0); setCouponCode(''); }} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>{t('checkout.remove')}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.couponContent}> 
              {couponTab==='available' ? (
                availableCoupons.length ? (
                  <View style={{ width:'100%', paddingHorizontal:16 }}>
                    {availableCoupons.map(c => (
                      <View key={c.code} style={styles.couponItem}> 
                        <View style={{ flex:1 }}>
                          <Text style={styles.couponCode}>{c.code}</Text>
                          <Text style={styles.couponDiscount}>{`- ${formatPrice(c.discount)}`}</Text>
                        </View>
                        {couponDiscount>0 && c.code===couponCode.toUpperCase() && (
                          <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <>
                    <View style={styles.emptyIllustration}><Ionicons name="cube-outline" size={40} color="#6b7280" /></View>
                    <Text style={styles.emptyText}>{t('checkout.emptyCoupons')}</Text>
                  </>
                )
              ) : (
                unavailableCoupons.length ? (
                  <View style={{ width:'100%', paddingHorizontal:16 }}>
                    {unavailableCoupons.map(code => (
                      <View key={code} style={[styles.couponItem, { opacity:0.6 }]}> 
                        <View style={{ flex:1 }}>
                          <Text style={styles.couponCode}>{code}</Text>
                          <Text style={[styles.couponDiscount, { color:'#dc2626' }]}>{t('checkout.invalidCoupon')}</Text>
                        </View>
                        <Ionicons name="close-circle" size={22} color="#dc2626" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <>
                    <View style={styles.emptyIllustration}><Ionicons name="cube-outline" size={40} color="#6b7280" /></View>
                    <Text style={styles.emptyText}>{t('checkout.emptyCoupons')}</Text>
                  </>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>
      {/* Gift Card Bottom Sheet */}
      <Modal visible={giftModal} transparent animationType="fade" onRequestClose={() => setGiftModal(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={()=>setGiftModal(false)} />
          <View style={styles.giftSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.couponHeaderRow}>
              <Text style={[styles.modalTitle, { flex:1 }]} numberOfLines={1}>{t('checkout.giftCard')}</Text>
              <TouchableOpacity onPress={()=>setGiftModal(false)} style={styles.closeX}><Ionicons name="close" size={22} color="#111" /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput placeholder={t('checkout.giftCardCode')} value={giftCode} onChangeText={setGiftCode} style={styles.modalInput} autoCapitalize="none" />
              {giftBalance!=null && <Text style={styles.balanceText}>{t('checkout.giftBalance', { balance: formatPrice(giftBalance) })}</Text>}
              {giftError && <Text style={styles.errorTextSmall}>{giftError}</Text>}
              <View style={{ flexDirection:'row', gap:12, marginTop:12 }}>
                <TouchableOpacity disabled={giftLoading || !giftCode} onPress={async () => {
                  setGiftLoading(true); setGiftError(null);
                  try {
                    const info = await checkGiftCardBalance(giftCode);
                    setGiftBalance(info.balance);
                  } catch(e:any){ setGiftError(e.message); } finally { setGiftLoading(false); }
                }} style={[styles.secondaryBtn, (!giftCode||giftLoading) && { opacity:0.5 }]}>
                  {giftLoading ? <ActivityIndicator color="#111" /> : <Text style={styles.secondaryBtnText}>{t('checkout.viewMore')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity disabled={giftLoading || !giftCode || giftAppliedAmount>0} onPress={async () => {
                  setGiftLoading(true); setGiftError(null);
                  try {
                    let balance = giftBalance;
                    if (balance == null) {
                      const info = await checkGiftCardBalance(giftCode);
                      balance = info.balance;
                      setGiftBalance(info.balance);
                    }
                    if ((balance ?? 0) <= 0) { setGiftError(t('checkout.invalidCoupon') || ''); return; }
                    const amountToApply = Math.min(balance ?? 0, baseBeforeGift);
                    if (amountToApply <= 0) { setGiftError('0'); return; }
                    // await applyGiftCard(giftCode, amountToApply, token, undefined); // integrate when auth available
                    setGiftAppliedAmount(amountToApply);
                    setGiftModal(false);
                  } catch(e:any){ setGiftError(e.message); } finally { setGiftLoading(false); }
                }} style={[styles.applyBtn, (giftLoading || !giftCode || giftAppliedAmount>0) && { opacity:0.5 }]}>
                  {giftLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyBtnText}>{t('checkout.apply')}</Text>}
                </TouchableOpacity>
              </View>
              {giftAppliedAmount>0 && (
                <TouchableOpacity onPress={() => { setGiftAppliedAmount(0); setGiftCode(''); setGiftBalance(null); }} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>{t('checkout.remove')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}
function RowNav({ label, onPress, isRTL }: { label: string; onPress: () => void; isRTL: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.rowNav, isRTL && { flexDirection: 'row-reverse' }]}> 
      <Text style={[styles.rowNavLabel, isRTL && styles.textRTL]}>{label}</Text>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#6b7280" />
    </TouchableOpacity>
  );
}
function SummaryRow({ label, value, bold, highlight, isRTL }: { label: string; value: string; bold?: boolean; highlight?: boolean; isRTL: boolean }) {
  return (
    <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
      <Text style={[styles.summaryLabel, bold && styles.totalLabel, isRTL && styles.textRTL, highlight && { color: '#dc2626' }]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.totalValue, isRTL && styles.textRTL, highlight && { color: '#dc2626' }]}>{value}</Text>
    </View>
  );
}
function SafeItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.safeItem}> 
      <Ionicons name={icon} size={24} color="#065f46" />
      <Text style={styles.safeItemText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: Platform.OS === 'android' ? 72 : 48, paddingBottom: 8 },
  headerRTL: { flexDirection: 'row-reverse' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' },
  textRTL: { textAlign: 'right', writingDirection: 'rtl' },
  section: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 8, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  secureText: { fontSize: 12, color: '#059669', marginBottom: 12 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  paymentLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
  paymentHint: { fontSize: 12, color: '#6b7280' },
  payOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fff', marginBottom: 10 },
  payOptionActive: { borderColor: '#111', backgroundColor: '#f9fafb' },
  payOptionRTL: { flexDirection: 'row-reverse' },
  payIconWrap: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  payIconWrapActive: { backgroundColor: '#111' },
  payLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  rowNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  rowNavLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  viewMoreBtn: { padding: 14, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 8, borderColor: '#f1f5f9' },
  viewMoreText: { fontSize: 13, fontWeight: '600', color: '#111' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryRowRTL: { flexDirection: 'row-reverse' },
  summaryLabel: { fontSize: 14, color: '#374151' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111' },
  savedText: { fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: '600' },
  rewardText: { fontSize: 13, fontWeight: '600', color: '#111' },
  safeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  safeItem: { width: '50%', flexDirection: 'column', alignItems: 'center', marginBottom: 16 },
  safeItemText: { marginTop: 6, fontSize: 11, color: '#374151', textAlign: 'center', lineHeight: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb', position: 'absolute', left: 0, right: 0, bottom: 0 },
  totalFooter: { fontSize: 18, fontWeight: '800', color: '#111' },
  itemsLeft: { fontSize: 11, color: '#dc2626', marginTop: 4 },
  placeBtn: { height: 48, backgroundColor: '#111', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  placeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footerRTL: { flexDirection: 'row-reverse' }
  ,modalWrap:{ flex:1, backgroundColor:'#fff' },
  modalHeader:{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingTop:Platform.OS==='android'?48:24, paddingBottom:8, borderBottomWidth:1, borderColor:'#e5e7eb' },
  modalTitle:{ flex:1, textAlign:'center', fontSize:16, fontWeight:'700', color:'#111' },
  modalClose:{ width:40, height:40, alignItems:'center', justifyContent:'center' },
  modalBody:{ padding:16 },
  modalInput:{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, paddingHorizontal:14, height:48, backgroundColor:'#fff', fontSize:14, color:'#111' },
  applyBtn:{ marginTop:16, backgroundColor:'#111', borderRadius:10, height:48, alignItems:'center', justifyContent:'center', flex:1 },
  applyBtnText:{ color:'#fff', fontSize:15, fontWeight:'700' },
  removeBtn:{ marginTop:16, alignItems:'center' },
  removeBtnText:{ color:'#dc2626', fontSize:13, fontWeight:'600' },
  errorTextSmall:{ marginTop:8, color:'#dc2626', fontSize:12 },
  balanceText:{ marginTop:8, fontSize:12, color:'#059669', fontWeight:'600' },
  secondaryBtn:{ flex:1, borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, height:48, alignItems:'center', justifyContent:'center', backgroundColor:'#f3f4f6' },
  secondaryBtnText:{ color:'#111', fontSize:14, fontWeight:'600' },
  /* Coupon modal specific */
  couponModalWrap:{ flex:1, backgroundColor:'#fff' },
  couponHeader:{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingTop:Platform.OS==='android'?48:24, paddingBottom:8, borderBottomWidth:1, borderColor:'#e5e7eb' },
  couponTabs:{ flexDirection:'row', alignItems:'flex-end', paddingHorizontal:16, backgroundColor:'#fff' },
  couponTabBtn:{ flex:1, alignItems:'center', paddingVertical:10 },
  couponTabText:{ fontSize:13, fontWeight:'600', color:'#6b7280' },
  couponTabTextActive:{ color:'#111' },
  /* Success modal */
  successOverlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.4)', alignItems:'center', justifyContent:'center', zIndex:50 },
  successCard:{ width:'80%', maxWidth:380, backgroundColor:'#fff', borderRadius:20, padding:24, alignItems:'center', elevation:10, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:16, shadowOffset:{ width:0, height:6 } },
  successClose:{ position:'absolute', top:10, right:10, width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', backgroundColor:'#f3f4f6' },
  viewOrderBtn:{ backgroundColor:'#111', borderRadius:10, paddingVertical:12, paddingHorizontal:28, width:'100%', alignItems:'center', marginBottom:12 },
  viewOrderText:{ color:'#fff', fontSize:15, fontWeight:'700' },
  successHomeBtn:{ paddingVertical:10, paddingHorizontal:20 },
  successHomeText:{ fontSize:14, fontWeight:'600', color:'#374151' },
  couponTabUnderline:{ height:3, backgroundColor:'#111', width:'60%', borderRadius:2, marginTop:6 },
  couponNoticeRow:{ flexDirection:'row', alignItems:'center', backgroundColor:'#fef3c7', paddingVertical:8, minHeight:40, borderTopWidth:1, borderBottomWidth:1, borderColor:'#fde68a' },
  couponNoticeText:{ flex:1, fontSize:11, color:'#92400e', fontWeight:'500' },
  couponInputRow:{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, marginTop:12 },
  couponInput:{ flex:1, height:40, backgroundColor:'#f3f4f6', borderRadius:2, paddingHorizontal:10, fontSize:13, color:'#111' },
  couponApplyBtn:{ marginLeft:8, backgroundColor:'#111', height:40, borderRadius:2, alignItems:'center', justifyContent:'center', paddingHorizontal:18 },
  couponApplyBtnText:{ color:'#fff', fontSize:13, fontWeight:'600' },
  couponContent:{ flex:1, paddingTop:36, alignItems:'center' },
  emptyIllustration:{ width:120, height:80, alignItems:'center', justifyContent:'center' },
  emptyText:{ marginTop:12, fontSize:12, color:'#111', fontWeight:'500' },
  couponItem:{ flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderColor:'#f1f5f9' },
  couponCode:{ fontSize:14, fontWeight:'700', color:'#111' },
  couponDiscount:{ fontSize:12, color:'#16a34a', marginTop:2, fontWeight:'600' },
  /* Bottom sheet */
  sheetOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' },
  sheetBackdrop:{ flex:1 },
  couponSheet:{ backgroundColor:'#fff', borderTopLeftRadius:18, borderTopRightRadius:18, height:'80%', paddingBottom: Platform.OS==='ios'? 32:24 },
  giftSheet:{ backgroundColor:'#fff', borderTopLeftRadius:18, borderTopRightRadius:18, height:'80%', paddingBottom: Platform.OS==='ios'? 32:24 },
  sheetHandle:{ width:56, height:5, borderRadius:3, backgroundColor:'#e5e7eb', alignSelf:'center', marginTop:8, marginBottom:4 },
  couponHeaderRow:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:4, paddingBottom:4 },
  closeX:{ width:40, height:40, alignItems:'center', justifyContent:'center' }
});
