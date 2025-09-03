export function ogImageFor(pathname = '/') {
  const base = (process.env.REACT_APP_SITE_URL || 'https://autodevelop.ai').replace(/\/$/, '');
  const slug = pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/\/.*/, '');
  return `${base}/og-images/${slug}.png`;
}
