# CMS/API/DB Dirty State Preservation – 2026-07-06

## Context

Before starting H5.2 Intelligence Warehouse work, the repository was found in a dirty state on branch:

recovery/june25-known-good

HEAD:

a9772f6 Build dynamic intelligence warehouse control room

Runtime health at discovery:

- zenith-admin ONLINE
- zenith-api ONLINE

## Summary

The dirty state is not part of H5/H5.1 Dynamic Intelligence Warehouse work.

It appears to contain older or parallel CMS/API/DB architecture changes affecting:

- @workspace/db package exports and build behavior
- database initialization pattern
- article schema naming and metadata fields
- OpenAPI CreateArticleBody / UpdateArticleBody contracts
- generated API client files
- generated Zod API files
- pnpm-lock.yaml
- Vite / React plugin version pinning
- JWT/auth helper files
- article service files

## Important Finding

Deleted active files:

- artifacts/api-server/data/intelligence/openai-article-package-v0.3.json
- artifacts/api-server/data/intelligence/openai-generated-article-package-v0.3.json

were found preserved under:

artifacts/api-server/data/intelligence/archive/

So they are archived, not lost.

## Risk

These changes touch foundational runtime/package layers and should not be mixed with H5.2 Intelligence Warehouse work.

Risk areas:

- DB runtime behavior
- article CMS compatibility
- API contract compatibility
- generated client compatibility
- workspace dependency drift
- pnpm lockfile drift
- production build behavior

## Doctrine

Do not commit this dirty state together with Intelligence Warehouse work.

Before H5.2, either:

1. preserve and revert this state, or
2. explicitly promote it into its own recovery branch/commit after dedicated review.

Recommended path for H5.2:

- preserve dirty diff
- preserve untracked file list
- restore clean H5.1 baseline
- continue Intelligence Warehouse work separately

## Preservation Files

- CMS_API_DB_DIRTY_STATE_DIFF_20260706.patch
- CMS_API_DB_DIRTY_STATE_STATUS_20260706.txt

## Classification

Current classification:

Uncommitted CMS/API/DB architecture drift — preserve before touching.
