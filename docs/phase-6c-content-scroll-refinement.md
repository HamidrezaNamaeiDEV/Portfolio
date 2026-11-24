# Phase 6C — Content and gallery scroll

## Implementation plan

1. Audit the production public API and CMS before changing publication. Publish
   only existing approved records and the taxonomy they require. Verify the
   public response and browser rendering after publication.
2. Give the activated desktop hero a sticky track. The web app converts native
   document position to progress. The renderer interpolates the existing five
   poses and no longer subscribes to document scroll.
3. Route keyboard, ray picking and station selection through native scrolling
   to station positions on that same track. Keep the static hero outside the
   track until successful activation and on mobile and reduced motion.
4. Verify at the requested viewport sizes and capture the published local
   records in the browser. Keep production verification pending until there
   is an instance to inspect.

## Content audit

The accessible PostgreSQL instance is the local `portfolio-dev-db` container.
A read-only query found 40 skills, 5 skill categories, 4 proficiency records,
2 experiences and 3 projects. All were visible drafts. All 40 skills
referenced categories and none had logos. This establishes why the local
public projection is empty. It does not establish production record counts.

The owner confirmed that production access is unavailable and authorized
publishing in the persistent local CMS. The authenticated admin routes
published the existing 5 categories, 4 proficiency records, 40 skills,
2 experiences and 3 projects. Before/after record comparison confirmed
that only publication status changed. The three skills with an Unverified
proficiency still show their recorded label. No logo had been
uploaded. The public local API changed from zero records to 5 categories,
40 skills, 2 experiences and 3 projects. The protected content route
continued to return HTTP 401 without a session.

The rendered page shows Part Software Company and SabzCoder Team as
Software Developer, with Bahman 1404 and Khordad 1404 start dates
respectively. It also shows Qeshm Portal, Luxury Auction Platform and the
existing Kartamoon title. The local database includes no approved
experience descriptions or project cover images. Production counts
and public verification remain pending. No production publication was
performed.

## Scroll implementation

The Phase 6B renderer listened to window scroll and moved the camera from
the canvas's position while the browser itself moved the page. Selection
also held a separate travel offset, so the two movements could diverge.

The desktop hero now occupies a native sticky track after successful WebGL
activation. The application computes normalized progress from
`(scrollY - trackStart) / trackDistance`. The renderer receives that value,
eases between existing station poses and reports the nearest station. Its
own document scroll listener is removed. Keyboard and pointer selection
both scroll natively to the corresponding stop. Scrolling after either
boundary leaves the gallery at its endpoint. Mobile, reduced motion, and
failed activation retain the same static poster and normal page flow.

The relevant files are `apps/web/app/pages/index.vue`,
`apps/web/app/components/GalleryHero.vue`, `apps/web/app/assets/portfolio.css`,
`libs/three-scenes/index.ts`, and `tests/e2e/gallery.spec.ts`. The existing
corridor, station geometry, CMS access rules and API projections are reused.

## Current local browser captures

The following captures were taken from the persistent local CMS after
publication. The desktop build used Chromium with Intel UHD 630 WebGL.
The mobile capture used a 390 × 844 touch viewport.

- [Desktop hero and published content](screenshots/phase-6c/desktop-content.png)
- [Mobile poster and published content](screenshots/phase-6c/mobile-content.png)
- [Frontend](screenshots/phase-6c/gallery-frontend.png)
- [Backend](screenshots/phase-6c/gallery-backend.png)
- [AI](screenshots/phase-6c/gallery-ai.png)
- [Infrastructure](screenshots/phase-6c/gallery-infrastructure.png)
- [Product](screenshots/phase-6c/gallery-product.png)

## Verification

- The three pinning regressions failed on Phase 6B because the hero was
  relatively positioned. The full updated Playwright suite passed all 27
  tests against disposable PostgreSQL. It exercised native wheel input,
  all station positions, reverse travel, keyboard selection and normal
  scrolling outside the pin at 1280 × 800, 1440 × 1000 and 1920 × 1080.
  It also covered reduced motion, context loss, model failure, and normal
  mobile scrolling at 390 × 844.
- The persistent local CMS returned the expected counts. In headed Chromium
  the rendered DOM showed all 40 skill rows, 5 categories, 2 experience
  entries and 3 projects. The five station captures used the actual local
  CMS data and WebGL. No physical phone or production instance was tested.
- Build, typecheck, lint, 5 Vitest tests, and formatting of the Phase 6C
  source files passed. The repository-wide formatting check reports
  pre-existing differences in `deploy/compose.yaml` and `deploy/nginx/proxy.inc`.
- Headless software WebGL is useful for regression checks and is not a
  desktop hardware performance measurement. Production frame timing remains
  unmeasured.

## Local Nuxt DevTools

The public web workspace pins Nuxt DevTools 4.2.0 and enables it only in
the development configuration. With CMS running, start web from the
workspace root using `npm run dev:web`. It loads the ignored root `.env`
and binds to loopback. On the homepage use **Shift + Alt + D**. The local
DevTools endpoint returned HTTP 200 and the separately started built
preview returned HTTP 404 for the same endpoint. The public portfolio
API on the development server still returned all published local records.
