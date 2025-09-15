import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BottomTabBar from '../components/BottomTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.reduce((s, it) => s + (it.quantity ?? 0), 0);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => { await logout(); };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || user?.email || 'G').slice(0,1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.username}>{user?.name || user?.email || 'Guest'}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.profileEdit}>{t('profileHeader.myProfile')} <Text style={styles.editInline}>✎</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Orders summary */}
        <View style={styles.ordersBlock}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>{t('profileHeader.myOrders')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={styles.viewAll}>{t('profileHeader.viewAll')} ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusRow}>
            {[
              { key: 'unpaid', label: t('profileHeader.unpaid'), nav: 'OrderHistory' },
              { key: 'processing', label: t('profileHeader.processing'), nav: 'OrderHistory' },
              { key: 'shipped', label: t('profileHeader.shipped'), nav: 'OrderHistory' },
              { key: 'review', label: t('profileHeader.review'), nav: 'OrderHistory' },
              { key: 'returns', label: t('profileHeader.returns'), nav: 'OrderHistory' },
            ].map(s => (
              <TouchableOpacity key={s.key} style={styles.statusItem} onPress={() => navigation.navigate(s.nav as any)}>
                <View style={styles.statusIcon}><Text style={{ fontSize: 16 }}>▢</Text></View>
                <Text style={styles.statusLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auth actions */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {user ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('OrderHistory')}>
                <Text style={styles.primaryBtnText}>{t('profile.orderHistory')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogout}>
                <Text style={styles.secondaryBtnText}>{t('profile.logout')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 16 }]}>{t('profile.guestMessage')}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{t('profile.signIn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>{t('profile.createAccount')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <BottomTabBar
        active="me"
        cartCount={cartCount}
        onHome={() => navigation.navigate('Home')}
        onCategory={() => navigation.navigate('Category')}
        onTrends={() => navigation.navigate('ProductList')}
        onCart={() => navigation.navigate('Cart')}
        onMe={() => {/* already here */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#333' },
  actions: { flexDirection: 'row', gap: 12 },
  primaryBtn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { borderColor: '#111', borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  secondaryBtnText: { color: '#111', fontWeight: '700' },
  headerCard: { backgroundColor: '#f8f9fa', margin: 12, marginTop: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e1e4e8', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: '600', color: '#111' },
  username: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  profileEdit: { fontSize: 14, color: '#444' },
  editInline: { textDecorationLine: 'underline', color: '#666' },
  settingsBtn: { padding: 8 },
  ordersBlock: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, paddingTop: 12, paddingBottom: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, borderWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  ordersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  ordersTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  viewAll: { fontSize: 13, color: '#444' },
  statusRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', paddingHorizontal: 6 },
  statusItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statusIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f2f3f5', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusLabel: { fontSize: 12, color: '#222' },
});
