#!/usr/bin/env bash
set -euo pipefail

plan=PR-PLAN.md
poll_attempts=${CONTINUUM_FINALIZER_POLL_ATTEMPTS:-10}
poll_seconds=${CONTINUUM_FINALIZER_POLL_SECONDS:-1}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "not inside a Git worktree" >&2
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

branch=$(git symbolic-ref --quiet --short HEAD || true)
if [[ -z "$branch" ]]; then
  echo "detached HEAD; check out the PR branch before finalizing" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "tracked worktree changes are present; refusing to mix them with finalization" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required to verify the PR is Ready" >&2
  exit 1
fi

IFS=$'\t' read -r state is_draft head_ref head_oid head_repo < <(
  gh pr view --json state,isDraft,headRefName,headRefOid,headRepository \
    --jq '[.state, (.isDraft | tostring), .headRefName, .headRefOid, .headRepository.nameWithOwner] | @tsv'
)

if [[ "$state" != "OPEN" || "$is_draft" != "false" ]]; then
  echo "the current branch must belong to an open Ready PR" >&2
  exit 1
fi

if [[ "$head_ref" != "$branch" ]]; then
  echo "current branch '$branch' does not match PR head '$head_ref'" >&2
  exit 1
fi

if [[ -z "$head_repo" || "$head_repo" == "null" ]]; then
  echo "could not determine the PR head repository" >&2
  exit 1
fi
head_repo_key=$(printf '%s' "$head_repo" | tr '[:upper:]' '[:lower:]')

if [[ "$(git rev-parse HEAD)" != "$head_oid" ]]; then
  echo "local HEAD differs from PR HEAD; refusing to push other commits" >&2
  exit 1
fi

if [[ ! -e "$plan" ]]; then
  echo "$plan is already absent from the PR"
  exit 0
fi

if ! git ls-files --error-unmatch "$plan" >/dev/null 2>&1; then
  echo "$plan exists but is not tracked" >&2
  exit 1
fi

github_repo_from_remote_url() {
  local url=$1
  local slug

  url=${url%/}
  url=${url%.git}

  case "$url" in
    git@github.com:*) slug=${url#git@github.com:} ;;
    ssh://git@github.com/*) slug=${url#ssh://git@github.com/} ;;
    https://github.com/*) slug=${url#https://github.com/} ;;
    http://github.com/*) slug=${url#http://github.com/} ;;
    *) return 1 ;;
  esac

  printf '%s\n' "$slug"
}

head_remote=
head_remote_url=
while IFS= read -r remote; do
  remote_url=$(git remote get-url --push --all "$remote" 2>/dev/null || true)
  [[ -n "$remote_url" ]] || continue
  # A named remote pushes to every push URL; reject ambiguous destinations.
  [[ "$remote_url" != *$'\n'* ]] || continue
  remote_repo=$(github_repo_from_remote_url "$remote_url" 2>/dev/null || true)
  remote_repo_key=$(printf '%s' "$remote_repo" | tr '[:upper:]' '[:lower:]')
  remote_matches_head=false
  if [[ -n "$remote_repo" ]]; then
    if [[ "$remote_repo_key" == "$head_repo_key" ]]; then
      remote_matches_head=true
    else
      # GitHub keeps old repository URLs working after a rename. Resolve the
      # configured slug canonically before rejecting an otherwise valid remote.
      canonical_repo=$(gh api "repos/$remote_repo" --jq .full_name 2>/dev/null || true)
      canonical_repo_key=$(printf '%s' "$canonical_repo" | tr '[:upper:]' '[:lower:]')
      if [[ -n "$canonical_repo" && "$canonical_repo_key" == "$head_repo_key" ]]; then
        remote_matches_head=true
      fi
    fi
  fi
  if [[ "$remote_matches_head" == "true" ]]; then
    head_remote=$remote
    head_remote_url=$remote_url
    break
  fi
done < <(git remote)

if [[ -z "$head_remote" ]]; then
  echo "no Git remote has a single push URL matching PR head repository '$head_repo'" >&2
  exit 1
fi

git rm -- "$plan"

staged=$(git diff --cached --name-only)
if [[ "$staged" != "$plan" ]]; then
  echo "finalization staged an unexpected path; aborting before commit" >&2
  git restore --staged -- "$plan"
  git restore -- "$plan"
  exit 1
fi

git commit -m "chore: remove temporary PR plan"
local_oid=$(git rev-parse HEAD)

if ! git push "$head_remote" "HEAD:refs/heads/$head_ref"; then
  echo "failed to push cleanup commit to '$head_remote' branch '$head_ref'" >&2
  exit 1
fi

# Query the push URL: the remote's fetch URL may point to a different repository.
if ! remote_oid=$(git ls-remote "$head_remote_url" "refs/heads/$head_ref" | awk 'NR == 1 { print $1 }'); then
  echo "cleanup push succeeded, but remote branch verification failed for '$head_ref'" >&2
  exit 1
fi
if [[ "$remote_oid" != "$local_oid" ]]; then
  echo "push returned success, but remote branch '$head_ref' is '$remote_oid' instead of '$local_oid'" >&2
  exit 1
fi

observed_oid=
for ((attempt = 1; attempt <= poll_attempts; attempt++)); do
  if ! observed_oid=$(gh pr view --json headRefOid --jq .headRefOid); then
    echo "remote branch '$head_ref' is at '$local_oid', but GitHub PR metadata could not be read; the push succeeded" >&2
    exit 1
  fi
  if [[ "$observed_oid" == "$local_oid" ]]; then
    echo "Continuum PR plan removed and pushed from $branch"
    exit 0
  fi
  if (( attempt < poll_attempts )); then
    sleep "$poll_seconds"
  fi
done

echo "remote branch '$head_ref' is at '$local_oid', but GitHub PR metadata still reports '$observed_oid' after $poll_attempts checks; the push succeeded and PR metadata may still be propagating" >&2
exit 1
