# Phase 6B — Five-station gallery

## Plan

1. Preserve the Phase 6A corridor factory and Frontend model byte for byte. Add
   four alcoves inside its existing bays. Use one renderer and the existing
   camera easing and lifecycle.
2. Add an HTML station selector, canvas picking and published category links.
   Keep the poster as the mobile tier and failure path.
3. Exercise all five stops and run a sustained browser session with context
   and heap sampling. Capture desktop exhibits and the mobile poster.

## Implementation

| Stop | Sculpture | CMS category ID |
| --- | --- | --- |
| Frontend Engineering | Original nested portals | `seed-category-frontend` |
| Backend & Data Engineering | Stacked archival strata with a vertical spine | `seed-category-backend` |
| AI & Intelligent Development | Branching vault with two terminal blocks | `seed-category-ai` |
| Infrastructure & DevOps | Cross-braced service span | `seed-category-infrastructure` |
| Product & Design | Folded plan with staggered planes | `seed-category-product` |

The corridor factory and Frontend GLB match the approved 6A hashes. The four
new alcoves occupy existing bays, with warm local lights, concrete plinths
and jade markers. Their group stays hidden in the settled Frontend view,
preserving its composition and lighting. A single camera eases between bay
offsets on its existing rail. Native scrolling still moves the camera
within the current stop. The station selector and ray picking use the same
controller, and the focus button still controls the exhibit approach.

The public homepage resolves the category link from Keystone's published
projection. Links appear only when a published category has a public skill.
An unpublished category can still have an architectural exhibit without a
content link. Selecting a published category moves focus to its existing
Stack group and closes the gallery.

The additional forms use shared instanced box geometry and three finishes,
with no additional model files, image textures or renderer dependencies.
The renderer retains its one-canvas lifecycle, lazy activation, reduced
motion checks, offscreen pause and cleanup. Phones keep the responsive
poster pending a physical device test.

## Captures

- [Frontend Engineering](screenshots/phase-6b/frontend.png)
- [Backend & Data Engineering](screenshots/phase-6b/backend.png)
- [AI & Intelligent Development](screenshots/phase-6b/ai.png)
- [Infrastructure & DevOps](screenshots/phase-6b/infrastructure.png)
- [Product & Design](screenshots/phase-6b/product.png)
- [Mobile poster](screenshots/phase-6b/mobile.png)

## Desktop performance and memory

The production build ran in headed Chromium at 1440 × 1000 on the Phase 6A
Linux desktop. The scripted session kept one WebGL context live for 65
seconds, changed stops 50 times and scrolled throughout.

| Stop | Settled draw calls | Submitted triangles |
| --- | ---: | ---: |
| Frontend | 12 | 578 |
| Backend | 28 | 890 |
| AI | 25 | 842 |
| Infrastructure | 18 | 720 |
| Product | 14 | 624 |

The opening activation fetched 623,796 bytes of JavaScript and the original
11,168-byte GLB on local HTTP. Each measured stop used one renderer-owned
lighting texture. The 3,901 browser frame-interval samples had a 16.7 ms
median and 16.8 ms p95. These are browser frame intervals rather than
per-draw GPU timings.

Chromium DevTools Protocol sampled memory after explicit garbage collection.
JavaScript heap usage rose from 6,797,340 to 7,101,148 bytes during the
session. Backing storage changed from 873,323 to 873,330 bytes. Listener
count stayed at 45 and DOM nodes went from 302 to 301. This is one short
desktop session and does not establish long-term driver memory behavior.
The repeated context-disposal and forced context-loss regression checks
also passed.

## Verification

- Build, lint, strict typecheck, formatting, and 5 Vitest tests passed.
- The full Playwright suite passed 24 tests. The extended headed case also passed
  and exercised native keyboard station selection, published skill links,
  the sustained tour and the mobile poster capture.
- Reproduce the extended session with
  `GALLERY_SOAK=1 npm run test:e2e -- gallery.spec.ts -g 'five station tour' --headed`
  after building with the pinned workspace toolchain.
- Mobile verification used a 390 × 844 browser viewport. Physical device
  validation remains the gate for a future mobile 3D tier.

Phase 6B is ready for review. Phase 7 awaits explicit approval.
