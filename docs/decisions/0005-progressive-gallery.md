# ADR 0005 — Progressive gallery and asset ownership

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

The corridor gives the homepage its identity. Users need equivalent navigation when the device, browser or motion preference makes WebGL unsuitable.

Ship an SSR poster and station links. Add a gated client import for the TresJS and Three.js renderer with ScrollTrigger camera input. Phone and touch-first tiers default to the poster and offer opt-in 3D on tested tiers. Reduced-motion and unsupported-WebGL paths stay static. Keep five stable physical anchors and versioned assets in code. CMS controls bounded content and itinerary options. Select new asset loading only after the first station passes visual, performance and lifecycle checks.

A renderer-first homepage would make the first impression depend on GPU initialization. A static-only gallery would be easier to deliver and would omit the requested interactive experience. Progressive rendering requires two visual states and one common station model.

Require named desktop and physical phone test devices, approved asset sources, network traces and a measurable one-station gate before the remaining scene work.

[Scene design](../architecture/3d-rendering.md) · [Budgets](../architecture/performance.md)
