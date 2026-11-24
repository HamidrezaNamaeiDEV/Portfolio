# A/ — Engineering Portfolio

A public engineering portfolio with an interactive architectural gallery and a private CMS-backed administration dashboard.

The Foundation includes two minimal Nuxt SSR shells, a Keystone server with its native Admin UI disabled, and shared CSS design tokens. The CMS schema contains a disposable test fixture.

## Run Foundation checks

Use Node 24.22.3 with npm 11.19.1. The workspace pins both versions. Docker is required for the isolated CMS check.

```bash
nvm install
nvm use
node --version
npm --version
npm ci
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run test:cms
```

The CMS smoke command creates a fresh PostgreSQL instance and a Linux Node container, then removes those resources. It takes no database connection settings from the shell or local environment files. See the [Foundation report](docs/phase-2-foundation.md) for the graph, verification results, and recovery procedure.

## Project documentation

| Document                                                          | Contents                                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Phase 1.5 validation](docs/architecture/phase-1.5-validation.md) | Findings by severity, environment changes, and the Phase 2 approval recommendation                               |
| [Architecture assessment](docs/architecture/system-overview.md)   | Workspace inventory, compatibility, visual review, proposed Nx graph, application boundaries, and open decisions |
| [Database model](docs/architecture/data-model.md)                 | Entities, relationships, publication, revision history, and Persian calendar precision                           |
| [3D rendering](docs/architecture/3d-rendering.md)                 | Station architecture, asset ownership, interaction, and fallbacks                                                |
| [Security](docs/architecture/security.md)                         | Session, API, media, preview, and auditing boundaries                                                            |
| [Performance](docs/architecture/performance.md)                   | Core Web Vitals, initial budgets, and measurement                                                                |
| [Decision records](docs/decisions/README.md)                      | Proposed choices, alternatives, and consequences                                                                 |
| [Development roadmap](docs/development-roadmap.md)                | Phased delivery and acceptance criteria                                                                          |
| [VPS deployment](docs/deployment/vps-deployment.md)               | Proposed topology, migrations, backups, and recovery                                                             |

[Product brief](MASTER_PROMPT.md) · [Engineering rules](AGENTS.md) · [Visual reference](docs/design/AI-Native%20Engineer%20Portfolio%20Gallery.png)
