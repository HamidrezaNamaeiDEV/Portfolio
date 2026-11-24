# Proposed VPS deployment

The [Phase 7 runbook](../phase-7-deployment.md) is the current deployment
reference. The object storage design below is an earlier proposal. The
current application stores validated WebP in PostgreSQL.

Use one Linux VPS with Docker Compose. Nginx terminates HTTPS and is the sole public ingress. It routes the public and admin hostnames to their respective Nuxt processes. Keep both CMS network paths internal and use a DB network only for Keystone and the necessary migration and backup jobs. PostgreSQL has no published port. The S3-compatible bucket is private and off-VPS for production. Use separate secrets, buckets or prefixes, and databases for staging and production.

Pin application images and the PostgreSQL 18 image to immutable releases. The official 18 image uses `PGDATA=/var/lib/postgresql/18/docker`. Mount the persistent volume at `/var/lib/postgresql` and verify that data survives container replacement in staging. Use a database migration role separate from the runtime role. Keep secrets out of the image and build context. Measure CPU, memory and disk headroom for SSR, uploads and backups on the target architecture before release. [Official PostgreSQL 18 image](https://github.com/docker-library/postgres/blob/master/18/bookworm/Dockerfile)

## Release and rollback

1. Rehearse the migration on an empty disposable database and on a staging copy of the previous schema. Prefer additive migrations while previous application images may still be needed.
2. Confirm a usable off-host recovery point, then apply reviewed migrations once via a release job using `prisma migrate deploy`. Start the new artifacts after successful schema application and readiness checks. Keep content seed and destructive schema changes out of normal application startup.
3. Verify public HTML and canonical URLs, a published case study and cover, owner login and logout over HTTPS, and the lack of public CMS, database or bucket access. Record exact image digests and health evidence.
4. Roll back application images only against a compatible schema. Use a reviewed forward fix or restore an approved recovery point when compatibility is lost. A database restore can lose newer writes. Record the affected interval before the operator chooses recovery.

[Keystone migration workflow](https://keystonejs.com/docs/guides/database-migration/)

## Backups and recovery

Start with encrypted daily and pre-release logical backups to an off-host destination. Use PostgreSQL 18 `pg_dump` in custom format and the matching `pg_restore` from the pinned image. The workstation's default dump binary is version 15 and cannot dump an 18 server. Restore role and grant definitions from deployment provisioning and store recovery secrets separately. Alert on failed or stale backups.

Capture the database snapshot, then copy the retained immutable media objects off-host and record the object keys or versions and backup timestamp together. A file is eligible for a live or retained revision only after upload validation and successful object storage. Keep objects needed by retained revisions or retained recovery points, including archived media. This makes post-snapshot copying compatible with the database recovery point. Validate dump and media integrity before calling a backup usable.

In an isolated restore, recreate roles and required settings, apply the archive, restore matching media objects and invalidate restored admin sessions before serving Admin. Check published and draft records, history, referential integrity, admin login and asset delivery. Record actual recovery time and backup age against approved targets. A single VPS remains a failure domain. Choose point-in-time recovery or additional infrastructure only if the approved recovery targets require them.

Open production inputs include hostnames and certificate automation, VPS capacity, storage and backup regions, backup retention, maximum acceptable data loss and recovery time. Confirm them and rehearse recovery before launch. [PostgreSQL 18 pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) · [PostgreSQL 18 pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html)
