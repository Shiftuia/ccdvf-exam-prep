#!/usr/bin/env bash
# Smoke test: run AFTER `docker compose up -d --build` (or a restart) to
# confirm the deployed container actually came up healthy AND is serving
# real content. Not a unit test - no mocking, hits the real running
# container/Traefik route.
#
# Usage: ./smoke_test.sh   (run from this service's directory)
set -uo pipefail

SERVICE_NAME="anthropic-quiz"     # == container_name in docker-compose.yml
HEALTH_PORT="9006"                # the port /health listens on INSIDE the container
DOMAIN="anthropic-quiz.thinkcentre.local"
MAX_WAIT_S=30
INTERVAL_S=2

echo "[smoke] waiting for ${SERVICE_NAME} container to report healthy..."

elapsed=0
healthy=0
while [ "$elapsed" -lt "$MAX_WAIT_S" ]; do
    if ! docker inspect -f '{{.State.Running}}' "$SERVICE_NAME" 2>/dev/null | grep -q true; then
        echo "[smoke] FAIL: container '${SERVICE_NAME}' is not running"
        docker logs --tail 50 "$SERVICE_NAME" 2>&1
        exit 1
    fi

    body=$(docker exec "$SERVICE_NAME" wget -q -O - "http://localhost:${HEALTH_PORT}/health" 2>/dev/null)
    if [ "$body" = "ok" ]; then
        healthy=1
        break
    fi
    sleep "$INTERVAL_S"
    elapsed=$((elapsed + INTERVAL_S))
done

if [ "$healthy" -ne 1 ]; then
    echo "[smoke] FAIL: /health did not return 'ok' within ${MAX_WAIT_S}s"
    docker logs --tail 50 "$SERVICE_NAME" 2>&1
    exit 1
fi
echo "[smoke] PASS: /health returned ok"

echo "[smoke] checking real routes through Traefik (Host: ${DOMAIN})..."
fail=0
for path in / /quiz/ /exam/ /cheat-sheet/ /framework/ /privacy/; do
    code=$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: ${DOMAIN}" "http://127.0.0.1${path}")
    if [ "$code" != "200" ]; then
        echo "[smoke] FAIL: GET ${path} via Traefik returned ${code} (expected 200)"
        fail=1
    else
        echo "[smoke] PASS: GET ${path} -> 200"
    fi
done

# Method restriction: only GET/HEAD are meaningful on a static site.
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H "Host: ${DOMAIN}" "http://127.0.0.1/")
if [ "$code" != "403" ]; then
    echo "[smoke] FAIL: POST / returned ${code} (expected 403, methods must be GET/HEAD only)"
    fail=1
else
    echo "[smoke] PASS: POST / correctly rejected (403)"
fi

# Bare paths (no trailing slash) must 301 to a *relative* location — no
# internal port, no scheme — so they work from behind the tunnel where
# port 9006 isn't published. This is the exact route form the internet-
# facing acceptance criteria use.
for path in /quiz /exam /cheat-sheet /framework /privacy; do
    location=$(curl -sS -o /dev/null -D - -H "Host: ${DOMAIN}" "http://127.0.0.1${path}" | tr -d '\r' | awk -F': ' 'tolower($1)=="location"{print $2}')
    code=$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: ${DOMAIN}" "http://127.0.0.1${path}")
    if [ "$code" != "301" ]; then
        echo "[smoke] FAIL: GET ${path} (bare) returned ${code} (expected 301)"
        fail=1
    elif [[ "$location" == *":9006"* ]] || [[ "$location" == http://* ]]; then
        echo "[smoke] FAIL: GET ${path} (bare) redirected to '${location}' (leaks internal port or wrong scheme)"
        fail=1
    else
        echo "[smoke] PASS: GET ${path} (bare) -> 301 Location: ${location}"
    fi
done

if [ "$fail" -ne 0 ]; then
    docker logs --tail 50 "$SERVICE_NAME" 2>&1
    exit 1
fi

echo "[smoke] ALL PASS"
exit 0
