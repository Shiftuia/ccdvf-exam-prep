# Blueprint

Blueprint is a fully static, TypeScript/Vite site for original Claude certification practice material. Vite plus hand-written TypeScript and CSS is deliberately used here: it produces portable static files, has a small dependency surface, and remains easy for a cold maintainer to understand.

## Local development

`npm install && npm run dev`

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run validate:questions`, and `npm run build`.

The app runs without network calls. `VITE_RESULTS_ADAPTER=noop` and `VITE_EMAIL_ADAPTER=noop` are defaults. Set both to `http` and set `VITE_API_ENDPOINT=https://api.example.com` to enable the HTTP adapter modules. Analytics is deliberately a no-op pending the privacy configuration; adding a provider is isolated to `src/adapters/`.

## Deployment

Pushes to `main` run the GitHub Pages workflow. `CNAME` is included for the intended `blueprint.holyshifted.com`; DNS and Pages custom-domain / HTTPS configuration remain Dima's manual steps. Until DNS is configured, use the generated GitHub Pages project URL.

`content/questions.json` is intentionally absent in this scaffold. The validator currently exits successfully with a clear deferred message; E3 must replace it with the strict validator and imported 53-item contract bank.

This is an independent study resource; it is not affiliated with, endorsed by, or sponsored by Anthropic. Every practice item must be original, never real, leaked, or recalled exam content.
