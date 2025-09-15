import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { addProductReview, fetchProductReviews, markReviewHelpful, reportReview, fetchReviewEligibility } from '../services/productService';
import { AddReviewForm } from './AddReviewForm';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt?: string;
  helpful?: number;
  user?: { name?: string };
  photos?: string[];
  fit?: number;
  quality?: number;
}

interface Props {
  productId: string;
  initialReviews?: Review[];
}

export const ReviewSection: React.FC<Props> = ({ productId, initialReviews }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [eligibility, setEligibility] = useState<{canReview:boolean;purchased:boolean;alreadyReviewed:boolean}|null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProductReviews(productId);
      setReviews(data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { (async()=>{ try { const e = await fetchReviewEligibility(productId); setEligibility(e); } catch{} })(); }, [productId]);

  const doHelpful = async (id: string) => {
    try { await markReviewHelpful(productId, id); load(); } catch {}
  };
  const doReport = async (id: string) => {
    Alert.alert(t('reviews.report'), t('reviews.confirmReport'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.ok'), style: 'destructive', onPress: async () => { try { await reportReview(productId, id, 'inappropriate'); load(); } catch {} } }
    ]);
  };

  const average = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) : 0;
  const fitValues = reviews.filter(r=>typeof r.fit==='number').map(r=>r.fit as number);
  const qualityValues = reviews.filter(r=>typeof r.quality==='number').map(r=>r.quality as number);
  const avgFit = fitValues.length ? fitValues.reduce((a,b)=>a+b,0)/fitValues.length : 0;
  const avgQuality = qualityValues.length ? qualityValues.reduce((a,b)=>a+b,0)/qualityValues.length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{t('common.reviews')} ({reviews.length})</Text>
        <View style={styles.avgRow}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.avgText}>{average.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          {loading ? <ActivityIndicator size="small" /> : <Ionicons name="refresh" size={16} color="#111" />}
        </TouchableOpacity>
      </View>
      <View>
        {(expanded ? reviews : reviews.slice(0,3)).map(item => (
          <View key={item._id} style={styles.reviewCard}>
            <View style={styles.row}>
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_,i)=>(
                  <Ionicons key={i} name="star" size={14} color={i < item.rating ? '#f59e0b' : '#d1d5db'} />
                ))}
              </View>
              <Text style={styles.by}>{item.user?.name || 'Anon'}</Text>
              <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
            {!!item.photos?.length && (
              <View style={styles.photosRow}>
                {item.photos.slice(0,5).map(ph => (
                  <Image key={ph} source={{ uri: ph }} style={styles.reviewPhoto} />
                ))}
              </View>
            )}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => doHelpful(item._id)}>
                <Ionicons name="thumbs-up" size={14} color="#111" />
                <Text style={styles.actionTxt}>{item.helpful || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => doReport(item._id)}>
                <Ionicons name="flag" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {reviews.length > 3 && (
          <TouchableOpacity style={styles.toggleMore} onPress={() => setExpanded(e=>!e)}>
            <Text style={styles.toggleTxt}>{expanded ? t('common.showLess') : t('common.showMore')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {(fitValues.length>0 || qualityValues.length>0) && (
        <View style={styles.breakdownsSection}>
          {fitValues.length>0 && (
            <View style={styles.breakRow}>
              <Text style={styles.breakLabel}>{t('reviews.fit')}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill,{ width: `${(avgFit/5)*100}%` }]} />
              </View>
              <Text style={styles.breakValue}>{avgFit.toFixed(1)}</Text>
            </View>
          )}
          {qualityValues.length>0 && (
            <View style={styles.breakRow}>
              <Text style={styles.breakLabel}>{t('reviews.quality')}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill,{ width: `${(avgQuality/5)*100}%` }]} />
              </View>
              <Text style={styles.breakValue}>{avgQuality.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}
      {eligibility?.canReview && (
        <AddReviewForm productId={productId} onAdded={load} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 32, paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  header: { fontSize: 18, fontWeight: '700', color: '#111' },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgText: { fontWeight: '700', color: '#111' },
  refreshBtn: { marginLeft: 'auto', width:32, height:32, borderRadius:16, borderWidth:1, borderColor:'#e5e7eb', alignItems:'center', justifyContent:'center' },
  reviewCard: { backgroundColor:'#fff', borderWidth:1, borderColor:'#f1f1f1', borderRadius:8, padding:12, marginBottom:12 },
  row: { flexDirection:'row', alignItems:'center', gap:8 },
  ratingRow: { flexDirection:'row', gap:2 },
  by: { fontSize:12, color:'#374151', fontWeight:'600' },
  date: { marginLeft:'auto', fontSize:11, color:'#9ca3af' },
  comment: { marginTop:6, fontSize:13, lineHeight:18, color:'#111' },
  actions: { flexDirection:'row', marginTop:8, gap:12 },
  actionBtn: { flexDirection:'row', gap:4, alignItems:'center' },
  actionTxt: { fontSize:12, color:'#111' },
  toggleMore: { paddingVertical:8, alignItems:'center' },
  toggleTxt: { color:'#111', fontWeight:'600' },
  photosRow: { flexDirection:'row', marginTop:8, gap:6, flexWrap:'wrap' },
  reviewPhoto: { width:60, height:60, borderRadius:6, backgroundColor:'#f3f4f6' }
  ,breakdownsSection: { marginTop:12, marginBottom:8, backgroundColor:'#fff', borderRadius:8, padding:12, borderWidth:1, borderColor:'#f1f1f1', gap:10 },
  breakRow: { flexDirection:'row', alignItems:'center', gap:8 },
  breakLabel: { width:60, fontSize:12, fontWeight:'600', color:'#374151' },
  barTrack: { flex:1, height:10, backgroundColor:'#e5e7eb', borderRadius:5, overflow:'hidden' },
  barFill: { height:'100%', backgroundColor:'#111827' },
  breakValue: { width:40, textAlign:'right', fontSize:12, fontWeight:'600', color:'#111' }
});
