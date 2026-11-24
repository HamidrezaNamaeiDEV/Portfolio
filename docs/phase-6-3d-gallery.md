# Phase 6A — Interactive Engineering Gallery

## Technical proposal

Phase 5 renders the responsive corridor poster and the CMS content on the
server. At the start of 6A, the workspace had no `libs/three-scenes`,
renderer package, or scene data model. The prototype adds the scene library and one Frontend
Engineering alcove. The source composition guides the long sightline, warm
lights, charcoal concrete, restrained emerald and reflective floor.
[Approved corridor reference](design/AI-Native%20Engineer%20Portfolio%20Gallery.png)

### Integration

Use Three.js r187 WebGLRenderer directly for this prototype. TresJS core 5.12
and its Nuxt module 5.10 provide a compatible Vue scene renderer and
client-only Nuxt canvas. It is a viable option
when station composition becomes declarative. The prototype uses a single
imperative scene so its frame scheduler, context and resources have one
owner. The library exposes mount/dispose and selection events. It imports
no Vue, Nuxt or CMS code. Direct browser APIs supply scroll progress and
camera easing. GSAP ScrollTrigger becomes useful if later sequencing
requires coordinated timelines or pinning. Keep native scrolling for this
prototype.
[Three.js releases](https://github.com/mrdoob/three.js/releases) ·
[TresJS Nuxt integration](https://docs.tresjs.org/getting-started/installation/) ·
[GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

```text
Public CMS projection → homepage → existing Technology Stack anchors
                              └─ GalleryHero → responsive poster and HTML controls
                                             └─ activation → three-scenes
Scene
├─ Camera: bounded eye-height dolly, facing down the corridor
├─ Structure: floor, ceiling, walls, repeating architectural bays
├─ Lighting: ambient fill, restrained warm fixtures and floor glints
└─ Frontend station: alcove, plinth, one GLB sculpture, picking volume
```

| Station | Category identity in the existing CMS seed |
| --- | --- |
| Frontend Engineering | `seed-category-frontend` |
| Backend & Data Engineering | `seed-category-backend` |
| AI & Intelligent Development | `seed-category-ai` |
| Infrastructure & DevOps | `seed-category-infrastructure` |
| Product & Design | `seed-category-product` |

Only the Frontend ID is used in 6A. The app resolves the label and anchor from
the published category and checks that it has a public skill before offering
the link. The scene receives interaction callbacks without CMS fields. A later
configuration model should reference category IDs and allowlisted asset keys.
For 6B, define one eye-height camera pose and look target for each physical
alcove. Interpolate along the corridor between poses. Feed scroll progress
and explicit station selection into the same camera controller, with native
section links in HTML for keyboard navigation and the static view.

### Implementation plan

1. Add the isolated Nx library with a pinned Three.js runtime and strict
   typecheck. Build the corridor with shared primitive geometry and a small,
   original GLB for the exhibit.
2. Render on demand. Feed bounded hero scroll progress into an eased eye-height
   dolly and use raycasting to highlight and select the single alcove.
   Keep focusable HTML controls and the category anchor outside the canvas.
3. Keep the poster underneath the rendering surface. Load the renderer and
   model only after explicit activation on a wide, fine-pointer viewport
   with motion permitted and WebGL 2 available. Restore the poster on
   context loss, initialization or loading failure, or eligibility change.
4. Measure production browser behavior at desktop and phone widths. Test
   activation, selection, keyboard navigation, reduced motion, unsupported
   WebGL, context loss, asset failure and repeated activation/disposal.

### Visual and performance strategy

Use a small shared set of concrete materials, basic warm light strips and
approximate floor highlights. Keep shadows and postprocessing off for the
prototype. Baked occlusion and reflection maps are candidates for 6B after
asset review. Asset candidates should have a shared material palette, merged
static geometry, bounded texture atlases and glTF validation. Introduce a
compression decoder only when its transfer and decode costs are justified.

Clamp desktop DPR and drawing-buffer area. Pause rendering when offscreen
or hidden and stop after camera easing settles. Phone and coarse-pointer
layouts retain their dedicated responsive poster until a physical device
justifies an opt-in rendering tier. The performance review uses the budgets
in [performance.md](architecture/performance.md).

## Prototype delivery

The hero starts with the server-rendered poster in every browser. The desktop
control requests WebGL 2, then imports the renderer and fetches the exhibit.
The Nuxt build suppresses the renderer's SSR prefetch so a static visit
does not fetch the heavy chunk. One canvas takes over the same visual area
after its first frame. Native page scroll moves the camera, hovering the
alcove highlights the exhibit marker, and selecting it moves the camera
closer. The HTML Focus exhibit button exposes the same selected state.
When Frontend Engineering and at least one of its skills are public, the
category link closes the session and focuses the Stack section for that
category.

Static view, context loss, changes to reduced motion or desktop eligibility,
and component teardown all clean up the scene. The library disconnects its
observers and event handlers, cancels the pending frame, and disposes the
renderer, mesh resources and instance buffers. The app aborts pending fetches
and releases the WebGL context. A failed or canceled attempt leaves the
poster and standard homepage navigation available. Context loss recovery
offers a fresh opt-in rather than restoring an old session.

The original texture-free exhibit ships as a self-contained 11,988-byte GLB.
Its three material groups merge ten box primitives into 120 triangles.
Rebuild it with `node libs/three-scenes/tools/build-exhibit.mjs`. The source
is procedural and uses no third-party model or texture assets. The corridor
is assembled at activation from instanced primitives. Floor glints
approximate warm reflections in a single translucent shader pass.

## Browser captures

- [Desktop WebGL prototype, 1440 × 1000](screenshots/phase-6a/gallery-desktop.png)
- [Mobile poster, 390 × 844 touch emulation](screenshots/phase-6a/gallery-mobile.png)

The desktop capture publishes the seeded Frontend category and one existing
skill in a disposable database. The mobile capture shows the static tier.
Visual review removed the poster from underneath the live frame and added
warm fill to bring out the ceiling ribs and concrete columns.

## Performance and lifecycle evidence

Measurements use the built Nuxt app on local Linux with an Intel Core
i5-9400, Intel UHD Graphics 630 and Chromium 159.0.8154.6. The headed
browser used Mesa through ANGLE at DPR 1, with no network throttle.

| Measurement | Result |
| --- | --- |
| Poster tier | Existing desktop and mobile WebP images are 37,226 and 18,496 bytes. The first SSR document does not prefetch renderer code. The mobile, reduced-motion and no-JavaScript browser paths leave the scene inactive. |
| First desktop activation | 621,800 bytes of renderer JS and 11,988 bytes of GLB encoded payload on local HTTP, below the 1.5 MB activation budget. No model decoder or texture download. |
| Geometry | 12 draw calls and 590 submitted triangles on the opening frame. Drawing buffer 900 × 688 at the measured viewport. |
| Texture memory | One internal Three.js 16 × 16 RG half-float lighting lookup, 1 KiB of texel data. This excludes the default color, depth and antialias buffers, shader storage and driver allocations. |
| Hardware camera sweep | Median frame interval 16.7 ms and p95 16.7–16.8 ms across the headed runs. Playwright samples browser frame cadence during repeated native scrolling. |
| GPU time for scene callbacks | Independent Chromium timer query measured 97 valid render callbacks, with 4.8 ms median and 9.7 ms p95 GPU time. This measures scene work and does not establish system-wide GPU utilization. Linux denied access to the i915 busy counter. |
| Headless software diagnostic | SwiftShader had 50.0 ms median and 66.7 ms p95 in the full headless suite. It missed the desktop target and is not a hardware baseline. |
| Cleanup | All 48 contexts were released in a headed open/close loop. After explicit garbage collection, JavaScript heap was 5.23 MB after cycle 1, 6.55 MB after cycle 12 and 6.75 MB after cycle 48. Backing storage stayed at 0.86 MB from cycle 12 onward. Context loss recovery also passed. This short test does not establish long-session driver memory behavior. |

## Verification and review gate

- `npm run build`, `npm run lint`, `npm run typecheck`, and
  `npm run format:check` passed with Node 24.22.3 and npm 11.19.1.
- `npm test` passed 5 Vitest tests. The standard `npm run test:e2e` passed
  23 Playwright tests against disposable PostgreSQL. The focused gallery
  suite passed 3 headed tests, followed by two additional headed desktop
  traces on fresh browser contexts.
- The gallery browser tests cover lazy loading, pointer and keyboard
  selection, category navigation and focus, repeated release, reduced
  motion at load time and during rendering, unsupported WebGL, context
  loss, model failure, no JavaScript, and phone poster rendering.
- The Nx graph shows `web → three-scenes`. The library owns rendering and
  has no dependency on app or domain projects.

The remaining review inputs are visual approval, physical phone testing,
and longer-session GPU memory profiling. There was no connected physical
phone. Keep the mobile poster tier while that evidence is missing.
Phase 6B starts after explicit approval of the prototype and architecture.

## Phase 6A visual refinement

The hero now reserves a dedicated copy column and starts both the canvas and
the desktop poster beyond it. The landscape has a softer lower edge that
leads into Technology Stack. Mobile retains the stacked poster composition.

The Frontend exhibit uses three nested architectural portals to represent
a responsive layout adapting to narrower spaces. The new GLB uses nine
primitives in the same three material groups and weighs 11,168 bytes.
The corridor meshes, camera behavior and lifecycle remain as in the prototype.
The desktop controls now share a single rail with a muted Static view action,
an emerald category link and an inset keyboard focus ring.

The updated captures are linked in [Browser captures](#browser-captures).
The headed gallery suite passed all three tests. At 1280, 1440 and 1920 px,
browser checks verified that text fits its column, the canvas and controls
clear it, and the document has no horizontal overflow. The Intel UHD 630
opening frame used 12 draw calls and 578 triangles. The camera sweep
measured 16.7 ms p95 between frames.

The full suite passed 23 Playwright tests, including the existing fallback
and resource-release cases. Build, lint, typecheck, formatting and all 5
Vitest tests also passed.
