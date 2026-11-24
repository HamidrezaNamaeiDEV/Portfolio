# Phase 5 — Public Portfolio

The public homepage introduces the owner with an editorial headline, two
section links, and a static crop of the approved Gallery Corridor reference.
Technology Stack is the largest content section. Its engineering domain index
links to CMS categories, and native disclosures reveal available descriptions
and project links. The work timeline preserves Persian month precision and
shows role status when confirmed. Selected Projects stays a compact list,
followed by About and Contact.

## Routes and CMS

- `/` is the public content page. Its six section links use URL fragments
  and work with browser history. The Admin link targets the separate app
  configured by `NUXT_PUBLIC_ADMIN_URL`.
- `/robots.txt` and `/sitemap.xml` expose crawler metadata. Set
  `NUXT_PUBLIC_SITE_URL` to the public origin to enable the sitemap, absolute
  canonical link, and corridor social image.
- The homepage reads the existing public Keystone projection through
  `/api/portfolio`. Published and visible records supply profile, skills,
  categories, experience, projects, and approved contact links. The existing
  public image routes and homepage no-store policy are retained. Unknown
  contact and employment details remain absent. Project catalogue and detail
  routes are deferred.

## Screenshots

- [Desktop homepage, 1440px](screenshots/phase-5/homepage-desktop.png)
- [Mobile homepage, 390px](screenshots/phase-5/homepage-mobile.png)

Screenshots use seeded records published inside disposable PostgreSQL.
Production publication remains under owner control.

## Verification and observations

- Workspace lint, typecheck, and build passed. Vitest passed 5 tests.
- Playwright passed 20 tests and exercised the existing publication and draft boundaries, public
  SSR, Persian dates, keyboard disclosure, anchor history, reduced motion,
  mobile overflow, crawler metadata, the deferred project route returning 404,
  and desktop/mobile screenshots.
- Responsive WebP posters are approximately 37 KiB and 19 KiB. The decorative
  picture has explicit dimensions and priority loading. Gallery rendering
  uses HTML and CSS. Field performance and screen reader behavior were not
  measured. Browser zoom at 200% remains unchecked.
- The desktop review prompted a wider headline column. Mobile places the
  poster after the hero actions, preserving the full reading surface for
  the introduction and navigation.

## Phase 6

Use `GalleryPoster.vue` as the integration point for the approved 3D work.
Retain the poster and HTML domain links as the fallback. Validate one
station against the poster baseline on desktop and a physical mobile device
before adding the remaining stations. Confirm asset rights and station labels
before the production release.
