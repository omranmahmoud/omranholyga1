import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../types/navigation';
import { formatPrice } from '../utils/format';
import { resolveApiBase } from '../utils/apiBase';

interface OrderItem {
  product?: { _id: string; name: string; images?: string[] } | string;
  quantity: number;
  price: number; // effective line unit price stored on order
  size?: string;
  color?: string;
  flashPrice?: number;
  originalPrice?: number;
}
interface OrderResponse {
  _id: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  totals?: { subtotal?: number; total?: number; promotions?: number; shipping?: number };
  shippingAddress?: { street?: string; city?: string; country?: string };
  paymentMethod?: string;
}

export default function OrderDetailsScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetails'>>();
  const navigation = useNavigation<any>();
  const orderId = route.params?.orderId;
  const apiBase = resolveApiBase();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setError(null);
      const res = await axios.get(apiBase + '/api/orders/' + orderId, { timeout: 10000 });
      setOrder(res.data?.order || res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, apiBase]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const onRefresh = () => { setRefreshing(true); fetchOrder(); };

  const subtotal = order?.totals?.subtotal ?? order?.items?.reduce((s, it) => s + (it.price * it.quantity), 0) ?? 0;
  const shipping = order?.totals?.shipping ?? 0;
  const promotions = order?.totals?.promotions ?? 0; // stored as negative
  const total = order?.totals?.total ?? (subtotal + shipping + promotions);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('order.detailsTitle', { defaultValue: 'Order Details' })}</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchOrder} style={styles.retryBtn}><Text style={styles.retryText}>{t('common.retry','Retry')}</Text></TouchableOpacity>
        </View>
      ) : !order ? (
        <View style={styles.center}><Text>{t('order.notFound','Order not found')}</Text></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> } contentContainerStyle={{ padding:16, paddingBottom:40 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('order.overview','Overview')}</Text>
            <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.id','ID')}:</Text> {order._id}</Text>
            <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.status','Status')}:</Text> {order.status}</Text>
            <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.date','Date')}:</Text> {new Date(order.createdAt).toLocaleString()}</Text>
            {order.paymentMethod && <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.paymentMethod','Payment')}:</Text> {order.paymentMethod}</Text>}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('order.items','Items')}</Text>
            {order.items.map((it, idx) => {
              const name = typeof it.product === 'string' ? it.product : it.product?.name || 'Item';
              const hasFlash = (it.originalPrice && it.flashPrice && it.originalPrice > it.flashPrice);
              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex:1 }}>
                    <Text style={styles.itemName}>{name}</Text>
                    <Text style={styles.itemMeta}>x{it.quantity}{it.size ? ' • '+it.size : ''}{it.color ? ' • '+it.color : ''}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={styles.itemPrice}>{formatPrice(it.price * it.quantity)}</Text>
                    {hasFlash && <Text style={styles.flashSave}>{t('order.flash', 'Flash')} {formatPrice((it.originalPrice!-it.flashPrice!)*it.quantity)}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('order.totals','Totals')}</Text>
            <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.subtotal','Subtotal')}:</Text> {formatPrice(subtotal)}</Text>
            <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.shipping','Shipping')}:</Text> {formatPrice(shipping)}</Text>
            {promotions!==0 && <Text style={styles.line}><Text style={styles.lineLabel}>{t('order.promotions','Promotions')}:</Text> {formatPrice(promotions)}</Text>}
            <Text style={[styles.line, { fontWeight:'700', fontSize:16 }]}><Text style={styles.lineLabel}>{t('order.total','Total')}:</Text> {formatPrice(total)}</Text>
          </View>
          {order.shippingAddress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('order.shippingAddress','Shipping Address')}</Text>
              <Text style={styles.line}>{order.shippingAddress.street}</Text>
              <Text style={styles.line}>{order.shippingAddress.city} {order.shippingAddress.country}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingTop:60, paddingBottom:8 },
  backBtn:{ width:40, height:40, alignItems:'center', justifyContent:'center' },
  headerTitle:{ flex:1, textAlign:'center', fontSize:18, fontWeight:'700', color:'#111' },
  center:{ flex:1, alignItems:'center', justifyContent:'center', padding:24 },
  errorText:{ color:'#dc2626', fontSize:14, marginBottom:12 },
  retryBtn:{ paddingHorizontal:16, paddingVertical:10, borderRadius:8, backgroundColor:'#111' },
  retryText:{ color:'#fff', fontWeight:'600' },
  section:{ backgroundColor:'#fff', borderWidth:1, borderColor:'#f1f5f9', borderRadius:12, padding:14, marginBottom:16 },
  sectionTitle:{ fontSize:15, fontWeight:'700', color:'#111', marginBottom:8 },
  line:{ fontSize:13, color:'#111', marginBottom:4 },
  lineLabel:{ fontWeight:'600' },
  itemRow:{ flexDirection:'row', alignItems:'flex-start', marginBottom:12 },
  itemName:{ fontSize:14, fontWeight:'600', color:'#111' },
  itemMeta:{ fontSize:11, color:'#6b7280', marginTop:2 },
  itemPrice:{ fontSize:14, fontWeight:'700', color:'#111' },
  flashSave:{ fontSize:10, fontWeight:'600', color:'#dc2626', marginTop:2 },
});
