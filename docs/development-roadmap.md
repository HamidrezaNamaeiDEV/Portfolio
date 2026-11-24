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

## Phase 3 — CMS and database

- [ ] Obtain owner approval to start Phase 3.

- [ ] Start with the [Project vertical slice](architecture/data-model.md#project-vertical-slice-acceptance) using one project, one skill/category and private image media. Review initial PostgreSQL migrations and seed only confirmed content as draft. Verify constraints and seed idempotency.
- [ ] Add Keystone owner authentication and backend permissions. Define allowlisted public GraphQL operations for home, project listing/detail, skills, experience, profile/contact and gallery configuration. Add typed request and response contracts and projection tests.
- [ ] Pass the Project slice checks for draft isolation, live filter/order, stale commands, atomic rollback, media races, and authorization before expanding to experience, site settings and scene configuration.
- [ ] Integrate private S3-compatible media validation, replacement and publishing. Use a disposable database and staging bucket or equivalent private endpoint in integration tests. Reapply migrations from an empty database and check generated schema drift.

## Phase 4 — Admin dashboard

- [ ] Build owner sign-in, guard/session handling, overview and the project editor. Prove case-study blocks, linked technologies, cover/gallery ordering, validation, preview and publication against real Keystone.
- [ ] Add skills and categories, experience, media library, profile, 3D settings, SEO, site settings and revision screens. Cover archive, unpublished changes, edit conflicts and error recovery.
- [ ] Require Playwright evidence for sign-in/out, creation and editing, archive, restore, two-tab edit conflict, safe uploads and draft preview isolation. Verify the editor at narrow and wide viewports and with keyboard navigation.

## Phase 5 — Public portfolio

- [ ] Deliver homepage, project catalogue and details, skills, experience, about and contact with CMS reads. Add SSR filtering, canonical metadata, social images, robots/sitemap and published-only route behavior.
- [ ] Match approved visual composition on desktop and define responsive crops and layouts. Deliver the poster and an accessible HTML gallery index before WebGL. Confirm project text, asset rights, actual experience status, contact methods, and locale conventions with the owner.
- [ ] Verify served HTML, client hydration, HTTP status behavior, keyboard focus and navigation, 200% zoom, mobile layouts and the Persian calendar display tests.

## Phase 6 — 3D experience

- [ ] Prototype one corridor station in `libs/three-scenes` with production-like lighting and assets. Validate the initial transfer and frame budgets against poster-only comparisons and test cleanup on repeated navigation.
- [ ] After the prototype gate, extend to all five stations and integrate CMS configuration. Verify desktop, touch and keyboard input, reduced motion, context loss and static fallback. Verify the mobile poster-first behavior and tune the opt-in renderer on a named physical device.
- [ ] Review scene composition against the supplied visual and compare production traces. Keep the poster as the default on tiers that miss the performance gate.

## Phase 7 — Production readiness

- [ ] Complete CI and staging integration, security/SEO/performance review, Docker and Nginx configuration, HTTPS, health checks and observability.
- [ ] Rehearse deploy, rollback and an isolated database and media restore from a paired off-host backup. Measure against the approved recovery targets and link the evidence.
- [ ] Run Vitest, Playwright, post-deploy smoke checks, and repeatable mobile/desktop lab audits. Report field metrics once traffic is sufficient. Release after content, security, performance and recovery review.

[Acceptance details and open decisions](architecture/system-overview.md) · [VPS proposal](deployment/vps-deployment.md)
