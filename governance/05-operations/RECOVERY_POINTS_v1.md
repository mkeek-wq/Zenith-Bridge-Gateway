# Recovery Points v1

## Purpose

This document records known safe recovery points for the Zenith Nova Bridge Wave platform.

Use this file when work needs to be rolled back, resumed, audited, or reconstructed after an unsafe change.

## Important Branches

- main
- safety/phase-c-before-cleanup
- safety/discovered-untracked-code
- hygiene/phase-d-clean-source-selection
- phase-f-replay-inventory

## Important Tags

- zenith-phase-c-safe-base
- zenith-phase-d-hygiene-findings-v0.1
- zenith-phase-d-typecheck-green-v0.1
- zenith-phase-d-legacy-cleanup-v0.1
- zenith-replay-governance-cycle-v0.1
- zenith-phase-f-replay-quality-layer-v0.1

## Current Stable Replay Checkpoint

Branch: phase-f-replay-inventory

Status: Replay full-cycle Steps 1-10 executable and stable.

## Stashes

- stash@{0}: phase-d-express-session-dependency-attempt
- stash@{1}: phase-d-dirty-working-tree-before-clean-source-selection
- stash@{2}: WIP on main

Before applying any stash, inspect it first:

git stash list
git stash show --stat 'stash@{0}'
git stash show -p 'stash@{0}'

Do not apply stashes directly onto production-facing branches without a new safety branch.

## Last Known Stable State

Date: 2026-06-30

Branch: phase-f-replay-inventory

Replay status:

- Steps 1-10 executable.
- Steps 11-12 blocked pending canonical replay input.
