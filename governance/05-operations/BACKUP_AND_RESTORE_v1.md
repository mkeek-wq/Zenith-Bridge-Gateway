# BACKUP_AND_RESTORE_v1

Status: Active

Version: 1.0

Last Updated: 2026-06-23

Purpose:

Document backup protections, recovery capabilities and restoration procedures for the Zenith Nova Bridge Wave platform.

---

# Recovery Philosophy

ZNBW recovery operates across two layers:

1. Infrastructure Recovery
2. Operational Recovery

Infrastructure recovery protects against catastrophic system failure.

Operational recovery protects against accidental deletion, failed deployments, configuration errors and data corruption.

---

# Recovery Objectives

Primary Objectives:

- Preserve platform availability
- Preserve intelligence assets
- Preserve governance assets
- Preserve source code
- Preserve database integrity

Recovery Priorities:

1. Infrastructure
2. Source Code
3. Governance Repository
4. Intelligence Assets
5. Database
6. Client-Facing Applications

---

# Infrastructure Recovery

## Provider

TransIP

## Recovery Type

Managed VPS Backup Service

## Backup Schedule

Daily Recovery Points:

Approximately every 4 hours.

Weekly Recovery Points:

Weekly retention backups.

## Scope

Infrastructure backups include:

- Operating System
- Application Files
- Configuration Files
- PostgreSQL Database
- Governance Repository
- Uploaded Assets
- Intelligence Assets
- Nginx Configuration
- PM2 Configuration

## Restore Method

Recovery performed through TransIP Control Panel.

## Notes

- VPS is automatically shut down during restore.
- Recovery overwrites current VPS state.
- Recovery duration depends on VPS size.
- Manual snapshots may be created before major platform changes.

Status:

Verified

---

# Source Code Recovery

## Repository

Zenith-Bridge-Gateway

## Protection Mechanism

Git Version Control

## Recovery Method

Restore from:

- Git repository
- Previous commits
- Branch history

Recovery Scope:

- Application Code
- Governance Repository
- Configuration Files

Status:

Active

---

# Governance Recovery

Location:

/opt/Zenith-Bridge-Gateway/governance

Protection:

- Git repository
- VPS backup protection

Recovery Options:

1. Git restoration
2. VPS restoration

Priority:

Critical

Reason:

Governance Repository serves as institutional memory and source of truth.

---

# Intelligence Asset Recovery

Locations include:

- data/intelligence
- dataset registries
- graph packages
- intelligence packages
- article packages

Protection:

- VPS backup protection
- Repository protection where applicable

Recovery Options:

1. File restoration
2. Git restoration
3. VPS restoration

Priority:

Critical

---

# Database Recovery

Database:

zenith

Platform:

PostgreSQL

Current Protection:

- VPS backup protection

Recovery Method:

Provider-level VPS restore.

Future Enhancement:

- Scheduled pg_dump exports
- Database-only restore procedures

Status:

Partially Documented

---

# Website Recovery

Public Website:

/var/www/zenith

Admin Assets:

/var/www/zenith-admin

Observed Backup Assets:

- zenith_backup_*
- zenith_PUBLIC_BACKUP_*

Recovery Options:

1. Deployment rebuild
2. Backup directory restoration
3. VPS restoration

Status:

Verified

---

# Deployment Rollback

Current Method:

Manual rollback.

Typical Approaches:

- Restore previous build artifacts
- Redeploy previous application version
- Restore VPS snapshot

Future Enhancement:

Document formal rollback procedures in DEPLOYMENT_REGISTER_v1.

Status:

Pending Documentation

---

# Recovery Decision Matrix

Scenario:
Single File Deleted

Preferred Recovery:
Git Restore

---

Scenario:
Governance Document Lost

Preferred Recovery:
Git Restore

---

Scenario:
Application Deployment Failure

Preferred Recovery:
Rollback Deployment

---

Scenario:
Database Corruption

Preferred Recovery:
Database Recovery Procedure

Fallback:
VPS Restore

---

Scenario:
Major Infrastructure Failure

Preferred Recovery:
TransIP VPS Restore

---

# Recovery Findings

## RECOVERY-FINDING-001

Provider-level disaster recovery capability verified.

Impact:

High

Status:

Verified

---

## RECOVERY-FINDING-002

Operational recovery procedures remain partially undocumented.

Impact:

Medium

Status:

Open

---

# Future Improvements

- Database-only backup strategy
- Database-only restore procedure
- Automated backup verification
- Deployment rollback documentation
- Recovery testing schedule

---

# Related Documents

OPERATIONS_REGISTER_v1

DEPLOYMENT_REGISTER_v1

SECURITY_SURFACE_v1

DEPENDENCY_REGISTER_v1
