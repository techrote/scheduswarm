# One-shot Scheduswarm task contract

Use this as the invariant skeleton for a lane-specific scheduled task. Keep the concrete objective short and current.

---

Continue substantive work in **<repo/project>** as Scheduswarm lane **<lane-id / lane-class>**.

Read the project's `SCHEDUSWARM.md` and all project-local authority it references. The repository, not this prompt, is the durable source of operating rules.

Start with a fresh live audit of default-branch HEAD, relevant branches/PRs/issues, current owners/write sets, reviews, exact-head CI/artifacts, retained failures and applicable repository instructions. Reverify predecessor checkpoint **<refs>**; treat it as historical until confirmed.

**Current objective:** <one bounded dependency-ready objective>.

**Acceptance criterion:** <falsifiable result>.

Before writing, confirm this objective is not owned by another active lane and stays within project active-lane/concurrency policy. Reserve a distinct branch/PR/write set. Do not race serialized integration surfaces.

Make substantive repository progress where justified. Preserve project-specific evidence classes, negative results, source/runtime provenance and gated actions. Do not promote source-only checks into physical behavior or administrative review into scientific/release approval.

At completion publish a durable checkpoint with exact SHAs/PRs/run IDs, what actually executed, retained failures, unsatisfied gates and the next highest-value dependency-ready task.

Then:
- create **exactly one** one-shot successor for this lane if useful work remains;
- create a new parallel lane only if the project policy's admission test and capacity allow it;
- otherwise schedule a justified delayed/conditional check or stop;
- stop rather than loop when blocked on human authorization or repeated no-progress.

If a successor is created, include its task ID and exact objective in the checkpoint/final report. Never claim continuity if creation failed.
