# 📋 ZNBW HANDOVER – Phase H4 Intelligence Warehouse & Orchestration
**Date:** 06 Jul 2026
**Branch:** recovery/june25-known-good
**Status:** Discovery complete. Architecture phase.

---

# Executive Summary

Major discovery:

The repository already contains the majority of the intelligence engines required for an explainable decision-support platform.

The next phase is:

```text
Inventory
Classify
Connect
Surface
Productize
```

The primary gap is:

```text
Orchestration
```

not engine creation.

---

# Repository Archaeology Findings

## Runtime

- API runtime divergence understood.
- Production uses TypeScript runtime.
- API builds successfully.
- PM2 healthy.

Commits:

```text
e1a9f18  Document API runtime divergence
811a998  Restore TypeScript API runtime architecture
```

---

# Intelligence Warehouse Discovery

Created:

```text
governance/02-architecture/intelligence-warehouse/
```

Documents:

- ENGINE_REGISTRY_v0.1.md
- PACKAGE_REGISTRY_v0.1.md
- DEPENDENCY_MAP_v0.1.md
- PRODUCT_SURFACE_REGISTRY_v0.1.md
- ORPHAN_ENGINE_REGISTRY_v0.1.md
- ORCHESTRATION_ROADMAP_v0.1.md
- CLIENT_PRODUCT_MAPPING_v0.1.md
- PIPELINE_DISCOVERY_v0.1.md
- INTELLIGENCE_ORCHESTRATION_PACKAGE_v0.1.md

Inventories:

- build-script-inventory.txt
- intelligence-package-inventory.txt
- package-consumption-inventory.txt
- all-build-engines.txt
- invoked-engines.txt
- script-reference-inventory.txt

Commits:

```text
4745578  Document intelligence warehouse discovery
1bbc898  Document intelligence orchestration pipeline discovery
105a772  Design intelligence orchestration package
```

Tags:

```text
zenith-intelligence-warehouse-discovery-v0.1
zenith-orchestration-discovery-v0.1
zenith-intelligence-orchestration-package-v0.1
```

---

# Key Metrics

```text
Build engine candidates: 311+
Intelligence packages: 172
Package references in source: 521
Unique package paths consumed: 143
```

Conclusion:

```text
The repository is not a graveyard.

Most packages participate in producer/consumer chains.
```

---

# Architectural Discovery

Current:

```text
Data
↓
Independent Engines
↓
Independent Packages
↓
Partial Article UI
```

Target:

```text
Data
↓
Macro
↓
Replay
↓
Forecast
↓
Decision
↓
Intelligence Orchestration Package
↓
Articles
Dashboards
Client Portal
```

---

# Hidden Engines

Confirmed existing but not surfaced:

- Replay Support Engine
- Replay Historian
- Replay Experience Accumulator
- Replay Mechanism Evidence Matrix
- Replay Forecast Envelope
- Replay Confidence Engine
- Replay Analogue Summary
- Decision Support Engine
- Outcome Attribution Engine
- Mechanism Promotion Engine
- Macro Attribution Engine
- Driver Diversity Engine
- Driver Concentration Engine

---

# Hypothesis

```text
70-80% of engines already exist.
20-30% of work is orchestration and surfacing.
```

---

# Immediate Next Step

Create:

```text
ENGINE_MATURITY_MATRIX_v0.1.md
```

Classification:

- Prototype
- Operational
- Integrated
- Surfaced
- Productized
- Dormant
- Orphaned

Goal:

Determine exactly what already exists before building new functionality.

---

# Build Doctrine

No blind coding.

Every new build starts with:

1. Discovery
2. Inventory
3. Architecture
4. Decision
5. Implementation
6. Documentation
