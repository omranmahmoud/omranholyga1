
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as Localization from 'expo-localization';
import { findCountry } from '../data/countries';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from 'expo-constants';
WebBrowser.maybeCompleteAuthSession();
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { fetchStoreSettings } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState(route?.params?.prefillIdentifier || ''); // email or phone
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'identifier' | 'password'>('identifier');
  const [loading, setLoading] = useState(false);
  const { login, token, loading: authLoading } = useAuth();
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [showCountryList, setShowCountryList] = useState(false); // future enhancement
  const [dialCode, setDialCode] = useState<string>('+1');
  const [storeName, setStoreName] = useState<string>('');
  const extras = (Constants?.expoConfig as any)?.extra || {};
  const webClientId = extras.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const iosClientId = extras.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const androidClientId = extras.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;
  const facebookAppId = extras.EXPO_PUBLIC_FACEBOOK_APP_ID || undefined;
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId,
    iosClientId,
    androidClientId,
    scopes: ['openid','profile','email'],
  });
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({ clientId: facebookAppId || 'FACEBOOK_APP_ID_MISSING' });

  useEffect(() => {
    if (!authLoading && token) {
      const target = route?.params?.redirect || 'Home';
      navigation.replace(target as any);
    }
  }, [authLoading, token]);

  // If coming from signup existing-user redirect, move straight to password stage
  useEffect(() => {
    if (route?.params?.prefillIdentifier) {
      setStage('password');
    }
  }, [route?.params?.prefillIdentifier]);

  // Country detection (best-effort)
  useEffect(() => {
    try {
      const locales = Localization.getLocales();
      const region = locales?.[0]?.regionCode || (Localization as any)?.region || undefined;
      if (region) {
        const c = findCountry(region);
        if (c) {
          setDetectedCountry(c.name);
          setDialCode(c.dial || '+1');
        } else {
          setDetectedCountry(region);
          setDialCode('+1');
        }
        setCountryCode(region);
      } else {
        setDetectedCountry(null);
        setCountryCode(null);
      }
    } catch (e) {
      setDetectedCountry(null);
      setCountryCode(null);
    }
  }, []);

  // Fetch store settings (store name)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await fetchStoreSettings();
        if (mounted) {
          setStoreName(settings?.name || settings?.siteTitle || '');
        }
      } catch (e) {
        // silent fail; keep empty
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isEmail = /\S+@\S+\.\S+/.test(identifier);
  const isPotentialPhone = /^[0-9+()\s-]+$/.test(identifier) && !isEmail && identifier.length > 0;
  // Phone normalization (remove leading 0 and prepend dial code if missing +)
  const normalizePhone = (raw: string) => {
    if (!raw) return raw;
    const only = raw.replace(/[^0-9+]/g,'');
    if (only.startsWith('+')) {
      const digits = only.replace(/(?!^)[^0-9]/g,'').replace(/^\++/, '');
      return '+' + digits;
    }
    const digits = only.replace(/[^0-9]/g,'');
    const dialDigits = (dialCode || '+1').replace(/[^0-9]/g,'') || '1';
    const localTrimmed = digits.replace(/^0+/, '');
    if (localTrimmed.startsWith(dialDigits)) return '+' + localTrimmed;
    return '+' + dialDigits + localTrimmed;
  };
  const passwordValid = password.length >= 6;
  const canSubmit = (isEmail || isPotentialPhone) && passwordValid && !loading;

  const phoneToEmail = (raw: string) => {
    const normalized = normalizePhone(raw || '');
    const digits = normalized.replace(/[^0-9]/g,'');
    return `p${digits}@phone.local`;
  };

  const handleContinue = () => {
    if (!identifier.trim()) return;
    Keyboard.dismiss();
    // If phone number entered but phone login not implemented
    if (!isEmail && isPotentialPhone) {
      // Proceed to password stage OR in future trigger OTP flow
      setStage('password');
      return;
    }
    // Email path -> go to password entry
    if (isEmail) {
      setStage('password');
    } else {
      Alert.alert(t('common.error'), t('login.invalidEmail'));
    }
  };

  const handleLogin = async () => {
    if (!(isEmail || isPotentialPhone)) {
      Alert.alert(t('common.error'), t('login.invalidEmail'));
      return;
    }
    if (!passwordValid) {
      Alert.alert(t('login.validationTitle'), t('login.invalidPassword'));
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const emailForLogin = isEmail ? identifier.trim().toLowerCase() : phoneToEmail(identifier).toLowerCase();
      const res = await api.post('/api/auth/login', { email: emailForLogin, password });
      if (res.data.token) {
        await login(res.data.token, res.data.user);
        Alert.alert(t('login.success'), t('login.welcomeUser', { name: res.data.user.name }));
        const target = route?.params?.redirect || 'Home';
        navigation.replace(target as any);
      } else {
        Alert.alert(t('common.error'), 'Invalid response from server');
      }
    } catch (err:any) {
      Alert.alert(t('login.failed'), err?.response?.data?.message || err?.message || t('common.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (googleResponse?.type === 'success' && googleResponse.authentication?.idToken) {
        try {
          const idToken = googleResponse.authentication.idToken;
          const res = await api.post('/api/auth/google', { idToken });
          if (res.data?.token && res.data?.user) {
            await login(res.data.token, res.data.user);
            const target = route?.params?.redirect || 'Home';
            navigation.replace(target as any);
          } else {
            Alert.alert(t('common.error'), 'Invalid response from server');
          }
        } catch (e: any) {
          Alert.alert(t('common.error'), e?.message || 'Google auth failed');
        }
      }
    };
    run();
  }, [googleResponse]);

  useEffect(() => {
    const run = async () => {
      if (fbResponse?.type === 'success' && fbResponse.authentication?.accessToken) {
        try {
          const accessToken = fbResponse.authentication.accessToken;
          const res = await api.post('/api/auth/facebook', { accessToken });
          if (res.data?.token && res.data?.user) {
            await login(res.data.token, res.data.user);
            const target = route?.params?.redirect || 'Home';
            navigation.replace(target as any);
          } else {
            Alert.alert(t('common.error'), 'Invalid response from server');
          }
        } catch (e:any) {
          Alert.alert(t('common.error'), e?.message || 'Facebook auth failed');
        }
      }
    };
    run();
  }, [fbResponse]);

  const handleGoogleLogin = async () => {
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

  const handleFacebookLogin = async () => {
    if (!facebookAppId) {
      Alert.alert('Facebook', 'Missing Facebook App ID');
      return;
    }
    try {
      await fbPromptAsync();
    } catch (e:any) {
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
                placeholder={t('login.identifierPlaceholder', 'Email or Phone Number')}
                autoCapitalize="none"
                keyboardType={isPotentialPhone ? 'phone-pad' : 'email-address'}
                value={identifier}
                onChangeText={(txt) => setIdentifier(txt)}
              />
            </View>
          )}
          {stage === 'password' && (
            <>
              <Text style={styles.identifierLabel}>{isPotentialPhone ? normalizePhone(identifier) : identifier}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.password')}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}
          {stage === 'identifier' && (
            <TouchableOpacity style={[styles.continueBtn, !identifier.trim() && { opacity: 0.6 }]} disabled={!identifier.trim() || loading} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>{t('login.continue', 'Continue')}</Text>
            </TouchableOpacity>
          )}
          {stage === 'password' && (
            <TouchableOpacity style={[styles.continueBtn, (!canSubmit) && { opacity: 0.6 }]} disabled={!canSubmit} onPress={handleLogin}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>{t('login.title')}</Text>}
            </TouchableOpacity>
          )}
          {stage === 'password' && !passwordValid && password.length > 0 && (
            <Text style={styles.validation}>{t('login.invalidPassword')}</Text>
          )}
          {/* Social buttons */}
          <TouchableOpacity
            style={[styles.googleBtnBox, (loading || !googleRequest) && { opacity: 0.6 }]}
            onPress={handleGoogleLogin}
            disabled={loading || !googleRequest}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
            accessibilityHint="Starts Google sign in"
          >
            {(!googleRequest || loading) ? <ActivityIndicator color="#000" /> : (
              <>
                <Text style={styles.googleIcon}>🟢</Text>
                <Text style={styles.googleBtnText}>{t('login.continueWithGoogle') || 'Continue with Google'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.facebookBtnBox, (loading || !fbRequest || !facebookAppId) && { opacity: 0.6 }]}
            onPress={handleFacebookLogin}
            disabled={loading || !fbRequest || !facebookAppId}
            accessibilityRole="button"
            accessibilityLabel="Continue with Facebook"
            accessibilityHint="Starts Facebook sign in"
          >
            {(!fbRequest || loading) ? (
              <ActivityIndicator color="#1877F2" />
            ) : (
              <>
                <Text style={styles.facebookIcon}>ⓕ</Text>
                <Text style={styles.facebookBtnText}>
                  {facebookAppId ? (t('login.continueWithFacebook') || 'Continue with Facebook') : 'Add EXPO_PUBLIC_FACEBOOK_APP_ID'}
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  countryCodeBox: { paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, backgroundColor: '#fff' },
  countryCodeText: { fontSize: 14, fontWeight: '600' },
  inputWithCode: { flex: 1, marginBottom: 0 },
  identifierLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333', textAlign: 'center' },
  continueBtn: { backgroundColor: '#181818', paddingVertical: 16, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  facebookRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 }, // (unused after move, kept if needed later)
  countryPillInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: '#ddd', marginLeft: 12 }, // unused
  countryBelowWrapper: { alignItems: 'center', marginTop: 10 },
  countryIcon: { fontSize: 16, marginRight: 6 },
  countryName: { flex: 1, textAlign: 'center', fontSize: 13, color: '#222' },
  countryChevron: { fontSize: 14, marginLeft: 6, color: '#444' },
  termsText: { textAlign: 'center', fontSize: 11, color: '#555', marginTop: 20, lineHeight: 16 },
  linkText: { color: '#007bff', textDecorationLine: 'underline' },
  storeName: { fontSize: 28, lineHeight: 34, fontWeight: '600', textAlign: 'center', marginBottom: 4, marginTop: 48 },
  countryCodeSmall: { fontSize: 12, color: '#666', fontWeight: '400' }
  ,protectedLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 4 }
  ,lockIcon: { fontSize: 14, marginRight: 6, color: '#1b7f46' }
  ,protectedText: { fontSize: 12, color: '#1b7f46', fontWeight: '500' }
});
