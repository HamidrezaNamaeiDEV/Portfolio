# Proposed security architecture

**Phase 3 implementation.** The content foundation uses the [current models and API boundaries](../phase-3-content-management.md). The design below records the earlier proposal for broader product scope.

Only Nginx serves public traffic. Trust proxy headers only from that configured edge and overwrite caller-supplied forwarding headers. The public host routes to Nuxt web. The separate admin host routes to Nuxt admin on its own origin. Keystone, PostgreSQL and storage credentials stay behind the deployment boundary. A private network gives defense in depth. Keystone still checks authorization for protected operations.

## Sessions and API access

- Start with a single owner identity provisioned through an explicit bootstrap or recovery command using a secure channel. Use Keystone password authentication and an HttpOnly, Secure, host-only session cookie with SameSite=Lax and a bounded lifetime. Disable public signup. Use Keystone `storedSessions` backed by an `AdminSession` table in PostgreSQL. The Keystone store interface requires application-provided persistence. Enforce expiry in the store, load the current active owner role on protected requests, remove the current session on logout, and revoke all owner sessions on deactivation or password reset.
- Nuxt admin exposes fixed operations under its own origin. Its server forwards only the Keystone session cookie and approved operation input. The cookie has path `/` on the admin host for SSR navigation, with no Domain attribute. Relay only the intended Keystone session `Set-Cookie` headers on login and logout and preserve separate headers. Test the actual cookie path, host and attributes through Nginx and production HTTPS. Keystone loads the authenticated user and rechecks mutation permissions.
- Require POST, the exact configured admin Origin and the expected content type for state-changing browser requests, including login, logout and uploads. Validate the admin trust boundary in server handlers and test cross-origin requests. Apply rate limits for login and file operations. Prevent caching on admin pages, session endpoints and preview responses. Disable indexing for the admin host.
- Web uses fixed, typed reads of published projections. It forwards no browser session to Keystone. Expose only named operations with bounded, validated variables at the browser boundary. Public code forwards neither an admin cookie nor caller-supplied GraphQL documents. Restrict generated list reads to the authenticated admin workflow and disable user-management writes except the intended owner lifecycle. Deny generated mutations for editorial roots, their joins and revision history. Dedicated editor and publication commands enforce access and perform all writes that need a revision or audit event.
- Validate permissions before any call that uses a privileged Keystone context or raw Prisma. Raw Prisma bypasses Keystone access controls. Public resolvers must scope reads to live pointers before projecting fields. Disable the built-in Keystone UI in production and verify packaging, auth, error mapping and reachability in the production topology. [Keystone access control](https://keystonejs.com/docs/guides/auth-and-access-control/) · [Keystone sessions](https://keystonejs.com/docs/config/session/) · [Keystone context](https://keystonejs.com/docs/context/overview/) · [Keystone system configuration](https://keystonejs.com/docs/config/config/)

## Media and preview

- Store private objects under generated immutable keys. Allow owner uploads for a small approved set of raster MIME types. Enforce byte and pixel limits, verify decoded file type, strip metadata by re-encoding as appropriate, and block active content. A bounded backend upload is sufficient for the first image workflow.
- Keep newly uploaded files inaccessible during validation. On failure, record the failed state and clean up abandoned objects with a recoverable process. Mark files ready only after accepted bytes and metadata are both available.
- Serve public media through a fixed path on the web host. The web server accepts a validated media ID and relays only the intended content headers and bytes from Keystone. CMS checks a current `PublishedMediaRef` and a ready asset before delivering bytes. Default editorial media responses to `no-store` at launch so new requests recheck whether the asset is live. Consider bounded revalidation only after an approved withdrawal window and performance evidence. Reject arbitrary source URLs in image processing. Private preview uses the separate authenticated path and `private, no-store` responses even for draft media.
- Keep scene assets on the reviewed build path and map CMS station options to deployed IDs. Maintain a separate asset approval path for any future uploads of models or video. Never interpret CMS HTML, scripts, storage keys or unbounded model URLs as scene instructions.
- Use context-appropriate text escaping and approved rich-text rendering. Apply TLS, a restrictive Content Security Policy tailored to the renderer, frame protection, `nosniff`, and an appropriate referrer policy. Avoid logging cookies, credentials, signed URLs and unpublished content payloads.

## Verification

In the Project slice, test anonymous and inactive users, sibling-origin and foreign-origin mutations, expiry and replay after session revocation, access from the public host, direct object access, draft media and allowlisted public fields. Test that generated mutation paths and invalid operation parameters cannot reach protected state. Confirm login and logout work through the facade while responses and cookies stay on the admin origin. Confirm security headers and routes through the actual staging proxy. Audit sign-in security events separately from editorial transactions where no content commit exists. Audit important editor actions atomically with their content updates.

[Data model](data-model.md) · [Deployment proposal](../deployment/vps-deployment.md)

## Phase 4 implemented boundaries

The admin `/preview` route keeps the existing owner session and global
`private, no-store` and `noindex` response rules. Its API requires the owner and
returns two separate projections: the public published-and-visible snapshot,
and visible draft candidates. Anonymous direct API requests fail with 401 and
remain non-storable and non-indexable. The preview page itself contains no
draft payload in its server-rendered HTML; it fetches protected data after the
owner session is established.

Profile reads and writes use the fixed admin facade. Writes also require the
configured admin Origin; incoming fields are allowlisted and checked for type,
length, and safe URL format. The public site receives only the profile and
content fields allowed by the published projection. Profile and experience
images use the existing bounded data-string handling, and the public image
route checks that the referenced record is published and visible.

Unauthorized API errors receive `private, no-store, must-revalidate`. This
preserves the explicit private response policy when Nitro formats an error;
the disposable-PostgreSQL browser test checks the actual 401 headers. Production
host, HTTPS, proxy, and cookie behavior still require the Phase 7 staging
verification.
