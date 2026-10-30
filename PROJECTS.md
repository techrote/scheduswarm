# Scheduswarm adoption registry

This registry links reusable Scheduswarm technique to project-local policy. The project-local file is authoritative for its limits and safety gates.

| Project | Project policy | Coordination ledger | Initial state | Default limits |
|---|---|---|---|---|
| Neurounner | [adoption PR #214](https://github.com/techrote/neurounner/pull/214) | [issue #213](https://github.com/techrote/neurounner/issues/213) | active / pilot | 3 active lanes, concurrency 2 |
| radiCADSAC | [adoption PR #325](https://github.com/techrote/radiCADSAC/pull/325) | [issue #324](https://github.com/techrote/radiCADSAC/issues/324) | active / migrating hourly loops | 3 active lanes, concurrency 2 |
| CyberSand | [adoption PR #306](https://github.com/techrote/cybersand/pull/306) | [issue #305](https://github.com/techrote/cybersand/issues/305) | configured-paused | 3 active lanes, concurrency 2 |

## Adoption rule

A project is not active merely because it appears here. Its local `SCHEDUSWARM.md` status and explicit owner/project state control activation.

When an adoption PR is merged, update the policy link to the main-branch file. Until then, scheduled pilot tasks must read the exact adoption PR/head and treat it as the requested policy checkpoint rather than assuming it is on main.

## Why limits are two-dimensional

`max_active_lanes` controls how many independent successor chains the project can coordinate. `project_concurrency_budget` controls how many of those chains may execute/be intentionally launched at once.

A 3/2 project can keep three useful workstreams alive while reducing simultaneous branch, CI and integration pressure.
