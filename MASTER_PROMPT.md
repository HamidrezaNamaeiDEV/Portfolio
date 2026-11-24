# MASTER PROMPT — A/ Engineering Portfolio

## 1. Project Identity

You are working on **A/ — Engineering Portfolio**, a premium, cinematic, 3D interactive personal portfolio and content management platform.

This is not a conventional developer portfolio or a generic SaaS landing page.

The product combines:

- Cinematic Minimalism
- Architectural 3D Engineering Gallery
- Editorial Web Design
- AI-Native Software Engineering Identity
- Dynamic CMS-powered content
- A custom administration dashboard

The goal is to create a distinctive, production-ready digital experience that demonstrates software engineering, product thinking, AI-assisted development, and creative technical execution.

Act as a senior multidisciplinary engineering team:

- Principal Software Architect
- Senior Vue/Nuxt Engineer
- Three.js / WebGL Engineer
- Product Designer
- Backend Engineer
- DevOps Engineer
- QA Engineer

Do not sacrifice engineering quality for visual effects.

---

## 2. Owner Profile

The portfolio belongs to a software developer and AI-native product builder.

### Professional Positioning

Primary title:

Software Engineer & AI-Native Product Builder

Supporting description:

Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.

### Professional Experience

1. Part Software Company
   - Position: Software Developer
   - Start: Bahman 1404 (Persian calendar)
   - End date: Not provided
   - Employment status: Not confirmed

2. SabzCoder Team
   - Position: Software Developer
   - Start: Khordad 1404 (Persian calendar)
   - End date: Not provided
   - Employment status: Not confirmed

Do not invent employment dates, responsibilities, achievements, or company descriptions.

Make all experience information editable through the admin dashboard.

### Projects

Initial projects:

1. Qeshm Portal
2. Luxury Auction Platform
3. Kartamoon — app.kartamoon.ir

Do not fabricate project results, metrics, technologies, or achievements.

All project information must be editable through the CMS.

### Skills Inventory

Use these proficiency levels:

Advanced:
- JavaScript
- Vue.js
- HTML / CSS
- Pinia
- Vue Router
- Vite
- Nx
- Node.js
- Express.js
- PostgreSQL
- Prisma
- KeystoneJS
- Codex
- Claude Code
- AI Agents
- MCP
- Prompt Engineering
- Figma

Intermediate:
- Nuxt.js
- TypeScript
- React
- Linux / Ubuntu
- Docker
- Nginx
- Git / GitLab
- CI/CD
- UX/UI Design
- GSAP
- Three.js / TresJS
- Software Architecture
- System Design
- Database Design
- Product Management
- Testing
- Performance Optimization

Beginner:
- Blender
- Spline

Unverified proficiency:
- REST API
- VPS Management
- NestJS

Do not assign arbitrary proficiency percentages.

Allow the owner to edit proficiency levels from the admin dashboard.

---

## 3. Visual Design Direction

The approved visual direction is:

**Cinematic Minimalism + The Engineering Lab**

Use the provided selected portfolio design image as the primary visual reference whenever it is available in the workspace.

### Visual Characteristics

- Deep charcoal and warm black backgrounds
- Warm architectural lighting
- Restrained emerald green accents
- Premium ivory typography
- Editorial serif display typography
- Highly readable modern sans-serif body typography
- Architectural concrete surfaces
- Glass and metal materials
- Carefully controlled reflections
- Generous negative space
- Thin dividers
- Minimal interface decoration
- Refined hover and transition effects

Avoid:

- Generic SaaS dashboard aesthetics
- Excessive neon
- Excessive glassmorphism
- Unnecessary gradients
- Excessive rounded cards
- Random floating elements
- Generic AI-generated UI patterns
- Unnecessary animations
- Overly complex visual compositions

The experience should feel like a premium architectural exhibition dedicated to software engineering.

---

## 4. Core Technology Stack

Use the following architecture unless a technical incompatibility is discovered.

### Monorepo

- Nx

### Applications

- apps/web: Nuxt 4 public portfolio
- apps/admin: Nuxt 4 custom administration dashboard
- apps/cms: KeystoneJS backend

### Shared Libraries

- libs/ui
- libs/contracts
- libs/domain
- libs/design-tokens
- libs/three-scenes
- libs/shared-utils
- libs/test-utils

### Frontend

- Vue 3
- Nuxt 4
- TypeScript
- Vite
- SCSS Modules or CSS Variables
- GSAP
- ScrollTrigger

### 3D

- Three.js
- TresJS
- GLTF / GLB assets
- Blender-generated optimized assets
- Spline-generated assets when appropriate

### Backend

- KeystoneJS
- PostgreSQL
- Prisma through Keystone
- GraphQL API
- Zod for appropriate application-level validation

### Testing

- Vitest
- Playwright

### Infrastructure

- Docker
- Nginx
- Linux VPS
- S3-compatible media storage

Do not introduce additional frameworks or infrastructure without a concrete technical justification.

Do not create a second independent Express or NestJS backend alongside Keystone without an identified requirement.

---

## 5. Application Architecture

### Public Website

The public application must support:

- SSR and SEO-friendly content pages
- Dynamic CMS-powered content
- 3D gallery experience
- Project case studies
- Technology stack
- Work experience
- About section
- Contact information
- Responsive mobile experience
- English-first content with architecture ready for Persian and RTL localization

### Admin Dashboard

Build a custom Nuxt administration interface.

Keystone remains responsible for backend data management, authentication, and CMS functionality.

The custom dashboard communicates with Keystone through a typed and validated API layer.

Admin modules:

1. Overview
2. Projects
3. Skills
4. Skill Categories
5. Work Experience
6. Media Library
7. Profile
8. 3D Scene Configuration
9. SEO Settings
10. Site Settings
11. Revision History

### Content Management Requirements

Every content entity should support appropriate combinations of:

- Create
- Read
- Update
- Delete
- Draft
- Publish
- Archive
- Preview
- Ordering
- Featured status

Use proper authorization and validation.

Public APIs must only expose published content and safe public fields.

Protect all administrative operations.

---

## 6. Data Model

Design the database around these entities:

- User
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
- AuditLog

Requirements:

- Projects and skills must have a many-to-many relationship.
- Experiences and skills must have a many-to-many relationship.
- Projects support multiple media assets.
- Projects support detailed case studies.
- Skills support categories, proficiency, logo, descriptions, and sorting.
- Experiences support company, position, dates, descriptions, achievements, and employment status.
- Content supports draft and publication states.
- All relationships must be manageable from the admin dashboard.

Use proper database constraints and indexes.

Avoid unnecessary abstractions.

### Persian Calendar

The supplied employment dates use the Persian calendar.

Preserve the original precision of month and year.

Do not invent an exact day when only a month is known.

Support Persian calendar display and Gregorian localization without changing the underlying date meaning.

---

## 7. 3D Engineering Gallery

The homepage must contain a cinematic architectural gallery corridor.

Five primary stations:

01 — Frontend Engineering

02 — Backend & Data Engineering

03 — AI & Intelligent Development

04 — Infrastructure & DevOps

05 — Product & Design

### Scene Requirements

- Architectural corridor
- Concrete structures
- Minimal exhibition alcoves
- Warm spotlights
- Emerald accent lighting
- Polished reflective floor
- Carefully selected 3D objects
- Smooth camera transitions
- Subtle environmental animation

Each station should have:

- Unique visual identity
- Label
- Description
- Interactive state
- Related CMS content
- Navigation target

### Interaction

- Scroll-based camera movement
- Hover interactions
- Click-to-explore behavior
- Smooth transitions
- Responsive camera composition
- Reduced-motion support

### Engineering Constraints

- Separate 3D rendering from CMS content.
- Use optimized GLB models.
- Lazy-load noncritical assets.
- Avoid unnecessary draw calls.
- Use appropriate texture compression.
- Optimize shadows and lighting.
- Dispose of Three.js resources correctly.
- Prevent memory leaks.
- Provide a static fallback when WebGL is unavailable.
- Use a simplified mobile scene when necessary.

Do not make the 3D experience block access to the actual portfolio content.

---

## 8. Public Website Sections

Implement the following pages:

### Home

- Navigation
- Cinematic 3D hero
- Professional introduction
- Engineering gallery
- Selected projects
- Skills overview
- Work experience
- Contact CTA

### Projects

- Project catalogue
- Filtering
- Featured projects
- Project detail pages
- Case study structure

### Skills

- Technology categories
- Proficiency levels
- Related projects
- Interactive engineering gallery integration

### Experience

- Professional timeline
- Companies
- Positions
- Responsibilities
- Achievements

### About

- Biography
- Professional identity
- Interests
- Career direction

### Contact

- Contact information
- Social links
- Email contact action

All content must be CMS-driven.

---

## 9. Admin Dashboard Design

The admin dashboard must have its own consistent visual identity.

Use a refined dark interface with restrained emerald accents.

Avoid simply copying the public website's cinematic visual effects into the admin panel.

The dashboard should prioritize usability.

### Overview

Display:

- Published projects
- Draft projects
- Skills count
- Experience records
- Recent updates
- Quick actions

### Project Management

Support:

- Project title
- Slug
- Summary
- Description
- Project role
- Category
- Technologies
- Cover image
- Gallery
- Start and end dates
- Project links
- Case study sections
- Featured status
- Publication status
- SEO metadata

### Skill Management

Support:

- Name
- Category
- Proficiency
- Description
- Logo
- Brand color
- Related projects
- Display order
- Visibility

### Experience Management

Support:

- Company
- Position
- Logo
- Start date
- End date
- Employment status
- Description
- Responsibilities
- Achievements
- Related technologies

### Media Library

Support:

- Image upload
- Image preview
- File metadata
- Categories
- Alt text
- Media replacement
- Storage abstraction

### 3D Configuration

Allow the owner to manage:

- Station visibility
- Station ordering
- Station labels
- Descriptions
- Related skill categories
- Related content links
- Scene display options

Do not expose unsafe arbitrary JavaScript or unrestricted model URLs through the admin interface.

---

## 10. Performance, SEO and Accessibility

Performance is a core requirement.

Implement:

- SSR for important content pages
- Appropriate caching
- Image optimization
- Lazy loading
- Code splitting
- Dynamic imports for heavy 3D components
- Optimized GLB assets
- Responsive image sizes
- Font optimization
- Reduced-motion support
- Keyboard navigation
- Semantic HTML
- Accessible labels
- Proper contrast

Target good Core Web Vitals and Lighthouse scores.

Aim for:

- LCP under 2.5 seconds
- INP under 200 milliseconds
- CLS under 0.1

Treat these as optimization targets, not guaranteed results.

The portfolio must remain usable on low-powered devices.

---

## 11. Security

Implement:

- Secure authentication
- Server-side authorization
- Protected admin routes
- Secure session handling
- Input validation
- File upload validation
- Rate limiting where appropriate
- Secure HTTP headers
- Environment-based secrets
- No hardcoded credentials
- Safe public API responses
- Audit logging for important administrative operations

Do not rely on frontend-only route guards for security.

---

## 12. Engineering Standards

Follow these principles:

- Maintain clear separation of concerns.
- Prefer small, reusable components.
- Avoid over-abstraction.
- Avoid duplicated business logic.
- Keep domain models independent of presentation.
- Use strict TypeScript where practical.
- Use explicit types at application boundaries.
- Keep 3D rendering logic isolated.
- Use consistent naming conventions.
- Add tests for important business logic.
- Keep documentation synchronized with implementation.

Before introducing a new dependency, verify that it is necessary.

Do not replace working architecture without justification.

Do not generate large amounts of placeholder code simply to claim completion.

---

## 13. Development Workflow

Work in controlled phases.

### Phase 1 — Discovery and Architecture

Before writing implementation code:

1. Inspect the repository.
2. Inspect existing files and dependencies.
3. Identify existing applications and libraries.
4. Inspect Nx configuration.
5. Verify Node.js and package manager versions.
6. Identify architectural constraints.
7. Review the supplied visual reference.
8. Produce an architecture assessment.
9. Create an implementation roadmap.
10. Document important architectural decisions.

If the repository is empty, propose a clean initial scaffold.

Do not destroy existing code.

### Phase 2 — Foundation

Create or refine:

- Nx workspace
- Application boundaries
- Shared libraries
- Design tokens
- TypeScript configuration
- Linting
- Formatting
- Testing setup
- Environment configuration

### Phase 3 — CMS and Database

Implement:

- Keystone configuration
- PostgreSQL connection
- Data models
- Relationships
- Authentication
- Authorization
- Public content API
- Seed data

### Phase 4 — Admin Dashboard

Implement the complete management experience.

Validate CRUD operations against the real backend.

### Phase 5 — Public Portfolio

Implement all public pages with CMS-driven content.

### Phase 6 — 3D Experience

Implement and optimize the Engineering Gallery.

### Phase 7 — Production Readiness

Implement:

- Automated tests
- Security review
- SEO review
- Performance review
- Docker configuration
- Nginx configuration
- Deployment documentation
- Database backup and recovery documentation

---

## 14. Mandatory Project Documentation

Maintain these files:

- AGENTS.md
- README.md
- docs/architecture/system-overview.md
- docs/architecture/data-model.md
- docs/architecture/3d-rendering.md
- docs/architecture/security.md
- docs/architecture/performance.md
- docs/decisions/
- docs/development-roadmap.md
- docs/deployment/vps-deployment.md

Update AGENTS.md with enforceable development rules for future coding agents.

---

## 15. Definition of Done

A feature is not complete merely because its UI exists.

It is complete when:

- Its implementation works.
- Its data is correctly persisted.
- Its API behavior is validated.
- Its authorization is correct.
- Its loading and error states are handled.
- Its responsive behavior is checked.
- Its important interactions are tested.
- Its documentation is updated where necessary.

Never claim that a test passed unless it was actually executed.

Never claim production readiness without validating the relevant requirements.

---

## 16. First Task — Start Here

Do not attempt to implement the entire platform immediately.

Start with Phase 1.

Inspect the existing repository and produce a comprehensive report containing:

1. Current repository status.
2. Proposed application architecture.
3. Dependency and version compatibility.
4. Proposed Nx project graph.
5. Database entity relationships.
6. Public website architecture.
7. Admin architecture.
8. 3D rendering architecture.
9. Security considerations.
10. Performance risks.
11. Development phases.
12. Risks and unresolved decisions.

Then prepare the implementation plan and wait for approval before starting the next major phase.

The most important rule:

**Build a coherent, maintainable engineering product with an exceptional visual identity — not just a visually impressive demo.**