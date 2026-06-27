# OPERATIONS_REGISTER_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Document operational infrastructure, services and runtime environment.

---

# Production Environment

Hostname:
cloud

Platform:
KVM Virtual Machine

Operating System:
Ubuntu 22.04.5 LTS

Kernel:
5.15.0-177-generic

Architecture:
x86_64

---

# Infrastructure Overview

Internet
↓
Nginx
↓
PM2

├── zenith-api
└── zenith-admin

↓

PostgreSQL

↓

Uploads Storage

↓

Docker

└── znbw-n8n-sandbox

---

# Storage

Filesystem:
/dev/vda1

Capacity:
97 GB

Used:
16 GB

Free:
82 GB

Status:
Healthy

---

# PM2 Services

## zenith-api

Status:
Online

Location:
/opt/Zenith-Bridge-Gateway/artifacts/api-server

Entrypoint:
/opt/Zenith-Bridge-Gateway/artifacts/api-server/dist/index.js

Runtime:
NodeJS 20

Status:
Production

---

## zenith-admin

Status:
Online

Location:
/opt/Zenith-Bridge-Gateway/artifacts/admin-ui

Runtime:
pnpm preview

Port:
5173

Status:
Production

---

# Docker Services

## znbw-n8n-sandbox

Image:
n8nio/n8n:latest

Purpose:
Automation and workflow sandbox.

Port Mapping:
127.0.0.1:5678

Status:
Running

---

# Core Services

## Nginx

Status:
Running

Role:
Reverse Proxy
TLS Termination
Routing Layer

---

## PostgreSQL

Status:
Running

Role:
Primary Persistence Layer

---

# Operational Findings

## OPS-FINDING-001

Ubuntu system restart pending.

Classification:
Low

Status:
Open

---

## OPS-FINDING-002

PM2 restart history exists for zenith-api and zenith-admin.

Likely caused by deployments.

Classification:
Informational

Status:
Open

---

# Disaster Recovery

## Provider-Level Backup Protection

Provider:
TransIP

Protection Type:
Infrastructure-Level Disaster Recovery

Backup Schedule:

- Automated backups approximately every 4 hours
- Weekly backup retention points

Backup Scope:

- Entire VPS
- Operating System
- Applications
- PostgreSQL
- Configuration
- Uploaded Assets
- Governance Repository

Restore Method:

TransIP Control Panel

Notes:

- VPS is powered down during restore.
- Restore overwrites the current VPS state.
- Restore duration depends on VPS size.
- Manual snapshots can be created before major platform changes.

Assessment:

Infrastructure disaster recovery capability verified.

Status:
Active

---

## OPS-FINDING-003

Title:
Provider-Level Disaster Recovery Verified

Description:

TransIP automated VPS backups confirmed through
control panel verification.

Backup cadence includes approximately 4-hourly
recovery points and weekly retention points.

Classification:
Positive Finding

Impact:
High

Status:
Verified

Follow-Up:

Document operational recovery procedures for:

- Database-only recovery
- Governance recovery
- Intelligence asset recovery
- Deployment rollback

---

## OPS-FINDING-004

Title:
PM2 Startup Recovery Enabled

Description:

PM2 process list saved and systemd startup service enabled
for root-managed PM2 services.

Relevant Files:

- /root/.pm2/dump.pm2
- /etc/systemd/system/pm2-root.service

Impact:
Medium

Status:
Verified

---

## OPS-FINDING-005

Title:
Environment Secrets Require Review

Description:

Root .env file exists at:

/opt/Zenith-Bridge-Gateway/.env

The file contains runtime configuration and secret values.
Current values appear development-oriented and should be reviewed
before client-facing expansion.

Classification:
Security / Configuration

Impact:
Medium

Status:
Open

Follow-Up:

Track in SECURITY_SURFACE_v1.

---

# Future Documents

* DEPLOYMENT_REGISTER_v1
* BACKUP_AND_RESTORE_v1
* SECURITY_SURFACE_v1
* DEPENDENCY_REGISTER_v1

---

# Operational Milestone – 2026-06-26

## Title

First Complete Orchestrated Village Execution

## Summary

The ZNBW Intelligence Village successfully completed its first fully governed end-to-end downstream execution.

The following worker chain executed successfully:

```text
Coverage
Graph
Signal
Replay
Workbench
```

Results:

```text
Workers completed: 5
Failures: 0
Bottlenecks: 0
```

## New Components Introduced

* Human Approval Gate
* SysAdmin Troll Governance Layer
* Smurf Registry
* Dependency-aware Promoter Dispatch
* Replay Worker
* Workbench Worker
* Historian
* Village Execution History
* Historian Summary

## Architectural Decisions

### Brainy Smurf

Brainy was removed from the operational pipeline and repositioned as an independent research and architecture layer.

Brainy:

* studies village performance,
* proposes improvements,
* may consult external AI,
* has no production authority.

### AI Governance

AI remains outside the governed ecosystem and may only be consulted through Brainy.

### Village Law #1

No Smurf except approved ingestion Smurfs may acquire external data.

The SysAdmin Troll now enforces this rule.

### Parallel Execution

The Promoter now supports dependency-aware execution.

Current downstream execution plan:

```text
Stage 1
Coverage

Stage 2
Graph
Signal

Stage 3
Replay

Stage 4
Workbench
```

## Replay Status

Replay completed successfully in dry-run mode.

```text
Cases processed: 4
Records replayed: 11
Fleet quality score: 1.00
Mechanism coverage: 1.00
Average calibration score: 0.82
Mechanisms calibrated: 3
```

Production mutation remains disabled.

## Historian Status

Historian successfully recorded the first complete village execution.

This establishes operational memory for:

* runtime analysis,
* bottleneck detection,
* future Brainy optimisation,
* future scaling decisions.

## Significance

This milestone marks the transition from a collection of scripts to an orchestrated intelligence operating system.

