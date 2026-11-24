# ADR 0003 — Editorial publication and revision history

**Status** Recommended after Phase 1.5, owner approval pending  
**Date** 24 November 2026

The editor needs to revise a live case study, including its related media, without exposing incomplete work. Revision history and audit records have separate purposes.

Maintain normalized editable aggregates and versioned immutable snapshots. Publish by advancing a revision pointer in the same transaction that updates media delivery permissions and appends the audit record. Use separate draft and publication versions to reject stale edits and delayed publication commands. Restore a revision as a new draft. Keep hard deletion and revision purging outside the initial workflow.

A status column on a single mutable row is cheaper and would suit a workflow where published edits are immediately public. Separate full draft and published tables preserve relational querying and duplicate many schema and migration concerns. The snapshot proposal keeps one editable schema, at the cost of version-aware decoding and narrower public query design.

Prove the decision with one Project, its linked skill and a private cover on PostgreSQL. Check stale saves, rollback, replay after publish/archive, live filter isolation and media archival races before other editorial types. Revisit retention and advanced workflows after that evidence.

[Project slice acceptance](../architecture/data-model.md#project-vertical-slice-acceptance) · [Keystone context](https://keystonejs.com/docs/context/overview/)
