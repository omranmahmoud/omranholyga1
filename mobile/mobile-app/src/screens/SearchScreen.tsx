import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { formatPrice } from '../utils/format';
import { RouteProps, RootStackParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { fetchCategories, Category } from '../services/categoryService';

interface ProductItem {
  _id?: string;
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  images?: string[];
}

type Props = RouteProps<'Search'>;

// In-memory recent searches (could be replaced with AsyncStorage later)
let RECENT_CACHE: string[] = [];
const MAX_RECENTS = 10;
// Fallback discovery strings if categories fail to load
const DISCOVERY_FALLBACK = ['Trending', 'New', 'Popular'];

export default function SearchScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const initialQuery = route?.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(RECENT_CACHE);
  const [showAllDiscovery, setShowAllDiscovery] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  // Load categories once for discovery list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCatLoading(true);
        const cats = await fetchCategories();
        if (!mounted) return;
        setCategories(cats);
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
      } finally {
        if (mounted) setCatLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const discoveryCategories: Category[] = categories.slice(0, showAllDiscovery ? categories.length : 7);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Assuming backend supports ?q= or ?search=; try q first then fallback
      const { data } = await api.get('/api/products', { params: { q: term } });
      const arr = Array.isArray(data) ? data : [];
      // naive client filter fallback if server ignores q
      const filtered = arr.filter((p: any) => !term || String(p?.name || '').toLowerCase().includes(term.toLowerCase()));
      setResults(filtered.slice(0, 100));
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  const commitRecent = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    RECENT_CACHE = [t, ...RECENT_CACHE.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS);
    setRecent(RECENT_CACHE);
  }, []);

  // Auto-store successful queries after data arrives
  useEffect(() => {
    if (query.trim().length > 0 && results.length > 0) {
      commitRecent(query);
    }
  }, [results]);

  const onSelectTag = (term: string) => {
    setQuery(term);
    commitRecent(term);
  };

  const onSubmit = () => {
    performSearch(query);
    commitRecent(query);
    Keyboard.dismiss();
  };

  const clearRecent = () => {
    RECENT_CACHE = [];
    setRecent([]);
  };

  const renderItem = ({ item }: { item: ProductItem }) => {
  const price = typeof item.price === 'number' ? formatPrice(item.price) : '';
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    const pick = ((): string | undefined => {
      if (item.image) return item.image;
      if (Array.isArray(item.images) && item.images.length) return item.images[0];
      // try colors[0].images[0]
      const anyItem: any = item as any;
      if (Array.isArray(anyItem.colors) && anyItem.colors.length) {
        const c0 = anyItem.colors[0];
        if (c0 && Array.isArray(c0.images) && c0.images.length) return c0.images[0];
      }
      return undefined;
    })();
    const resolved = pick ? (/^https?:\/\//i.test(pick) ? pick : `${base}${pick.startsWith('/') ? '' : '/'}${pick}`) : undefined;
    const id = item._id || item.id;
    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={() => id && (navigation as any).navigate('ProductDetails', { productId: String(id) })}
        accessibilityRole="button"
        accessibilityLabel={item.name || 'Product'}
      >
        {resolved ? (
          <Image source={{ uri: resolved }} style={s.thumbImg} resizeMode="cover" />
        ) : (
          <View style={s.thumb} />
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={s.title}>{item.name || 'Unnamed product'}</Text>
          {!!price && <Text style={s.price}>{price}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  const discoveryList: (Category | string)[] = discoveryCategories.length > 0
    ? discoveryCategories
    : (showAllDiscovery ? DISCOVERY_FALLBACK : DISCOVERY_FALLBACK.slice(0,7));

  return (
    <View style={s.container}>
      <View style={s.searchRow}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={s.searchInputWrap}>
          <TouchableOpacity style={s.inlineIconBtn} accessibilityLabel="Camera search">
            <Ionicons name="camera-outline" size={20} color="#111" />
          </TouchableOpacity>
          <TextInput
            style={s.headInput}
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            autoCapitalize="none"
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity accessibilityRole="button" onPress={() => setQuery('')} style={s.inlineIconBtn} accessibilityLabel="Clear search text">
              <Ionicons name="close-circle" size={18} color="#555" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onSubmit} style={s.searchIconBtn} accessibilityLabel="Search">
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

  {recent.length > 0 && query.length === 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recently Searched</Text>
            <TouchableOpacity onPress={clearRecent} accessibilityLabel="Clear recent searches">
              <Ionicons name="trash-outline" size={18} color="#111" />
            </TouchableOpacity>
          </View>
          <View style={s.tagWrap}>
            {recent.map(r => (
              <TouchableOpacity key={r} style={s.tag} onPress={() => onSelectTag(r)}>
                <Text style={s.tagText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {results.length === 0 && query.length === 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Search Discovery</Text>
          <View style={s.tagWrap}>
            {discoveryList.map((d) => {
              if (typeof d === 'string') {
                return (
                  <TouchableOpacity key={d} style={s.tag} onPress={() => onSelectTag(d)}>
                    <Text style={s.tagText}>{d}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={d._id}
                  style={s.tag}
                  onPress={() => navigation.navigate('ProductList', { category: d._id })}
                >
                  <Text style={s.tagText}>{d.name}</Text>
                </TouchableOpacity>
              );
            })}
            {(categories.length > 7) && (
              <TouchableOpacity style={s.tag} onPress={() => setShowAllDiscovery(v => !v)}>
                <Text style={s.tagText}>{showAllDiscovery ? 'Less ˄' : 'More ˅'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {catLoading && <ActivityIndicator size="small" color="#111" style={{ marginTop: 12 }} />}
        </View>
      )}

      {error && (
        <View style={s.center}><Text style={s.error}>{error}</Text></View>
      )}

      {results.length === 0 && query.trim().length > 0 && !loading && !error && (
        <View style={s.center}><Text style={s.muted}>No results</Text></View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
            keyExtractor={(item, idx) => String(item._id || item.id || idx)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
      )}

      {loading && (
        <View style={{ position: 'absolute', top: 90, left: 0, right: 0 }}>
          <ActivityIndicator size="small" color="#111" />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 0, paddingHorizontal: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 44 },
  backBtn: { padding: 4, marginRight: 4 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, borderWidth: 1, borderColor: '#111', borderRadius: 28, paddingLeft: 6, backgroundColor: '#fff' },
  headInput: { flex: 1, fontSize: 16, paddingVertical: 8, color: '#111', paddingHorizontal: 6 },
  inlineIconBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  searchIconBtn: { width: 56, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderTopRightRadius: 28, borderBottomRightRadius: 28 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  tagText: { fontSize: 14, fontWeight: '500', color: '#111' },
  center: { alignItems: 'center', paddingTop: 40 },
  muted: { color: '#6b7280', fontSize: 14 },
  error: { color: '#dc2626', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#e5e7eb', marginRight: 4 },
  thumbImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f1f5f9', marginRight: 4 },
  title: { fontSize: 14, fontWeight: '600', color: '#111' },
  price: { fontSize: 13, fontWeight: '500', color: '#6b7280', marginTop: 4 },
});
