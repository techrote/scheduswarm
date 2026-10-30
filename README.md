# Scheduswarm

Scheduswarm is a repository-coordinated pattern for running bounded, parallel, self-handing-off one-shot ChatGPT scheduled tasks across software/research projects.

It replaces long-lived “repeat the same prompt every hour” loops with **state-driven successor tasks**:

1. audit the live project state;
2. select one highest-value dependency-ready objective;
3. reserve a non-overlapping lane/write set;
4. execute and qualify bounded work;
5. publish a durable repository checkpoint;
6. either stop, wait on a real dependency, or create exactly one successor for that lane;
7. create additional one-shot lanes only when work is genuinely independent and the project policy permits it.

Scheduswarm is a **coordination method**, not an authority override. Project-local AGENTS/RAG/protocol/release/scientific rules remain authoritative.

## Core documents

- [Operating model](docs/OPERATING_MODEL.md) — lane lifecycle, successor rules, limits and integration ownership.
- [Edge cases](docs/EDGE_CASES.md) — collision, stale state, blocked work, automation failure, CI and evidence hazards.
- [Project policy template](templates/SCHEDUSWARM.md) — copy/adapt into each participating repository.
- [One-shot task contract](templates/ONE_SHOT_TASK_PROMPT.md) — reusable successor prompt structure.

## Two different limits

Scheduswarm deliberately separates:

- **maximum active lanes** — the maximum number of logical workstreams/successor chains that may be alive for one project, whether currently executing, waiting on CI, or awaiting their next one-shot run;
- **project concurrency budget** — the maximum number of those lanes allowed to execute or be intentionally launched into the same coordination window at once.

Example: `max_active_lanes: 3`, `project_concurrency_budget: 2` means lanes A/B/C may all exist, but at most two should run concurrently. The third is staggered or waits.

The first limit controls **coordination complexity**. The second controls **simultaneous race/resource pressure**.

## Default policy

Unless a project-local `SCHEDUSWARM.md` overrides it:

- `max_active_lanes: 3`
- `project_concurrency_budget: 2`
- one serialized integration owner
- one successor per lane
- no automatic widening after repeated no-progress runs
- no resurrection of paused projects merely because capacity exists
- no training, merge, release, publication, held-out access or other gated action solely because a predecessor task suggested it

## Authority

A participating repository should contain its own `SCHEDUSWARM.md` with project-specific limits, gate references, ownership rules and lane classes. Live ownership should be recorded append-only in issues/PRs/comments rather than by having parallel workers race on one mutable “current-state” file.

Scheduswarm documents reusable technique; it does not replace project-local authority.
