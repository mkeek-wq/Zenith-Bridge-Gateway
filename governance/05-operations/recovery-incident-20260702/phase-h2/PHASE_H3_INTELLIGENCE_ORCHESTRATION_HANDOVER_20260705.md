# 📋 ZNBW HANDOVER – Phase H3: Intelligence Orchestration Discovery
**Date:** 05 Jul 2026
**Branch:** recovery/june25-known-good
**Status:** Stable. Replay and Forecast restored. Product vision clarified.

---

# 1. Session Summary

Major discovery:

ZNBW already contains most of the engines required for an explainable decision-support platform.

The next phase is:

```text
Connect
Audit
Surface
```

---

# CAUTION — 05 Jul 2026

pnpm-workspace.yaml was restored to tracked baseline to recover minimumReleaseAge security protection.

Result:
- minimumReleaseAge is back.
- git diff pnpm-workspace.yaml is clean.
- root pnpm build now fails in artifacts/znbw-website typecheck.
- Failure appears related to React/Wouter/@types mismatch, not API/Admin runtime.
- Do NOT patch website code blindly.
- Do NOT run pnpm install.
- Do NOT commit package/lock/workspace changes yet.

Known safe builds:
- artifacts/admin-ui pnpm build passed earlier.
- artifacts/api-server pnpm build passed earlier.
- PM2 zenith-admin and zenith-api were online after restart.

Next session must classify whether znbw-website should be part of root build, excluded, or dependency-aligned.
