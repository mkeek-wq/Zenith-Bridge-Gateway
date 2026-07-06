# Intelligence Orchestration Package v0.1

**Date:** 06 Jul 2026  
**Status:** Architecture Design  
**Purpose:** Connect independent intelligence engines into one explainable intelligence product.

---

# Executive Summary

Repository archaeology discovered that ZNBW already contains:

- Macro engines
- Replay engines
- Forecast engines
- Decision engines
- Publication engines
- Evidence engines
- Dataset governance engines

The primary missing capability is:

```text
Orchestration
```

The objective of this package is to become the single intelligence object that all product surfaces consume.

---

# Current State

```text
Data
↓
Independent Engines
↓
Independent Packages
↓
Partial Article UI
```

---

# Target State

```text
Data
↓
Macro Engine
↓
Replay Engine
↓
Forecast Engine
↓
Decision Engine
↓
Intelligence Orchestration Package
↓
Articles
Dashboards
Client Portal
API
Exports
```

---

# Proposed Package

```text
intelligence-orchestration-package-v0.1
```

---

# Source Packages

## Macro

```text
macro-attribution-engine-v0.2
driver-diversity-engine-v0.1
driver-concentration-engine-v0.1
```

## Replay

```text
replay-support-engine-v0.2
replay-experience-accumulator-v0.2
replay-mechanism-evidence-matrix-v0.1
```

## Forecast

```text
replay-forecast-envelope-v0.1
replay-confidence-engine-v0.1
replay-analogue-summary-v0.1
```

## Decision

```text
decision-support-engine-v0.2
outcome-attribution-engine-v0.1
case-construction-engine-v0.1
```

## Publication

```text
article-workbench-package-v0.2
article-intelligence-package-v0.1
cms-publication-package-v0.1
```

---

# Proposed Structure

```json
{
  "macro_context": {},
  "historical_analogues": {},
  "forecast_envelope": {},
  "decision_support": {},
  "business_implications": {},
  "recommended_actions": {},
  "confidence": {},
  "evidence": {},
  "source_packages": []
}
```

---

# Proposed Business Layer

```json
{
  "what_happened": {},
  "why_it_happened": {},
  "what_happened_before": {},
  "what_may_happen_next": {},
  "confidence": {},
  "recommended_actions": {}
}
```

---

# Product Consumers

## Editorial

- Article Workbench
- Intelligence Center
- CMS Publication

## Internal BI

- Replay Dashboard
- Forecast Dashboard
- Decision Dashboard
- Papa Smurf Dashboard

## Client

- Client Portal
- API Exports
- Excel Exports
- Intelligence Reports

---

# Explainability Principles

Every conclusion must be traceable.

```text
Recommendation
↓
Decision
↓
Forecast
↓
Historical Replay
↓
Evidence
↓
Dataset
↓
Source
```

No black box conclusions.

---

# Future Architecture

```text
Datasets
    ↓
Macro Engine
    ↓
Replay Engine
    ↓
Forecast Engine
    ↓
Decision Engine
    ↓
Intelligence Orchestration Package
    ↓
Article Intelligence
    ↓
Client Portal
```

---

# Phase H4 Objectives

1. Build orchestration package.
2. Surface Replay.
3. Surface Forecast.
4. Surface Decision Support.
5. Build Intelligence Warehouse UI.
6. Build Client Intelligence Portal.

---

# Long-Term Vision

```text
ZNBW becomes an explainable decision-support platform.

Articles become one output surface.

The orchestration package becomes the core intelligence product.
```
