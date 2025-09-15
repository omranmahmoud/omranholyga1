// services/discounts.ts
// Basic client helpers for coupon & gift card endpoints.
// Assumes API base URL is provided via EXPO_PUBLIC_API_URL or defaults to local dev server.

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

async function jsonFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// Coupons
export async function validateCoupon(code: string, totalAmount: number) {
  return jsonFetch<{ coupon: any; discount: number }>(`/coupons/validate`, {
    method: 'POST',
    body: JSON.stringify({ code, totalAmount })
  });
}

export async function applyCouponUsage(code: string) {
  // increments usage count (no auth required per backend route definition)
  return jsonFetch<{ message: string }>(`/coupons/${encodeURIComponent(code)}/apply`, { method: 'POST' });
}

// Gift Cards
export async function checkGiftCardBalance(code: string) {
  return jsonFetch<{ code: string; balance: number; currency: string; status: string; expiryDate?: string }>(`/gift-cards/balance/${encodeURIComponent(code)}`);
}

export async function applyGiftCard(code: string, amount: number, token?: string, orderId?: string) {
  // Requires auth according to backend (auth middleware). Pass bearer token if available.
  return jsonFetch<{ amountApplied: number; remainingBalance: number }>(`/gift-cards/apply`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ code, amount, orderId })
  });
}
