# Replay Canonical Pipeline v0.1

Date: 2026-06-30  
Phase: F3 - Canonical Replay Pipeline  
Status: Draft v0.1

## 1. Purpose

This document defines the canonical Replay pipeline for ZNBW.

The purpose is to turn the discovered Replay components into one official execution model.

This document does not yet implement the orchestrator. It defines what the orchestrator should eventually run.

Future target command:

```bash
pnpm replay:full-cycle

## Similarity Blocker Finding

The similarity and analogue layer is implemented but not yet ready for inclusion in the safe full-cycle orchestrator.

### Step 11 - Similarity Engine v0.2

Script:

```text
artifacts/api-server/src/scripts/run-replay-similarity-engine-v0.2.ts
