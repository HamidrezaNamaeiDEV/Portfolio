# ADR 0007 — Portfolio content management foundation

Phase 3 leads with the owner's technology stack and work experience. Projects are a concise list. The initial owner workflow needs validation, ordering, publication, visibility, relationships and deletion.

Each editable record has a draft or published status and a separate visibility switch. Publishing and editing a published visible record take effect on the next public request. Returning a record to draft withdraws it. The admin labels the effect before save. Public queries use a field allowlist and apply the same published and visible condition to both primary and related records. Physical deletion removes join rows or clears optional taxonomy references under the database's foreign keys.

This model keeps one current version of each record. Immutable snapshots and staged edits alongside published content remain an option when the owner needs history or editorial review. Projects with a published slug can be renamed because this phase uses homepage anchors and has no canonical detail routes.

Skill logos and project covers are optional static PNG, JPEG or WebP uploads, limited to 256 KiB input and four million decoded pixels. Keystone decodes, resizes and encodes them as WebP. PostgreSQL stores the small images with their source records. The public app serves them through a fixed read that verifies publication and visibility on each request. This keeps early storage, backup and access control together. Reassess private object storage before raising the limits or adding a gallery or a media library.

Keystone owns sessions and all mutations. Its generated CRUD API is private and checks owner authorization. The admin facade selects fixed, typed operations and checks the exact configured origin for every mutation. The public facade performs only the published reads and forwards no session.
