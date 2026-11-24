# Phase 4 — Admin UX and Content Refinement

## Delivery summary

Phase 4 extends the existing Nuxt, Keystone, PostgreSQL, Nx, and design-token
architecture. It delivers an owner dashboard, clearer content workflows, a CMS
professional profile, an owner-only preview, and public SSR for published
profile and content fields. The work remains in the current checkout; no
production deployment or Phase 5 work was performed.

The seed still contains the original 40 skill names and exact proficiency
levels, two experience records at Persian month precision, and three project
names. All seeded content remains draft. Only the confirmed headline and
supporting description are present in the profile seed; unknown name, contact,
employment, achievement, image, and link fields remain blank.

## Existing functionality reused

- The owner session and login/logout facade, Keystone access control, fixed
  admin API operations, `AdminContent` and `PublicPortfolio` contracts, and
  PostgreSQL-backed CMS lists.
- Existing create, edit, delete, relationship, ordering, publication, and
  visibility behavior for skills, taxonomies, work experience, and projects.
- The current bounded image upload and public image routes, the shared design
  tokens, the idempotent content seed, the public SSR page, and the Persian
  month formatter.

## UI and workflow improvements

- Added a compact dashboard with CMS-derived totals and direct actions for the
  technology stack, experience, projects, profile, preview, and skill creation.
- Added category, proficiency, publication, visibility, and search filters for
  skills; visible proficiency and logo summaries; and explicit selected-skill
  bulk publication and visibility actions.
- Added company-logo and project-URL inputs, grouped the longer experience
  fields, clarified that visibility applies after publication, retained a
  visible focus ring, and made mobile navigation wrap at 390px.
- Kept the content table semantic while changing its small-screen rows to a
  readable grid. Preserved an unsaved editor draft in memory through a 401 and
  owner reauthentication.
- Kept selected skills explicit across filters by reporting how many selected
  rows are outside the current results and adding a clear-selection action.
- Added profile status and visibility messaging, blank editable fields, a
  profile image control, and a preview that separates published content from
  visible draft candidates.
- Kept content/profile save controls at the end of their forms so they remain
  reachable without covering input fields; Playwright checks their viewport
  bounds against editable controls.

An independent Impeccable review identified draft loss after a 401, narrow
mobile content labels, a long experience form, unclear publication/visibility
copy, and a suppressed focus ring. These were addressed and rechecked in the
browser. The second independent review reported no deterministic findings at
1440×900 and 390×844. Screenshot review led to wrapping both mobile navigation
rows and capturing the long profile form in two real viewport views.

A separate implementation review identified a nullable public company-logo
type, save controls covering editable fields, and selected skills remaining
selected outside the current filter. These were corrected and covered by the
browser suite; the final review found no critical or important findings.

## New functionality

- Added a fixed-key `SiteSettings` profile record and owner- and origin-checked
  `GET/PUT /api/profile` operations. The profile remains a draft after seeding.
- Added optional `Experience.companyLogo` and validated `Project.url` fields
  through a reviewed additive migration and regenerated Keystone schemas.
- Added `/preview` and `/api/preview`. The API requires the existing owner
  session and returns the published public projection separately from visible
  draft candidates. The route is private, non-storable, and non-indexable.
- Added public SSR for the published visible profile, contact/social links,
  company logos, and project links. Empty or unpublished profile details use
  the confirmed static headline and supporting description.
- Added safe URL validation and a normalized telephone link. Public profile and
  experience images are served only when their source records are published
  and visible.

## Browser screenshots

Screenshots were captured by the Playwright browser against the disposable
PostgreSQL fixture. The fixture uses the test owner `owner@example.test` and
the seeded portfolio content; the profile screenshot uses only the confirmed
copy and leaves other fields blank.

- Overview, 1440×1000: [overview-desktop.png](screenshots/phase-4/overview-desktop.png)
- Technology stack, full page at 1440px width: [technology-stack-desktop.png](screenshots/phase-4/technology-stack-desktop.png)
- Technology stack, 390×844: [technology-stack-mobile.png](screenshots/phase-4/technology-stack-mobile.png)
- Profile, top viewport at 1440×1000: [profile-desktop.png](screenshots/phase-4/profile-desktop.png)
- Profile publication fields after scrolling, 1440×1000: [profile-publication-desktop.png](screenshots/phase-4/profile-publication-desktop.png)
- Published and draft preview, full page at 1440px width: [preview-desktop.png](screenshots/phase-4/preview-desktop.png)

## Changed files

- Admin shell and interface: `apps/admin/app/app.vue`,
  `apps/admin/app/assets/admin.css`, `apps/admin/app/components/`,
  `apps/admin/app/composables/useAdminSession.ts`, `apps/admin/app/pages/`, and
  `apps/admin/app/utils/content-editor.ts`.
- Admin server facade: `apps/admin/server/api/content/bulk.post.ts`,
  `apps/admin/server/api/preview.get.ts`, `apps/admin/server/api/profile.get.ts`,
  `apps/admin/server/api/profile.put.ts`, and
  `apps/admin/server/utils/{cms,content,profile}.ts`.
- CMS, contracts, and tokens: `apps/cms/content/`,
  `apps/cms/migrations/20261124200000_profile_and_links/`,
  `apps/cms/schema.graphql`, `apps/cms/schema.prisma`,
  `apps/cms/scripts/seed-content.ts`, `libs/contracts/index.ts`, and
  `libs/design-tokens/tokens.css`.
- Public rendering: `apps/web/app/app.vue`, `apps/web/app/assets/portfolio.css`,
  `apps/web/app/components/SelectedProjects.vue`,
  `apps/web/app/components/WorkExperience.vue`, and
  `apps/web/server/api/images/[kind]/[id].get.ts`.
- Verification and documentation: `tests/e2e/portfolio.spec.ts`,
  `docs/architecture/data-model.md`, `docs/architecture/security.md`,
  `docs/decisions/0008-admin-workspace-and-preview.md`,
  `docs/decisions/README.md`, `docs/development-roadmap.md`, this report, and
  the six screenshots under `docs/screenshots/phase-4/`.
- No package manifest or lockfile changed; no dependency was added.

## Verification

Checks used Node `24.22.3` and npm `11.19.1`. `DEBUG` was unset for the
commands below because the inherited debug instrumentation caused Nitro to
emit a broken externalized Vue timing import during earlier build attempts.

| Command | Result |
| --- | --- |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run lint` | Passed; 4 Nx tasks. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run typecheck` | Passed; 5 Nx tasks. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run build` | Passed; 3 build tasks. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm test` | Passed; 5 Vitest tests in 2 files. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run test:e2e` | Passed; 19 Playwright tests against disposable PostgreSQL 18.7. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run test:e2e -- -g 'profile and content save actions'` | Passed; focused near-bottom profile and experience field overlap checks. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run test:cms` | Passed; schema, migration, write/read, transaction rollback, anonymous denial, and isolated backup recovery checks. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run format:check` | Passed; all matched files use Prettier formatting. |
| `env -u DEBUG PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run check:schema -w @a/cms` | Passed; frozen GraphQL and Prisma schemas match, Prisma Client generated. |

The browser suite covers owner and origin protection, the exact seed inventory,
CRUD and published SSR, unsafe URL rejection, image gating, explicit bulk
actions and filter-hidden selection state, profile draft defaults, 401 recovery,
preview cache/index headers, published-versus-draft separation, public profile
and links, save-control overlap, desktop/mobile flows, and screenshot
generation. The final Playwright run passed all 19 tests.

## Remaining issues and risks

- Production host routing, HTTPS, secure cookie behavior, reverse-proxy headers,
  and production database migration still need Phase 7 staging verification.
- The CMS emits an existing `pg` deprecation warning when a nested relationship
  query runs while the client is already executing another query. It did not
  prevent any test from passing; track it before a future `pg` major upgrade.
- No personal name, contact value, URL, profile image, employment status,
  achievement, or project detail was invented. The owner must supply and review
  any such values before publishing.

## Architecture deviations

None from the approved Nx, Nuxt, Keystone, and PostgreSQL boundaries. The
profile uses a fixed `SiteSettings` row and the current bounded image-string
workflow. Phase 4 does not add a revision model, media library, alternate
backend, public preview token, or new package dependency.

## Recommendations for Phase 5

Wait for explicit Phase 5 approval. Before changing the public composition,
confirm the owner-approved display name, profile image, contact/social methods,
project URLs and descriptions, and any employment status or further dates.
Preserve month-level Persian precision. Keep the public route SSR and
published-only, then implement the approved portfolio composition and SEO
requirements. Leave the 3D gallery for its separately gated Phase 6.
