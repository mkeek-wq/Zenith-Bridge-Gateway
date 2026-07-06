# Phase H5.1 Dynamic Intelligence Warehouse Discovery v0.1

**Date:** 06 Jul 2026  
**Branch:** recovery/june25-known-good  
**Status:** Discovery  
**Purpose:** Document existing intelligence warehouse assets before implementation.

---

# 1. Executive Summary

Phase H5 created a static read-only Intelligence Warehouse UI.

Phase H5.1 should not build new intelligence engines first.

Discovery shows the repository already contains a large intelligence substrate.

The next task is to dynamically surface, classify, and orchestrate existing intelligence assets.

---

# 2. Current Warehouse Limitation

Current UI:

/admin/intelligence-warehouse

is static and hardcoded.

It currently shows:
- build engine count
- intelligence file count
- package count
- maturity matrix
- hidden capabilities
- architecture references

This is useful as a control-room shell, but it does not yet read live repository intelligence.

---

# 3. Live Intelligence Data Discovery

Command:

find artifacts/api-server/data/intelligence -type f | wc -l

Result:

172 intelligence files

This supersedes the earlier static warehouse count of 138.

Discovered package categories include:
- article packages
- CMS publication packages
- dataset coverage packages
- macro attribution packages
- replay packages
- decision-support packages
- evidence packages
- mechanism packages
- experience registry packages
- prediction / validation packages
- graph packages
- raw / parsed dataset files

---

# 4. Replay Ecosystem Discovery

Replay is not a small hidden capability.

Replay is a major subsystem.

Discovered replay-related scripts include:
- proposal approval / rejection
- replay dashboard package
- analogue summary
- audit engine
- calibration engine
- case registry
- case scoreboard
- client impact assessment
- confidence engine
- coverage assessment
- dataset evidence bridge
- decision support layer
- evidence validation
- dry-run executor
- fleet execution
- fleet evaluation
- fleet learning report
- forecast envelope
- forecast range smurf
- governance history
- historian snapshot
- improvement history
- landscape cartographer
- macro acquisition
- macro event registry
- mechanism coverage
- prediction similarity
- publication date gate
- readiness check
- scenario library
- shadow execution
- support engine
- wave 1 readiness
- single case replay runner
- batch replay runner
- replay benchmark
- replay similarity engine
- replay cycle runner
- replay proposal registry

Conclusion:

Replay should be treated as a first-class ecosystem inside the Intelligence Warehouse.

---

# 5. Decision Ecosystem Discovery

Decision-related scripts:

- build-decision-support-engine-v0.1.ts
- build-decision-support-engine-v0.2.ts
- build-replay-decision-support-layer-v0.1.ts
- build-sector-manual-promotion-decision-v0.1.ts

Conclusion:

Decision support exists, but is smaller and less surfaced than replay.

It should be classified as:
- real subsystem
- early maturity
- internal-only
- requires governance before client-facing use

---

# 6. Forecast Ecosystem Discovery

Forecast-related scripts:

- build-replay-forecast-envelope-v0.1.ts
- build-replay-forecast-range-smurf-v0.1.ts

Conclusion:

Forecast exists as a replay-linked envelope/range layer.

It should not yet be presented as deterministic prediction.

It should be surfaced as:
- forecast range
- scenario envelope
- decision-support signal
- internal only

---

# 7. Historian Discovery

Historian / historical scripts include:
- historical cases
- historical evidence acquisition
- historical evidence scorecards
- historical investigation packages
- historical outcomes
- historical replay attribution
- replay confidence history
- replay governance history
- replay historian snapshot
- replay improvement history
- case history updates

Conclusion:

Historian is a major support layer for Replay and Decision Support.

It should be surfaced as:
- historical memory
- case archive
- evidence history
- governance history
- improvement history

---

# 8. Proposed H5.1 Architecture

Dynamic Intelligence Warehouse should evolve into:

Intelligence Warehouse
├── Overview
├── Engine Registry
├── Package Registry
├── Replay Ecosystem
├── Forecast Ecosystem
├── Decision Ecosystem
├── Historian
├── Hidden Capabilities
├── Dependency Explorer
└── Architecture

---

# 9. Recommended Implementation Path

Do not wire the UI directly to scattered repository files.

Preferred path:

filesystem
↓
discovery scripts
↓
warehouse registry JSON
↓
API or static admin-accessible JSON
↓
Warehouse UI

Initial generated registries:

- warehouse-engine-registry-v0.1.json
- warehouse-package-registry-v0.1.json
- warehouse-capability-registry-v0.1.json

---

# 10. Safety Doctrine

No blind coding.

Before implementation:
- inspect existing scripts
- inspect package schemas
- identify safe output directory
- avoid runtime deletion
- avoid deployment --delete
- keep warehouse read-only first

---

# 11. Phase H5.1 Recommended First Build

First build should be a discovery package generator, not a UI redesign.

Target:

artifacts/api-server/data/intelligence/warehouse-engine-registry-v0.1.json

This should classify existing scripts by capability:
- replay
- forecast
- decision
- historian
- macro
- evidence
- mechanism
- dataset
- article
- graph
- governance
- other

Only after the registry exists should the UI become dynamic.

---

# 12. Current Conclusion

The repository already contains enough intelligence infrastructure to justify a Papa Smurf Control Room.

The main gap is visibility, classification, orchestration, and governance.

H5.1 should therefore surface what already exists before creating new engines.
