# Scheduswarm v2 architecture

## Components

1. **Project repository**
   - owns project-specific `SCHEDUSWARM.md`;
   - owns code, evidence, issues, PRs and authority;
   - has a dedicated `scheduswarm/queue` branch.

2. **Queue branch**
   - contains append-only task/claim/receipt/completion/recovery records under `.scheduswarm/`;
   - does not need to track current product `main`;
   - is not a scientific/release authority.

3. **Worker**
   - receives one task prompt in a new chat;
   - fresh-audits project state;
   - performs bounded work;
   - publishes durable project evidence;
   - writes zero or one same-lane successor task, plus separately admitted parallel tasks only when policy permits.

4. **Chrome dispatcher**
   - polls configured GitHub repositories/queue branches;
   - validates immutable task metadata;
   - enforces pause, `not_before`, active-lane and concurrency limits;
   - acquires an atomic claim before browser work;
   - creates a new ChatGPT chat;
   - verifies model/effort and prompt before optional automatic submission;
   - writes a dispatch receipt.

## Trust boundaries

### Repository truth

Project state, issue/PR ownership, evidence, gates and project-local policy outrank task prompts.

### Task envelope

A task envelope is immutable input. Editing an existing task after claim is forbidden. Corrections create a new task ID and supersede the old one explicitly.

### Dispatcher

The dispatcher may choose **when** to dispatch an admissible task. It may not rewrite its objective, relax project gates, invent evidence, or treat a successful browser action as project completion.

### ChatGPT UI adapter

UI automation is the least stable component. It must fail closed if it cannot verify:
- a new chat;
- requested model;
- requested effort;
- exact prompt content;
- submit action when automatic mode is requested.

## Queue branch versus product main

Routine task transitions do **not** belong on product `main`. Scheduswarm v2 therefore uses a dedicated queue branch, default `scheduswarm/queue`.

This avoids:
- product-history churn;
- merge conflicts with implementation PRs;
- using one mutable state document as a lock;
- requiring a successor task file to wait for an unrelated implementation PR merge.

The queue branch may be created from any repository commit. Its product files are irrelevant; the dispatcher reads only `.scheduswarm/`.

## Append-only state

Task state is derived from records, not a rewritten status field:

```text
task -> claim -> dispatch receipt -> completion -> successor task
          |
          +-> failed receipt -> explicit recovery -> next claim attempt
```

No single `current-state.json` is authoritative.

## Integration ownership

Parallel workers must not race project-wide authority surfaces. Project `SCHEDUSWARM.md` lists serialized files/registries. A worker may prepare an isolated proposal, but cross-lane integration is serialized.

## Security

- GitHub tokens stay in Chrome `storage.local`, never task files.
- Use least-privilege tokens; public repositories may be read without a token.
- Never embed ChatGPT cookies/session data in GitHub.
- Treat repository task content as code-like instructions: only dispatch from explicitly configured owner/repository pairs and allowed queue paths.
- A dispatcher must not follow task-supplied arbitrary URLs for credentials or configuration.
