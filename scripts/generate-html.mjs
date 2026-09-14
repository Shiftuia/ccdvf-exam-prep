// Regenerates the six route entry HTML files with real, per-route,
// statically-indexable SEO metadata (title, description, canonical, Open
// Graph, Twitter card, WebPage JSON-LD) before every build. Keeping this as
// a generator instead of six hand-maintained HTML files means the shared
// boilerplate (viewport, OG defaults, JSON-LD shape) can't drift between
// pages, and the canonical/OG URLs pick up the real deploy target
// (VITE_SITE_URL) at build time instead of being hardcoded per environment.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { routes } from './routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Lowercase the origin: GitHub's `repository_owner` preserves the account's
// display casing (e.g. `Shiftuia`), but Pages serves from the lowercase host.
// Canonical/OG/sitemap URLs must be the exact strings crawlers and social
// scrapers fetch, so normalise the host while leaving the path case intact.
const lowercaseOrigin = (url) => url.replace(/^(https?:\/\/)([^/]+)/i, (_, scheme, host) => scheme + host.toLowerCase());
const siteUrl = lowercaseOrigin((process.env.VITE_SITE_URL || 'https://shiftuia.github.io/ccdvf-exam-prep').replace(/\/$/, ''));
const ogImage = `${siteUrl}/og/ccdv-f.png`;

const dirFor = (routePath) => (routePath === '/' ? '.' : routePath.replace(/^\//, '').replace(/\/$/, ''));

// First-party Umami analytics counter, mandatory on every public-facing
// thinkcentre site per the umami-deployment convention (see
// ~/services/_scripts/README.md). Script/endpoint names are the renamed
// (non-default) Umami paths configured on the metrics service to reduce
// common ad-block filter hits — not a guaranteed bypass.
const UMAMI_WEBSITE_ID = '87e83658-c9c5-4cb4-959d-9b5333dccc2f';
const umamiSnippet = `<script defer src="https://metrics.shiftuia.com/hs.js" data-website-id="${UMAMI_WEBSITE_ID}" data-domains="anthropic-quiz.shiftuia.com"></script>`;

for (const route of routes) {
  const canonical = `${siteUrl}${route.path}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    description: route.description,
    url: canonical,
    publisher: { '@type': 'Person', name: 'Holy Shifted' },
    isAccessibleForFree: true,
  };
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${route.title}</title>
<meta name="description" content="${route.description}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:site_name" content="Blueprint by Holy Shifted"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:title" content="${route.title}"/>
<meta property="og:description" content="${route.description}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Blueprint by Holy Shifted — CCDV-F practice exam. 53 original questions matched to the published blueprint."/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@holyshifted"/>
<meta name="twitter:title" content="${route.title}"/>
<meta name="twitter:description" content="${route.description}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
${umamiSnippet}
</head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`;
  const target = resolve(root, dirFor(route.path), 'index.html');
  writeFileSync(target, html);
  console.log(`Wrote ${target}`);
}
