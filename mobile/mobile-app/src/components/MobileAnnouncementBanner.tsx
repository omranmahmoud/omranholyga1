import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, I18nManager, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export interface MobileAnnouncement {
  _id: string;
  text: string;
  url?: string;
  icon?: string; // Ionicon name fallback mapping
  iconImage?: string; // uploaded image path or URL
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  textColor?: string;
  backgroundColor?: string;
  description?: string; // optional secondary line
}

const fontSizeMap: Record<string, number> = { xs: 11, sm: 13, base: 14, lg: 16, xl: 18 };

const iconFallbacks: Record<string, string> = {
  Truck: 'car-outline',
  Sparkles: 'sparkles-outline',
  Clock: 'time-outline',
  CreditCard: 'card-outline',
  Star: 'star-outline',
  Gift: 'gift-outline',
  Heart: 'heart-outline',
  Tag: 'pricetag-outline'
};

interface Props {
  autoHideAfterMs?: number; // if provided, hides after first load
  style?: any;
  compact?: boolean; // compact scrolling header variant
  slideIntervalMs?: number; // interval for auto slide when multiple
}

const highlightPhrases = ['Free Shipping','Flash Sale','Limited Offer','Hot Deal','New Arrival','New Arrivals'];

const MobileAnnouncementBanner: React.FC<Props> = ({ autoHideAfterMs, style, compact = false, slideIntervalMs = 4000 }) => {
  const [items, setItems] = useState<MobileAnnouncement[]>([]);
  const [hidden, setHidden] = useState(false);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/announcements/mobile-active');
      if (Array.isArray(data)) setItems(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoHideAfterMs && items.length) {
      const t = setTimeout(() => setHidden(true), autoHideAfterMs);
      return () => clearTimeout(t);
    }
  }, [autoHideAfterMs, items.length]);

  const navigation = useNavigation<any>();

  const handlePress = (ann: MobileAnnouncement) => {
    if (!ann.url) return;
    let u = ann.url.trim();
    if (!u) return;
    try {
      // Normalize: strip scheme+host for comparison (e.g. http://localhost:8081/flash-sale)
      const stripped = u.replace(/^https?:\/\/[^/]+/i, '');
      const pathOnly = stripped.startsWith('/') ? stripped.slice(1) : stripped;
      // Accept patterns for internal Flash Sale navigation
      const isFlashSale = /^(flash-sale)(?:[/?#].*)?$/i.test(pathOnly);
      if (isFlashSale) {
        navigation.navigate('FlashSale');
        return;
      }
      // Allow custom app scheme like app://flash-sale
      if (/^app:\/\/flash-sale(?:[/?#].*)?$/i.test(u)) {
        navigation.navigate('FlashSale');
        return;
      }
      // Otherwise open external/relative URL as before
      if (/^https?:\/\//i.test(u)) { Linking.openURL(u); return; }
      Linking.openURL(u.startsWith('/') ? (api.defaults.baseURL?.replace(/\/$/, '') + u) : u);
    } catch {}
  };

  // Reset index if items change size
  useEffect(() => { if (index >= items.length) setIndex(0); }, [items.length, index]);

  // Auto-slide in compact mode
  useEffect(() => {
    if (!compact) return;
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % items.length);
    }, Math.max(1800, slideIntervalMs));
    return () => clearInterval(id);
  }, [compact, items.length, slideIntervalMs]);

  if (hidden || items.length === 0) return null;

  const sameBg = items.every(i => i.backgroundColor === items[0].backgroundColor);
  const containerBg = sameBg ? (items[0].backgroundColor || '#faf5ff') : '#faf5ff';

  if (compact) {
    const a = items[index];
    const color = a.textColor || '#5c1616';
    const iconName = (a.icon && iconFallbacks[a.icon]) || 'pricetag-outline';
    const size = fontSizeMap[a.fontSize || 'sm'] || 13;
    // Determine highlight phrase
    let highlight: string | null = null;
    const hp = highlightPhrases.find(p => a.text?.startsWith(p));
    if (hp) highlight = hp;
    return (
      <View style={[styles.compactWrapper, { backgroundColor: containerBg }, style]}>
        <TouchableOpacity
          style={[styles.compactItem, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}
            activeOpacity={a.url ? 0.7 : 1}
            onPress={() => handlePress(a)}
        >
          {a.iconImage ? (
            <Image source={{ uri: a.iconImage.startsWith('http') ? a.iconImage : (api.defaults.baseURL?.replace(/\/$/, '') + a.iconImage) }} style={{ width: 18, height: 18, borderRadius: 4, marginRight: I18nManager.isRTL ? 0 : 6, marginLeft: I18nManager.isRTL ? 6 : 0 }} />
          ) : (
            <Ionicons name={iconName as any} size={16} color={color} style={{ marginRight: I18nManager.isRTL ? 0 : 6, marginLeft: I18nManager.isRTL ? 6 : 0 }} />
          )}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Text style={{ color, fontSize: size }} numberOfLines={1}>
              <Text style={{ fontWeight: '700', color, fontSize: size }}>
                {a.text}
              </Text>
              {a.description ? (
                <Text style={{ fontWeight: '400', color, fontSize: size }}> {a.description}</Text>
              ) : null}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: containerBg }, style]}>
      <View style={styles.row}>
        {items.map((a, idx) => {
          const color = a.textColor || '#3b0764';
          const iconName = (a.icon && iconFallbacks[a.icon]) || 'information-circle-outline';
          const size = fontSizeMap[a.fontSize || 'sm'] || 13;
          const isLast = idx === items.length - 1;
          return (
            <View key={a._id} style={[styles.equalCell, !isLast && (I18nManager.isRTL ? styles.separatorLeft : styles.separatorRight)]}>
              <TouchableOpacity
                style={[styles.item, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}
                activeOpacity={a.url ? 0.7 : 1}
                onPress={() => handlePress(a)}
              >
                {a.iconImage ? (
                  <View style={{ marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0, paddingTop: a.description ? 2 : 0 }}>
                    <Image source={{ uri: a.iconImage.startsWith('http') ? a.iconImage : (api.defaults.baseURL?.replace(/\/$/, '') + a.iconImage) }} style={{ width: 18, height: 18, borderRadius: 4 }} />
                  </View>
                ) : (
                  <Ionicons name={iconName as any} size={18} color={color} style={{ marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0, paddingTop: a.description ? 2 : 0 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color, fontSize: size, fontWeight: '600', flexShrink: 1 }} numberOfLines={2}>{a.text}</Text>
                  {a.description ? (
                    <Text style={[styles.desc, { color }]} numberOfLines={2}>{a.description}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
  // Squared style (no rounded corners)
  borderRadius: 0,
  marginHorizontal: 0,
  // Shift upward to sit closer to (or overlap) the banner above
  marginTop: -16,
  position: 'relative',
  paddingVertical: 8,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: 'rgba(0,0,0,0.06)',
  },
  compactWrapper: {
    marginHorizontal: 0,
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff8ee',
    borderRadius: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  row: {
    paddingHorizontal: 0,
    alignItems: 'stretch',
    flexDirection: 'row',
    width: '100%',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
  },
  desc: {
    fontSize: 11,
    opacity: 0.75,
    marginTop: 2,
    lineHeight: 14,
    fontWeight: '400'
  },
  equalCell: {
    flex: 1,
  },
  separatorRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.07)'
  },
  separatorLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.07)'
  },
  // closeBtn style removed (no longer used)
});

export default MobileAnnouncementBanner;
