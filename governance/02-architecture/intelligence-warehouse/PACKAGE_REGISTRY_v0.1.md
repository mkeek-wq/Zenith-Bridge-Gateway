# Intelligence Package Registry v0.1

**Date:** 06 Jul 2026  
**Status:** Discovery registry  
**Purpose:** Track intelligence packages, outputs, producers, and consumers.

---

# 1. Summary

Initial discovery found:

```text
Intelligence package count: 172
```

The package inventory contains:

- Production intelligence outputs
- Intermediate orchestration packages
- Historical snapshots
- Archives
- Raw downloads
- Source configurations

---

# 2. Package Family Counts

| Package Family | Count |
|---|---:|
| Article | 18 |
| Mechanism | 16 |
| Experience | 13 |
| Macro | 12 |
| Evidence | 12 |
| Dataset | 11 |
| Case | 7 |
| Replay | 6 |
| Graph | 3 |
| Decision | 3 |
| Ingestion | 3 |
| Publication | 2 |
| CMS | 2 |
| Forecast | 0 (appears to live outside data/intelligence) |

---

# 3. Important Package Families

## Intelligence Packages

```text
macro-attribution-engine-v0.2
replay-support-engine-v0.2
decision-support-engine-v0.2
case-construction-engine-v0.1
experience-registry-v0.2
mechanism-confidence-engine-v0.2
```

## Publication Packages

```text
article-workbench-package-v0.2
article-intelligence-package-v0.1
article-preview-package-v0.1
cms-draft-package-v0.1
cms-publication-package-v0.1
```

## Governance Packages

```text
dataset-consistency-audit-v0.1
coverage-hardening-dashboard-v0.2
validation-readiness-engine-v0.1
publication-readiness-summary-v0.1
```

---

# 4. Discovery Findings

The package layer appears to contain two ecosystems:

1. Intelligence processing packages
2. Publication delivery packages

The missing layer is orchestration between these ecosystems.

---

# 5. Candidate Future Package

```text
intelligence-orchestration-package-v0.1
```

Potential responsibilities:

```text
Macro Context
Historical Analogues
Forecast Envelope
Business Implications
Recommended Actions
```

---

# Consumption Discovery — 06 Jul 2026

Initial source scan found:

```text
Package references in source: 521
Unique referenced package paths: 143
Known intelligence package/data assets: 172
```

Interpretation:

```text
Most intelligence packages are referenced somewhere in the source tree.
The platform is not merely a graveyard of orphan JSON files.
Many packages are already part of producer/consumer chains.
```

Core packages confirmed as consumed:

```text
replay-support-engine-v0.2
decision-support-engine-v0.2
macro-attribution-engine-v0.2
replay-forecast-envelope-v0.1
replay-analogue-summary-v0.1
```

Current gap:

```text
The packages are consumed by scripts, but many are not surfaced in Admin UI or client-facing product surfaces.
```
