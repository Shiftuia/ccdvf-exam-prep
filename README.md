# Blueprint

Blueprint is a fully static, TypeScript/Vite site for original Claude certification practice material. Vite plus hand-written TypeScript and CSS is deliberately used here: it produces portable static files, has a small dependency surface, and remains easy for a cold maintainer to understand.

## Local development

`npm install && npm run dev`

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run validate:questions`, and `npm run build`.

The app runs without network calls. `VITE_RESULTS_ADAPTER=noop` and `VITE_EMAIL_ADAPTER=noop` are defaults. Set both to `http` and set `VITE_API_ENDPOINT=https://api.example.com` to enable the HTTP adapter modules. Analytics is deliberately a no-op pending the privacy configuration; adding a provider is isolated to `src/adapters/`. `VITE_CREDLY_BADGE_URL` optionally links the "who made this" author block to a public Credly badge; the block ships without a link until it is set. `VITE_NAV_BASE` sets the absolute prefix used by in-app navigation links and client-side routing (e.g. `/ccdvf-exam-prep`); the CI workflow sets it automatically to the repo name unless a `CNAME` file is present, in which case it is empty (root-served custom domain). Vite's asset `base` itself is always `./` (relative), so the built bundle loads correctly from either the GitHub Pages project URL or a custom domain without a separate build.

## Deployment

Pushes to `main` run the GitHub Pages workflow. **No `CNAME` file ships yet** — the custom domain `blueprint.holyshifted.com` from the brand brief is not registered as of this build, so the site serves from the GitHub Pages project URL (`https://shiftuia.github.io/ccdvf-exam-prep/`) with `VITE_NAV_BASE` set to the repo path automatically. Once Dima buys `holyshifted.com` and points DNS at GitHub Pages (a `CNAME` record, `blueprint` → `<username>.github.io`, proxy off in Cloudflare), add a `CNAME` file back containing `blueprint.holyshifted.com`, set the custom domain in the repo's Pages settings, and enable "Enforce HTTPS". The build's `VITE_SITE_URL` (used for canonical/OG URLs and the sitemap) switches automatically based on whether `CNAME` is present — see `.github/workflows/pages.yml`.

`content/questions.json`, `content/domains.json`, and `content/pages/*.md` ship the real, research-backed CCDV-F content (53 original items, the frozen 8-domain/25-sub-skill allocation, and the exam-overview/framework/cheat-sheet long-form pages). The validator is `scripts/validate-questions.py` (Python, no dependencies) and enforces every rule in the data contract: exact counts, unique ids, per-option explanations, answer cardinality, forbidden phrasing, and domain/sub-skill allocation. `npm run build` runs it first and fails the build on any violation.

This is an independent study resource; it is not affiliated with, endorsed by, or sponsored by Anthropic. Every practice item must be original, never real, leaked, or recalled exam content.
