import api from './api';

export interface WhatsAppLinkResult {
  userId?: string;
  name?: string;
  phoneNumber?: string;
  url?: string;
  skipped?: boolean;
  reason?: string;
}

export interface BulkLinksResponse {
  success: boolean;
  count: number;
  total: number;
  links: WhatsAppLinkResult[];
}

export async function buildSingleLink(phoneNumber: string, message?: string) {
  const data = await (api as any).postWithRetry('/whatsapp/link', { phoneNumber, message });
  return data as { success: boolean; url: string };
}

export async function buildLinksForIds(userIds: string[], message: string, onlyOptIn = true) {
  const data = await (api as any).postWithRetry('/whatsapp/links/ids', { userIds, message, onlyOptIn });
  return data as unknown as BulkLinksResponse;
}

export async function buildLinksByFilter(message: string, onlyOptIn = true, limit?: number) {
  const data = await (api as any).postWithRetry('/whatsapp/links/filter', { message, onlyOptIn, limit });
  return data as unknown as BulkLinksResponse;
}
