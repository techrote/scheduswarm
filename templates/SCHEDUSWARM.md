# SCHEDUSWARM.md — project dispatcher policy

```yaml
scheduswarm_version: 2
status: active
hub: https://github.com/techrote/scheduswarm
queue_branch: scheduswarm/queue
max_active_lanes: 3
project_concurrency_budget: 2
global_dispatch_priority: normal
successors_per_lane: 1
integration_writes_parallel: false
automatic_dispatch_allowed: false
```

## Status

Allowed values:
- `active` — new eligible tasks may dispatch.
- `draining` — no new dispatch; in-flight work may finish.
- `paused` — no new dispatch; lane ownership remains.
- `disabled` — dispatcher ignores this project.

## Authority

List mandatory repository files/issues/decisions that every worker must read. Scheduswarm coordinates execution only and cannot supersede these authorities.

## Queue

The dispatcher watches `scheduswarm/queue:.scheduswarm/tasks/*.md`.

Routine task/claim/receipt/completion records stay off product `main`. Do not use one mutable queue-state file.

## Limits

- **max_active_lanes**: total logical live lane chains, including waiting work.
- **project_concurrency_budget**: maximum intentionally executing lanes.
- **successors_per_lane**: normally one same-lane successor.

## Lane classes

Define allowed lane classes, purpose, typical write sets and whether they may integrate shared authority.

## Serialized surfaces

List project files/registries that parallel lanes may not update concurrently.

## Lane admission

Require:
1. independent objective;
2. dependency readiness;
3. non-overlapping write set;
4. distinct acceptance criterion;
5. no gate/evidence transfer;
6. active-lane capacity;
7. no equivalent owner;
8. serialized integration safety.

## Worker termination contract

At the end of every dispatched task:

1. publish durable project evidence/handoff;
2. write `.scheduswarm/completions/<task_id>.json` on the queue branch;
3. if useful same-lane work remains, write exactly one new task envelope under `.scheduswarm/tasks/`;
4. create additional parallel tasks only if lane admission and capacity permit;
5. otherwise record an explicit stop reason.

Workers do **not** create scheduled tasks as successors.

## Safety gates

Record project-specific scientific/security/release/manual/training/evidence gates that cannot be bypassed.

## Dispatcher policy

Recommended commissioning state:

```yaml
automatic_dispatch_allowed: false
```

Use confirmation mode until the Chrome adapter reliably verifies new-chat state, model, effort and exact prompt insertion. Automatic mode requires both project permission and task request.

## Live ownership

Use issues/PRs/branches plus immutable queue records. Do not race a shared mutable current-state document.
