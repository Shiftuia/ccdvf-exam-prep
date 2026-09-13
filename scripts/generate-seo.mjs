// Generates robots.txt and sitemap.xml into public/ before the Vite build,
// so the emitted files carry the correct absolute site URL for this deploy
// target (custom domain vs. the GitHub Pages project URL) without hand
// duplicating the value in two static files.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const siteUrl = (process.env.VITE_SITE_URL || 'https://shiftuia.github.io/ccdvf-exam-prep').replace(/\/$/, '');
const navBase = (process.env.VITE_NAV_BASE || '').replace(/\/$/, '');
const base = `${siteUrl}`;
// navBase is already part of siteUrl's path when set (both derive from the
// same deploy target), so routes are joined directly onto siteUrl.
const routes = ['/', '/exam/', '/framework/', '/cheat-sheet/', '/quiz/', '/privacy/'];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
  .map((route) => `  <url><loc>${base}${route}</loc></url>`)
  .join('\n')}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;

writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap);
writeFileSync(resolve(publicDir, 'robots.txt'), robots);
console.log(`Generated robots.txt and sitemap.xml for ${base}${navBase ? ` (nav base ${navBase})` : ''}`);
