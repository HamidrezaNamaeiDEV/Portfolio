# Phase 4 Admin UX and Content Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend the existing portfolio admin with a useful overview, improved technology/experience/project workflows, editable professional profile, and a private draft preview while preserving Phase 3 content and publication behavior.

**Architecture:** Continue the current Nuxt 4 admin, typed contracts, fixed server API facade, Keystone owner authorization, and PostgreSQL migrations. Add one fixed-key `SiteSettings` profile record, fields for experience logos and optional project URLs, an authenticated admin preview, and public projections that continue to expose only published and visible records. Keep the public page simple and out of the later cinematic homepage and 3D phases.

**Tech Stack:** Nx 24.0.6, Nuxt 4.7.0, Vue 3.5.46, Keystone 8.3.0, Prisma 7.10.1, PostgreSQL 18, Vitest, Playwright. Do not add dependencies.

**Spec:** User-provided Phase 4 brief at `/home/hamidreza.namaee@part.local/.codex/attachments/6bd7ae29-76ae-470c-9e46-a972638b7545/Pasted text.txt`, approved by the user.

## Approaches

1. Rebuild the admin or move to Keystone Admin UI: rejected because the current custom Nuxt/Keystone application is working and the brief excludes a rebuild or CMS replacement.
2. Add preview to the public site with a preview token: rejected because it expands the public attack surface and duplicates session handling.
3. Extend the existing admin and expose an owner-only `/preview` page and API: selected because it reuses the existing owner session, fixed operations, and private no-store/noindex route rules.

## Global Constraints

- Keep the current Nx application boundaries and use Nuxt 4, Vue 3, Keystone, PostgreSQL, and the shared design-token library.
- Preserve all 40 seed skill names and their exact proficiency levels; keep all seed records as drafts unless an owner explicitly changes their status.
- Preserve the two experience records and Persian year/month precision. Do not fill unknown employment information, responsibilities, achievements, profile name, contact fields, URLs, or social links.
- Use only the confirmed profile headline and supporting description in `MASTER_PROMPT.md`; leave other profile values editable and blank.
- Keep projects concise: Qeshm Portal, Luxury Auction Platform, and Kartamoon; do not add case-study or gallery editors.
- Keep preview responses owner-authorized, `private, no-store`, and non-indexable. Public reads and media remain published-and-visible only.
- Do not add the cinematic homepage, 3D gallery, a new backend, dependencies, or production deployment.
- Preserve the existing staged Phase 3 changes. Leave Phase 4 work unstaged and do not commit it.

## Review Focus

1. Anonymous direct requests to `/preview`, the content/profile APIs used by preview, and unpublished media must reveal no draft content and return no-store/noindex headers where applicable; exercise these through Playwright.
2. Missing or empty profile fields must remain editable without creating false identity/contact claims; exercise empty profile create/update and public fallback behavior.
3. Unsafe external URL inputs (`javascript:`, `data:`, credentials, malformed URLs) must be rejected server-side and never rendered as links; exercise both project and profile inputs.
4. A stale or duplicate skill ID in a bulk action must not silently publish or alter unrelated seed records; exercise invalid and explicit bulk actions.
5. At 390px, content names and controls must remain readable and the page must not develop horizontal overflow; exercise the table and editor in a mobile browser.
6. A 401 during an edit must preserve the in-memory draft through reauthentication; exercise expiry during a save and confirm the editor stays recoverable.

## File Map

- `apps/cms/content/lists.ts`, `apps/cms/content/public.ts`: private `SiteSettings` profile fields and public field/media projection.
- `apps/cms/migrations/<phase4 migration>/migration.sql`, generated `schema.prisma` and `schema.graphql`: reviewed persistent schema change.
- `apps/cms/scripts/seed-content.ts`: idempotent `SiteSettings` seed using confirmed copy without modifying existing skills, experience, or projects.
- `libs/contracts/index.ts`: admin/public DTOs for profile, company logo, project URL, and profile preview.
- `apps/admin/server/utils/content.ts`, `apps/admin/server/api/profile.*`, `apps/admin/server/api/content/bulk.post.ts`: validated, origin-checked, owner-only profile and bulk operations.
- `apps/admin/app/app.vue`, `apps/admin/app/pages/{index,profile,preview}.vue`: authenticated admin shell and routed workspaces.
- `apps/admin/app/components/{DashboardOverview,ProfileEditor,PortfolioPreview}.vue`: focused overview/profile/preview interfaces.
- `apps/admin/app/components/ContentWorkspace.vue`, `ContentEditor.vue`, `ExperienceFields.vue`, `utils/content-editor.ts`, `assets/admin.css`: filters, status/visibility, ordering, image/link fields, mobile list treatment, shared states.
- `apps/web/app/app.vue`, `components/WorkExperience.vue`, `components/SelectedProjects.vue`, `server/api/images/[kind]/[id].get.ts`: render published profile, optional company logos and project links from public CMS reads.
- `tests/e2e/portfolio.spec.ts`, focused Vitest files under `tests/`: authorization, validation, publication, filtering, mobile layout, and preview coverage.
- `docs/architecture/data-model.md`, `docs/architecture/security.md`, a new ADR under `docs/decisions/`, `docs/development-roadmap.md`, `docs/phase-4-admin-ux.md`, and `docs/screenshots/`: decisions, roadmap, requested report, and visual evidence.

## Tasks

### Task 1: Extend CMS data and owner APIs

**Interfaces:** Consume the existing `AdminContent`, Keystone list definitions, and owner facade. Produce `ProfileRecord`, `ExperienceRecord.companyLogo`, `ProjectRecord.url`, and optional `PublicPortfolio.profile`, plus `GET/PUT /api/profile` and an explicit bulk skill visibility/publication operation.

- [x] Add Playwright coverage first for the authenticated profile API, profile draft defaults, valid/invalid profile and project URLs, experience logo publication, and explicit bulk skill actions. Confirm anonymous requests fail and seed skills stay unchanged.
- [x] Run the focused Playwright tests and confirm they fail on the missing routes/fields.
- [x] Add the fixed-key Keystone `SiteSettings` profile fields (display name, headline, biography, image, contact fields, social URLs, status, visibility); add optional `Experience.companyLogo` and validated `Project.url`.
- [x] Add a reviewed additive migration; regenerate and review the Keystone GraphQL/Prisma schemas. Seed only the confirmed headline and biography, leaving all other profile fields blank and the profile unpublished.
- [x] Extend the fixed admin/public projections and shared DTOs. Validate all external links as HTTP(S) URLs without credentials; constrain bulk changes to explicit skill IDs and allowed status/visibility fields.
- [x] Implement owner- and origin-checked profile and bulk endpoints, with private no-store responses.
- [x] Run `PATH='/home/hamidreza.namaee@part.local/.nvm/versions/node/v24.22.3/bin':"$PATH" npm run check:schema -w @a/cms` and the focused Playwright tests. Confirm 40 exact skills and all preexisting draft values remain intact.

### Task 2: Refine dashboard overview and content workflows

**Interfaces:** Consume the Task 1 DTOs and endpoints. Keep the current Technology Stack default and existing create/edit/delete behavior. Expose overview statistics, an add-skill quick action, skill category/proficiency/search/status/visibility filters, logo and proficiency summaries, explicit bulk controls, experience company logo, optional project URL, and display ordering.

- [x] Add Playwright cases for accurate overview counts, add-skill quick action, category/proficiency filters, skill logo/status display, editor fields, ordering, and explicit bulk actions. Add 390px cases that reject per-character wrapping and page-level horizontal overflow, and an expiry-during-edit case that confirms the form survives reauthentication.
- [x] Run the focused UI tests and confirm they fail against the current admin.
- [x] Extend `libs/design-tokens/tokens.css` with reusable semantic surface, border, status, spacing, radius, and elevation tokens; use restrained emerald and the existing charcoal palette.
- [x] Refine the admin shell and split the overview into a focused component. Keep the Technology Stack first and primary in the content navigation; omit “recent updates” because the current records have no reliable update timestamps.
- [x] Add the skill filters, logo/proficiency display, selection and guarded bulk controls; add company logo and project URL fields to the existing editors. Keep project editing concise.
- [x] Make the list readable at 390px while preserving keyboard and table semantics. Group long experience fields, keep save actions reachable, clarify that visibility applies after publication, and retain a visible editor-heading focus ring.
- [x] Preserve the mounted workspace when an active session expires; show reauthentication while keeping the in-memory form draft available. Do not persist draft fields to browser storage.
- [x] Retain loading, empty, error, success, focus, and disabled states.
- [x] Run focused Playwright, admin lint, and admin typecheck. Confirm the dashboard counts derive only from loaded CMS records.

### Task 3: Add profile editing, private preview, and public rendering

**Interfaces:** Consume Task 1 profile/public contracts and Task 2 admin shell. Produce `/profile` and `/preview` routes under the authenticated admin shell and connect the overview's profile/preview quick actions. The preview distinguishes published content from visible draft candidates. Public SSR continues to use only published, visible data.

- [x] Add Playwright cases for anonymous direct preview HTML/API access, noindex/no-store headers, owner access, published-vs-draft preview separation, blank profile handling, and published profile/logo/link changes on public SSR.
- [x] Run the focused tests and confirm the new route and public fields are missing or exposed incorrectly before implementation.
- [x] Build the profile editor with editable display name, headline, biography, profile image, contact values, social URLs, status, and visibility. Keep blank values blank.
- [x] Add an owner-only preview workspace that uses protected admin APIs and visibly labels draft content; verify the route remains under the admin’s existing `private, no-store` and `noindex` rules.
- [x] Render a published profile and optional uploaded image in the existing public introduction, contact/social links in the footer, company logos in the experience timeline, and optional project links. Keep the existing simple homepage and confirmed static profile fallback until Phase 5.
- [x] Extend tests for public image access and confirmed Persian month display. Run Playwright on desktop and mobile, plus web/admin typecheck.

### Task 4: Document, capture, and verify Phase 4

- [x] Capture authenticated overview, technology stack, profile, preview, and mobile admin screenshots under `docs/screenshots/phase-4/` using the disposable E2E database and real browser.
- [x] Update `docs/architecture/data-model.md`, `docs/architecture/security.md`, add the Phase 4 ADR, update the decisions index and mark Phase 4 complete in `docs/development-roadmap.md`.
- [x] Write `docs/phase-4-admin-ux.md` with reused functionality, UI changes, new functionality, screenshot paths, files changed, exact commands/results, known gaps, architecture deviations, and Phase 5 recommendations.
- [x] Run the exact pinned-toolchain checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:cms`, `npm run format:check`, and `npm run check:schema -w @a/cms`.
- [ ] Review every command result and the final unstaged diff. Verify the staged Phase 3 index is preserved, no new dependency was added, no production operation occurred, and no Phase 5/3D work slipped into scope.
- [ ] Stop at Phase 4 and return the report with any remaining issues; do not start Phase 5.
