import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve API base URL for mobile app.
 * Priority:
 * 1. EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_BASE (set via app config or env)
 * 2. expo host uri (LAN IP) + :5000
 * 3. Android emulator loopback 10.0.2.2
 * 4. iOS simulator localhost
 */
export function resolveApiBase() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const hostUri: string | undefined = (Constants.expoConfig as any)?.hostUri || (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:5000`;
    }
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'https://omraneva.onrender.com';
}
