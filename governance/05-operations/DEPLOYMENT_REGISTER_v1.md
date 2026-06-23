# DEPLOYMENT_REGISTER_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Document current ZNBW deployment structure, build commands, runtime services, deployment procedures and rollback considerations.

---

# Deployment Scope

This register covers:

- API Server deployment
- Admin UI deployment
- Public website deployment
- PM2 runtime management
- Nginx routing
- Deployment verification
- Rollback considerations

---

# Production Locations

Application Root:
/opt/Zenith-Bridge-Gateway

API Server Source:
/opt/Zenith-Bridge-Gateway/artifacts/api-server

Admin UI Source:
/opt/Zenith-Bridge-Gateway/artifacts/admin-ui

Public Website Source:
/opt/Zenith-Bridge-Gateway/artifacts/znbw-website

Public Website Web Root:
/var/www/zenith

Admin UI Web Root:
/var/www/zenith-admin

Nginx Sites Enabled:

- /etc/nginx/sites-enabled/zenith-api
- /etc/nginx/sites-enabled/zenith-web

---

# Runtime Services

## zenith-api

Runtime Manager:
PM2

PM2 Name:
zenith-api

Script:
/opt/Zenith-Bridge-Gateway/artifacts/api-server/dist/index.js

Port:
8080

Runtime:
NodeJS

PM2 Config Source:
/opt/Zenith-Bridge-Gateway/ecosystem.config.cjs

Status:
Production

---

## zenith-admin

Runtime Manager:
PM2

PM2 Name:
zenith-admin

Runtime Command:
pnpm preview --host 0.0.0.0 --port 5173

Source Location:
/opt/Zenith-Bridge-Gateway/artifacts/admin-ui

Status:
Production

Note:
zenith-admin is currently PM2-managed but not defined inside ecosystem.config.cjs.

---

# Build Commands

## API Server

Location:
/opt/Zenith-Bridge-Gateway/artifacts/api-server

Build Command:

pnpm build

Underlying Scripts:

- clean: rm -rf dist
- build:ts: tsc -p tsconfig.json
- start: node dist/index.js
- typecheck: tsc -p tsconfig.json --noEmit

---

## Admin UI

Location:
/opt/Zenith-Bridge-Gateway/artifacts/admin-ui

Build Command:

pnpm build

Underlying Scripts:

- dev: vite
- build: tsc -b && vite build
- preview: vite preview
- lint: eslint .

---

# Deployment Procedures

## API Deployment Procedure

Current procedure:

1. Navigate to API server directory.

cd /opt/Zenith-Bridge-Gateway/artifacts/api-server

2. Build API server.

pnpm build

3. Restart API service.

pm2 restart zenith-api

4. Verify PM2 status.

pm2 list

5. Verify API through browser or curl.

Status:
Documented

---

## Admin UI Deployment Procedure

Current observed procedure:

1. Navigate to Admin UI directory.

cd /opt/Zenith-Bridge-Gateway/artifacts/admin-ui

2. Build Admin UI.

pnpm build

3. Copy build output to web root.

rsync -a dist/ /var/www/zenith-admin/

4. Verify web root update.

ls -la /var/www/zenith-admin

5. Verify Admin UI in browser.

Status:
Documented

Note:
Previous deployments sometimes removed old asset files before rsync to prevent stale bundle references.

---

## Public Website Deployment Procedure

Current procedure:
Partially documented.

Expected pattern:

1. Build public website.
2. Copy build output to /var/www/zenith.
3. Verify public website in browser.

Status:
Requires confirmation

---

# Nginx Routing

## Public Website

Domain:

zenithnovabridgewave.com
www.zenithnovabridgewave.com

Web Root:
/var/www/zenith

---

## API

Domain:

api.zenithnovabridgewave.com

Proxy Target:

127.0.0.1:8080

---

## Admin UI

Path:

/admin/

Web Root:

/var/www/zenith-admin

---

# PM2 Startup Recovery

PM2 startup recovery is enabled through systemd.

PM2 Dump:

/root/.pm2/dump.pm2

Systemd Service:

/etc/systemd/system/pm2-root.service

Relevant Commands:

pm2 save
pm2 startup

Status:
Verified

---

# Deployment Verification Checklist

After deployment, verify:

- pm2 list
- zenith-api online
- zenith-admin online
- Public site loads
- Admin page loads
- API routes respond
- Browser console has no critical errors
- Nginx reload not required unless config changed
- Disk usage remains healthy

---

# Rollback Strategy

## API Rollback

Possible rollback options:

1. Git checkout previous known-good commit.
2. Rebuild API.
3. Restart zenith-api through PM2.
4. Verify service health.

Fallback:
TransIP VPS restore.

---

## Admin UI Rollback

Possible rollback options:

1. Restore previous /var/www/zenith-admin build.
2. Rebuild from previous known-good commit.
3. Rsync previous build output.
4. Verify /admin route.

Fallback:
TransIP VPS restore.

---

## Public Website Rollback

Possible rollback options:

1. Restore previous /var/www/zenith backup directory.
2. Rebuild from previous known-good commit.
3. Rsync previous build output.

Observed backup directories exist under /var/www.

Fallback:
TransIP VPS restore.

---

# Deployment Findings

## DEPLOY-FINDING-001

Title:
API Deployment Uses Compiled Output

Description:
zenith-api is configured to run compiled output from dist/index.js rather than source TypeScript.

Impact:
Positive

Status:
Verified

---

## DEPLOY-FINDING-002

Title:
Admin UI PM2 Service Not In Ecosystem Config

Description:
zenith-admin is currently managed by PM2 but is not defined in ecosystem.config.cjs.

Impact:
Medium

Status:
Open

Follow-Up:
Consider adding zenith-admin to ecosystem.config.cjs or documenting manual PM2 creation command.

---

## DEPLOY-FINDING-003

Title:
Public Website Deployment Requires Confirmation

Description:
Public website deployment path and current procedure require confirmation.

Impact:
Low

Status:
Open

---

# Future Improvements

- Add zenith-admin to ecosystem.config.cjs
- Formalize public website deployment procedure
- Create deployment rollback scripts
- Create pre-deployment snapshot checklist
- Document manual PM2 creation commands
- Document Nginx reload procedure
- Add deployment history log

---

# Related Documents

OPERATIONS_REGISTER_v1
BACKUP_AND_RESTORE_v1
SECURITY_SURFACE_v1
DEPENDENCY_REGISTER_v1
