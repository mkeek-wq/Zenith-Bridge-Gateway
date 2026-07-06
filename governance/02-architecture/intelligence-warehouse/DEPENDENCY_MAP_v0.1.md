# Intelligence Dependency Map v0.1

**Date:** 06 Jul 2026  
**Status:** Discovery map  
**Purpose:** Map producer → package → consumer relationships across ZNBW intelligence assets.

---

# 1. Summary

Initial discovery confirms that ZNBW contains multiple existing intelligence engines and package flows.

The missing layer is not engine creation.  
The missing layer is orchestration and surfacing.

---

# 2. Major Hubs

## Article Workbench Hub

```text
build-article-workbench-package-v0.2.ts
↓
data/intelligence/article-workbench-package-v0.2.json
↓
Article package / OpenAI package / Graph package / CMS publication / Admin UI

```

---

## Macro Attribution Hub

```text
build-macro-attribution-engine-v0.2.ts
↓
data/intelligence/macro-attribution-engine-v0.2.json
↓
Driver Diversity Engine
Macro Attribution Report
Concentration Engine
Decision Support
```

---

## Replay Hub

```text
build-replay-support-engine-v0.2.ts
↓
data/intelligence/replay-support-engine-v0.2.json
↓
Case Construction
Outcome Attribution
Mechanism Promotion
Forecasting
```

---

## Decision Hub

```text
build-decision-support-engine-v0.2.ts
↓
data/intelligence/decision-support-engine-v0.2.json
↓
Case Construction Engine
Article Workbench
BI Dashboard
Client Portal
```

---

## Forecast Hub

```text
build-replay-forecast-envelope-v0.1.ts
↓
data/replay/replay-forecast-envelope-v0.1.json
↓
Replay Confidence Engine
Historian Snapshot
Client Forecast Dashboard
```

```text
build-replay-analogue-summary-v0.1.ts
↓
data/replay/replay-analogue-summary-v0.1.json
↓
Papa Replay Dashboard
Client Intelligence Dashboard
```

---

# 3. Preliminary Conclusion

```text
The repository already contains:

- Article Intelligence Engine
- Macro Attribution Engine
- Replay Engine
- Decision Support Engine
- Forecast Engine
- CMS Publication Engine
- Evidence Engine
- Dataset Governance Engine

The missing capability is orchestration and product surfacing.
```

---

# 4. Validated Producer / Consumer Chains

**Validated:** 06 Jul 2026

The following producer/consumer relationships were confirmed through source inspection.

---

## Macro Attribution Chain

```text
build-macro-attribution-engine-v0.2.ts
↓
data/intelligence/macro-attribution-engine-v0.2.json
↓
build-driver-diversity-engine-v0.1.ts
build-macro-driver-concentration-engine-v0.1.ts
build-macro-attribution-report-v0.2.ts
```

Interpretation:

```text
Macro attribution is an integrated upstream intelligence layer.
It is consumed by diversity, concentration, and reporting engines.
```

---

## Replay Support Chain

```text
build-replay-support-engine-v0.2.ts
↓
data/intelligence/replay-support-engine-v0.2.json
↓
build-case-construction-engine-v0.1.ts
build-outcome-attribution-engine-v0.1.ts
build-mechanism-promotion-candidate-engine-v0.1.ts
```

Interpretation:

```text
Replay support is not dormant.
It feeds case construction, outcome attribution, and mechanism promotion.
```

---

## Decision Support Chain

```text
build-decision-support-engine-v0.2.ts
↓
data/intelligence/decision-support-engine-v0.2.json
↓
build-case-construction-engine-v0.1.ts
```

Interpretation:

```text
Decision support contributes to case construction.
It is integrated but not clearly surfaced as a product layer.
```

---

## Replay Forecast Chain

```text
build-replay-forecast-envelope-v0.1.ts
↓
data/replay/replay-forecast-envelope-v0.1.json
↓
build-replay-confidence-engine-v0.1.ts
build-replay-historian-snapshot-v0.1.ts
```

Interpretation:

```text
Replay forecast already feeds confidence and historian layers.
This confirms the presence of a forecast subsystem.
```

---

# 5. Dependency Validation Conclusion

```text
The intelligence warehouse contains real producer/consumer chains.

The main issue is not engine absence.

The main issue is:

- no central orchestration layer
- limited UI surfacing
- no client-facing product surface yet
```

---

# Next Discovery Tasks

1. Build complete engine registry.
2. Build package registry.
3. Map package dependencies.
4. Identify orphan engines.
5. Identify engines not surfaced in UI.
6. Design Intelligence Warehouse architecture.
