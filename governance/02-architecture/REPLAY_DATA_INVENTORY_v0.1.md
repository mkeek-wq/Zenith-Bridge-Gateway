# Replay Data Inventory v0.1

Date: 2026-06-30  
Phase: F2 - Replay Data Inventory  
Status: Draft v0.1

## Purpose

Map Replay scripts to their inputs, outputs, dependencies, and likely execution order.

## Current Repository State

Branch:

```text
phase-f-replay-inventory

## Confirmed Dependencies (Early Findings)

### Historical Registry

Inputs:
- replay-historical-case-wave-*.json

Outputs:
- replay-historical-case-registry-v0.1.json

Produced by:
- merge-replay-historical-cases-v0.1.ts

---

### Mechanism Coverage

Inputs:
- replay-historical-case-registry-v0.1.json

Outputs:
- replay-mechanism-coverage-v0.1.json

Produced by:
- build-replay-mechanism-coverage-v0.1.ts

---

### Taxonomy Coverage

Inputs:
- replay-historical-case-registry-v0.1.json
- replay-mechanism-taxonomy-v0.1.json

Outputs:
- replay-mechanism-taxonomy-coverage-v0.1.json

Produced by:
- build-replay-mechanism-taxonomy-coverage-v0.1.ts

---

### Similarity Engine

Inputs:
- replay-historical-case-registry-v0.1.json
- replay input dataset (TBD)

Outputs:
- data/replay/similarity/*

Produced by:
- run-replay-similarity-engine-v0.2.ts

---

### Analogue Summary

Inputs:
- data/replay/similarity/*

Outputs:
- replay-analogue-summary-v0.1.json

Produced by:
- build-replay-analogue-summary-v0.1.ts

---

### Forecast

Inputs:
- papa-replay-dashboard-package-v0.1.json

Outputs:
- replay-forecast-envelope-v0.1.json

Produced by:
- build-replay-forecast-envelope-v0.1.ts

---

### Confidence

Inputs:
- replay-quality-summary-v0.1.json
- papa-replay-dashboard-package-v0.1.json
- replay-forecast-envelope-v0.1.json

Outputs:
- replay-confidence-engine-v0.1.json

Produced by:
- build-replay-confidence-engine-v0.1.ts

## Confirmed Dependencies (Early Findings)

### Historical Registry

Inputs:
- replay-historical-case-wave-*.json

Outputs:
- replay-historical-case-registry-v0.1.json

Produced by:
- merge-replay-historical-cases-v0.1.ts

### Mechanism Coverage

Inputs:
- replay-historical-case-registry-v0.1.json

Outputs:
- replay-mechanism-coverage-v0.1.json

Produced by:
- build-replay-mechanism-coverage-v0.1.ts

### Taxonomy Coverage

Inputs:
- replay-historical-case-registry-v0.1.json
- replay-mechanism-taxonomy-v0.1.json

Outputs:
- replay-mechanism-taxonomy-coverage-v0.1.json

Produced by:
- build-replay-mechanism-taxonomy-coverage-v0.1.ts

### Similarity Engine

Inputs:
- replay-historical-case-registry-v0.1.json
- replay-mechanism-taxonomy-v0.1.json

Outputs:
- data/replay/similarity/*

Produced by:
- run-replay-similarity-engine-v0.2.ts

## Confirmed Middle Pipeline

The middle Replay pipeline is now confirmed from source references.

```text
run-replay-similarity-engine-v0.2.ts
↓
data/replay/similarity/*
↓
build-replay-analogue-summary-v0.1.ts
↓
data/replay/replay-analogue-summary-v0.1.json
↓
build-papa-replay-dashboard-package-v0.1.ts
↓
data/replay/papa-replay-dashboard-package-v0.1.json
↓
build-replay-forecast-envelope-v0.1.ts
↓
data/replay/replay-forecast-envelope-v0.1.json
↓
build-replay-confidence-engine-v0.1.ts
↓
data/replay/replay-confidence-engine-v0.1.json

## Confirmed Governance Pipeline

The Replay governance pipeline is confirmed from source references.

```text
replay-improvement-proposal-engine-v0.1.ts
↓
data/replay/replay-improvement-proposals-v0.1.json
↓
replay-proposal-registry-v0.1.ts
↓
data/replay/replay-proposal-registry-v0.1.json
↓
├─ approve-replay-proposal-v0.1.ts
├─ reject-replay-proposal-v0.1.ts
├─ build-replay-proposal-dashboard-v0.1.ts
├─ build-replay-shadow-execution-v0.1.ts
├─ promote-replay-proposal-v0.1.ts
└─ build-replay-governance-history-v0.1.ts
