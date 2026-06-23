# DEPENDENCY_REGISTER_v1

Status: Active

Version: 1.0

Last Updated: 2026-06-23

Purpose:

Document critical dependencies required for operation, deployment, maintenance and future development of the Zenith Nova Bridge Wave platform.

---

# Dependency Philosophy

Dependencies should be:

- Known
- Documented
- Justified
- Monitored

Critical dependencies should have documented recovery or replacement options where practical.

---

# Infrastructure Dependencies

## TransIP

Type:

Infrastructure Provider

Purpose:

- VPS hosting
- Backup services
- Disaster recovery

Criticality:

Critical

Failure Impact:

Platform unavailable

---

## Ubuntu 22.04.5 LTS

Type:

Operating System

Purpose:

Runtime platform

Criticality:

Critical

Failure Impact:

Platform unavailable

---

# Runtime Dependencies

## NodeJS

Version:

20.x

Purpose:

Application runtime

Used By:

- zenith-api
- zenith-admin

Criticality:

Critical

---

## pnpm

Purpose:

Package management

Used By:

- API builds
- Admin builds

Criticality:

High

---

## PM2

Purpose:

Process management

Used By:

- zenith-api
- zenith-admin

Criticality:

High

---

# Data Dependencies

## PostgreSQL

Database:

zenith

Purpose:

Primary persistence layer

Criticality:

Critical

Failure Impact:

Application data unavailable

---

# Web Layer Dependencies

## Nginx

Purpose:

- Reverse proxy
- TLS termination
- Routing

Criticality:

Critical

---

## Let's Encrypt

Purpose:

TLS certificates

Domains:

- zenithnovabridgewave.com
- api.zenithnovabridgewave.com

Criticality:

High

Failure Impact:

HTTPS disruption

---

# Development Dependencies

## Git

Purpose:

Version control

Criticality:

Critical

---

## GitHub

Purpose:

Source code repository

Criticality:

High

Failure Impact:

Reduced recovery capability

---

# Intelligence Dependencies

## OpenAI

Purpose:

Article generation
Intelligence processing
AI-assisted workflows

Criticality:

High

Failure Impact:

Intelligence generation degraded

---

# Experimental Dependencies

## Docker

Purpose:

Container runtime

Criticality:

Medium

Used By:

- n8n sandbox

---

## n8n

Purpose:

Workflow automation experimentation

Criticality:

Low

Status:

Non-critical sandbox component

---

# Internal Platform Dependencies

## Governance Repository

Location:

/opt/Zenith-Bridge-Gateway/governance

Purpose:

Institutional memory
Architecture documentation
Operational documentation

Criticality:

Critical

---

## Intelligence Assets

Purpose:

Core analytical capability

Examples:

- Cases
- Signals
- Mechanisms
- Experience Registry
- Replay Assets
- Intelligence Packages

Criticality:

Critical

---

# Dependency Findings

## DEP-FINDING-001

Title:

Infrastructure Dependency Concentration

Description:

Primary infrastructure currently depends on a single VPS provider.

Impact:

Medium

Status:

Accepted

---

## DEP-FINDING-002

Title:

OpenAI Dependency

Description:

Certain intelligence workflows depend on OpenAI services.

Impact:

Medium

Status:

Accepted

---

## DEP-FINDING-003

Title:

Governance Repository Is Mission Critical

Description:

Governance repository now functions as institutional memory and operational source of truth.

Impact:

High

Status:

Verified

---

# Future Improvements

- Track major version dependencies
- Track upgrade history
- Track dependency ownership
- Add dependency review schedule
- Add third-party risk review process

---

# Related Documents

OPERATIONS_REGISTER_v1

BACKUP_AND_RESTORE_v1

DEPLOYMENT_REGISTER_v1

SECURITY_SURFACE_v1

SYSTEM_MAP_v1

ASSET_INVENTORY_v1
