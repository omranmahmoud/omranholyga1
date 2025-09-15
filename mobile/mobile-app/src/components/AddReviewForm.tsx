import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addProductReview } from '../services/productService';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '../services/cloudinaryUpload';

interface Props {
  productId: string;
  onAdded: () => void;
}

export const AddReviewForm: React.FC<Props> = ({ productId, onAdded }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fit, setFit] = useState<number | undefined>();
  const [quality, setQuality] = useState<number | undefined>();

  const pickImages = async () => {
    if (localPhotos.length >= 5) return Alert.alert(t('common.limit'), t('reviews.maxPhotos', { count: 5 }));
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permission'), t('reviews.photosPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 5 - localPhotos.length,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (result.canceled) return;
    try {
      setUploading(true);
      const picked = result.assets || [];
      const uploaded: string[] = [];
      for (const asset of picked) {
        if (!asset.uri) continue;
        const { url } = await uploadImageAsync(asset.uri);
        uploaded.push(url);
      }
      setLocalPhotos(prev => [...prev, ...uploaded].slice(0,5));
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    setLocalPhotos(p => p.filter(u => u !== url));
  };

  const submit = async () => {
    if (!rating || comment.trim().length < 10) {
      Alert.alert(t('common.error'), t('reviews.validation'));
      return;
    }
    try {
      setLoading(true);
  await addProductReview(productId, { rating, comment, photos: localPhotos, fit, quality });
  setRating(0); setComment(''); setLocalPhotos([]); setFit(undefined); setQuality(undefined);
      onAdded();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('reviews.addYourReview')}</Text>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_,i)=>(
          <TouchableOpacity key={i} onPress={() => setRating(i+1)}>
            <Ionicons name={i < rating ? 'star' : 'star-outline'} size={30} color={i < rating ? '#f59e0b' : '#d1d5db'} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder={t('reviews.commentPlaceholder')}
        multiline
        numberOfLines={4}
      />
      <View style={styles.metaRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>{t('reviews.fit')}</Text>
          <View style={styles.metricChoices}>
            {[1,2,3,4,5].map(v => (
              <TouchableOpacity key={v} style={[styles.metricPill, fit===v && styles.metricPillActive]} onPress={()=>setFit(v)}>
                <Text style={[styles.metricPillTxt, fit===v && styles.metricPillTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.metricHint}>{t('reviews.fitScale')}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>{t('reviews.quality')}</Text>
          <View style={styles.metricChoices}>
            {[1,2,3,4,5].map(v => (
              <TouchableOpacity key={v} style={[styles.metricPill, quality===v && styles.metricPillActive]} onPress={()=>setQuality(v)}>
                <Text style={[styles.metricPillTxt, quality===v && styles.metricPillTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.metricHint}>{t('reviews.qualityScale')}</Text>
        </View>
      </View>
      <View style={styles.photosRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{alignItems:'center'}}>
          {localPhotos.map(p => (
            <View key={p} style={styles.photoWrap}>
              <Image source={{ uri: p }} style={styles.photo} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(p)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {localPhotos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages} disabled={uploading}>
              {uploading ? <ActivityIndicator /> : <Ionicons name="image" size={20} color="#374151" />}
              <Text style={styles.addPhotoTxt}>{t('reviews.addPhotos')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>{t('common.submit')}</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:16, backgroundColor:'#fff' },
  header: { fontSize:16, fontWeight:'700', color:'#111', marginBottom:12 },
  starsRow: { flexDirection:'row', gap:4, marginBottom:12 },
  input: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, padding:10, textAlignVertical:'top', fontSize:14, color:'#111', backgroundColor:'#fafafa' },
  photosRow: { marginTop:12, minHeight:70 },
  metaRow: { marginTop:16, flexDirection:'row', gap:16 },
  metricBlock: { flex:1 },
  metricLabel: { fontSize:12, fontWeight:'700', color:'#111', marginBottom:6 },
  metricChoices: { flexDirection:'row', flexWrap:'wrap', gap:6 },
  metricPill: { width:32, height:32, borderRadius:16, borderWidth:1, borderColor:'#d1d5db', alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  metricPillActive: { backgroundColor:'#111827', borderColor:'#111827' },
  metricPillTxt: { fontSize:12, fontWeight:'600', color:'#374151' },
  metricPillTxtActive: { color:'#fff' },
  metricHint: { marginTop:4, fontSize:10, color:'#6b7280' },
  addPhotoBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingHorizontal:12, gap:6, height:60, borderWidth:1, borderColor:'#d1d5db', borderRadius:8, backgroundColor:'#f9fafb', marginRight:8 },
  addPhotoTxt: { fontSize:12, color:'#374151', fontWeight:'600' },
  photoWrap: { width:60, height:60, marginRight:8, borderRadius:8, overflow:'hidden', position:'relative' },
  photo: { width:'100%', height:'100%' },
  removeBtn: { position:'absolute', top:2, right:2, backgroundColor:'rgba(0,0,0,0.6)', borderRadius:10, padding:2 },
  submitBtn: { marginTop:12, backgroundColor:'#111827', borderRadius:8, alignItems:'center', justifyContent:'center', height:46 },
  submitTxt: { color:'#fff', fontWeight:'700' }
});
