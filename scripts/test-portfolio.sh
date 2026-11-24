#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
postgres_image='postgres:18-bookworm@sha256:00c8c7a0356f34e1a4c5f2fd40510457d4025564411605fc228ca194e5f7023a'
database=''
trap 'if [[ -n "$database" ]]; then docker rm -fv "$database" >/dev/null; fi' EXIT

test "$(node -v)" = v24.22.3
test "$(npm -v)" = 11.19.1
export POSTGRES_PASSWORD=$(openssl rand -hex 24)
database=$(docker run -d --name "portfolio-content-$$-${RANDOM}" \
  --tmpfs /var/lib/postgresql -p 127.0.0.1::5432 \
  --env POSTGRES_PASSWORD --env POSTGRES_USER=portfolio_test \
  --env POSTGRES_DB=portfolio_test "$postgres_image")

for (( attempt=0; attempt<30; attempt++ )); do
  if docker exec "$database" pg_isready -h 127.0.0.1 -U portfolio_test -d portfolio_test >/dev/null; then
    break
  fi
  sleep 1
done
docker exec "$database" pg_isready -h 127.0.0.1 -U portfolio_test -d portfolio_test
docker exec "$database" postgres --version

port=$(docker port "$database" 5432/tcp)
export CMS_DATABASE_URL="postgresql://portfolio_test:${POSTGRES_PASSWORD}@${port}/portfolio_test"
export CMS_SESSION_SECRET=$(openssl rand -hex 32)
export CMS_OWNER_EMAIL='owner@example.test'
export CMS_OWNER_PASSWORD=$(openssl rand -hex 24)
export CMS_INSECURE_DEV_COOKIE=1
export CMS_PORT=47123
export NUXT_ADMIN_ORIGIN=http://127.0.0.1:47122
export NUXT_CMS_URL=http://127.0.0.1:47123

npm run migrate:deploy -w @a/cms
npm run owner:create -w @a/cms
npm run seed:content -w @a/cms
npm run seed:content -w @a/cms
npm exec --offline -- playwright test "$@"
