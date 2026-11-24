#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
image='postgres:18-bookworm@sha256:00c8c7a0356f34e1a4c5f2fd40510457d4025564411605fc228ca194e5f7023a'
export POSTGRES_PASSWORD=$(openssl rand -hex 24)

# One disposable container, no published ports or production volumes.
docker run --rm --network none --tmpfs /var/lib/postgresql   --env POSTGRES_PASSWORD --env POSTGRES_DB=source_fixture   --mount "type=bind,source=$PWD/apps/cms/migrations,target=/migrations,readonly"   --mount "type=bind,source=$PWD/apps/web/public/images/gallery-corridor-small.webp,target=/fixture.webp,readonly"   "$image" bash -ec '
    docker-entrypoint.sh postgres &
    server=$!
    trap "kill -TERM $server; wait $server" EXIT
    for attempt in {1..60}; do
      if pg_isready -h 127.0.0.1 -U postgres -d source_fixture >/dev/null; then break; fi
      sleep 1
    done
    pg_isready -h 127.0.0.1 -U postgres -d source_fixture
    for migration in /migrations/*/migration.sql; do
      psql -X -v ON_ERROR_STOP=1 -U postgres -d source_fixture -f "$migration" >/dev/null
    done
    psql -X -v ON_ERROR_STOP=1 -U postgres -d source_fixture <<'"'"'SQL'"'"'
INSERT INTO "Project" (id, name, slug, status, cover) VALUES
  ('"'"'live'"'"', '"'"'Published fixture'"'"', '"'"'published-fixture'"'"', '"'"'published'"'"',
    '"'"'data:image/webp;base64,'"'"' || replace(encode(pg_read_binary_file('"'"'/fixture.webp'"'"'), '"'"'base64'"'"'), chr(10), '"'"''"'"')),
  ('"'"'draft'"'"', '"'"'Draft fixture'"'"', '"'"'draft-fixture'"'"', '"'"'draft'"'"', '"'"''"'"');
SQL
    pg_dump -U postgres -Fc --no-owner --no-acl -f /tmp/portfolio.dump source_fixture
    createdb -U postgres restore_fixture
    pg_restore -U postgres --exit-on-error --single-transaction       --no-owner --no-acl -d restore_fixture /tmp/portfolio.dump
    query='"'"'SELECT id, status, md5(cover) FROM "Project" ORDER BY id'"'"'
    original=$(psql -XAt -U postgres -d source_fixture -c "$query")
    restored=$(psql -XAt -U postgres -d restore_fixture -c "$query")
    test -n "$original"
    test "$original" = "$restored"
    pg_restore --list /tmp/portfolio.dump | head -12
    printf "%s\n" "PASS application schema, published and draft data, and WebP checksum restored"
  '
