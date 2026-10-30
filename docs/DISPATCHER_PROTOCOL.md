# Dispatcher protocol

## Responsibilities

The dispatcher is a deterministic transport layer. It may:
- discover eligible tasks;
- enforce queue/project policy;
- acquire a claim;
- open a new ChatGPT chat;
- configure model/effort;
- insert/submit the prompt;
- write a dispatch receipt.

It may **not** reinterpret the task objective, bypass repository gates, mark project work complete, or manufacture a successor.

## Poll cycle

For each configured repository:

1. Read project `SCHEDUSWARM.md` from the configured policy ref (normally product `main`).
2. Stop if status is `paused`, `draining`, or `disabled` as defined below.
3. Read task/claim/receipt/completion/recovery paths from `scheduswarm/queue`.
4. Parse and schema-check task envelopes.
5. Derive active lanes/executions.
6. Filter by `not_before`, supersession, ownership, capacity and recovery state.
7. Sort by priority then creation time.
8. Attempt one atomic claim per available concurrency slot.
9. Dispatch only successfully claimed tasks.

## Project status

- `active`: eligible new tasks may dispatch.
- `draining`: no new task is dispatched; already submitted work may finish and write completions.
- `paused`: no new task is dispatched; ownership remains intact.
- `disabled`: dispatcher ignores the project until explicitly reconfigured.

## GitHub access

Use GitHub REST API, not GitHub page scraping.

Recommended endpoints:
- repository contents API for exact queue files;
- git/tree API when efficient for queue enumeration;
- create-file contents API for atomic claim/receipt creation.

An optional token is required for private repositories. Keep it in Chrome `storage.local`. Request the minimum repository permissions needed.

## Task parsing

Task Markdown uses dependency-free **JSON frontmatter**:

```markdown
---
{
  "schema": "scheduswarm/task-v2",
  "task_id": "rad-proof-20261030-008",
  ...
}
---
Prompt text...
```

The dispatcher validates the parsed JSON against the task schema and treats the remaining Markdown body as the exact prompt.

## Claim algorithm

For task T:

1. Determine last completed/recovered attempt.
2. Compute next attempt N.
3. Construct `claims/T.N.json`.
4. Try GitHub create-file.
5. If already exists, another dispatcher won; abandon this task for the cycle.
6. If creation succeeds, store returned commit/blob refs and proceed.

Do not dispatch first and claim later.

## Browser state machine

Normative adapter states:

```text
OPEN_NEW_CHAT
WAIT_CHAT_READY
SELECT_MODEL
VERIFY_MODEL
SELECT_EFFORT
VERIFY_EFFORT
INSERT_PROMPT
VERIFY_PROMPT
CONFIRM_OR_SUBMIT
VERIFY_SUBMITTED
WRITE_RECEIPT
```

Any unverifiable state fails closed.

## Confirm mode

`dispatch_mode=confirm`:
- open a new chat;
- configure and verify model/effort;
- insert exact prompt;
- do **not** press submit;
- surface a clear local notification for user review.

No submitted receipt is written until the user submits and the adapter verifies submission. A failed/abandoned preparation may be recorded locally; repository recovery rules apply if the claim must be retried.

## Automatic mode

`dispatch_mode=automatic` is allowed only when:
- project policy permits it;
- task requests it;
- model and effort can be verified;
- prompt byte/text equality can be verified;
- new-chat state is verified.

Then submit and write a receipt.

## Model and effort labels

Task fields are user-visible ChatGPT labels, not API model IDs. The dispatcher maintains a local adapter mapping/configuration because UI labels and controls may change.

If the requested label cannot be verified, fail closed. Never silently substitute another model or effort.

## Dispatch receipt

A `submitted` receipt records:
- task/attempt;
- dispatcher ID/version;
- claim reference;
- chat URL;
- requested and verified model;
- requested and verified effort;
- prompt SHA-256;
- submission timestamp;
- adapter version.

A `failed` receipt records failure stage and error without claiming project work ran.

## Polling interval

30–60 seconds is normally sufficient. Scheduswarm is state-driven, not latency-sensitive.

## Hard boundary

A successful dispatch receipt proves only that a prompt was submitted in the configured chat context. It does not prove:
- the model completed;
- repository writes occurred;
- CI passed;
- scientific/release gates passed;
- a successor was created.
