# ARCHITECTURE_PRINCIPLES_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Define the architectural principles that guide ZNBW platform development.

---

# Principle 1 — Layer Separation

ZNBW is organized into distinct layers:

1. Client-Facing Layer
2. Analyst-Facing Layer
3. Smurf Intelligence Engine
4. Infrastructure & Governance Layer

Each layer has a separate purpose and should not directly bypass other layers without explicit justification.

---

# Principle 2 — Package-Based Handoffs

Information should move between major domains through governed packages.

Examples:

- Graph Packages
- Workbench Packages
- Article Packages
- CMS Packages
- Publication Packages

Direct cross-layer access should be avoided unless documented.

---

# Principle 3 — Registry-Driven Knowledge

Important knowledge should be stored in registries, not scattered across scripts or temporary files.

Examples:

- Dataset Registry
- Document Registry
- Evidence Registry
- Experience Registry
- Confidence Registry
- Mechanism Registry
- Asset Registry

---

# Principle 4 — Governance Before Automation

Before automating ingestion, publication, replay, alerts or client-facing outputs, the governing rules must be defined first.

This includes:

- source rules
- confidence rules
- evidence rules
- publication rules
- lineage rules

---

# Principle 5 — Transparency By Design

Where practical, outputs should preserve:

- source
- dataset
- evidence
- confidence
- lineage
- graph/package relationship

Transparency should be preserved internally even when only a simplified public version is shown.

---

# Principle 6 — Extend Before Create

Before creating a new registry, engine, package or workflow, check whether an existing component can be extended.

New components should be created only when extension would create confusion or technical risk.

---

# Principle 7 — No Spaghetti Architecture

Shortcuts that tightly couple layers should be avoided.

Preferred pattern:

Smurf
→ governed package
→ Intelligence Center
→ governed package
→ CMS
→ human review
→ publication

---

# Principle 8 — Governance Repository Is Source Of Truth

The governance repository is the source of truth for:

- system map
- asset inventory
- architecture overview
- technical debt
- audit plans
- protocols

Chat history is not the source of truth.

---

# Principle 9 — Human Approval For Material Changes

Material changes to publication, data ingestion, client access, security, or architecture require human review before production use.

---

# Principle 10 — Document Before Major Refactor

Before major refactoring, create or update the relevant governance document.

This prevents rebuilding, duplicating or deleting components without understanding their role.

---

# Principle 11 — Client Safety Boundary

Client-facing systems must never directly expose internal repositories, raw registries, source code, internal intelligence files, or ungoverned Smurf outputs.

Client-facing outputs must pass through a governed publication or client package layer.

---

# Principle 12 — Archive, Do Not Delete

Legacy components should be classified before removal.

Allowed classifications:

- Active
- Review Required
- Deprecated
- Archive Candidate
- Archived

Deletion should only happen after review and backup.

---

# Principle 13 — Build For Recovery

Every production-critical component should eventually have:

- backup procedure
- restore procedure
- ownership
- deployment notes
- failure mode notes

---

# Principle 14 — Keep Public Outputs Simple

Public articles, dashboards and client-facing outputs should remain understandable.

Advanced evidence, lineage, replay, confidence and scenario details belong in analyst or premium transparency layers unless intentionally exposed.

---

# Principle 15 — Governed Lasagna, Not Spaghetti

ZNBW should grow as layered architecture, not uncontrolled cross-connections.

Layers may connect, but only through defined interfaces, packages, APIs, or governed workflows.

---

# Principle 16 — Minimise Cognitive Load

Public outputs should minimise the amount of mental calculation or interpretation required from readers.

ZNBW should translate data into decisions, not ask users to translate numbers into meaning.

This includes:

- highest meaningful units
- intuitive labels
- clear narratives
- direct comparisons
- avoiding unnecessary calculations by the reader

---

# Principle 17 — International-First Data Presentation

Public articles and dashboards should be understandable for both international and local audiences.

Presentation rules:

- Use the highest meaningful unit (K, M, B, T).
- Use USD as the primary display currency.
- Display the source country's local currency as secondary.
- Preserve original values in tooltips, transparency layers, and exports.
- Graphs, tables, and article narratives should use consistent units and currencies.

Examples:

Singapore:
US$163.5B (S$220.8B)

Indonesia:
US$87.1B (Rp1.42T)

Malaysia:
US$45.3B (RM192.6B)

Incorrect examples:

220.8k million dollars

Output reached 220.8k.
