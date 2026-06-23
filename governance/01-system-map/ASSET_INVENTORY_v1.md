# ASSET_INVENTORY_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Inventory of major ZNBW platform assets.

---

# Intelligence Assets

| Asset                 | Status | Purpose                                 | Location    |
| --------------------- | ------ | --------------------------------------- | ----------- |
| Dataset Registry      | Active | Dataset governance                      | TO COMPLETE |
| Coverage Engine       | Active | Dataset readiness & coverage validation | TO COMPLETE |
| Asset Registry        | Active | Asset governance                        | TO COMPLETE |
| Graph Packages        | Active | Graph generation layer                  | TO COMPLETE |
| Intelligence Packages | Active | Intelligence output packages            | TO COMPLETE |
| CMS Packages          | Active | CMS bridge packages                     | TO COMPLETE |
| Publication Packages  | Active | Publication workflow                    | TO COMPLETE |

---

# Data Layer Inventory — First Discovery Pass

Source:
artifacts/api-server/data

Discovered folders:

| Folder | Status | Purpose |
|---|---|---|
| data/article-generator | Active / Review | Article generation packages, briefs, evidence, insight, verified metrics, Smurf article seeds |
| data/case-history | Active | Historical case memory |
| data/cases | Active | Current case files, case index and investigation queue |
| data/checkpoints | Archive / Review | Smurf development checkpoints and approved snapshots |
| data/cms/drafts | Active / Legacy Review | CMS draft JSON files from earlier draft pipeline |

Initial finding:
The data layer already contains early replay-engine, case-memory, experience-registry and article-generation assets. These should be mapped before Smurf expansion continues.

---

# Data Directory Classification

Source:
artifacts/api-server/data

## Active Core Layers

| Folder | Classification | Notes |
|---|---|---|
| data/intelligence | Active Core | Current Intelligence Center data layer |
| data/article-generator | Active Core / Review | Article package and Smurf article generation assets |
| data/cases | Active Core | Current case files and investigation queue |
| data/case-history | Active Core | Persistent case history |
| data/cms | Active / Review | CMS draft bridge artifacts |
| data/ingestion | Active Core | Controlled ingestion pipeline |
| data/replay | Active / Future Core | Replay engine assets |
| data/document-registry | Active Core | Document registry |
| data/document-canonical | Active Core | Canonical document storage |
| data/evidence-v5 | Active / Review | Latest evidence generation layer candidate |

## Archive / Historical Development Layers

| Folder | Classification | Notes |
|---|---|---|
| data/checkpoints | Archive / Review | Historical Smurf snapshots and approved checkpoints |
| data/evidence | Archive / Review | Older evidence layer |
| data/evidence-v2 | Archive / Review | Older evidence layer |
| data/evidence-v3 | Archive / Review | Older evidence layer |
| data/evidence-v4 | Archive / Review | Older evidence layer |
| data/replay-sandbox | Archive / Review | Replay testing / sandbox outputs |
| data/historical-discovery-tests | Archive / Review | Historical experiments |
| data/tablebuilder-tests | Archive / Review | TableBuilder access experiments |
| data/tablebuilder-access-tests | Archive / Review | TableBuilder access experiments |
| data/tablebuilder-discovery | Archive / Review | TableBuilder discovery experiments |

## Data Intake / Source Management

| Folder | Classification | Notes |
|---|---|---|
| data/intelligence/raw-downloads | Active Source Intake | Raw intelligence downloads |
| data/intelligence/parsed-datasets | Active Dataset Layer | Parsed datasets |
| data/intelligence/manual-datasets | Active Dataset Layer | Manually governed datasets |
| data/intelligence/source-download-config | Active Config | Source download configuration |
| data/document-archive | Active Archive | Source documents |
| data/document-candidates | Active Intake | Candidate documents |
| data/ingestion/raw | Active Intake | Raw ingestion area |
| data/ingestion/pending | Active Intake | Pending ingestion |
| data/ingestion/processed | Active Intake | Processed ingestion |
| data/ingestion/rejected | Active Intake | Rejected ingestion |
| data/ingestion/promotion-gates | Active Governance | Ingestion promotion gates |
| data/ingestion/reports | Active Governance | Ingestion reports |

## Replay / Future Intelligence

| Folder | Classification | Notes |
|---|---|---|
| data/replay/input | Future Core | Replay input |
| data/replay/output | Future Core | Replay output |
| data/replay/evaluations | Future Core | Replay evaluations |
| data/replay/fleet | Future Core | Replay fleet |
| data/replay/run-manifests | Future Core | Replay run manifests |
| data/historical-replay | Future Core / Review | Historical replay assets |

## Monitoring / Operations

| Folder | Classification | Notes |
|---|---|---|
| data/maintenance | Active Ops | Maintenance records |
| data/monitoring-runs | Active Ops | Monitoring runs |

---

# Intelligence Layer Functional Map

Source:
artifacts/api-server/data/intelligence

## Article Production Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Article Packages | Active | article-draft-package, article-preview-package, article-intelligence-package | Article construction and preview |
| OpenAI Article Packages | Active | openai-article-package-v0.1-v0.4, openai-generated-article-package | AI-assisted article generation |
| Article Workbench Packages | Active | article-workbench-package-v0.1-v0.2 | Review and transparency layer |
| CMS Packages | Active | cms-draft-package, cms-publication-package | Bridge to CMS publication workflow |
| Article Graph Attachments | Active | article-graph-attachment-package | Graph attachment layer |

## Dataset Governance Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Dataset Coverage | Active | dataset-coverage-engine | Dataset readiness and coverage validation |
| Readiness Gates | Active | article-data-readiness-gate, bulk-ingestion-readiness-check | Controls before article or bulk ingestion |
| Manual Datasets | Active | manual-datasets | Governed manual data inputs |
| Parsed Datasets | Active | parsed-datasets | Parsed verified datasets |
| Raw Downloads | Active | raw-downloads | Source downloads |

## Graph Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Graph Data Packages | Active | graph-data-package | Graph data layer |
| Graph Specifications | Active | graph-specification-package | Graph design/specification layer |
| Graph Attachments | Active | article-graph-attachment-package | Article graph binding |

## Workbench / Transparency Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Workbench Packages | Active | article-workbench-package | Human review and transparency surface |
| Confidence Framework | Active | confidence-framework, intelligence-confidence-registry | Confidence scoring |
| Evidence Assessment | Active | evidence-assessment-engine, evidence-lineage-engine | Evidence evaluation and lineage |
| Counter Evidence | Active | counter-evidence-engine, counter-evidence-registry | Falsification and challenge layer |
| Falsification Registry | Active | falsification-registry | Mechanism challenge governance |

## Case Memory / Learning Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Case Construction | Active / Review | case-construction-engine, case-evolution-engine | Case creation and lifecycle |
| Case Similarity | Active / Review | case-fingerprints, case-similarity | Historical similarity logic |
| Historical Outcomes | Active / Review | historical-outcomes-v0.1-v0.2 | Outcome memory |
| Experience Registry | Active / Review | experience-registry-v0.1-v0.2 | Learning memory |

## Mechanism Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Mechanism Discovery | Active / Review | mechanism-discovery-engine | Driver/mechanism discovery |
| Mechanism Scoring | Active / Review | mechanism-scoring-engine | Mechanism strength scoring |
| Mechanism Validation | Active / Review | mechanism-validation-registry, mechanism-validation-review-queue | Validation and promotion governance |
| Mechanism Lifecycle | Active / Review | mechanism-lifecycle-registry, mechanism-lifecycle-promotion-gate | Lifecycle management |

## Macro Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Macro Attribution | Active / Review | macro-attribution-engine, macro-attribution-report | Macro driver attribution |
| Macro Coverage | Active / Review | macro-coverage-assessment | Macro data coverage |
| Macro Registry | Active / Review | macro-registry-engine | Macro registry layer |
| Macro Transmission | Active / Review | macro-transmission-engine | Macro-to-sector transmission logic |
| Macro Driver Concentration | Active / Review | macro-driver-concentration-engine | Concentration analysis |

## Replay / Decision Support Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Historical Replay | Future Core / Review | historical-replay-attribution-engine | Replay-related attribution |
| Decision Support | Future Core / Review | decision-support-engine-v0.1-v0.2 | Future decision support |
| Early Warning | Future Core / Review | early-warning-signal-skeleton | Future alerting layer |
| Monitoring Triggers | Future Core / Review | monitoring-trigger-engine | Future monitoring layer |

## Ingestion Governance Layer

| Asset Group | Status | Examples | Notes |
|---|---|---|---|
| Controlled Ingestion | Active / Review | controlled-bulk-ingestion-batch, controlled-staging-executor | Bulk ingestion governance |
| Duplicate Review | Active / Review | dry-run-duplicate-review-engine | Duplicate prevention |
| Post-Ingestion Review | Active / Review | post-ingestion-comparison-engine | Validation after ingestion |
| Data Requests | Active | data-request-queue | Queue for missing or requested data |

---

# Workbench Assets

| Asset                 | Status | Purpose                              | Location    |
| --------------------- | ------ | ------------------------------------ | ----------- |
| Workbench             | Active | Intelligence review and transparency | TO COMPLETE |
| Transparency Metadata | Active | Confidence and evidence layer        | TO COMPLETE |
| Opportunity Queue     | Active | Candidate generation                 | TO COMPLETE |
| Concentration Engine  | Active | Concentration analysis               | TO COMPLETE |
| Diversity Engine      | Active | Diversity analysis                   | TO COMPLETE |

---

# Infrastructure Assets

| Asset                 | Status | Purpose                  | Location       |
| --------------------- | ------ | ------------------------ | -------------- |
| PostgreSQL            | Active | Persistent storage       | Production DB  |
| Upload Storage        | Active | Images and media assets  | uploads/images |
| Governance Repository | Active | Governance documentation | governance/    |

---

# Review Required

| Asset                    | Status          | Notes                         |
| ------------------------ | --------------- | ----------------------------- |
| artifacts/cms            | Review Required | Unknown current role          |
| artifacts/cms-admin      | Review Required | Unknown current role          |
| artifacts/mockup-sandbox | Review Required | Experimental or legacy        |
| governance/system-map    | Review Required | Potential duplicate structure |

---

# Admin UI Route Inventory

Source:
artifacts/admin-ui/src/App.tsx

| Route | Status | Purpose |
|---|---|---|
| / | Active | Admin root redirect / landing |
| /login | Active | Admin login |
| /dashboard | Active | Article dashboard |
| /editor | Active | New article editor |
| /editor/:id | Active | Existing article editor |
| /intelligence | Active | Intelligence Center |
| /intelligence-assets | Review | Intelligence asset list |
| /intelligence-assets/:assetId | Review | Intelligence asset detail |
| /intelligence-candidates | Active / Review | Candidate registry |
| /intelligence-preview/:candidateId | Active | Intelligence article preview |
| /intelligence-datasets | Active | Dataset registry / datasets view |
| /intelligence-graph-packages | Active | Graph package view |
| /article-workbench | Active | Workbench layer |
| /publication-queue | Review / Candidate for removal | Older publication queue flow |
| /cms-package-intake | Active | Intelligence → CMS bridge |
| * | Active | Fallback route |

---

# Admin Sidebar Inventory

Source:
artifacts/admin-ui/src/layouts/AdminLayout.tsx

## Editorial

| Item | Status | Route / Notes |
|---|---|---|
| Articles | Active | /dashboard |
| New Article | Active | /editor |
| Media Library | Disabled | Future |
| Categories | Disabled | Future |

## Intelligence

| Item | Status | Route / Notes |
|---|---|---|
| Publication Queue | Review | /publication-queue |
| CMS Package Intake | Active | /cms-package-intake |
| Intelligence Center | Active | /intelligence |
| Intelligence Assets | Review | /intelligence-assets |
| Datasets | Active | /intelligence-datasets |
| Graph Packages | Active | /intelligence-graph-packages |
| Article Workbench | Active | /article-workbench |
| Analytics | Disabled | Future |
| BI Dashboards | Disabled | Future |
| Reports | Disabled | Future |

## Clients

| Item | Status | Route / Notes |
|---|---|---|
| Organizations | Disabled | Future client portal |
| Users & Roles | Disabled | Future client portal |
| Permissions | Disabled | Future client portal |

## Platform

| Item | Status | Route / Notes |
|---|---|---|
| Google Analytics | Active External | analytics.google.com |
| Integrations | Disabled | Future |
| Settings | Disabled | Future |

---

# API Surface Inventory

Source:
artifacts/api-server/src/app.ts
artifacts/api-server/src/routes/v1/index.ts

## Public Endpoints

| Endpoint | Status | Purpose |
|---|---|---|
| /health | Active | Platform health check |
| /api/v1/health | Active | API health endpoint |
| /api/v1/auth | Active | Authentication |
| /api/v1/articles | Active | CMS article operations |
| /api/v1/upload | Active | Image upload system |
| /api/v1/contact | Active | Public contact form |

## Admin Intelligence Endpoints

| Endpoint | Status | Purpose |
|---|---|---|
| /api/admin/intelligence-preview | Active | Intelligence preview generation |
| /api/admin/intelligence-promote | Active | Intelligence promotion workflows |

## Disabled / Legacy

| Endpoint | Status | Notes |
|---|---|---|
| /api/v1/admin | Disabled | Explicitly disabled legacy admin API |

---

# Findings Log

| ID              | Date       | Finding                                                |
| --------------- | ---------- | ------------------------------------------------------ |
| HYG-FINDING-001 | 2026-06-23 | Duplicate component definitions found in SYSTEM_MAP_v1 |
| HYG-FINDING-002 | 2026-06-23 | governance/system-map requires review                  |
| HYG-FINDING-003 | 2026-06-23 | artifacts/cms requires review                          |
| HYG-FINDING-004 | 2026-06-23 | artifacts/cms-admin requires review                    |
| HYG-FINDING-005 | 2026-06-23 | artifacts/mockup-sandbox requires review               |
| HYG-FINDING-006 | 2026-06-23 | artifacts/api-server/data contains multiple active intelligence sublayers requiring structured mapping |
| HYG-FINDING-007 | 2026-06-23 | data/checkpoints contains historical Smurf development snapshots that may be useful but should be classified as archive/review |
| HYG-FINDING-008 | 2026-06-23 | replay-related assets already exist in checkpoints and should be reviewed before building Replay Engine v1 |
| HYG-FINDING-009 | 2026-06-23 | data/ contains multiple overlapping evidence versions that need archival classification |
| HYG-FINDING-010 | 2026-06-23 | replay assets already exist across data/replay, data/replay-sandbox and checkpoints; review required before Replay Engine expansion |
| HYG-FINDING-011 | 2026-06-23 | ingestion pipeline already has raw/pending/processed/rejected/promotion-gates structure and should be documented before automation |
| HYG-FINDING-012 | 2026-06-23 | document archive and document registry layers exist and should be included in source lineage governance |
| HYG-FINDING-013 | 2026-06-23 | data/intelligence contains mature layers for article generation, graphing, workbench, evidence, mechanisms, macro attribution, replay and decision support |
| HYG-FINDING-014 | 2026-06-23 | Several future-core systems already exist as early versions and should be reviewed before rebuilding, especially replay, decision support and early warning |
| HYG-FINDING-015 | 2026-06-23 | Intelligence assets should be governed by function, not individual file count, to prevent documentation overload |
| HYG-FINDING-016 | 2026-06-23 | Admin UI exposes both current CMS Bridge route and older Publication Queue route; publication-queue should be reviewed for retirement or merge |
| HYG-FINDING-017 | 2026-06-23 | Sidebar still exposes Publication Queue even though CMS Package Intake is now the preferred bridge; review for removal or archival |
| HYG-FINDING-018 | 2026-06-23 | Client portal navigation placeholders already exist but are disabled; useful roadmap marker |
| HYG-FINDING-019 | 2026-06-23 | Legacy admin API explicitly disabled and should be documented as retired architecture |
| HYG-FINDING-020 | 2026-06-23 | Intelligence preview and promote routes sit outside standard /api/v1 structure and should be reviewed during architecture audit |
| HYG-FINDING-021 | 2026-06-23 | API surface currently appears lean and manageable, which is positive for maintainability |
