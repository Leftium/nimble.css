---
continuum: 0.1.0
status: draft
---

# Continuum

This repository uses the Continuum multi-agent workflow.

## Start here

Humans:
- Issues: https://github.com/Leftium/nimble.css/issues
- Pull requests: https://github.com/Leftium/nimble.css/pulls
- Milestones: https://github.com/Leftium/nimble.css/milestones

Agents:
1. Read this file before coordinating or modifying work.
2. Inspect open Continuum issues and pull requests.
3. Treat current Git and GitHub state, together with tracked project policy, as authoritative over stale or private handoff prose.
4. Do not modify an implementation branch unless you hold its run-scoped write lease.
5. Release any write lease before yielding control or ending a normal writing turn, unless the lease is explicitly suspended while waiting for required human approval.
6. Live workflow state belongs in GitHub; do not duplicate mutable state in this file.

## Repository conventions

- The `continuum` label identifies Continuum workflow issues.
- GitHub issues are the canonical units of work.
- GitHub milestones optionally group larger outcomes.
- Issue relationships express ordering and dependencies; avoid sequence numbers when possible.
- Create implementation branches and pull requests only when work actually starts.
- Prefer the GitHub connector when available. If a required operation is unavailable, give the human an exact `gh` CLI command.

## Write leases

A lease is scoped to one implementation branch and one active writing run. Draft/Ready describes the PR lifecycle; it does not by itself identify a writer.

- **Acquiring before a PR exists**: record the intended writer in the issue. That temporary claim authorizes creating the branch, first commit, push, and Draft PR.
- **Draft PR**: implementation is still open. A Draft PR may normally rest with no active lease between writing runs.
- **Acquiring a Draft PR**: verify the current HEAD and that no other writer holds the lease, then durably record the writer (for example, `Writer: T3 / Codex`) before modifying the branch.
- **Releasing**: before yielding control or ending normally, commit and push the coherent checkpoint, record any needed handoff, durably release the lease, and stop writing. Incomplete work remains Draft + no active lease.
- **Approval pause**: if required human approval blocks commit, push, or another operation needed to create that checkpoint, durably record the blocked operation and suspend the lease while yielding. The same writer retains ownership; no other writer may acquire the branch. After approval, resume, create the checkpoint, and release normally. If the human abandons the suspended run, lease recovery explicitly accepts that uncommitted or unpushed work may be discarded.
- **Transfer**: a new writer acquires the unleased Draft PR at its verified checkpoint. Transfer is logically release + acquire; Ready is not required.
- **Ready PR**: implementation is write-stopped, has no active lease, and is available for review or handoff.
- Agents that do not hold a branch's lease may inspect and review it but must not write to it.
- Concurrent leases are allowed unless issue dependencies or project policy make the work unsafe to overlap.

If review requests changes, convert the PR back to Draft, acquire a run-scoped lease at the current HEAD, apply and verify fixes, release the lease, and return the PR to Ready only when implementation is complete again.

If a writing run terminates abnormally, a human may recover an evidently stale lease after establishing that the recorded writer is no longer actively writing and recording the recovery durably. A suspended approval lease is not stale merely because the writer is waiting on the human.

This is a cooperative convention rather than an atomic distributed lock. Stronger mechanics may be added later without changing the human-visible Draft and Ready lifecycle states.

## Issue lifecycle

A Continuum issue should describe the goal, relevant durable context and decisions, constraints, acceptance criteria, dependencies, and current handoff when active.

Prefer issue comments for durable product and scope decisions, blockers, dependencies, and acceptance changes. Prefer PR comments for implementation checkpoints, commit IDs, verification, review findings, and handoffs for fixes. Link between them instead of repeating long handoffs. Do not copy live GitHub fields, such as Draft/Ready or review status, into tracked files or long-lived PR prose.

When implementation begins:
1. record the intended writer in the issue;
2. create a fresh branch from the accepted base and make the initial commit;
3. create a Draft PR linked to the issue;
4. acquire the branch's run-scoped lease before further writes;
5. release the lease before the writing turn yields or ends.

When implementation finishes:
1. verify the work;
2. update the PR and issue with durable results;
3. release any active write lease;
4. mark the PR Ready;
5. review and merge;
6. close the issue when its acceptance criteria are satisfied.

## Recovery

When returning after an absence:
1. inspect open Continuum issues;
2. inspect milestone grouping when an issue has one;
3. identify blocked and ready work from issue relationships;
4. inspect linked PRs;
5. interpret each Draft PR as incomplete implementation that may be unleased between writing runs; inspect its latest lease record separately. Treat each Ready PR as write-stopped, unleased, and available for review or handoff.

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
