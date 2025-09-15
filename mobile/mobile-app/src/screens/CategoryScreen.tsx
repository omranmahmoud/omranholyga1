import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../types/navigation';
import api from '../services/api';
import BottomTabBar from '../components/BottomTabBar';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

interface CategoryItem { _id: string; name: string; slug?: string; image?: string; }
interface SubNavCategory { name: string; slug: string; }
interface NavCategory { _id: string; name: string; slug?: string; isActive?: boolean; subCategories?: SubNavCategory[]; }

// Minimal fallback icons/colors for category circles
const circleColors = ['#fde68a','#bfdbfe','#fecaca','#bbf7d0','#ddd6fe','#fed7aa','#bae6fd','#fecdd3'];

// Fixed sidebar width
const LEFT_PANE_WIDTH = 120;

const CategoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { cart } = useCart();
  const cartCount = useMemo(() => cart.reduce((s,it)=> s + (it.quantity||0), 0), [cart]);

  const [navTabs, setNavTabs] = useState<NavCategory[]>([]);
  const [leftCats, setLeftCats] = useState<CategoryItem[]>([]);
  // Keep a copy of the full category list so we can restore when switching back to 'All'
  const allCatsRef = useRef<CategoryItem[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [gridItems, setGridItems] = useState<CategoryItem[]>([]);
  const [activeTopTab, setActiveTopTab] = useState<string>('all');
  const leftScrollRef = useRef<ScrollView>(null);
  const LEFT_ITEM_APPROX_HEIGHT = 52; // rough height for scroll positioning
  const isMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
  const [searchText, setSearchText] = useState('');

  const triggerSearch = () => {
    const q = searchText.trim();
    if (!q) return;
    navigation.navigate('Search', { initialQuery: q });
    Keyboard.dismiss();
  };

  // Fetch top nav categories (includes optional subCategories[] from API)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/navigation');
        if (!mounted) return;
        const arr: NavCategory[] = Array.isArray(data) ? data.map((n:any,i:number)=>({
          _id: n._id || String(i),
          name: n.name || n.slug || 'Tab',
            slug: n.slug,
            isActive: n.isActive,
            subCategories: Array.isArray(n.subCategories) ? n.subCategories.filter((sc:any)=> sc && sc.name && sc.slug) : []
        })) : [];
        setNavTabs([{ _id: 'all', name: t('common.all','All'), slug: 'all', isActive: true }, ...arr.slice(0,5)]);
      } catch (e) {
        if (!mounted) return;
        setNavTabs([
          { _id: 'all', name: t('common.all','All'), slug: 'all', isActive: true },
          { _id: 'women', name: t('navigation.women','Women') },
          { _id: 'curve', name: t('navigation.curve','Curve') },
          { _id: 'kids', name: t('navigation.kids','Kids') },
          { _id: 'men', name: t('navigation.men','Men') },
          { _id: 'home', name: t('navigation.home','Home') },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, [t]);

  // Fetch ALL categories initially
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/categories?active=true');
        if (!mounted) return;
        const cats: CategoryItem[] = Array.isArray(data) ? data.map((c:any)=>({ _id: c._id, name: c.name, slug: c.slug, image: c.image })) : [];
        allCatsRef.current = cats;
        setLeftCats(cats);
        setSelectedLeftId(cats[0]?._id || null);
      } catch (e) {
        if (!mounted) return;
        const fallback: CategoryItem[] = [
          'New In','Sale','Women Clothing','Beachwear','Electronics','Shoes','Men Clothing','Kids','Home & Kitchen','Curve','Underwear & Sleepwear','Jewelry & Accessories','Baby & Maternity','Sports & Outdoors','Beauty & Health','Home Textiles','Bags & Luggage','Office & School Supplies'
        ].map((name,i)=>({ _id: String(i+1), name }));
        allCatsRef.current = fallback;
        setLeftCats(fallback);
        setSelectedLeftId(fallback[0]?._id || null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When top navigation tab changes, update left categories accordingly
  useEffect(() => {
    // If 'all' restore full list
    if (activeTopTab === 'all') {
      setLeftCats(allCatsRef.current);
      setSelectedLeftId(allCatsRef.current[0]?._id || null);
      return;
    }
    const nav = navTabs.find(n => n._id === activeTopTab);
    if (nav && nav.subCategories && nav.subCategories.length) {
      const mapped: CategoryItem[] = nav.subCategories.map(sc => ({ _id: sc.slug, name: sc.name, slug: sc.slug }));
      setLeftCats(mapped);
      setSelectedLeftId(mapped[0]?._id || null);
    } else {
      // Fallback heuristic: filter original categories by nav name keyword
      const keyword = nav?.name?.toLowerCase() || '';
      if (keyword) {
        const filtered = allCatsRef.current.filter(c => c.name.toLowerCase().includes(keyword));
        if (filtered.length) {
          setLeftCats(filtered);
          setSelectedLeftId(filtered[0]._id);
          return;
        }
      }
      // If no matches keep all (avoid empty UI)
      setLeftCats(allCatsRef.current);
      setSelectedLeftId(allCatsRef.current[0]?._id || null);
    }
  }, [activeTopTab, navTabs]);

  // Fetch / derive grid items whenever selected left changes or top tab changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!selectedLeftId) { setGridItems([]); return; }
        // Attempt to fetch children (if backend supports a relation param like parent or category)
        const { data } = await api.get('/api/categories?parent=' + encodeURIComponent(selectedLeftId));
        if (!mounted) return;
        let arr: CategoryItem[] = Array.isArray(data) && data.length ? data.map((c:any)=>({ _id: c._id, name: c.name, image: c.image })) : [];
        // If API returned nothing, synthesize demo grid derived from selected left category name
        if (!arr.length) {
          const leftCategory = leftCats.find(c => c._id === selectedLeftId);
          const baseName = leftCategory?.name || 'Category';
          const seedWords = ['Mini','Classic','Premium','Sport','Casual','Eco','Trend','Essentials','Plus','Active','Limited'];
          arr = seedWords.map((w,i)=> ({ _id: 'synth_'+i, name: `${baseName} ${w}` }));
        }
        setGridItems(arr);
      } catch (e) {
        if (!mounted) return;
        const leftCategory = leftCats.find(c => c._id === selectedLeftId);
        const baseName = leftCategory?.name || 'Category';
        const seedWords = ['Mini','Classic','Premium','Sport','Casual','Eco','Trend','Essentials','Plus','Active','Limited'];
        const demo: CategoryItem[] = seedWords.map((w,i)=> ({ _id: 'err_'+i, name: `${baseName} ${w}` }));
        setGridItems(demo);
      }
    })();
    return () => { mounted = false; };
  }, [activeTopTab, selectedLeftId, leftCats]);

  const onPressGridItem = (item: CategoryItem) => {
    // Try to map grid item back to a left category (by id or fuzzy name match)
    const direct = leftCats.find(c => c._id === item._id);
    let target = direct;
    if (!target) {
      const lower = item.name.toLowerCase();
      target = leftCats.find(c => lower.includes(c.name.toLowerCase().split(' ')[0]));
    }
    if (target) {
      setSelectedLeftId(target._id);
      // Scroll left list so selected item is visible (best-effort)
      const idx = leftCats.findIndex(c => c._id === target!._id);
      if (idx >= 0 && leftScrollRef.current) {
        leftScrollRef.current.scrollTo({ y: Math.max(0, idx * LEFT_ITEM_APPROX_HEIGHT - 20), animated: true });
      }
    } else {
      // Fallback: navigate to product list if we can't map it
      navigation.navigate('ProductList', { category: item._id });
    }
  };

  return (
    <View style={styles.root}>
      {/* Header row */}
  <View style={[styles.headerWrap, { paddingTop: insets.top }]}> 
         <View style={styles.searchContainer}>
          <View style={styles.searchBar}> 
            <TextInput
              placeholder={t('category.searchPlaceholder','Search products')}
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={triggerSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchIconBtn} accessibilityLabel="Search" onPress={triggerSearch}>
            <Ionicons name="search-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.iconBtn} onPress={()=> navigation.navigate('Wishlist')} accessibilityLabel={t('common.wishlist','Wishlist')}>
          <Ionicons name="heart-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Tabs strip */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {navTabs.map(tab => {
            const active = tab._id === activeTopTab;
            return (
              <TouchableOpacity
                key={tab._id}
                onPress={() => setActiveTopTab(tab._id)}
                style={styles.topTabBtn}
                accessibilityRole="button"
              >
                <Text style={[styles.topTabText, active && styles.topTabTextActive]}>{tab.name}</Text>
                {active && <View style={styles.topTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.contentRow}>
        {/* Left vertical categories */}
        <View style={[styles.leftPane, { width: LEFT_PANE_WIDTH }]}>
          <ScrollView ref={leftScrollRef} contentContainerStyle={{ paddingVertical: 8 }}>
            {leftCats.map(cat => {
              const active = cat._id === selectedLeftId;
              return (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() => {
                    setSelectedLeftId(cat._id);
                    // Try: if cat._id is a real ObjectId, navigate directly.
                    if (isMongoId(cat._id)) {
                      navigation.navigate('ProductList', { category: cat._id });
                    } else {
                      // Attempt to resolve slug to a real category id from the master list
                      const matched = allCatsRef.current.find(c => c.slug && (c.slug === cat.slug || c.slug === cat._id));
                      if (matched && isMongoId(matched._id)) {
                        navigation.navigate('ProductList', { category: matched._id });
                      } else {
                        // Fallback: pass a slug param (ProductList could be extended to support) or show synthetic products
                        navigation.navigate('ProductList', { categorySlug: cat.slug || cat._id });
                      }
                    }
                  }}
                  style={[styles.leftItem, active && styles.leftItemActive]}
                >
                  <Text
                    style={[styles.leftItemText, active && styles.leftItemTextActive]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main scrollable grid area */}
        <ScrollView 
          style={styles.gridPane} 
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (insets.bottom||0) + 140 }}
        >
          {/* Section headers */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('category.justForYou','Just for You')}</Text>
            <Text style={styles.sectionTitleSecondary}>{t('category.picksForYou','Picks for You')}</Text>
          </View>

          {/* Grid */}
          <View style={styles.gridWrap}>
            {gridItems.map((item, idx) => {
              const bg = circleColors[idx % circleColors.length];
              return (
                <TouchableOpacity key={item._id} style={styles.gridCard} onPress={() => onPressGridItem(item)}>
                  <View style={[styles.circle, { backgroundColor: bg }]}> 
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.circleImage} />
                    ) : (
                      <Text style={styles.circleText}>{item.name.slice(0,1)}</Text>
                    )}
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trends store section */}
          <View style={styles.trendsSection}>
            <Text style={styles.trendsTitle}>trends store</Text>
            <View style={styles.gridWrap}>
              {['View All','Soleia','Slaydiva','Aurora','Nova','Zephyr'].map((nm,i)=> (
                <TouchableOpacity key={nm} style={styles.gridCard}>
                  <View style={[styles.circle,{ backgroundColor: circleColors[(i+3)%circleColors.length] }]}> 
                    <Text style={styles.circleText}>{nm.slice(0,1)}</Text>
                  </View>
                  <Text style={styles.gridLabel} numberOfLines={2}>{nm}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <BottomTabBar
        active="category"
        cartCount={cartCount}
        onHome={() => navigation.navigate('Home')}
        onCategory={() => {/* stay */}}
        onTrends={() => navigation.navigate('Category')}
        onCart={() => navigation.navigate('Cart')}
        onMe={() => navigation.navigate('Profile')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  headerWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#fff' 
  },
  iconBtn: { 
    padding: 8, 
    position: 'relative'
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  searchBar: { 
    flex: 1,
    height: 40, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 20, 
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginRight: 8,
  },
  searchInput: { 
    fontSize: 14, 
    color: '#111',
    fontWeight: '400',
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#666',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tabsContainer: { 
    backgroundColor: '#fff', 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  topTabBtn: { 
    marginRight: 24, 
    paddingVertical: 8,
    alignItems: 'center' 
  },
  topTabText: { 
    fontSize: 16, 
    color: '#666', 
    fontWeight: '500' 
  },
  topTabTextActive: { 
    color: '#111', 
    fontWeight: '700' 
  },
  topTabUnderline: { 
    marginTop: 4, 
    height: 3, 
    width: '100%',
    backgroundColor: '#111',
  },
  contentRow: { 
    flex: 1, 
    flexDirection: 'row' 
  },
  leftPane: { 
    backgroundColor: '#fafafa',
  },
  leftItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  leftItemActive: { 
    backgroundColor: '#fff',
    borderLeftColor: '#111',
  },
  leftItemText: { 
    fontSize: 12, 
    lineHeight: 16, 
    color: '#666',
    textAlign: 'left',
  },
  leftItemTextActive: { 
    fontWeight: '600', 
    color: '#111' 
  },
  gridPane: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111' 
  },
  sectionTitleSecondary: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111' 
  },
  gridWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridCard: { 
    width: '33.333%', 
    paddingVertical: 12, 
    paddingHorizontal: 8, 
    alignItems: 'center' 
  },
  circle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#eee', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8, 
    overflow: 'hidden' 
  },
  circleImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  circleText: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#111' 
  },
  gridLabel: { 
    fontSize: 12, 
    textAlign: 'center', 
    color: '#111',
    lineHeight: 16,
  },
  trendsSection: {
    marginTop: 32,
    paddingTop: 16,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#111',
    marginBottom: 16,
  },
});

export default CategoryScreen;