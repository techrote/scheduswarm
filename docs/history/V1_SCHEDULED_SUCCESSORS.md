# Historical v1 scheduled-successor design

## Status

**Retired 30 October 2026.**

The exact final v1 repository state is preserved on:

`history/v1-scheduled-successors`

at commit:

`e69e33f2e0107e37299e17a6587c9dcf5cf0a71d`

## Original concept

v1 replaced fixed hourly loops with one-shot scheduled tasks. Each scheduled worker was expected to:
1. fresh-audit project state;
2. execute one bounded objective;
3. create exactly one scheduled successor;
4. optionally admit independent parallel lanes.

The lane/concurrency distinction and repository coordination principles were useful and remain in v2.

## Why v1 was retired

Actual radiCADSAC proof/readiness scheduled executions reached the intended handoff stage and attempted to create their successors. The scheduling platform refused task creation from within an automation execution with:

> Automation creation is unavailable during an automation run.

That makes autonomous scheduled-task self-chaining unavailable under the tested product behavior.

## Preserved lessons

v2 retains:
- state-driven rather than hourly work;
- fresh live audits;
- bounded lane ownership;
- maximum active lanes versus concurrency budget;
- serialized integration surfaces;
- explicit stop conditions;
- durable repository handoffs;
- no evidence/gate promotion.

v2 replaces the successor mechanism with immutable repository task envelopes and a browser dispatcher that opens new chats.

## Non-regression rule

Do not reintroduce scheduled-task recursion as the normative Scheduswarm successor mechanism unless the platform later provides a documented, tested capability and the architecture is deliberately revised.
