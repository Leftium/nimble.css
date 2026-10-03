---
continuum: 0.3.0
status: draft
---

# Continuum

This repository uses the Continuum multi-agent workflow.

## Start here

Humans:
- Use this repository's GitHub Issues for Continuum work units.
- Use this repository's GitHub Pull Requests for implementation and review.
- Use this repository's GitHub Milestones when grouping is useful.

Agents:
1. Read this file before coordinating or modifying work.
2. Inspect open Continuum issues and pull requests.
3. Treat current Git and GitHub state, together with tracked project policy, as authoritative over stale or private handoff prose.
4. Do not modify an implementation branch without its run-scoped write lease, except for the cleanup-only PR-plan finalizer described below.
5. Release any write lease before yielding control or ending a normal writing turn, unless the lease is explicitly suspended while waiting for required human approval.
6. Live workflow state belongs in GitHub; do not duplicate mutable state in this file.

## Repository conventions

- The `continuum` label identifies Continuum workflow issues.
- GitHub issues are the canonical units of work.
- GitHub milestones optionally group larger outcomes.
- Issue relationships express ordering and dependencies; avoid sequence numbers when possible.
- Create implementation branches and pull requests only when work actually starts.
- Every implementation PR carries a temporary root `PR-PLAN.md` on its branch. The file is created before the Draft PR and deleted before merge.
- Prefer the GitHub connector when available. If a required operation is unavailable, give the human an exact `gh` CLI command.
- `CONTINUUM.md` is vendor-managed protocol text. Keep installed copies byte-identical to the accepted Continuum reference; do not add repository-specific policy here.
- Put repository-specific workflow policy in project-owned `AGENTS.md` content outside the managed Continuum markers, or in dedicated project docs/specs referenced there.

## PR execution defaults

A writer holding a Continuum PR lease has standing human authorization for routine, in-scope, non-destructive repository work needed to execute the issue and `PR-PLAN.md`, unless project policy narrows that authority. Where the harness accepts repository policy as approval, proceed without separate approval for inspection, edits, formatting, tests, builds, plan-required package-manager operations, normal branch switching, commits, and non-force pushes to the PR branch. Continue through all planned checkpoints without asking whether to proceed.

A **checkpoint** is a durable savepoint. At each planned checkpoint, run the appropriate focused verification, commit and non-force-push the coherent state, then continue under the same lease. Add a checkpoint comment when it records useful durable evidence or context. Yield only for a scope or product decision, an operation outside standing authorization, an external blocker, or when the run must end.

This standing authorization does **not** permit force-pushes or history rewrites, merging into the integration/default branch, destructive reset/clean operations, discarding unrelated local changes, deleting unrelated data, publishing/releases/deployments, production or external-infrastructure changes, credential/secret changes, paid or irreversible external actions, or scope/decision changes that otherwise require human input. Higher-precedence system or harness restrictions still apply.

Prefer the current project worktree for Continuum PR work. Before switching branches, inspect the current branch and worktree state. If switching to the PR branch can be done without losing, overwriting, or accidentally mixing staged, unstaged, or conflicting untracked work, switch in place. Do not create a separate worktree/workspace merely for isolation. If in-place switching is unsafe, preserve the existing changes and use a separate worktree/workspace; never auto-stash, reset, clean, or discard user work just to make the switch possible.

## Write leases

A lease is scoped to one implementation branch and one active writing run. Draft/Ready describes the PR lifecycle; it does not by itself identify a writer.

- **Acquiring before a PR exists**: record the intended writer in the issue. That temporary claim authorizes creating the branch, the initial root `PR-PLAN.md` commit, push, and Draft PR.
- **Draft PR**: implementation is still open. A Draft PR may normally rest with no active lease between writing runs.
- **Acquiring a Draft PR**: verify the current HEAD and that no other writer holds the lease, then durably record the writer (for example, `Writer: T3 / Codex`) before modifying the branch.
- **Checkpoint**: a coherent, verified, committed, pushed savepoint within the same active writing run. It does not release the lease or imply a handoff; continue to the next planned checkpoint by default.
- **Releasing**: before yielding control or ending normally, commit and push the current coherent state, record any needed handoff, durably release the lease, and stop writing. Incomplete work remains Draft + no active lease.
- **Approval suspension**: if required human approval blocks commit, push, or another operation needed to create that checkpoint, durably record the blocked operation and suspend the lease while yielding. The same writer retains ownership; no other writer may acquire the branch. After approval, resume the same run, create the checkpoint, and continue through the plan. Release the lease when the run ends or yields again. If the human abandons the suspended run, lease recovery explicitly accepts that uncommitted or unpushed work may be discarded.
- **Transfer**: a new writer acquires the unleased Draft PR at its verified checkpoint. Transfer is logically release + acquire; Ready is not required.
- **Ready PR**: implementation is write-stopped, has no active lease, and is available for review or handoff. The cleanup-only PR-plan finalizer is the sole branch-write exception.
- Agents that do not hold a branch's lease may inspect and review it but must not make implementation changes.
- Concurrent leases are allowed unless issue dependencies or project policy make the work unsafe to overlap.

If review requests changes, convert the PR back to Draft, acquire a run-scoped lease at the current HEAD, apply and verify fixes, release the lease, and return the PR to Ready only when implementation is complete again.

If a writing run terminates abnormally, a human may recover an evidently stale lease after establishing that the recorded writer is no longer actively writing and recording the recovery durably. A suspended approval lease is not stale merely because the writer is waiting on the human.

This is a cooperative convention rather than an atomic distributed lock. Stronger mechanics may be added later without changing the human-visible Draft and Ready lifecycle states.

## Issue lifecycle

A Continuum issue should describe the goal, relevant durable context and decisions, constraints, acceptance criteria, dependencies, and current handoff when active.

Prefer issue comments for durable product and scope decisions, blockers, dependencies, and acceptance changes. Prefer PR comments for implementation checkpoints, commit IDs, verification, review findings, and handoffs for fixes. Link between them instead of repeating long handoffs. Do not copy live GitHub fields, such as Draft/Ready or review status, into tracked files or long-lived PR prose.

When implementation begins:
1. record the intended writer in the issue;
2. create a fresh branch from the accepted base;
3. create root `PR-PLAN.md` as the initial branch commit;
4. create a Draft PR linked to the issue;
5. acquire the branch's run-scoped lease before further writes;
6. release the lease before the writing turn yields or ends.

When implementation finishes:
1. verify the work;
2. update the PR and issue with durable results;
3. release any active write lease;
4. mark the PR Ready;
5. review the implementation against the issue and `PR-PLAN.md`;
6. promote durable plan knowledge, and review any repository changes before cleanup;
7. once review is otherwise clean, run the repository's Continuum finalizer to delete only root `PR-PLAN.md` in a cleanup-only commit;
8. confirm root `PR-PLAN.md` is absent; ordinary repository checks may run on the final cleanup commit, but Continuum does not require substantive re-review merely because the temporary plan was deleted;
9. merge;
10. close the issue when its acceptance criteria are satisfied.

## PR plan

Every Continuum implementation PR uses a root `PR-PLAN.md` as temporary shared working memory for that branch.

Keep the responsibilities separate:

- **Issue**: durable goal, scope, acceptance criteria, dependencies, and product/project decisions.
- **`PR-PLAN.md`**: implementation approach, checkpoints, evidence, verification plan, and implementation-level decisions needed to complete and review this PR.
- **PR comments**: checkpoint commits and results, review findings, fix handoffs, and other implementation history.
- **GitHub state**: Draft/Ready lifecycle and run-scoped write-lease ownership.

The plan is required, but its size is proportional to the work. A trivial change may need only Goal, Scope, and Verify. Do not add empty boilerplate merely to make the file longer.

Do not copy mutable workflow state into the plan. In particular, current writer, current HEAD, Draft/Ready status, latest test result, and review status belong in GitHub or PR comments.

If the plan names checkpoints, treat them as savepoints within one writing run unless a checkpoint explicitly calls for a human decision or another real stop condition. Do not ask for permission merely to proceed from one planned checkpoint to the next.

Keep the plan synchronized when the implementation approach materially changes. Durable scope or acceptance changes belong on the issue first; durable repository knowledge belongs in specs, docs, tests, or code as appropriate.

The root plan is temporary and must not land on the integration branch. Promote durable knowledge before review is complete.

Confirm review is otherwise clean before running `bash scripts/continuum-finalize-pr.sh`; the helper cannot determine that from GitHub state. It requires a clean tracked worktree, local HEAD matching the PR, and a current branch belonging to an open Ready PR. It also requires a remote with a single push URL matching the PR head repository. The helper creates a cleanup-only commit deleting root `PR-PLAN.md`, pushes explicitly to the PR head branch, and verifies the branch at the push destination. It then polls GitHub PR metadata for a bounded interval to tolerate propagation lag. If the helper is unavailable, the pre-authorized fallback is `git rm PR-PLAN.md`, commit only that deletion as `chore: remove temporary PR plan`, and push normally.

This narrow finalization step is standing-authorized, may run while the PR remains Ready, and does not require a normal write lease or substantive re-review. Repository rules may still mechanically require checks or approval on the new HEAD. If substantive implementation resumes after cleanup, return the PR to Draft, acquire a lease, and recreate the root plan before other implementation changes. A durable starter template may live at `templates/PR-PLAN.md`; that template is not the temporary branch plan.

Handoffs should normally point the next agent to the issue, PR, root `PR-PLAN.md`, and latest relevant PR comment rather than reproducing the plan in chat.

## Recovery

When returning after an absence:
1. inspect open Continuum issues;
2. inspect milestone grouping when an issue has one;
3. identify blocked and ready work from issue relationships;
4. inspect linked PRs;
5. read root `PR-PLAN.md` on each active implementation branch;
6. inspect the latest relevant PR comments and lease record;
7. interpret each Draft PR as incomplete implementation that may be unleased between writing runs. Treat each Ready PR as write-stopped and unleased except for the narrow cleanup-only PR-plan finalizer described above.

Branches are implementation artifacts, not the project dashboard.

## Bootstrap

If this repository is missing Continuum metadata, create the `continuum` label:

```sh
gh label create continuum \
  --description "Managed by the Continuum workflow" \
  --color 5319E7
```

If the repository has multiple long-lived accepted integration bases, make Continuum discoverable from each base with compatible `AGENTS.md` / `CONTINUUM.md` files or an equally reliable project-policy discovery path.

Project policy may define risk-tiered verification for bounded fixes versus deployment/layout/persistence/runtime-boundary changes. For archaeology or restoration work, it may also require a behavior/semantics inventory before implementation starts.

Create GitHub milestones only when useful for grouping:

```sh
gh api --method POST repos/{owner}/{repo}/milestones \
  -f title='Milestone title'
```

Prefer native GitHub issue dependency and sub-issue relationships when available through the current `gh` version.

## Protocol

See the [Continuum protocol specification](https://github.com/Leftium/continuum/blob/main/specs/001-continuum.md) for protocol and migration guidance.
