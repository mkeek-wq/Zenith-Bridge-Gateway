# H9.1.4 Infrastructure Profile — Evidence v0.1

**Date:** 13 Jul 2026
**Phase:** H9 Village Intelligence Discovery
**Status:** Discovery Profile
**Profile Type:** Cross-Cutting Organizational Infrastructure
**Discovery Confidence:** High

---

# 1. Mission

The Evidence infrastructure is responsible for establishing, assessing, tracing, challenging and governing the factual basis used by Village capabilities.

Evidence does not own a business domain.

It provides shared controls that determine whether observations, claims, hypotheses and mechanisms have sufficient support for governed use.

---

# 2. Architectural Classification

Evidence is a cross-cutting organizational infrastructure capability.

It supports multiple organizational capabilities, including:

- Replay;
- Experience;
- Mechanism;
- Investigation;
- Historical Replay;
- Article Intelligence;
- Attribution;
- Decision Support.

Evidence therefore differs from domain capabilities such as Replay or Mechanism.

Domain capabilities produce specialized intelligence.

Evidence governs the factual basis on which that intelligence depends.

---

# 3. Core Responsibilities

Current discovery identified the following responsibilities:

- evidence acquisition;
- evidence extraction;
- evidence assessment;
- source reliability scoring;
- freshness scoring;
- relevance assessment;
- deduplication;
- contradiction detection;
- counter-evidence review;
- evidence lineage;
- discovery queues;
- validation;
- controlled promotion.

---

# 4. Evidence Assessment

The Evidence Assessment Engine evaluates evidence using dimensions including:

- freshness;
- source reliability;
- metric importance;
- relevance;
- confidence;
- supporting context.

Current source reliability logic distinguishes between:

- official statistical and regulatory sources;
- international institutions;
- government and central-bank sources;
- established financial news sources;
- lower-authority or unknown sources.

Evidence assessment therefore evaluates quality rather than merely confirming that a source exists.

---

# 5. Evidence Lineage

The Evidence Lineage Engine preserves the processing history of staged evidence.

Current lineage records include:

- originating batch;
- source file;
- candidate record;
- dry-run validation;
- duplicate review;
- controlled staging;
- human review state;
- production approval state.

Current governance establishes that:

- every staged record requires lineage;
- incomplete lineage blocks promotion;
- staged evidence is not production evidence;
- human review is required;
- production promotion is not automatic.

---

# 6. Counter-Evidence

Counter-Evidence provides an explicit challenge function.

It identifies observations that could weaken or disprove an existing explanation.

Current examples include searching for:

- comparable events with different outcomes;
- outcomes occurring without the proposed driver;
- alternative explanations that outperform the current mechanism;
- cross-domain evidence contradicting the proposed relationship.

The absence of observed counter-evidence is explicitly not treated as proof of validity.

It only means that blocking counter-evidence has not yet been registered.

---

# 7. Internal Evidence Flow

Current discovery suggests the following generalized flow:

Source Material

↓

Evidence Extraction

↓

Evidence Assessment

↓

Deduplication and Contradiction Review

↓

Lineage Registration

↓

Domain Mapping

↓

Counter-Evidence Review

↓

Validation

↓

Controlled Promotion

↓

Governed Consumption

---

# 8. Domain-Specific Implementations

Evidence infrastructure is shared, but some implementations are domain-specific.

Examples include:

- Article Evidence Packages;
- Replay Evidence Files;
- Replay Dataset Evidence Bridge;
- Mechanism Evidence Linker;
- Mechanism Counter-Evidence;
- Historical Evidence Scorecards;
- Attribution Evidence Registry;
- Investigation Evidence Search Packages.

These are specialized consumers and adapters of the shared Evidence infrastructure.

They do not replace the underlying evidence doctrine.

---

# 9. Governance Principles

Current discovery supports the following principles:

- evidence remains primary;
- lineage is mandatory;
- staged evidence is not production evidence;
- confidence must reflect evidence quality;
- contradictions must be preserved;
- counter-evidence must be actively considered;
- absence of counter-evidence is not validation;
- promotion requires governance;
- human review remains required for material state changes.

---

# 10. Relationship to Experience

Experience preserves repeated observations.

Evidence determines how strongly those observations are supported.

Repeated Experience without sufficient Evidence should not automatically strengthen organizational confidence.

---

# 11. Relationship to Mechanism

Mechanism develops governed causal explanations.

Evidence provides the supporting, contrary and ambiguous material required for validation.

A mechanism may not replace or override current evidence.

Counter-evidence may weaken, challenge or prevent promotion of a mechanism.

---

# 12. Relationship to Replay

Replay uses Evidence to:

- support historical cases;
- validate event interpretations;
- link datasets to historical outcomes;
- compare analogue quality;
- identify evidence gaps;
- preserve replay lineage.

Replay is therefore a major consumer of Evidence infrastructure.

---

# 13. Infrastructure Maturity

Current assessment:

**Infrastructure maturity:** High

**Cross-domain reach:** High

**Governance maturity:** High

**Lineage maturity:** High

**Counter-evidence maturity:** Developing to High

**Standardization maturity:** Developing

---

# 14. Architectural Observations

Current observations:

- Evidence is not a single pipeline.
- Evidence is cross-cutting infrastructure.
- Domain capabilities consume Evidence through specialized adapters.
- Evidence quality is assessed, not assumed.
- Lineage is treated as a promotion requirement.
- Counter-evidence is a first-class control.
- Evidence remains primary over mechanisms and interpretations.
- Production promotion is deliberately separated from staging.

---

# 15. Open Questions

Remaining discovery items include:

- Is there one canonical Evidence contract?
- Which Evidence versions remain active?
- How are Evidence v1 through v5 related?
- Which engines consume Evidence Assessment v0.2 directly?
- How are contradictions surfaced to Brainy and Papa?
- Is Confidence part of Evidence infrastructure or a separate shared infrastructure?
- Which Evidence packages are production-grade versus historical experiments?

---

# 16. H9 Discovery Outcome

Evidence should be regarded as the Village's cross-cutting factual governance infrastructure.

It assesses what supports a claim, preserves where that support came from, records what contradicts it, and controls whether it may be promoted for organizational use.

Evidence is responsible for governing what the Village is allowed to treat as supported.

It is not responsible for deciding the business meaning of that evidence.
