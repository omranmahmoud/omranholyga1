// Normalize image paths returned by the API to something the frontend can load
// - Absolute URLs (http/https) are returned as-is
// - Root-relative paths starting with '/' are returned as-is
// - Otherwise, treat as an upload filename stored under /uploads
export function resolveImagePath(img?: string | null): string | undefined {
  if (!img) return undefined;
  let s = String(img).trim();
  // External URLs stay as-is
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  // Normalize slashes and strip leading './'
  s = s.replace(/\\/g, '/').replace(/^\.\//, '');
  // Remove leading 'public/' if present
  s = s.replace(/^\/?public\//, '');
  // If the string contains any 'uploads/' segment, collapse to '/api/uploads/<lastPart>'
  if (s.includes('uploads/')) {
    const last = s.split('uploads/').pop() as string;
    return `/api/uploads/${last.replace(/^\/+/, '')}`;
  }
  // Already absolute path from app public: if it starts with /uploads, prefer /api/uploads so it works in dev via proxy
  if (s.startsWith('/uploads/')) return `/api${s}`;
  if (s.startsWith('/')) return s;
  // Default: treat as an upload filename
  return `/api/uploads/${s}`;
}

export function withFallback(img?: string | null, fallback: string = '/placeholder-image.jpg'): string {
  return resolveImagePath(img) || fallback;
}
