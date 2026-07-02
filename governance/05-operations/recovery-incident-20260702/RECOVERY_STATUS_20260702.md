# ZNBW Recovery Status - 2026-07-02

Website restored from 25-06-2026 05:17 backup.

Current status:
- Website works
- Articles visible
- Admin login works
- API alive
- PM2 shows zenith-admin and zenith-api online
- Port 8080 listening
- /api/v1/articles returns 401, meaning API/auth route alive, not 502

Golden VPS snapshot:
20260702-post-recovery-clean

Current branch:
recovery/june25-known-good

Current tag:
recovery-june25-filesystem-online-20260702

Do not blindly git add -A.
Do not blindly git restore.
Do not blindly restore deleted files.
Classify deleted files first because many deletions may be intentional Codex/hygiene cleanup.
