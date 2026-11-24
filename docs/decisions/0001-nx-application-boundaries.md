# ADR 0001 — Nx application boundaries and library timing

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

The public site and editor have different payload, availability, visual and permission needs. The brief also requires a custom Nuxt admin.

Use one Nx/npm workspace for two Nuxt apps and Keystone. Introduce libraries at their first meaningful use and enforce permitted imports. Keep Keystone on its own project and use its supported CLI through Nx targets. Pin Node `24.22.3` and npm `11.19.1` for the Foundation candidate. Nx `24.0.6` and its matching Nuxt plugin accept Nuxt `4.7.0` in package metadata. Verify a clean install, allowed token imports, and a rejected app-to-app import from a Vue SFC. Keep application API coupling visible through contract checks when the shared contracts begin.

A single Nuxt site with admin routes would reduce deployment units, while requiring extra care around bundle separation, route caching and editor cookies. Keystone's generated UI would further reduce initial effort, while leaving the custom editing experience unmet. Three apps add build and deployment overhead and give web, editor and CMS distinct release artifacts and test boundaries.

Revisit the split only if operating three processes exceeds measured VPS capacity or custom admin scope changes.

[Proposed Nx graph and tooling](../architecture/system-overview.md) · [Foundation acceptance](../development-roadmap.md#foundation-acceptance-criteria)
