# Proposed performance targets and verification

Prioritize server-rendered content, appropriately sized images and a small critical font set. Give the poster explicit dimensions to reserve space and prioritize the above-the-fold image if lab traces show it is the LCP element. Lazy-load offscreen images and code. Measure the gallery as a separate cost against a poster-only production build.

## Starting budgets

| Metric | Proposed target | Evidence |
| --- | --- | --- |
| Public Core Web Vitals | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 at p75, reported separately for mobile and desktop | Field telemetry or CrUX when there is sufficient traffic. Lab measurements support diagnosis. [Core Web Vitals](https://web.dev/articles/vitals) |
| Critical imagery | Initial mobile poster ≤ 250 KB and desktop poster ≤ 450 KB transferred | Cold-cache production runs and visual comparison of the encoded output |
| Gallery network | Zero scene, model and decoder transfer on static-by-design paths. First station activation after initial render ≤ 1.5 MB compressed transfer including scene JS, assets and decoders | DevTools request traces split by renderer tier |
| Gallery frame time | On the measured camera sequence, p95 frame interval ≤ 20 ms on reference desktop and ≤ 36 ms on the named mobile device, with a median cadence around 60 fps or higher on desktop and 30 fps or higher on mobile | Real-device production profiler, with device, DPR, viewport and scene tier recorded |
| Lifecycle | No accumulating render listeners or GPU resource counts through repeated entry and exit | Repeated route transitions and WebGL/context-recovery checks |

The byte and frame budgets are engineering proposals. Record the first-station baseline and seek approval for any budget change. For each tier capture at least three comparable cold-load traces and a repeatable active-camera sequence. Record browser, refresh rate, device, viewport, DPR, throttle profile, dropped frames, and the transferred assets. Verify functional layout at 320 and 390 CSS px plus the desktop reference width. Keep the static path for devices that miss the scene threshold.

## Delivery and cache

- Start with SSR and no shared caching for content HTML or public API responses. Revisit a short bounded cache only if profiling finds a meaningful bottleneck and withdrawal behavior has an approved limit. Cache content-hashed deployment assets independently. Keep draft and uploaded editorial media responses outside shared caches at launch.
- Batch and bound CMS reads for each page. Verify graceful CMS failure with a meaningful content error and appropriate HTTP status. Cache expired or failed reads only with a documented policy. A real unpublished project returns 404, while an upstream failure returns a service error.
- Use responsive AVIF/WebP where suitable, with separate mobile hero composition if crop tests require it. Self-host approved fonts and select only required subsets and weights. Preserve legibility with browser zoom, reduced motion and no canvas.
- Run repeatable mobile and desktop cold-cache lab profiles before release on the staging topology. Pair Lighthouse/DevTools diagnostics with browser navigation, real-device interaction traces and accessibility checks. Track field INP once traffic permits. [Field measurement guidance](https://web.dev/articles/vitals-field-measurement-best-practices)

