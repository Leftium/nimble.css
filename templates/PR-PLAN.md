# PR Plan

Issue: #<issue-number>

<!--
Keep this plan proportional to the PR. Goal / Scope / Verify are enough for a
small change. Add checkpoints, evidence, risks, or implementation decisions only
when they help another agent implement or review the branch.

Checkpoints are durable savepoints, not default stopping points. During one leased
writing run, verify, commit, and non-force-push each coherent checkpoint, then
continue to the next without asking whether to proceed. Yield only for a scope or
product decision, an operation outside standing authorization, an external blocker,
or when the run must end.

Do not record mutable workflow state here: current writer, current HEAD,
Draft/Ready status, latest test result, and review status belong in GitHub or PR
comments.

Before merge, promote durable knowledge to its proper home. After review is
otherwise clean, run `bash scripts/continuum-finalize-pr.sh` when available to
delete the root PR-PLAN.md in the cleanup-only final commit. This template remains
in templates/.
-->

## Goal

<What this PR changes and why.>

## Scope

- <implementation boundary>
- <important constraint>

## Verify

- <focused check>
