---
{
  "schema": "scheduswarm/task-v2",
  "task_id": "example-project-lane-001",
  "project": "example-project",
  "repository": "owner/repository",
  "lane": "EXAMPLE-LANE",
  "parent_task_id": null,
  "supersedes_task_id": null,
  "created_at": "2026-10-30T16:00:00Z",
  "not_before": null,
  "priority": "normal",
  "queue_branch": "scheduswarm/queue",
  "chatgpt": {
    "model_label": "GPT-5.6 Sol",
    "effort_label": "High",
    "dispatch_mode": "confirm",
    "require_new_chat": true
  },
  "coordination": {
    "policy_path": "SCHEDUSWARM.md",
    "ledger_issue": null,
    "max_successors": 1
  }
}
---

Operate this repository as Scheduswarm lane **EXAMPLE-LANE**.

Start with a fresh live audit of repository authority, current default-branch HEAD, relevant branches/PRs/issues, active owners, exact-head CI/evidence, and project `SCHEDUSWARM.md`. Treat predecessor details as historical until verified.

## Current objective

Replace this section with one bounded dependency-ready objective.

## Acceptance criterion

State a falsifiable/completable criterion.

## Ownership and safety

Before substantive writes, verify no equivalent owner exists and reserve a distinct branch/PR/write set. Do not modify serialized integration surfaces concurrently or cross project-specific gates.

## Completion

Publish exact project evidence and then write `.scheduswarm/completions/<task_id>.json` on `scheduswarm/queue`.

If substantive same-lane work remains, write exactly one successor task envelope. If blocked, complete, waiting on human authorization, or repeatedly making no progress, write no successor and record the stop reason.
