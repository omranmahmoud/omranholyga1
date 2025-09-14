// Unified Netlify Edge Function: device-redirect
// Redirect mobile (and optionally tablet) browsers to /m unless disabled by cookie or env.
// Env:
//   MOBILE_WEB_TABLET_POLICY = desktop | mobile | ignore (default ignore)
//   MOBILE_WEB_EXTERNAL_URL = https://m.example.com (optional external host)
//   MOBILE_WEB_DISABLE_REDIRECT = 1 (skip redirect entirely)

const PHONE_REGEX = /(iphone|ipod|android.*mobile|blackberry|bb10|opera mini|iemobile|windows phone|mobile)/i;
const TABLET_HINT_REGEX = /(ipad|tablet|kindle|silk|playbook|sm-t|\btab\b)/i;

function detect(ua = '') {
  const lower = ua.toLowerCase();
  const isTablet = TABLET_HINT_REGEX.test(lower) || (/android/.test(lower) && !/mobile/.test(lower));
  const isPhone = !isTablet && PHONE_REGEX.test(lower);
  return { isTablet, isPhone };
}

export default async (request, context) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip static/known paths
    if (path.startsWith('/m') || path.startsWith('/api') || path.startsWith('/_')) return context.next();
    if (/\.(png|jpe?g|gif|webp|svg|ico|css|js|map|json|txt|xml|mp3|mp4|woff2?)$/i.test(path)) return context.next();

  const getEnv = (k) => (globalThis?.Netlify?.env?.get ? globalThis.Netlify.env.get(k) : undefined);
  if (getEnv('MOBILE_WEB_DISABLE_REDIRECT') === '1') return context.next();
    const cookies = request.headers.get('cookie') || '';
    if (/forceDesktop=1/.test(cookies)) return context.next();

    const ua = request.headers.get('user-agent') || '';
  const { isTablet, isPhone } = detect(ua);
  const tabletPolicy = (getEnv('MOBILE_WEB_TABLET_POLICY') || 'ignore').toLowerCase();

    let treatAsMobile = isPhone;
    if (isTablet) {
      if (tabletPolicy === 'mobile') treatAsMobile = true;
      else if (tabletPolicy === 'desktop' || tabletPolicy === 'ignore') treatAsMobile = false;
    }

    if (!treatAsMobile) return context.next();

  const external = getEnv('MOBILE_WEB_EXTERNAL_URL');
    if (external) {
      return Response.redirect(external + path + url.search, 302);
    }
    return Response.redirect(url.origin + '/m' + path + url.search, 302);
  } catch (e) {
    return context.next();
  }
};
