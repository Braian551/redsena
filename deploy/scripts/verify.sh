#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$DEPLOY_DIR/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source <(sed 's/\r$//' "$ENV_FILE")
set +a

BIND="${REDSENA_HTTP_BIND:-127.0.0.1}"
PORT="${REDSENA_HTTP_PORT:-18080}"
BASE_URL="http://${BIND}:${PORT}"

check_status() {
  local path="$1"
  local expected="$2"
  local status
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${BASE_URL}${path}")"
  if [[ "$status" != "$expected" ]]; then
    echo "${path}: expected ${expected}, got ${status}" >&2
    return 1
  fi
  echo "${path}: ${status}"
}

check_status "/" "200"
check_status "/health" "200"

health_body="$(curl --silent --show-error "${BASE_URL}/health")"
if [[ "$health_body" != *'"status":"UP"'* ]]; then
  echo "Backend health is not UP: $health_body" >&2
  exit 1
fi

echo "Smoke checks passed at ${BASE_URL}."
