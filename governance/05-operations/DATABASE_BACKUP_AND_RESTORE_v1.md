# DATABASE_BACKUP_AND_RESTORE_v1

Status: Active
Version: 1.0
Last Updated: 2026-06-24

Purpose:
Document PostgreSQL database-only backup and restore procedures for the ZNBW platform.

---

# Scope

Database:

zenith

Platform:

PostgreSQL 14.23

Purpose:

Provide database-level recovery independent of full VPS restore.

---

# Background

CODEX_AUDIT_A-002 identified that ZNBW relied on provider-level VPS restore for database recovery.

This document closes the first stage of that finding by documenting:

- Logical PostgreSQL backups
- Backup location
- Backup schedule
- Retention policy
- Restore procedure
- First restore verification evidence

---

# Backup Strategy

Backup Type:

Logical PostgreSQL dump

Tool:

pg_dump

Format:

Custom format

Command Type:

Automated shell script

Script Location:

/usr/local/sbin/znbw-postgres-backup.sh

Backup Root:

/var/backups/znbw/postgres

Daily Backup Directory:

/var/backups/znbw/postgres/daily

Restore Test Directory:

/var/backups/znbw/postgres/restore-tests

Log File:

/var/backups/znbw/postgres/postgres-backup.log

---

# Backup Schedule

Cron Owner:

root

Cron Entry:

15 2 * * * /usr/local/sbin/znbw-postgres-backup.sh

Frequency:

Daily

Time:

02:15 server time

---

# Retention Policy

Retention:

14 days

Mechanism:

Backup script deletes dump and checksum files older than 14 days.

Files Removed:

- zenith_*.dump
- zenith_*.dump.sha256

---

# Backup File Naming

Pattern:

zenith_YYYYMMDDTHHMMSSZ.dump

Example:

zenith_20260624T020012Z.dump

Checksum:

zenith_YYYYMMDDTHHMMSSZ.dump.sha256

---

# Manual Backup Procedure

Run:

sudo /usr/local/sbin/znbw-postgres-backup.sh

Verify:

ls -lh /var/backups/znbw/postgres/daily

tail -50 /var/backups/znbw/postgres/postgres-backup.log

---

# Restore Test Procedure

Create disposable test database:

sudo -u postgres createdb zenith_restore_test

Restore latest dump:

sudo -u postgres pg_restore \
  --dbname=zenith_restore_test \
  --verbose \
  /var/backups/znbw/postgres/daily/<backup-file>.dump

Verify public tables:

sudo -u postgres psql -d zenith_restore_test -c "\dt public.*"

Verify row counts:

sudo -u postgres psql -d zenith_restore_test -c "
SELECT 'articles' AS table_name, COUNT(*) FROM public.articles
UNION ALL
SELECT 'admin_users', COUNT(*) FROM public.admin_users
UNION ALL
SELECT 'contact_submissions', COUNT(*) FROM public.contact_submissions
UNION ALL
SELECT 'article_versions', COUNT(*) FROM public.article_versions
UNION ALL
SELECT 'article_audit_logs', COUNT(*) FROM public.article_audit_logs;
"

Drop disposable test database:

sudo -u postgres dropdb zenith_restore_test

---

# First Backup Verification

Date:

2026-06-24

Backup File:

/var/backups/znbw/postgres/daily/zenith_20260624T020012Z.dump

Backup Size:

207K

Result:

Backup completed successfully.

---

# First Restore Verification

Date:

2026-06-24

Restore Database:

zenith_restore_test

Result:

Restore completed successfully.

Verified Tables:

- public.__drizzle_migrations
- public.admin_users
- public.article_audit_logs
- public.article_versions
- public.articles
- public.contact_submissions

Verified Row Counts:

| Table | Count |
|---|---:|
| articles | 59 |
| admin_users | 1 |
| contact_submissions | 0 |
| article_versions | 0 |
| article_audit_logs | 0 |

Cleanup:

zenith_restore_test dropped after verification.

---

# Recovery Classification

Before HYG-006:

Database recovery depended on provider-level VPS restore.

After HYG-006:

Database-only logical backup and restore has been implemented and tested.

---

# Remaining Improvements

- Add automated backup success monitoring
- Add off-server backup copy
- Add periodic restore-test schedule
- Add backup encryption review
- Add backup failure alerting
- Add RPO/RTO targets

---

# Related Documents

BACKUP_AND_RESTORE_v1
OPERATIONS_REGISTER_v1
DEPENDENCY_REGISTER_v1
SECURITY_SURFACE_v1
HYGIENE_ROADMAP_v1
CODEX_AUDIT_PLAN_v1
