# H5.3 Replay / Evidence Codex Review Package v0.1

**Date:** 07 Jul 2026
**Branch:** recovery/june25-known-good
**Purpose:** Targeted Codex qualification of hidden surface-candidate engines.

---

# Context

ZNBW now has generated meta-registries:

- `dependency-registry-v0.1.json`
- `intelligence-warehouse-registry-v0.1.json`
- `engine-intelligence-registry-v0.1.json`

The Engine Intelligence Registry identified hidden product candidates.

This review package focuses on Replay / Evidence engines because they are likely high-value candidates for future product surfacing.

---

# Review Doctrine

Codex should not rewrite code unless explicitly requested.

Codex should review, classify, and qualify.

The goal is to determine whether each engine is:

- usable now
- needs connection
- needs repair
- superseded
- duplicate
- unsafe
- should be archived
- should be surfaced in Admin UI
- should feed Replay Dashboard / Evidence Explorer

---

# Engines for Review

## Replay

```text
artifacts/api-server/src/scripts/build-historical-replay-attribution-engine-v0.1.ts
artifacts/api-server/src/scripts/build-replay-coverage-assessment-registry.ts
artifacts/api-server/src/scripts/build-replay-mechanism-evidence-matrix-v0.1.ts
artifacts/api-server/src/scripts/build-replay-predictions-similarity.ts
artifacts/api-server/src/scripts/build-replay-support-engine-v0.2.ts
