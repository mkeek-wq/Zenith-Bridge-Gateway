# ZNBW Handover — Phase H8 Organizational Architecture and Change Runtime

**Date:** 13 Jul 2026
**Branch:** `recovery/june25-known-good`
**Status:** H8 implemented and validated
**Next Phase:** H9 discovery

---

# 1. Executive Summary

Phase H8 formalized how the ZNBW Village governs its own organizational evolution.

Earlier phases established repository discovery, intelligence composition and operational intelligence.

H8 adds the constitutional and machine-readable layer through which organizational improvements are:

* proposed;
* bounded;
* reviewed;
* implemented;
* independently validated;
* approved or rejected;
* preserved as organizational learning.

The core lifecycle is:

```text
Operational and Business Intelligence
        │
        ▼
Brainy Architectural Reasoning
        │
        ▼
Organizational Change Request
        │
        ▼
Papa Approval for Testing
        │
        ▼
Coding Smurf Implementation
        │
        ▼
Shadow Crew Validation
        │
        ▼
Papa Production GO / NO-GO
        │
        ▼
Production Observation
        │
        ▼
Experience Registry
```

Brainy proposes.

Papa governs.

Coding Smurf implements approved scope.

Shadow Crew validates independently.

Operational Smurfs operate approved capabilities.

---

# 2. H8.1 Organizational Contracts

Architecture document:

```text
governance/02-architecture/H8_1_ORGANIZATIONAL_CONTRACTS_v0.1.md
```

Commit:

```text
6ef647a
Define organizational contracts constitution
```

Tag:

```text
zenith-organizational-contracts-v0.1
```

H8.1 defines the constitutional contract standard for organizational participants.

Every organizational role should define:

* mission;
* primary responsibility;
* inputs;
* outputs;
* consumers;
* producers;
* authority;
* restrictions;
* governance;
* success metrics.

Key doctrine:

```text
Reasoning is separate from execution.

Validation is separate from implementation.

Capability does not imply authority.

Artificial intelligence advises but never governs.

Production changes require explicit governance.
```

---

# 3. H8.2 Organizational Improvement Architecture

Architecture document:

```text
governance/02-architecture/H8_2_ORGANIZATIONAL_IMPROVEMENT_ARCHITECTURE_v0.1.md
```

Commit:

```text
cd08710
Define organizational improvement architecture
```

Tag:

```text
zenith-organizational-improvement-architecture-v0.1
```

H8.2 consolidates existing architecture from:

* Village Intelligence Runtime;
* Knowledge Influence Doctrine;
* Smurf Permission Matrix;
* Replay Runtime Architecture;
* H7 Operational Intelligence;
* H8 Organizational Contracts.

It establishes one canonical organizational improvement lifecycle.

---

# 4. Brainy Role

Brainy is the Chief Systems Thinker and Village System Architect.

Brainy remains outside Operations.

Brainy receives summarized intelligence rather than directly monitoring every low-level subsystem.

Brainy may consume:

* Operational Intelligence;
* Business Intelligence;
* Replay Intelligence;
* repository dependency findings;
* Experience Registry learning;
* Detective discoveries;
* Codex or Architecture Review findings;
* Glass Orb suggestions.

Brainy may:

* identify cross-system friction;
* compare options;
* consult advisory sources;
* produce architectural diagnoses;
* submit governed change requests.

Brainy may not:

* approve;
* implement;
* deploy;
* modify production;
* validate its own proposals.

---

# 5. Advisory and Discovery Roles

## Glass Orb

The Glass Orb provides AI-generated ideas and alternatives.

Only Brainy may consult the Glass Orb.

Glass Orb output:

* is advisory;
* is not evidence of truth;
* cannot directly influence Operations;
* cannot bypass Brainy;
* cannot reach Papa unmediated.

## Codex and Architecture Review

Codex and Architecture Review provide:

* repository analysis;
* dependency discovery;
* impact review;
* implementation critique;
* architecture findings.

Their findings remain advisory inputs to Brainy.

## Detective Smurf

Detective Smurf searches for:

* new data sources;
* alternative evidence;
* contradictory evidence;
* APIs;
* historical cases;
* research;
* external intelligence.

Detective reports findings to Brainy.

Detective does not ingest directly into production and does not approve organizational changes.

---

# 6. Governance Roles

## Papa Smurf

Papa is the final governance authority.

The organizational change lifecycle contains two Papa gates:

```text
Gate 1
Approval for implementation and Shadow testing

Gate 2
Production GO / NO-GO after validation
```

Approval for testing is not approval for production.

## Coding Smurf

Coding Smurf implements only approved scope.

Coding Smurf owns engineering quality but not architectural or governance authority.

Material design deviations must return to Brainy and Papa.

## Shadow Crew

Shadow Crew validates independently.

Shadow tests:

* expected behavior;
* regressions;
* evidence lineage;
* performance;
* safety;
* scope control;
* production-write prohibition where applicable.

Shadow produces evidence for Papa.

Shadow does not approve production.

---

# 7. H8.3 Organizational Change Request Contract

Contract document:

```text
governance/02-architecture/H8_3_ORGANIZATIONAL_CHANGE_REQUEST_v0.1.md
```

Commit:

```text
bd29f50
Define organizational change request contract
```

Tag:

```text
zenith-organizational-change-request-contract-v0.1
```

The Organizational Change Request is the canonical contract between Brainy and Papa.

Mandatory areas include:

* identity;
* current situation;
* problem or opportunity;
* evidence;
* architectural diagnosis;
* options considered;
* recommended change;
* expected improvement;
* success metrics;
* risks;
* dependencies and blast radius;
* implementation boundaries;
* Shadow validation plan;
* rollback plan;
* organizational learning plan;
* governance;
* lineage.

The contract transforms architectural reasoning into a bounded, testable and auditable governance artifact.

---

# 8. H8.4 Organizational Change Request Runtime

Implementation note:

```text
governance/02-architecture/H8_4_ORGANIZATIONAL_CHANGE_REQUEST_BUILDER_v0.1.md
```

Builder:

```text
artifacts/api-server/src/scripts/build-organizational-change-request-v0.1.ts
```

Generated package:

```text
artifacts/api-server/data/intelligence/organizational-change-request-v0.1.json
```

Commit:

```text
985ad5a
Build organizational change request runtime
```

Tag:

```text
zenith-h8-organizational-change-runtime-v0.1
```

Run from:

```bash
cd /opt/Zenith-Bridge-Gateway/artifacts/api-server

pnpm tsx \
src/scripts/build-organizational-change-request-v0.1.ts
```

Validated output:

```text
overall_status        green
source_count          1
available_sources     1
missing_sources       0
invalid_sources       0
stale_sources         0
change_requests       25
warnings              0
criticals             0
```

The first implementation normalizes Replay Improvement Proposals into the canonical Organizational Change Request contract.

---

# 9. Replay as Reference Implementation

Replay already contains a domain-specific improvement lifecycle:

```text
Brainy Diagnosis
        │
        ▼
Replay Improvement Proposal
        │
        ▼
Papa Approval
        │
        ▼
Shadow Execution
        │
        ▼
Audit Evidence
        │
        ▼
Papa GO / NO-GO
        │
        ▼
Promotion or Rejection
        │
        ▼
Improvement History
```

H8 does not replace this lifecycle.

It generalizes the pattern for Village-wide use.

Replay remains the first reference implementation.

The originating Replay packages remain canonical for Replay-specific reasoning and state.

The Organizational Change Request adds a shared governance structure without taking ownership away from Replay.

---

# 10. Runtime Design

The builder follows the established H7/H8 composition standard:

* governed source definitions;
* safe JSON loading;
* explicit missing and invalid states;
* version detection;
* freshness classification;
* honest health;
* warnings and criticals;
* recommendations;
* lineage;
* no production writes;
* human review required.

The current source definition contains:

```text
data/replay/replay-improvement-proposals-v0.1.json
```

Future domains may be added incrementally.

Potential future sources include:

* Platform proposals;
* Editorial proposals;
* Macro proposals;
* Forecast proposals;
* Security proposals;
* Decision Support proposals.

No additional domain should create an independent governance model when the Organizational Change Request contract is sufficient.

---

# 11. Current Generated Package

The generated package contains 25 high-priority Replay change requests.

Each request includes:

* current completeness baseline;
* missing fields;
* controlled-enrichment recommendation;
* no-action alternative;
* expected improvement hypothesis;
* success metrics;
* risk controls;
* known dependencies;
* implementation restrictions;
* Shadow validation requirements;
* rollback plan;
* organizational learning plan;
* governance requirements;
* full lineage.

All 25 requests currently have:

```text
current_status = submitted_to_papa
```

This status is a normalization of the source Replay status:

```text
awaiting_papa_approval
```

Normalization does not grant approval or alter the source proposal package.

---

# 12. Important Boundaries

The builder:

* does not create domain reasoning;
* does not approve proposals;
* does not modify source proposal state;
* does not write to production;
* does not promote changes;
* does not replace Papa;
* does not replace Shadow;
* does not replace domain ownership.

The builder only normalizes domain proposals into a common governance contract.

---

# 13. Constitutional Source Documents

The H8 constitutional stack is:

```text
H8.1
Organizational Contracts

        │
        ▼

H8.2
Organizational Improvement Architecture

        │
        ▼

H8.3
Organizational Change Request Contract

        │
        ▼

H8.4
Organizational Change Request Runtime
```

Related existing sources remain authoritative within their scopes:

```text
governance/01-governance/KNOWLEDGE_INFLUENCE_DOCTRINE_v0.1.md

governance/01-governance/SMURF_PERMISSION_MATRIX_v0.1.md

governance/02-architecture/VILLAGE_INTELLIGENCE_RUNTIME_v0.1.md

governance/02-architecture/SMURF_ENGINE_v1.md

governance/02-architecture/replay/REPLAY_RUNTIME_ARCHITECTURE_v0.1.md

governance/02-architecture/H7_2_OPERATIONAL_INTELLIGENCE_FOUNDATION_v0.1.md
```

H8 consolidates these components.

It does not invalidate them.

---

# 14. Repository State

Recent H8 commits:

```text
985ad5a
Build organizational change request runtime

bd29f50
Define organizational change request contract

cd08710
Define organizational improvement architecture

6ef647a
Define organizational contracts constitution
```

Branch:

```text
recovery/june25-known-good
```

The unrelated repository dirty state remains untouched.

---

# 15. H8 Completion Assessment

H8 has completed:

* organizational role contracts;
* authority separation;
* architectural improvement lifecycle;
* canonical change request contract;
* machine-readable normalization runtime;
* Replay integration;
* honest health reporting;
* governance boundaries;
* success measurement;
* rollback planning;
* lineage;
* organizational learning expectations.

No additional H8 runtime is required before proceeding.

---

# 16. H9 Starting Point

H9 should begin with discovery rather than immediate implementation.

The starting question is:

```text
What intelligence should Brainy receive,
and what governed synthesis package already exists?
```

Likely H9 concerns include:

* Village-level intelligence composition;
* Brainy input packages;
* cross-domain diagnosis;
* recommendation generation;
* use of existing Business and Operational Intelligence;
* connection between organizational intelligence and future client decision support.

H9 should not rebuild the constitutional layer.

It should consume it.

---

# 17. Working Doctrine for H9

Continue following:

```text
Discovery
        │
        ▼
Doctrine
        │
        ▼
Architecture
        │
        ▼
Implementation
        │
        ▼
Validation
        │
        ▼
Promotion
```

Additional rules:

* no blind coding;
* use `cat`, `sed`, `grep` and `find` before editing;
* reuse first;
* promote second;
* rewrite last;
* preserve domain ownership;
* keep packages modular;
* keep every step identifiable and traceable;
* avoid touching unrelated dirty files;
* do not bypass Papa governance.

---

# 18. Closing Status

Phase H8 is complete.

The ZNBW Village now has a constitutional and machine-readable framework for governed organizational change.

The next phase should focus on how existing organizational intelligence is synthesized into governed reasoning and recommendations.
