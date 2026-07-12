# Intelligence Orchestration Architecture v0.1

**Original Date:** 06 Jul 2026
**Updated:** 12 Jul 2026
**Status:** Implemented Architecture
**Purpose:** Define how existing intelligence engines are connected, composed, surfaced and ultimately productized.

---

# 1. Problem Statement

ZNBW contains a large number of specialist intelligence engines.

The primary challenge is no longer engine creation.

The primary challenge is:

```text
Connect
Compose
Orchestrate
Surface
Productize
```

The platform must preserve specialist ownership while allowing downstream products to consume one coherent and governed intelligence view.

---

# 2. Implemented Target Architecture

```text
Raw Data
↓
Dataset Governance
↓
Specialist Intelligence Engines
↓
Specialist Intelligence Packages
↓
Business Intelligence Package
↓
Product Consumers
```

The Business Intelligence Package is the first implemented canonical composition layer.

It does not replace specialist packages.

It composes selected summaries, metadata, health information and lineage from those packages.

---

# 3. Intelligence Layers

## Layer 1 – Data Foundation

Responsibilities:

* source acquisition;
* parsed datasets;
* verified datasets;
* quality checks;
* audits;
* approvals;
* lineage.

Outputs:

```text
Governed dataset packages
```

---

## Layer 2 – Signal and Macro Intelligence

Responsibilities:

* driver observatory;
* signal watchlists;
* macro registry;
* macro transmission;
* macro attribution;
* concentration;
* diversity;
* domain relevance.

Outputs:

```text
Signal and macro intelligence packages
```

---

## Layer 3 – Replay Intelligence

Responsibilities:

* historical analogues;
* historical case registries;
* scenario libraries;
* experience registries;
* mechanism evidence;
* case construction;
* outcome attribution;
* Replay confidence;
* Replay quality;
* Replay decision support.

Outputs:

```text
Replay intelligence packages
```

---

## Layer 4 – Forecast Intelligence

Responsibilities:

* forecast envelopes;
* scenario ranges;
* confidence;
* historian snapshots;
* forecast comparison;
* forecast validation.

Outputs:

```text
Forecast packages
```

---

## Layer 5 – Decision Intelligence

Responsibilities:

* recommendations;
* prioritization;
* risks;
* opportunities;
* actions;
* client impact;
* uncertainty disclosure;
* human-review cautions.

Outputs:

```text
Decision-support packages
```

---

## Layer 6 – Composition Intelligence

Responsibilities:

```text
Read
Validate
Classify health
Select summaries
Record lineage
Compose
```

Implemented output:

```text
data/intelligence/business-intelligence-package-v0.1.json
```

Implemented builder:

```text
src/scripts/build-business-intelligence-package-v0.1.ts
```

The composition layer creates no new intelligence in v0.1.

It preserves specialist package ownership.

---

## Layer 7 – Product Consumers

Internal consumers:

* Intelligence Warehouse UI;
* Replay Dashboard;
* Forecast Dashboard;
* Decision Dashboard;
* Macro Dashboard;
* future Brainy synthesis.

External consumers:

* Article Intelligence;
* Client Portal;
* Morning Briefs;
* reports;
* intelligence exports;
* GPT-supported exploration;
* future APIs.

---

# 4. Business Intelligence Package

The earlier proposed Intelligence Orchestration Package has now been implemented as:

```text
Business Intelligence Package v0.1
```

Purpose:

```text
Compose
Normalize selected metadata
Assess health
Expose lineage
Surface knowledge gaps
Provide one downstream contract
```

Current composed areas:

```text
datasets
signals
macro
replay
existing article pipeline
health
knowledge gaps
lineage
```

The package currently consumes twelve specialist packages.

It records:

* source path;
* source version;
* source generation time;
* availability;
* freshness;
* selected summary;
* direct source files;
* composition health.

---

# 5. Composition Doctrine

## 5.1 Source Ownership

Specialist packages remain canonical.

The composition layer must not become a duplicate warehouse.

## 5.2 Additive Integration

Existing pipelines remain operational while new consumers are connected incrementally.

## 5.3 No Silent Failure

Missing, invalid or stale packages must be reported.

They must not silently become empty intelligence.

## 5.4 Lineage by Construction

Every composed package records its direct inputs.

The platform reconstructs full lineage through those direct relationships.

## 5.5 Honest Health

The package may report:

```text
healthy
degraded
incomplete
```

A degraded result is acceptable when it accurately represents stale or limited intelligence.

---

# 6. Existing Article Architecture

The Article Workbench and Article Intelligence Package were developed before H7.1.

They already contain reusable capabilities, including:

* opportunity selection;
* candidate-to-dataset mapping;
* dataset coverage;
* readiness gates;
* verified dataset summaries;
* graph-ready data;
* relative performance;
* sector ranking;
* trend classification;
* proxy disclosure;
* source metadata.

These packages remain operational and reusable.

Current state:

```text
Article-specific composition
```

Future direction:

```text
Business Intelligence Package
↓
Article Intelligence Package
↓
Article Products
```

This transition must preserve the existing article flow until the new path is validated.

---

# 7. Intelligence Warehouse Relationship

The Intelligence Warehouse inventories specialist engines and packages.

The Business Intelligence Package composes selected outputs from those packages.

```text
Intelligence Warehouse

Answers:
What exists?

Business Intelligence Package

Answers:
What does the current composed system know?
```

The two layers are complementary.

The Business Intelligence Package does not replace the Intelligence Warehouse.

---

# 8. Recommended Sequencing

## Completed

```text
Inventory
↓
Classify
↓
Dependency discovery
↓
Replay package restoration
↓
Business Intelligence Package v0.1
```

## Immediate Next Phase

```text
Refresh selected stale upstream packages
↓
Rebuild Business Intelligence Package
↓
Observe health changes
↓
Connect first downstream consumer
```

## Later

```text
Topic Intelligence Packages
↓
Morning Briefs
↓
Client Portal
↓
Client-specific intelligence
```

Future layers must be introduced only when repository evidence supports them.

---

# 9. Governance Boundary

The composition layer is governed by:

```text
COMPOSITION_ONLY
production_write_allowed = false
human_review_required = true
source_packages_remain_canonical = true
```

The Business Intelligence Package is not automatically approved for client-facing advice.

Decision-support outputs remain subject to Papa and human review.

---

# 10. Strategic Conclusion

The platform has progressed from:

```text
The engines already exist.
```

to:

```text
The packages can now be composed.
```

The next platform phase is:

```text
Refresh
↓
Compose
↓
Validate
↓
Connect Consumers
↓
Productize
```

H6 taught the repository to understand itself.

H7 begins teaching the repository to understand what it knows.
