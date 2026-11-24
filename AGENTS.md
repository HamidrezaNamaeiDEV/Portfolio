# AGENTS.md
# A/ — Engineering Portfolio
## Permanent Engineering Rules for AI Coding Agents

## 1. Project Context

This repository contains A/ — Engineering Portfolio, a premium 3D interactive personal portfolio and CMS-powered content management platform.

The product consists of:

- A public Nuxt 4 portfolio website.
- A custom Nuxt 4 administration dashboard.
- A KeystoneJS backend and CMS.
- A PostgreSQL database.
- A Three.js / TresJS interactive engineering gallery.
- Shared libraries managed through Nx.

The product must be production-ready, maintainable, accessible, performant, and visually consistent.

Always read MASTER_PROMPT.md before starting a new major task.

---

## 2. General Engineering Principles

Follow these principles in every implementation:

1. Understand before changing.
2. Prefer simple and maintainable solutions.
3. Respect existing architecture.
4. Avoid unnecessary abstractions.
5. Keep business logic independent from UI.
6. Use strict TypeScript wherever practical.
7. Avoid duplicated logic.
8. Avoid oversized components.
9. Never introduce dependencies without justification.
10. Never silently break existing functionality.
11. Never fabricate implementation results or test results.
12. Document important architectural decisions.

Do not rewrite working systems without a concrete reason.

---

## 3. Monorepo & Nx Rules

The repository uses Nx for workspace and dependency management.

Expected application boundaries:

- apps/web: Public portfolio.
- apps/admin: Private administration dashboard.
- apps/cms: KeystoneJS backend.

Shared libraries:

- libs/ui
- libs/contracts
- libs/domain
- libs/design-tokens
- libs/three-scenes
- libs/shared-utils
- libs/test-utils

Rules:

- Follow Nx project boundaries.
- Use appropriate project tags.
- Prevent circular dependencies.
- Keep applications thin.
- Put reusable business logic in appropriate libraries.
- Avoid importing application-specific implementation into shared libraries.
- Use Nx generators when they provide a consistent solution.
- Keep project configuration consistent.
- Use Nx affected commands where appropriate.

Do not create a library for every small utility.

Only introduce a new library when it provides a meaningful architectural boundary.

---

## 4. Vue & Nuxt Development Rules

Use Vue 3 and Nuxt 4 conventions.

### Vue

- Prefer Composition API.
- Use script setup.
- Use composables for reusable reactive logic.
- Keep components focused on a single responsibility.
- Use props and emits with explicit types.
- Avoid unnecessary watchers.
- Prefer computed values for derived state.
- Avoid mutating props.
- Avoid deeply nested component logic.
- Clean up subscriptions and event listeners.

### Nuxt

- Follow Nuxt 4 directory conventions.
- Use server routes only when appropriate.
- Separate server-only and client-only code.
- Use useAsyncData and useFetch appropriately.
- Avoid unnecessary client-side fetching.
- Use SSR for important public content.
- Prevent hydration mismatches.
- Use route rules and caching intentionally.
- Keep runtime configuration secure.
- Do not expose private environment variables to the browser.

### TypeScript

- Avoid any whenever possible.
- Define explicit interfaces and types.
- Prefer discriminated unions for complex states.
- Validate external data at system boundaries.
- Keep shared contracts consistent.

---

## 5. Frontend Architecture

Organize frontend code by responsibility and domain.

Separate:

- Components
- Composables
- Pages
- Layouts
- Domain models
- API clients
- Utilities
- State management
- Presentation logic

Rules:

- Do not place business logic directly inside large Vue components.
- Avoid generic components with excessive conditional behavior.
- Use domain-specific components where appropriate.
- Keep API communication outside presentation components.
- Avoid unnecessary global state.
- Use Pinia only when shared application state genuinely requires it.

Create reusable UI components based on actual recurring requirements.

Do not over-engineer the component system.

---

## 6. Backend & CMS Rules

KeystoneJS is the primary CMS and backend.

PostgreSQL is the primary database.

Prisma is used through KeystoneJS.

Rules:

- Keep data models explicit.
- Use meaningful relationships.
- Add appropriate indexes and constraints.
- Validate incoming data.
- Implement authorization at the backend.
- Never rely on frontend-only authorization.
- Protect administrative operations.
- Separate public and private data.
- Return only approved public fields.
- Handle errors consistently.
- Avoid unnecessary custom APIs when Keystone capabilities are sufficient.

Do not introduce another backend framework without an approved architectural decision.

---

## 7. Domain & Data Modeling

Core domain entities include:

- Project
- Skill
- SkillCategory
- Experience
- Media
- ProjectSkill
- ExperienceSkill
- ProjectMedia
- SiteSettings
- SceneConfig
- User
- AuditLog

Rules:

- Keep domain relationships explicit.
- Use stable identifiers.
- Use meaningful unique slugs.
- Support draft, published, and archived states where appropriate.
- Preserve historical content where necessary.
- Avoid storing derived information redundantly.
- Define deletion behavior for related records.
- Keep database migrations safe and reviewable.

Never invent personal information, professional achievements, employment dates, or project metrics.

---

## 8. Three.js & TresJS Rules

The 3D engineering gallery is an important part of the product.

However, the 3D experience must never compromise usability or performance.

### Architecture

- Isolate Three.js logic inside libs/three-scenes.
- Separate scene configuration from CMS content.
- Keep reusable 3D objects modular.
- Separate rendering, interaction, animation, and data.
- Avoid coupling business logic to Three.js objects.

### Performance

- Lazy-load heavy 3D assets.
- Use optimized GLB/GLTF models.
- Optimize polygon counts.
- Compress textures where appropriate.
- Reuse geometries and materials.
- Avoid unnecessary draw calls.
- Avoid excessive real-time shadows.
- Dispose of GPU resources correctly.
- Prevent memory leaks.
- Handle WebGL context loss when appropriate.

### Interaction

- Respect reduced-motion preferences.
- Provide mobile-specific scene optimizations.
- Avoid blocking page navigation.
- Support keyboard-accessible alternatives.
- Provide static fallbacks when WebGL is unavailable.

Do not render the entire website as a 3D scene.

Use Three.js only where it provides meaningful value.

---

## 9. Design System & UI Rules

The approved visual direction is:

Cinematic Minimalism + The Engineering Lab.

Design characteristics:

- Deep charcoal and warm black.
- Restrained emerald accents.
- Warm architectural lighting.
- Editorial serif display typography.
- Readable modern sans-serif body typography.
- Premium spacing.
- Minimal borders.
- Architectural composition.
- Subtle transitions.

Rules:

- Follow shared design tokens.
- Avoid arbitrary colors and spacing values.
- Maintain consistent typography.
- Design for desktop and mobile.
- Use semantic HTML.
- Maintain appropriate color contrast.
- Provide loading, empty, error, and success states.
- Avoid generic AI-generated dashboard patterns.
- Avoid unnecessary gradients and excessive glassmorphism.

The admin dashboard should prioritize clarity and productivity over cinematic effects.

Do not confuse visual complexity with design quality.

---

## 10. API & Contracts

Use shared contracts where appropriate.

Rules:

- Define API response types.
- Validate external data.
- Avoid duplicated DTO definitions.
- Keep frontend and backend contracts synchronized.
- Handle loading and error states.
- Avoid exposing internal database structures unnecessarily.
- Keep public and administrative API access separate.

Never trust client-provided authorization information.

---

## 11. Security Rules

Security is mandatory.

- Never commit secrets.
- Never hardcode credentials.
- Use environment variables.
- Protect administrative routes.
- Enforce server-side authorization.
- Validate uploaded files.
- Restrict file types and file sizes.
- Prevent unsafe file access.
- Use secure session management.
- Apply appropriate HTTP security headers.
- Protect sensitive API operations.
- Avoid leaking stack traces or internal information to public users.

All administrative mutations must be authorized by the backend.

---

## 12. Testing & Quality Assurance

Use:

- Vitest for unit and integration tests.
- Playwright for browser and end-to-end testing.

Testing expectations:

- Test important business logic.
- Test API boundaries.
- Test authentication and authorization.
- Test content publication workflows.
- Test project and skill relationships.
- Test critical user interactions.
- Test responsive layouts.
- Test WebGL fallback behavior.
- Test important navigation flows.

Do not claim tests passed unless they were actually executed.

Do not disable existing tests simply to make a build pass.

Fix the underlying problem.

---

## 13. Performance & SEO

Performance must be considered throughout development.

Public pages must support:

- SSR.
- Appropriate caching.
- Optimized images.
- Lazy loading.
- Code splitting.
- Font optimization.
- Structured metadata.
- Sitemap.
- Robots configuration.
- Open Graph metadata.
- Accessible content.

Important content must remain accessible without requiring WebGL.

Monitor Core Web Vitals.

Treat performance targets as measurable requirements.

---

## 14. DevOps & Deployment

The project is intended to be self-managed on a Linux VPS.

Use Docker and Nginx.

Rules:

- Keep Docker configuration maintainable.
- Separate development and production environments.
- Use health checks.
- Keep secrets outside images.
- Use persistent database storage.
- Configure database backups.
- Document recovery procedures.
- Use safe database migrations.
- Configure HTTPS.
- Document deployment and rollback procedures.

Never execute destructive production operations without explicit approval.

---

## 15. Coding Workflow

Before modifying code:

1. Inspect relevant files.
2. Understand existing behavior.
3. Identify dependencies.
4. Check architectural boundaries.
5. Determine the smallest appropriate change.
6. Implement the solution.
7. Run relevant tests.
8. Review the resulting diff.
9. Update documentation when necessary.

Do not modify unrelated files.

Do not make large architectural changes without documenting the reasoning.

For complex tasks, prepare an implementation plan before coding.

---

## 16. Git & Change Management

- Keep changes focused.
- Use meaningful commit messages.
- Do not commit generated secrets or local environment files.
- Review diffs before committing.
- Avoid unrelated formatting changes.
- Preserve existing uncommitted user changes.
- Never force-push or rewrite history without explicit authorization.

---

## 17. Documentation

Maintain documentation for:

- System architecture.
- Application boundaries.
- Database schema.
- API contracts.
- Design tokens.
- 3D rendering architecture.
- Deployment.
- Security.
- Important architectural decisions.

Update documentation when architecture changes.

Do not leave outdated instructions after significant refactoring.

---

## 18. Definition of Done

A task is complete only when:

- The requested functionality works.
- The implementation respects architecture.
- Types and validation are correct.
- Relevant tests have been executed.
- No known critical regression remains.
- Responsive behavior is checked where relevant.
- Security implications are reviewed.
- Documentation is updated where needed.

Always report:

1. What changed.
2. Why it changed.
3. Which files were affected.
4. Which tests were executed.
5. What remains incomplete.
6. Any risks or follow-up work.

Never claim completion based only on generated code.

---

## 19. Final Principle

Build a high-quality engineering product, not merely an attractive portfolio.

Prioritize:

- Maintainability
- Correctness
- Performance
- Accessibility
- Security
- Product quality
- Visual excellence

When uncertain, inspect first, explain trade-offs, and choose the simplest reliable solution.

These rules apply to every coding task in this repository.