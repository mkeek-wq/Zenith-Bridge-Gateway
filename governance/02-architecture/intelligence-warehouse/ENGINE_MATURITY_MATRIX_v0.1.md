# Engine Maturity Matrix v0.1

**Date:** 06 Jul 2026
**Status:** Discovery
**Purpose:** Classify the maturity of major intelligence engines and identify hidden capabilities that should be surfaced.

---

# Classification Definitions

## Prototype
Engine exists but is experimental or incomplete.

## Operational
Engine runs and produces outputs.

## Integrated
Engine participates in producer/consumer chains.

## Surfaced
Engine is visible in Admin UI or other user-facing interfaces.

## Productized
Engine is consumable by clients.

## Hidden
Engine works but is not surfaced.

## Dormant
Engine exists but is no longer used.

## Orphaned
Engine has no obvious consumers.

---

# Major Engine Families

| Engine Family | Package | Produces Output | Consumed | Surfaced | Productized | Classification | Notes |
|---------------|----------|----------------|-----------|-----------|--------------|----------------|-------|
| Article Workbench | article-workbench-package-v0.2 | ✅ | ✅ | ✅ | Partial | Surfaced | Current primary intelligence surface |
| Macro Attribution | macro-attribution-engine-v0.2 | ✅ | ✅ | Partial | ❌ | Integrated | Feeds replay and decision layers |
| Replay Support | replay-support-engine-v0.2 | ✅ | ✅ | ❌ | ❌ | Hidden | Core replay capability exists |
| Replay Forecast Envelope | replay-forecast-envelope-v0.1 | ✅ | Partial | ❌ | ❌ | Hidden | Forecast layer implemented |
| Replay Confidence | replay-confidence-engine-v0.1 | ✅ | Partial | ❌ | ❌ | Hidden | Consumes forecast envelope |
| Replay Historian Snapshot | replay-historian-snapshot-v0.1 | ✅ | Partial | ❌ | ❌ | Hidden | Historical replay package |
| Decision Support | decision-support-engine-v0.2 | ✅ | ✅ | Partial | ❌ | Integrated | Candidate dashboard engine |
| Driver Diversity | driver-diversity-engine-v0.1 | ✅ | ✅ | ❌ | ❌ | Hidden | Macro support engine |
| Case Construction | case-construction-engine-v0.1 | ✅ | ✅ | ❌ | ❌ | Hidden | Replay dependency |
| Evidence Engine | counter-evidence-engine-v0.2 | ✅ | ✅ | Partial | ❌ | Integrated | Confidence and validation support |
| Dataset Coverage | dataset-coverage-engine-v0.1 | ✅ | ✅ | Partial | ❌ | Integrated | Hygiene and governance layer |
| CMS Publication | cms-publication-package-v0.1 | ✅ | ✅ | ✅ | Partial | Surfaced | Publication pipeline |
| Client Portal | TBD | Partial | Partial | ❌ | ❌ | Prototype | Future product surface |

---

# Initial Summary

## Productized
- None yet.

## Surfaced
- Article Workbench
- CMS Publication

## Integrated
- Macro Attribution
- Decision Support
- Evidence
- Dataset Coverage

## Hidden
- Replay ecosystem
- Forecast ecosystem
- Historian
- Driver Diversity
- Case Construction

## Prototype
- Client Portal

## Dormant
- TBD

## Orphaned
- TBD

---

# Preliminary Conclusion

The repository contains substantially more intelligence capability than is currently visible.

The next phase is likely:

Inventory
↓
Classify
↓
Connect
↓
Surface
↓
Productize
