# Engine Maturity Matrix v0.1

**Original Date:** 06 Jul 2026
**Updated:** 12 Jul 2026
**Status:** Discovery and Integration Assessment
**Purpose:** Classify the maturity of major intelligence engines, composition layers and product surfaces.

---

# Classification Definitions

## Prototype

Engine or package exists but remains experimental or incomplete.

## Operational

Engine runs and produces outputs.

## Integrated

Engine participates in a verified producer-consumer chain.

## Composed

Engine or package contributes to the Business Intelligence Package.

## Surfaced

Engine or package is visible in an Admin UI or other user-facing interface.

## Productized

Engine or package is consumable by external clients through a governed product.

## Hidden

Engine works but is not surfaced.

## Dormant

Engine exists but is no longer actively used.

## Orphaned

Engine or output has no obvious consumer.

---

# Major Engine Families

| Engine Family                     | Primary Package                      | Produces Output | Integrated | Composed in BI Package | Surfaced | Productized | Classification | Notes                                                                            |
| --------------------------------- | ------------------------------------ | --------------: | ---------: | ---------------------: | -------: | ----------: | -------------- | -------------------------------------------------------------------------------- |
| Business Intelligence Composition | business-intelligence-package-v0.1   |               ✅ |          ✅ |              Canonical |        ❌ |           ❌ | Composed       | First canonical composition layer; 12 specialist inputs                          |
| Article Workbench                 | article-workbench-package-v0.2       |               ✅ |          ✅ |                      ✅ |        ✅ |     Partial | Surfaced       | Existing article-specific composition layer preserved for reuse                  |
| Article Intelligence              | article-intelligence-package-v0.1    |               ✅ |          ✅ |                      ✅ |  Partial |     Partial | Integrated     | Adds quantitative article enrichment, ranking, trends and proxy disclosure       |
| Verified Dataset Registry         | verified-dataset-registry-v0.1       |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Dataset inventory and verified values                                            |
| Dataset Audit                     | dataset-audit-report-v0.1            |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Reports pass, questionable and fail results                                      |
| Dataset Coverage                  | dataset-coverage-engine-v0.1         |               ✅ |          ✅ |               Indirect |  Partial |           ❌ | Integrated     | Feeds article readiness and workbench logic                                      |
| Signal Watchlist                  | signal-watchlist-registry-v0.1       |               ✅ |          ✅ |                      ✅ |        ❌ |           ❌ | Composed       | Current package was stale at first BI-package generation                         |
| Macro Attribution                 | macro-attribution-engine-v0.2        |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Explanatory macro context; observed macro data still required for production use |
| Macro Transmission                | macro-transmission-engine-v0.1       |               ✅ |          ✅ |               Indirect |        ❌ |           ❌ | Integrated     | Upstream input to macro attribution                                              |
| Macro Registry                    | macro-registry-engine-v0.1           |               ✅ |          ✅ |               Indirect |        ❌ |           ❌ | Integrated     | Macro driver foundation                                                          |
| Replay Analogue Summary           | replay-analogue-summary-v0.1         |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Historical analogue summary                                                      |
| Replay Confidence                 | replay-confidence-engine-v0.1        |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Internal quality indicator, not prediction accuracy                              |
| Replay Scenario Library           | replay-scenario-library-v0.1         |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Seven reusable scenario families in current output                               |
| Replay Decision Support           | replay-decision-support-layer-v0.1   |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Human/Papa review required                                                       |
| Replay Client Impact              | replay-client-impact-assessment-v0.1 |               ✅ |          ✅ |                      ✅ |  Partial |           ❌ | Composed       | Three current client profiles and assessments                                    |
| Replay Dataset Evidence Bridge    | replay-dataset-evidence-bridge-v0.1  |               ✅ |          ✅ |                      ✅ |        ❌ |           ❌ | Composed       | Current measured evidence coverage remains zero                                  |
| Replay Support                    | replay-support-engine-v0.2           |               ✅ |          ✅ |               Indirect |        ❌ |           ❌ | Hidden         | Core Replay support capability                                                   |
| Replay Forecast Envelope          | replay-forecast-envelope-v0.1        |               ✅ |    Partial |                Not yet |        ❌ |           ❌ | Hidden         | Forecast layer exists but is not yet composed into BI Package v0.1               |
| Replay Historian Snapshot         | replay-historian-snapshot-v0.1       |               ✅ |    Partial |                Not yet |        ❌ |           ❌ | Hidden         | Historical Replay snapshot package                                               |
| Replay Quality                    | replay-quality-summary-v0.1          |               ✅ |          ✅ |               Indirect |  Partial |           ❌ | Integrated     | Supports Papa Replay dashboard                                                   |
| Papa Replay Dashboard Package     | papa-replay-dashboard-package-v0.1   |               ✅ |          ✅ |           Not directly |        ✅ |           ❌ | Surfaced       | Existing focused composition precedent                                           |
| Decision Support Engine           | decision-support-engine-v0.2         |               ✅ |          ✅ |                Not yet |  Partial |           ❌ | Integrated     | Separate decision-support family; candidate for later composition review         |
| Evidence Engine                   | counter-evidence-engine-v0.2         |               ✅ |          ✅ |                Not yet |  Partial |           ❌ | Integrated     | Confidence and falsification support                                             |
| Evidence Lineage                  | evidence-lineage-engine-v0.1         |               ✅ |          ✅ |                Not yet |        ❌ |           ❌ | Hidden         | Existing lineage capability                                                      |
| Driver Diversity                  | driver-diversity-engine-v0.1         |               ✅ |          ✅ |                Not yet |        ❌ |           ❌ | Hidden         | Macro support engine                                                             |
| Case Construction                 | case-construction-engine-v0.1        |               ✅ |          ✅ |               Indirect |        ❌ |           ❌ | Hidden         | Replay dependency                                                                |
| CMS Publication                   | cms-publication-package-v0.1         |               ✅ |          ✅ |             Downstream |        ✅ |     Partial | Surfaced       | Publication pipeline                                                             |
| Intelligence Warehouse            | intelligence-warehouse-registry-v0.1 |               ✅ |          ✅ |          Complementary |        ✅ |    Internal | Surfaced       | Inventories engines and packages; does not replace BI composition                |
| Dependency Registry               | dependency-registry-v0.1             |               ✅ |          ✅ |     Governance support |        ✅ |    Internal | Surfaced       | Repository producer-consumer awareness                                           |
| Client Portal                     | TBD                                  |         Partial |    Partial |                 Future |        ❌ |           ❌ | Prototype      | Future external product surface                                                  |
| Topic Intelligence Package        | TBD                                  |               ❌ |          ❌ |                 Future |        ❌ |           ❌ | Planned        | Must not be treated as implemented                                               |

---

# Current Summary

## Composed

* Business Intelligence Package
* Verified Dataset Registry
* Dataset Audit
* Signal Watchlist
* Macro Attribution
* Replay Analogue Summary
* Replay Confidence
* Replay Scenario Library
* Replay Decision Support
* Replay Client Impact
* Replay Dataset Evidence Bridge
* Article Workbench
* Article Intelligence

## Surfaced

* Intelligence Warehouse
* Dependency Explorer
* Article Workbench
* CMS Publication
* Papa Replay Dashboard

## Integrated but Not Yet Composed

* Forecast Envelope
* Replay Historian
* Evidence engines
* Decision Support Engine v0.2
* Driver Diversity
* additional Macro packages
* additional Replay quality and evaluation packages

## Productized

* No fully governed external intelligence product yet.

## Prototype

* Client Portal

## Planned

* Topic Intelligence Package
* client-specific intelligence
* Morning Brief consumption
* Brainy synthesis over canonical packages

---

# H7.1 Observed State

The first Business Intelligence Package successfully composed twelve available packages.

Observed health:

```text
Available packages: 12
Missing required packages: 0
Missing optional packages: 0
Stale packages: 2
Overall status: degraded
```

The degraded state was caused by stale Signal Watchlist and Macro Attribution packages.

This is considered correct behavior.

Package health must report observed conditions rather than force a healthy status.

---

# Preliminary Conclusion

The repository contains substantially more intelligence capability than is currently productized.

The architecture has advanced from:

```text
Inventory
↓
Classify
↓
Connect
```

to:

```text
Compose
↓
Assess Health
↓
Expose Lineage
↓
Connect Consumers
↓
Productize
```

The next priority is not broad engine creation.

The next priority is to refresh selected upstream chains and connect the first downstream consumer to the Business Intelligence Package.
