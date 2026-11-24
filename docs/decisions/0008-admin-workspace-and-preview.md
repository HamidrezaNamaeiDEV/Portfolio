# ADR 0008 — Admin workspace and private preview

Phase 4 extends the existing Nuxt admin and Keystone facade for the owner's
approved workflows. It does not replace the application, Keystone, or the Nx
boundaries.

## Decision

- Keep the existing Technology Stack, experience, project, and taxonomy editors;
  add the overview and focused profile and preview routes to the same owner
  session.
- Store the professional profile as a fixed-key `SiteSettings` row with the
  reserved key `portfolio`. Keep unconfirmed name, contact, image, and social
  values blank. Seed only the confirmed headline and supporting description;
  leave the profile in draft status.
- Keep company logos and the profile image within the bounded image-string
  workflow already used for content. Add no separate media library or storage
  system in this phase.
- Add optional validated HTTP(S) project and profile links. Continue to render
  public fields only from the published-and-visible projection.
- Keep `/preview` under the admin host. Require the existing owner session for
  its API and show the public snapshot separately from visible draft
  candidates. A draft never appears in the public projection because it is
  marked visible.
- Preserve month-level Persian dates and the existing concise project list.
  Do not add revisions, case-study editing, a cinematic homepage, or 3D work.

## Consequences

This reuses the current contracts, CMS facade, and deployment boundaries. A
published edit appears in the next public read, matching the Phase 3 behavior;
history and staged changes alongside a live revision remain future editorial
decisions. The profile and company image values remain bounded by the existing
image limits. The preview API is an authenticated admin response and is marked
`private, no-store` and `noindex`, including unauthorized error responses.

## Verification

Playwright covers anonymous and owner access, cache and indexing headers,
published/draft separation, blank profile values, URL validation, image
projection, public server-rendered output, and mobile content navigation. The
suite uses a disposable PostgreSQL database and does not exercise production
hosts or deploy changes.
