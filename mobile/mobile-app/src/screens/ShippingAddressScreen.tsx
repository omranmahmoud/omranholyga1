import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, I18nManager, Platform, Modal, FlatList, Switch, Linking, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import * as Localization from 'expo-localization';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { findCountry, COUNTRIES } from '../data/countries';
import { loadStoredAddress, saveStoredAddress } from '../storage/address';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Legacy inline maps replaced by central dataset in data/countries.ts

interface AddressState {
  country?: string;
  countryCode?: string;
  phoneCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phone2?: string; // optional secondary phone
  city?: string;
  state?: string;
  zip?: string;
  line1?: string;
  line2?: string;
}

export default function ShippingAddressScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [addr, setAddr] = useState<AddressState>({});
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const isRTL = I18nManager.isRTL;
  const [makeDefault, setMakeDefault] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listeners to avoid overlap
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const detectLocation = useCallback(async () => {
    setLoadingLoc(true);
    try {
      setDetectionError(null);
      let granted = false;
      const { status } = await Location.requestForegroundPermissionsAsync();
      granted = status === 'granted';
      if (granted) {
        const pos = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        const first = geo[0];
        if (first) {
          const countryCode = (first.isoCountryCode || '').toUpperCase();
          const dataset = findCountry(countryCode);
          setAddr(a => ({
            ...a,
            country: first.country || dataset?.name || a.country || countryCode,
            countryCode,
            phoneCode: dataset?.dial || a.phoneCode,
            city: first.city || first.subregion || a.city,
            state: first.region || a.state,
          }));
          if (!countryCode) {
            setDetectionError('NO_COUNTRY_CODE');
          }
          return; // success path
        }
      }
      // Fallback to device locale if geocode not available
      const firstLocale = (Localization.getLocales && Localization.getLocales()[0]) || undefined;
      const localeCountry = (firstLocale?.regionCode || '').toUpperCase();
      if (localeCountry) {
        const dataset = findCountry(localeCountry);
        setAddr(a => ({
          ...a,
          country: a.country || dataset?.name || localeCountry,
          countryCode: a.countryCode || localeCountry,
          phoneCode: a.phoneCode || dataset?.dial,
        }));
      } else {
        setDetectionError('NO_LOCALE_COUNTRY');
      }
    } catch {
      const firstLocale = (Localization.getLocales && Localization.getLocales()[0]) || undefined;
      const localeCountry = (firstLocale?.regionCode || '').toUpperCase();
      if (localeCountry) {
        const dataset = findCountry(localeCountry);
        setAddr(a => ({
          ...a,
          country: a.country || dataset?.name || localeCountry,
          countryCode: a.countryCode || localeCountry,
          phoneCode: a.phoneCode || dataset?.dial,
        }));
      } else {
        setDetectionError('FALLBACK_FAILED');
      }
    } finally {
      setLoadingLoc(false);
    }
  }, []);

  // initial detect
  useEffect(() => { detectLocation(); }, [detectLocation]);

  // load stored address (if default) on mount
  useEffect(() => {
    (async () => {
      const stored = await loadStoredAddress();
      if (stored) {
        setAddr(a => ({ ...a, ...stored }));
        if (stored.countryCode && !stored.country) {
          const dataset = findCountry(stored.countryCode);
          if (dataset) setAddr(a => ({ ...a, country: dataset.name }));
        }
        if (stored.makeDefault) setMakeDefault(true);
      }
    })();
  }, []);

  const canContinue = useMemo(() => !!(addr.firstName && addr.lastName && addr.phone && addr.country && addr.city && addr.line1), [addr]);

  const update = (patch: Partial<AddressState>) => setAddr(prev => ({ ...prev, ...patch }));

  const goNext = () => {
    if (!canContinue) return;
    const finalAddress = { ...addr, makeDefault };
    if (makeDefault) {
      saveStoredAddress(finalAddress);
    }
    navigation.navigate('Checkout', { address: finalAddress });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel={t('common.close')}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#111" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('checkout.shippingAddress', { defaultValue: 'Shipping Address' })}</Text>
        <View style={{ width: 40 }} />
      </View>
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 + keyboardHeight }} keyboardShouldPersistTaps="handled">
        {/* Country / Location (non-editable for now) */}
        <FieldLabel text={t('checkout.location', { defaultValue: 'Location' })} required />
        <View style={styles.locationRow}>
          <TouchableOpacity disabled={loadingLoc} onPress={() => setCountryPickerVisible(true)} style={[styles.selectBox, { flex: 1, opacity: loadingLoc ? 0.6 : 1 }]}> 
            {loadingLoc ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.selectValue}>{addr.countryCode ? t(`countries.${addr.countryCode}`, { defaultValue: addr.country || addr.countryCode }) : (addr.country || t('checkout.detecting', { defaultValue: 'Detecting...' }))}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel={t('checkout.retryDetect', { defaultValue: 'Retry detection' })} onPress={detectLocation} style={styles.redetectBtn}>
            {loadingLoc ? <ActivityIndicator size="small" /> : <Ionicons name="refresh" size={20} color="#111" />}
          </TouchableOpacity>
        </View>
        {!!detectionError && !loadingLoc && !addr.country && (
          <Text style={styles.errorText}>
            {detectionError === 'NO_COUNTRY_CODE' && 'Unable to read country from GPS result.'}
            {detectionError === 'NO_LOCALE_COUNTRY' && 'Device locale missing region; set a region in device settings.'}
            {detectionError === 'FALLBACK_FAILED' && 'Automatic detection failed. Please enable Location Services and retry.'}
          </Text>
        )}
        {!!detectionError && !addr.country && (
          <TouchableOpacity style={styles.manualSelectHint} onPress={() => setCountryPickerVisible(true)}>
            <Text style={styles.manualSelectHintText}>Select country manually</Text>
          </TouchableOpacity>
        )}
        <Separator />
        <FieldInput required placeholder={t('checkout.firstName', { defaultValue: 'First Name' })} value={addr.firstName} onChangeText={v => update({ firstName: v })} rtl={isRTL} />
        <FieldInput required placeholder={t('checkout.lastName', { defaultValue: 'Last Name' })} value={addr.lastName} onChangeText={v => update({ lastName: v })} rtl={isRTL} />
        <FieldLabel text={t('checkout.phone', { defaultValue: 'Phone Number' })} required />
        <View style={[styles.phoneRow, isRTL && styles.phoneRowRTL]}>
          <View style={styles.phoneCodeBox}>
            <Text style={styles.phoneCodeText}>{addr.countryCode} {addr.phoneCode}</Text>
          </View>
          <TextInput
            style={[styles.phoneInput, isRTL && styles.rtlText]}
            keyboardType="phone-pad"
            placeholder={t('checkout.phonePlaceholder', { defaultValue: 'Your phone' })}
            value={addr.phone}
            onChangeText={v => update({ phone: v })}
          />
        </View>
        <Text style={styles.helper}>{t('checkout.phoneHint', { defaultValue: 'Need correct phone number for delivery.' })}</Text>
        {/* Secondary phone (optional) */}
        <View style={[styles.phoneRow, { marginTop: 10 }, isRTL && styles.phoneRowRTL]}>
          <View style={styles.phoneCodeBox}>
            <Text style={styles.phoneCodeText}>{addr.countryCode} {addr.phoneCode}</Text>
          </View>
          <TextInput
            style={[styles.phoneInput, isRTL && styles.rtlText]}
            keyboardType="phone-pad"
            placeholder={t('checkout.phone2Placeholder', { defaultValue: 'Second phone (optional)' })}
            value={addr.phone2}
            onChangeText={v => update({ phone2: v })}
          />
        </View>
        <Separator />
  <FieldInput required placeholder={t('checkout.city', { defaultValue: 'City' })} value={addr.city} onChangeText={v => update({ city: v })} rtl={isRTL} />
        <FieldInput required placeholder={t('checkout.address1', { defaultValue: 'Address Line 1*' })} value={addr.line1} onChangeText={v => update({ line1: v })} rtl={isRTL} />
        <FieldInput placeholder={t('checkout.address2', { defaultValue: 'Address Line 2' })} value={addr.line2} onChangeText={v => update({ line2: v })} rtl={isRTL} />

        <View style={[styles.makeDefaultRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.makeDefaultLabel, isRTL && styles.rtlText]}>{t('checkout.makeDefault', { defaultValue: 'Make Default' })}</Text>
          <Switch value={makeDefault} onValueChange={setMakeDefault} trackColor={{ false: '#d1d5db', true: '#111' }} thumbColor={'#fff'} />
        </View>
        <Separator />
        <View style={styles.securityBox}>
          <View style={[styles.securityTitleRow, isRTL && { flexDirection: 'row-reverse' }]}> 
            <Ionicons name="lock-closed-outline" size={20} color="#065f46" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text style={[styles.securityTitle, isRTL && styles.rtlText]}>{t('checkout.securityTitle', { defaultValue: 'Security & Privacy' })}</Text>
          </View>
          <Text style={[styles.securityDesc, isRTL && styles.rtlText]}>{t('checkout.securityDesc', { defaultValue: 'We maintain industry-standard physical, technical, and administrative measures to safeguard your personal information.' })}</Text>
        </View>
      </ScrollView>
  <View style={[styles.footer, keyboardHeight > 0 && { bottom: keyboardHeight }]}> 
        <TouchableOpacity disabled={!canContinue} onPress={goNext} style={[styles.nextBtn, !canContinue && { opacity: 0.5 }]}>
          <Text style={styles.nextBtnText}>{t('checkout.save', { defaultValue: 'SAVE' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.policyLink} onPress={() => Linking.openURL('https://example.com/privacy')}>
          <Text style={styles.policyLinkText}>{t('checkout.privacyPolicy', { defaultValue: 'Privacy & Cookie Policy' })}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={countryPickerVisible} animationType="slide" onRequestClose={() => setCountryPickerVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}> 
            <TouchableOpacity onPress={() => setCountryPickerVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name={isRTL ? 'close' : 'close'} size={22} color="#111" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>Select Country</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TextInput
              placeholder="Search country"
              value={searchCountry}
              onChangeText={setSearchCountry}
              style={[styles.input, isRTL && styles.rtlText]}
            />
          </View>
          <FlatList
            data={COUNTRIES.filter(c => {
              if (!searchCountry) return true;
              const q = searchCountry.toLowerCase();
              const localized = t(`countries.${c.code}`, { defaultValue: c.name }).toLowerCase();
              return c.name.toLowerCase().includes(q) || localized.includes(q) || (c.aliases && c.aliases.some(a => a.toLowerCase().includes(q)));
            })}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setAddr(a => ({ ...a, country: item.name, countryCode: item.code, phoneCode: item.dial }));
                  setCountryPickerVisible(false);
                  setDetectionError(null);
                }}
              >
                <Text style={styles.countryRowText}>{t(`countries.${item.code}`, { defaultValue: item.name })}</Text>
                <Text style={styles.countryRowDial}>{item.dial}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>{text}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}</Text>
  );
}

function FieldInput({ placeholder, value, onChangeText, required, rtl }: { placeholder: string; value?: string; onChangeText: (v: string) => void; required?: boolean; rtl?: boolean }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <TextInput
        style={[styles.input, rtl && styles.rtlText]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: Platform.OS === 'android' ? 72 : 48, paddingBottom: 8 },
  headerRTL: { flexDirection: 'row-reverse' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  selectBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, height: 48, backgroundColor: '#f9fafb' },
  selectValue: { fontSize: 14, color: '#111' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  redetectBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  sep: { height: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, height: 48, backgroundColor: '#fff', fontSize: 14, color: '#111' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phoneRowRTL: { flexDirection: 'row-reverse' },
  phoneCodeBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, height: 48, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  phoneCodeText: { fontSize: 13, color: '#111', fontWeight: '600' },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, height: 48, backgroundColor: '#fff', fontSize: 14, color: '#111' },
  helper: { marginTop: 4, fontSize: 11, color: '#9ca3af' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
  nextBtn: { backgroundColor: '#111', borderRadius: 10, height: 52, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 6 },
  manualSelectHint: { marginTop: 8 },
  manualSelectHintText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: Platform.OS === 'android' ? 40 : 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  modalTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111' },
  modalCloseBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  countryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  countryRowText: { fontSize: 14, color: '#111', fontWeight: '500' },
  countryRowDial: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  makeDefaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  makeDefaultLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  securityBox: { marginTop: 20 },
  securityTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  securityTitle: { fontSize: 14, fontWeight: '700', color: '#064e3b' },
  securityDesc: { fontSize: 13, color: '#374151', lineHeight: 18 },
  policyLink: { marginTop: 16, alignItems: 'center' },
  policyLinkText: { fontSize: 12, color: '#111', textDecorationLine: 'underline' }
});
