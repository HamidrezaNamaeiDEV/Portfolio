# Proposed 3D rendering architecture

The homepage presents one architectural corridor and five stations. Use the selected image as the visual reference for sightlines, alcoves, warm lighting, concrete and glass, typography, and restrained emerald accents. Create or commission a clean corridor poster without baked-in site copy. Keep all headings, station descriptions and navigation in HTML. [Visual reference](../design/AI-Native%20Engineer%20Portfolio%20Gallery.png)

## Scene and content boundaries

| Canonical key | Default station | Example destination |
| --- | --- | --- |
| `frontend` | 01 Frontend Engineering | Published Frontend skill category |
| `backend` | 02 Backend & Data Engineering | Published Backend skill category |
| `ai` | 03 AI & Intelligent Development | Published AI skill category |
| `infrastructure` | 04 Infrastructure & DevOps | Published Infrastructure skill category |
| `product` | 05 Product & Design | Published Product & Design skill category |

Destination examples depend on approved taxonomy. When a target is unavailable, use the station's accessible description and omit its action. CMS authors control labels, descriptions, visibility, order, category relationships and approved display options. The renderer owns station ID, anchor geometry, approved asset mappings and camera constraints. Treat CMS order as presentation and itinerary order. Preserve physical alcove placement. When order is customized, use camera transitions that follow the corridor and can move in either direction.

`apps/web` owns the SSR poster, controls, accessible fallback list and client loading decision. `libs/three-scenes` owns the canvas, scene assembly, asset loader, picking and camera animation. The app passes validated public scene data and receives a typed station selection event. Static and WebGL paths share one station list and navigation state. The canvas enhances that list and does not take keyboard focus. Register ScrollTrigger only within the live gallery and feed progress into one camera controller. Keep normal browser scrolling and provide equivalent click, tap and keyboard actions.

## Render and asset strategy

- Keep the responsive poster and station markup in the SSR tree. Gate a dynamic client import on eligibility and activation. `<ClientOnly>` excludes server rendering, while the import gate controls client bytes. Eligible desktop starts after the poster loads and the gallery is visible. Phone and touch-first layouts use the poster by default with an explicit 3D control on tested browser/device tiers. The reduced-motion and detected unsupported-WebGL paths stay static without fetching the renderer. Provide a control to return to static view. [Nuxt ClientOnly](https://nuxt.com/docs/4.x/api/components/client-only)
- Build one representative alcove with baked lights, believable materials, an optimized GLB and a baked or environment-based floor reflection. Add real-time effects only after profiling. Avoid rendering five isolated canvases and avoid planar reflections until measured benefit justifies them.
- Use compact shared textures and a tested compressed texture path where beneficial. Keep scene assets content-hashed and lazily add the remaining stations. Record asset source, ownership, license and optimization settings. Test Spline exports only when they fit the same asset pipeline and runtime budget.
- Scale mobile render resolution and effects with measured quality tiers. Pause rendering offscreen and in background tabs. Stop animation, remove listeners, and dispose of owned GPU resources on unmount. On context loss, initialization failure, or an asset error, restore the poster and the same station navigation. Preserve focus and scroll position, and offer a controlled retry only when eligibility remains. Late async completion must not resurrect a disposed scene. [WebGL context loss](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event)

## One-station acceptance

Compare the poster-only and one-station production builds on the named desktop and physical phone before extending the scene. Use normal scroll and visible HTML links. Verify JavaScript disabled, keyboard and touch navigation, zoom, resize, orientation changes, a change to reduced motion while mounted, disabled WebGL, failed assets, context loss, and repeated route entry and exit. Check request traces for zero renderer bytes on static-by-design paths, then verify the activated scene budgets and stable memory across repeated visits. An ineligible or failing tier stays static. Score the approved visual composition on the same viewports before adding the other stations.

[Performance budgets](performance.md) · [TresJS installation](https://docs.tresjs.org/getting-started/installation/) · [Three.js documentation](https://threejs.org/docs/)

