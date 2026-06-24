# API_SURFACE_STANDARD_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Define the canonical API and route surface for the ZNBW platform.

---

# Background

CODEX_AUDIT_A-002 identified that ZNBW uses multiple route namespaces, including:

- /api/v1/*
- /api/admin/*
- public website routes
- admin UI routes

This document defines the intended route taxonomy and governance rules.

---

# Public Ingress Model

All public traffic must enter through Nginx.

Current public ingress:

- 80/tcp
- 443/tcp

Direct public access to application runtime ports is not allowed.

Runtime ports such as 8080 and 5173 must not be exposed publicly through UFW.

---

# Current Nginx Surface

Enabled Nginx site configs:

- /etc/nginx/sites-enabled/zenith-api
- /etc/nginx/sites-enabled/zenith-web

Observed routes:

## API Domain

Domain:

api.zenithnovabridgewave.com

Nginx proxy target:

http://127.0.0.1:8080

Purpose:

Dedicated API domain.

## Public Website

Domain:

zenithnovabridgewave.com

Web root:

/var/www/zenith

Purpose:

Public website and article consumption.

## Public Website API Proxy

Route:

/api/

Proxy target:

http://127.0.0.1:8080

Purpose:

Allow public website to call API routes through the same domain.

## Public Website Uploads Proxy

Route:

/uploads/

Proxy target:

http://127.0.0.1:8080

Purpose:

Serve uploaded media through the public website domain.

---

# Runtime Services

## zenith-api

PM2 Service:

zenith-api

Script:

/opt/Zenith-Bridge-Gateway/artifacts/api-server/dist/index.js

Port:

8080

Public Exposure:

No direct public exposure permitted.

Public Access Path:

Nginx only.

## zenith-admin

PM2 Service:

zenith-admin

Working Directory:

/opt/Zenith-Bridge-Gateway/artifacts/admin-ui

Current Runtime Note:

Runs through bash under PM2.

Governance Note:

PM2 service parity should be reviewed during operational cleanup.

---

# Route Taxonomy

## /api/v1/*

Classification:

Versioned application API.

Purpose:

Stable API surface for application functionality.

Expected Contents:

- authentication
- article operations
- upload routes
- contact form
- health checks

Governance Rules:

- Preferred namespace for stable public or application-facing API routes.
- Must be documented in OpenAPI where practical.
- Must define authentication requirements.
- Must define request and response schemas where practical.
- Breaking changes require versioning review.

---

## /api/admin/*

Classification:

Admin-only operational API.

Purpose:

Internal admin workflows and intelligence operations.

Expected Contents:

- intelligence preview
- intelligence promotion
- CMS package workflows
- governance-controlled admin operations

Governance Rules:

- Must not be treated as public client API.
- Must require admin authentication where applicable.
- Must not expose raw internal registries unless intentionally governed.
- Must be reviewed before client-facing exposure.
- May remain outside /api/v1 if explicitly documented as admin-only.

---

## /health

Classification:

Operational health endpoint.

Purpose:

Basic service health verification.

Governance Rules:

- May be public if it exposes no sensitive detail.
- Detailed diagnostics must remain internal or admin-only.

---

## /admin/*

Classification:

Admin UI route.

Purpose:

Human admin interface.

Governance Rules:

- Must be protected by authentication.
- Must not directly expose filesystem, raw registries or secrets.
- Must remain separated from public article consumption routes.

---

## /uploads/*

Classification:

Public media route.

Purpose:

Serve uploaded public media.

Governance Rules:

- Only public-safe files may be exposed.
- Upload validation must prevent dangerous file types.
- Private client files must not use this route in future client portal architecture.

---

# Route Governance Rules

1. Public APIs should use /api/v1 unless explicitly classified otherwise.

2. Admin-only APIs may use /api/admin when they are internal operational routes.

3. Client-facing APIs must not reuse admin-only routes.

4. Runtime ports must not be public ingress surfaces.

5. Nginx is the public boundary.

6. API routes should have a clear owner, purpose and authentication expectation.

7. OpenAPI is the preferred source of truth for stable /api/v1 routes.

8. Experimental routes must not be exposed to clients without review.

9. Future client routes should receive a dedicated namespace before client onboarding.

10. Upload and media routes must distinguish public media from private/client media.

---

# Known Gaps

- Admin intelligence routes sit outside /api/v1 by design but require continued review.
- PM2 zenith-admin service should be standardized.
- OpenAPI coverage should be reviewed against current routes.
- Client-facing API namespace is not yet defined.
- Rate limiting and audit logging expectations are not yet fully documented.

---

# Related Documents

SYSTEM_MAP_v1
ASSET_INVENTORY_v1
ARCHITECTURE_OVERVIEW_v1
ARCHITECTURE_PRINCIPLES_v1
INTELLIGENCE_CENTER_v1
SECURITY_SURFACE_v1
DEPLOYMENT_REGISTER_v1
OPERATIONS_REGISTER_v1
REPOSITORY_STATE_CLASSIFICATION_v1
