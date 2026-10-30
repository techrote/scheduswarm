# Task lifecycle

## Queue layout

Normative queue branch layout:

```text
.scheduswarm/
  tasks/
    <task_id>.md
  claims/
    <task_id>.<attempt>.json
  receipts/
    <task_id>.<attempt>.json
  completions/
    <task_id>.json
  recoveries/
    <task_id>.<attempt>.json
```

Task files are immutable Markdown envelopes with JSON frontmatter followed by the prompt body.

## 1. Publish task

The predecessor creates `tasks/<task_id>.md`.

A normal lane may publish **at most one same-lane successor**. Additional parallel tasks require the project lane-admission test and free active-lane capacity.

The task must include:
- globally unique task ID within that repository;
- repository and lane;
- parent task when applicable;
- creation time and optional `not_before`;
- priority;
- requested ChatGPT model/effort;
- dispatch mode;
- coordination references.

## 2. Discover

Dispatcher polls only configured repository + queue branch + `.scheduswarm/tasks/`.

A task is eligible only if:
- metadata validates;
- repository/project matches dispatcher configuration;
- project is `active`, not `paused`, `draining`, or `disabled`;
- `not_before` has passed;
- no completion exists;
- no successful dispatch receipt exists for the current attempt;
- concurrency/lane policy admits launch.

## 3. Atomic claim

For attempt N, all dispatchers compete to create exactly:

```text
claims/<task_id>.<N>.json
```

Creation uses GitHub's create-file operation. Existing-file failure means another dispatcher won. A dispatcher must not proceed without a successful claim.

Attempt number is deterministic:
- first attempt = 1;
- after an explicit recovery of attempt N, next attempt = N+1.

## 4. Dispatch

After claim:
1. open a **new** ChatGPT chat;
2. wait for composer readiness;
3. select and verify requested model;
4. select and verify effort;
5. insert and verify the exact prompt body;
6. in `confirm` mode, wait for the user;
7. in `automatic` mode, submit only after all verification passes.

## 5. Receipt

After submitted or failed dispatch, write one immutable receipt:

```text
receipts/<task_id>.<attempt>.json
```

A submitted receipt records chat URL and verified model/effort/prompt state. A failed receipt records failure stage and error.

Browser submission is **not project completion**.

## 6. Worker completion

The agent writes `completions/<task_id>.json` after project work and durable handoff are complete.

Completion records:
- outcome;
- authoritative project refs;
- executed versus inferred evidence;
- retained failures/gates;
- successor task ID/path, or explicit stop reason.

## 7. Successor

A successor is a new immutable task envelope. It must fresh-audit state when run and must not assume the predecessor checkpoint remains current.

## Supersession

Never edit a claimed task to correct it. Publish a new task with:
- new `task_id`;
- `supersedes_task_id`;
- reason in body/completion.

The dispatcher refuses superseded unclaimed tasks when the newer task is visible.

## Stop conditions

Write no successor when:
- project/lane is complete;
- human/scientific/security/release authorization is required;
- equivalent live ownership exists;
- repeated execution made no substantive progress;
- only polling remains;
- project is paused/draining.
