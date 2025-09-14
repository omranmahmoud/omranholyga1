// Utility to normalize image URLs coming from API (relative paths, missing leading slash, backslashes)
export function resolveImageUrl(raw?: any): string {
  if (!raw) return '/placeholder-image.svg';
  // Allow passing image object shapes: { url, path, src }
  if (typeof raw === 'object') {
    const candidate = raw.url || raw.path || raw.src || raw.file || raw.location;
    if (!candidate) return '/placeholder-image.svg';
    raw = String(candidate);
  }
  if (typeof raw !== 'string') return '/placeholder-image.svg';
  let url = raw.trim();
  // Replace Windows backslashes
  url = url.replace(/\\/g, '/');

  // If already absolute (http/https/data)
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;

  // Normalize common stored formats
  // Cases:
  // 1. 'uploads/xyz.jpg' -> '/api/uploads/xyz.jpg'
  // 2. '/uploads/xyz.jpg' -> '/api/uploads/xyz.jpg'
  // 3. 'public/uploads/xyz.jpg' or '/public/uploads/xyz.jpg' -> '/api/uploads/xyz.jpg'
  // 4. Already begins with '/api/uploads/' keep as-is
  const lower = url.toLowerCase();
  if (lower.startsWith('/api/uploads/')) return url; // assumed correct

  const uploadsMatch = lower.match(/(?:^|\/)(public\/)?uploads\/(.+)$/);
  if (uploadsMatch) {
    const rest = uploadsMatch[2];
    return '/api/uploads/' + rest;
  }

  // If it starts with 'uploads/' without leading slash
  if (lower.startsWith('uploads/')) return '/api/' + url.replace(/^uploads\//i, 'uploads/');

  // Default: ensure leading slash; consumer may serve it directly (e.g., already copied into /public)
  if (!url.startsWith('/')) url = '/' + url;
  return url;
}

// Attempt to derive a primary image from product object with multiple possible shapes
export function getPrimaryProductImage(product: any): string {
  if (!product) return '/placeholder-image.svg';
  const candidates: (string | undefined)[] = [];
  if (Array.isArray(product.images)) candidates.push(product.images[0]);
  // Sometimes images may be nested under colors[0].images[0]
  if (Array.isArray(product.colors) && product.colors[0]?.images?.length) {
    candidates.push(product.colors[0].images[0]);
  }
  // Filter to first truthy
  const firstValid = candidates.find(Boolean);
  return resolveImageUrl(firstValid);
}

