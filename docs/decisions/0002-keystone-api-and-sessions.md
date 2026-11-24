# ADR 0002 — Keystone authority and API boundaries

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

The public site needs a small, predictable set of content operations. The custom admin needs explicit access to drafts and a compatible SSR session flow.

Place Keystone on a private network. Keep its authentication and authorization authoritative. Use a same-origin admin facade for fixed operations and host-only session forwarding. Persist Keystone stored sessions in PostgreSQL for expiry and owner revocation. Keep preview on the admin origin. Serve narrow published projections to public Nuxt through Keystone GraphQL extensions. Reuse generated list operations for administrative reads where they fit. Apply backend checks to both generated and custom operations and deny generated editorial mutations. Public SSR forwards no session or caller-supplied query document.

Direct browser GraphQL calls would reduce proxy code but would expose the general GraphQL surface and require an explicit cross-origin cookie model. A second backend would duplicate deployment and authorization. The proposed facade adds operation mapping and proxy tests, with one source of session and publication authority.

Prove login, revocation and exact-Origin handling in the Project slice, then verify cookie behavior through the production-like HTTPS proxy. The baseline is authenticated in-admin preview. Reviewer sharing and full public-layout preview are deferred.

[Security design](../architecture/security.md) · [Keystone schema extension](https://keystonejs.com/docs/guides/schema-extension/) · [Keystone sessions](https://keystonejs.com/docs/config/session/)
