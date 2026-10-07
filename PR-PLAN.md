# PR Plan

Issue: #25

## Goal

Migrate `main` from repository-installed Continuum 0.3 to published stable Continuum 0.6.1 at `fab456f5cf6641f2e895d74d17156a98acdc76ef`.

The migration PR itself remains governed by Continuum 0.3 through review, plan finalization, and merge. The merge is the migration boundary; subsequent new implementation PRs bootstrap with external Continuum 0.6.1.

## Scope

- Remove root `CONTINUUM.md`.
- Remove the managed Continuum block from `AGENTS.md`; preserve any project-owned instructions. If no project-owned content remains beyond an empty shell/header, remove the empty file rather than leaving misleading policy scaffolding.
- Remove `scripts/continuum-finalize-pr.sh`, `templates/PR-PLAN.md`, and other clearly vendor-managed 0.3-only Continuum support files/references.
- Remove stale operational references to deleted 0.3 files (for example ignore/config entries), while leaving historical references intact.
- Do not rewrite historical issues, PR comments, leases, branches, tags, or merged PRs.
- Preserve the existing `continuum` GitHub label for discovery metadata.
- Do not install 0.6.1 files into the repository; new 0.6.1 PRs use the immutable external protocol pin.

## Verify

- Confirm installed 0.3 protocol/finalizer/template/managed-policy machinery and stale operational references are absent from the PR head, except intentional historical references.
- Confirm any project-owned `AGENTS.md` content is preserved; if none exists, confirm no misleading empty Continuum policy shell remains.
- Run the repository checks appropriate for this workflow-only change and record results on the PR.
- Before merge, complete independent review, then remove only the temporary root `PR-PLAN.md` using the existing 0.3 cleanup-only finalization procedure or its authorized fallback if the helper has already been deleted.
