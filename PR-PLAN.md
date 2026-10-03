# PR Plan

Issue: #22

## Goal

Upgrade nimble.css from Continuum 0.1.0 to the accepted 0.3.0 exact-copy installation contract.

## Scope

- Replace root `CONTINUUM.md` with the exact accepted upstream file.
- Replace only the managed Continuum block in `AGENTS.md` with the exact upstream block; preserve any project-owned content outside the markers.
- Add `templates/PR-PLAN.md` exactly from upstream.
- Add executable `scripts/continuum-finalize-pr.sh` exactly from upstream.
- Do not change CSS source/output, package metadata, demos, publish/release workflows, or unrelated issues.

## Checkpoint A — install managed surfaces

- Sync `CONTINUUM.md` exactly.
- Sync the managed `AGENTS.md` block exactly.
- Add `templates/PR-PLAN.md`.
- Add executable `scripts/continuum-finalize-pr.sh`.
- Verify all managed surfaces against `Leftium/continuum/main`.
- Commit and non-force-push the coherent checkpoint, then continue without yielding.

## Checkpoint B — repository verification

- Run/confirm `pnpm test`.
- Run/confirm `pnpm build`.
- Inspect the complete diff for workflow-only scope.
- Confirm no publish/release operation was performed.
- Record any migration friction for `Leftium/continuum#9`.
- Release the write lease and mark Ready for independent review.

## Verify

- `CONTINUUM.md` equals accepted upstream exactly.
- managed `AGENTS.md` block equals accepted upstream exactly.
- `templates/PR-PLAN.md` equals accepted upstream exactly.
- `scripts/continuum-finalize-pr.sh` equals accepted upstream exactly and is executable.
- `pnpm test`.
- `pnpm build`.
- triggered GitHub checks.
- diff contains only expected Continuum files plus temporary root `PR-PLAN.md`.

The user controls final merge.
