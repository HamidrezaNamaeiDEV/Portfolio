#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

postgres_image='postgres:18-bookworm@sha256:00c8c7a0356f34e1a4c5f2fd40510457d4025564411605fc228ca194e5f7023a'
node_image='node:24.22.3-bookworm@sha256:4140e303c3dcf97edde1e42837bcb8db8c5d349d20582990d9b3ee99ee71481e'
name="portfolio-foundation-$$-${RANDOM}"
network=''
database=''
runner=''

cleanup() {
  local status=$?
  if [[ -n "$runner" ]]; then
    if (( status != 0 )); then
      docker exec "$runner" cat /tmp/keystone.log >&2 2>/dev/null || true
    fi
    docker rm -fv "$runner" >/dev/null || true
  fi
  if [[ -n "$database" ]]; then docker rm -fv "$database" >/dev/null || true; fi
  if [[ -n "$network" ]]; then docker network rm "$network" >/dev/null || true; fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

network=$(docker network create "$name")
db_password=$(openssl rand -hex 24)
export POSTGRES_PASSWORD="$db_password"

database=$(docker run -d --name "$name-db" --network "$network" --network-alias postgres \
  --tmpfs /var/lib/postgresql --env POSTGRES_PASSWORD --env POSTGRES_USER=foundation \
  --env POSTGRES_DB=foundation "$postgres_image")
runner=$(docker run -d --name "$name-node" --network "$network" --workdir /work \
  "$node_image" sleep infinity)

run() {
  docker exec --workdir /work "$runner" "$@"
}

wait_for_database() {
  for (( attempt=0; attempt<30; attempt++ )); do
    if docker exec "$database" pg_isready -h 127.0.0.1 -U foundation -d foundation >/dev/null; then
      return 0
    fi
    sleep 1
  done
  docker logs --tail 30 "$database" >&2
  return 1
}

wait_for_database
docker exec "$database" postgres --version
docker exec "$database" pg_dump --version
docker exec "$database" pg_restore --version

run sh -ec 'test "$(node -v)" = v24.22.3; test "$(npm -v)" = 11.19.1; node -v; npm -v'
tar --exclude=node_modules --exclude=.nuxt --exclude=.output --exclude=.keystone \
  --exclude=generated --exclude=.env --exclude='.env.*' \
  -cf - package.json package-lock.json .npmrc tsconfig.base.json apps libs \
  | docker exec -i "$runner" tar -C /work -xf -
run npm ci --no-audit --no-fund
run npm run check:schema -w @a/cms

export CMS_DATABASE_URL="postgresql://foundation:${db_password}@postgres:5432/foundation"

cms() {
  docker exec --env CMS_DATABASE_URL --workdir /work/apps/cms "$runner" "$@"
}

cms npm run migrate:deploy
cms node tests/database-smoke.ts write
docker exec -d --env CMS_DATABASE_URL --workdir /work/apps/cms "$runner" \
  sh -c 'exec npm run start > /tmp/keystone.log 2>&1'
cms node tests/http-smoke.ts

docker exec "$database" pg_dump -U foundation -d foundation --format=custom --file=/tmp/foundation.dump
cms node tests/database-smoke.ts simulate-bad-release
docker exec "$database" createdb -U foundation foundation_restored
docker exec "$database" pg_restore -U foundation -d foundation_restored \
  --exit-on-error /tmp/foundation.dump

CMS_DATABASE_URL="${CMS_DATABASE_URL%/foundation}/foundation_restored" cms node tests/database-smoke.ts verify-restore
CMS_DATABASE_URL="${CMS_DATABASE_URL%/foundation}/foundation_restored" cms npm exec --offline -- prisma migrate status
printf '%s\n' 'PASS isolated PostgreSQL recovery and restored Prisma migration history'
