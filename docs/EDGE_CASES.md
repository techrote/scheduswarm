# Scheduswarm edge cases and failure modes

## Stale predecessor state

A successor must never trust its predecessor's SHA/PR/CI state without rechecking it. If the branch moved, review changed, or another owner merged equivalent work, replan rather than force the old objective.

## Two tasks choose the same work

Treat branches/PRs/issues and project-local coordination records as leases. If an equivalent active owner exists:

- do not open a duplicate branch/PR;
- choose a genuinely independent objective;
- or stop and record the collision.

## Shared-file race

Do not let multiple lanes concurrently edit authoritative registries, protocol files, release manifests or project-wide status ledgers. Use a serialized integration owner. A lane may prepare a patch in its own branch but should not race another integration write.

## Waiting on CI is not an active objective

A lane waiting only for CI/review should not spend hourly executions rediscovering the same pending state. Prefer a later one-shot check, a condition watch if available, or stop until manually restarted.

## ChatGPT task execution cannot create a new automation (observed 30 Oct 2026)

**Verified production limitation:** during the first scheduled RAD-PROOF Scheduswarm execution, the connected Automations `create` action returned exactly `Automation creation is unavailable during an automation run.` The task had finished and merged independent proof-critical research, but **could not create its next one-shot successor**. This is a hard continuation blocker for this scheduling surface, not a lack of dependency-ready project work.

Do not use language implying autonomous one-shot *self*-handoff is operational until creation from within a scheduled task is independently verified. Existing one-shot tasks may run and publish repository checkpoints but **will stop after that execution**. Manual creation from a regular user chat or a separately authorized supported coordinator would be necessary to continue; that is not equivalent to automatic self-scheduling.

Required behavior on this failure:
- keep and publish the exact checkpoint (commits, PR, CI, proof gates, next bounded task);
- record the failed successor-creation attempt verbatim in the project coordination issue;
- leave the project lane in `stopped-awaiting-scheduling-capability`, not `scheduled`;
- notify the user of this limitation; never invent a successor ID, recurrence or success;
- do not bypass the platform restriction with a recursive notification or an unrelated tool.

**Proof of occurrence:** radiCADSAC [MC-038 issue #100](https://github.com/techrote/radiCADSAC/issues/100) / [Scheduswarm ledger #324](https://github.com/techrote/radiCADSAC/issues/324), source-qualified [PR #326](https://github.com/techrote/radiCADSAC/pull/326) merged on 30 October 2026.

The generic architectural model remains reusable for a coordinator capable of scheduling successors, but must not be advertised as operational on this task runner until the host restriction changes.

## Automation creation fails

A task must report that continuity was **not established**. Never claim a successor exists unless task creation returned success and an ID.

## Automation capacity exhausted

Do not disable unrelated user automations to make room. Stop, report the capacity problem and leave the repository checkpoint sufficient for manual restart.

## Successor creates too many lanes

A normal lane may create **one successor for itself**. New parallel lanes require the project lane-admission test and capacity. A task must not recursively fan out merely because work exists.

## Paused project

Available scheduler capacity does not authorize reopening a deliberately paused project. A project-local policy may exist in a repo without any active scheduled lane.

## Long-running task overlaps successor

Do not intentionally schedule a successor so soon that its predecessor is likely still modifying the same work. The successor must also check branch/PR activity before writing.

## Concurrency is advisory at the scheduler level

The repository policy defines permitted concurrency, but there may be no hard distributed lock across task conversations. Collision avoidance therefore depends on fresh GitHub audit, distinct branches/write sets and serialized integration surfaces.

## CI green but wrong evidence class

Source tests, archive audits and receipt checks do not become physical runtime tests. Physical runtime tests do not become learned-quality evidence. Administrative review does not become scientific admission. Preserve the project's evidence taxonomy.

## Negative result

A decisive falsification or retained failure can be substantive progress. A successor should consume it and choose a different route rather than repeat the disproved approach.

## Human gate

When progress requires explicit owner/scientific/security/release/training authorization, stop the successor chain at that boundary. Do not make the next task “ask again every hour”.

## Merge ordering

Parallel PRs that were independently valid can still conflict semantically. The integration owner must re-evaluate after each merge and rerun applicable merged-main checks.

## One lane becomes critical

If a previously independent lane becomes a prerequisite for others, reduce effective concurrency and serialize the dependent work until the gate resolves.

## Emergency throttling

A project may temporarily lower its concurrency budget without deleting lanes. Existing waiting lanes remain active but should not schedule execution until capacity returns.

## Manual work appears

A human-created PR/branch that overlaps a lane takes precedence unless project policy says otherwise. The scheduled lane should treat it as a competing owner and avoid racing it.

## Evidence custody

Ephemeral Actions artifacts alone are insufficient when a project requires permanent custody. A successor must distinguish “workflow succeeded” from “original evidence permanently archived and independently verified”.

## Retrying failures

Retry only when the failure is plausibly infrastructural or after a concrete source correction. Preserve the failed run. Do not convert repeated retries into evidence of acceptance.

## Cross-project resource pressure

Per-project concurrency budgets do not automatically enforce a global account budget. If several projects are active, stagger launches and prefer critical-path projects. A future global policy may add an account-wide cap.


## Separate-chat isolation

Scheduswarm's primary isolation mechanism is repository ownership (distinct lanes, branches, PRs and write sets), not an assumption that every scheduler API can force a different ChatGPT conversation root.

If the scheduling surface exposes no destination-chat parameter, multiple automations created from one chat may remain associated with the same parent conversation even though they are independent scheduled jobs. Do not falsely claim chat-level isolation.

When **separate visible chat roots are a hard requirement**, create each lane's automation from its intended chat (or another product surface that explicitly supports a destination thread). The repository coordination rules still apply either way.
