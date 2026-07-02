# Dataset Layer v0.1 Checkpoint

Date:
2026-06-01

Status:
APPROVED

Objective:
Prove direct institutional dataset ingestion from SingStat Table Builder.

Result:
SUCCESS

Source:
SingStat Table Builder

Official APIs Confirmed:
- /api/table/resourceid
- /api/table/metadata/{resourceId}
- /api/table/tabledata/{resourceId}

Rate Limit:
100 calls/minute/IP

Pilot Table:
M355381

Title:
Index Of Industrial Production By Industry Cluster (2025 = 100), Monthly

Datasource:
Economic Development Board (EDB)

Coverage:
1983 Jan → 2026 Apr

Series:
26

Observations:
11,204

Artifacts:

Raw Metadata:
data/tablebuilder-access-tests/M355381-metadata.json

Raw Dataset:
data/dataset-pilots/m355381-all-series.json

Series Exports:
data/dataset-pilots/m355381-series/

Approved Normalized Dataset:
data/dataset-pilots/m355381-all-series-normalized-v0.1-approved.json

Key Learning:

TableBuilder structure:

Table
→ Series
→ Period
→ Value

Direct institutional dataset access is confirmed.

Future direction:

Phase 1:
Expand vertically within proven datasets.

Phase 2:
Add strategic tables:
- GDP
- CPI
- External Trade
- Labour Market
- Business Expectations

Phase 3:
Dataset → Ontology → Dashboard → Article pipeline.

Decision:
Approved for controlled expansion.
