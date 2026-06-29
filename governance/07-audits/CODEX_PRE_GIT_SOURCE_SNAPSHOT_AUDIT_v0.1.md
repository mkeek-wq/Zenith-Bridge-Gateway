# Codex Audit Brief – Pre-Git Source Snapshot v0.1

## Branch

`safety/discovered-untracked-code`

## Key commits

- `5f25f99` – Safety snapshot of pre-Git ZNBW source and data
- `60277bd` – Record Git preservation snapshot in hygiene registers

## Context

Git pushing began only after the Codex audit phase. The VPS contained months of ZNBW source code, generated data, Replay/Article/CMS scripts, and governance outputs that were not yet versioned.

A preservation snapshot was created before cleanup.

## Audit Objective

Review the newly preserved files and classify risk.

## Please assess

1. Secrets or credentials accidentally included.
2. Runtime/generated data that should not remain in Git long-term.
3. Source files that appear production-critical.
4. Duplicate/legacy/backup files.
5. Large or noisy directories that should move to `.gitignore`.
6. Whether this branch should be merged, partially cherry-picked, or kept only as a recovery snapshot.

## Known concerns

- Large data snapshot included.
- Many generated JSON files included.
- Some checkpoint folders included.
- Remaining working tree still has modified/deleted/untracked files.
- `.env` files were checked and are ignored, but secret scanning should still be reviewed.

## Current safety rule

Do not run `git add .`.

Use targeted commits only.

## Desired output

- Go / No-Go for keeping this branch.
- Recommended `.gitignore` additions.
- Recommended files/directories to keep in Git.
- Recommended files/directories to move outside Git.
- Suggested cleanup sequence.
