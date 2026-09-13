// Generates dist/404.html AFTER the vite build (so it can reference the
// real, hashed asset filenames). This is a static MPA, not an SPA: unknown
// paths must get a real 404 status and a page that actually renders, not
// the SPA-style index.html fallback (which breaks at any nested path
// because index.html's script/link tags are relative — see nginx.conf).
//
// This page therefore uses ROOT-ABSOLUTE asset paths (/assets/...) so it
// renders identically no matter how deep the unmatched request path was
// (nginx serves it via `error_page 404 /404.html`, not a redirect, so the
// browser's resolution base stays the original request path).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const assetsDir = resolve(distDir, 'assets');

const assetFiles = readdirSync(assetsDir);
const cssFile = assetFiles.find((f) => f.endsWith('.css'));
if (!cssFile) {
  throw new Error(`generate-404.mjs: no built CSS file found in ${assetsDir}`);
}

const lowercaseOrigin = (url) => url.replace(/^(https?:\/\/)([^/]+)/i, (_, scheme, host) => scheme + host.toLowerCase());
const siteUrl = lowercaseOrigin((process.env.VITE_SITE_URL || 'https://shiftuia.github.io/ccdvf-exam-prep').replace(/\/$/, ''));
const navBase = (process.env.VITE_NAV_BASE || '').replace(/\/$/, '');

const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Page not found | Blueprint</title>
<meta name="description" content="This page doesn't exist on Blueprint — Claude certification practice exams."/>
<meta name="robots" content="noindex"/>
<link rel="canonical" href="${siteUrl}/404.html"/>
<link rel="stylesheet" crossorigin href="${navBase}/assets/${cssFile}">
</head><body>
<header><a class="brand" href="${navBase}/">Blueprint <small>by Holy Shifted</small></a><nav><a href="${navBase}/exam/">Exam</a><a href="${navBase}/framework/">Framework</a><a href="${navBase}/cheat-sheet/">Cheat sheet</a><a href="${navBase}/quiz/">Practice exam</a></nav></header>
<main><section class="prose"><h1>404 — Page not found</h1><p>That page doesn't exist. It may have moved, or the link you followed has a typo.</p><p><a class="button" href="${navBase}/">Back to the homepage</a></p></section></main>
<footer><p>Blueprint is an independent study resource. It is not affiliated with, endorsed by, or sponsored by Anthropic.</p></footer>
</body></html>`;

const target = resolve(distDir, '404.html');
writeFileSync(target, html);
console.log(`Wrote ${target} (css: ${cssFile})`);
