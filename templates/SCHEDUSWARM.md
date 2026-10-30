# SCHEDUSWARM.md — project policy template

> Copy and adapt this file inside the target repository. Project-local authority outranks the generic Scheduswarm hub.

## Adoption

```yaml
scheduswarm_version: 1
status: active
hub: https://github.com/techrote/scheduswarm
max_active_lanes: 3
project_concurrency_budget: 2
successors_per_lane: 1
integration_writes_parallel: false
```

## Meaning of limits

- **max_active_lanes**: maximum number of logical successor chains that may remain alive, including scheduled/waiting lanes.
- **project_concurrency_budget**: maximum number intentionally allowed to execute/be launched in the same coordination window.
- Example 3/2: lanes A/B/C may exist; at most two execute concurrently.

## Project authority

List mandatory files/issues/decisions every lane must read before work.

## Lane classes

Define allowed lane classes, for example:

| Lane class | Purpose | Typical write set | May integrate shared registries? |
|---|---|---|---|
| critical-path | highest-value blocker | scoped source/tests/evidence | no |
| independent | useful parallel work | independent subsystem | no |
| readiness | downstream preparation | harness/docs/tests | no |
| integration | serialized cross-lane reconciliation | shared authority/status | yes |

## Serialized surfaces

List files/registries that only the integration owner may update while multiple lanes are active.

## Lane admission

Require independence, dependency readiness, non-overlapping writes, distinct acceptance criteria, no equivalent active owner and available capacity.

## Successor rule

Each lane may create exactly one one-shot successor when substantive dependency-ready work remains. It must stop for human authorization, duplicate ownership, complete project state or repeated no-progress.

## Evidence and safety gates

Record project-specific gates that Scheduswarm cannot override.

## Live ownership

Use append-only GitHub issue/PR comments plus branches/PRs as live ownership records. Avoid a shared mutable current-state file that parallel tasks would race to edit.

## Scheduling

Stagger lanes when active lanes exceed the concurrency budget. Every task rechecks live ownership before writing because scheduler-level mutual exclusion is not guaranteed.

## Handoff minimum

Each run must record exact repository SHA, lane/objective, branch/PR/write set, executed checks/run IDs, retained failures, blocked gates, next task and created successor task ID (or explicit stop/failure).
