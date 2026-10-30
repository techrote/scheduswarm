# Scheduswarm v2 adoption registry

This registry links the reusable v2 repository-queue/dispatcher protocol to project-local policy. The project-local `SCHEDUSWARM.md` is authoritative for limits and safety gates.

| Project | Project policy | Coordination ledger | Queue branch | Initial state |
|---|---|---|---|---|
| Neurounner | [adoption PR #214](https://github.com/techrote/neurounner/pull/214) | [issue #213](https://github.com/techrote/neurounner/issues/213) | `scheduswarm/queue` | active / pilot |
| radiCADSAC | [adoption PR #325](https://github.com/techrote/radiCADSAC/pull/325) | [issue #324](https://github.com/techrote/radiCADSAC/issues/324) | `scheduswarm/queue` | active / migrate to v2 queue |
| CyberSand | [adoption PR #306](https://github.com/techrote/cybersand/pull/306) | [issue #305](https://github.com/techrote/cybersand/issues/305) | `scheduswarm/queue` | configured-paused |

## Activation rule

Presence in this table is not activation. Project-local status controls whether the Chrome dispatcher may launch new tasks.

## Queue provisioning

Each participating repository should have a dedicated `scheduswarm/queue` branch with a `.scheduswarm/` directory. Routine task/claim/receipt/completion records are written there, not to product `main`.

## Migration from v1

Any project policy still instructing workers to create scheduled-task successors is stale and must be updated before v2 automatic dispatch. v1 history remains available in this repository's history branch and history document.
