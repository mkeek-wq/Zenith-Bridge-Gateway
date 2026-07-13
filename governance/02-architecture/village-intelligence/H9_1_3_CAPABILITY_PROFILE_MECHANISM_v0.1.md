# H9.1.3 Capability Profile — Mechanism v0.1

**Date:** 13 Jul 2026
**Phase:** H9 Village Intelligence Discovery
**Status:** Discovery Profile
**Discovery Confidence:** High

---

# 1. Mission

The Mechanism capability is responsible for developing, testing, governing and maintaining causal explanations.

A mechanism expresses a proposed relationship between a driver, transmission process and observed outcome.

Mechanisms are not treated as true merely because supporting observations exist.

They must progress through a governed lifecycle supported by evidence, counter-evidence, confidence assessment and human review.

---

# 2. Architectural Role

Within the Village architecture, Mechanism acts as the causal knowledge capability.

Experience preserves repeated observations.

Mechanism evaluates whether those observations support a sufficiently credible explanation of why an outcome occurred.

The capability therefore separates:

- observation;
- repetition;
- hypothesis;
- causal explanation;
- validation;
- ongoing challenge.

---

# 3. Primary Inputs

Current discovery identified inputs including:

- hypothesis-registry-v0.1.json;
- confidence-framework-v0.1.json;
- counter-evidence-registry-v0.1.json;
- counter-evidence-engine-v0.2.json;
- mechanism-validation-review-engine-v0.1.json;
- Experience observations and learning assessments.

Mechanism consumes processed evidence and governed learning outputs rather than raw data alone.

---

# 4. Primary Outputs

Current published outputs include:

- Mechanism Discovery Engine;
- Mechanism Evidence Linker;
- Mechanism Scoring Engine;
- Mechanism Confidence Engine;
- Mechanism Trend Engine;
- Mechanism Reputation Engine;
- Mechanism Promotion Candidate Engine;
- Mechanism Validation Review Queue;
- Mechanism Validation Review Engine;
- Mechanism Validation Registry;
- Mechanism Lifecycle Registry;
- Mechanism Lifecycle Promotion Gate;
- Validated Mechanism Registry.

These outputs show that Mechanism is a governed lifecycle capability rather than a single registry or scoring process.

---

# 5. Internal Lifecycle

Current discovery suggests the following lifecycle:

Hypothesis

↓

Mechanism Candidate

↓

Evidence Linking

↓

Experience Alignment

↓

Confidence and Scoring

↓

Counter-Evidence Review

↓

Promotion Candidate

↓

Under Validation Review

↓

Formal Human Validation

↓

Validated Mechanism

↓

Strengthened / Weakened / Challenged / Retired

---

# 6. Candidate State

Mechanisms begin in the state:

`candidate_not_validated`

At this stage:

- the mechanism may not adjust confidence;
- it may not override current evidence;
- it may not drive a primary assessment;
- it may not mutate production behaviour.

The existence of a candidate records a hypothesis.

It does not establish causal truth.

---

# 7. Promotion Governance

Current promotion logic considers:

- minimum Experience count;
- positive alignment ratio;
- learning confidence score;
- absence of blocking counter-evidence.

A qualifying candidate may be promoted to:

`under_validation_review`

This state is explicitly not validation.

Formal validation remains a separate governed decision.

---

# 8. Validation Requirements

Current discovery identified requirements including:

- counter-evidence search completed;
- supporting evidence reviewed;
- contrary evidence reviewed;
- ambiguous evidence recorded;
- scope and limitations defined;
- human validation decision recorded.

Validation therefore requires more than statistical alignment or repeated observation.

---

# 9. Lifecycle Governance

Mechanisms remain subject to continuing challenge after validation.

Current lifecycle states include:

- validated;
- strengthened;
- weakened;
- under_challenge;
- retired.

Current challenge rules allow:

- new counter-evidence to weaken a mechanism;
- failed predictions to weaken a mechanism;
- strong new evidence to strengthen a mechanism;
- repeated failure to retire a mechanism;
- periodic review to reassess the mechanism.

Mechanism knowledge is therefore provisional and revisable.

---

# 10. Usage Constraints

Current governance establishes that:

- evidence remains primary;
- mechanisms may not override evidence;
- candidates may not influence production assessment;
- human review is required for lifecycle state changes;
- production mutation is not automatically permitted.

Even a validated mechanism is an explanatory aid rather than unquestionable truth.

---

# 11. Relationship to Experience

Experience and Mechanism have different organizational responsibilities.

Experience answers:

“What have we repeatedly observed?”

Mechanism answers:

“What causal explanation is sufficiently supported, bounded and governed?”

Experience can strengthen the basis for reviewing a mechanism.

Experience promotion does not validate a mechanism.

Mechanism validation remains an independent governance process.

---

# 12. Relationship to Other Capabilities

Current evidence suggests relationships with:

- Evidence;
- Counter-Evidence;
- Hypothesis;
- Confidence;
- Experience;
- Replay;
- Forecast;
- Decision Support;
- Brainy in future organizational reasoning.

Further consumer discovery remains required.

---

# 13. Maturity Assessment

Current assessment:

**Capability maturity:** High

**Lifecycle maturity:** High

**Governance maturity:** High

**Evidence discipline:** High

**Production authority:** Restricted

**Consumer discovery:** Pending

---

# 14. Architectural Observations

Current observations:

- Mechanism is a causal knowledge capability.
- Mechanisms are lifecycle-managed objects.
- Validation is separated from promotion.
- Counter-evidence is structurally required.
- Mechanisms remain challengeable after validation.
- Evidence remains primary.
- Human review protects lifecycle transitions.
- Experience and Mechanism are deliberately separated.

---

# 15. Open Questions

Remaining discovery items include:

- Which engines consume validated mechanisms directly?
- How are validated mechanisms used by Replay?
- How are mechanism confidence and reputation updated over time?
- What precise authority does a validated mechanism receive?
- How does prediction failure feed lifecycle weakening or retirement?
- How will Brainy consume mechanisms without bypassing Evidence?

---

# 16. H9 Discovery Outcome

Mechanism should be regarded as the Village's governed causal knowledge capability.

It develops explanations from hypotheses, evidence and repeated Experience, while preserving counter-evidence, uncertainty, human review and continuing challenge.

Mechanism is responsible for maintaining bounded causal explanations.

It is not responsible for replacing evidence or declaring permanent truth.
