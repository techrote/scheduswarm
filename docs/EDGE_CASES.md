# Edge cases

## Scheduled-task self-chaining

Retired. The v1 design depended on a scheduled execution being able to create its successor. Live use demonstrated the platform refusal:

> Automation creation is unavailable during an automation run.

Scheduswarm v2 does not use scheduled-task recursion.

## Stale predecessor prompt

Every worker fresh-audits repository state. A task prompt is a checkpoint/objective, not current truth.

## Two tasks select the same work

Issues/PRs/branches plus project queue records are ownership leases. The second worker must replan or stop.

## Shared authority file

Never use a frequently edited `current-state.md` as the lock. Shared registries/protocols are serialized integration surfaces.

## Waiting on CI

Do not generate repeated “check again in an hour” successor tasks. Prefer a task only when there is useful work, a justified condition/check, or another independent objective.

## Empty scheduler capacity

Capacity is not authorization to reopen a paused project.

## Task fan-out

A normal lane publishes zero or one same-lane successor. Extra parallel tasks need the lane-admission test and capacity.

## Claim without dispatch

Requires explicit recovery. Never infer non-submission solely from elapsed time.

## Dispatch without receipt

Treat as ambiguous and do not redispatch automatically.

## UI changed

Fail closed. Automatic mode requires verified model, effort, prompt and submit state. Update the adapter instead of using approximate clicks.

## Wrong model/effort

Do not submit. A near-equivalent model is not an allowed substitution unless the task/project explicitly permits fallback.

## Prompt injection in repository content

Only configured repositories and exact queue paths are dispatchable. Project task content can instruct the worker, but it cannot reconfigure dispatcher credentials, watched repositories, browser permissions, or queue policy.

## Private repositories

Use a least-privilege GitHub token stored locally. Never commit it or copy it into task prompts.

## Multiple dispatchers

Atomic same-path claim creation selects one winner. Do not give dispatchers unique claim paths for the same attempt.

## Cross-project global load

Project concurrency limits are local. Dispatcher configuration should also expose a global maximum concurrent chat launches. Priority never overrides project safety.

## Manual chat creation

A human may manually open a task in a new chat. To prevent the Chrome dispatcher from also launching it, create the corresponding claim/receipt or temporarily pause that project before manual dispatch.

## Model UI unavailable on plan/account

Fail closed and record a failed dispatch. Do not silently downgrade.

## Worker cannot write queue branch

The worker should still publish its durable project handoff and explicitly report that no successor was enqueued. A human/dispatcher can create the next task later.

## PR not merged

A successor may depend on a draft/PR head if the task pins and re-verifies it. It must not assume draft evidence is merged/main authority.

## Green CI with wrong evidence class

Source tests are not physical runtime. Receipt audits are not new experiments. Administrative review is not scientific admission. Project evidence taxonomy always wins.

## Browser extension disabled

Tasks remain durable in Git and can be manually dispatched later.

## Queue branch force push

Treat as an integrity incident. Queue branches should be protected from force-push where practical. Claims/receipts/completions are audit history.
