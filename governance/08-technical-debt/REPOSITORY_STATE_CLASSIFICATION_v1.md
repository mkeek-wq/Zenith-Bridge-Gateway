# REPOSITORY_STATE_CLASSIFICATION_v1

Status: Draft
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Classify the repository working-tree state discovered during HYG-008.

Related Snapshot:

governance/08-technical-debt/repository-status-2026-06-24.txt

---

# Executive Summary

Repository Snapshot Date:

2026-06-24

Repository Status:

225 changed paths

Breakdown:

- 109 untracked
- 58 modified
- 58 deleted

Observation:

The repository state is not random.

Most changes are concentrated in:

- artifacts/znbw-website
- artifacts/api-server
- lib/api-zod
- lib/db
- lib/api-spec

The working tree appears to represent a partially completed platform migration rather than isolated changes.

---

# Classification Categories

## CATEGORY A — Active Platform Migration

Definition:

Changes likely associated with active platform evolution and production architecture.

Disposition:

Retain for future review.

---

## CATEGORY B — Legacy Removal Candidates

Definition:

Older components being removed or replaced.

Disposition:

Verify references before deletion.

---

## CATEGORY C — Generated Artifacts

Definition:

Generated code produced from OpenAPI, schemas, database generation or build tooling.

Disposition:

Regenerate when needed.
Do not manually maintain.

---

## CATEGORY D — Backup / Temporary Files

Definition:

Temporary, backup or recovery files.

Disposition:

Archive or remove.

---

## CATEGORY E — Sensitive Files

Definition:

Credentials, environment configuration or deployment secrets.

Disposition:

Never commit.

---

## CATEGORY F — Unknown

Definition:

Not yet classified.

Disposition:

Review later.

---

---

# Initial Classification — Website

Path:

artifacts/znbw-website

Observed State:

- 52 deleted files
- 21 modified files
- 35 untracked files

Assessment:

The website changes appear to represent a major migration or cleanup of the public website/admin/editor surface.

Primary Patterns:

1. Legacy UI component removal

Large number of deleted files under:

artifacts/znbw-website/src/components/ui

Likely classification:

CATEGORY B — Legacy Removal Candidates

Action Required:

Verify that deleted UI components are no longer imported before accepting removal.

2. Website page and routing updates

Modified files include:

- src/App.tsx
- src/main.tsx
- src/pages/home.tsx
- src/pages/about.tsx
- src/pages/contact.tsx
- src/pages/editorials/index.tsx
- src/pages/editorials/[id].tsx
- src/pages/admin/*

Likely classification:

CATEGORY A — Active Platform Migration

Action Required:

Confirm current production website build uses this tree or determine whether it is legacy compared with deployed /var/www/zenith.

3. Backup and temporary website files

Untracked files include:

- *.bak
- *.backup
- *.save
- package.json.broken.backup
- vite.config.ts.broken.backup

Likely classification:

CATEGORY D — Backup / Temporary Files

Action Required:

Archive or delete after confirming no unique production logic remains.

4. Sensitive website files

Untracked files include:

- .env.production

Likely classification:

CATEGORY E — Sensitive Files

Action Required:

Never commit. Review .gitignore coverage.

5. New website capability candidates

Untracked files include:

- src/api/
- src/components/editor/
- src/lib/analytics.ts
- src/pages/ArticleEditor.tsx
- src/pages/ArticlesList.tsx
- src/pages/Login.tsx
- src/pages/privacy.tsx

Likely classification:

CATEGORY A — Active Platform Migration / Review

Action Required:

Determine whether these belong to the current public website, older CMS flow, or replaced admin-ui flow.

---

# Initial Classification — API Server

Path:

artifacts/api-server

Observed State:

- 6 deleted files
- 5 modified files
- 39 untracked files

Assessment:

The API server changes appear to represent a major restructuring from older route files into a newer API architecture.

Primary Patterns:

1. Legacy route removal

Deleted files include:

- src/routes/admin.ts
- src/routes/articles.ts
- src/routes/contact.ts
- src/routes/health.ts
- src/routes/index.ts

Likely classification:

CATEGORY B — Legacy Removal Candidates

Action Required:

Verify these routes are replaced by src/routes/v1 and admin intelligence routes.

2. Active API migration

Modified files include:

- build.mjs
- package.json
- src/app.ts
- src/index.ts
- tsconfig.json

Untracked candidates include:

- src/routes/v1/
- src/services/
- src/config/
- src/middleware/
- src/types/
- src/lib/

Likely classification:

CATEGORY A — Active Platform Migration

Action Required:

Confirm these files represent the current running API architecture before committing.

3. Intelligence and data assets

Untracked paths include:

- data/
- exports/
- inputs/
- config/
- docs/
- src/scripts/

Likely classification:

CATEGORY A — Active Platform Migration / Review

Action Required:

Classify which are canonical intelligence assets, generated outputs, operational inputs, or archives.

4. Backup and temporary API files

Untracked files include:

- src/routes/admin-intelligence-promote.ts.bak-safe-draft-sanitize
- src_backup_DISABLED/
- test.jpg
- test.txt
- 0
- =

Likely classification:

CATEGORY D — Backup / Temporary Files

Action Required:

Archive or delete after review.

5. Sensitive API files

Untracked files include:

- .env

Likely classification:

CATEGORY E — Sensitive Files

Action Required:

Never commit. Review .gitignore coverage.

6. Runtime / deployment candidates

Untracked files include:

- ecosystem.config.cjs
- ecosystem.config.js
- ecosystem.config.mjs

Likely classification:

CATEGORY F — Unknown / Review

Action Required:

Compare against root ecosystem.config.cjs and decide the canonical PM2 configuration.

---

# Initial Classification — Shared Libraries

Path:

lib

Observed State:

- 27 modified files
- 26 untracked files

Assessment:

The lib changes appear to represent API contract generation, Zod validation generation, React API client generation and database schema evolution.

Primary Patterns:

1. API contract source

Modified files include:

- lib/api-spec/openapi.yaml
- lib/api-spec/orval.config.ts
- lib/api-spec/package.json

Likely classification:

CATEGORY A — Active Platform Migration

Action Required:

Confirm openapi.yaml is the canonical API contract source.

2. Generated React API client

Modified files include:

- lib/api-client-react/src/generated/api.ts
- lib/api-client-react/src/generated/api.schemas.ts

Likely classification:

CATEGORY C — Generated Artifacts

Action Required:

Confirm generation command and decide whether generated client files should be committed or regenerated during build.

3. Generated Zod validation layer

Modified and untracked files include:

- lib/api-zod/src/generated/api.ts
- lib/api-zod/src/generated/types/*
- lib/api-zod/src/generated/*.d.ts
- lib/api-zod/src/index.*

Likely classification:

CATEGORY C — Generated Artifacts

Action Required:

Confirm generation command, source of truth and whether compiled outputs should be ignored.

4. Database schema and migrations

Modified and untracked files include:

- lib/db/src/schema/articles.ts
- lib/db/src/schema/index.ts
- lib/db/src/db.ts
- lib/db/drizzle/
- lib/db/src/auth/
- lib/db/src/seed.ts

Likely classification:

CATEGORY A — Active Platform Migration / Review

Action Required:

Confirm database schema ownership and migration policy.

5. Sensitive database files

Untracked files include:

- lib/db/.env

Likely classification:

CATEGORY E — Sensitive Files

Action Required:

Never commit. Review .gitignore coverage.

6. Backup / temporary contract files

Untracked files include:

- lib/api-spec/openapi.yaml.bak-2026-05-06

Likely classification:

CATEGORY D — Backup / Temporary Files

Action Required:

Archive or delete after confirming no unique contract information remains.

7. Shared article service

Untracked files include:

- lib/articles.service.ts

Likely classification:

CATEGORY F — Unknown / Review

Action Required:

Determine whether this is active shared logic, duplicate API-server logic, or legacy migration residue.

---

# Initial Classification — Root, Scripts and Other Assets

Paths:

- root files
- scripts
- audit-packages
- artifacts/admin-ui
- artifacts/cms
- artifacts/cms-admin
- artifacts/mockup-sandbox

Observed State:

- package.json modified
- pnpm-lock.yaml modified
- pnpm-workspace.yaml modified
- scripts/package.json modified
- scripts/health-check.sh untracked
- scripts/watchdog/ untracked
- scripts/validate-openapi.mjs untracked
- ecosystem.config.cjs untracked at root
- audit-packages/ untracked
- artifacts/admin-ui/ untracked
- artifacts/cms/ untracked
- artifacts/cms-admin/ untracked

Assessment:

Root and script changes appear related to workspace modernization, API contract validation, PM2/runtime management and operational watchdog tooling.

Primary Patterns:

1. Workspace configuration changes

Modified files include:

- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- scripts/package.json

Likely classification:

CATEGORY A — Active Platform Migration

Action Required:

Confirm workspace structure before committing.

2. Operational scripts

Untracked files include:

- scripts/health-check.sh
- scripts/watchdog/
- scripts/validate-openapi.mjs

Likely classification:

CATEGORY A — Active Platform Migration / Operations Review

Action Required:

Review whether scripts are active, duplicate, or superseded before committing.

3. Runtime configuration

Untracked root file includes:

- ecosystem.config.cjs

Likely classification:

CATEGORY A — Active Platform Migration / Review

Action Required:

Compare with active PM2 runtime and decide canonical ecosystem config.

4. Audit packages

Untracked path:

- audit-packages/

Likely classification:

CATEGORY F — Unknown / Review

Action Required:

Determine whether this contains governance evidence, generated audit outputs, or temporary analysis files.

5. Admin UI

Untracked path:

- artifacts/admin-ui/

Likely classification:

CATEGORY A — Active Platform Migration

Action Required:

Confirm this is the current production admin UI source before committing.

6. Legacy CMS artifacts

Untracked paths:

- artifacts/cms/
- artifacts/cms-admin/

Likely classification:

CATEGORY B — Legacy Removal Candidates / Review

Action Required:

Determine whether these are superseded by artifacts/admin-ui and CMS Package Intake.

7. Mockup sandbox

Modified path:

- artifacts/mockup-sandbox/package.json

Likely classification:

CATEGORY F — Unknown / Review

Action Required:

Determine whether mockup-sandbox remains useful or should be archived.

8. Sensitive root files

Untracked files include:

- .env

Likely classification:

CATEGORY E — Sensitive Files

Action Required:

Never commit. Review .gitignore coverage.

---

# Preliminary Disposition Summary

## Keep / Review as Active Migration

- artifacts/admin-ui/
- artifacts/api-server/src/routes/v1/
- artifacts/api-server/src/services/
- artifacts/api-server/src/config/
- artifacts/api-server/src/middleware/
- artifacts/api-server/src/types/
- artifacts/znbw-website/src/api/
- artifacts/znbw-website/src/components/editor/
- artifacts/znbw-website/src/lib/analytics.ts
- lib/api-spec/openapi.yaml
- lib/db/src/schema/
- scripts/validate-openapi.mjs
- scripts/watchdog/

## Verify Before Removal

- artifacts/api-server/src/routes/admin.ts
- artifacts/api-server/src/routes/articles.ts
- artifacts/api-server/src/routes/contact.ts
- artifacts/api-server/src/routes/health.ts
- artifacts/api-server/src/routes/index.ts
- artifacts/znbw-website/src/components/ui/*
- artifacts/znbw-website/src/components/layout/Navbar.tsx
- artifacts/cms/
- artifacts/cms-admin/

## Generated / Regenerable

- lib/api-zod/src/generated/*
- lib/api-client-react/src/generated/*
- generated declaration files
- compiled JS outputs under lib/api-zod/src/

## Archive or Delete Candidates

- *.bak
- *.backup
- *.save
- test.jpg
- test.txt
- artifacts/api-server/0
- artifacts/api-server/=
- artifacts/api-server/src_backup_DISABLED/

## Never Commit

- .env
- artifacts/api-server/.env
- artifacts/znbw-website/.env.production
- lib/db/.env

---

# Recommended Next Steps

1. Review .gitignore and add sensitive / temporary patterns.

2. Confirm production source of truth for:

- admin-ui
- api-server
- znbw-website
- lib/api-spec
- lib/db

3. Split future cleanup into separate commits:

- API architecture migration
- Website cleanup
- Generated API contract outputs
- Legacy artifact removal
- Temporary file cleanup
- Sensitive file exclusion

4. Run Codex review after classification document is committed.

5. Do not run git add . until classification is complete.
