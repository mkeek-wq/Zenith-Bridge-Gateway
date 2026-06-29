Section 1 — Purpose
The Evidence Governance Framework establishes the rules by which
observations, evidence, attribution, confidence and case status are
evaluated within the ZNBW Intelligence Engine.

The objective is to ensure:

- Transparency
- Reproducibility
- Auditability
- Consistency
- Future learning and calibration

The Intelligence Engine may learn from history.
The Intelligence Engine may not rewrite history.
Section 2 — Intelligence Flow
Monitoring
↓
Document Registry
↓
Evidence Extraction
↓
Evidence Relevance
↓
Evidence Quality
↓
Attribution Investigation
↓
Case Creation
↓
Confidence Evaluation
↓
Case State Management
↓
Investigation Queue
↓
Case History
↓
Future Intelligence Layer
Section 3 — Source Authority Framework

Reference:

config/source-authority-registry-v0.1.json
Tier A

Primary / Official Sources

Examples:

SingStat
MAS
MTI
EDB
IMF
World Bank
BIS
OECD
Tier B

Professional Institutional Media

Reuters
Bloomberg
Financial Times
Tier C

Industry Sources

Industry Associations
Trade Bodies
Corporate Publications
Tier D

General Commentary

Blogs
Opinion Sites
Informal Sources

Rule:

Authority Tier outranks Authority Score.

Example:

Tier A score 85
outranks
Tier B score 95
Section 4 — Evidence Relevance

Current implementation:

build-evidence-relevance.ts

Purpose:

Determine whether evidence contributes to explaining
the observed movement.

States:

Relevant
Not Relevant
Requires Review
Section 5 — Evidence Quality

Current implementation:

audit-evidence-quality-v2.ts

States:

poor
limited
good

Definitions:

Poor
No meaningful explanatory evidence found.
Limited
Some supporting evidence exists.
Attribution remains weak.
Good
Multiple relevant evidence sources support attribution.
Section 6 — Attribution Framework

Current implementation:

build-attribution-investigations-v2.ts

Buckets:

Market Effect
Demand cycle
Export growth
Global sector trend
Commodity movement
Portfolio Effect
Industry composition changes
Sub-sector mix effects
Operational Effect
Plant shutdown
Capacity expansion
Maintenance
Supply disruption
Policy Effect
Regulation
Tax policy
Trade restrictions
Government incentives
Unknown Effect
Unexplained residual movement

Initial state:

unknown_effect = 10
Section 7 — Confidence Framework

Current implementation:

update-case-confidence.ts
UNKNOWN_V1
relevant_evidence_count = 0

Result:

confidence = unknown
LOW_V1
relevant_evidence_count > 0
unknown_effect >= 8

Result:

confidence = low
MEDIUM_V1
relevant_evidence_count > 0
unknown_effect = 3-7

Result:

confidence = medium
HIGH_V1
relevant_evidence_count > 0
unknown_effect <= 2

Result:

confidence = high

All confidence assignments must preserve:

confidence_reason

for auditability.

Section 8 — Case Lifecycle

States:

investigating
partially_explained
substantially_explained
closed

Governed by:

update-case-state.ts
Section 9 — Case History Principles

Governed by:

update-case-history.ts

Rules:

Append-only
No historical mutation
Duplicate protection enabled

Principle:

The Intelligence Engine may learn from history.
The Intelligence Engine may not rewrite history.
Section 10 — Future Intelligence Layer

Planned capabilities:

Historical pattern matching
Hypothesis generation
Evidence recommendation
Attribution recommendation
Confidence calibration
Sector learning
Prediction accuracy measurement
