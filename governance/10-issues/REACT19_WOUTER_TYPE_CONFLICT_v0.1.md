# React 19 / Wouter Type Conflict

## Symptoms

TS2786:
- Route cannot be used as JSX component
- Link cannot be used as JSX component
- Lucide icons cannot be used as JSX component

## Cause

Likely mismatch between:

- React 19 typings
- Wouter version
- Lucide React typings

## Impact

Blocks repository push due to pre-push typecheck.

Does not affect Replay framework.

## Priority

Medium.

Fix after Replay and Hygiene milestones.
