// Keep stored development upload URLs from contacting a visitor's local network.
export const isLocalHost = (hostname = '') => {
  const host = hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === '::1' || host === '::' || /^(fc|fd)[0-9a-f]{2}:|^fe[89ab][0-9a-f]:/i.test(host)) return true;
  const parts = host.split('.').map(Number);
  return parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255) && (
    parts[0] === 0 || parts[0] === 127 || parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || (parts[0] === 169 && parts[1] === 254)
  );
};

export const resolveImageUrl = (value, serverUrl = '', pageUrl = '') => {
  if (typeof value !== 'string' || !value.trim()) return '';
  let path = value.trim();
  if (/^(data:|blob:)/i.test(path)) return path;
  const page = new URL(pageUrl || 'https://storefront.invalid');
  const publicPage = !isLocalHost(page.hostname);
  let base = serverUrl.replace(/\/$/, '');
  if (base && publicPage && isLocalHost(new URL(base, page).hostname)) base = '';
  if (/^(https?:)?\/\//i.test(path)) {
    const url = new URL(path, page);
    if (!publicPage || !isLocalHost(url.hostname)) return path;
    // Only known uploaded assets can be relocated to this deployment.
    if (!url.pathname.startsWith('/uploads/')) return '';
    path = url.pathname + url.search + url.hash;
  }
  return `${base}/${path.replace(/^\/+/, '')}`;
};

export const getImageUrl = (imagePath) => resolveImageUrl(
  imagePath,
  import.meta.env.VITE_SERVER_URL || '',
  typeof window !== 'undefined' ? window.location.href : ''
);
