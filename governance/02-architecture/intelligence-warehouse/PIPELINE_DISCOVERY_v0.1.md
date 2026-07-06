# Pipeline Discovery v0.1

**Date:** 06 Jul 2026
**Status:** Discovery

---

# Replay Pipeline

run-replay-cycle.ts

Pipeline:

Replay Sandbox Plan
↓
Replay Scoring
↓
Prediction Similarity
↓
Ground Truth
↓
Prediction Scoring
↓
Experience Metrics
↓
Experience Registry

---

# Smurf Intelligence Pipeline

run-smurf-intelligence-cycle.ts

Pipeline:

Case Files
↓
Case Confidence
↓
Case State
↓
Investigation Queue
↓
Case History
↓
Case Fingerprints
↓
Case Similarity
↓
Investigation Hypotheses
↓
Hypothesis Enrichment
↓
Evidence Search
↓
Case Outcomes
↓
Historical Outcomes

---

# Article Pipeline

run-smurf-article-generator-v0.1.ts

Pipeline:

Candidate
↓
Workbench
↓
OpenAI Package
↓
Preview
↓
CMS Package
↓
Publication

---

# Initial Observation

The repository already contains multiple orchestrated pipelines.

The next challenge is:

- visibility
- orchestration between pipelines
- surfacing
- client delivery
