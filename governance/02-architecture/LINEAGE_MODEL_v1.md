# LINEAGE_MODEL_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Define the canonical source-to-publication lineage model for the ZNBW platform.

---

# Background

CODEX_AUDIT_A-002 identified that lineage exists throughout the platform but is not yet governed through a single canonical model.

Multiple lineage-related components already exist, including:

- Evidence Lineage Engine
- Evidence Assessment Engine
- Counter Evidence Engine
- Confidence Framework
- Confidence Registry
- Publication Readiness Gates
- Production Promotion Gates
- Workbench Packages
- Graph Packages
- CMS Packages

This document establishes the authoritative lineage chain linking source material to published intelligence outputs.

---

# Core Principle

Every published intelligence output must be traceable upstream through a documented lineage chain.

No publication should exist without a recoverable path to its supporting evidence.

Lineage supports:

- Transparency
- Auditability
- Confidence assessment
- Human review
- Governance controls
- Future client transparency capabilities

---

# Canonical Lineage Chain

Source Material
↓
Document Registry
↓
Dataset
↓
Signal
↓
Evidence
↓
Counter Evidence
↓
Mechanism
↓
Confidence Assessment
↓
Case
↓
Intelligence Package
↓
Workbench Package
↓
Graph Package
↓
CMS Package
↓
Publication

---

# Layer Definitions

## Source Material

Original external source.

Examples:

- Government releases
- Statistical agencies
- Corporate reports
- Official publications
- Research papers

---

## Document Registry

Tracks discovered and accepted source documents.

Purpose:

- Source governance
- Source verification
- Source archival tracking

---

## Dataset

Structured representation of source information.

Purpose:

- Data standardization
- Controlled ingestion
- Reuse across intelligence workflows

---

## Signal

Detected observation, anomaly, trend or change identified from a dataset.

Purpose:

- Early warning
- Pattern detection
- Case generation
- Evidence discovery

Signals are not conclusions.

Signals represent candidate observations requiring evidence assessment.

---

## Evidence

Specific observations extracted from datasets.

Purpose:

- Support findings
- Support mechanisms
- Support intelligence conclusions

Evidence remains primary.

---

## Counter Evidence

Evidence that challenges, weakens or contradicts a conclusion.

Purpose:

- Falsification
- Challenge testing
- Confidence calibration

Counter evidence must be preserved.

---

## Mechanism

Proposed explanation of observed behavior.

Examples:

- Demand surge
- Supply constraint
- Policy intervention
- Capital expenditure cycle

Mechanisms interpret evidence but do not replace evidence.

---

## Confidence Assessment

Confidence assigned after evidence review.

Inputs may include:

- Evidence quality
- Evidence quantity
- Source quality
- Contradictory evidence
- Historical experience
- Similarity assessment

Confidence must never override evidence.

---

## Case

Governed intelligence case.

Purpose:

- Organize evidence
- Organize mechanisms
- Organize conclusions

Cases become reusable intelligence assets.

---

## Intelligence Package

Structured analytical output generated from cases.

Purpose:

- Intelligence synthesis
- Human review
- Workbench preparation

---

## Workbench Package

Analyst-facing review layer.

Purpose:

- Transparency
- Evidence inspection
- Confidence inspection
- Human validation

---

## Graph Package

Governed visualization package.

Purpose:

- Controlled graph generation
- Publication preparation

---

## CMS Package

Publication-ready content package.

Purpose:

- Editorial review
- Publication preparation

---

## Publication

Final public output.

Examples:

- Website article
- Intelligence brief
- Future client output

Published content remains linked to upstream lineage.

---

# Governance Rules

1. Source lineage must be preserved.

2. Evidence lineage must be preserved.

3. Counter evidence must not be discarded solely because it contradicts a preferred interpretation.

4. Confidence scores must remain traceable to supporting evidence.

5. Mechanisms may interpret evidence but may not replace evidence.

6. Historical similarity may adjust confidence but may not override primary evidence assessment.

7. Human review remains required before production publication.

8. Publication does not break lineage.

---

# Current Implementation Status

Implemented:

✓ Evidence Lineage Engine

✓ Evidence Assessment Engine

✓ Counter Evidence Engine

✓ Confidence Framework

✓ Publication Readiness Gates

✓ Production Promotion Gates

✓ Workbench Packages

✓ Graph Packages

✓ CMS Packages

Partially Implemented:

△ Transparency Panel

△ Traceability Reporting

△ Client Transparency Views

Future:

○ Decision Support Replay Traceability

○ Client Transparency Layer

○ Publication Traceability Dashboard

---

# Audit Remediation

Related Audit:

CODEX_AUDIT_A-002

Finding:

Lineage exists throughout the platform but lacked a formally governed canonical model.

Remediation:

LINEAGE_MODEL_v1 establishes the authoritative source-to-publication lineage chain.

---

# Related Documents

SYSTEM_MAP_v1

ASSET_INVENTORY_v1

ARCHITECTURE_OVERVIEW_v1

ARCHITECTURE_PRINCIPLES_v1

INTELLIGENCE_CENTER_v1

SMURF_ENGINE_v1

CODEX_AUDIT_PLAN_v1
