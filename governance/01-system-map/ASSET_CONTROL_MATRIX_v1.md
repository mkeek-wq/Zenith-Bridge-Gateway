# ASSET_CONTROL_MATRIX_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Convert the ZNBW asset inventory into an operational governance matrix.

Related Source:

ASSET_INVENTORY_v1

---

# Background

CODEX_AUDIT_A-002 identified that ZNBW had a broad asset inventory but lacked sufficient governance fields such as canonical location, owner, producer, consumer, lifecycle status, sensitivity, backup class and client-safe status.

This document provides the first operational asset control layer.

---

# Control Fields

| Field | Meaning |
|---|---|
| Asset ID | Stable governance identifier |
| Asset Group | Functional asset group |
| Canonical Location | Primary location or source of truth |
| Status | Active, Active / Review, Future Core, Archive / Review, Legacy Review |
| Owner | Current accountable owner |
| Producer | System or process that creates the asset |
| Consumer | System, workflow or user that consumes the asset |
| Sensitivity | Public, Internal, Sensitive, Restricted |
| Client Safe | Yes, No, Conditional, Future |
| Backup Class | Database, File, Git, VPS Snapshot, Archive |
| Review Priority | High, Medium, Low |

---

# Asset Control Matrix

| Asset ID | Asset Group | Canonical Location | Status | Owner | Producer | Consumer | Sensitivity | Client Safe | Backup Class | Review Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| ACM-001 | Public Website | /var/www/zenith; artifacts/znbw-website | Active / Review | Founder | Website build process | Public visitors | Public | Yes | Git / File / VPS Snapshot | High |
| ACM-002 | Admin UI | /var/www/zenith-admin; artifacts/admin-ui | Active | Founder | Admin UI build process | Founder / admin user | Internal | No | Git / File / VPS Snapshot | High |
| ACM-003 | API Server | artifacts/api-server; PM2 zenith-api | Active | Founder | API build process | Website, Admin UI, API clients | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-004 | PostgreSQL Database | PostgreSQL database: zenith | Active | Founder | API Server / CMS workflows | API Server / Admin UI | Sensitive | No | Database Backup / VPS Snapshot | High |
| ACM-005 | Uploaded Media | uploads/images; /uploads route | Active / Review | Founder | Admin upload workflow | Public website | Public / Internal | Conditional | File / VPS Snapshot | High |
| ACM-006 | Governance Repository | governance/ | Active | Founder | Manual governance process | Founder, Codex, future operators | Internal | No | Git | High |
| ACM-007 | Dataset Registry | artifacts/api-server/data/intelligence | Active / Review | Founder | Dataset governance layer | Intelligence Center | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-008 | Dataset Coverage Engine | artifacts/api-server/data/intelligence | Active | Founder | Coverage engine scripts | Article readiness gates | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-009 | Manual Datasets | artifacts/api-server/data/intelligence/manual-datasets | Active | Founder | Manual data curation | Dataset governance / article generation | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-010 | Parsed Datasets | artifacts/api-server/data/intelligence/parsed-datasets | Active | Founder | Parsing / ingestion process | Dataset governance / intelligence packages | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-011 | Raw Downloads | artifacts/api-server/data/intelligence/raw-downloads | Active Source Intake | Founder | Source download process | Parsing / dataset governance | Internal | No | File / VPS Snapshot | Medium |
| ACM-012 | Document Registry | artifacts/api-server/data/document-registry | Active Core | Founder | Document governance process | Lineage / evidence / datasets | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-013 | Canonical Document Store | artifacts/api-server/data/document-canonical | Active Core | Founder | Document canonicalization process | Lineage / dataset governance | Internal | Conditional | File / VPS Snapshot | High |
| ACM-014 | Document Archive | artifacts/api-server/data/document-archive | Active Archive | Founder | Source archiving process | Lineage / audit / historical review | Internal | No | File / VPS Snapshot | Medium |
| ACM-015 | Ingestion Pipeline | artifacts/api-server/data/ingestion | Active Core | Founder | Controlled ingestion scripts | Dataset governance / promotion gates | Internal | No | Git / File / VPS Snapshot | High |
| ACM-016 | Ingestion Promotion Gates | artifacts/api-server/data/ingestion/promotion-gates | Active Governance | Founder | Ingestion governance scripts | Production promotion process | Internal | No | Git / File / VPS Snapshot | High |
| ACM-017 | Article Packages | artifacts/api-server/data/intelligence | Active | Founder | Article generation scripts | Workbench / CMS Package Intake | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-018 | OpenAI Article Packages | artifacts/api-server/data/intelligence | Active | Founder | OpenAI article generation scripts | Editorial review / CMS Package Intake | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-019 | Workbench Packages | artifacts/api-server/data/intelligence | Active | Founder | Article workbench generator | Human analyst / Transparency layer | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-020 | CMS Packages | artifacts/api-server/data/intelligence; artifacts/api-server/data/cms | Active / Review | Founder | CMS bridge process | Admin UI / CMS draft workflow | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-021 | Graph Data Packages | artifacts/api-server/data/intelligence | Active | Founder | Graph data generator | Graph renderer / article packages | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-022 | Graph Specification Packages | artifacts/api-server/data/intelligence | Active | Founder | Graph spec generator | Graph renderer / article packages | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-023 | Graph Attachments | artifacts/api-server/data/intelligence | Active | Founder | Graph attachment process | CMS packages / public articles | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-024 | Confidence Framework | artifacts/api-server/data/intelligence | Active | Founder | Confidence engines | Workbench / Transparency layer | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-025 | Evidence Assessment | artifacts/api-server/data/intelligence | Active | Founder | Evidence assessment engine | Confidence / Workbench / Publication gates | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-026 | Evidence Lineage | artifacts/api-server/data/intelligence | Active | Founder | Evidence lineage engine | Lineage model / publication gates | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-027 | Counter Evidence | artifacts/api-server/data/intelligence | Active | Founder | Counter-evidence engine | Confidence / falsification / review | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-028 | Falsification Registry | artifacts/api-server/data/intelligence | Active | Founder | Falsification process | Mechanism review / confidence review | Internal | No | Git / File / VPS Snapshot | Medium |
| ACM-029 | Case Files | artifacts/api-server/data/cases | Active Core | Founder | Case construction process | Intelligence engine / Workbench | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-030 | Case History | artifacts/api-server/data/case-history | Active Core | Founder | Case closure / historical memory process | Experience registry / replay | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-031 | Experience Registry | artifacts/api-server/data/intelligence | Active / Review | Founder | Experience extraction engine | Confidence / decision support | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-032 | Mechanism Registry | artifacts/api-server/data/intelligence | Active / Review | Founder | Mechanism discovery/scoring engines | Case analysis / confidence / workbench | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-033 | Mechanism Validation | artifacts/api-server/data/intelligence | Active / Review | Founder | Mechanism validation process | Promotion gates / confidence | Internal | Conditional | Git / File / VPS Snapshot | High |
| ACM-034 | Macro Attribution | artifacts/api-server/data/intelligence | Active / Review | Founder | Macro attribution engine | Intelligence packages / article generation | Internal | Conditional | Git / File / VPS Snapshot | Medium |
| ACM-035 | Macro Coverage | artifacts/api-server/data/intelligence | Active / Review | Founder | Macro coverage assessment | Dataset governance / confidence | Internal | Conditional | Git / File / VPS Snapshot | Medium |
| ACM-036 | Replay Assets | artifacts/api-server/data/replay; artifacts/api-server/data/historical-replay | Future Core / Review | Founder | Replay engine scripts | Future replay / decision support | Internal | Future | Git / File / VPS Snapshot | High |
| ACM-037 | Decision Support Assets | artifacts/api-server/data/intelligence | Future Core / Review | Founder | Decision support engines | Future decision support / client products | Internal | Future | Git / File / VPS Snapshot | High |
| ACM-038 | Early Warning Assets | artifacts/api-server/data/intelligence | Future Core / Review | Founder | Early warning signal skeleton | Future monitoring / alerts | Internal | Future | Git / File / VPS Snapshot | Medium |
| ACM-039 | Monitoring Runs | artifacts/api-server/data/monitoring-runs | Active Ops | Founder | Monitoring processes | Operations review | Internal | No | File / VPS Snapshot | Medium |
| ACM-040 | Maintenance Records | artifacts/api-server/data/maintenance | Active Ops | Founder | Maintenance process | Operations review | Internal | No | File / VPS Snapshot | Medium |
| ACM-041 | Legacy CMS | artifacts/cms | Review Required | Founder | Legacy CMS flow | Unknown / review | Internal | No | Git / Archive | Medium |
| ACM-042 | Legacy CMS Admin | artifacts/cms-admin | Review Required | Founder | Legacy CMS admin flow | Unknown / review | Internal | No | Git / Archive | Medium |
| ACM-043 | Mockup Sandbox | artifacts/mockup-sandbox | Review Required | Founder | Experiments / mockups | Design review | Internal | No | Git / Archive | Low |
| ACM-044 | API Contract | lib/api-spec/openapi.yaml | Active / Review | Founder | API contract maintenance | API Zod / React client generation | Internal | No | Git | High |
| ACM-045 | API Zod Layer | lib/api-zod | Active / Generated | Founder | Contract generation | API Server / validation | Internal | No | Git / Generated | High |
| ACM-046 | React API Client | lib/api-client-react | Active / Generated | Founder | Contract generation | Frontend clients | Internal | No | Git / Generated | Medium |
| ACM-047 | DB Schema Library | lib/db | Active / Review | Founder | Database schema maintenance | API Server / migrations | Sensitive | No | Git | High |

---

# Client Safety Definitions

| Client Safe | Meaning |
|---|---|
| Yes | Can be exposed publicly or to clients after normal review |
| Conditional | May be exposed through curated summaries, public articles or transparency views after review |
| No | Internal only |
| Future | Not client-safe yet; may support future products after governance |

---

# Sensitivity Definitions

| Sensitivity | Meaning |
|---|---|
| Public | Intended for public consumption |
| Internal | Internal platform or analytical material |
| Sensitive | Contains credentials, users, operational data or unpublished business-critical data |
| Restricted | Should only be accessed by explicitly authorized operators |

---

# Backup Class Definitions

| Backup Class | Meaning |
|---|---|
| Git | Version-controlled recovery |
| File | Filesystem backup required |
| Database Backup | PostgreSQL logical backup required |
| VPS Snapshot | Provider-level infrastructure backup |
| Archive | Archive-only recovery |
| Generated | Regenerable from source |

---

# Current Gaps

1. Many canonical locations are still broad directory paths rather than exact files.

2. Client-safe status is provisional.

3. Several future-core assets require review before product expansion.

4. Legacy CMS and mockup assets remain unresolved.

5. Generated artifacts need a clear commit/regenerate policy.

6. Sensitive files and operational secrets must remain excluded from Git.

---

# Related Documents

ASSET_INVENTORY_v1
SYSTEM_MAP_v1
LINEAGE_MODEL_v1
REPOSITORY_STATE_CLASSIFICATION_v1
DATABASE_BACKUP_AND_RESTORE_v1
API_SURFACE_STANDARD_v1
