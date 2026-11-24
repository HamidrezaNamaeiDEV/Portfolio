# Development roadmap

Phase 2 Foundation is implemented and verified. The sequence below follows the project brief and sets verifiable gates for the implementation phases. Prepare a task-level plan for the approved phase against its actual dependency versions.

## Phase 1 — Discovery and architecture

- [x] Read both project briefs and inventory source and tooling.
- [x] Inspect the desktop design and document the architecture options.
- [x] Draft project graph, database model, roadmap and decision records.

## Phase 1.5 — Architecture validation and decision closure

- [x] Recheck package compatibility, app boundaries, the Project slice, sessions, gallery fallbacks and VPS recovery assumptions.
- [x] Record classified findings and Foundation acceptance criteria.
- [x] Obtain owner approval to start Phase 2.

[Phase 1.5 findings](architecture/phase-1.5-validation.md)

## Phase 2 — Foundation

- [x] Select Node `24.22.3` with npm `11.19.1` before running the workspace tooling, then pin both. Create the Nx/npm workspace and root manifest, lockfile, `nx.json` and base TypeScript settings. If this remains the working directory when Foundation is approved, initialize local Git and record the baseline. Use an existing canonical checkout if the owner supplies one.
- [x] Establish `apps/web`, `apps/admin`, `apps/cms`, and `libs/design-tokens`. Give Nuxt apps workspace resolution and explicit Nx targets as needed. Enable boundary rules and keep CMS generation and database mutation out of cacheable tasks.
- [x] Configure lint, formatting, typecheck, environment templates and Vitest/Playwright infrastructure. Build one SSR page per Nuxt app and prove a Keystone no-UI build and schema generation using a disposable smoke fixture with a minimal list in a Linux container. Introduce real CMS data and authentication in Phase 3 and production container configuration in Phase 7. Keep domain migrations in Phase 3.
- [x] From a clean install, verify Nx project listing and graph, builds, lint, typechecks, and a basic SSR browser smoke test. Record the lockfile and exact local and container runtime versions.

[Completed Foundation report and recovery procedure](phase-2-foundation.md)

### Foundation acceptance criteria

| Deliverable | Planned files and checks |
| --- | --- |
| Reproducible workspace | Root `package.json`, `package-lock.json`, Node version file, `nx.json` and `tsconfig.base.json`. Record Node and npm versions, then complete `npm ci` from a clean working copy and in the Linux smoke environment with the same lockfile. Use a staged scaffold outside the existing files if the Nx generator requires an empty directory. |
| App and token boundaries | `apps/web/nuxt.config.ts`, `apps/admin/nuxt.config.ts`, Keystone config and project targets under `apps/cms`, CSS entry under `libs/design-tokens`. Run `npx nx show projects`, export the graph with `npx nx graph --file=<artifact-path>`, and check the app graph and lint rules against the [proposed edges](architecture/system-overview.md#proposed-nx-project-graph). Demonstrate one allowed workspace import and one rejected direct app-to-app import from a Vue SFC. The Foundation graph has three apps and the design-tokens project. |
| Build and browser proof | Run `npx nx run-many -t lint,typecheck,build` for projects with those targets. Verify a Vitest smoke check and a Playwright check for each Nuxt app. Both apps must build, serve meaningful HTML and hydrate without a console error in the smoke interaction. |
| Keystone and PostgreSQL | From a clean Linux install, build with `keystone build --no-ui`, generate GraphQL/Prisma schemas and the client, apply a fixture-only migration to disposable PostgreSQL 18, and start the built server with no UI. Prove one write/read and one rollback through the generated client or Keystone context. Record the PostgreSQL image, package versions, and expected schema artifacts. |
| Scope and handoff | Only the approved Foundation scaffold and temporary integration fixture. Document exact verification commands and results. Keep live CMS data, product migrations, the admin workflow, gallery assets and production configuration in their later phases. |

Use the existing directory contents as the preservation baseline. Configure local Nx caching for reproducible targets. Remote caching, production services and product data migrations have no Foundation dependency. [Nx workspace options](https://nx.dev/docs/reference/create-nx-workspace) · [Nx module boundaries](https://nx.dev/docs/features/enforce-module-boundaries)

## Phase 3 — Portfolio Content Management Foundation

Skills and work experience lead the portfolio. Projects are a short selected list.

- Add owner authentication, fixed admin and public APIs, PostgreSQL content models, relationships and migrations.
- Seed the supplied skills and proficiency levels, two experience records at Persian month precision, and three project names as drafts.
- Deliver admin CRUD, ordering, validation, publication, and visibility for skills, categories, proficiency levels, experience, and basic projects.
- Render the three CMS sections on the public homepage. Prove CRUD, authorization, draft isolation, relationship filtering, and public SSR against disposable PostgreSQL.
- Keep case studies, revision history, galleries, and broader admin modules out of this delivery.

[Phase 3 implementation and checks](phase-3-content-management.md) · [Publication and media decision](decisions/0007-portfolio-content-foundation.md)

## Phase 4 — Admin dashboard expansion

- [x] Obtain explicit owner approval and confirm the next management modules.
- [x] Extend the existing admin for the approved overview, technology, experience, concise project, professional profile, and private preview workflows.
- [x] Verify publication behavior, owner access, blank profile fields, mobile usability, and public SSR against a disposable PostgreSQL database.

[Phase 4 implementation and checks](phase-4-admin-ux.md) · [Admin and preview decision](decisions/0008-admin-workspace-and-preview.md)

## Phase 5 — Public portfolio

- [x] Deliver one SSR homepage with identity, stack, experience, selected projects, about and contact. Defer the project catalogue and detail pages to a future phase.
- [x] Deliver the static corridor poster and HTML domain index. Review desktop and mobile browser screenshots.
- [x] Verify served HTML, client hydration, HTTP status behavior, keyboard navigation, reduced motion, mobile layout, and Persian month display.
- [ ] Confirm release asset rights, outstanding content approvals, and browser behavior at 200% zoom.

## Phase 6 — 3D experience

- [x] Document and build a one-station corridor in `libs/three-scenes`.
  Measure desktop activation and rendering, exercise resource cleanup, and
  capture the desktop scene and emulated mobile poster.
- [x] Review and approve the Phase 6A prototype architecture and visual direction.
- [x] Extend the desktop gallery to five stations with published CMS category links.
  Verify keyboard navigation, reduced motion, context loss, the static poster
  and an extended desktop rendering session.
- [ ] Validate on a physical phone before enabling any mobile 3D tier.
- [ ] Obtain explicit approval of Phase 6B before starting Phase 7.

[Phase 6A baseline](phase-6-3d-gallery.md) · [Phase 6B implementation and results](phase-6b-gallery.md)

## Phase 7 — Production readiness

- [ ] Complete CI and staging integration, security/SEO/performance review, Docker and Nginx configuration, HTTPS, health checks and observability.
- [ ] Rehearse deploy, rollback and an isolated database and media restore from a paired off-host backup. Measure against the approved recovery targets and link the evidence.
- [ ] Run Vitest, Playwright, post-deploy smoke checks, and repeatable mobile/desktop lab audits. Report field metrics once traffic is sufficient. Release after content, security, performance and recovery review.

[Acceptance details and open decisions](architecture/system-overview.md) · [VPS proposal](deployment/vps-deployment.md)
