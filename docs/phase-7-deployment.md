# Phase 7 — Deployment preparation

## Audit

| Area | Current evidence |
| --- | --- |
| Nuxt | Web and admin build to separate `.output` directories. Listen on 3000 and 3001 in the deployment design. Both render on the server. |
| Keystone | Port 3002, native Admin UI disabled, fixed Nuxt facades and PostgreSQL-backed owner sessions. The CMS has a 400 KiB GraphQL body limit. |
| PostgreSQL | Prisma migrations and a pinned PostgreSQL 18 image exist in the smoke scripts. No production volume or database role provisioning existed at audit time. |
| Media | Keystone validates PNG, JPEG and WebP up to 256 KiB and bounds decoding to 4 million pixels. Optimized WebP lives in database fields. Web serves only published and visible images. The older architecture's object store is a proposal. |
| Deployment | No Dockerfile, Compose stack, Nginx config, production health checks or scheduled backup job existed at audit time. Local builds and a disposable PostgreSQL smoke/recovery script exist. |
| Runtime settings | CMS database URL and session secret are private. Nuxt uses an internal CMS URL, the exact admin HTTPS origin and the public canonical URL. Owner credentials are only for provisioning. |

## Deployment plan

1. Package the three existing processes with pinned base images. Keep Nginx on
   the host so certificate renewal and ingress have one owner. Expose web and
   admin to Nginx over host loopback. Isolate CMS and PostgreSQL in Compose.
2. Keep private media in the persistent PostgreSQL volume. The same logical
   dump contains a consistent snapshot of content and media. Prepare separate
   database owner, runtime and backup credentials before exposing staging.
3. Provision a separate staging project with its own volumes, DNS and secrets.
   Verify the complete HTTPS and recovery checklist before proposing production.
4. Promote reviewed image digests with a backed-up maintenance window, exact
   migration logs and a documented rollback decision.

Start sizing at 2 vCPU, 4 GiB RAM and 40 GiB SSD for a small single-owner site.
This is a planning estimate. Build images elsewhere and measure SSR latency,
peak upload memory, database growth, log usage and restore disk headroom on
staging before choosing production capacity.

## Topology and configuration

```text
Internet → host Nginx :80/:443 → 127.0.0.1:3000 → Nuxt web
                            └─→ 127.0.0.1:3001 → Nuxt admin
                  web and admin → internal application bridge → Keystone :3002
                                             Keystone → internal DB bridge → PostgreSQL :5432
                                                                └─ named volume with media
```

[Dockerfile](../deploy/Dockerfile) · [Compose](../deploy/compose.yaml) ·
[Env keys](../deploy/.env.example) · [Nginx hosts](../deploy/nginx/portfolio.conf) ·
[Proxy settings](../deploy/nginx/proxy.inc)

Use distinct Compose project names and separate env files, database volumes,
hostnames and credentials. For two stacks on the same host, assign staging its
own loopback ports and update its Nginx upstreams. A separate staging VPS
provides stronger isolation. The public inbound rules are SSH from the owner's
trusted network where feasible, plus TCP 80 and 443. Verify the resulting
listeners externally, including IPv6 if enabled. Docker-published ports can
bypass some UFW rules, so the bind addresses are part of the security boundary.
[Docker firewall behavior](https://docs.docker.com/engine/network/packet-filtering-firewalls/)

### Initial deployment and staging checklist

1. On a supported Linux distribution, establish key-based SSH with a second
   verified login session and provider console recovery. Restrict root and
   password SSH after verification. Set firewall policy, security updates,
   accurate time and log retention. Treat Docker group membership as root
   access. Keep a named operator account.
2. Build the `web`, `admin` and `cms` Dockerfile targets with
   `docker build --target TARGET -f deploy/Dockerfile -t IMAGE .`. Record the
   reviewed Git commit and publish artifacts to the owner's private registry.
   Use digest references in the host env file. Store it outside the checkout
   with mode 0600, and keep the session secret and database credentials in the
   owner's password manager. Avoid printing effective Compose configuration.
3. Use the Compose command prefix
   `docker compose --env-file /etc/portfolio/staging.env -p portfolio-staging -f deploy/compose.yaml`.
   Run `config --quiet`, then `up -d --wait db`. Provision distinct database
   login roles inside `portfolio` using a maintenance psql session. Use
   psql's `\password` prompt to set credentials without literal SQL secrets.
   Make the migration role the database owner so it can execute the initial
   schema creation statement. Grant it CREATE and USAGE on public and ownership
   of objects it creates. Remove PUBLIC connect and temporary privileges on
   the dedicated database, then grant runtime CONNECT, schema USAGE, table
   SELECT/INSERT/UPDATE/DELETE and sequence USAGE. Grant backup CONNECT,
   schema USAGE, table SELECT and sequence SELECT. Apply equivalent default
   privileges **for the migration role** before its first migration.
   Use `portfolio_backup` as the backup role name. On databases with existing
   objects, reconcile ownership and current grants separately. Keep runtime
   away from superuser, schema ownership and DDL rights.
4. Set `MIGRATION_DATABASE_URL` and `CMS_DATABASE_URL` to the respective role
   URLs with host `db`. Percent-encode URI credentials. Run
   `--profile release run --rm migrate` with the prefix above. Create the
   owner once with a CMS one-off container using the existing
   `npm run owner:create -w @a/cms` command and owner email/password supplied
   through a private env file. Keep those values out of steady-state services.
   Use fixture content only in staging. Start the runtime with
   `up -d --wait web admin cms` and inspect `ps` and service logs.
5. Set the two DNS names. Use an ACME client with webroot at `/var/www/acme`.
   Start with the HTTP vhost so issuance works before the certificate files
   exist. Install both TLS vhosts after issuance. Verify `nginx -t`, reload,
   test renewal and its reload hook, and block unknown hostnames in the
   host's default vhost. Verify HTTPS from an external machine. Consider HSTS
   after renewal and origin routing are established. Review CSP against
   Nuxt SSR, gallery assets and admin image previews before enforcing it.
6. Verify public HTML, canonical URL, sitemap and headers using HTTPS. Verify
   sign-in, sign-out, Secure/HttpOnly/SameSite and host-only cookie scope,
   exact Origin enforcement and anonymous denial through Nginx. Exercise
   the login throttle and editor limit, then publish one skill or project
   with an image. Verify its SSR output and public image, unpublish it and
   confirm both disappear. Confirm the browser never reaches Keystone or
   PostgreSQL directly. Keep admin pages and previews private and uncached.
7. Check gallery activation on desktop, the five CMS links, static fallback
   on phone and reduced motion, and no scene prefetch on the static path.
   Compare browser traces against the Phase 6B and performance baselines.
   Verify certificate renewal, log rotation, health checks and volume
   persistence during a controlled staging restart.

### Updates, rollback and monitoring

Record running image digests, schema state and the backup ID before updating.
Review migration SQL and rehearse it on a restored staging copy. Run the
explicit migration job once, then start the new images and repeat the core
HTTPS checks. If application rollback is needed, use the prior image digests
only with a compatible schema. An incompatible migration needs a reviewed
forward fix or an owner-authorized recovery to a new volume. Record the
potential lost write interval before switching any traffic.

Monitor public HTTPS and SSR, Compose health, disk space and growth, database
availability, 5xx/429 rates, certificate expiry and age of the last verified
off-host copy. For a 502, check Nginx upstream ports and container health.
For a CMS 503, check the private DNS name, migration status and role grants.
For a login failure, inspect the exact configured admin origin and Secure
cookie in the browser before changing configuration. Keep authenticated
requests, secrets and raw uploads out of logs.

## Backup and recovery

Run [backup.sh](../deploy/backup.sh) from a daily systemd timer and before
migrations. A dedicated SSH alias with a pinned host key should write into
an off-host destination with server-side retention. The script streams a
custom PostgreSQL dump through age, writes a checksum and transfers both over
SSH. Store the private age key off the VPS with a separate recovery copy.
Install a one-shot systemd service with `EnvironmentFile=/etc/portfolio/backup.env`
and `ExecStart=/usr/bin/bash /opt/portfolio/deploy/backup.sh`. Use a
persistent timer with `OnCalendar=*-*-* 02:30:00 UTC`. The job operator
needs Docker access, age, scp and the pinned SSH host key. Run the service
manually and verify receipt before enabling the timer. Alert on nonzero
exit, stale uploads and a stale restore rehearsal. Apply
retention on the destination and local spool independently. Proposed policy
is 7 daily, 4 weekly and 3 monthly copies, with protected pre-release copies
until acceptance. Proposed objectives are 24 hours maximum data loss and a
2-hour restore. Confirm both against real staging evidence.

To restore, verify the encrypted archive checksum, decrypt in isolation and
recreate database roles and grants. Use the matching PostgreSQL client with
`pg_restore --exit-on-error --single-transaction --no-owner --no-acl` against
a fresh database as its intended object owner. Start the compatible CMS and
verify migration history, record counts, public and draft behavior, WebP
checksums and owner login before any traffic switch. Use a new session secret
so old cookies do not carry forward. The single archive already includes
database-backed media.
[PostgreSQL 18 restore documentation](https://www.postgresql.org/docs/18/app-pgrestore.html)

## Local evidence and production gates

- All three Docker targets built. Compose 5.5 validated the YAML with
  placeholder settings. Nginx syntax passed in an isolated test.
- A separate local Compose project passed all service health checks. All
  three Prisma migrations and owner bootstrap passed with distinct
  migration and runtime roles. The initial attempt with only schema grants
  exposed the database ownership requirement documented above.
- A loopback Nginx test trusted a temporary self-signed certificate
  explicitly. Public SSR and canonical URL, poster HTML, byte-identical
  gallery GLB, Secure/HttpOnly/SameSite=Lax login cookie, anonymous denial,
  rejected cross-origin login, authenticated publishing, public WebP and a
  dump under the backup role passed. The test services were stopped after
  the run. Its fixture volumes were retained. Public DNS, ACME renewal,
  the rate-limit threshold and browser interaction through the VPS still
  need staging verification.
- [Restore rehearsal](../deploy/rehearse-restore.sh) passed on PostgreSQL 18.7.
  It applied repository migration SQL, dumped to custom format, restored to a
  separate fresh database, and compared two fixture records and the WebP
  checksum. It did not test the external encrypted upload, Prisma migration
  history, owner auth or live staging recovery.
- Public staging still needs the VPS, DNS names, trusted certificates, reviewed
  release digests, approved role grants and private runtime secrets. An
  off-host account, public recovery key, backup retention and recovery goals
  also need owner input. Production approval follows the HTTPS and off-host
  recovery drills.
