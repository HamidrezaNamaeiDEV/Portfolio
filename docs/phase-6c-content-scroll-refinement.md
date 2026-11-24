# Phase 6C — Content and gallery scroll

## Implementation plan

1. Audit the production public API and CMS before changing publication. Publish
   only existing approved records and the taxonomy they require. Verify the
   public response and browser rendering after publication.
2. Give the activated desktop hero a sticky track. The web app converts native
   document position to progress. The renderer interpolates the existing five
   poses and no longer subscribes to document scroll.
3. Route keyboard, ray picking and station selection through native scrolling
   to station positions on that same track. Keep the static hero outside the
   track until successful activation and on mobile and reduced motion.
4. Verify at the requested viewport sizes. Capture fixture browser evidence
   independently of production evidence.

## Content audit

The accessible PostgreSQL instance is the local `portfolio-dev-db` container.
A read-only query found 40 skills, 5 skill categories, 4 proficiency records,
2 experiences and 3 projects. All were visible drafts. All 40 skills
referenced categories and none had logos. This establishes why the local
public projection is empty. It does not establish production record counts.

Public hostnames and a production CMS access path were not present in the
workspace configuration. Production counts, publication changes and public
browser verification remain pending.
