# ACCESS_CONTROL_REGISTER_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Document access control boundaries, privileged roles and operational access paths for the ZNBW platform.

---

# Background

CODEX_AUDIT_A-002 identified that access control governance was not yet formally documented.

This register establishes a first operational view of:

- system users
- service access
- database roles
- application access paths
- privileged access boundaries
- future client access separation

---

# Current System Users

Observed system users relevant to ZNBW:

| User | Type | Purpose | Privilege Level | Notes |
|---|---|---|---|---|
| root | Linux system user | VPS administration | Full system access | Highest privilege; use with care |
| zenith | Linux application user | Application ownership / deployment context | Application-level | Used for platform files and application ownership |
| postgres | Linux system user | PostgreSQL service administration | Database system access | Used for PostgreSQL administration |

---

# Running Services

| Service | Type | Status | Access Boundary |
|---|---|---|---|
| nginx | Reverse proxy / web server | Active | Public ingress layer |
| postgresql@14-main | Database | Active | Local database service |
| docker | Container runtime | Active | n8n / container workloads |
| cron | Scheduled jobs | Active | Backup and automation jobs |
| zenith-api | PM2 process | Active | API runtime |
| zenith-admin | PM2 process | Active | Admin runtime |

---

# PostgreSQL Roles

| Role | Privileges | Purpose | Notes |
|---|---|---|---|
| postgres | Superuser, Create role, Create DB, Replication, Bypass RLS | Database administration | Highest database privilege |
| zenith | Standard role | Application database access | Used for application-level database access |

---

# Access Control Matrix

| Asset / Surface | Access Path | Authentication | Privilege Level | Owner | Client Safe |
|---|---|---|---|---|---|
| VPS root shell | SSH / root | SSH credentials | Full system access | Founder | No |
| Application filesystem | /opt/Zenith-Bridge-Gateway | Linux permissions | High | Founder | No |
| Public website | https://zenithnovabridgewave.com | None | Public read-only | Founder | Yes |
| API domain | https://api.zenithnovabridgewave.com | Route dependent | Application API | Founder | Conditional |
| Admin UI | https://zenithnovabridgewave.com/admin | Admin authentication | Admin / operational | Founder | No |
| API runtime | 127.0.0.1:8080 | Local / Nginx proxy | Internal runtime | Founder | No direct client access |
| Admin runtime | 127.0.0.1 / PM2 runtime | Local / Nginx / PM2 | Internal runtime | Founder | No direct client access |
| PostgreSQL database | Local PostgreSQL socket / role auth | postgres / zenith roles | Database access | Founder | No |
| Backup directory | /var/backups/znbw/postgres | Linux permissions | Restricted operational | Founder | No |
| Governance repository | governance/ | Git / filesystem | Internal governance | Founder | No |
| GitHub repository | GitHub remote | GitHub authentication | Source control | Founder | No |
| TransIP VPS console | Provider portal | Provider authentication | Infrastructure admin | Founder | No |
| n8n | Docker / localhost service | n8n authentication | Automation admin | Founder | No |

---

# Public Access Rules

1. Public users may access the public website.

2. Public users may access public article and media routes.

3. Public users must not access internal registries, raw intelligence assets, database contents, backups or governance internals.

4. Public API exposure must remain routed through Nginx.

5. Direct runtime port exposure is not allowed.

---

# Admin Access Rules

1. Admin UI access is restricted to authorized operators.

2. Admin users may create, edit and prepare publication material.

3. Admin users must not expose raw internal intelligence assets directly to clients or public readers without review.

4. Admin workflows must preserve source, evidence, confidence and lineage where applicable.

5. Admin access should be reviewed before adding additional operators.

---

# Database Access Rules

1. PostgreSQL superuser access must remain restricted.

2. The postgres role is for administration only.

3. The zenith role is for application-level database use.

4. Database backups must be protected from public access.

5. Restore tests should use disposable test databases.

---

# Service Access Rules

1. PM2 services must be managed by authorized operators only.

2. Nginx remains the public ingress boundary.

3. Runtime services must not be exposed directly through UFW.

4. Docker access implies high operational privilege and should remain restricted.

5. Cron jobs must be reviewed before adding production automations.

---

# Sensitive Assets

Sensitive assets include:

- .env files
- production environment files
- database credentials
- PostgreSQL backups
- SSH credentials
- provider credentials
- GitHub credentials
- admin login credentials
- unpublished intelligence packages
- raw source documents before review

Rules:

- Sensitive assets must not be committed to Git.
- Sensitive assets must not be exposed through public routes.
- Sensitive assets must not be copied into public website roots.
- Sensitive assets require explicit review before sharing.

---

# Future Client Access Principles

Client access is not yet active.

Before client onboarding, ZNBW must define:

- client identity model
- organization model
- user role model
- permission boundaries
- client-safe asset classes
- client data isolation
- client offboarding procedure
- client audit logging expectations

Client users must not have access to:

- raw internal registries
- system filesystem
- PostgreSQL directly
- internal Smurf outputs
- unpublished intelligence packages
- governance internals
- backups

---

# Known Gaps

1. SSH hardening status requires formal documentation.

2. Admin UI user model requires review before multi-user operation.

3. Secret rotation procedure is not yet documented.

4. GitHub access review is not yet documented.

5. TransIP/provider access review is not yet documented.

6. n8n access model is not yet documented.

7. Client access model is not yet implemented.

---

# Related Documents

SECURITY_SURFACE_v1
OPERATIONS_REGISTER_v1
DEPLOYMENT_REGISTER_v1
DATABASE_BACKUP_AND_RESTORE_v1
API_SURFACE_STANDARD_v1
ASSET_CONTROL_MATRIX_v1
HYGIENE_PROGRESS_v1
