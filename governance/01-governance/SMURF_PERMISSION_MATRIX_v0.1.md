# SMURF Permission Matrix v0.1

**Date:** 09 Jul 2026
**Status:** Active Governance
**Purpose:** Define the constitutional permissions, responsibilities, and boundaries for every Smurf operating within ZNBW.

---

# Legend

| Symbol | Meaning |
|---------|---------|
| ✅ | Allowed |
| ⚠️ | Allowed only under approved governance or policy |
| ❌ | Forbidden |

---

# Permission Matrix

| Smurf | Internet | Glass Orb | Internal KB | Registry Read | Registry Write | Propose | Approve | Execute | Production | Sandbox | Alerts In | Alerts Out | Comments / Violations |
|-------|:--------:|:---------:|:-----------:|:-------------:|:--------------:|:-------:|:-------:|:-------:|:----------:|:-------:|:---------:|:----------:|-----------------------|
| Papa | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ✅ | ✅ | Final governance authority. No research or external ingestion. |
| Brainy | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | R&D only. Glass Orb is advisory only. Never operates production. |
| Hungry | ✅ | ❌ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Sole external ingress. Responsible for validation, provenance and data hygiene. |
| Shadow | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | Validation only. Production execution forbidden. |
| Platform Steward | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | Platform health, maintenance and operational reporting. |
| Intelligence | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | Executes approved intelligence workflows only. |
| Editorial | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | Publication from approved intelligence packages only. |

---

# Constitutional Violations

| ID | Rule | Severity |
|----|------|----------|
| C-001 | Any Smurf other than Hungry accesses an external system directly. | Critical |
| C-002 | Any Smurf other than Brainy accesses the Glass Orb. | Critical |
| C-003 | Brainy performs operational or production actions. | Critical |
| C-004 | Shadow Smurfs modify production directly. | Critical |
| C-005 | Production changes bypass Papa governance. | Critical |
| C-006 | Operational changes occur without audit trail. | Critical |

---

# Review Notes

This matrix is intentionally conservative.

Permissions may expand as the platform matures, but constitutional separation of:

- External Ingestion
- Research
- Governance
- Validation
- Operations

must always be preserved.
