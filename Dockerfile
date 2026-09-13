# Multi-stage build. Stage 1 builds the static site (npm ci + npm run build,
# which runs the question-content validator and tsc before vite build).
# Stage 2 serves only the built dist/ output via nginx as a non-root user on
# an unprivileged port — no node, no npm, no source, no node_modules, no
# .env ever reach the runtime image.
FROM node:22-alpine AS build
WORKDIR /app

# Python is needed at build time only, for scripts/validate-questions.py
# (npm run build -> npm run validate:questions).
RUN apk add --no-cache python3

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Root-served on a custom domain: no path prefix needed for nav links.
ENV VITE_NAV_BASE=
ENV VITE_SITE_URL=https://anthropic-quiz.shiftuia.com
# App makes zero network calls in production — both optional HTTP adapters
# stay no-ops. This is a deliberate security property, not a placeholder.
ENV VITE_RESULTS_ADAPTER=noop
ENV VITE_EMAIL_ADAPTER=noop

RUN npm run build

FROM nginx:1.27-alpine AS runtime

# Non-root: nginx:alpine already ships an "nginx" user (uid/gid 101). Adjust
# ownership of the dirs nginx needs to write to (only tmpfs-backed paths at
# runtime, see docker-compose.yml's tmpfs mounts) and drop root.
RUN rm -rf /usr/share/nginx/html/* \
    && rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Listen on 9006 (unprivileged, non-root, no CAP_NET_BIND_SERVICE needed) —
# nginx.conf has no `user` directive, so there's nothing to strip here.

EXPOSE 9006

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:9006/ || exit 1

USER 101:101

CMD ["nginx", "-g", "daemon off;"]
