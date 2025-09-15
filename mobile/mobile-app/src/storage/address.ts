import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredAddress {
  country?: string;
  countryCode?: string;
  phoneCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phone2?: string;
  city?: string;
  line1?: string;
  line2?: string;
  makeDefault?: boolean;
}

const KEY = 'app.shippingAddress.default';

export async function loadStoredAddress(): Promise<StoredAddress | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveStoredAddress(addr: StoredAddress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(addr));
  } catch {
    // ignore
  }
}

export async function clearStoredAddress(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
}
