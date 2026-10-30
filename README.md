# Scheduswarm v2

Scheduswarm is a repository-backed dispatcher protocol for launching bounded agent work in **new ChatGPT chats** without relying on scheduled tasks to create scheduled successors.

The original scheduled-successor design is retired. Its exact final state is preserved on branch [`history/v1-scheduled-successors`](https://github.com/techrote/scheduswarm/tree/history/v1-scheduled-successors) and summarized in [v1 history](docs/history/V1_SCHEDULED_SUCCESSORS.md).

## Core idea

A worker finishes by publishing a **next-prompt task envelope** to a dedicated repository queue branch:

```text
scheduswarm/queue
└── .scheduswarm/
    ├── tasks/          immutable Markdown task envelopes
    ├── claims/         atomic dispatcher claims
    ├── receipts/       dispatch outcome receipts
    ├── completions/    agent completion/handoff records
    └── recoveries/     explicit stale-claim recovery records
```

A Chrome dispatcher watches the queue branch, validates the project policy and task envelope, acquires a repository-visible claim, opens a new ChatGPT chat, verifies the requested model/effort, inserts the prompt, and submits it. The next worker reads live repository state and eventually writes its own successor envelope.

**The repository is the durable queue and coordination authority. The browser extension is only a dispatcher.**

## Normative documents

- [Architecture](docs/ARCHITECTURE.md)
- [Task lifecycle](docs/TASK_LIFECYCLE.md)
- [Dispatcher protocol](docs/DISPATCHER_PROTOCOL.md)
- [Concurrency and lane admission](docs/CONCURRENCY.md)
- [Failure recovery](docs/FAILURE_RECOVERY.md)
- [Edge cases](docs/EDGE_CASES.md)
- [Project policy template](templates/SCHEDUSWARM.md)
- [Task envelope template](templates/task.md)
- [Schemas](schemas/)
- [Chrome dispatcher](dispatcher/chrome-extension/README.md)
- [Project adoption registry](PROJECTS.md)

## Default limits

```yaml
max_active_lanes: 3
project_concurrency_budget: 2
successors_per_lane: 1
integration_writes_parallel: false
queue_branch: scheduswarm/queue
```

**Maximum active lanes** limits how many logical workstreams/chains may remain alive, including waiting work. **Project concurrency budget** limits how many may intentionally execute at once.

## Non-authority

Scheduswarm cannot override project-local scientific, security, release, merge, training, evidence, manual-qualification, or ownership gates. A generated successor prompt is a proposal for the next worker, not authorization to cross a gated boundary.

## v2 status

The repository protocol and Chrome dispatcher are intentionally fail-closed. Automatic submission is supported only when the UI adapter can verify the requested model, effort, prompt insertion, and new-chat state. Otherwise it refuses or leaves a confirmation-mode draft.
