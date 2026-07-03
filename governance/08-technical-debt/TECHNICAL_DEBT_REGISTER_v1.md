# TECHNICAL_DEBT_REGISTER_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Track known technical debt, architectural debt, governance debt and cleanup opportunities.

---

# Priority Definitions

Critical

* Security risk
* Data loss risk
* Production stability risk

High

* Significant maintenance burden
* Architectural inconsistency
* Governance gap

Medium

* Cleanup opportunity
* Technical simplification
* Documentation gap

Low

* Cosmetic improvement
* Future optimization

---

# Open Items

## TD-001

Title:
Publication Queue Review

Priority:
Medium

Category:
Architecture

Description:
Publication Queue remains visible in Admin UI while CMS Package Intake has become the preferred publication workflow.

Action:
Review whether Publication Queue should be:

* retained
* merged
* retired

Status:
Open

---

## TD-002

Title:
Legacy CMS Review

Priority:
Medium

Category:
Architecture

Location:
artifacts/cms

Description:
Current purpose unknown.

Action:
Determine:

* Active
* Deprecated
* Archive Candidate

Status:
Open

---

## TD-003

Title:
Legacy CMS Admin Review

Priority:
Medium

Category:
Architecture

Location:
artifacts/cms-admin

Description:
Current purpose unknown.

Action:
Determine:

* Active
* Deprecated
* Archive Candidate

Status:
Open

---

## TD-004

Title:
Mockup Sandbox Review

Priority:
Low

Category:
Cleanup

Location:
artifacts/mockup-sandbox

Description:
Experimental environment.

Action:
Determine whether assets should be:

* archived
* retained
* promoted

Status:
Open

---

## TD-005

Title:
Governance Folder Consolidation

Priority:
Low

Category:
Governance

Location:
governance/system-map

Description:
Potential duplicate governance structure.

Action:
Review and consolidate if redundant.

Status:
Open

---

## TD-006

Title:
Evidence Layer Classification

Priority:
Medium

Category:
Architecture

Location:
data/evidence*
data/evidence-v2*
data/evidence-v3*
data/evidence-v4*
data/evidence-v5*

Description:
Multiple evidence generations discovered during hygiene review.

Action:
Identify:

* Active version
* Historical versions
* Archive candidates

Status:
Open

---

## TD-007

Title:
Replay Asset Consolidation

Priority:
Medium

Category:
Architecture

Location:
data/replay
data/replay-sandbox
data/historical-replay
data/checkpoints

Description:
Replay-related assets distributed across multiple locations.

Action:
Map ownership and future architecture.

Status:
Open

---

## TD-008

Title:
Intelligence Asset Classification

Priority:
Medium

Category:
Governance

Description:
Intelligence assets have been inventoried but require deeper ownership and lifecycle classification.

Action:
Complete asset classification.

Status:
Open

---

# Closed Items

None

---

# Review Protocol

When closing debt:

1. Record resolution date.
2. Record action taken.
3. Move item to Closed Items.
4. Update relevant governance documents.

### TD-XXX – Currency and Unit Presentation Engine

Priority:
Medium

Description:
Implement automatic value scaling and international currency presentation.

Requirements:

- K/M/B/T scaling
- USD primary presentation
- Local currency secondary presentation
- Consistent graph and article formatting
- Tooltip preservation of original source values

Business Value:
Reduces cognitive load and improves international readability.
