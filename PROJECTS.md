# Scheduswarm v2 adoption registry

Project-local `SCHEDUSWARM.md` is authoritative for activation, limits and gates.

| Project | Project policy | Coordination ledger | Queue branch | State |
|---|---|---|---|---|
| Neurounner | [main/SCHEDUSWARM.md](https://github.com/techrote/neurounner/blob/main/SCHEDUSWARM.md) | [#213](https://github.com/techrote/neurounner/issues/213) | [`scheduswarm/queue`](https://github.com/techrote/neurounner/tree/scheduswarm/queue/.scheduswarm) | v2 active, confirm-mode commissioning |
| radiCADSAC | [v2 adoption PR #328](https://github.com/techrote/radiCADSAC/pull/328) | [#324](https://github.com/techrote/radiCADSAC/issues/324) | [`scheduswarm/queue`](https://github.com/techrote/radiCADSAC/tree/scheduswarm/queue/.scheduswarm) | v2 policy pending merge |
| CyberSand | [main/SCHEDUSWARM.md](https://github.com/techrote/cybersand/blob/main/SCHEDUSWARM.md) | [#305](https://github.com/techrote/cybersand/issues/305) | [`scheduswarm/queue`](https://github.com/techrote/cybersand/tree/scheduswarm/queue/.scheduswarm) | v2 paused |

## Activation rule

Presence here, a queue branch, or free dispatcher capacity is not activation. Project-local `status` controls dispatch.

## Queue rule

Routine task/claim/receipt/completion/recovery records live on the dedicated `scheduswarm/queue` branch under `.scheduswarm/`, not product `main`.

## Migration rule

Any policy instructing workers to create scheduled-task successors is v1/stale. v1 is preserved only on the hub history branch and historical document.
