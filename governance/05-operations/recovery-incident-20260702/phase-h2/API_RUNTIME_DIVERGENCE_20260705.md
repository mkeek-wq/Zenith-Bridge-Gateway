# 📋 API Runtime Divergence Investigation
**Date:** 05 Jul 2026
**Branch:** recovery/june25-known-good
**Status:** Discovery Only

---

# Executive Summary

Repository archaeology discovered that the production runtime differs from the committed Git baseline.

This is not active corruption.

This appears to be an uncommitted API architecture migration.

---

# Git HEAD State

API package:

```text
@workspace/api-server
```

Build:

```text
build.mjs
esbuild
dist/index.mjs
```

Architecture:

```text
express-session
minimal runtime
```

---

# VPS Runtime State

API package:

```text
zenith-api-server
```

Build:

```text
tsc
dist/index.js
```

Architecture additions:

```text
helmet
JWT
multer
OpenAI
uploads
admin intelligence routes
graceful shutdown
environment validation
```

---

# PM2 Runtime

```text
script:
/opt/Zenith-Bridge-Gateway/artifacts/api-server/dist/index.js
```

Production currently runs the TypeScript build.

---

# Conclusions

Repository exists in two states:

Git repository:
- historical baseline

VPS filesystem:
- evolved runtime

No evidence of active corruption.

---

# Risks

Medium-term:

```text
git clone
pnpm build
pm2 start
```

may not reproduce current production.

---

# Immediate Actions

1. Preserve current VPS state.
2. Continue repository archaeology.
3. Classify local modifications.
4. Determine whether migration should be committed.
5. Do not perform cleanup yet.

---

# Status

Infrastructure: Healthy
Admin UI: Healthy
API: Healthy
Recovery: Complete
Repository: Divergent but understood

---

# Validation — 05 Jul 2026

Executed from:

```bash
cd /opt/Zenith-Bridge-Gateway/artifacts/api-server
pnpm run typecheck
pnpm run build
```

Result:

```text
typecheck passed
build passed
dist/index.js regenerated
PM2 zenith-api remained online
```

Conclusion:

```text
The local TypeScript runtime migration is functional.
```
