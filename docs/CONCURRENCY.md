# Concurrency and lane admission

## Two limits

### Maximum active lanes

The maximum number of logical lane chains alive for a project. Scheduled/waiting/claimed tasks still count because they retain ownership and future collision potential.

### Project concurrency budget

The maximum number of lanes intentionally executing at the same time.

Example:

```yaml
max_active_lanes: 3
project_concurrency_budget: 2
```

Three lanes can remain alive; at most two run concurrently.

## Lane admission

A new parallel task may be published only when all are true:

1. **Independent objective** — useful if another lane is delayed or fails.
2. **Dependency-ready** — no imminent prerequisite result from another active lane.
3. **Non-overlapping write set** — no concurrent writes to the same source/evidence/authority surface.
4. **Distinct acceptance criterion** — independently falsifiable/completable.
5. **No gate transfer** — evidence/admission remains model/subsystem/source specific.
6. **Capacity exists** — active-lane limit is not exceeded.
7. **No equivalent owner exists** — fresh issues/PRs/branches/queue audit shows no duplicate.
8. **Integration safe** — shared registries remain serialized.

## Active lane calculation

A lane counts active when its latest task is:
- uncompleted and eligible/pending;
- claimed/dispatched and not completed;
- explicitly waiting with ownership retained.

A completed lane with no successor is inactive.

## Execution concurrency

The Chrome dispatcher derives currently executing tasks from submitted receipts without completions, optionally bounded by a configurable stale-execution horizon. Repository policy is authoritative; if state is ambiguous, fail closed and do not launch another lane.

## Priorities

Recommended priority enum:
1. `critical`
2. `high`
3. `normal`
4. `background`

Priority never overrides dependency/gate/write-set safety.

## Integration lane

An integration lane/role is serialized. It consumes already qualified lane outputs and updates shared authority only after rechecking each dependency. It does not automatically inherit model/scientific/release acceptance from child lanes.
