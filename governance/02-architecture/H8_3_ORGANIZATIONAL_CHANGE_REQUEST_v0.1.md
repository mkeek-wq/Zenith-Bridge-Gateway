# H8.3 Organizational Change Request Contract v0.1

**Date:** 13 Jul 2026
**Status:** Canonical Contract
**Phase:** H8.3
**Purpose:** Define the standard governed change request exchanged between Brainy, Papa, Coding Smurf, Shadow Crew and operational owners.

---

# 1. Mission

The Organizational Change Request is the canonical contract through which Brainy proposes a material improvement to the ZNBW Village.

The contract transforms architectural reasoning into a bounded, auditable and governable proposal.

It ensures that Papa receives sufficient information to decide whether a proposed change should:

* be rejected;
* be held for further evidence;
* be approved for implementation and Shadow testing;
* proceed to production after successful validation.

The Organizational Change Request does not authorize implementation.

It communicates a recommendation for governance review.

---

# 2. Architectural Position

The Organizational Change Request sits between architectural reasoning and governance.

```text
Operational Intelligence
        │
        ▼
Business Intelligence
        │
        ▼
Repository Intelligence
        │
        ▼
Experience Registry
        │
        ▼
Brainy
Architectural Reasoning
        │
        ▼
Organizational Change Request
        │
        ▼
Papa
Governance Review
```

After Papa approves testing:

```text
Papa Test Approval
        │
        ▼
Coding Smurf
Approved Implementation
        │
        ▼
Shadow Crew
Independent Validation
        │
        ▼
Validation Package
        │
        ▼
Papa
Production GO / NO-GO
```

---

# 3. Contract Doctrine

The Organizational Change Request follows these doctrines:

* proposals are not decisions;
* recommendations are not approvals;
* expected benefits are not measured outcomes;
* Glass Orb output is advisory only;
* Detective discoveries remain evidence candidates until governed;
* Codex and architecture-review findings remain advisory;
* Brainy may propose but may not approve;
* Coding Smurf may implement only approved scope;
* Shadow Crew validates independently;
* Papa remains the governance authority;
* no production change may bypass final Papa approval;
* every significant outcome should strengthen organizational learning.

---

# 4. Change Request Lifecycle

Every Organizational Change Request progresses through governed states.

```text
draft
  │
  ▼
ready_for_brainy_review
  │
  ▼
submitted_to_papa
  │
  ├──────────────► rejected
  │
  ├──────────────► held_for_evidence
  │
  └──────────────► approved_for_testing
                         │
                         ▼
                 implementation_ready
                         │
                         ▼
                  shadow_validation
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
     validation_failed       validation_passed
             │                       │
             ▼                       ▼
       returned_to_brainy     submitted_to_papa
                                     │
                           ┌─────────┴─────────┐
                           ▼                   ▼
                 production_rejected   approved_for_production
                                               │
                                               ▼
                                           promoted
                                               │
                                               ▼
                                    outcome_observation
                                               │
                                               ▼
                                    experience_recorded
```

A state transition must preserve:

* timestamp;
* responsible actor;
* rationale;
* supporting evidence;
* previous state;
* next state.

---

# 5. Mandatory Change Request Structure

Every Organizational Change Request shall contain the following sections.

---

## 5.1 Identity

The request must identify itself.

Required fields:

* change_request_id;
* contract_version;
* title;
* created_at;
* created_by;
* originating_domain;
* change_type;
* priority;
* current_status.

The identifier should be stable and unique.

Example:

```text
OCR-PLATFORM-20260713-001
```

---

## 5.2 Current Situation

This section describes the observed state before the proposed change.

It should include:

* current capability;
* present condition;
* relevant operational status;
* known limitations;
* affected users or systems;
* observed health;
* freshness of supporting sources.

The current situation must describe evidence rather than assumptions.

---

## 5.3 Problem or Opportunity

The request must state what requires attention.

The statement should distinguish between:

* confirmed problem;
* architectural risk;
* operational friction;
* capability gap;
* performance opportunity;
* governance weakness;
* technical debt;
* intelligence-quality gap.

The problem statement should be narrow enough to validate.

---

## 5.4 Evidence

Every request must identify the evidence supporting the diagnosis.

Evidence may include:

* Operational Summary Packages;
* Business Intelligence Packages;
* repository dependency findings;
* health reports;
* incident reports;
* Experience Registry records;
* validation results;
* performance measurements;
* Detective Discovery Packages;
* Codex or Architecture Review findings;
* Glass Orb suggestions.

Each source should include:

* source path or package identifier;
* source version;
* generated timestamp;
* freshness;
* source owner;
* relevance;
* known limitations.

Glass Orb suggestions must be explicitly classified as advisory rather than evidence of truth.

---

## 5.5 Architectural Diagnosis

Brainy should explain why the observed condition matters to the Village.

The diagnosis may describe:

* root cause;
* dependency chain;
* architectural drift;
* bottleneck;
* duplicated responsibility;
* missing contract;
* weak governance boundary;
* obsolete capability;
* insufficient evidence;
* scaling constraint.

The diagnosis should separate observed facts from interpretation.

---

## 5.6 Options Considered

Material changes should consider more than one response where practical.

For each option, record:

* option identifier;
* description;
* expected benefit;
* expected cost;
* risk;
* dependencies;
* reversibility;
* reason accepted or rejected.

One valid option may be:

```text
Take no action.
```

Brainy should not recommend change merely because change is possible.

---

## 5.7 Recommended Change

The request must define the preferred intervention.

It should describe:

* target capability;
* intended outcome;
* included scope;
* excluded scope;
* affected files, packages or services where known;
* affected organizational roles;
* expected implementation approach;
* required compatibility constraints.

The request must not silently expand scope during implementation.

---

## 5.8 Expected Improvement

Brainy must state what the proposed change is expected to improve.

Examples include:

* health;
* reliability;
* confidence;
* coverage;
* freshness;
* traceability;
* performance;
* maintainability;
* governance;
* client value;
* operational efficiency.

Expected improvement must be expressed as a hypothesis.

It is not a measured result.

---

## 5.9 Success Metrics

Every change must define measurable success criteria before implementation begins.

Success metrics should include:

* metric name;
* current baseline;
* expected target;
* minimum acceptable result;
* measurement method;
* measurement owner;
* measurement period.

Where no quantitative measure is practical, the request should define a bounded qualitative test.

---

## 5.10 Risks

The request must identify relevant risks.

Potential categories include:

* production risk;
* data-integrity risk;
* governance risk;
* security risk;
* performance risk;
* compatibility risk;
* dependency risk;
* model or reasoning risk;
* client-impact risk;
* rollback risk.

Each risk should include:

* likelihood;
* impact;
* mitigation;
* residual risk;
* owner.

---

## 5.11 Dependencies and Blast Radius

The request must identify known dependencies.

This may include:

* upstream producers;
* downstream consumers;
* runtime services;
* data packages;
* user interfaces;
* governance documents;
* scheduled jobs;
* deployment paths;
* external sources.

Dependency discovery should be consulted before implementation where repository impact is possible.

The request should classify the expected blast radius as:

* isolated;
* local;
* cross-domain;
* platform-wide;
* unknown.

Unknown blast radius requires additional discovery before approval.

---

## 5.12 Implementation Boundaries

The request must define what Coding Smurf is authorized to build.

It should include:

* approved scope;
* prohibited scope;
* required interfaces;
* backward-compatibility requirements;
* versioning expectations;
* deployment restrictions;
* documentation requirements.

Coding Smurf may raise implementation concerns.

Coding Smurf may not unilaterally redesign the approved architecture.

Any material design change must return to Brainy and Papa.

---

## 5.13 Shadow Validation Plan

The request must define how Shadow Crew should test the proposed change.

The plan should specify:

* validation objective;
* sandbox or dry-run environment;
* required fixtures;
* baseline behavior;
* expected behavior;
* regression checks;
* failure conditions;
* performance checks;
* safety checks;
* evidence to capture.

Shadow Crew should test the claims made by the proposal.

Shadow Crew should not merely confirm that the implementation runs.

---

## 5.14 Rollback Plan

Every production-impacting change must define a rollback strategy before promotion.

The rollback plan should include:

* known-good state;
* recovery mechanism;
* affected artifacts;
* backup or tag requirements;
* rollback trigger;
* responsible operator;
* verification steps after rollback.

A change without a credible rollback plan should not receive production approval unless explicitly accepted by Papa as an exceptional risk.

---

## 5.15 Organizational Learning Plan

The request should define how results will become organizational memory.

Possible outputs include:

* Experience Registry record;
* improvement-history record;
* updated operational baseline;
* revised doctrine;
* updated dependency map;
* updated technical-debt classification;
* changed maturity assessment.

Both successful and unsuccessful changes should produce learning.

---

# 6. Actor Responsibilities

## Brainy

Brainy:

* receives summarized organizational intelligence;
* develops the diagnosis;
* may consult Glass Orb;
* may request Codex or Architecture Review;
* may dispatch Detective Smurf;
* compares options;
* prepares the Organizational Change Request;
* submits the request to Papa.

Brainy may not:

* approve the request;
* implement the change;
* validate its own proposal;
* authorize production;
* modify production.

---

## Papa

Papa:

* reviews the request;
* evaluates evidence and risk;
* may reject the request;
* may hold the request for further evidence;
* may approve implementation and testing;
* reviews Shadow evidence;
* issues the final production GO / NO-GO decision.

Papa remains the sole governance authority for material organizational change.

---

## Coding Smurf

Coding Smurf:

* implements only the approved scope;
* preserves modularity and lineage;
* documents implementation;
* identifies unexpected dependencies;
* produces an implementation package for Shadow.

Coding Smurf may not:

* approve its own implementation;
* deploy without authorization;
* expand the change scope;
* replace Brainy’s architectural authority.

---

## Shadow Crew

Shadow Crew:

* validates independently;
* compares actual results with expected improvement;
* records regressions and unexpected effects;
* produces a governed Validation Package;
* reports results to Papa.

Shadow Crew may recommend progression or rejection.

Shadow Crew may not authorize production.

---

## Operational Smurfs

Operational Smurfs:

* receive only production-approved change;
* execute the approved capability;
* observe actual production behavior;
* report operational results;
* contribute observations to organizational learning.

---

# 7. Papa Decision Gates

The lifecycle contains two separate Papa gates.

## Gate 1 — Approval for Testing

Papa determines whether the proposal is sufficiently supported to justify implementation and Shadow validation.

Possible decisions:

* approved_for_testing;
* rejected;
* held_for_evidence;
* returned_for_revision.

Approval for testing is not approval for production.

---

## Gate 2 — Production GO / NO-GO

After Shadow validation, Papa compares:

* original current situation;
* expected improvement;
* actual validation results;
* regressions;
* residual risks;
* rollback readiness.

Possible decisions:

* approved_for_production;
* production_rejected;
* additional_testing_required;
* returned_for_revision.

Only `approved_for_production` permits promotion.

---

# 8. Required Governance Record

Every decision should preserve:

* decision_id;
* decision_gate;
* decided_at;
* decided_by;
* decision;
* rationale;
* conditions;
* evidence reviewed;
* unresolved concerns;
* expiry or review date where applicable.

Governance history must remain append-only or otherwise auditable.

---

# 9. Lineage

Every Organizational Change Request shall preserve lineage to:

* source intelligence packages;
* source operational summaries;
* repository findings;
* advisory consultations;
* Detective discoveries;
* architecture documents;
* approval records;
* implementation artifacts;
* Shadow validation evidence;
* production decision;
* resulting Experience Registry entry.

The lineage should allow a future reviewer to reconstruct:

```text
Why was this change proposed?

Who approved testing?

What was implemented?

How was it validated?

Who approved production?

What happened afterwards?

What did the Village learn?
```

---

# 10. Minimum JSON Contract

A future machine-readable Organizational Change Request should expose at least:

```json
{
  "contract_version": "organizational-change-request-v0.1",
  "change_request_id": "OCR-DOMAIN-YYYYMMDD-001",
  "title": "",
  "created_at": "",
  "created_by": "Brainy",
  "originating_domain": "",
  "change_type": "",
  "priority": "",
  "current_status": "draft",
  "current_situation": {},
  "problem_or_opportunity": {},
  "evidence": [],
  "architectural_diagnosis": {},
  "options_considered": [],
  "recommended_change": {},
  "expected_improvement": {},
  "success_metrics": [],
  "risks": [],
  "dependencies": {},
  "implementation_boundaries": {},
  "shadow_validation_plan": {},
  "rollback_plan": {},
  "organizational_learning_plan": {},
  "governance": {
    "testing_decision": null,
    "production_decision": null
  },
  "lineage": {}
}
```

This structure is a minimum contract.

Domains may extend it without weakening constitutional requirements.

---

# 11. Relationship to Replay

Replay provides the first domain-specific precedent for:

* improvement proposals;
* proposal registration;
* Papa approval;
* Shadow execution;
* promotion;
* rejection;
* improvement history.

The Organizational Change Request generalizes this pattern for Village-wide use.

Replay-specific contracts remain valid.

Future Replay changes may be wrapped by or mapped into the Organizational Change Request rather than immediately rewritten.

Reuse and compatibility are preferred over replacement.

---

# 12. Closing Observation

The Organizational Change Request is the governed bridge between architectural reasoning and organizational action.

It ensures that proposed improvements remain:

* evidence-based;
* bounded;
* reviewable;
* testable;
* reversible;
* measurable;
* auditable;
* governed.

Brainy proposes.

Papa authorizes testing.

Coding Smurf implements.

Shadow Crew validates.

Papa authorizes production.

Operations observe.

The Experience Registry preserves what the Village learns.
