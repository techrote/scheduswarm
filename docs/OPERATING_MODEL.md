# Scheduswarm operating model

## Purpose

Scheduswarm coordinates multiple bounded one-shot task chains around a repository without turning them into an uncontrolled swarm of duplicate agents. It is designed for projects where:

- priorities change as CI, review and evidence arrive;
- some work is truly parallel;
- some work must remain serialized;
- scheduled tasks can create successor tasks;
- repository state is the durable coordination surface.

## Terms

### Lane

A lane is one logical workstream with a bounded owner scope, branch/PR/evidence set and successor chain.

A lane can be:

- **running** — its one-shot task is executing;
- **scheduled** — its next one-shot exists but has not started;
- **waiting** — it is blocked on CI/review/external evidence and should not repeatedly execute;
- **handoff-ready** — its current bounded objective is complete and a successor may select another objective;
- **stopped** — no successor exists.

### Maximum active lanes

The maximum number of logical lane chains that may remain alive for a project.

This is a **coordination-complexity limit**. Waiting/scheduled lanes still count because they still own scope and can collide with newly created work.

### Project concurrency budget

The maximum number of project lanes intentionally allowed to execute or be launched into the same coordination window.

This is a **simultaneous execution/race/resource limit**.

The concurrency budget should normally be less than or equal to the active-lane limit.

Example:

```yaml
max_active_lanes: 3
project_concurrency_budget: 2
```

Three lanes may exist, but only two should run concurrently. Lane C can be scheduled after A or B, or held waiting.

### Integration owner

A serialized role responsible for shared registries, protocol/roadmap integration, merge-order decisions and other cross-lane write hotspots. It is not automatically a separate permanent lane; a project may reserve it as a role assumed only when required.

## Lane admission test

Open a parallel lane only if all are true:

1. **Independent objective** — useful even if another active lane takes longer or fails.
2. **Dependency-ready** — no imminent prerequisite from another active lane is required.
3. **Non-overlapping write set** — branches/files/PRs/evidence do not require concurrent edits to the same authoritative surfaces.
4. **Distinct acceptance criterion** — success/failure can be judged without borrowing another lane's result.
5. **No gate transfer** — scientific/release/security/manual gates remain lane- and source-specific.
6. **Capacity available** — project active-lane and concurrency limits permit it.
7. **No equivalent owner exists** — fresh audit shows no task/PR/branch already doing the same work.

“Could be done in parallel” is insufficient. It must be safe and useful to do so.

## One-shot lifecycle

Every lane execution should:

1. **Fresh-audit**
   - authoritative default branch/head;
   - project-local instructions;
   - target issues;
   - active PRs/branches and likely owners;
   - exact-head CI/reviews/artifacts;
   - retained failures and negative evidence;
   - current Scheduswarm project policy.

2. **Reconcile predecessor handoff**
   - treat it as a checkpoint, not truth;
   - verify every material SHA/run/status before relying on it.

3. **Reserve a bounded objective**
   - named issue or acceptance criterion;
   - intended branch/PR;
   - file-level or subsystem-level write set;
   - dependencies and explicit non-goals.

4. **Execute**
   - make substantive implementation/research/qualification progress;
   - preserve repository-specific safety gates;
   - retain failures and negative evidence.

5. **Qualify**
   - run source/runtime/evidence checks actually applicable to the work;
   - do not upgrade source-only evidence into physical behavior;
   - do not upgrade green CI into scientific/release acceptance.

6. **Publish durable checkpoint**
   - exact commits/PRs/run IDs;
   - what was executed versus inferred;
   - failures retained;
   - gates still unsatisfied;
   - next highest-value dependency-ready objective.

7. **Choose continuation**
   - **successor**: create exactly one one-shot successor for this lane;
   - **wait**: schedule a justified delayed/conditional check only when a real external event is pending;
   - **reassign**: if the lane's objective is complete, choose another independent objective only if policy allows;
   - **stop**: when blocked on human authorization, project complete, duplicate owner exists, or repeated work is non-substantive.

## Successor prompt rule

A successor prompt should be small and current. It should contain:

- repository/project;
- lane ID/class;
- exact predecessor checkpoint references;
- one current objective and acceptance criterion;
- project-local authority references;
- collision/write-set rules;
- explicit gates that remain closed;
- instruction to perform a fresh audit and disregard stale checkpoint details.

Do **not** copy a giant historical prompt forward unless it is itself the authoritative protocol. Link/reference versioned repository instructions instead.

## Parallel scheduling

A project with `max_active_lanes=3` and `project_concurrency_budget=2` may use, for example:

- Lane A at T+1h;
- Lane B at T+1h;
- Lane C at T+2h.

This is an admission/scheduling policy, not a guarantee that the automation platform provides hard process-level mutual exclusion. Every task must recheck live ownership at execution time.

## Serialized surfaces

Projects should identify shared hotspots that only the integration owner may update while multiple lanes are active, such as:

- current-authority files;
- programme/protocol registries;
- release manifests;
- global roadmaps/status ledgers;
- shared frozen evidence indexes;
- project-wide dependency graphs.

Parallel lanes may prepare proposed changes, but integration is serialized.

## Progress rule

A lane should not create an effectively identical successor merely because time elapsed.

A successor is justified when at least one is true:

- substantive code/evidence/review state changed;
- a new dependency-ready objective is selected;
- a pending external result now has a justified future check;
- the lane can perform a different safe task while blocked.

Repeated “still waiting” runs should stop or switch to a conditional/delayed check.

## Default limits

Recommended initial defaults:

```yaml
max_active_lanes: 3
project_concurrency_budget: 2
successors_per_lane: 1
integration_writes_parallel: false
```

Increase limits only after the project demonstrates clean non-overlapping work and reliable handoffs. Decrease them when collision/review burden exceeds useful throughput.
