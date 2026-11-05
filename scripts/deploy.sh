#!/usr/bin/env bash
set -euo pipefail

# Deploy entrypoint for anthropic-quiz
cd "$(dirname "$0")/.."

echo "[deploy] Building and recreating anthropic-quiz container..."
docker compose build
docker compose rm -f anthropic-quiz && docker compose create anthropic-quiz && docker start anthropic-quiz

echo "[deploy] Waiting for Traefik to pick up routes..."
for i in $(seq 1 15); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: anthropic-quiz.homeserver.local' http://127.0.0.1/)" = "200" ]; then
        break
    fi
    sleep 1
done

echo "[deploy] Running smoke test..."
./smoke_test.sh

echo "[deploy] anthropic-quiz deployed successfully."
