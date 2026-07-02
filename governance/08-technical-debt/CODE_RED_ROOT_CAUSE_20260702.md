# Code Red Root Cause - 2026-07-02

## Confirmed Primary Culprit

The API failed during startup because `lib/api-zod` package exports and dist/generated imports became inconsistent.

Observed PM2 errors:

- Cannot find module `/opt/Zenith-Bridge-Gateway/lib/api-zod/dist/generated/api`
- ERR_PACKAGE_PATH_NOT_EXPORTED for `@workspace/api-zod`
- API crash loop caused website/CMS/admin article access failures.

## Impact

- API stopped listening correctly.
- nginx returned 502 for API paths.
- Website shell stayed online but article data disappeared.
- Admin/CMS became inaccessible.

## Root Cause Class

Broken package export / generated library migration.

## Prevention

- No package export changes without test clone build.
- No generated library migration without checking dist output exists.
- No production restart unless `pnpm run validate:api` and `pnpm run build` pass.
- Add health monitor and pre-change snapshot.
- Never apply whole-file replacement to production-critical files without `cat`, diff, backup, approval.
