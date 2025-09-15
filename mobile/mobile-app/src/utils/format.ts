import i18n from '../i18n';

// Cache maps to avoid recreating Intl formatters frequently
const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function resolveLocale(lang?: string) {
  const l = (lang || i18n.language || 'en').toLowerCase();
  if (l.startsWith('ar')) return 'ar';
  if (l.startsWith('he')) return 'he';
  return 'en-US';
}

export function formatNumber(value: number | string, options?: Intl.NumberFormatOptions) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return String(value);
  if (typeof Intl === 'undefined' || !Intl.NumberFormat) return num.toString();
  const locale = resolveLocale();
  const key = `${locale}|${JSON.stringify(options || {})}`;
  let fmt = numberFormatterCache.get(key);
  if (!fmt) {
    try { fmt = new Intl.NumberFormat(locale, options); numberFormatterCache.set(key, fmt); } catch { return num.toString(); }
  }
  return fmt.format(num);
}

export function formatCurrency(value: number | string, currency = 'USD', options?: Intl.NumberFormatOptions) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return String(value);
  return formatNumber(num, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2, ...options });
}

export function formatPercent(value: number, options?: Intl.NumberFormatOptions) {
  return formatNumber(value, { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0, ...options });
}

export interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  withTime?: boolean;
}

export function formatDate(value: Date | string | number, opts: DateFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return date.toISOString();
  const locale = resolveLocale();
  const { dateStyle = 'medium', timeStyle, withTime } = opts;
  const finalTimeStyle = withTime ? (timeStyle || 'short') : undefined;
  const key = `${locale}|${dateStyle}|${finalTimeStyle}`;
  let fmt = dateFormatterCache.get(key);
  if (!fmt) {
    try { fmt = new Intl.DateTimeFormat(locale, { dateStyle, timeStyle: finalTimeStyle }); dateFormatterCache.set(key, fmt); } catch { return date.toISOString(); }
  }
  return fmt.format(date);
}

// Helper to choose currency (placeholder – integrate with settings later)
export function resolveCurrency(): string {
  // Could read from a settings context or API; default to USD now
  return 'USD';
}

export function formatPrice(value: number | string, currency?: string) {
  return formatCurrency(value, currency || resolveCurrency());
}

export function getLocale() { return resolveLocale(); }
