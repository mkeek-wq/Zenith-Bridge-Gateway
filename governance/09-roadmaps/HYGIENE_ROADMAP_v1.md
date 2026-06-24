# HYGIENE_ROADMAP_v1

Status: Active
Version: 1.1
Last Updated: 2026-06-24

Purpose:
Track ZNBW hygiene phases, completion status and next audit milestones.

---

# Completed Phases

## HYG-FOUNDATION-001

Status:
Complete

Scope:

- System Map
- Asset Inventory
- Architecture Overview
- Architecture Principles
- Smurf Engine Overview
- Intelligence Center Overview
- Documentation Protocol
- Codex Audit Plan
- Technical Debt Register

Outcome:
Governance repository foundation established.

---

## HYG-005 — Operations & Recovery

Status:
Complete

Scope:

- Operations Register
- Backup and Restore Register
- Deployment Register
- Security Surface Register
- Dependency Register

Outcome:
Operational landscape documented and recoverability improved.

---

# Current State

The intelligence-article pipeline is workable.

The platform has entered a hygiene-first phase focused on:

- Preserving existing work
- Reducing institutional memory risk
- Discovering forgotten foundations
- Preventing duplicate systems
- Preparing for audit readiness

Current principle:

Discover
→ Connect
→ Reuse

before

Build
→ Build
→ Build

---

# Codex Audit Status

## CODEX_AUDIT_A-001

Status:
Completed

Result:
Initial audit could not review governance content because governance documents had not yet been pushed to GitHub.

Outcome:
Confirmed governance synchronization gap between VPS working state and GitHub repository.

---

## CODEX_AUDIT_A-002

Status:
Completed

Scope:

- System Map
- Asset Inventory
- Architecture
- Operations
- Recovery
- Deployment
- Security Surface
- Dependencies
- Technical Debt
- Hygiene Roadmap

Outcome:
Governance baseline reviewed by Codex.

Assessment:
Strong Phase B / early Phase C foundation.

Governance Maturity:
2.8 / 5

Highest Priority Findings:

- CRIT-001: Public runtime ports 5173 and 8080 exposed
- CRIT-002: Database-only backup and restore missing
- CRIT-003: Client onboarding governance missing

---

# Immediate Remediation Status

## CRIT-001 — Public Runtime Port Exposure

Status:
Partially Remediated

Date:
2026-06-24

Actions Completed:

- Removed public UFW rule for 5173/tcp
- Removed public UFW rule for 8080/tcp
- Removed IPv6 UFW rule for 5173/tcp
- Removed IPv6 UFW rule for 8080/tcp
- Verified UFW now exposes only OpenSSH, 80/tcp and 443/tcp
- Verified public admin route remains reachable through Nginx
- Verified public API domain remains reachable through Nginx

Evidence Commands:

sudo ufw status numbered

curl -I https://zenithnovabridgewave.com/admin

curl -I https://api.zenithnovabridgewave.com

Remaining Improvement:

- Bind zenith-api runtime to 127.0.0.1
- Bind zenith-admin runtime to 127.0.0.1

---

# Next Milestone

## HYG-006 — Database Backup & Recovery

Status:
Substantially Complete

Objective:
Close CODEX_AUDIT_A-002 CRIT-002 by implementing database-only backup, restore documentation and restore verification.

Target Deliverables:

- DATABASE_BACKUP_AND_RESTORE_v1
- Scheduled pg_dump backup
- Backup retention policy
- Restore procedure
- First restore verification evidence
Completion Evidence:

- PostgreSQL logical backup script created
- Manual backup completed successfully
- Restore test database created
- Backup restored successfully into zenith_restore_test
- Public tables verified
- Row counts verified
- Restore test database dropped after verification
- Nightly root cron configured for 02:15 server time
- DATABASE_BACKUP_AND_RESTORE_v1 created

Result:
CODEX_AUDIT_A-002 CRIT-002 substantially remediated.

Remaining Improvements:

- Automated backup success monitoring
- Off-server backup copy
- Periodic restore-test schedule
- Backup encryption review
- Backup failure alerting
- RPO/RTO targets

---

---

## HYG-007 — Lineage & Transparency Foundation

Status:
Substantially Complete

Date:
2026-06-24

Objective:
Establish a canonical source-to-publication lineage model and close CODEX_AUDIT_A-002 lineage governance findings.

Deliverables:

- LINEAGE_MODEL_v1

Completion Evidence:

- Canonical lineage chain documented
- Source-to-publication traceability model documented
- Signal layer incorporated into lineage model
- Governance rules documented
- Existing lineage components mapped
- Audit remediation documented
- Governance document committed to repository
- Governance document pushed to GitHub

Result:

CODEX_AUDIT_A-002 HIGH-003 substantially remediated.

Remaining Improvements:

- EVIDENCE_OBJECT_STANDARD_v1
- CONFIDENCE_SCORING_STANDARD_v1
- SOURCE_TO_PUBLICATION_TRACEABILITY_MATRIX_v1
- Transparency reporting layer
- Client transparency views
- Publication traceability dashboard

Related Documents:

- LINEAGE_MODEL_v1
- ARCHITECTURE_PRINCIPLES_v1
- ARCHITECTURE_OVERVIEW_v1
- SYSTEM_MAP_v1
- ASSET_INVENTORY_v1
- INTELLIGENCE_CENTER_v1
- SMURF_ENGINE_v1

---

# Next Hygiene Phase

## HYG-010 — Asset Discovery & Classification

Status:
Planned

Scope:

- Replay Assets
- Decision Support Assets
- Experience Registry Assets
- Confidence Assets
- Evidence Assets
- Transparency Assets
- Macro Attribution Assets

Objective:
Discover, classify and consolidate existing intelligence foundations before creating new systems.

---

# Future Phases

## HYG-020 — Intelligence Consolidation

Status:
Future

Objective:
Consolidate overlapping intelligence, replay, evidence and decision-support components.

---

# Roadmap Principle

Governance exists to preserve and increase platform value.

Documentation should remain useful, practical and tied to real system decisions.
