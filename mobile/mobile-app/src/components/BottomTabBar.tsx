import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// (Removed runtime direction dependency to keep static order)

type Props = {
  active?: 'home' | 'category' | 'gift' | 'cart' | 'me';
  cartCount?: number;
  onHome?: () => void;
  onCategory?: () => void;
  onTrends?: () => void;
  onCart?: () => void;
  onMe?: () => void;
};

const BottomTabBar: React.FC<Props> = ({
  active = 'home',
  cartCount = 0,
  onHome,
  onCategory,
  onTrends,
  onCart,
  onMe,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const padBottom = insets.bottom; // apply inside bar so it sits flush at the very bottom

  const Tab = ({ icon, label, onPress, isActive }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; isActive?: boolean; }) => (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.tab}>
      <Ionicons name={icon} size={24} color={isActive ? '#111' : '#666'} />
      <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  const CENTER_BTN_SIZE = 52; // button fits inside the bar

  const orderedTabs = [
    <View key="home" style={[styles.tabWrap, styles.shopShiftLeft]}><Tab icon={active === 'home' ? 'home' : 'home-outline'} label={t('navigation.shop')} onPress={onHome} isActive={active === 'home'} /></View>,
    <View key="cat" style={[styles.tabWrap, styles.categoryShiftLeft]}><Tab icon={active === 'category' ? 'grid' : 'grid-outline'} label={t('navigation.category')} onPress={onCategory} isActive={active === 'category'} /></View>,
    <View key="cart" style={[styles.tabWrap, { position: 'relative' }]}>
      <View style={styles.cartShiftRight}>
        <Tab icon={active === 'cart' ? 'cart' : 'cart-outline'} label={t('navigation.cart')} onPress={onCart} isActive={active === 'cart'} />
      </View>
      {cartCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
        </View>
      )}
    </View>,
    <View key="me" style={styles.tabWrap}><Tab icon={active === 'me' ? 'person' : 'person-outline'} label={t('navigation.me')} onPress={onMe} isActive={active === 'me'} /></View>
  ];

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.bar, { paddingBottom: padBottom }]}>  
        {orderedTabs}

        {/* Curved notch behind the center button so it blends into the bar's top edge */}
        <View
          pointerEvents="none"
          style={[
            styles.notchCutout,
            {
              width: CENTER_BTN_SIZE + 24,
              height: 24,
              top: -12,
              borderTopLeftRadius: (CENTER_BTN_SIZE + 24) / 2,
              borderTopRightRadius: (CENTER_BTN_SIZE + 24) / 2,
              transform: [{ translateX: -(CENTER_BTN_SIZE + 24) / 2 }],
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.notchBorder,
            {
              width: CENTER_BTN_SIZE + 24,
              height: 24,
              top: -12,
              borderTopLeftRadius: (CENTER_BTN_SIZE + 24) / 2,
              borderTopRightRadius: (CENTER_BTN_SIZE + 24) / 2,
              transform: [{ translateX: -(CENTER_BTN_SIZE + 24) / 2 }],
            },
          ]}
        />

        {/* Center Trends button absolutely centered within the bar */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onTrends}
          activeOpacity={0.9}
          style={[
            styles.centerOverlay,
            { width: CENTER_BTN_SIZE, height: CENTER_BTN_SIZE, borderRadius: CENTER_BTN_SIZE/2 }
          ]}
        >
          <LinearGradient
            colors={["#9b7bff", "#7b5cff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.centerBtn, { width: CENTER_BTN_SIZE, height: CENTER_BTN_SIZE, borderRadius: CENTER_BTN_SIZE/2 }]}
          >
            <Text style={styles.centerText}>{t('navigation.gift')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  bar: {
    height: 72,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 12,
    position: 'relative',
    // Force LTR so positions (left %, transforms) stay consistent even when app root is RTL
    direction: 'ltr',
  },
  tabWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tab: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  cartShiftRight: { transform: [{ translateX: 8 }] },
  shopShiftLeft: { transform: [{ translateX: -20 }] },
  categoryShiftLeft: { transform: [{ translateX: -40 }] },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeLabel: {
    color: '#111',
    fontWeight: '600',
  },
  // no container needed when inside bar
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  centerText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  centerOverlay: {
    position: 'absolute',
    top: (72 - 52) / 2,
    left: '50%',
    transform: [{ translateX: -26 }, { translateY: -18 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 3,
  },
  notchCutout: {
    position: 'absolute',
    left: '50%',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  notchBorder: {
    position: 'absolute',
    left: '50%',
    backgroundColor: 'transparent',
    borderColor: '#e6e6e6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    right: 18,
    top: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: '#e11d48',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BottomTabBar;
