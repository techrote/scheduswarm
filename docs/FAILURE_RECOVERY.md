# Failure recovery

## Principle

Recovery is explicit and append-only. Never erase a failed dispatch to make a task look unclaimed.

## Failure classes

### Before claim

No repository state changed. The dispatcher may retry discovery later.

### After claim, before submit

Write a failed receipt if possible. The claim remains evidence that an attempt existed.

A later retry requires an explicit recovery record:

```text
recoveries/<task_id>.<attempt>.json
```

Only then may attempt N+1 be claimed.

### After submit, before receipt

This is the dangerous ambiguity: the chat may already be running.

Default action: **do not automatically redispatch**.

Operator/agent must inspect ChatGPT/browser state and write an explicit recovery record declaring one of:
- `submission_confirmed`: reconstruct/write the missing submitted receipt;
- `submission_not_observed`: authorize next attempt;
- `abandon`: stop task.

### Browser crash

Repository claim persists. Restarting the extension must not blindly dispatch the same task again.

### GitHub write failure after confirmed submit

Retain local pending receipt in extension storage and retry the receipt write. Do not reopen the chat or submit again.

## Recovery record

A recovery must reference:
- task ID;
- failed/ambiguous attempt;
- prior claim/receipt refs;
- recovery action;
- actor/dispatcher;
- timestamp;
- rationale/evidence.

Recovery changes queue eligibility; it does not rewrite history.

## Stale claims

Time alone does not prove a task was not submitted. Therefore Scheduswarm v2 has **no automatic lease expiry redispatch** by default.

A project may define a stale-claim observation threshold for alerts, but redispatch still requires an explicit recovery record.

## Duplicate ChatGPT submission

If duplicate submission is discovered:
- record it as an incident;
- do not let both workers write overlapping branches;
- retain one owner according to project policy;
- stop the duplicate worker if possible;
- preserve both chat/dispatch receipts.

## Queue branch conflict

GitHub create-file conflicts are normal concurrency control. Refresh queue state and re-evaluate; never force-update the queue branch to win a claim.

## Task correction

Do not edit a claimed task. Create a new task with `supersedes_task_id`, and complete/abandon the old task with explicit reason.

## Dispatcher upgrade

Before an extension version starts automatic mode:
- existing claims/receipts remain valid;
- adapter version is recorded in new receipts;
- schema migrations must be backward-readable or explicitly version-gated.

## Project pause during execution

`paused` blocks new dispatch but does not automatically terminate an already submitted worker. `draining` is preferred when allowing in-flight work to finish intentionally.

## Human authorization boundary

If the worker stops for a human gate, completion must record that stop and **must not publish a successor that simply asks again later** unless the user explicitly requests monitoring.
