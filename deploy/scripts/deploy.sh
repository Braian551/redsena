#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill production values." >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "Validating RedSENA Compose configuration..."
compose config --quiet

echo "Building and starting only the redsena-prod project..."
compose up -d --build --remove-orphans

echo "Current RedSENA service status:"
compose ps

echo "Running local smoke check..."
bash "$DEPLOY_DIR/scripts/verify.sh"

echo "RedSENA deployment completed."
