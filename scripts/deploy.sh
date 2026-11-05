#!/usr/bin/env bash
set -euo pipefail

# Deploy entrypoint for anthropic-quiz
cd "$(dirname "$0")/.."

echo "[deploy] Building and recreating anthropic-quiz container..."
docker compose build
docker compose rm -f anthropic-quiz && docker compose create anthropic-quiz && docker start anthropic-quiz

echo "[deploy] Running smoke test..."
./smoke_test.sh

echo "[deploy] anthropic-quiz deployed successfully."
