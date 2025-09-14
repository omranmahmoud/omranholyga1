// Netlify Edge Function: device-redirect
// Redirect mobile user agents to /m (or an external URL if MOBILE_WEB_EXTERNAL_URL is set)
// Tablets controlled via MOBILE_WEB_TABLET_POLICY: "desktop" | "mobile" | "ignore" (default: ignore)

const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|PlayBook|Silk/i;

function classify(ua) {
  if (!ua) return { isMobile: false, isTablet: false };
  const isTablet = TABLET_REGEX.test(ua);
  const isMobile = !isTablet && MOBILE_REGEX.test(ua);
  return { isMobile, isTablet };
}

export default async (request, context) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip assets/known paths
    if (path.startsWith('/m') || path.startsWith('/api') || path.startsWith('/_') || path.match(/\.(png|jpe?g|gif|webp|svg|ico|css|js|map|json)$/i)) {
      return context.next();
    }

    const ua = request.headers.get('user-agent') || '';
    const { isMobile, isTablet } = classify(ua);
    const tabletPolicy = (Netlify.env.get('MOBILE_WEB_TABLET_POLICY') || 'ignore').toLowerCase();

    let treatAsMobile = isMobile;
    if (isTablet) {
      if (tabletPolicy === 'mobile') treatAsMobile = true;
      else if (tabletPolicy === 'desktop') treatAsMobile = false;
    }

    if (!treatAsMobile) return context.next();

    const external = Netlify.env.get('MOBILE_WEB_EXTERNAL_URL');
    if (external) {
      return Response.redirect(external + url.pathname + url.search, 302);
    }

    return Response.redirect(url.origin + '/m' + url.pathname + url.search, 302);
  } catch (e) {
    return context.next();
  }
};
