const fs = require('fs');
const path = require('path');

// Simple sitemap generator: update `routes` with any new pages
const siteUrl = process.env.SITE_URL || 'https://autodevelop.ai';

// Scan frontend/src for simple Route definitions: <Route path="/about" ... />
const srcDir = path.join(__dirname, '..', 'frontend', 'src');
const defaultRoutes = ['/', '/about', '/contact', '/privacy', '/terms'];
let discovered = new Set(defaultRoutes);

function scanForRoutes(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      scanForRoutes(p);
      continue;
    }
    if (!/\.(jsx|js|ts|tsx)$/.test(f)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
    let m;
    while ((m = routeRegex.exec(txt)) !== null) {
      let route = m[1].trim();
      if (!route.startsWith('/')) route = '/' + route;
      discovered.add(route);
    }
  }
}

scanForRoutes(srcDir);

// Load optional manifest for dynamic routes (e.g., slugs from CMS or DB)
try {
  const manifestPath = path.join(__dirname, 'sitemap-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (Array.isArray(manifest.dynamicRoutes)) {
      for (const r of manifest.dynamicRoutes) {
        if (typeof r === 'string') discovered.add(r);
      }
    }
  }
} catch (e) {
  // ignore manifest errors
}

const urlEntries = Array.from(discovered).map((route) => {
  const loc = `${siteUrl.replace(/\/$/, '')}${route === '/' ? '/' : route}`;
  // attempt to get lastmod from a matching file mtime where possible
  let lastmod = '';
  try {
    // very small heuristic: look for a file with the route name
    const routeName = route === '/' ? 'index' : route.replace(/^\//, '');
    const candidates = [
      path.join(srcDir, `${routeName}.jsx`),
      path.join(srcDir, routeName, 'index.jsx'),
      path.join(srcDir, `${routeName}.js`),
      path.join(srcDir, routeName, 'index.js')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        lastmod = new Date(fs.statSync(c).mtime).toISOString();
        break;
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    loc,
    lastmod
  };
});

const urlset = urlEntries
  .map(({ loc, lastmod }) => {
    // Set priority based on page importance
    let priority = '0.8'; // default
    if (loc.endsWith('/')) priority = '1.0'; // homepage
    else if (loc.includes('/admin/')) priority = '0.3'; // admin pages
    else if (loc.includes('/privacy') || loc.includes('/terms')) priority = '0.5'; // legal pages
    
    return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join('\n');

const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

const outDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), content, 'utf8');
console.log('Sitemap generated at', path.join(outDir, 'sitemap.xml'));
