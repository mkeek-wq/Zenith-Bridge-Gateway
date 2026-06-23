# SECURITY_SURFACE_v1

Status: Active

Version: 1.0

Last Updated: 2026-06-23

Purpose:

Document the current security boundary, exposed services, trust zones and identified security findings for the Zenith Nova Bridge Wave platform.

---

# Security Philosophy

ZNBW follows a layered security model:

Internet
↓
Firewall
↓
Nginx
↓
Applications
↓
Data Stores

Principles:

- Least privilege where practical
- Localhost-only internal services
- Public exposure minimized
- Governance before automation
- Findings documented before remediation

---

# Infrastructure Security Boundary

Provider:

TransIP

Platform:

KVM Virtual Machine

Operating System:

Ubuntu 22.04.5 LTS

Primary Administrative Access:

- SSH
- TransIP Control Panel

Disaster Recovery:

Covered by TransIP managed VPS backup service.

Reference:

BACKUP_AND_RESTORE_v1

---

# Public Network Surface

Verified Open Ports

Port 22

Service:
SSH

Exposure:
Public

Purpose:
Administrative access

---

Port 80

Service:
HTTP

Exposure:
Public

Purpose:
HTTP redirect and web access

---

Port 443

Service:
HTTPS

Exposure:
Public

Purpose:
Website and API access

---

Port 5173

Service:
zenith-admin

Exposure:
Public

Purpose:
Admin UI runtime

Status:
Requires review

---

Port 8080

Service:
zenith-api

Exposure:
Public

Purpose:
API runtime

Status:
Requires review

---

# Internal-Only Services

## PostgreSQL

Address:

127.0.0.1:5432

Exposure:

Localhost only

Status:

Verified

Purpose:

Primary persistence layer

---

## n8n Sandbox

Address:

127.0.0.1:5678

Exposure:

Localhost only

Status:

Verified

Purpose:

Workflow experimentation and automation sandbox

---

# Public Applications

## Public Website

Domain:

zenithnovabridgewave.com

TLS:

Enabled

Nginx Managed:

Yes

Location:

/var/www/zenith

Status:

Production

---

## API

Domain:

api.zenithnovabridgewave.com

TLS:

Enabled

Nginx Managed:

Yes

Backend Port:

8080

Status:

Production

---

## Admin UI

Path:

/admin

TLS:

Enabled

Nginx Managed:

Yes

Runtime:

zenith-admin

Status:

Production

---

# Authentication and Credentials

Credential Categories:

- SSH credentials
- TransIP account access
- GitHub repository access
- PostgreSQL access
- Application secrets
- TLS certificates

Environment Configuration:

/opt/Zenith-Bridge-Gateway/.env

Contains:

- DATABASE_URL
- SESSION_SECRET
- PORT
- NODE_ENV

Status:

Verified

---

# TLS Certificates

Provider:

Let's Encrypt

Verified Certificates:

- api.zenithnovabridgewave.com
- zenithnovabridgewave.com

Location:

/etc/letsencrypt/live

Status:

Active

---

# Administrative Access

Known Administrative Accounts:

- root
- zenith
- mkeek

Application Service Accounts:

- postgres
- www-data

Status:

Observed

---

# Firewall

Firewall:

UFW

Status:

Active

Observed Rules:

- OpenSSH
- 80/tcp
- 443/tcp
- 5173/tcp
- 8080/tcp

Status:

Verified

---

# Trust Zones

Zone 1

Public Internet

Risk Level:

High

---

Zone 2

Nginx Reverse Proxy

Risk Level:

Medium

---

Zone 3

Application Layer

Components:

- zenith-api
- zenith-admin

Risk Level:

Medium

---

Zone 4

Data Layer

Components:

- PostgreSQL
- Intelligence Assets
- Governance Repository

Risk Level:

Critical

---

# Security Findings

## SEC-FINDING-001

Title:

Public API Port Accessible

Description:

Port 8080 is externally reachable in addition to Nginx proxy routing.

Impact:

Medium

Status:

Open

---

## SEC-FINDING-002

Title:

Public Admin Runtime Port Accessible

Description:

Port 5173 is externally reachable in addition to Nginx routing.

Impact:

Medium

Status:

Open

---

## SEC-FINDING-003

Title:

Database Correctly Restricted

Description:

PostgreSQL listens on localhost only.

Impact:

Positive

Status:

Verified

---

## SEC-FINDING-004

Title:

n8n Sandbox Correctly Restricted

Description:

n8n sandbox listens on localhost only.

Impact:

Positive

Status:

Verified

---

## SEC-FINDING-005

Title:

SSH Configuration Requires Explicit Verification

Description:

SSH runtime configuration has not yet been formally documented.

Impact:

Low

Status:

Open

Follow-Up:

Verify active SSH configuration and authentication model.

---

## SEC-FINDING-006

Title:

Environment Secret Review Required

Description:

Application secrets exist in .env and should be reviewed periodically.

Impact:

Medium

Status:

Open

---

# Future Improvements

- Verify SSH authentication configuration
- Review public exposure of ports 5173 and 8080
- Implement secret rotation procedure
- Create access review procedure
- Create security audit checklist
- Periodically verify firewall configuration

---

# Related Documents

OPERATIONS_REGISTER_v1

BACKUP_AND_RESTORE_v1

DEPLOYMENT_REGISTER_v1

DEPENDENCY_REGISTER_v1

CODEX_AUDIT_PLAN_v1
