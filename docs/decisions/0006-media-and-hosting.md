# ADR 0006 — Private media and VPS topology

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

Phase 3 uses the smaller workflow recorded in [ADR 0007](0007-portfolio-content-foundation.md). This document preserves the earlier design for future work.

Drafts can reference uploaded media. Production is intended to run on a Linux VPS with Nginx, Docker and durable storage.

Keep all uploaded objects private in S3-compatible storage. Publish only media references attached to live content and deliver through a narrow read path. Keep PostgreSQL private and operate the applications with Docker Compose behind Nginx. Use paired off-host database and media backups and rehearsal of an isolated restore. Pin PostgreSQL 18 and use its image's data mount and PostgreSQL 18 dump and restore tools.

Public-on-upload simplifies image delivery and exposes URLs before editorial approval. Copying selected objects into a public bucket upon publication reduces request overhead and introduces object-copy consistency and withdrawal concerns. Kubernetes or multiple hosts add operational work before traffic and recovery needs are known. The proposal adds authorization checks to media fetches and keeps storage and compute failures separable if storage is hosted off-VPS.

Start with no-store editorial media. Confirm test storage and image policy for the Project slice. Confirm production provider, sizing and recovery targets before launch. Add caching or point-in-time recovery only once the approved targets or evidence justify them.

[Security](../architecture/security.md#media-and-preview) · [Deployment proposal](../deployment/vps-deployment.md)
