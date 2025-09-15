import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, I18nManager, Switch, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { resolveApiBase } from '../utils/apiBase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types/navigation';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

interface CardData {
  number: string;
  expiry: string; // MM/YY
  cvv: string;
  remember: boolean;
}

export default function PaymentScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();
  const params = route.params;
  const summary = params?.summary;
  const orderNumber = params?.orderNumber;
  const address = params?.address;
  const isRTL = I18nManager.isRTL;
  const [card, setCard] = useState<CardData>({ number: '', expiry: '', cvv: '', remember: false });
  const [cardBrand, setCardBrand] = useState<string>('unknown');
  const [errors, setErrors] = useState<{ number?: string; expiry?: string; cvv?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Luhn algorithm for card number validation
  const luhnCheck = (num: string) => {
    let sum = 0;
    let shouldDouble = false;
    // Process digits right-to-left
    for (let i = num.length - 1; i >= 0; i--) {
      let d = parseInt(num.charAt(i), 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Brand specific rules
  const requiredLengths: Record<string, { pan: number; cvv: number | number[] }> = {
    visa: { pan: 16, cvv: 3 },
    mastercard: { pan: 16, cvv: 3 },
    amex: { pan: 15, cvv: 4 },
    discover: { pan: 16, cvv: 3 },
    unknown: { pan: 16, cvv: 3 }
  };

  const detectBrand = (digits: string) => {
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^6(011|5)/.test(digits)) return 'discover';
    return 'unknown';
  };

  const formatCardNumber = (raw: string, brand: string) => {
    const digits = raw.replace(/\D/g,'').slice(0, brand==='amex'?15:16);
    if (brand === 'amex') {
      return digits
        .replace(/^(\d{4})(\d)/, '$1 $2')
        .replace(/^(\d{4} \d{6})(\d)/, '$1 $2');
    }
    return digits.replace(/(\d{4})(?=\d)/g,'$1 ').trim();
  };

  const validate = () => {
    const e: typeof errors = {};
    const plain = card.number.replace(/\s+/g,'');
    const rule = requiredLengths[cardBrand] || requiredLengths.unknown;
    if (plain.length !== rule.pan || !/^\d+$/.test(plain)) {
      e.number = 'Invalid number length';
    } else if (!luhnCheck(plain)) {
      e.number = 'Failed Luhn check';
    }
    // Expiry strict check
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      e.expiry = 'MM/YY';
    } else {
      const [mm, yy] = card.expiry.split('/').map(p=>parseInt(p,10));
      const now = new Date();
      const curMonth = now.getMonth()+1;
      const curYearShort = now.getFullYear() % 100; // two-digit year
      if (mm < 1 || mm > 12) {
        e.expiry = 'MM 01-12';
      } else if (yy < curYearShort || (yy === curYearShort && mm < curMonth)) {
        e.expiry = 'Expired';
      }
    }
    const cvvRule = requiredLengths[cardBrand]?.cvv;
    const cvvValid = Array.isArray(cvvRule) ? cvvRule.includes(card.cvv.length) : card.cvv.length === cvvRule;
    if (!cvvValid) e.cvv = 'CVV';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const formatExpiryInput = (value:string) => {
    // Remove non-digits
    const digits = value.replace(/[^0-9]/g,'').slice(0,4);
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits; // first digit
  if (digits.length === 2) return digits + '/'; // auto append slash after MM
    return digits.slice(0,2) + '/' + digits.slice(2);
  };

  const apiBase = resolveApiBase();

  const authorizeViaPayPal = async (): Promise<{ ok: boolean; transactionId?: string; error?: string }> => {
    try {
      // Coerce/validate amount (must be a number so server can call toFixed(2))
      let rawTotal: any = summary?.total ?? 0;
      if (typeof rawTotal === 'string') rawTotal = rawTotal.replace(/[^0-9.,]/g,'');
      let amountNum = typeof rawTotal === 'number' ? rawTotal : parseFloat(rawTotal || '0');
      if (!isFinite(amountNum) || amountNum < 0) amountNum = 0;

      // Convert expiry (MM/YY -> YYYY-MM) for PayPal
      const match = card.expiry.match(/^(\d{2})\/(\d{2})$/);
      if (!match) return { ok:false, error:'Invalid expiry format' };
      const mm = match[1];
      const yy = match[2];
      const year = '20' + yy;

      const body = {
        // Server (authorizeCard) expects: { amount:number, currency, paymentSource:{ card:{ number, expiry, security_code } } }
        amount: amountNum, // number (server will .toFixed(2))
        currency: 'USD', // ensure uppercase
        paymentSource: {
          card: (() => {
            const base: any = {
              number: card.number.replace(/\s+/g,''),
              expiry: `${year}-${mm}`,
              security_code: card.cvv
            };
            // Optionally include cardholder name & billing address to reduce validation failures
            if (address) {
              const name = `${address.firstName||''} ${address.lastName||''}`.trim();
              if (name) base.name = name;
              const addr: any = {};
              if (address.line1) addr.address_line_1 = address.line1;
              if (address.line2) addr.address_line_2 = address.line2;
              if (address.city) addr.admin_area_2 = address.city; // City
              if (address.state) addr.admin_area_1 = address.state; // State / province
              if (address.zip) addr.postal_code = address.zip;
              if (address.countryCode) addr.country_code = String(address.countryCode).trim().toUpperCase(); // Must be ISO-2
              // PayPal requires country_code if billing_address is present; skip if missing
              if (addr.country_code) {
                base.billing_address = addr;
              }
            }
            return base;
          })()
        }
      };
      const authorizeUrl = apiBase + '/api/paypal/card/authorize';
      console.log('[Pay] Authorize URL:', authorizeUrl, 'body.amount=', body.amount);
      const resp = await axios.post(authorizeUrl, body, { timeout: 15000 });
      if (resp.data?.status === 'COMPLETED' || resp.data?.status === 'CAPTURED') {
        return { ok: true, transactionId: resp.data?.id };
      }
      return { ok:false, error: 'Authorization failed' };
    } catch(e:any){
      if (e?.response) {
        const data = e.response.data || {};
        const serverMsg = data?.message || data?.name || data?.error || null;
        if (e.response.status === 404) {
          return { ok:false, error: 'Payment service path not found (404). Restart server or missing /api/paypal/card/authorize route.' };
        }
        // Extract PayPal validation / decline reasons
        let detailStr = '';
        if (Array.isArray(data.details) && data.details.length) {
          // Provide friendly mapping for common issues
          detailStr = data.details.map((d:any)=>{
            if (d.issue === 'PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING') {
              return 'Merchant account not enabled for direct card payments (enable Advanced Card Processing in PayPal)';
            }
            return `${d.issue}${d.description?(': '+d.description):''}`;
          }).join('; ');
        }
        const debugId = data.debug_id || e.response.headers?.['paypal-debug-id'] || e.response.headers?.['PayPal-Debug-Id'];
        const composite = [serverMsg, detailStr].filter(Boolean).join(' | ');
        return { ok:false, error: `HTTP ${e.response.status}${composite? ': '+composite:''}${debugId? ' debugId='+debugId:''}` };
      }
      return { ok:false, error: e?.message || 'Network error' };
    }
  };

  const submit = async () => {
    if (!validate()) return;
    if (!params?.draftOrder) { navigation.goBack(); return; }
    setSubmitting(true);
    try {
      // 1. Authorize / capture payment first
  const pay = await authorizeViaPayPal();
      if (!pay.ok) {
        setSubmitting(false);
        Alert.alert('Payment Failed', pay.error || 'Card was declined');
        return; // STOP: do not create order
      }
      // 2. Only create order after payment success
      const res = await axios.post(
        apiBase + '/api/orders',
        { ...params.draftOrder, paymentMethod:'card', paymentStatus:'completed', paymentReference: pay.transactionId },
        { timeout:10000 }
      );
      setSubmitting(false);
      navigation.navigate('OrderHistory', { newOrderId: res.data?.order?._id });
    } catch(e:any){
      setSubmitting(false);
      let detail = 'Unknown error';
      if (e?.response) {
        detail = `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}`;
      } else if (e?.request) {
        detail = 'No response (network / CORS / server down)';
      } else if (e?.message) {
        detail = e.message;
      }
      console.warn('Card order create failed', detail);
      Alert.alert('Order Failed', detail);
    }
  };

  const formValid = (() => {
    const plain = card.number.replace(/\s+/g,'');
    const rule = requiredLengths[cardBrand] || requiredLengths.unknown;
    if (plain.length !== rule.pan || !/^\d+$/.test(plain) || !luhnCheck(plain)) return false;
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return false;
    const [mmStr, yyStr] = card.expiry.split('/');
    const mm = parseInt(mmStr,10); const yy = parseInt(yyStr,10);
    const now = new Date();
    const curMonth = now.getMonth()+1; const curYearShort = now.getFullYear()%100;
    if (mm < 1 || mm > 12) return false;
    if (yy < curYearShort || (yy === curYearShort && mm < curMonth)) return false;
    const cvvRule = requiredLengths[cardBrand]?.cvv;
    const cvvValid = Array.isArray(cvvRule) ? cvvRule.includes(card.cvv.length) : card.cvv.length === cvvRule;
    return cvvValid;
  })();

  return (
    <View style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#111" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('checkout.paymentMethod')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        {/* urgency bar */}
        <View style={styles.urgencyWrap}>
          <Ionicons name="hourglass-outline" size={14} color="#b45309" style={{ marginRight:6 }} />
          <Text style={styles.urgencyText}>1 item(s) almost sold out!</Text>
        </View>
        {/* card logos */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerRow}>
          {['visa','mastercard','amex','discover'].map(k => {
            const iconMap: any = { visa:'logo-visa', mastercard:'logo-mastercard', amex:'logo-amex', discover:'logo-electron' };
            const active = cardBrand===k;
            return (
              <View key={k} style={[styles.cardLogo, active && { borderColor:'#111', borderWidth:1, borderRadius:8 }]}> 
                <Ionicons name={iconMap[k]} size={40} color={active? '#111':'#6b7280'} />
              </View>
            );
          })}
        </ScrollView>
        {/* form */}
        <View style={styles.formSection}>
          <Field
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={card.number}
            error={errors.number}
            keyboardType="number-pad"
            onChangeText={(v: string)=>{
              const digits = v.replace(/\D/g,'');
              const brand = detectBrand(digits);
              const formatted = formatCardNumber(digits, brand);
              setCard(c=>({...c,number:formatted}));
              if (brand!==cardBrand) setCardBrand(brand);
              if (errors.number) setErrors(prev=>({...prev, number: undefined }));
            }}
          />
          <View style={{ flexDirection:'row', gap:12 }}>
            <Field
              style={{ flex:1 }}
              label="Expire Date"
              placeholder="MM/YY"
              value={card.expiry}
              error={errors.expiry}
              keyboardType="number-pad"
              maxLength={5}
              onChangeText={(v:string)=>{
                const masked = formatExpiryInput(v);
                setCard(c=>({...c,expiry:masked}));
                if (errors.expiry) setErrors(prev=>({...prev, expiry: undefined }));
              }}
            />
            <Field style={{ flex:1 }} label="CVV" placeholder="3-4 digits" value={card.cvv} error={errors.cvv} keyboardType="number-pad" maxLength={4} secureTextEntry onChangeText={(v:string)=>setCard(c=>({...c,cvv:v}))} />
          </View>
          <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>Remember this card for future use</Text>
            <Switch value={card.remember} onValueChange={v=>setCard(c=>({...c,remember:v}))} />
          </View>
        </View>
        {/* billing address */}
        <View style={styles.billingSection}>
          <Text style={styles.billingTitle}>Billing Address</Text>
          {address ? (
            <Text style={styles.billingText} numberOfLines={4}>
              {`${address.firstName||''} ${address.lastName||''} ${address.phone||''}\n${address.city||''} ${address.state||''} ${address.countryCode||''} ${address.zip||''}\n${address.line1||''}${address.line2? (' '+address.line2):''}`}
            </Text>
          ) : (
            <Text style={styles.billingText}>No address</Text>
          )}
        </View>
        {/* order summary */}
        {summary && (
          <View style={styles.orderSummary}>
            {orderNumber && <Row label="Order Number:" value={orderNumber} />}
            <Row label="Retail Price:" value={format(summary.subtotal)} strike={summary.couponDiscount>0} />
            <Row label="Subtotal:" value={format(summary.subtotal + summary.promotions)} />
            {/* Shipping rows removed per request */}
            {summary.couponDiscount>0 && <Row label="Coupon:" value={`-${format(summary.couponDiscount)}`} highlight />}
            {summary.giftAppliedAmount>0 && <Row label="Gift Card:" value={`-${format(summary.giftAppliedAmount)}`} highlight />}
          </View>
        )}
        {/* safety sections */}
        <View style={styles.safeBlock}>
          <View style={styles.safeHeader}> 
            <Ionicons name="bus-outline" size={18} color="#047857" />
            <Text style={styles.safeHeaderText}>Secure Delivery Guarantee</Text>
          </View>
          <Text style={styles.safeCopy}>We work with reliable shipping partners around the world. We guarantee that your package will reach you safely and on time. If problems occur during transit such as damage, loss, or delay we will do our best to solve them.</Text>
        </View>
        <View style={styles.safeBlock}>
          <View style={styles.safeHeader}> 
            <Ionicons name="shield-checkmark-outline" size={18} color="#047857" />
            <Text style={styles.safeHeaderText}>Payment Security</Text>
          </View>
          <Text style={styles.safeCopy}>We protect your payment information and only share it with providers who safeguard it.</Text>
        </View>
  </ScrollView>
      <View style={styles.footer}> 
        <Text style={styles.totalFooter}>{summary ? format(summary.total) : '--'}</Text>
  <TouchableOpacity style={[styles.placeBtn, (submitting || !formValid) && { opacity:0.6 }]} onPress={submit} disabled={submitting || !formValid}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>{t('checkout.placeOrder')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType, style, maxLength, error, secureTextEntry } : any) {
  return (
    <View style={[{ marginBottom:14 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && { borderColor:'#dc2626' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
      />
      {error && <Text style={styles.errorSmall}>{error}</Text>}
    </View>
  );
}

function Row({ label, value, strike, highlight }:{ label:string; value:string; strike?:boolean; highlight?:boolean }) {
  return (
    <View style={styles.rowLine}> 
      <Text style={[styles.rowLabel, strike && { textDecorationLine:'line-through', color:'#6b7280' }]}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color:'#dc2626' }]}>{value}</Text>
    </View>
  );
}

function format(v:number){ return '$'+v.toFixed(2); }

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingTop:Platform.OS==='android'?48:24, paddingBottom:8 },
  headerRTL:{ flexDirection:'row-reverse' },
  backBtn:{ width:40, height:40, alignItems:'center', justifyContent:'center' },
  headerTitle:{ flex:1, textAlign:'center', fontSize:18, fontWeight:'700', color:'#111' },
  textRTL:{ textAlign:'right' },
  urgencyWrap:{ flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#fff7ed', paddingVertical:6, borderBottomWidth:1, borderColor:'#fed7aa' },
  urgencyText:{ fontSize:12, color:'#b45309', fontWeight:'600' },
  bannerRow:{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:12 },
  cardLogo:{ width:60, height:40, alignItems:'center', justifyContent:'center' },
  formSection:{ backgroundColor:'#fff', paddingHorizontal:16, paddingTop:16, paddingBottom:12, borderBottomWidth:8, borderColor:'#f1f5f9' },
  billingSection:{ backgroundColor:'#fff', paddingHorizontal:16, paddingTop:16, paddingBottom:12, borderBottomWidth:8, borderColor:'#f1f5f9' },
  billingTitle:{ fontSize:15, fontWeight:'700', color:'#111', marginBottom:8 },
  billingText:{ fontSize:12, lineHeight:16, color:'#374151', fontWeight:'500' },
  orderSummary:{ backgroundColor:'#fff', paddingHorizontal:16, paddingTop:8, paddingBottom:8, borderBottomWidth:8, borderColor:'#f1f5f9' },
  fieldLabel:{ fontSize:13, fontWeight:'600', color:'#374151', marginBottom:6 },
  input:{ height:48, borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, paddingHorizontal:14, backgroundColor:'#fff', fontSize:15, color:'#111' },
  rememberRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  rememberLabel:{ fontSize:13, color:'#111', fontWeight:'600' },
  rowLine:{ flexDirection:'row', justifyContent:'space-between', paddingVertical:4 },
  rowLabel:{ fontSize:12, color:'#374151', fontWeight:'500' },
  rowValue:{ fontSize:12, color:'#111', fontWeight:'600' },
  safeBlock:{ backgroundColor:'#fff', paddingHorizontal:16, paddingTop:12, paddingBottom:18, borderBottomWidth:8, borderColor:'#f1f5f9' },
  safeHeader:{ flexDirection:'row', alignItems:'center', marginBottom:8 },
  safeHeaderText:{ marginLeft:8, fontSize:14, fontWeight:'700', color:'#065f46' },
  safeCopy:{ fontSize:12, color:'#374151', lineHeight:16 },
  footer:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderTopWidth:1, borderColor:'#e5e7eb', backgroundColor:'#fff' },
  totalFooter:{ flex:1, fontSize:18, fontWeight:'800', color:'#111' },
  placeBtn:{ height:48, backgroundColor:'#111', borderRadius:10, alignItems:'center', justifyContent:'center', paddingHorizontal:28 },
  placeBtnText:{ color:'#fff', fontSize:15, fontWeight:'700' },
  errorSmall:{ marginTop:4, fontSize:11, color:'#dc2626', fontWeight:'600' }
});
