#!/usr/bin/env bash
# Runs ON THE SERVER (from /opt/tac). Usage:
#   deploy.sh [--env-stdin] KEY=VALUE ...
# KEY=VALUE args update image tags (TAG_MAIN/TAG_B/TAG_C, DOCKERHUB_USER). With --env-stdin, KEY=VALUE lines
# on stdin (secrets/config) are merged into .env. Rolls back automatically if a service is unhealthy.
set -euo pipefail
cd /opt/tac
touch .env && chmod 600 .env
ALLOWED='^(DOCKERHUB_USER|TAG_MAIN|TAG_B|TAG_C|ADMIN_PASSWORD|MONGODB_URI|ADMIN_EMAIL|SMTP_HOST|SMTP_PORT|SMTP_SECURE|SMTP_USER|SMTP_PASS|SMTP_FROM|ENQUIRY_TO|MAIN_SITE|B_SITE|C_SITE|DEMO_MODE|DEMO_PASSWORD|APP_DATA_DIR)$'

set_var() { # key value
  local k="$1" v="$2"
  [[ "$k" =~ $ALLOWED ]] || { echo "refusing unknown key: $k" >&2; exit 2; }
  [[ "$v" != *$'\n'* && "$v" != *"'"* ]] || { echo "newline or single quote not allowed in value of $k" >&2; exit 2; }
  if [[ "$k" == TAG_* || "$k" == DOCKERHUB_USER ]]; then [[ "$v" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "bad value for $k" >&2; exit 2; }; fi
  grep -v "^${k}=" .env > .env.tmp || true
  printf "%s='%s'\n" "$k" "$v" >> .env.tmp   # single quotes = literal in compose .env (no $ interpolation)
  mv .env.tmp .env; chmod 600 .env
}

cp .env .env.prev
if [[ "${1:-}" == "--env-stdin" ]]; then
  shift
  while IFS= read -r line; do [[ -z "$line" ]] && continue; set_var "${line%%=*}" "${line#*=}"; done
fi
for kv in "$@"; do set_var "${kv%%=*}" "${kv#*=}"; done

echo "==> pulling images"
docker compose pull --quiet
echo "==> starting"
docker compose up -d --remove-orphans

healthy() {
  local ok=1 id st
  for svc in $(docker compose config --services); do
    id=$(docker compose ps -q "$svc") || true
    [[ -n "$id" ]] || { ok=0; continue; }
    st=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")
    [[ "$st" == healthy || "$st" == running ]] || ok=0
  done
  [[ $ok -eq 1 ]]
}
for _ in $(seq 1 40); do healthy && { echo "==> all services healthy"; docker image prune -f --filter "until=168h" >/dev/null || true; docker compose ps; exit 0; }; sleep 3; done

echo "!! deployment unhealthy — rolling back" >&2
docker compose ps >&2 || true; docker compose logs --tail 40 >&2 || true
cp .env.prev .env && docker compose up -d --remove-orphans || true
exit 1
