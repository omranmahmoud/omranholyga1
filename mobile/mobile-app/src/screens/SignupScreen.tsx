import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as Localization from 'expo-localization';
import { findCountry } from '../data/countries';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { fetchStoreSettings } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from 'expo-constants';
WebBrowser.maybeCompleteAuthSession();

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(route?.params?.prefillIdentifier || ''); // email or phone
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [dialCode, setDialCode] = useState<string>('+1');
  const [showCountryList, setShowCountryList] = useState(false);
  const [storeName, setStoreName] = useState<string>('');
  const [stage, setStage] = useState<'identifier' | 'details'>('identifier');

  const isEmail = /\S+@\S+\.\S+/.test(identifier);
  const isPotentialPhone = /^[0-9+()\s-]+$/.test(identifier) && !isEmail && identifier.length > 0;
  // Normalize a user-entered phone number to E.164-ish using detected dial code.
  // Steps:
  // 1. Strip non-digits (keep plus only to detect if already international)
  // 2. If it already starts with + and appears to include a country code, return +digits
  // 3. Otherwise remove leading zeros from local part and prepend detected dial code
  const normalizePhone = (raw: string) => {
    if (!raw) return raw;
    const onlyDigitsPlus = raw.replace(/[^0-9+]/g, '');
    if (onlyDigitsPlus.startsWith('+')) {
      // Remove any non-digit after plus just in case and collapse
      const digits = onlyDigitsPlus.replace(/(?!^)[^0-9]/g,'').replace(/^\++/, '');
      return '+' + digits;
    }
    const digits = onlyDigitsPlus.replace(/[^0-9]/g,'');
    const dialDigits = (dialCode || '+1').replace(/[^0-9]/g,'') || '1';
    // Remove all leading zeros from what user typed (local format like 05... -> 5...)
    const localTrimmed = digits.replace(/^0+/, '');
    // Avoid double country code: if user already typed country code digits at start, keep them
    if (localTrimmed.startsWith(dialDigits)) {
      return '+' + localTrimmed;
    }
    return '+' + dialDigits + localTrimmed;
  };

  const phoneToEmail = (rawOrNormalized: string) => {
    const digits = rawOrNormalized.replace(/[^0-9]/g,'');
    return `p${digits}@phone.local`; // synthetic stable email for backend uniqueness
  };
  const nameValid = name.trim().length >= 2;
  const passwordValid = password.length >= 6;
  const canSubmit = (isEmail || isPotentialPhone) && nameValid && passwordValid && !loading;

  const handleContinue = async () => {
    if (!identifier.trim()) return;
    Keyboard.dismiss();
    if (!(isEmail || isPotentialPhone)) {
      Alert.alert(t('common.error'), t('signup.emailInvalid'));
      return;
    }
    try {
      setLoading(true);
      // Normalize phone if needed to maximize match accuracy
      let idForCheck = identifier.trim();
      if (isPotentialPhone) {
        idForCheck = normalizePhone(identifier);
      }
      const res = await api.post('/api/auth/check-identifier', { identifier: idForCheck });
      if (res.data?.exists) {
        Alert.alert(t('signup.existsTitle', 'Account Exists'), t('signup.existsLogin', 'We found an account. Please sign in.'));
        navigation.replace('Login', { redirect: 'Home', prefillIdentifier: idForCheck });
        return;
      }
      setStage('details');
    } catch (e:any) {
      Alert.alert(t('common.error'), e?.response?.data?.message || e?.message || 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!(isEmail || isPotentialPhone)) {
      Alert.alert(t('common.error'), t('signup.emailInvalid'));
      return;
    }
    if (!canSubmit) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      let normalizedPhone: string | undefined;
      if (isPotentialPhone) {
        normalizedPhone = normalizePhone(identifier);
      }
      const payload = {
        name: name.trim(),
        email: (isEmail ? identifier.trim().toLowerCase() : phoneToEmail(normalizedPhone || identifier)).toLowerCase(),
        password,
        phoneNumber: normalizedPhone
      };
      const res = await api.post('/api/auth/register', payload);
      if (res.data?.token && res.data?.user) {
        await login(res.data.token, res.data.user);
        Alert.alert(t('signup.welcome'), t('login.welcomeUser', { name: res.data.user.name }));
        navigation.replace('Home');
      } else {
        Alert.alert(t('signup.success'), t('signup.successLogin'));
        navigation.replace('Login');
      }
    } catch (err:any) {
      const msg = err?.response?.data?.message || err?.message || t('common.errorMessage');
      // If user exists, send them to Login screen with prefilled identifier and directly to password stage
      if (/already exists|already registered|User already exists/i.test(msg)) {
        Alert.alert(t('signup.existsTitle', 'Account Exists'), t('signup.existsLogin', 'We found an account. Please sign in.'));
        navigation.replace('Login', { redirect: 'Home', prefillIdentifier: identifier });
        return;
      }
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  // Google Auth (provider hook)
  const extras = (Constants?.expoConfig as any)?.extra || {};
  const webClientId = extras.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const iosClientId = extras.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const androidClientId = extras.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
  const facebookAppId = extras.EXPO_PUBLIC_FACEBOOK_APP_ID || undefined;
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    iosClientId,
    androidClientId,
    scopes: ['openid','profile','email'],
  });
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({ clientId: facebookAppId || 'FACEBOOK_APP_ID_MISSING' });

  useEffect(() => {
    const run = async () => {
      if (googleResponse?.type === 'success' && googleResponse.authentication?.idToken) {
        try {
          setLoading(true);
          const idToken = googleResponse.authentication.idToken;
          const res = await api.post('/api/auth/google', { idToken });
          if (res.data?.token && res.data?.user) {
            await login(res.data.token, res.data.user);
            Alert.alert(t('signup.welcome'), t('login.welcomeUser', { name: res.data.user.name }));
            navigation.replace('Home');
          } else {
            Alert.alert(t('common.error'), 'Invalid response from server');
          }
        } catch (e: any) {
          Alert.alert(t('common.error'), e?.message || 'Google auth failed');
        } finally {
          setLoading(false);
        }
      }
    };
    run();
  }, [googleResponse]);

  useEffect(() => {
    const run = async () => {
      if (fbResponse?.type === 'success' && fbResponse.authentication?.accessToken) {
        try {
          setLoading(true);
          const accessToken = fbResponse.authentication.accessToken;
          const res = await api.post('/api/auth/facebook', { accessToken });
          if (res.data?.token && res.data?.user) {
            await login(res.data.token, res.data.user);
            Alert.alert(t('signup.welcome'), t('login.welcomeUser', { name: res.data.user.name }));
            navigation.replace('Home');
          } else {
            Alert.alert(t('common.error'), 'Invalid response from server');
          }
        } catch (e: any) {
          Alert.alert(t('common.error'), e?.message || 'Facebook auth failed');
        } finally {
          setLoading(false);
        }
      }
    };
    run();
  }, [fbResponse]);

  useEffect(() => {
    try {
      const locales = Localization.getLocales();
      const region = locales?.[0]?.regionCode || (Localization as any)?.region || undefined;
      if (region) {
        const c = findCountry(region);
        if (c) { setDetectedCountry(c.name); setDialCode(c.dial || '+1'); } else { setDetectedCountry(region); setDialCode('+1'); }
        setCountryCode(region);
      } else { setDetectedCountry(null); setDialCode('+1'); }
    } catch (e) {
      setDetectedCountry(null);
      setCountryCode(null);
    }
  }, []);

  // Fetch store settings for store name
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await fetchStoreSettings();
        if (mounted) setStoreName(settings?.name || settings?.siteTitle || '');
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleGoogleSignup = async () => {
    if (loading) return;
    if (!webClientId) {
      Alert.alert('Google', 'Missing Web client ID');
      return;
    }
    try {
      await googlePromptAsync();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Google auth failed');
    }
  };

  const handleFacebookSignup = async () => {
    if (loading) return;
    if (!facebookAppId) {
      Alert.alert('Facebook', 'Missing Facebook App ID');
      return;
    }
    try {
      await fbPromptAsync();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Facebook auth failed');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('Home')}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        {storeName ? (
          <Text style={styles.storeName}>
            {storeName}
            {countryCode ? <Text style={styles.countryCodeSmall}> {countryCode}</Text> : null}
          </Text>
        ) : null}
        {storeName ? (
          <View style={styles.protectedLine}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.protectedText}>{t('auth.dataProtected', 'Your data is protected.')}</Text>
          </View>
        ) : null}
        <View style={styles.middleContent}>
        {stage === 'identifier' && (
          <View style={isPotentialPhone ? styles.inputRow : undefined}>
            {isPotentialPhone && (
              <TouchableOpacity style={styles.countryCodeBox} activeOpacity={0.7}>
                <Text style={styles.countryCodeText}>{dialCode}</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={[styles.input, isPotentialPhone && styles.inputWithCode]}
              placeholder={t('signup.identifierPlaceholder', 'Email or Phone Number')}
              autoCapitalize="none"
              keyboardType={isPotentialPhone ? 'phone-pad' : 'email-address'}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>
        )}
        {stage === 'identifier' && (
          <TouchableOpacity style={[styles.continueBtn, !identifier.trim() && { opacity: 0.6 }]} disabled={!identifier.trim() || loading} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>{t('signup.continue', 'Continue')}</Text>
          </TouchableOpacity>
        )}
        {stage === 'details' && (
          <>
            <Text style={styles.identifierLabel}>{identifier}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.name')}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder={t('signup.password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}
        {stage === 'details' && !nameValid && name.length > 0 && <Text style={styles.validation}>{t('signup.nameInvalid')}</Text>}
        {stage === 'details' && !passwordValid && password.length > 0 && <Text style={styles.validation}>{t('signup.passwordInvalid')}</Text>}
  {/* Removed account exists prompt per request */}
        <TouchableOpacity
          style={[styles.googleBtnBox, (loading || !googleRequest) && { opacity: 0.6 }]}
          onPress={handleGoogleSignup}
          disabled={loading || !googleRequest}
          accessibilityRole="button"
          accessibilityLabel="Sign up with Google"
          accessibilityHint="Starts Google signup"
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.googleIcon}>🟢</Text>
              <Text style={styles.googleBtnText}>{t('signup.continueWithGoogle') || 'Continue with Google'}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.facebookBtnBox, (loading || !fbRequest || !facebookAppId) && { opacity: 0.6 }]}
          onPress={handleFacebookSignup}
          disabled={loading || !fbRequest || !facebookAppId}
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          accessibilityHint="Starts Facebook signup"
        >
          {loading ? <ActivityIndicator color="#1877F2" /> : (
            <>
              <Text style={styles.facebookIcon}>ⓕ</Text>
              <Text style={styles.facebookBtnText}>
                {facebookAppId ? (t('signup.continueWithFacebook') || 'Continue with Facebook') : 'Add EXPO_PUBLIC_FACEBOOK_APP_ID'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
  <View style={styles.footer}>
        <View style={styles.countryBelowWrapper}>
          <TouchableOpacity style={styles.countryPill} activeOpacity={0.7} onPress={() => setShowCountryList(false)}>
            <Text style={styles.countryIcon}>📍</Text>
            <Text style={styles.countryName} numberOfLines={1}>{detectedCountry || '—'}</Text>
            <Text style={styles.countryChevron}>⌄</Text>
          </TouchableOpacity>
        </View>
        {stage === 'details' && (
          <TouchableOpacity style={[styles.continueBtn, (!canSubmit) && { opacity: 0.6 }]} disabled={!canSubmit} onPress={handleSignup}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>{t('signup.title')}</Text>}
          </TouchableOpacity>
        )}
        <Text style={styles.termsText} numberOfLines={2}>
          {t('auth.agreeLine', 'By continuing, you agree to our')} <Text style={styles.linkText}>{t('auth.privacy', 'Privacy & Cookie Policy')}</Text> {t('auth.and', 'and')} <Text style={styles.linkText}>{t('auth.terms', 'Terms & Conditions')}</Text>
        </Text>
      </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48 },
  topContent: {},
  middleContent: { flex: 1, justifyContent: 'center' },
  footer: { paddingBottom: 16 },
  backButton: { position: 'absolute', top: 64, left: 16, padding: 4, zIndex: 10 },
  backButtonText: { fontSize: 26, fontWeight: '400', color: '#222' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
  link: { color: '#007bff', marginTop: 16, textAlign: 'center' },
  validation: { color: '#d00', textAlign: 'center', marginTop: 4, fontSize: 12 },
  googleBtnBox: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#ddd' },
  googleIcon: { width: 32, height: 32, marginRight: 20, textAlign: 'center', fontSize: 20 },
  googleBtnText: { color: '#000', fontSize: 14, fontWeight: '500' },
  facebookBtnBox: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#ddd' },
  facebookIcon: { width: 32, height: 32, marginRight: 20, textAlign: 'center', fontSize: 20 },
  facebookBtnText: { color: '#000', fontSize: 14, fontWeight: '500' },
  countryHint: { textAlign: 'center', marginBottom: 8, color: '#555', fontSize: 12 },
  countryWrapper: { alignItems: 'center', marginBottom: 12 },
  countryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 24, borderWidth: 1, borderColor: '#ddd', minWidth: 140 },
  facebookRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 }, // unused
  countryPillInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: '#ddd', marginLeft: 12 }, // unused
  countryBelowWrapper: { alignItems: 'center', marginTop: 10 },
  countryIcon: { fontSize: 16, marginRight: 6 },
  countryName: { flex: 1, textAlign: 'center', fontSize: 13, color: '#222' },
  countryChevron: { fontSize: 14, marginLeft: 6, color: '#444' },
  termsText: { textAlign: 'center', fontSize: 11, color: '#555', marginTop: 20, lineHeight: 16 },
  linkText: { color: '#007bff', textDecorationLine: 'underline' },
  storeName: { fontSize: 28, lineHeight: 34, fontWeight: '600', textAlign: 'center', marginBottom: 4, marginTop: 48 },
  countryCodeSmall: { fontSize: 12, color: '#666', fontWeight: '400' },
  protectedLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 4 },
  lockIcon: { fontSize: 14, marginRight: 6, color: '#1b7f46' },
  protectedText: { fontSize: 12, color: '#1b7f46', fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  countryCodeBox: { paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, backgroundColor: '#fff' },
  countryCodeText: { fontSize: 14, fontWeight: '600' },
  inputWithCode: { flex: 1, marginBottom: 0 },
  identifierLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333', textAlign: 'center' },
  continueBtn: { backgroundColor: '#181818', paddingVertical: 16, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
