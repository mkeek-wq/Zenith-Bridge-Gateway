# H7.1 Business Intelligence Package Architecture v0.1

**Date:** 12 Jul 2026
**Status:** Implemented Architecture
**Phase:** H7.1
**Branch:** `recovery/june25-known-good`
**Implementation Commit:** `685256e`
**Implementation Tag:** `zenith-business-intelligence-package-v0.1`
**Purpose:** Define the first canonical composed intelligence object within ZNBW.

---

# 1. Mission

H7.1 introduces the Business Intelligence Package as the canonical interface between specialist intelligence packages and downstream product surfaces.

The Business Intelligence Package does not replace specialist engines.

It does not generate new intelligence.

It composes governed specialist outputs into one auditable, traceable and reusable contract.

```text
Specialist Engines
↓
Specialist Packages
↓
Business Intelligence Package
↓
Product Consumers
```

---

# 2. Architectural Transition

H6 established repository and dependency awareness.

```text
H6

Repository understands itself.
```

H7 begins composition of the knowledge already present in the repository.

```text
H7

Repository understands what it knows.
```

The platform is moving from:

```text
Independent engines
↓
Independent JSON outputs
↓
Direct product integrations
```

towards:

```text
Independent engines
↓
Governed specialist packages
↓
Business Intelligence Package
↓
Products
```

---

# 3. Why the Package Exists

ZNBW already contains specialist packages for:

* verified datasets;
* dataset audits;
* signal watchlists;
* macro attribution;
* Replay analogues;
* Replay confidence;
* scenario libraries;
* decision support;
* client impact;
* dataset evidence;
* article workbenches;
* article intelligence.

Before H7.1, downstream products could require direct knowledge of many separate package contracts.

This creates:

* unnecessary coupling;
* repeated integration logic;
* inconsistent health assessment;
* difficult lineage reconstruction;
* product-specific duplication;
* greater maintenance risk.

The Business Intelligence Package provides one governed composition layer over these specialist outputs.

---

# 4. Core Doctrine

> The Business Intelligence Package is the first canonical composed intelligence object within ZNBW.

It composes specialist intelligence without replacing specialist package ownership.

The source package remains canonical for its own domain.

The Business Intelligence Package records:

* what package was consumed;
* where it was read from;
* which version was used;
* when it was generated;
* whether it was available;
* whether it was stale;
* which summary was exposed;
* which direct lineage relationships were declared.

---

# 5. Composition Philosophy

The package follows four principles.

## 5.1 Compose, Do Not Duplicate

The composer extracts selected summaries and references.

It does not copy every dataset, case, evidence item or time series into a second warehouse.

```text
Source Package
↓
Selected Summary
+
Version
+
Timestamp
+
Lineage
↓
Business Intelligence Package
```

Detailed data remains available through the source package when deeper inspection is required.

---

## 5.2 Source Packages Remain Canonical

The Business Intelligence Package is not the system of record for specialist outputs.

Examples:

```text
Replay Confidence Engine
→ canonical source for Replay confidence

Dataset Audit Report
→ canonical source for dataset audit results

Macro Attribution Engine
→ canonical source for macro attribution

Article Workbench
→ canonical source for article workbench content
```

The Business Intelligence Package provides a composed view over these sources.

---

## 5.3 No New Intelligence in v0.1

Version 0.1 performs:

```text
Read
↓
Validate
↓
Classify health
↓
Select summaries
↓
Record lineage
↓
Write
```

It does not:

* generate recommendations;
* create forecasts;
* reinterpret evidence;
* override confidence;
* rewrite specialist conclusions;
* use GPT or other AI reasoning;
* mutate production intelligence.

---

## 5.4 Preserve Legacy Pipelines

Existing article and publication pipelines remain operational.

H7.1 is additive.

The existing Article Workbench and Article Intelligence Package are preserved as reusable components.

```text
Existing Article Pipeline
↓
Preserved
↓
Referenced by Business Intelligence Package
↓
Available for future rewiring
```

No old package or builder was removed, renamed or modified during H7.1.

---

# 6. Implemented Inputs

The first Business Intelligence Package composes twelve existing packages.

## Dataset Layer

```text
data/intelligence/verified-dataset-registry-v0.1.json
data/intelligence/dataset-audit-report-v0.1.json
```

## Signal Layer

```text
data/intelligence/signal-watchlist-registry-v0.1.json
```

## Macro Layer

```text
data/intelligence/macro-attribution-engine-v0.2.json
```

## Existing Article Layer

```text
data/intelligence/article-workbench-package-v0.2.json
data/intelligence/article-intelligence-package-v0.1.json
```

## Replay Layer

```text
data/replay/replay-analogue-summary-v0.1.json
data/replay/replay-confidence-engine-v0.1.json
data/replay/replay-scenario-library-v0.1.json
data/replay/replay-decision-support-layer-v0.1.json
data/replay/replay-client-impact-assessment-v0.1.json
data/replay/replay-dataset-evidence-bridge-v0.1.json
```

---

# 7. Implemented Output

Builder:

```text
artifacts/api-server/src/scripts/build-business-intelligence-package-v0.1.ts
```

Output:

```text
artifacts/api-server/data/intelligence/business-intelligence-package-v0.1.json
```

The implementation is additive and composition-only.

---

# 8. Canonical Package Structure

The v0.1 package contains:

```text
version
generated_at
purpose
doctrine
governance
health
packages
intelligence_sections
knowledge_gaps
lineage
```

## 8.1 Governance

The package records:

```text
safety_mode
production_write_allowed
human_review_required
source_packages_remain_canonical
```

Current safety mode:

```text
COMPOSITION_ONLY
```

---

## 8.2 Health

Health reports:

* total package count;
* available package count;
* missing required packages;
* missing optional packages;
* stale packages;
* overall package status.

Supported overall states:

```text
healthy
degraded
incomplete
```

Version 0.1 generated successfully with all twelve packages available.

Its first observed status was:

```text
degraded
```

because two source packages exceeded the current freshness threshold.

This is correct and intentional.

The package must report observed health honestly rather than force a green state.

---

## 8.3 Intelligence Sections

The first package exposes composed summaries for:

```text
datasets
signals
macro
replay
existing article pipeline
```

These summaries provide a compact view while preserving links to their specialist source packages.

---

## 8.4 Knowledge Gaps

The package records factual gaps, including:

* missing required packages;
* missing optional packages;
* stale packages;
* known evidence gaps;
* limitations of the current broad package scope.

The current package explicitly reports that:

```text
Replay dataset evidence coverage remains limited.
```

It also records that v0.1 is broad and not yet scoped to one business question or one client profile.

These are governed observations, not failures.

---

## 8.5 Lineage

Each direct source package records:

```text
key
source_path
version
generated_at
status
```

The package also records:

```text
composer_script
output_path
direct_source_packages
```

This creates direct lineage by construction.

Full lineage can later be reconstructed by traversing the direct inputs recorded by each specialist package.

---

# 9. First Observed Intelligence State

The first generated package reported:

```text
12 source packages available
0 required packages missing
0 optional packages missing
2 stale packages
```

It also surfaced:

```text
Verified datasets:
14 registered
7 verified

Dataset audit:
4 pass
3 questionable
7 fail

Replay:
25 historical cases
3 replay records
7 scenarios
7 decision-support items

Replay confidence:
0.55
moderate

Client impact:
3 profiles
3 assessments
3 high-impact profiles

Replay dataset evidence coverage:
0
```

These values are evidence of the current state of the system.

They must not be interpreted as final platform maturity or prediction accuracy claims.

---

# 10. Relationship to the Article Pipeline

The existing Article Workbench already composes:

* candidates;
* opportunities;
* verified datasets;
* dataset coverage;
* readiness decisions;
* graph packages;
* source metadata;
* article protocols.

The existing Article Intelligence Package adds:

* relative performance;
* historical change;
* manufacturing share;
* latest momentum;
* sector ranking;
* trend classification;
* proxy disclosure.

These capabilities remain valuable.

H7.1 does not discard them.

The future direction is:

```text
Specialist Packages
↓
Business Intelligence Package
↓
Article Intelligence Package
↓
Article Products
```

The exact rewiring must be performed incrementally and must preserve the existing article pipeline until replacement behavior is proven.

---

# 11. Product Consumers

The Business Intelligence Package is intended to become the common upstream contract for:

* Article Intelligence;
* Morning Briefs;
* Client Portal;
* dashboards;
* intelligence exports;
* GPT-supported exploration;
* future APIs;
* future Brainy synthesis.

Products should progressively consume canonical intelligence packages instead of integrating directly with many specialist engines.

This transition must be incremental.

---

# 12. Brainy Relationship

Brainy is expected to become a strategic synthesis node.

Brainy should not be required to read hundreds of independent repository files directly.

The intended long-term flow is:

```text
Specialist Engines
↓
Specialist Packages
↓
Business Intelligence Package
↓
Brainy
↓
Governed Improvement Proposal
↓
Papa
```

Brainy remains behind Papa's governance boundary.

Brainy may inspect the composed state, identify gaps and recommend improvements.

Brainy does not directly mutate production systems.

---

# 13. Future Evolution

Potential future composition layers include:

```text
Business Intelligence Package
↓
Topic Intelligence Package
↓
Client Intelligence Package
↓
Product Views
```

These remain future architecture.

They must not be treated as implemented until repository evidence exists.

Possible future improvements include:

* topic-specific package selection;
* client-profile overlays;
* conflict detection between specialist packages;
* confidence roll-ups;
* package completeness scoring;
* uncertainty decomposition;
* metric contribution assessment;
* source-value evaluation;
* evidence acquisition queues;
* refresh orchestration.

Each future capability must preserve:

* specialist ownership;
* traceability;
* package versioning;
* direct lineage;
* governance gates;
* backward compatibility where required.

---

# 14. Non-Goals

H7.1 does not:

* replace the Intelligence Warehouse;
* replace source packages;
* create a new raw-data store;
* rewrite the article pipeline;
* perform GPT reasoning;
* create autonomous recommendations;
* provide production client advice;
* certify truth;
* claim prediction accuracy;
* remove human review.

---

# 15. Architectural Principle

> Presentation is not the system of record. Governed intelligence is the system of record.

Articles, dashboards, briefs, portals and conversations are product views over governed intelligence.

The Business Intelligence Package is the first implemented composition contract supporting that principle.

---

# 16. Strategic Conclusion

H6 established:

```text
Repository awareness
```

H7.1 establishes:

```text
Knowledge composition
```

The platform has moved from:

```text
A collection of intelligence engines
```

towards:

```text
A governed intelligence system
```

The immediate next phase should focus on connecting downstream consumers to the Business Intelligence Package while preserving the existing pipelines until the new composition path is proven.
