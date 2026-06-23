# SYSTEM_MAP_v1

Status: Active
Version: 1.1
Last Updated: 2026-06-23

Purpose:
Provide a high-level overview of the Zenith Nova Bridge Wave platform, its major layers, runtime components, intelligence systems and governance structure.

---

# Platform Overview

Zenith Nova Bridge Wave is a governed intelligence platform consisting of four major layers:

1. Client-Facing Layer
2. Analyst-Facing Layer
3. Smurf Intelligence Engine Layer
4. Infrastructure & Governance Layer

The platform combines public publishing, analyst workflows, intelligence asset generation, dataset governance, graph packages, article pipelines and operational governance.

---

# Layer Model

## Layer 1 — Client-Facing Layer

Purpose:
Expose ZNBW outputs to external audiences and future clients.

Components:

- Public Website
- Published Articles
- Future Client Portal
- Future Client Dashboards
- Future Premium Transparency Views

Primary Locations:

- artifacts/znbw-website
- /var/www/zenith

Status:
Active / Expanding

---

## Layer 2 — Analyst-Facing Layer

Purpose:
Support internal intelligence review, article preparation, dataset review, graph package review and CMS preparation.

Components:

- Admin CMS
- Intelligence Center
- Workbench
- Dataset Registry
- Graph Packages
- CMS Package Intake
- Article Preview
- Publication Workflow

Primary Location:

artifacts/admin-ui

Status:
Active

---

## Layer 3 — Smurf Intelligence Engine Layer

Purpose:
Generate, classify, evaluate, challenge and reuse intelligence assets.

Components:

- Cases
- Signals
- Evidence
- Mechanisms
- Experience Registry
- Confidence Framework
- Counter-Evidence Layer
- Falsification Registry
- Macro Attribution
- Historical Replay Foundations
- Decision Support Foundations
- Early Warning / Monitoring Foundations

Primary Location:

artifacts/api-server/data

Status:
Active / Review / Future Core

Notes:
Several future capabilities already have early foundations and require discovery before new development.

---

## Layer 4 — Infrastructure & Governance Layer

Purpose:
Operate, protect, document and govern the platform.

Components:

- VPS
- Ubuntu
- Nginx
- PM2
- PostgreSQL
- Docker
- n8n Sandbox
- Git Repository
- Governance Repository
- Technical Debt Register
- Backup and Recovery Documentation
- Deployment Register
- Security Surface Register
- Dependency Register

Primary Locations:

- /opt/Zenith-Bridge-Gateway
- /opt/Zenith-Bridge-Gateway/governance

Status:
Active

---

# Runtime Infrastructure

## VPS

Provider:
TransIP

Hostname:
cloud

Purpose:
Primary production server.

Location:
/opt/Zenith-Bridge-Gateway

Dependencies:

- Ubuntu 22.04.5 LTS
- Nginx
- PM2
- NodeJS
- PostgreSQL
- Docker

Status:
Active

---

## Nginx

Purpose:
Reverse proxy, TLS termination and routing.

Public Routes:

- zenithnovabridgewave.com
- www.zenithnovabridgewave.com
- api.zenithnovabridgewave.com
- /admin

Status:
Active

---

## PM2

Purpose:
Application process management and startup recovery.

Managed Services:

- zenith-api
- zenith-admin

Status:
Active

---

## PostgreSQL

Purpose:
Primary persistence layer.

Database:
zenith

Exposure:
Localhost only

Status:
Active

---

## Docker / n8n Sandbox

Purpose:
Workflow experimentation and automation sandbox.

Exposure:
Localhost only

Status:
Non-critical / Experimental

---

# Platform Components

## Public Website

Purpose:
Public-facing ZNBW website and article consumption.

Source Location:
artifacts/znbw-website

Production Web Root:
/var/www/zenith

Status:
Active

---

## Admin CMS / Intelligence Admin UI

Purpose:
Admin interface for CMS, Intelligence Center, CMS Package Intake, article workflows, datasets, graph packages and workbench views.

Source Location:
artifacts/admin-ui

Production Web Root:
/var/www/zenith-admin

Status:
Active

---

## API Server

Purpose:
Backend services, API routes, article persistence, CMS draft creation, intelligence preview and promotion routes.

Source Location:
artifacts/api-server

Runtime Entry:
artifacts/api-server/dist/index.js

Port:
8080

Status:
Active

---

## Database Library

Purpose:
Shared database schema and database access layer.

Location:
lib/db

Status:
Active

---

## API Contract / Zod Layer

Purpose:
Generated API types and validation schemas.

Locations:

- lib/api-spec
- lib/api-zod
- lib/api-client-react

Status:
Active

---

## Legacy / Candidate CMS Artifacts

Purpose:
Older CMS/admin implementations or intermediate builds.

Locations:

- artifacts/cms
- artifacts/cms-admin

Status:
Review required during hygiene phase

---

## Mockup Sandbox

Purpose:
UI experiments and design sandbox.

Location:
artifacts/mockup-sandbox

Status:
Non-production / review required

---

## Scripts

Purpose:
Operational, automation and watchdog scripts.

Locations:

- scripts
- scripts/src
- scripts/watchdog

Status:
Review required

---

## Uploads

Purpose:
Uploaded image assets.

Location:
uploads/images

Status:
Active / asset governance required

---

# Intelligence Functional Areas

## Article Production Layer

Purpose:
Create intelligence-backed article packages, OpenAI generation packages, preview packages and CMS packages.

Status:
Active

---

## Dataset Governance Layer

Purpose:
Manage dataset readiness, manual datasets, parsed datasets, raw downloads and readiness gates.

Status:
Active

---

## Graph Generation Layer

Purpose:
Create graph data packages, graph specifications and article graph attachments.

Status:
Active

---

## Workbench / Transparency Layer

Purpose:
Support human review, confidence scoring, evidence review and future transparency panels.

Status:
Active / Strategic

---

## Case Memory / Learning Layer

Purpose:
Preserve historical cases, outcomes, case similarity and experience registry assets.

Status:
Active / Review

---

## Mechanism Layer

Purpose:
Discover, score, validate and govern market mechanisms and causal drivers.

Status:
Active / Review

---

## Macro Layer

Purpose:
Assess macro attribution, macro coverage, macro transmission and driver concentration.

Status:
Active / Review

---

## Replay / Decision Support Layer

Purpose:
Support future historical replay, scenario analysis, early warning, monitoring triggers and client-specific decision support.

Status:
Future Core / Foundations Exist

---

# Publication Pipeline

Current Flow:

Dataset
→ Dataset Governance
→ Intelligence Candidate
→ Workbench Review
→ Graph Package
→ Article Package
→ OpenAI Article Generation
→ Article Preview
→ CMS Package Intake
→ CMS Draft
→ Editorial Review
→ Publication

Status:
Active

---

# Governance Repository

Location:
/opt/Zenith-Bridge-Gateway/governance

Purpose:
Source of truth for architecture, system documentation, operations, audits, technical debt and future governance.

Current Governance Areas:

- 01-system-map
- 02-architecture
- 05-operations
- 07-audits
- 08-technical-debt

Status:
Active

---

# Operations Governance

Current Documents:

- DOCUMENTATION_PROTOCOL_v1
- OPERATIONS_REGISTER_v1
- BACKUP_AND_RESTORE_v1
- DEPLOYMENT_REGISTER_v1
- SECURITY_SURFACE_v1
- DEPENDENCY_REGISTER_v1

Status:
HYG-005 Complete

---

# Current Strategic Assessment

ZNBW has moved from prototype build mode into governed platform mode.

The intelligence article pipeline is workable.

The next strategic priority is hygiene, asset discovery, classification and consolidation before major new platform expansion.

Key principle:

Discover
→ Connect
→ Reuse

before

Build
→ Build
→ Build
