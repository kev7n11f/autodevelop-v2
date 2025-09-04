export function ogImageFor(pathname = '/') {
  const base = (import.meta.env.VITE_SITE_URL || 'https://autodevelop.ai').replace(/\/$/, '');
  const slug = pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/\/.*/, '');
  return `${base}/og-images/${slug}.png`;
}
