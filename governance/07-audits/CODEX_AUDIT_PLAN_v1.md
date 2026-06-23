# CODEX_AUDIT_PLAN_v1

Status: Draft
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Define how Codex will be used as an independent architecture and hygiene auditor.

---

# Audit Timing

Codex Audit V1 should run after the initial governance skeleton exists:

- SYSTEM_MAP_v1
- ASSET_INVENTORY_v1
- ARCHITECTURE_OVERVIEW_v1
- DOCUMENTATION_PROTOCOL_v1

---

# Audit Questions

Codex should review the repository and identify:

1. Missing documentation
2. Duplicate components
3. Dead or unused code
4. Sleeping assets that can be reused
5. Rotting assets that should be archived
6. Security-sensitive routes or files
7. Exposed internal assets
8. Unclear ownership or lineage
9. Technical debt
10. Architecture inconsistencies

---

# Expected Outputs

Codex should produce:

- SYSTEM_MAP_REVIEW_v1
- DEAD_CODE_REGISTER_v1
- SLEEPING_ASSET_REGISTER_v1
- ROT_RISK_REGISTER_v1
- SECURITY_REVIEW_v1
- LINEAGE_REVIEW_v1
- TECHNICAL_DEBT_REGISTER_v1
- ACTION_PLAN_v1

---

# Governance Update Protocol

After Codex Audit V1:

1. Review findings manually.
2. Mark false positives.
3. Add confirmed findings to ASSET_INVENTORY_v1 or TECHNICAL_DEBT_REGISTER_v1.
4. Update SYSTEM_MAP_v1 where required.
5. Create cleanup tasks only after classification.

---

# Future Audit Triggers

Run Codex audit again after:

- Client Portal completion
- Replay Engine completion
- Decision Support completion
- First paying client
- Major production architecture change

---

# Principle

Codex is not the source of truth.

The governance repository is the source of truth.

Codex is an independent reviewer that helps identify gaps, drift and risk.
