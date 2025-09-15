import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { formatPrice } from '../utils/format';

export default function OrderHistoryScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError(null);
    api.get('/api/orders/my-orders')
      .then(res => setOrders(res.data || []))
      .catch((e) => setError(e?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Use a numeric ActivityIndicator size to avoid any string-to-number conversion issues on native
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size={48} /></View>;
  if (!token) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 12 }}>Sign in to view your orders.</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => (global as any).navigation?.navigate?.('Login')} style={{ padding: 12, backgroundColor: '#111', borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  if (error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>{error}</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Order History</Text>
      {orders.length === 0 ? (
        <Text>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => {
            const total = item.totalAmount || item.total || item.totals?.total;
            return (
              <TouchableOpacity onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })} style={{ marginBottom: 14, borderWidth:1, borderColor:'#e5e7eb', padding:12, borderRadius:10 }}>
                <Text style={{ fontWeight: '700', fontSize:14 }}>#{item.orderNumber || (item._id || '').slice(-6)}</Text>
                <Text style={{ fontSize:12, color:'#374151', marginTop:2 }}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={{ fontSize:13, fontWeight:'600', marginTop:4 }}>Total: {formatPrice(total || 0)}</Text>
                <Text style={{ fontSize:12, color:'#6b7280', marginTop:4 }} numberOfLines={1}>
                  {item.items?.map((it:any) => `${it.name || it.product?.name} x${it.quantity}`).join(', ')}
                </Text>
                <Text style={{ marginTop:4, fontSize:11, fontWeight:'600', color:'#111' }}>{item.status}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
