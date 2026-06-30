# Replay Capability Inventory v0.1

Date: 2026-06-30  
Phase: F1 - Replay Capability Inventory  
Status: Draft v0.1

## 1. Purpose

This document inventories the current Replay capabilities discovered in the ZNBW repository after the hygiene phase.

The goal is to distinguish between:

- implemented capabilities
- partial capabilities
- duplicate or obsolete files
- missing orchestration
- future productization work

---

## 2. Discovery Summary

Clean replay-related inventory excluding `dist`, `node_modules`, and generated/vendor noise:

- Replay source/data/governance files: 77
- Replay data files: 33
- Replay source scripts: 33
- Replay governance/benchmark documents: 11+

Raw discovery files:

- `governance/07-audits/replay-discovery/replay-capability-files-v0.1.txt`
- `governance/07-audits/replay-discovery/replay-capability-grep-v0.1.txt`
- `governance/07-audits/replay-discovery/replay-capability-source-clean-v0.1.txt`

---

## 3. Historical Knowledge Layer

Status: Implemented / substantial  
Estimated maturity: 80-85%

### Evidence

Data files:

- `artifacts/api-server/data/replay/cases/replay-historical-case-registry-v0.1.json`
- `artifacts/api-server/data/replay/cases/waves/replay-historical-case-wave-1-v0.1.json`
- `artifacts/api-server/data/replay/cases/waves/replay-historical-case-wave-2-v0.1.json`
- `artifacts/api-server/data/replay/cases/waves/replay-historical-case-wave-3-v0.1.json`
- `artifacts/api-server/data/replay/taxonomy/replay-mechanism-taxonomy-v0.1.json`
- `artifacts/api-server/data/replay/coverage/replay-mechanism-coverage-v0.1.json`
- `artifacts/api-server/data/replay/coverage/replay-mechanism-taxonomy-coverage-v0.1.json`
- `artifacts/api-server/data/replay/replay-mechanism-gap-report-v0.1.json`
- `artifacts/api-server/data/replay/replay-case-acquisition-queue-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/merge-replay-historical-cases-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-mechanism-coverage-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-mechanism-taxonomy-coverage-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-mechanism-gap-report-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-case-acquisition-queue-v0.1.ts`

### Notes

This layer appears to contain the foundation of Replay: historical cases, case waves, mechanisms, coverage, gaps, and acquisition queue.

---

## 4. Quality Layer

Status: Implemented / substantial  
Estimated maturity: 70-80%

### Evidence

Data files:

- `artifacts/api-server/data/replay/audit/replay-audit-summary-v0.1.json`
- `artifacts/api-server/data/replay/audit/replay-case-audit-v0.1.json`
- `artifacts/api-server/data/replay/case-completeness-report-v0.1.json`
- `artifacts/api-server/data/replay/depth/replay-case-depth-audit-v0.1.json`
- `artifacts/api-server/data/replay/depth/replay-depth-enrichment-queue-v0.1.json`
- `artifacts/api-server/data/replay/depth/replay-depth-schema-v0.1.json`
- `artifacts/api-server/data/replay/replay-audit-report-v0.1.json`
- `artifacts/api-server/data/replay/replay-brainy-diagnosis-v0.1.json`
- `artifacts/api-server/data/replay/replay-quality-summary-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/build-replay-audit-engine-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-audit-summary-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-case-audit-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-case-depth-audit-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-depth-enrichment-queue-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-brainy-diagnosis-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-quality-summary-v0.1.ts`

### Notes

This layer appears to evaluate case quality, case completeness, depth, audit findings, and improvement opportunities.

---

## 5. Similarity & Analogue Layer

Status: Implemented / partial  
Estimated maturity: 60-70%

### Evidence

Data files:

- `artifacts/api-server/data/replay/replay-analogue-summary-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/run-replay-similarity-engine-v0.1.ts`
- `artifacts/api-server/src/scripts/run-replay-similarity-engine-v0.2.ts`
- `artifacts/api-server/src/scripts/build-replay-analogue-summary-v0.1.ts`

### Notes

This layer appears to contain the similarity engine and analogue summary generation. Version v0.2 exists for the similarity engine, suggesting active iteration.

---

## 6. Forecast & Explanation Layer

Status: Implemented / partial  
Estimated maturity: 60-70%

### Evidence

Data files:

- `artifacts/api-server/data/replay/replay-forecast-envelope-v0.1.json`
- `artifacts/api-server/data/replay/replay-confidence-engine-v0.1.json`
- `artifacts/api-server/data/replay/replay-explanation-summary-v0.1.json`
- `artifacts/api-server/data/replay/replay-historian-snapshot-v0.1.json`
- `artifacts/api-server/data/replay/papa-replay-dashboard-package-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/build-replay-forecast-envelope-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-confidence-engine-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-explanation-summary-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-historian-snapshot-v0.1.ts`
- `artifacts/api-server/src/scripts/build-papa-replay-dashboard-package-v0.1.ts`

### Notes

This layer appears to translate analogues into forecast ranges, confidence, explanations, historian output, and dashboard packaging.

---

## 7. Learning Layer

Status: Implemented / partial  
Estimated maturity: 60-70%

### Evidence

Data files:

- `artifacts/api-server/data/replay/history/replay-improvement-history-v0.1.json`
- `artifacts/api-server/data/replay/replay-confidence-history-v0.1.json`
- `artifacts/api-server/data/replay/replay-improvement-history-v0.1.json`
- `artifacts/api-server/data/replay/replay-improvement-report-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/build-replay-confidence-history-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-improvement-history-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-improvement-report-v0.1.ts`

### Notes

This layer appears to track confidence and improvement history over time.

---

## 8. Governance Layer

Status: Implemented / strong  
Estimated maturity: 90%

### Evidence

Data files:

- `artifacts/api-server/data/replay/replay-governance-history-v0.1.json`
- `artifacts/api-server/data/replay/replay-improvement-proposals-v0.1.json`
- `artifacts/api-server/data/replay/replay-production-promotion-report-v0.1.json`
- `artifacts/api-server/data/replay/replay-proposal-dashboard-v0.1.json`
- `artifacts/api-server/data/replay/replay-proposal-registry-v0.1.json`
- `artifacts/api-server/data/replay/replay-shadow-execution-report-v0.1.json`

Source scripts:

- `artifacts/api-server/src/scripts/replay-improvement-proposal-engine-v0.1.ts`
- `artifacts/api-server/src/scripts/replay-proposal-registry-v0.1.ts`
- `artifacts/api-server/src/scripts/approve-replay-proposal-v0.1.ts`
- `artifacts/api-server/src/scripts/reject-replay-proposal-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-proposal-dashboard-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-shadow-execution-v0.1.ts`
- `artifacts/api-server/src/scripts/promote-replay-proposal-v0.1.ts`
- `artifacts/api-server/src/scripts/build-replay-governance-history-v0.1.ts`

Governance docs:

- `governance/02-architecture/REPLAY_GOVERNANCE_FLOW_v0.1.md`

### Notes

This layer appears to support the full proposal, approval, shadow execution, audit, promotion, and governance history workflow.

---

## 9. Benchmark Layer

Status: Implemented / early  
Estimated maturity: 60-70%

### Evidence

Source script:

- `artifacts/api-server/src/scripts/run-replay-benchmark-v0.1.ts`

Governance docs:

- `governance/09-benchmarks/REPLAY_BENCHMARK_CASES_v0.1.md`
- `governance/09-benchmarks/REPLAY_BENCHMARK_FRAMEWORK_v0.1.md`
- `governance/09-benchmarks/REPLAY_CASE_EXPANSION_PLAN_v0.1.md`
- `governance/09-benchmarks/REPLAY_MILESTONE_2026-06-28.md`
- `governance/09-benchmarks/REPLAY_NEXT_PHASE_v0.1.md`
- `governance/09-benchmarks/REPLAY_PHASE_2_STATUS_v0.1.md`
- `governance/09-benchmarks/REPLAY_V0.2_PROGRESS_v0.1.md`

Benchmark outputs:

- `governance/09-benchmarks/replay-benchmark-results/replay-benchmark-results-2026-06-27T10-24-33-171Z.json`
- `governance/09-benchmarks/replay-benchmark-results/replay-benchmark-results-2026-06-27T10-26-10-008Z.json`
- `governance/09-benchmarks/replay-benchmark-results/replay-benchmark-results-2026-06-27T10-27-25-965Z.json`

### Notes

Replay has benchmark documentation and multiple benchmark result files. This suggests validation work has already started.

---

## 10. Initial Capability Matrix

| Capability | Status | Evidence |
|---|---|---|
| Historical case registry | Implemented | Registry + wave files |
| Mechanism taxonomy | Implemented | Taxonomy + coverage files |
| Mechanism gap analysis | Implemented | Gap report + builder |
| Case acquisition queue | Implemented | Queue + builder |
| Case audit | Implemented | Audit files + builders |
| Depth audit | Implemented | Depth audit + enrichment queue |
| Brainy diagnosis | Implemented | Diagnosis output + builder |
| Similarity engine | Implemented / evolving | v0.1 and v0.2 scripts |
| Analogue summary | Implemented | Analogue summary output + builder |
| Forecast envelope | Implemented / partial | Forecast envelope output + builder |
| Confidence engine | Implemented / partial | Confidence engine + history |
| Explanation summary | Implemented / partial | Explanation output + builder |
| Historian snapshot | Implemented / partial | Historian output + builder |
| Dashboard package | Implemented / partial | Papa dashboard package |
| Improvement proposals | Implemented | Proposal engine + registry |
| Shadow execution | Implemented | Shadow execution report + builder |
| Approval/rejection | Implemented | Approve/reject scripts |
| Production promotion | Implemented | Promotion script + report |
| Governance history | Implemented | Governance history builder/output |
| Benchmarking | Implemented / early | Framework, cases, results |

---

## 11. Initial Architecture Interpretation

Replay is not a single missing engine. It is a set of already-created capabilities that need consolidation into a canonical pipeline.

Current implied pipeline:

```text
Historical Cases
↓
Mechanism Taxonomy
↓
Coverage / Gap Analysis
↓
Case Audit / Depth Audit
↓
Similarity Engine
↓
Analogue Summary
↓
Forecast Envelope
↓
Confidence Engine
↓
Explanation Summary
↓
Historian Snapshot
↓
Dashboard Package
↓
Improvement Proposals
↓
Shadow Execution
↓
Approval / Rejection
↓
Promotion
↓
Governance History
