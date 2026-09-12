# Blueprint

Blueprint is a fully static, TypeScript/Vite site for original Claude certification practice material. Vite plus hand-written TypeScript and CSS is deliberately used here: it produces portable static files, has a small dependency surface, and remains easy for a cold maintainer to understand.

## Local development

`npm install && npm run dev`

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run validate:questions`, and `npm run build`.

The app runs without network calls. `VITE_RESULTS_ADAPTER=noop` and `VITE_EMAIL_ADAPTER=noop` are defaults. Set both to `http` and set `VITE_API_ENDPOINT=https://api.example.com` to enable the HTTP adapter modules. Analytics is deliberately a no-op pending the privacy configuration; adding a provider is isolated to `src/adapters/`. `VITE_CREDLY_BADGE_URL` optionally links the "who made this" author block to a public Credly badge; the block ships without a link until it is set.

## Deployment

Pushes to `main` run the GitHub Pages workflow. `CNAME` is included for the intended `blueprint.holyshifted.com`; DNS and Pages custom-domain / HTTPS configuration remain Dima's manual steps. Until DNS is configured, use the generated GitHub Pages project URL.

`content/questions.json` and `content/domains.json` ship a placeholder 53-item question bank in the frozen contract schema so the quiz engine runs end to end. Task E3 replaces the placeholder bank with the real, researched question set — the schema, validator, and app code do not change. The validator is `scripts/validate-questions.py` (Python, no dependencies) and enforces every rule in the data contract: exact counts, unique ids, per-option explanations, answer cardinality, forbidden phrasing, and domain/sub-skill allocation.

This is an independent study resource; it is not affiliated with, endorsed by, or sponsored by Anthropic. Every practice item must be original, never real, leaked, or recalled exam content.
