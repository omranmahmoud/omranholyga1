import api from './api';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  // Ensure scope at root so it works on all routes
  return navigator.serviceWorker.register('/sw.js');
}

export async function getVapidPublicKey(): Promise<Uint8Array | null> {
  try {
  const { data } = await api.getWithRetry('/push/public-key');
    if (!data?.publicKey) return null;
    const key = urlBase64ToUint8Array(data.publicKey);
    return key;
  } catch { return null; }
}

export async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Push not supported');

  const reg = await registerServiceWorker();
  if (!reg) throw new Error('SW not registered');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission denied');

  const appServerKey = await getVapidPublicKey();
  if (!appServerKey) throw new Error('No VAPID key');

  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey as any });
  // Send to backend (requires auth)
  await api.postWithRetry('/push/subscribe', sub);
  return sub;
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
  await api.postWithRetry('/push/unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
}

export async function ensureSubscribedSilently() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // Do nothing silently; explicit subscribePush will request permission
    }
  } catch { /* ignore */ }
}

export async function sendTestPush(all = false) {
  return api.postWithRetry('/push/test', {}, { params: all ? { all: true } : undefined });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
