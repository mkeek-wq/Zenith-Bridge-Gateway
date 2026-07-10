# Replay Runtime Architecture v0.1

**Date:** 10 Jul 2026
**Status:** Discovery → Architecture
**Phase:** H6.1
**Purpose:** Define the runtime structure of the Replay Intelligence Ecosystem and distinguish its specialized execution, learning, validation, governance and product-surfacing runtimes.

---

# 1. Mission

Replay is the historical reasoning ecosystem of ZNBW.

It transforms historical observations, evidence and outcomes into:

* historical analogues;
* explainable reasoning;
* confidence assessments;
* scenario ranges;
* decision support;
* organizational experience.

Replay is not a single engine.

Replay is a distributed subsystem composed of specialized runtimes, engines, packages and governance controls.

---

# 2. Architectural Discovery

The existing Replay System Map describes the functional intelligence flow:

```text
Macro Intelligence
        │
        ▼
Replay Support
        │
        ▼
Historical Attribution
        │
        ▼
Evidence Collection
        │
        ▼
Evidence Validation
        │
        ▼
Similarity Assessment
        │
        ▼
Forecast Envelope
        │
        ▼
Confidence
        │
        ▼
Decision Support
        │
        ▼
Replay Dashboard
        │
        ▼
Client Intelligence
```

Repository discovery shows that this functional flow is implemented through several specialized runtimes rather than one canonical master runtime.

The Replay architecture must therefore be understood from two complementary views:

1. **Functional intelligence flow**
   How historical evidence becomes explainable decision support.

2. **Runtime architecture**
   How execution, learning, validation, governance and product surfacing are separated.

---

# 3. Replay Runtime Model

```text
                         Replay Intelligence Ecosystem
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
 Historical Execution          Learning Runtime          Governance Runtime
      Runtime                         │                           │
          │                           ▼                           ▼
          │                  Experience Accumulation       Proposal Registry
          │                           │                           │
          │                           ▼                           ▼
          │                  Brainy Diagnosis             Papa Approval
          │                           │                           │
          │                           ▼                           ▼
          │                  Improvement Proposals        Shadow Runtime
          │                                                       │
          │                                                       ▼
          │                                               Audit Evidence
          │
          └───────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
                              Summary and Package Layer
                                      │
                                      ▼
                              Papa Replay Dashboard
                                      │
                                      ▼
                           Intelligence Warehouse
                                      │
                                      ▼
                              Client Intelligence
```

---

# 4. Runtime Families

## 4.1 Historical Execution Runtime

### Purpose

Execute bounded Replay workloads against historical cases and evidence.

### Current forms

* single-case Replay;
* batch Replay;
* fleet Replay;
* dry-run Replay;
* historical attribution;
* similarity assessment.

### Current evidence

The fleet dry-run executor:

* reads a Replay fleet manifest;
* reads Replay readiness state;
* loads approved Replay inputs;
* replays historical records;
* infers candidate mechanisms;
* creates case-level execution outputs;
* prohibits production mutation.

### Representative source

```text
artifacts/api-server/src/scripts/build-replay-fleet-dry-run-executor-v0.1.ts
```

### Representative output

```text
artifacts/api-server/data/replay/fleet-runs/replay-fleet-dry-run-executor-v0.1.json
```

### Governance characteristics

* dry-run only;
* no production writes;
* no lifecycle mutation;
* no validation mutation;
* output requires evaluation.

### Architectural role

The Historical Execution Runtime performs Replay work.

It does not approve findings and does not promote changes into production.

---

## 4.2 Learning Runtime

### Purpose

Measure Replay performance and convert observed outcomes into organizational experience.

### Current execution sequence

```text
Replay Plan
        │
        ▼
Plan Scoring
        │
        ▼
Similarity Predictions
        │
        ▼
Ground Truth
        │
        ▼
Prediction Scoring
        │
        ▼
Experience Metrics
        │
        ▼
Experience Registry
```

### Representative source

```text
artifacts/api-server/src/scripts/run-replay-cycle.ts
```

### Representative outputs

```text
artifacts/api-server/data/replay-sandbox/replay-plan-*.json
artifacts/api-server/data/replay-sandbox/predictions/
artifacts/api-server/data/replay-sandbox/scores/
artifacts/api-server/data/replay-sandbox/accuracy/
artifacts/api-server/data/replay-sandbox/experience-metrics/
artifacts/api-server/data/intelligence/experience-registry-v0.1.json
```

### Architectural role

The Learning Runtime improves Replay through measured experience.

It is not the canonical client Replay execution runtime.

Its primary consumers are organizational learning, Brainy analysis and improvement governance.

---

## 4.3 Replay Support Runtime

### Purpose

Translate evidence coverage, historical support, contradictions and confidence into bounded Replay support assessments.

### Current inputs

```text
data/intelligence/replay-mechanism-evidence-matrix-v0.1.json
data/intelligence/mechanism-confidence-engine-v0.2.json
```

### Representative source

```text
artifacts/api-server/src/scripts/build-replay-support-engine-v0.2.ts
```

### Representative output

```text
artifacts/api-server/data/intelligence/replay-support-engine-v0.2.json
```

### Doctrine

* Replay support is probabilistic, not deterministic.
* Replay support is not validation.
* Historical similarity must never override current evidence.
* Past results do not guarantee future outcomes.
* Human review is required for lifecycle changes.

### Architectural role

Replay Support is a derived intelligence layer.

It informs reasoning and review but does not execute cases or approve mechanisms.

---

## 4.4 Improvement Runtime

### Purpose

Observe Replay maturity and recommend the next safe organizational improvement mode.

### Current inputs

* Replay confidence;
* Brainy diagnosis;
* improvement proposals;
* governance history;
* improvement reports.

### Representative source

```text
artifacts/api-server/src/scripts/build-replay-self-improvement-orchestrator-v0.1.ts
```

### Representative output

```text
artifacts/api-server/data/replay/replay-self-improvement-orchestrator-v0.1.json
```

### Current recommendation modes

* breadth acquisition;
* targeted enrichment;
* controlled depth improvement.

### Governance characteristics

* safe partial execution;
* no production write authority;
* Papa approval required for production impact.

### Architectural role

The Improvement Runtime recommends how Replay should evolve.

It does not autonomously modify the production Replay system.

---

## 4.5 Governance Runtime

### Purpose

Control the progression of Replay improvements from proposal to validation and possible promotion.

### Governance sequence

```text
Brainy Diagnosis
        │
        ▼
Improvement Proposal
        │
        ▼
Papa Validation Approval
        │
        ▼
Shadow Execution
        │
        ▼
Audit Evidence
        │
        ▼
Papa GO / NO-GO
        │
        ▼
Approved Implementation
```

### Responsibilities

* proposal registration;
* approval-state management;
* audit history;
* promotion control;
* rejection history;
* constitutional enforcement.

### Architectural role

The Governance Runtime controls authority.

Intelligence engines may recommend.

Shadow may measure.

Papa decides.

---

## 4.6 Shadow Runtime

### Purpose

Independently validate approved Replay proposals without modifying production state.

### Representative source

```text
artifacts/api-server/src/scripts/build-replay-shadow-execution-v0.1.ts
```

### Representative output

```text
artifacts/api-server/data/replay/replay-shadow-execution-report-v0.1.json
```

### Current behavior

The Shadow Runtime:

* reads approved proposals;
* selects proposals not yet implemented;
* simulates intended actions;
* produces validation evidence;
* recommends progression to audit;
* prohibits production promotion.

### Governance characteristics

* dry-run only;
* no production write;
* audit required;
* no autonomous promotion.

### Architectural role

Shadow measures whether an approved design behaves as expected.

Shadow does not approve the design and does not implement it.

---

## 4.7 Dashboard Runtime

### Purpose

Convert complex Replay subsystem outputs into a bounded governance and product-facing package.

### Current inputs

```text
data/replay/replay-quality-summary-v0.1.json
data/replay/replay-analogue-summary-v0.1.json
data/replay/replay-explanation-summary-v0.1.json
```

### Representative source

```text
artifacts/api-server/src/scripts/build-papa-replay-dashboard-package-v0.1.ts
```

### Representative output

```text
artifacts/api-server/data/replay/papa-replay-dashboard-package-v0.1.json
```

### Current package contents

* Replay status;
* historical case count;
* mechanism coverage;
* thin and very thin mechanisms;
* taxonomy awareness;
* Replay record count;
* top analogues;
* explanations;
* next target.

### Architectural role

The Dashboard Runtime shields Papa and future clients from engine-level complexity.

Papa should consume governed summaries and packages rather than individual Replay engines.

---

# 5. Package Layer

Replay runtimes should communicate through explicit packages rather than hidden script coupling.

The emerging package families include:

* case registries;
* evidence matrices;
* readiness packages;
* fleet manifests;
* fleet execution reports;
* similarity outputs;
* confidence outputs;
* calibration outputs;
* forecast envelopes;
* decision-support packages;
* proposal registries;
* Shadow reports;
* audit summaries;
* experience registries;
* quality summaries;
* analogue summaries;
* explanation summaries;
* Papa dashboard packages.

The package layer is the architectural contract between specialized runtimes.

---

# 6. Control and Authority Boundaries

| Runtime              | May analyse | May execute dry run |     May recommend | May approve |        May modify production |
| -------------------- | ----------: | ------------------: | ----------------: | ----------: | ---------------------------: |
| Historical Execution |         Yes |                 Yes |           Limited |          No |                           No |
| Learning             |         Yes |                 Yes |               Yes |          No |                           No |
| Replay Support       |         Yes |                  No |               Yes |          No |                           No |
| Improvement          |         Yes |                  No |               Yes |          No |                           No |
| Shadow               |         Yes |                 Yes | GO-for-audit only |          No |                           No |
| Governance           |         Yes |                  No |               Yes |   Papa only |                   Controlled |
| Dashboard            |         Yes |                  No |                No |          No |                           No |
| Coding Smurf         |          No |                  No |                No |          No | Approved implementation only |

---

# 7. Replay Control Plane

Replay currently has no confirmed single master orchestrator.

The control plane is distributed across:

* execution runners;
* fleet manifests;
* readiness gates;
* proposal registries;
* Papa approval;
* Shadow validation;
* audit packages;
* improvement recommendations;
* dashboard packages.

This is not necessarily an architectural defect.

The absence of a universal orchestrator may preserve separation of responsibilities and reduce uncontrolled coupling.

A future coordination layer should orchestrate specialized runtimes without collapsing their governance boundaries.

---

# 8. Canonicality Discovery

The repository currently contains several Replay execution styles:

1. Replay sandbox learning cycle;
2. single-case Replay;
3. batch Replay;
4. fleet dry-run Replay;
5. Shadow proposal execution;
6. self-improvement orchestration;
7. dashboard package generation.

No single runtime should be declared canonical for all Replay purposes.

Canonicality must instead be defined per runtime family.

Examples:

* canonical learning runtime;
* canonical fleet runtime;
* canonical Shadow runtime;
* canonical governance package;
* canonical dashboard package.

---

# 9. Intelligence Warehouse Integration

The Intelligence Warehouse should surface Replay as an ecosystem of runtimes.

Recommended Warehouse capability groups:

```text
Replay
├── Historical Execution
├── Learning
├── Support
├── Confidence and Calibration
├── Forecast
├── Decision Support
├── Improvement
├── Governance
├── Shadow Validation
└── Dashboard Packages
```

Each runtime should eventually expose:

* runtime status;
* canonical source;
* inputs;
* latest output;
* output freshness;
* maturity;
* governance mode;
* blockers;
* downstream consumers.

---

# 10. First Wiring Slice

The first wiring slice should be bounded, visible and reversible.

Recommended first slice:

```text
Replay Summary Packages
        │
        ▼
Papa Replay Dashboard Package
        │
        ▼
Intelligence Warehouse Registry
        │
        ▼
Replay Ecosystem Surface
```

Initial source package:

```text
artifacts/api-server/data/replay/papa-replay-dashboard-package-v0.1.json
```

Reasons:

* already exists;
* consumes governed summary outputs;
* does not mutate production data;
* represents several Replay capabilities;
* is understandable to Papa and humans;
* provides an immediate visible surface;
* does not require rebuilding Replay;
* creates a natural bridge to future client intelligence.

The first integration should surface the package and its health before attempting to orchestrate the entire Replay ecosystem.

---

# 11. H6.1 Direction

H6.1 should proceed through:

```text
Runtime Discovery
        │
        ▼
Runtime Classification
        │
        ▼
Canonical Package Identification
        │
        ▼
Warehouse Integration
        │
        ▼
Observation
        │
        ▼
Architecture Refinement
```

No universal Replay orchestrator should be created until existing runtime dependencies and package flows have been fully observed.

---

# 12. Replay Runtime Doctrine

* Replay is an ecosystem, not a single engine.
* Runtime boundaries should follow demonstrated responsibilities.
* Execution, learning, validation, governance and surfacing must remain separated.
* Intelligence may recommend but may not grant itself authority.
* Shadow measures but does not approve.
* Papa governs.
* Coding Smurf implements only approved changes.
* Packages are contracts between runtimes.
* Surface existing intelligence before rebuilding it.
* Autonomy must be earned through reliability, validation and experience.
* Replay must remain explainable, evidence-based and auditable.

---

# 13. Relationship to Existing Architecture

This document complements:

```text
governance/02-architecture/replay/REPLAY_SYSTEM_MAP_v0.1.md
```

The Replay System Map describes the functional intelligence flow.

This Replay Runtime Architecture describes the execution and governance structure that supports that flow.

Both views are required to understand Replay correctly.

---

# 14. Living Architecture

This document should evolve as Replay runtimes become wired into the Intelligence Warehouse.

Future updates should be based on observed:

* package production;
* package consumption;
* execution history;
* runtime health;
* dependency stability;
* Shadow outcomes;
* governance decisions;
* product usage.

Organizational boundaries should emerge from stable runtime dependencies rather than being imposed prematurely.
