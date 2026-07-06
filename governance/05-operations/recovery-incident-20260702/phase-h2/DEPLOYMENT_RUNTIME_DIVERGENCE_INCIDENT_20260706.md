# 🚨 Deployment Runtime Divergence Incident v0.1
**Date:** 06 Jul 2026  
**Branch:** recovery/june25-known-good  
**Severity:** Low  
**Status:** Resolved

---

# 1. Executive Summary

During deployment of the new Intelligence Warehouse UI (H5 v0.1), the following command was executed:

```bash
rsync -av --delete artifacts/admin-ui/dist/ /var/www/zenith-admin/
```

The `--delete` flag removed runtime-generated intelligence artifacts stored under:

```text
/var/www/zenith-admin/intelligence-data
```

The public website and CMS remained operational.

The incident only affected the admin intelligence surfaces.

---

# 2. Impact

Deleted runtime assets included:

- candidate queues
- intelligence packages
- dataset coverage packages
- article workbench packages
- generated graph manifests
- rendered SVG graph assets

Examples:

```text
candidate-queue-v0.2.json
dataset-coverage-engine-v0.1.json
article-workbench-package-v0.2.json
rendered-graph-assets-v0.3.json
generated graph SVG files
```

---

# 3. Systems Affected

Affected:

```text
Admin Intelligence Center
Article Workbench
Graph Packages
Candidate Review Pages
```

Not affected:

```text
Public website
CMS articles
Database
API
Authentication
```

---

# 4. Root Cause

Architectural discovery:

```text
/var/www/zenith-admin
```

contains three responsibilities:

```text
1. Frontend deployment target
2. Runtime intelligence datastore
3. Generated asset repository
```

Deployment tooling incorrectly assumed:

```text
Everything under /var/www/zenith-admin is disposable build output.
```

This assumption was false.

---

# 5. Recovery Actions

## Step 1

Restore intelligence packages:

```bash
mkdir -p /var/www/zenith-admin/intelligence-data

rsync -av artifacts/api-server/data/intelligence/ \
/var/www/zenith-admin/intelligence-data/
```

---

## Step 2

Re-render graph assets:

```bash
cd /opt/Zenith-Bridge-Gateway/artifacts/api-server

pnpm tsx src/scripts/render-graph-specification-v0.3.ts
```

Result:

```text
rendered_count: 10
```

---

# 6. Validation

Verified:

```text
candidate-queue-v0.2.json
dataset-coverage-engine-v0.1.json
article-workbench-package-v0.2.json
generated graph SVG assets
```

Admin UI returned to normal operation.

---

# 7. Preventive Measures

## Forbidden deployment command

```bash
rsync -av --delete artifacts/admin-ui/dist/ /var/www/zenith-admin/
```

---

## Approved deployment command

```bash
rsync -av artifacts/admin-ui/dist/ /var/www/zenith-admin/
```

---

# 8. Architectural Recommendation

Long-term recommendation:

Separate runtime data from deployment assets.

Proposed structure:

```text
/var/www/zenith-admin
    ├── frontend assets
    └── index.html

/var/lib/zenith-intelligence
    ├── intelligence-data
    └── generated-graphs
```

or

```text
/opt/Zenith-Bridge-Gateway/runtime
```

to avoid future accidental deletions.

---

# 9. Lessons Learned

The incident exposed a hidden architectural coupling between:

```text
Deployment
Runtime data
Generated assets
```

The recovery was straightforward because:

- source intelligence packages still existed
- graph assets could be regenerated

This incident should be treated as an important architecture discovery rather than a production outage.

---

# 10. Follow-up Actions

Recommended future work:

- document deployment procedures
- separate runtime storage
- add deployment safety checklist
- add backup verification before deployment
- consider making runtime data immutable during frontend deployment
